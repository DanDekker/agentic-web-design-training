import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ValidationError } from "./store.js";

function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

function sha256Base64Url(str) {
  return createHash("sha256")
    .update(str)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export class OAuthServer {
  #file;
  #clients = [];
  #codes = new Map(); // code -> { clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod, expiresAt }
  #tokens = new Map(); // token -> { token, refreshToken, clientId, userId, scope, expiresAt }
  #refreshTokens = new Map(); // refreshToken -> token
  #queue = Promise.resolve();

  constructor(file) {
    this.#file = file;
  }

  async load() {
    try {
      const raw = await readFile(this.#file, "utf8");
      const parsed = JSON.parse(raw);
      this.#clients = Array.isArray(parsed?.clients) ? parsed.clients : [];
    } catch {
      this.#clients = [];
    }
    if (this.#clients.length === 0) {
      this.#seedDefaultClients();
      await this.#persist();
    }
    return this;
  }

  #seedDefaultClients() {
    this.#clients = [
      {
        id: "cli_weaver_agent",
        clientId: "weaver-agent-runner",
        clientSecret: "weaver-agent-secret-2026",
        name: "Weaver 1M Desktop Agent Runner",
        description: "Official desktop agent execution harness for the Weaver curriculum tasks.",
        redirectUris: [
          "http://localhost:3000/oauth/callback",
          "http://localhost:3311/oauth/callback",
          "http://127.0.0.1:3000/oauth/callback",
          "https://oauth.pstmn.io/v1/callback",
        ],
        allowedScopes: ["read:tasks", "write:tasks", "read:user", "tasks:refactor", "offline_access"],
        isFirstParty: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cli_desktop_curriculum",
        clientId: "desktop-curriculum-suite",
        clientSecret: "desktop-eval-secret-99",
        name: "Desktop Curriculum Evaluator",
        description: "Automated test runner and verifier for agentic code refactoring benchmarks.",
        redirectUris: [
          "http://localhost:3000/oauth/callback",
          "http://localhost:3311/oauth/callback",
        ],
        allowedScopes: ["read:tasks", "tasks:refactor"],
        isFirstParty: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async #persist() {
    const payload = JSON.stringify({ version: 1, clients: this.#clients }, null, 2);
    const run = this.#queue.catch(() => {}).then(async () => {
      await mkdir(dirname(this.#file), { recursive: true });
      const tmp = `${this.#file}.${process.pid}.tmp`;
      await writeFile(tmp, payload, "utf8");
      await rename(tmp, this.#file);
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  listClients() {
    return this.#clients.map(({ clientSecret, ...rest }) => ({ ...rest }));
  }

  getClient(clientId) {
    const client = this.#clients.find((c) => c.clientId === clientId);
    return client ? { ...client } : null;
  }

  async registerClient({ name, description = "", redirectUris = [], allowedScopes = ["read:tasks", "write:tasks"] }) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new ValidationError("Client app needs a name.");
    const clientId = `loom_${randomToken(8)}`;
    const clientSecret = `sec_${randomToken(24)}`;

    const client = {
      id: `cli_${randomToken(6)}`,
      clientId,
      clientSecret,
      name: cleanName,
      description: String(description || "").trim(),
      redirectUris: Array.isArray(redirectUris) && redirectUris.length ? redirectUris : ["http://localhost:3000/oauth/callback"],
      allowedScopes,
      isFirstParty: false,
      createdAt: new Date().toISOString(),
    };

    this.#clients.push(client);
    await this.#persist();
    return { ...client };
  }

  createAuthorizationCode({ clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod = "S256" }) {
    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Unknown client_id.");

    const code = `authcode_${randomToken(20)}`;
    const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes

    this.#codes.set(code, {
      code,
      clientId,
      userId,
      redirectUri,
      scope: scope || "read:tasks",
      codeChallenge,
      codeChallengeMethod,
      expiresAt,
    });

    return code;
  }

  exchangeCodeForToken({ code, clientId, clientSecret, redirectUri, codeVerifier }) {
    const record = this.#codes.get(code);
    if (!record) throw new ValidationError("Invalid or expired authorization code.");
    if (Date.now() > record.expiresAt) {
      this.#codes.delete(code);
      throw new ValidationError("Authorization code has expired.");
    }
    if (record.clientId !== clientId) {
      throw new ValidationError("client_id does not match authorization code.");
    }
    if (record.redirectUri && redirectUri && record.redirectUri !== redirectUri) {
      throw new ValidationError("redirect_uri does not match.");
    }

    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Invalid client.");

    // PKCE verification if challenge was supplied
    if (record.codeChallenge) {
      if (!codeVerifier) throw new ValidationError("code_verifier is required for PKCE.");
      let calculated;
      if (record.codeChallengeMethod === "plain") {
        calculated = codeVerifier;
      } else {
        calculated = sha256Base64Url(codeVerifier);
      }
      if (calculated !== record.codeChallenge) {
        throw new ValidationError("Invalid code_verifier (PKCE verification failed).");
      }
    } else if (clientSecret && client.clientSecret !== clientSecret) {
      throw new ValidationError("Invalid client_secret.");
    }

    // Code is single use
    this.#codes.delete(code);

    const accessToken = `lat_${randomToken(32)}`;
    const refreshToken = `lrf_${randomToken(32)}`;
    const expiresIn = 3600 * 24; // 24 hours
    const tokenRecord = {
      token: accessToken,
      refreshToken,
      clientId,
      userId: record.userId,
      scope: record.scope,
      expiresAt: Date.now() + expiresIn * 1000,
      createdAt: new Date().toISOString(),
    };

    this.#tokens.set(accessToken, tokenRecord);
    this.#refreshTokens.set(refreshToken, accessToken);

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: refreshToken,
      scope: record.scope,
    };
  }

  issueClientCredentialsToken({ clientId, clientSecret, scope = "read:tasks" }) {
    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Invalid client_id.");
    if (client.clientSecret !== clientSecret) throw new ValidationError("Invalid client_secret.");

    const accessToken = `lat_cc_${randomToken(32)}`;
    const expiresIn = 3600 * 12; // 12 hours
    const tokenRecord = {
      token: accessToken,
      clientId,
      userId: "usr_weaver",
      scope: scope || "read:tasks",
      expiresAt: Date.now() + expiresIn * 1000,
      createdAt: new Date().toISOString(),
    };

    this.#tokens.set(accessToken, tokenRecord);
    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      scope: tokenRecord.scope,
    };
  }

  refreshToken(refreshToken) {
    const oldAccessToken = this.#refreshTokens.get(refreshToken);
    if (!oldAccessToken) throw new ValidationError("Invalid refresh_token.");

    const existing = this.#tokens.get(oldAccessToken);
    if (!existing) throw new ValidationError("Token record not found.");

    this.#tokens.delete(oldAccessToken);
    this.#refreshTokens.delete(refreshToken);

    const newAccessToken = `lat_${randomToken(32)}`;
    const newRefreshToken = `lrf_${randomToken(32)}`;
    const expiresIn = 3600 * 24;

    const tokenRecord = {
      ...existing,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    this.#tokens.set(newAccessToken, tokenRecord);
    this.#refreshTokens.set(newRefreshToken, newAccessToken);

    return {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: newRefreshToken,
      scope: existing.scope,
    };
  }

  verifyAccessToken(token) {
    if (!token) return null;
    const record = this.#tokens.get(token);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.#tokens.delete(token);
      return null;
    }
    return { ...record };
  }
  introspectToken(token) {
    if (!token) return { active: false };
    const record = this.#tokens.get(token);
    if (!record) return { active: false };
    if (Date.now() > record.expiresAt) {
      this.#tokens.delete(token);
      return { active: false };
    }
    return {
      active: true,
      scope: record.scope,
      client_id: record.clientId,
      sub: record.userId,
      exp: Math.floor(record.expiresAt / 1000),
      iat: Math.floor(new Date(record.createdAt).getTime() / 1000),
      token_type: "Bearer",
    };
  }

  hasScope(tokenScope, requiredScope) {
    if (!tokenScope || !requiredScope) return false;
    const granted = new Set(tokenScope.split(" ").map((s) => s.trim()));
    return granted.has(requiredScope) || granted.has("*");
  }

  revokeToken(token) {
    if (this.#tokens.has(token)) {
      const rec = this.#tokens.get(token);
      if (rec?.refreshToken) this.#refreshTokens.delete(rec.refreshToken);
      this.#tokens.delete(token);
      return true;
    }
    if (this.#refreshTokens.has(token)) {
      const acc = this.#refreshTokens.get(token);
      if (acc) this.#tokens.delete(acc);
      this.#refreshTokens.delete(token);
      return true;
    }
    return false;
  }
}
