import { ValidationError } from "./store.js";
import { OAUTH_SCOPES } from "./oauth.js";
import {
  REFACTORING_CURRICULUM_TASKS,
  CURRICULUM_CATEGORIES,
  CURRICULUM_TRACKS,
  CURRICULUM_DIFFICULTIES,
} from "./curriculum.js";
import { Evaluator } from "./evaluator.js";
import { BenchmarkSuite } from "./benchmark.js";
import { getTypeScriptEcosystemOverview } from "./ts_ecosystem.js";
import { buildApplicationJsonLdGraph, auditHtmlSeoAndStructuredData } from "./seo.js";
import {
  PAYMENT_PROVIDERS_CATALOG,
  CURRENCY_EXPONENTS,
  calculateCheckoutQuote,
  verifyCommerceWebhook,
  computeMarketplaceLedgerSplit,
  WebShopStore,
} from "./commerce.js";
import {
  WEB_COOKIES_DATA_TRAFFIC_CATALOG,
  auditAndSerializeWebCookie,
  simulateHttpTrafficPipeline,
} from "./web_traffic.js";
import {
  PROPRIETARY_DESIGN_SYSTEM_CATALOG,
  compileDtcgDesignTokens,
  evaluateAndRemediateOklchContrast,
} from "./design_system.js";
import { ChatEngine } from "./chat.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });

const noContent = () => new Response(null, { status: 204 });

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function readJson(req) {
  const text = await req.text();
  if (!text.trim()) return {};
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HttpError(400, "Body must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Body must be a JSON object.");
  }
  return value;
}

const notFound = (what) => json({ error: `No such ${what}.` }, 404);

