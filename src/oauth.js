import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { ValidationError } from "./store.js";
import { readJsonStore, writeJsonFile } from "./persistence.js";

export const OAUTH_SCOPES = Object.freeze(["read:tasks", "write:tasks", "read:user", "tasks:refactor", "offline_access"]);
const SCOPE_TOKEN = /^[\x21\x23-\x5B\x5D-\x7E]+$/;
const INVALID_S256_CHARACTER = /[^A-Za-z0-9_-]/;
const INVALID_VERIFIER_CHARACTER = /[^A-Za-z0-9._~-]/;
const REFRESH_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

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

function equalSecrets(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function isValidRedirectUri(value) {
  if (typeof value !== "string" || !value || value.trim() !== value || value.includes("#")) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function validateScope(scope, client) {
  const value = scope === undefined || scope === null || scope === "" ? "read:tasks" : scope;
  if (typeof value !== "string" || !Array.isArray(client.allowedScopes)) {
    throw new ValidationError("Invalid scope.");
  }
  const requested = value.split(" ");
  if (!requested.every((item) => SCOPE_TOKEN.test(item) && OAUTH_SCOPES.includes(item) && client.allowedScopes.includes(item))) {
    throw new ValidationError("Requested scope is not allowed for this client.");
  }
  return [...new Set(requested)].join(" ");
}

export class OAuthServer {
  #file;
  #clients = [];
  #codes = new Map(); // code -> { clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod, expiresAt }
  #tokens = new Map(); // token -> { token, refreshToken, clientId, userId, scope, expiresAt }
  #refreshTokens = new Map(); // refreshToken -> token record, independent of access-token expiry
  #queue = Promise.resolve();
  #now;
  #write;

  constructor(file, { now = Date.now, write = writeJsonFile } = {}) {
    this.#file = file;
    this.#now = now;
    this.#write = write;
  }

  async load() {
    const stored = await readJsonStore(this.#file, "oauth");
    if (!stored.found) {
      const clients = this.#seedDefaultClients();
      await this.#write(this.#file, JSON.stringify({ version: 1, clients }, null, 2));
      this.#clients = clients;
    } else {
      const parsed = stored.value;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
          (parsed.version !== undefined && parsed.version !== 1) || !Array.isArray(parsed.clients) ||
          !parsed.clients.every((client) => client && typeof client === "object" &&
            typeof client.clientId === "string" && typeof client.clientSecret === "string" &&
            typeof client.name === "string" && Array.isArray(client.redirectUris) && Array.isArray(client.allowedScopes))) {
        throw new Error("Invalid or unsupported OAuth client store format; the data file was left unchanged.");
      }
      this.#clients = parsed.clients;
    }
    return this;
  }

  #seedDefaultClients() {
    return [
      {
        id: "cli_agent_runner",
        clientId: "agent-runner",
        clientSecret: "agent-secret-2026",
        name: "Agent Runner",
        description: "Agent-agnostic execution harness for curriculum tasks.",
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

  listClients() {
    return this.#clients.map(({ clientSecret, ...rest }) => structuredClone(rest));
  }

  getClient(clientId) {
    const client = this.#clients.find((c) => c.clientId === clientId);
    return client ? structuredClone(client) : null;
  }

  async registerClient({ name, description = "", redirectUris = [], allowedScopes = ["read:tasks", "write:tasks"] }) {
    const cleanName = String(name || "").trim();
    if (!cleanName) throw new ValidationError("Client app needs a name.");
    if (!Array.isArray(redirectUris)) throw new ValidationError("redirectUris must be an array.");
    const registeredRedirectUris = redirectUris.length
      ? redirectUris
      : ["http://localhost:3000/oauth/callback"];
    if (!registeredRedirectUris.every(isValidRedirectUri)) {
      throw new ValidationError("Redirect URIs must be absolute HTTP(S) URLs without credentials or fragments.");
    }
    if (!Array.isArray(allowedScopes) || allowedScopes.length === 0 ||
        !allowedScopes.every((scope) => typeof scope === "string" && OAUTH_SCOPES.includes(scope))) {
      throw new ValidationError("allowedScopes must contain supported scopes.");
    }
    const clientId = `gauntlet-web_${randomToken(8)}`;
    const clientSecret = `sec_${randomToken(24)}`;

    const client = {
      id: `cli_${randomToken(6)}`,
      clientId,
      clientSecret,
      name: cleanName,
      description: String(description || "").trim(),
      redirectUris: [...registeredRedirectUris],
      allowedScopes: [...new Set(allowedScopes)],
      isFirstParty: false,
      createdAt: new Date().toISOString(),
    };

    const run = this.#queue.then(async () => {
      const clients = [...this.#clients, client];
      await this.#write(this.#file, JSON.stringify({ version: 1, clients }, null, 2));
      this.#clients = clients;
      return structuredClone(client);
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  validateRedirectUri(clientId, redirectUri) {
    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Unknown client_id.");
    if (!isValidRedirectUri(redirectUri) || !Array.isArray(client.redirectUris) || !client.redirectUris.includes(redirectUri)) {
      throw new ValidationError("redirect_uri must exactly match a registered redirect URI.");
    }
    return client;
  }

  validateAuthorizationRequest({ clientId, redirectUri, scope, codeChallenge, codeChallengeMethod = "S256" }) {
    const client = this.validateRedirectUri(clientId, redirectUri);
    const grantedScope = validateScope(scope, client);
    if (codeChallengeMethod !== "S256" ||
        (codeChallenge !== undefined && codeChallenge !== null && codeChallenge !== "" &&
         (typeof codeChallenge !== "string" || codeChallenge.length !== 43 || INVALID_S256_CHARACTER.test(codeChallenge)))) {
      throw new ValidationError("PKCE requires a valid S256 code challenge.");
    }
    return { client, scope: grantedScope };
  }

  createAuthorizationCode({ clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod = "S256" }) {
    const authorization = this.validateAuthorizationRequest({ clientId, redirectUri, scope, codeChallenge, codeChallengeMethod });

    const code = `authcode_${randomToken(20)}`;
    const expiresAt = this.#now() + 1000 * 60 * 10; // 10 minutes

    this.#codes.set(code, {
      code,
      clientId,
      userId,
      redirectUri,
      scope: authorization.scope,
      codeChallenge,
      codeChallengeMethod,
      expiresAt,
    });

    return code;
  }

  exchangeCodeForToken({ code, clientId, clientSecret, redirectUri, codeVerifier }) {
    const record = this.#codes.get(code);
    if (!record) throw new ValidationError("Invalid or expired authorization code.");
    if (this.#now() >= record.expiresAt) {
      this.#codes.delete(code);
      throw new ValidationError("Authorization code has expired.");
    }
    if (record.clientId !== clientId) {
      throw new ValidationError("client_id does not match authorization code.");
    }
    if (record.redirectUri !== redirectUri) {
      throw new ValidationError("redirect_uri does not match.");
    }

    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Invalid client.");

    const suppliedSecret = clientSecret !== undefined && clientSecret !== null && clientSecret !== "";
    if (suppliedSecret && !equalSecrets(clientSecret, client.clientSecret)) {
      throw new ValidationError("Invalid client_secret.");
    }
    // PKCE verification if challenge was supplied
    if (record.codeChallenge) {
      if (typeof codeVerifier !== "string" || codeVerifier.length < 43 || codeVerifier.length > 128 || INVALID_VERIFIER_CHARACTER.test(codeVerifier)) {
        throw new ValidationError("A valid code_verifier is required for PKCE.");
      }
      if (!equalSecrets(sha256Base64Url(codeVerifier), record.codeChallenge)) {
        throw new ValidationError("Invalid code_verifier (PKCE verification failed).");
      }
    } else if (!suppliedSecret) {
      throw new ValidationError("client_secret is required without PKCE.");
    }

    // Code is single use
    this.#codes.delete(code);

    const accessToken = `lat_${randomToken(32)}`;
    const refreshToken = `lrf_${randomToken(32)}`;
    const expiresIn = 3600 * 24; // 24 hours
    const now = this.#now();
    const tokenRecord = {
      token: accessToken,
      refreshToken,
      clientId,
      userId: record.userId,
      scope: record.scope,
      clientAuthenticated: suppliedSecret,
      expiresAt: now + expiresIn * 1000,
      refreshExpiresAt: now + REFRESH_LIFETIME_MS,
      createdAt: new Date(now).toISOString(),
    };

    this.#tokens.set(accessToken, tokenRecord);
    this.#refreshTokens.set(refreshToken, tokenRecord);

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
    if (!equalSecrets(clientSecret, client.clientSecret)) throw new ValidationError("Invalid client_secret.");
    const grantedScope = validateScope(scope, client);

    const accessToken = `lat_cc_${randomToken(32)}`;
    const expiresIn = 3600 * 12; // 12 hours
    const now = this.#now();
    const tokenRecord = {
      token: accessToken,
      clientId,
      userId: "usr_agent",
      scope: grantedScope,
      expiresAt: now + expiresIn * 1000,
      createdAt: new Date(now).toISOString(),
    };

    this.#tokens.set(accessToken, tokenRecord);
    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      scope: tokenRecord.scope,
    };
  }

  refreshToken(refreshToken, { clientId, clientSecret } = {}) {
    const existing = this.#refreshTokens.get(refreshToken);
    if (!existing) throw new ValidationError("Invalid refresh_token.");
    const now = this.#now();
    if (now >= existing.refreshExpiresAt) {
      this.#refreshTokens.delete(refreshToken);
      throw new ValidationError("refresh_token has expired.");
    }
    if (!clientId || existing.clientId !== clientId) throw new ValidationError("refresh_token belongs to another client.");
    const client = this.getClient(clientId);
    if (!client) throw new ValidationError("Invalid client_id.");
    const suppliedSecret = clientSecret !== undefined && clientSecret !== null && clientSecret !== "";
    if ((existing.clientAuthenticated || suppliedSecret) && !equalSecrets(clientSecret, client.clientSecret)) {
      throw new ValidationError("Invalid client_secret.");
    }

    this.#tokens.delete(existing.token);
    this.#refreshTokens.delete(refreshToken);

    const newAccessToken = `lat_${randomToken(32)}`;
    const newRefreshToken = `lrf_${randomToken(32)}`;
    const expiresIn = 3600 * 24;

    const tokenRecord = {
      ...existing,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: now + expiresIn * 1000,
      createdAt: new Date(now).toISOString(),
    };

    this.#tokens.set(newAccessToken, tokenRecord);
    this.#refreshTokens.set(newRefreshToken, tokenRecord);

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
    if (this.#now() >= record.expiresAt) {
      this.#tokens.delete(token);
      return null;
    }
    return { ...record };
  }
  introspectToken(token) {
    if (!token) return { active: false };
    const record = this.#tokens.get(token);
    if (!record) return { active: false };
    if (this.#now() >= record.expiresAt) {
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
      const record = this.#refreshTokens.get(token);
      if (record?.token) this.#tokens.delete(record.token);
      this.#refreshTokens.delete(token);
      return true;
    }
    return false;
  }
}
