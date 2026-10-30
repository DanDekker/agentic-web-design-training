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
    const injectedScope = "<img/src=x>";
    const client = await oauthServer.registerClient({
      name: injectedName,
      redirectUris: ["http://localhost:3000/oauth/callback"],
      allowedScopes: ["read:tasks", injectedScope],
    });
    const params = new URLSearchParams({
      client_id: client.clientId,
      redirect_uri: client.redirectUris[0],
      scope: `read:tasks ${injectedScope}`,
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
    expect(fields.scope).toBe("read:tasks &lt;img/src=x&gt;");
    expect(fields.redirect_uri).toBe(client.redirectUris[0]);
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