export function createHandler(store, hub, authStore, oauthServer, chatEngine = new ChatEngine(), webShopStore = new WebShopStore()) {
const evaluator = new Evaluator();
const benchmarkSuite = new BenchmarkSuite();
  return async function handle(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;

    // Optional user from Bearer header or cookie
    const currentUser = authStore?.authenticateRequest(req) ?? null;

    try {
      /* ── Health & SSE ─────────────────────────────────────── */
      if (pathname === "/api/health") {
        return json({ ok: true });
      }

      if (pathname === "/api/events") {
        if (req.method !== "GET") throw new HttpError(405, "Method not allowed.");
        return hub.stream();
      }

      /* ── Full State ───────────────────────────────────────── */
      if (pathname === "/api/state") {
        const state = store.state();
        return json({
          ...state,
          user: currentUser,
          oauthClients: oauthServer?.listClients() ?? [],
          chatRooms: chatEngine.listRooms(),
          chatTelemetry: chatEngine.getTelemetry(),
        });
      }

      /* ── Authentication Endpoints ─────────────────────────── */
      if (pathname === "/api/auth/register" && req.method === "POST") {
        const body = await readJson(req);
        const user = await authStore.register(body);
        const { token } = authStore.createSession(user.id, req.headers.get("user-agent") || "");
        hub?.broadcast({ type: "state", at: Date.now() });
        return json(
          { user, token },
          201,
          { "set-cookie": `gauntlet-web_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        );
      }

      if (pathname === "/api/auth/login" && req.method === "POST") {
        const { username, password } = await readJson(req);
        if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
          throw new HttpError(400, "Username and password required.");
        }
        const user = await authStore.verifyCredentials(username, password);
        if (!user) throw new HttpError(401, "Invalid username or password.");
        const { token } = authStore.createSession(user.id, req.headers.get("user-agent") || "");
        hub?.broadcast({ type: "state", at: Date.now() });
        return json(
          { user, token },
          200,
          { "set-cookie": `gauntlet-web_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        );
      }

      if (pathname === "/api/auth/logout" && req.method === "POST") {
        const authHeader = req.headers.get("authorization") || "";
        let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        if (!token) {
          const cookieHeader = req.headers.get("cookie") || "";
          const match = cookieHeader.match(/(?:^|;\s*)gauntlet-web_session=([a-f0-9]+)/);
          if (match) token = match[1];
        }
        if (token) authStore.revokeSession(token);
        hub?.broadcast({ type: "state", at: Date.now() });
        return json(
          { ok: true },
          200,
          { "set-cookie": `gauntlet-web_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` },
        );
      }

      if (pathname === "/api/auth/me" && req.method === "GET") {
        return json({ user: currentUser });
      }

      if (pathname === "/api/auth/users" && req.method === "GET") {
        return json({ users: authStore.listUsers() });
      }

      /* ── OAuth 2.0 Endpoints ───────────────────────────────── */
      if (pathname === "/.well-known/openid-configuration") {
        const origin = url.origin;
        return json({
          issuer: origin,
          authorization_endpoint: `${origin}/oauth/authorize`,
          token_endpoint: `${origin}/oauth/token`,
          userinfo_endpoint: `${origin}/oauth/userinfo`,
          revocation_endpoint: `${origin}/oauth/revoke`,
          introspection_endpoint: `${origin}/oauth/introspect`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "client_credentials", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          scopes_supported: OAUTH_SCOPES,
        });
      }

      if (pathname === "/oauth/clients") {
        if (req.method === "GET") return json({ clients: oauthServer.listClients() });
        if (req.method === "POST") {
          const body = await readJson(req);
          const client = await oauthServer.registerClient(body);
          hub?.broadcast({ type: "state", at: Date.now() });
          return json(client, 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/oauth/authorize" && req.method === "GET") {
        const clientId = searchParams.get("client_id");
        const redirectUri = searchParams.get("redirect_uri");
        const requestedScope = searchParams.get("scope") || "read:tasks";
        const state = searchParams.get("state") || "";
        const codeChallenge = searchParams.get("code_challenge") || "";
        const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";

        const { client, scope } = oauthServer.validateAuthorizationRequest({
          clientId, redirectUri, scope: requestedScope, codeChallenge, codeChallengeMethod,
        });

        // If request wants JSON (API/agent client)
        if (req.headers.get("accept")?.includes("application/json")) {
          return json({
            client: { id: client.id, name: client.name, clientId: client.clientId },
            scope,
            state,
            codeChallenge,
            codeChallengeMethod,
            currentUser,
          });
        }

        // Return a sleek monochrome authorization consent page
        const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize ${escapeHtml(client.name)} — gauntlet-web OAuth</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
    .consent-card { width: min(100%, 460px); border: 1px solid var(--line); border-radius: 16px; background: var(--panel); padding: 2.2rem; box-shadow: var(--shadow); }
    .scope-list { list-style: none; padding: 0; margin: 1.5rem 0; }
    .scope-list li { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0; border-bottom: 1px solid var(--line); font-size: 0.88rem; }
    .scope-tag { font-family: var(--font-mono); font-size: 0.72rem; padding: 0.15rem 0.4rem; border: 1px solid var(--line); border-radius: 4px; }
    .btn-row { display: flex; gap: 0.8rem; margin-top: 2rem; }
    .btn-row button { flex: 1; padding: 0.75rem; border-radius: 8px; font: inherit; font-size: 0.9rem; cursor: pointer; }
    .btn-approve { background: var(--ink); color: var(--bg); border: 0; }
    .btn-deny { background: none; color: var(--muted); border: 1px solid var(--line); }
  </style>
</head>
<body>
  <div class="consent-card">
    <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1.5rem;">
      <div class="brand-mark"><svg viewBox="0 0 24 24"><path d="M6.2 12.6l3.7 3.7L17.8 8.3" stroke="currentColor" fill="none"/></svg></div>
      <span style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:0.8rem;">gauntlet-web OAuth 2.0</span>
    </div>
    <h2 style="margin:0 0 0.5rem;font-family:var(--font-display);font-weight:400;font-size:1.8rem;">Authorize Application</h2>
    <p style="color:var(--muted);font-size:0.9rem;margin:0 0 1.2rem;">
      <strong>${escapeHtml(client.name)}</strong> is requesting permission to access your tasks and refactoring curriculum data.
    </p>
    <ul class="scope-list">
      ${scope.split(" ").map((s) => `<li><span class="scope-tag">${escapeHtml(s)}</span><span>Permission to access ${escapeHtml(s)}</span></li>`).join("")}
    </ul>
    <div style="font-size:0.75rem;color:var(--faint);font-family:var(--font-mono);">
      Account: ${escapeHtml(currentUser ? currentUser.username : "guest (default agent)")}
    </div>
    <form method="POST" action="/oauth/authorize/decision">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}">
      <div class="btn-row">
        <button type="submit" name="approved" value="false" class="btn-deny">Deny</button>
        <button type="submit" name="approved" value="true" class="btn-approve">Authorize</button>
      </div>
    </form>
  </div>
</body>
</html>`;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }

      if (pathname === "/oauth/authorize/decision" && req.method === "POST") {
        let body;
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await readJson(req);
        } else {
          const form = await req.formData();
          body = Object.fromEntries(form.entries());
        }

        const approved = String(body.approved) === "true";
        const redirectUri = body.redirect_uri;
        const state = body.state || "";

        // Validate before either granting a code or redirecting a denied request.
        oauthServer.validateAuthorizationRequest({
          clientId: body.client_id, redirectUri, scope: body.scope,
          codeChallenge: body.code_challenge, codeChallengeMethod: body.code_challenge_method,
        });

        if (!approved) {
          const target = new URL(redirectUri);
          target.searchParams.set("error", "access_denied");
          if (state) target.searchParams.set("state", state);
          return Response.redirect(target.toString(), 302);
        }

        const userId = currentUser?.id || "usr_agent";
        const code = oauthServer.createAuthorizationCode({
          clientId: body.client_id,
          userId,
          redirectUri,
          scope: body.scope,
          codeChallenge: body.code_challenge,
          codeChallengeMethod: body.code_challenge_method,
        });

        const target = new URL(redirectUri);
        target.searchParams.set("code", code);
        if (state) target.searchParams.set("state", state);

        if (req.headers.get("accept")?.includes("application/json") || contentType.includes("application/json")) {
          return json({ redirect: target.toString(), code, state });
        }
        return Response.redirect(target.toString(), 302);
      }

      if (pathname === "/oauth/token" && req.method === "POST") {
        let body;
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await readJson(req);
        } else {
          const form = await req.formData();
          body = Object.fromEntries(form.entries());
        }

        // Support HTTP Basic Authentication for client credentials
        const authHeader = req.headers.get("authorization") || "";
        let basicClientId = null;
        let basicClientSecret = null;
        if (authHeader.startsWith("Basic ")) {
          try {
            const decoded = atob(authHeader.slice(6).trim());
            const [u, p] = decoded.split(":");
            basicClientId = u;
            basicClientSecret = p;
          } catch {}
        }

        const clientId = body.client_id || basicClientId;
        const clientSecret = body.client_secret || basicClientSecret;
        const grantType = body.grant_type;

        if (grantType === "authorization_code") {
          const result = oauthServer.exchangeCodeForToken({
            code: body.code,
            clientId,
            clientSecret,
            redirectUri: body.redirect_uri,
            codeVerifier: body.code_verifier,
          });
          return json(result);
        }

        if (grantType === "client_credentials") {
          const result = oauthServer.issueClientCredentialsToken({
            clientId,
            clientSecret,
            scope: body.scope,
          });
          return json(result);
        }

        if (grantType === "refresh_token") {
          const result = oauthServer.refreshToken(body.refresh_token, { clientId, clientSecret });
          return json(result);
        }

        throw new HttpError(400, `Unsupported grant_type '${grantType}'.`);
      }

      if (pathname === "/oauth/userinfo") {
        const authHeader = req.headers.get("authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
          throw new HttpError(401, "Missing Bearer access token.");
        }
        const token = authHeader.slice(7).trim();
        const verified = oauthServer.verifyAccessToken(token);
        if (!verified) throw new HttpError(401, "Invalid or expired access token.");

        const user = authStore.getUserById(verified.userId) || {
          id: verified.userId,
          username: "agent",
          displayName: "Demo Agent",
          role: "agent",
        };

        return json({
          sub: user.id,
          username: user.username,
          name: user.displayName,
          role: user.role,
          scope: verified.scope,
          client_id: verified.clientId,
        });
      }

      if (pathname === "/oauth/revoke" && req.method === "POST") {
        const body = await readJson(req);
        const token = body.token;
        if (token) oauthServer.revokeToken(token);
        return json({ ok: true });
      }
      if (pathname === "/oauth/introspect" && req.method === "POST") {
        let body;
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          body = await readJson(req);
        } else {
          const form = await req.formData();
          body = Object.fromEntries(form.entries());
        }
        const token = body.token;
        const result = oauthServer.introspectToken(token);
        return json(result);
      }

      /* ── Curriculum Refactoring Tasks ─────────────────────── */
      if (pathname === "/api/curriculum/evaluate" && req.method === "POST") {
        const { taskId, code, options } = await readJson(req);
        const result = await evaluator.evaluate(taskId, code, options);
        return json(result);
      }
      if (pathname === "/api/curriculum/benchmark") {
        if (req.method === "GET") {
          const format = searchParams.get("format");
          const category = searchParams.get("category") || null;
          if (format === "markdown") {
            const bench = await benchmarkSuite.runFullBenchmark({ category });
            const md = benchmarkSuite.formatMarkdown(bench);
            return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
          }
          if (searchParams.get("run") === "true") {
            const bench = await benchmarkSuite.runFullBenchmark({ category });
            return json(bench);
          }
          return json(benchmarkSuite.getCatalogStats());
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/api/curriculum/benchmark/run-all" && req.method === "POST") {
        const body = await readJson(req);
        const results = await benchmarkSuite.runFullBenchmark({ category: body?.category || null });
        return json(results);
      }
      if (pathname === "/api/curriculum/ecosystem" && req.method === "GET") {
        return json(getTypeScriptEcosystemOverview());
      }
      if (pathname === "/api/seo/json-ld" && req.method === "GET") {
        return json(buildApplicationJsonLdGraph(url.origin));
      }
      if (pathname === "/api/seo/audit" && req.method === "POST") {
        const body = await readJson(req);
        if (!body?.html || typeof body.html !== "string") {
          throw new ValidationError("html string is required for SEO audit.");
        }
        return json(auditHtmlSeoAndStructuredData(body.html));
      }
      if (pathname === "/api/commerce/catalog" && req.method === "GET") {
        return json({
          providers: PAYMENT_PROVIDERS_CATALOG,
          currencies: CURRENCY_EXPONENTS,
          categories: ["ecommerce-checkout", "payment-processing"],
          track: "commerce-fintech",
        });
      }
      if (pathname === "/api/commerce/checkout/quote" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(calculateCheckoutQuote(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/webhooks/verify" && req.method === "POST") {
        const body = await readJson(req);
        return json(verifyCommerceWebhook(body));
      }
      if (pathname === "/api/commerce/ledger/split" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(computeMarketplaceLedgerSplit(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/shop/state" && req.method === "GET") {
        return json(webShopStore.getState());
      }
      if (pathname === "/api/commerce/shop/cart/items" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(webShopStore.upsertCartItem(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/shop/account" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(webShopStore.createOrMergeCustomerAccount(body), 201);
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/shop/checkout" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(webShopStore.promoteCheckoutToOrder(body), 201);
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/shop/orders/lifecycle" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(webShopStore.transitionOrderLifecycle(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/commerce/shop/catalog-mutate" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(webShopStore.mutateCatalogProduct(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/traffic/overview" && req.method === "GET") {
        return json({
          ...WEB_COOKIES_DATA_TRAFFIC_CATALOG,
          track: "web-cookies-data-traffic",
          categories: ["web-cookies", "web-storage-data", "web-traffic"],
        });
      }
      if (pathname === "/api/traffic/cookies/audit" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(auditAndSerializeWebCookie(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/traffic/cache-trace/simulate" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(simulateHttpTrafficPipeline(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/design/overview" && req.method === "GET") {
        return json(PROPRIETARY_DESIGN_SYSTEM_CATALOG);
      }
      if (pathname === "/api/design/tokens/compile" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(compileDtcgDesignTokens(body.tokens, body.selector || ":root"));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/design/oklch/contrast" && req.method === "POST") {
        const body = await readJson(req);
        try {
          return json(evaluateAndRemediateOklchContrast(body));
        } catch (err) {
          throw new ValidationError(err.message);
        }
      }
      if (pathname === "/api/curriculum/tasks") {
        const category = searchParams.get("category");
        const difficulty = searchParams.get("difficulty");
        const track = searchParams.get("track");
        let tasks = REFACTORING_CURRICULUM_TASKS;
        if (category) tasks = tasks.filter((t) => t.category === category);
        if (difficulty) tasks = tasks.filter((t) => t.difficulty === difficulty);
        if (track) tasks = tasks.filter((t) => t.track === track);
        return json({
          tasks,
          categories: CURRICULUM_CATEGORIES,
          tracks: CURRICULUM_TRACKS,
          difficulties: CURRICULUM_DIFFICULTIES,
        });
      }

      if (pathname === "/api/curriculum/seed" && req.method === "POST") {
        const seeded = await store.seedCurriculumTasks();
        hub?.broadcast({ type: "state", at: Date.now() });
        return json({ seededCount: seeded.length, tasks: seeded });
      }

      if (pathname === "/api/curriculum/verify" && req.method === "POST") {
        const { taskId, code } = await readJson(req);
        const curriculumTask = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
        if (!curriculumTask) throw new HttpError(404, "Curriculum task not found.");

        const cleanSubmitted = String(code || "").trim();
        if (!cleanSubmitted) throw new ValidationError("Submitted code cannot be empty.");

        return json(evaluator.verifyCriteria(taskId, cleanSubmitted));
      }

      /* ── Boards CRUD ──────────────────────────────────────── */
      if (pathname === "/api/boards") {
        if (req.method === "GET") return json({ boards: store.listBoards() });
        if (req.method === "POST") {
          const { name, id } = await readJson(req);
          const board = await store.addBoard(name, id);
          hub?.broadcast({ type: "state", at: Date.now() });
          return json(board, 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      const boardRoute = pathname.match(/^\/api\/boards\/([A-Za-z0-9-_]+)$/);
      if (boardRoute) {
        const id = boardRoute[1];
        if (req.method === "PATCH") {
          const { name } = await readJson(req);
          const board = await store.renameBoard(id, name);
          if (board) hub?.broadcast({ type: "state", at: Date.now() });
          return board ? json(board) : notFound("board");
        }
        if (req.method === "DELETE") {
          const removed = await store.deleteBoard(id);
          if (removed) hub?.broadcast({ type: "state", at: Date.now() });
          return removed ? json(removed) : notFound("board");
        }
        throw new HttpError(405, "Method not allowed.");
      }

      /* ── Tasks CRUD ───────────────────────────────────────── */
      if (pathname === "/api/tasks") {
        if (req.method === "GET") {
          const boardId = searchParams.get("boardId");
          const tasks = boardId ? store.tasksIn(boardId) : store.listTasks();
          return json({ tasks });
        }
        if (req.method === "POST") {
          const body = await readJson(req);
          const task = await store.add(body);
          hub?.broadcast({ type: "state", at: Date.now() });
          return json(task, 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/api/tasks/restore" && req.method === "POST") {
        const { tasks } = await readJson(req);
        const restored = await store.restoreTasks(tasks);
        if (restored.length) hub?.broadcast({ type: "state", at: Date.now() });
        return json({ tasks: restored });
      }

      if (pathname === "/api/tasks/reorder" && req.method === "POST") {
        const body = await readJson(req);
        const tasks = await store.reorder(body.boardId || body.ids, body.ids);
        hub?.broadcast({ type: "state", at: Date.now() });
        return json({ tasks });
      }

      if (pathname === "/api/tasks/clear-completed" && req.method === "POST") {
        const body = await readJson(req);
        const removed = await store.clearCompleted(body.boardId);
        if (removed) hub?.broadcast({ type: "state", at: Date.now() });
        return json({ removed, tasks: store.listTasks() });
      }

      const taskRoute = pathname.match(/^\/api\/tasks\/([A-Za-z0-9-_]+)$/);
      if (taskRoute) {
        const id = taskRoute[1];
        if (req.method === "PATCH") {
          const patch = await readJson(req);
          const task = await store.update(id, patch);
          if (task) hub?.broadcast({ type: "state", at: Date.now() });
          return task ? json(task) : notFound("task");
        }
        if (req.method === "DELETE") {
          const ok = await store.remove(id);
          if (ok) {
            hub?.broadcast({ type: "state", at: Date.now() });
            return noContent();
          }
          return notFound("task");
        }
        throw new HttpError(405, "Method not allowed.");
      }

      /* ── Real-Time Two-User Chat & Instrumentation ────────── */
      if (pathname === "/api/chat/rooms") {
        if (req.method === "GET") {
          return json({
            rooms: chatEngine.listRooms(),
            telemetry: chatEngine.getTelemetry(),
          });
        }
        if (req.method === "POST") {
          const { userA, userB, roomId } = await readJson(req);
          const room = chatEngine.ensureRoom(userA, userB, roomId);
          hub?.broadcast({ type: "chat", event: "room", roomId: room.id, at: Date.now() });
          return json(room, 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/api/chat/messages") {
        if (req.method === "GET") {
          const roomId = searchParams.get("roomId") || "dm:agent:pp";
          const afterSeq = Number(searchParams.get("afterSeq") || 0);
          const limit = Number(searchParams.get("limit") || 100);
          return json(chatEngine.getMessages(roomId, { afterSeq, limit }));
        }
        if (req.method === "POST") {
          const body = await readJson(req);
          const sender = body.sender || currentUser?.username || "agent";
          const recipient = body.recipient || (sender === "agent" ? "pp" : "agent");
          const result = chatEngine.sendMessage({
            roomId: body.roomId,
            sender,
            recipient,
            text: body.text,
            clientMsgId: body.clientMsgId,
            expectedSeq: body.expectedSeq,
            replyToSeq: body.replyToSeq,
          });
          if (result.message && !result.deduplicated) {
            hub?.broadcast({
              type: "chat",
              event: "message",
              roomId: result.message.roomId,
              message: result.message,
              at: Date.now(),
            });
          }
          return json(result, result.deduplicated ? 200 : 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/api/chat/typing" && req.method === "POST") {
        const { roomId = "dm:agent:pp", username, isTyping = true } = await readJson(req);
        const result = chatEngine.setTyping({
          roomId,
          username: username || currentUser?.username || "agent",
          isTyping: Boolean(isTyping),
        });
        hub?.broadcast({ type: "chat", event: "typing", roomId: result.roomId, typingUsers: result.typingUsers, at: Date.now() });
        return json(result);
      }

      if (pathname === "/api/chat/read" && req.method === "POST") {
        const { roomId = "dm:agent:pp", username, upToSeq } = await readJson(req);
        const result = chatEngine.markRead({
          roomId,
          username: username || currentUser?.username || "agent",
          upToSeq: upToSeq !== undefined ? Number(upToSeq) : undefined,
        });
        hub?.broadcast({ type: "chat", event: "read", roomId: result.roomId, readWatermarks: result.readWatermarks, at: Date.now() });
        return json(result);
      }

      if (pathname === "/api/chat/debug" && req.method === "GET") {
        const roomId = searchParams.get("roomId") || "dm:agent:pp";
        return json(chatEngine.runDiagnostics(roomId));
      }

      if (pathname === "/api/chat/benchmark" && req.method === "POST") {
        const body = await readJson(req);
        return json(chatEngine.runBenchmark(body));
      }

      return json({ error: "Unknown endpoint." }, 404);
    } catch (err) {
      if (err instanceof ValidationError) return json({ error: err.message }, 422);
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error("[api]", err);
      return json({ error: "Something broke on the server." }, 500);
    }
  };
}
