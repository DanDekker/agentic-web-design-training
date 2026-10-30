import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { TaskStore } from "../src/store.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let authStore;
let oauthServer;
let taskStore;
let handle;

function sha256Base64Url(str) {
  return createHash("sha256")
    .update(str)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const call = (method, path, body, headers = {}) =>
  handle(
    new Request(`http://gauntlet-web.test${path}`, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-auth-oauth-"));
  taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  authStore = await new AuthStore(join(dir, "auth.json")).load();
  oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("1st-Party Proprietary Authentication", () => {
  test("seeds default users (agent, pp)", async () => {
    const users = authStore.listUsers();
    expect(users.map((u) => u.username)).toContain("agent");
    expect(users.map((u) => u.username)).toContain("pp");
  });

  test("verifies credentials and logs in via API", async () => {
    const res = await call("POST", "/api/auth/login", {
      username: "agent",
      password: "agent-demo-2026",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.username).toBe("agent");
    expect(typeof data.token).toBe("string");
    expect(res.headers.get("set-cookie")).toContain("gauntlet-web_session=");

    // Authenticate with Bearer token
    const meRes = await call("GET", "/api/auth/me", null, {
      authorization: `Bearer ${data.token}`,
    });
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.user.username).toBe("agent");
  });

  test("registers new user and rejects duplicate username", async () => {
    const regRes = await call("POST", "/api/auth/register", {
      username: "desktop_agent_01",
      password: "secure_agent_pass",
      displayName: "Agent Alpha",
    });
    expect(regRes.status).toBe(201);
    const registered = await regRes.json();
    expect(registered.user.username).toBe("desktop_agent_01");

    // Duplicate rejection
    const dupRes = await call("POST", "/api/auth/register", {
      username: "desktop_agent_01",
      password: "different_password",
    });
    expect(dupRes.status).toBe(422);
  });

  test("rejects invalid login", async () => {
    const badRes = await call("POST", "/api/auth/login", {
      username: "agent",
      password: "wrong_password",
    });
    expect(badRes.status).toBe(401);
  });

  test("logs out and revokes session", async () => {
    const login = await (
      await call("POST", "/api/auth/login", {
        username: "pp",
        password: "curriculum-1m",
      })
    ).json();

    const logoutRes = await call("POST", "/api/auth/logout", null, {
      authorization: `Bearer ${login.token}`,
    });
    expect(logoutRes.status).toBe(200);

    const meAfter = await (
      await call("GET", "/api/auth/me", null, {
        authorization: `Bearer ${login.token}`,
      })
    ).json();
    expect(meAfter.user).toBeNull();
  });
});

describe("1st-Party Proprietary OAuth 2.0 / OIDC Provider", () => {
  test("exposes OIDC discovery endpoint", async () => {
    const res = await call("GET", "/.well-known/openid-configuration");
    expect(res.status).toBe(200);
    const disc = await res.json();
    expect(disc.token_endpoint).toContain("/oauth/token");
    expect(disc.authorization_endpoint).toContain("/oauth/authorize");
    expect(disc.scopes_supported).toContain("tasks:refactor");
    expect(disc.code_challenge_methods_supported).toEqual(["S256"]);
  });

  test("lists registered 1st-party clients", async () => {
    const res = await call("GET", "/oauth/clients");
    expect(res.status).toBe(200);
    const { clients } = await res.json();
    expect(clients.some((c) => c.clientId === "agent-runner")).toBe(true);
  });

  test("renders consent data as text and preserves state without creating markup", async () => {
    const injectedName = `<img src=x onerror=alert(1)> & 'client'`;
    const injectedState = `"><img src=x onerror=alert(1)> & 'state'`;
    const client = await oauthServer.registerClient({
      name: injectedName,
      redirectUris: ["http://localhost:3000/oauth/callback"],
      allowedScopes: ["read:tasks"],
    });
    const params = new URLSearchParams({
      client_id: client.clientId,
      redirect_uri: client.redirectUris[0],
      scope: "read:tasks",
      state: injectedState,
      code_challenge: "a".repeat(43),
      code_challenge_method: "S256",
    });
    const res = await call("GET", `/oauth/authorize?${params}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const html = await res.text();
    const fields = {};
    let images = 0;
    await new HTMLRewriter()
      .on("input", { element(node) { fields[node.getAttribute("name")] = node.getAttribute("value"); } })
      .on("img", { element() { images++; } })
      .transform(new Response(html)).text();
    expect(images).toBe(0);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; &#39;client&#39;");
    // HTMLRewriter exposes the source-encoded attribute values.
    expect(fields.state).toBe("&quot;&gt;&lt;img src=x onerror=alert(1)&gt; &amp; &#39;state&#39;");
    expect(fields.scope).toBe("read:tasks");
    expect(fields.redirect_uri).toBe(client.redirectUris[0]);
  });

  test("only redirects authorization decisions to an exactly registered URI", async () => {
    const registered = "http://localhost:3000/oauth/callback";
    const unregistered = "http://localhost:3000/oauth/callback/elsewhere";
    const query = new URLSearchParams({ client_id: "agent-runner", redirect_uri: unregistered });
    const consent = await call("GET", `/oauth/authorize?${query}`);
    expect(consent.status).toBe(422);
    expect(consent.headers.get("location")).toBeNull();

    for (const approved of ["true", "false"]) {
      const decision = await call("POST", "/oauth/authorize/decision", {
        client_id: "agent-runner", redirect_uri: unregistered, approved,
      });
      expect(decision.status).toBe(422);
      expect(decision.headers.get("location")).toBeNull();
    }

    const denied = await call("POST", "/oauth/authorize/decision", {
      client_id: "agent-runner", redirect_uri: registered, approved: "false", state: "state & value",
    });
    expect(denied.status).toBe(302);
    const target = new URL(denied.headers.get("location"));
    expect(`${target.origin}${target.pathname}`).toBe(registered);
    expect(target.searchParams.get("error")).toBe("access_denied");
    expect(target.searchParams.get("state")).toBe("state & value");
  });

  test("rejects unsafe redirect registrations and requires the original URI at token exchange", async () => {
    for (const uri of ["javascript:alert(1)", "https://user:pass@example.test/callback", "https://example.test/callback#fragment"]) {
      const registration = await call("POST", "/oauth/clients", { name: "Unsafe client", redirectUris: [uri] });
      expect(registration.status).toBe(422);
    }

    const redirectUri = "http://localhost:3000/oauth/callback";
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const decision = await (await call("POST", "/oauth/authorize/decision", {
      client_id: "agent-runner", redirect_uri: redirectUri, approved: "true",
      code_challenge: sha256Base64Url(verifier), code_challenge_method: "S256",
    })).json();
    const tokenRequest = { grant_type: "authorization_code", client_id: "agent-runner", code: decision.code, code_verifier: verifier };
    expect((await call("POST", "/oauth/token", tokenRequest)).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...tokenRequest, redirect_uri: `${redirectUri}/other` })).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...tokenRequest, redirect_uri: redirectUri })).status).toBe(200);
  });

  test("limits requested scopes to the client's registration in both grant flows", async () => {
    const redirectUri = "http://localhost:3000/oauth/callback";
    const params = new URLSearchParams({ client_id: "desktop-curriculum-suite", redirect_uri: redirectUri, scope: "write:tasks" });
    expect((await call("GET", `/oauth/authorize?${params}`)).status).toBe(422);
    expect((await call("POST", "/oauth/authorize/decision", {
      client_id: "desktop-curriculum-suite", redirect_uri: redirectUri, scope: "write:tasks", approved: "true",
    })).status).toBe(422);
    expect((await call("POST", "/oauth/token", {
      grant_type: "client_credentials", client_id: "desktop-curriculum-suite",
      client_secret: "desktop-eval-secret-99", scope: "write:tasks",
    })).status).toBe(422);
    expect((await call("POST", "/oauth/clients", { name: "Bad scope", allowedScopes: ["*"] })).status).toBe(422);
  });

  test("accepts only well-formed S256 challenges for authorization codes", async () => {
    const base = { client_id: "agent-runner", redirect_uri: "http://localhost:3000/oauth/callback", approved: "true" };
    expect((await call("POST", "/oauth/authorize/decision", { ...base, code_challenge: "too-short", code_challenge_method: "S256" })).status).toBe(422);
    expect((await call("POST", "/oauth/authorize/decision", { ...base, code_challenge: `${"a".repeat(43)}\n`, code_challenge_method: "S256" })).status).toBe(422);
    expect((await call("POST", "/oauth/authorize/decision", { ...base, code_challenge: "a".repeat(43), code_challenge_method: "plain" })).status).toBe(422);
  });

  test("requires client authentication without PKCE and binds refreshes to that client", async () => {
    const redirectUri = "http://localhost:3000/oauth/callback";
    const decision = await (await call("POST", "/oauth/authorize/decision", {
      client_id: "agent-runner", redirect_uri: redirectUri, approved: "true",
    })).json();
    const exchange = { grant_type: "authorization_code", client_id: "agent-runner", redirect_uri: redirectUri, code: decision.code };
    expect((await call("POST", "/oauth/token", exchange)).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...exchange, client_secret: "wrong" })).status).toBe(422);
    const tokenRes = await call("POST", "/oauth/token", { ...exchange, client_secret: "agent-secret-2026" });
    expect(tokenRes.status).toBe(200);
    const tokens = await tokenRes.json();
    expect((await call("POST", "/oauth/token", { ...exchange, client_secret: "agent-secret-2026" })).status).toBe(422);

    const refresh = { grant_type: "refresh_token", client_id: "agent-runner", refresh_token: tokens.refresh_token };
    expect((await call("POST", "/oauth/token", refresh)).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...refresh, client_id: "desktop-curriculum-suite" })).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...refresh, client_secret: "agent-secret-2026" })).status).toBe(200);
    expect((await call("POST", "/oauth/token", { ...refresh, client_secret: "agent-secret-2026" })).status).toBe(422);
  });

  test("validates a PKCE verifier and does not let another client refresh its token", async () => {
    const redirectUri = "http://localhost:3000/oauth/callback";
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const decision = await (await call("POST", "/oauth/authorize/decision", {
      client_id: "agent-runner", redirect_uri: redirectUri, approved: "true",
      code_challenge: sha256Base64Url(verifier), code_challenge_method: "S256",
    })).json();
    const exchange = { grant_type: "authorization_code", client_id: "agent-runner", redirect_uri: redirectUri, code: decision.code };
    expect((await call("POST", "/oauth/token", { ...exchange, code_verifier: "short" })).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...exchange, code_verifier: `${verifier}\n` })).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...exchange, code_verifier: verifier, client_secret: "wrong" })).status).toBe(422);
    const tokenRes = await call("POST", "/oauth/token", { ...exchange, code_verifier: verifier });
    expect(tokenRes.status).toBe(200);
    const tokens = await tokenRes.json();
    const refresh = { grant_type: "refresh_token", refresh_token: tokens.refresh_token };
    expect((await call("POST", "/oauth/token", refresh)).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...refresh, client_id: "desktop-curriculum-suite" })).status).toBe(422);
    expect((await call("POST", "/oauth/token", { ...refresh, client_id: "agent-runner" })).status).toBe(200);
  });

  test("refreshes after access-token expiry and enforces a fixed refresh lifetime", async () => {
    const started = Date.parse("2026-01-01T00:00:00Z");
    let now = started;
    const clocked = await new OAuthServer(join(dir, "clocked-oauth.json"), { now: () => now }).load();
    const redirectUri = "http://localhost:3000/oauth/callback";
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const grant = () => {
      const code = clocked.createAuthorizationCode({
        clientId: "agent-runner", userId: "usr_agent", redirectUri,
        codeChallenge: sha256Base64Url(verifier), codeChallengeMethod: "S256",
      });
      return clocked.exchangeCodeForToken({ code, clientId: "agent-runner", redirectUri, codeVerifier: verifier });
    };
    const first = grant();
    now += first.expires_in * 1000;
    expect(clocked.verifyAccessToken(first.access_token)).toBeNull();
    const rotated = clocked.refreshToken(first.refresh_token, { clientId: "agent-runner" });
    expect(rotated.refresh_token).not.toBe(first.refresh_token);
    expect(clocked.introspectToken(rotated.access_token).iat).toBe(now / 1000);
    expect(() => clocked.refreshToken(first.refresh_token, { clientId: "agent-runner" })).toThrow();

    const other = grant();
    expect(clocked.revokeToken(other.refresh_token)).toBe(true);
    expect(clocked.verifyAccessToken(other.access_token)).toBeNull();

    now = started + 7 * 24 * 60 * 60 * 1000;
    expect(() => clocked.refreshToken(rotated.refresh_token, { clientId: "agent-runner" })).toThrow("expired");
  });

  test("complete OAuth Authorization Code flow with PKCE S256", async () => {
    const clientId = "agent-runner";
    const redirectUri = "http://localhost:3000/oauth/callback";
    const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const codeChallenge = sha256Base64Url(codeVerifier);

    // 1. Authorize Decision (User grants consent)
    const decisionRes = await call("POST", "/oauth/authorize/decision", {
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:tasks write:tasks tasks:refactor",
      state: "state_12345",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      approved: "true",
    });

    expect(decisionRes.status).toBe(200);
    const decisionData = await decisionRes.json();
    expect(decisionData.code).toMatch(/^authcode_/);
    expect(decisionData.state).toBe("state_12345");

    // 2. Token Exchange with PKCE code_verifier
    const tokenRes = await call("POST", "/oauth/token", {
      grant_type: "authorization_code",
      client_id: clientId,
      code: decisionData.code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    expect(tokenRes.status).toBe(200);
    const tokens = await tokenRes.json();
    expect(tokens.token_type).toBe("Bearer");
    expect(tokens.access_token).toMatch(/^lat_/);
    expect(tokens.refresh_token).toMatch(/^lrf_/);

    // 3. Request UserInfo using OAuth Bearer access token
    const userinfoRes = await call("GET", "/oauth/userinfo", null, {
      authorization: `Bearer ${tokens.access_token}`,
    });
    expect(userinfoRes.status).toBe(200);
    const userinfo = await userinfoRes.json();
    expect(userinfo.sub).toBeTruthy();
    expect(userinfo.client_id).toBe(clientId);

    // 4. Token Refresh
    const refreshRes = await call("POST", "/oauth/token", {
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: tokens.refresh_token,
    });
    expect(refreshRes.status).toBe(200);
    const refreshed = await refreshRes.json();
    expect(refreshed.access_token).toMatch(/^lat_/);

    // 5. Revoke Token
    const revokeRes = await call("POST", "/oauth/revoke", {
      token: refreshed.access_token,
    });
    expect(revokeRes.status).toBe(200);

    // Access after revoke fails
    const postRevokeRes = await call("GET", "/oauth/userinfo", null, {
      authorization: `Bearer ${refreshed.access_token}`,
    });
    expect(postRevokeRes.status).toBe(401);
  });
  test("OAuth 2.0 RFC 7662 Token Introspection", async () => {
    // Generate valid access token via client credentials
    const tokenRes = await (
      await call("POST", "/oauth/token", {
        grant_type: "client_credentials",
        client_id: "agent-runner",
        client_secret: "agent-secret-2026",
        scope: "read:tasks tasks:refactor",
      })
    ).json();

    // 1. Introspect active token
    const activeRes = await call("POST", "/oauth/introspect", {
      token: tokenRes.access_token,
    });
    expect(activeRes.status).toBe(200);
    const activeData = await activeRes.json();
    expect(activeData.active).toBe(true);
    expect(activeData.client_id).toBe("agent-runner");
    expect(activeData.scope).toBe("read:tasks tasks:refactor");
    expect(activeData.sub).toBe("usr_agent");
    expect(typeof activeData.exp).toBe("number");

    // 2. Revoke and introspect again -> active should be false
    await call("POST", "/oauth/revoke", { token: tokenRes.access_token });
    const revokedRes = await (
      await call("POST", "/oauth/introspect", { token: tokenRes.access_token })
    ).json();
    expect(revokedRes.active).toBe(false);
  });

  test("OAuth machine-to-machine client_credentials flow", async () => {
    const res = await call("POST", "/oauth/token", {
      grant_type: "client_credentials",
      client_id: "agent-runner",
      client_secret: "agent-secret-2026",
      scope: "read:tasks tasks:refactor",
    });

    expect(res.status).toBe(200);
    const token = await res.json();
    expect(token.access_token).toMatch(/^lat_cc_/);

    const userinfo = await (
      await call("GET", "/oauth/userinfo", null, {
        authorization: `Bearer ${token.access_token}`,
      })
    ).json();
    expect(userinfo.client_id).toBe("agent-runner");
  });
});
