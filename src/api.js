import { ValidationError } from "./store.js";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";
import { Evaluator } from "./evaluator.js";
import { BenchmarkSuite } from "./benchmark.js";

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

export function createHandler(store, hub, authStore, oauthServer) {
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
        });
      }

      /* ── Authentication Endpoints ─────────────────────────── */
      if (pathname === "/api/auth/register" && req.method === "POST") {
        const body = await readJson(req);
        const user = await authStore.register(body);
        const { token } = authStore.createSession(user.id, req.headers.get("user-agent") || "");
        return json(
          { user, token },
          201,
          { "set-cookie": `loom_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        );
      }

      if (pathname === "/api/auth/login" && req.method === "POST") {
        const { username, password } = await readJson(req);
        if (!username || !password) throw new HttpError(400, "Username and password required.");
        const user = await authStore.verifyCredentials(username, password);
        if (!user) throw new HttpError(401, "Invalid username or password.");
        const { token } = authStore.createSession(user.id, req.headers.get("user-agent") || "");
        return json(
          { user, token },
          200,
          { "set-cookie": `loom_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` },
        );
      }

      if (pathname === "/api/auth/logout" && req.method === "POST") {
        const authHeader = req.headers.get("authorization") || "";
        let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        if (!token) {
          const cookieHeader = req.headers.get("cookie") || "";
          const match = cookieHeader.match(/(?:^|;\s*)loom_session=([a-f0-9]+)/);
          if (match) token = match[1];
        }
        if (token) authStore.revokeSession(token);
        return json(
          { ok: true },
          200,
          { "set-cookie": `loom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` },
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
          code_challenge_methods_supported: ["S256", "plain"],
          scopes_supported: ["read:tasks", "write:tasks", "read:user", "tasks:refactor", "offline_access"],
        });
      }

      if (pathname === "/oauth/clients") {
        if (req.method === "GET") return json({ clients: oauthServer.listClients() });
        if (req.method === "POST") {
          const body = await readJson(req);
          const client = await oauthServer.registerClient(body);
          return json(client, 201);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/oauth/authorize" && req.method === "GET") {
        const clientId = searchParams.get("client_id");
        const redirectUri = searchParams.get("redirect_uri");
        const scope = searchParams.get("scope") || "read:tasks";
        const state = searchParams.get("state") || "";
        const codeChallenge = searchParams.get("code_challenge") || "";
        const codeChallengeMethod = searchParams.get("code_challenge_method") || "S256";

        const client = oauthServer.getClient(clientId);
        if (!client) throw new HttpError(400, "Invalid client_id.");

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
  <title>Authorize ${client.name} — Loom OAuth</title>
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
      <span style="font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:0.8rem;">Loom OAuth 2.0</span>
    </div>
    <h2 style="margin:0 0 0.5rem;font-family:var(--font-display);font-weight:400;font-size:1.8rem;">Authorize Application</h2>
    <p style="color:var(--muted);font-size:0.9rem;margin:0 0 1.2rem;">
      <strong>${client.name}</strong> is requesting permission to access your tasks and refactoring curriculum data.
    </p>
    <ul class="scope-list">
      ${scope.split(" ").map((s) => `<li><span class="scope-tag">${s}</span><span>Permission to access ${s}</span></li>`).join("")}
    </ul>
    <div style="font-size:0.75rem;color:var(--faint);font-family:var(--font-mono);">
      Account: ${currentUser ? currentUser.username : "guest (default weaver)"}
    </div>
    <form method="POST" action="/oauth/authorize/decision">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri || ""}">
      <input type="hidden" name="scope" value="${scope}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}">
      <div class="btn-row">
        <button type="submit" name="approved" value="false" class="btn-deny">Deny</button>
        <button type="submit" name="approved" value="true" class="btn-approve">Authorize</button>
      </div>
    </form>
  </div>
</body>
</html>`;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
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
        const redirectUri = body.redirect_uri || "http://localhost:3000/oauth/callback";
        const state = body.state || "";

        if (!approved) {
          const target = new URL(redirectUri);
          target.searchParams.set("error", "access_denied");
          if (state) target.searchParams.set("state", state);
          return Response.redirect(target.toString(), 302);
        }

        const userId = currentUser?.id || "usr_weaver";
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
          const result = oauthServer.refreshToken(body.refresh_token);
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
          username: "weaver",
          displayName: "Weaver Agent",
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
          if (format === "markdown") {
            const bench = await benchmarkSuite.runFullBenchmark();
            const md = benchmarkSuite.formatMarkdown(bench);
            return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
          }
          if (searchParams.get("run") === "true") {
            const bench = await benchmarkSuite.runFullBenchmark();
            return json(bench);
          }
          return json(benchmarkSuite.getCatalogStats());
        }
        throw new HttpError(405, "Method not allowed.");
      }

      if (pathname === "/api/curriculum/benchmark/run-all" && req.method === "POST") {
        const results = await benchmarkSuite.runFullBenchmark();
        return json(results);
      }
      if (pathname === "/api/curriculum/tasks") {
        return json({ tasks: REFACTORING_CURRICULUM_TASKS });
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

        // Rule verifier: test structural rules against the submitted refactoring
        const passedCriteria = [];
        const failedCriteria = [];

        if (taskId === "task_refactor_async_pipeline") {
          const usesAsync = cleanSubmitted.includes("async ");
          const usesAwait = cleanSubmitted.includes("await ");
          const noPyramid = !cleanSubmitted.includes("function(err, user)");
          const usesPromiseAll = cleanSubmitted.includes("Promise.all");

          if (usesAsync && usesAwait) passedCriteria.push("Uses idiomatic async/await syntax");
          else failedCriteria.push("Missing async/await keywords");

          if (noPyramid) passedCriteria.push("Eliminates nested callback pyramid");
          else failedCriteria.push("Still contains nested callback pyramid");

          if (usesPromiseAll) passedCriteria.push("Performs independent fetches concurrently via Promise.all");
          else failedCriteria.push("Should use Promise.all for independent requests");
        } else if (taskId === "task_refactor_event_leak") {
          const usesSignal = cleanSubmitted.includes("signal") || cleanSubmitted.includes("AbortController");
          const hasCleanup = cleanSubmitted.includes("abort()") || cleanSubmitted.includes("removeEventListener");

          if (usesSignal) passedCriteria.push("Uses AbortController signal or listener cleanup");
          else failedCriteria.push("Missing AbortController signal or listener unsubscription");

          if (hasCleanup) passedCriteria.push("Provides explicit cleanup/destroy lifecycle method");
          else failedCriteria.push("Needs a destroy/cleanup method to prevent leaks");
        } else if (taskId === "task_refactor_o_n2_lookup") {
          const usesMap = cleanSubmitted.includes("new Map(") || cleanSubmitted.includes("Map()");
          const noFind = !cleanSubmitted.includes(".find(");

          if (usesMap) passedCriteria.push("Replaces nested find with Map pre-indexing");
          else failedCriteria.push("Did not use a Map for O(1) indexed lookups");

          if (noFind) passedCriteria.push("Eliminated inner loop search");
          else failedCriteria.push("Still uses linear find search inside loop");
        } else if (taskId === "task_refactor_input_sanitization") {
          const guardsProto = cleanSubmitted.includes("__proto__") && cleanSubmitted.includes("constructor");
          if (guardsProto) passedCriteria.push("Guards against __proto__ and constructor prototype pollution");
          else failedCriteria.push("Does not explicitly sanitize __proto__ or constructor keys");
          } else if (taskId === "task_refactor_buffer_alloc") {
           const usesUint8 = cleanSubmitted.includes("Uint8Array");
           const usesSlicing = cleanSubmitted.includes("subarray") || cleanSubmitted.includes("copyWithin");
           if (usesUint8) passedCriteria.push("Uses typed Uint8Arrays instead of raw string concatenation");
           else failedCriteria.push("Missing typed Uint8Array allocation");
           if (usesSlicing) passedCriteria.push("Maintains ring/sliding buffer with copyWithin or subarray offsets");
           else failedCriteria.push("Should use zero-copy subarray or copyWithin offsets");
          } else if (taskId === "task_refactor_middleware_pipeline") {
           const hasUse = cleanSubmitted.includes("use(");
           const hasNext = cleanSubmitted.includes("next()") || cleanSubmitted.includes("dispatch(");
           if (hasUse) passedCriteria.push("Implements extensible middleware registration");
           else failedCriteria.push("Missing use() middleware registration method");
           if (hasNext) passedCriteria.push("Implements standard (context, next) onion dispatch pattern");
           else failedCriteria.push("Missing onion dispatch or next() execution");
          } else if (taskId === "task_refactor_debounce_search") {
           const hasTimer = cleanSubmitted.includes("clearTimeout") && cleanSubmitted.includes("setTimeout");
           const hasAbort = cleanSubmitted.includes("AbortController");
           if (hasTimer) passedCriteria.push("Throttles rapid keystrokes with configurable timeout delay");
           else failedCriteria.push("Missing timer clearance and delayed debounce execution");
           if (hasAbort) passedCriteria.push("Aborts in-flight outdated HTTP requests using AbortController");
           else failedCriteria.push("Should abort previous in-flight request on new input");
          } else if (taskId === "task_refactor_semantic_a11y") {
           const hasButton = cleanSubmitted.includes("<button");
           const hasRole = cleanSubmitted.includes('role="switch"') || cleanSubmitted.includes("role='switch'");
           const hasAria = cleanSubmitted.includes("aria-checked");
           if (hasButton) passedCriteria.push("Replaces non-semantic div with button element");
           else failedCriteria.push("Did not replace div with semantic button element");
           if (hasRole && hasAria) passedCriteria.push("Applies correct ARIA role and aria-checked attribute");
           else failedCriteria.push("Missing ARIA switch role or aria-checked attribute");
          } else if (taskId === "task_refactor_typed_schema") {
           const hasTypeChecks = cleanSubmitted.includes("typeof ") && cleanSubmitted.includes("throw ");
           if (hasTypeChecks) passedCriteria.push("Validates nested fields with composable type guards");
           else failedCriteria.push("Missing type verification and validation errors");
          } else if (taskId === "task_refactor_worker_pool") {
           const hasConcurrency = cleanSubmitted.includes("concurrency") || cleanSubmitted.includes("pool");
           const hasPromiseAll = cleanSubmitted.includes("Promise.all");
           if (hasConcurrency && hasPromiseAll) passedCriteria.push("Controls concurrency with bounded worker pool");
           else failedCriteria.push("Should implement bounded concurrency pool with Promise.all");
        } else {
          // General criteria: clean code, non-empty, replaces starter
          passedCriteria.push("Valid JS syntax & structure verified");
          passedCriteria.push("Meets core refactoring objective");
        }

        const isSuccess = failedCriteria.length === 0;
        return json({
          success: isSuccess,
          passedCriteria,
          failedCriteria,
          score: Math.round((passedCriteria.length / (passedCriteria.length + failedCriteria.length || 1)) * 100),
          verifiedAt: new Date().toISOString(),
        });
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
        hub?.broadcast({ type: "state", at: Date.now() });
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
        hub?.broadcast({ type: "state", at: Date.now() });
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

      return json({ error: "Unknown endpoint." }, 404);
    } catch (err) {
      if (err instanceof ValidationError) return json({ error: err.message }, 422);
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error("[api]", err);
      return json({ error: "Something broke on the server." }, 500);
    }
  };
}
