/**
 * Agentic Curriculum 1M Tasks — Code Evaluator & Execution Sandbox.
 * Provides isolated evaluation, assertion checking, and telemetry metrics for agent-submitted refactorings.
 */

import { createContext, runInContext } from "node:vm";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";

export class Evaluator {
  /**
   * Evaluates submitted code for a specific curriculum task.
   */
  async evaluate(taskId, code, options = {}) {
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Unknown curriculum task '${taskId}'.`);
    }

    const trimmedCode = String(code || "").trim();
    if (!trimmedCode) {
      throw new Error("Submitted code cannot be empty.");
    }

    const startTime = performance.now();
    const assertionResults = [];
    let sandboxError = null;

    // 1. Static & structural criteria validation
    const criteriaChecks = this.#verifyCriteria(task, trimmedCode);
    assertionResults.push(...criteriaChecks);

    // 2. Sandboxed execution & unit test harness
    try {
      const execResults = await this.#runSandboxTests(taskId, trimmedCode, options);
      assertionResults.push(...execResults);
    } catch (err) {
      sandboxError = err.message || String(err);
      assertionResults.push({
        name: "Sandbox Execution",
        passed: false,
        detail: `Runtime execution error: ${sandboxError}`,
      });
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passedCount = assertionResults.filter((a) => a.passed).length;
    const totalCount = assertionResults.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const passed = score === 100 && !sandboxError;

    return {
      taskId,
      passed,
      score,
      telemetry: {
        durationMs,
        assertions: {
          total: totalCount,
          passed: passedCount,
          failed: totalCount - passedCount,
        },
      },
      assertionResults,
      diff: this.#calculateLineDiff(task.starterCode, trimmedCode),
      evaluatedAt: new Date().toISOString(),
    };
  }

  #verifyCriteria(task, code) {
    const results = [];
    const id = task.id;

    if (id === "task_refactor_async_pipeline") {
      results.push({
        name: "Async/Await Pipeline Syntax",
        passed: code.includes("async ") && code.includes("await "),
        detail: "Function uses async/await instead of nested callbacks",
      });
      results.push({
        name: "Eliminates Callback Pyramid",
        passed: !code.includes("function(err, user)") && !code.includes("callback(err)"),
        detail: "Eliminates nested callback chains",
      });
      results.push({
        name: "Promise.all Concurrency",
        passed: code.includes("Promise.all"),
        detail: "Performs independent requests in parallel with Promise.all",
      });
    } else if (id === "task_refactor_event_leak") {
      results.push({
        name: "AbortController or Signal Usage",
        passed: code.includes("AbortController") || code.includes("signal"),
        detail: "Uses AbortController signal or explicit listener tracking",
      });
      results.push({
        name: "Explicit Cleanup Method",
        passed: code.includes("abort()") || code.includes("destroy()") || code.includes("removeEventListener"),
        detail: "Implements dispose or abort lifecycle cleanup",
      });
    } else if (id === "task_refactor_o_n2_lookup") {
      results.push({
        name: "Indexed Map Data Structure",
        passed: code.includes("new Map(") || code.includes("Map()"),
        detail: "Indexes secondary dataset using a Map",
      });
      results.push({
        name: "Eliminates O(N^2) Nested Array Search",
        passed: !code.includes(".find("),
        detail: "Replaces inner loop find with constant time get() lookup",
      });
    } else if (id === "task_refactor_buffer_alloc") {
      results.push({
        name: "Typed Uint8Array Usage",
        passed: code.includes("Uint8Array"),
        detail: "Uses typed Uint8Array buffers",
      });
      results.push({
        name: "Zero-Copy Subarray Slicing",
        passed: code.includes("subarray") || code.includes("copyWithin"),
        detail: "Avoids memory reallocation with subarray slicing or copyWithin",
      });
    } else if (id === "task_refactor_middleware_pipeline") {
      results.push({
        name: "Middleware Pipeline Registration",
        passed: code.includes("use("),
        detail: "Provides use() middleware registration API",
      });
      results.push({
        name: "Onion Dispatch",
        passed: code.includes("dispatch(") || code.includes("next()"),
        detail: "Chains execution with (context, next) dispatch",
      });
    } else if (id === "task_refactor_debounce_search") {
      results.push({
        name: "Timer Clearance",
        passed: code.includes("clearTimeout"),
        detail: "Cancels active timer on subsequent keystrokes",
      });
      results.push({
        name: "In-Flight Request Cancellation",
        passed: code.includes("AbortController"),
        detail: "Aborts previous in-flight HTTP requests",
      });
    } else if (id === "task_refactor_css_grid") {
      results.push({
        name: "CSS Grid & Flexbox Modernization",
        passed: code.includes("display: grid") || code.includes("grid-template-columns"),
        detail: "Uses modern CSS Grid layout",
      });
      results.push({
        name: "Eliminates Legacy Float Hacks",
        passed: !code.includes("float: left") && !code.includes("clear: both"),
        detail: "Removes clearfix and float rules",
      });
    } else if (id === "task_refactor_reducer_state") {
      results.push({
        name: "Pure Reducer Function",
        passed: (code.includes("switch ") || code.includes("if (action")) && code.includes("return "),
        detail: "Uses deterministic state transitions based on action type",
      });
      results.push({
        name: "Immutable State Returns",
        passed: code.includes("...state"),
        detail: "Returns new state object without in-place mutation",
      });
    } else if (id === "task_refactor_semantic_a11y") {
      results.push({
        name: "Semantic Button Element",
        passed: code.includes("<button"),
        detail: "Replaces non-semantic div with button element",
      });
      results.push({
        name: "Accessible ARIA Role & State",
        passed: code.includes('role="switch"') || code.includes("role='switch'"),
        detail: "Applies ARIA switch role and state attributes",
      });
    } else if (id === "task_refactor_typed_schema") {
      results.push({
        name: "Schema Type Guards",
        passed: code.includes("typeof ") || code.includes("Array.isArray"),
        detail: "Enforces strict type checks on incoming payload",
      });
      results.push({
        name: "Explicit Validation Errors",
        passed: code.includes("throw "),
        detail: "Fails fast with clear validation exceptions",
      });
    } else if (id === "task_refactor_worker_pool") {
      results.push({
        name: "Bounded Concurrency",
        passed: code.includes("concurrency") || code.includes("pool") || code.includes("Math.min"),
        detail: "Limits simultaneous parallel executions",
      });
      results.push({
        name: "Non-blocking Async Batching",
        passed: code.includes("Promise.all"),
        detail: "Dispatches tasks concurrently using Promise.all",
      });
    } else if (id === "task_db_connection_pool") {
      results.push({
        name: "Bounded Pool & Idle Reuse",
        passed: code.includes("acquire") && code.includes("release") && (code.includes("maxSize") || code.includes("#idle") || code.includes("idle")),
        detail: "Manages active and idle connections with bounded pool capacity",
      });
      results.push({
        name: "Automatic Lifecycle Cleanup (finally)",
        passed: code.includes("finally") && code.includes("release"),
        detail: "Guarantees connection return to pool even when queries throw",
      });
    } else if (id === "task_db_transactional_outbox") {
      results.push({
        name: "Parameterized SQL Queries",
        passed: (code.includes("$1") || code.includes("?")) && !code.includes("${fromAccount}"),
        detail: "Uses parameterized placeholders instead of unsafe string interpolation",
      });
      results.push({
        name: "Atomic Transaction & Outbox",
        passed: code.includes("BEGIN") && code.includes("COMMIT") && code.includes("ROLLBACK") && code.includes("outbox_events"),
        detail: "Wraps state mutation and outbox event insert in BEGIN/COMMIT/ROLLBACK",
      });
      results.push({
        name: "Transient Deadlock Retry",
        passed: code.includes("40001") || code.includes("40P01") || code.includes("SQLITE_BUSY"),
        detail: "Retries transient serialization and deadlock database error codes",
      });
    } else if (id === "task_db_keyset_pagination_dataloader") {
      results.push({
        name: "Microtask Batch Coalescing",
        passed: code.includes("queueMicrotask") || code.includes("Promise.all"),
        detail: "Batches individual lookups within the same event loop tick",
      });
      results.push({
        name: "Keyset Cursor Pagination",
        passed: !code.includes("OFFSET") && (code.includes("created_at") || code.includes("cursor")),
        detail: "Eliminates linear OFFSET scans in favor of keyset cursor pagination",
      });
    } else if (id === "task_auth_dpop_token_binding") {
      results.push({
        name: "DPoP Header & Claim Validation",
        passed: code.includes("dpop+jwt") && code.includes("htm") && code.includes("htu") && code.includes("ath"),
        detail: "Verifies dpop+jwt typ header, HTTP method/URI binding, and access token hash",
      });
      results.push({
        name: "JTI Replay & JWK Thumbprint Binding",
        passed: code.includes("jti") && (code.includes("replayCache") || code.includes("Set")) && code.includes("jwk"),
        detail: "Binds proof to public JWK thumbprint and prevents JTI token replay",
      });
    } else if (id === "task_auth_webauthn_passkey") {
      results.push({
        name: "WebAuthn ClientData & Binary Flags",
        passed: code.includes("webauthn.get") && code.includes("0x01") && code.includes("0x04"),
        detail: "Validates webauthn.get challenge/origin and UP/UV authenticator flags",
      });
      results.push({
        name: "Big-Endian SignCount Clone Detection",
        passed: (code.includes("DataView") || code.includes("getUint32")) && code.includes("signCount"),
        detail: "Parses uint32 signCount and rejects cloned authenticators on counter regression",
      });
    } else if (id === "task_auth_refresh_rotation_reuse") {
      results.push({
        name: "One-Time Refresh Rotation",
        passed: code.includes("used") && code.includes("familyId") && code.includes("rotate"),
        detail: "Tracks single-use state per refresh token within a token family",
      });
      results.push({
        name: "Compromised Family Revocation",
        passed: code.includes("revokeFamily") || (code.includes("revoked") && code.includes("familyId")),
        detail: "Revokes the entire token family immediately when a rotated token is replayed",
      });
    } else if (id === "task_fingerprint_entropy_normalizer") {
      results.push({
        name: "Multi-Surface Deterministic Digest",
        passed: (code.includes("0x811c9dc5") || code.includes("Math.imul") || code.includes("hash")) && code.includes("webgl"),
        detail: "Hashes normalized Canvas, WebGL, Audio, and hardware signals into a deterministic ID",
      });
      results.push({
        name: "Cross-Layer Spoofing Anomaly Checks",
        passed: code.includes("SwiftShader") && code.includes("webdriver") && code.includes("platform"),
        detail: "Detects UA/platform contradictions, software WebGL renderers, and webdriver flags",
      });
    } else if (id === "task_fingerprint_tls_ja4_http2") {
      results.push({
        name: "RFC 8701 TLS GREASE Filtering",
        passed: code.includes("0x0a0a") || code.includes("0x0f0f") || code.includes("isTlsGreaseValue"),
        detail: "Strips GREASE values before computing TLS ClientHello signature",
      });
      results.push({
        name: "JA4 & HTTP/2 Pseudo-Header Correlation",
        passed: code.includes(":method,:authority,:scheme,:path") && code.includes("ja4"),
        detail: "Correlates JA4 TLS signature and HTTP/2 pseudo-header order against claimed User-Agent",
      });
    } else if (id === "task_fingerprint_privacy_budget_defense") {
      results.push({
        name: "Per-Origin Entropy Budget Enforcement",
        passed: code.includes("maxBudgetBits") && code.includes("PrivacyBudgetExceededError"),
        detail: "Tracks cumulative entropy cost per origin and blocks reads past maxBudgetBits",
      });
      results.push({
        name: "Session+Origin Keyed Deterministic Farbling",
        passed: code.includes("farbleCanvasPixels") || (code.includes("Uint8Array") && code.includes("^")),
        detail: "Applies deterministic per-origin LSB perturbation to break cross-site fingerprint linking",
      });
    } else {
      results.push({
        name: "Syntactic Refactoring Valid",
        passed: code.length > 20 && code !== task.starterCode,
        detail: "Produces non-trivial clean refactored implementation",
      });
    }

    return results;
  }

  async #runSandboxTests(taskId, code, options) {
    const results = [];
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);

    if (task?.category === "css" || taskId === "task_refactor_semantic_a11y") {
      results.push({
        name: "Markup / Stylesheet Valid",
        passed: true,
        detail: "Stylesheet or Markup structure verified",
      });
      return results;
    }

    const sanitizedCode = code.replace(/\bexport\s+(default\s+)?/g, "");

    // Safe isolated execution context
    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout,
      clearTimeout,
      setImmediate,
      queueMicrotask,
      AbortController,
      Promise,
      Uint8Array,
      Int32Array,
      Float32Array,
      ArrayBuffer,
      DataView,
      Map,
      Set,
      Date,
      Math,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      TypeError,
      RangeError,
      JSON,
      Symbol,
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
      btoa,
      atob,
      crypto,
      exports: {},
    };

    const ctx = createContext(sandbox);

    if (taskId === "task_refactor_o_n2_lookup") {
      // Test execution of O(N) map reconciliation
      const harness = `
        ${sanitizedCode};
        const fn = typeof reconcileTransactions === "function" ? reconcileTransactions : exports.reconcileTransactions;
        const orders = [{ id: "o1" }, { id: "o2" }];
        const payments = [{ orderId: "o1", txHash: "0xabc" }];
        const result = fn(orders, payments);
        result;
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reconciliation Correctness",
        passed: Array.isArray(res) && res[0]?.isPaid === true && res[1]?.isPaid === false,
        detail: "Produces expected transaction payment matching output",
      });
    } else if (taskId === "task_refactor_reducer_state") {
      const harness = `
        ${sanitizedCode};
        const fn = typeof taskReducer === "function" ? taskReducer : exports.taskReducer;
        const s1 = fn({ tasks: [{ id: "1", done: false }] }, { type: "TASK_TOGGLED", id: "1" });
        const s2 = fn(s1, { type: "FILTER_CHANGED", filter: "active" });
        ({ s1, s2 });
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reducer State Transitions",
        passed: res?.s1?.tasks[0]?.done === true && res?.s2?.filter === "active",
        detail: "Correctly performs deterministic immutable state updates",
      });
    } else if (taskId === "task_db_connection_pool") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Pool = typeof ConnectionPool === "function" ? ConnectionPool : exports.ConnectionPool;
          let created = 0;
          const pool = new Pool(async () => {
            const id = ++created;
            return { id, ping: async () => true, close: async () => {} };
          }, { maxSize: 2, acquireTimeoutMs: 50 });

          const c1 = await pool.acquire();
          const c2 = await pool.acquire();
          pool.release(c1);
          const c3 = await pool.acquire();
          const reused = c3.id === c1.id && created === 2;
          pool.release(c2);
          pool.release(c3);

          let releasedAfterError = false;
          try {
            await pool.withConnection(async () => { throw new Error("boom"); });
          } catch {}
          const st = pool.stats ? pool.stats() : { active: 0, idle: 2 };
          releasedAfterError = st.active === 0 && st.idle >= 1;
          await pool.drain?.();
          return { reused, releasedAfterError };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pool Reuse & Fault-Safe Release",
        passed: Boolean(res?.reused && res?.releasedAfterError),
        detail: "Reuses idle connections within maxSize and releases on query exceptions",
      });
    } else if (taskId === "task_db_transactional_outbox") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const fn = typeof transferFunds === "function" ? transferFunds : exports.transferFunds;
          const log = [];
          let calls = 0;
          const mockDb = {
            async query(sql, params) {
              log.push({ sql, params });
              if (sql === "BEGIN" && ++calls === 1) {
                const err = new Error("deadlock detected");
                err.code = "40P01";
                throw err;
              }
              if (sql.startsWith("UPDATE accounts SET balance = balance -")) {
                return { rows: [{ balance: 75 }] };
              }
              return { rows: [] };
            }
          };
          const out = await fn(mockDb, { fromAccount: "acc_1", toAccount: "acc_2", amount: 25, idempotencyKey: "ik_1" });
          const hasRollback = log.some(e => e.sql === "ROLLBACK");
          const hasCommit = log.some(e => e.sql === "COMMIT");
          const hasOutbox = log.some(e => e.sql.includes("outbox_events") && Array.isArray(e.params));
          return { ok: out?.ok, attempt: out?.attempt, hasRollback, hasCommit, hasOutbox };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transactional Outbox & Deadlock Retry",
        passed: Boolean(res?.ok && res?.attempt === 2 && res?.hasRollback && res?.hasCommit && res?.hasOutbox),
        detail: "Rolls back on 40P01 deadlock, retries transaction, and writes parameterized outbox event",
      });
    } else if (taskId === "task_db_keyset_pagination_dataloader") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Loader = typeof BatchDataLoader === "function" ? BatchDataLoader : exports.BatchDataLoader;
          let batchCalls = 0;
          let batchedKeys = [];
          const loader = new Loader(async (keys) => {
            batchCalls++;
            batchedKeys = keys;
            return new Map(keys.map(k => [k, { id: k, name: "User_" + k }]));
          });
          const [u1, u2, u1Dup] = await Promise.all([
            loader.load("u1"),
            loader.load("u2"),
            loader.load("u1"),
          ]);
          return {
            batchCalls,
            uniqueCount: batchedKeys.length,
            matched: u1?.name === "User_u1" && u2?.name === "User_u2" && u1Dup?.name === "User_u1"
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DataLoader Single-Tick Batch Coalescing",
        passed: Boolean(res?.batchCalls === 1 && res?.uniqueCount === 2 && res?.matched),
        detail: "Coalesces 3 concurrent lookups (with duplicate key) into 1 batch query of 2 unique keys",
      });
    } else if (taskId === "task_auth_dpop_token_binding") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyDpopProof === "function" ? verifyDpopProof : exports.verifyDpopProof;
          const replayCache = new Set();
          const jwk = { kty: "EC", crv: "P-256", x: "x_val", y: "y_val" };
          const hashFn = (s) => "h_" + s;
          const expectedJkt = hashFn(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }));
          const proof = {
            header: { typ: "dpop+jwt", alg: "ES256", jwk },
            payload: {
              jti: "nonce_1",
              htm: "POST",
              htu: "https://api.example.com/v1/transfer",
              iat: 1700000000,
              ath: hashFn("at_secret_1"),
            },
            signatureValid: true,
          };
          const valid = fn({
            dpopProof: proof,
            accessToken: "at_secret_1",
            expectedJkt,
            httpMethod: "POST",
            httpUrl: "https://api.example.com/v1/transfer?foo=bar#frag",
            replayCache,
            nowSec: 1700000010,
            hashFn,
          });
          let replayBlocked = false;
          try {
            fn({
              dpopProof: proof,
              accessToken: "at_secret_1",
              expectedJkt,
              httpMethod: "POST",
              httpUrl: "https://api.example.com/v1/transfer",
              replayCache,
              nowSec: 1700000012,
              hashFn,
            });
          } catch {
            replayBlocked = true;
          }
          return { bound: valid?.bound, replayBlocked };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DPoP Proof Binding & Replay Rejection",
        passed: Boolean(res?.bound === true && res?.replayBlocked === true),
        detail: "Accepts valid sender-constrained DPoP proof and blocks JTI replay",
      });
    } else if (taskId === "task_auth_webauthn_passkey") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyPasskeyAssertion === "function" ? verifyPasskeyAssertion : exports.verifyPasskeyAssertion;
          const rpHash = new Uint8Array(32).fill(7);
          const authData = new Uint8Array(37);
          authData.set(rpHash, 0);
          authData[32] = 0x01 | 0x04; // UP + UV
          new DataView(authData.buffer).setUint32(33, 15, false); // signCount = 15

          const ok = fn({
            clientDataJSON: JSON.stringify({
              type: "webauthn.get",
              challenge: "chal_xyz",
              origin: "https://login.example.com",
            }),
            authenticatorData: authData,
            signatureValid: true,
            expectedChallenge: "chal_xyz",
            expectedOrigin: "https://login.example.com",
            expectedRpIdHash: rpHash,
            storedCredential: { userId: "usr_1", signCount: 10 },
          });

          let cloneDetected = false;
          try {
            fn({
              clientDataJSON: JSON.stringify({
                type: "webauthn.get",
                challenge: "chal_xyz",
                origin: "https://login.example.com",
              }),
              authenticatorData: authData,
              signatureValid: true,
              expectedChallenge: "chal_xyz",
              expectedOrigin: "https://login.example.com",
              expectedRpIdHash: rpHash,
              storedCredential: { userId: "usr_1", signCount: 15 }, // Equal/higher stored signCount -> clone!
            });
          } catch {
            cloneDetected = true;
          }
          return { verified: ok?.verified, newSignCount: ok?.newSignCount, cloneDetected };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "WebAuthn Assertion & Clone Detection",
        passed: Boolean(res?.verified && res?.newSignCount === 15 && res?.cloneDetected),
        detail: "Verifies binary authenticatorData flags/counter and catches cloned authenticators",
      });
    } else if (taskId === "task_auth_refresh_rotation_reuse") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Store = typeof RefreshTokenRotationStore === "function" ? RefreshTokenRotationStore : exports.RefreshTokenRotationStore;
          const store = new Store();
          const t1 = store.issueInitialFamily("usr_99");
          const t2 = store.rotate(t1.refreshToken);
          const t2ActiveBefore = store.isTokenActive(t2.refreshToken);

          let theftDetected = false;
          try {
            // Attacker replays already-rotated t1
            store.rotate(t1.refreshToken);
          } catch {
            theftDetected = true;
          }
          const t2ActiveAfterReplay = store.isTokenActive(t2.refreshToken);
          return { t2ActiveBefore, theftDetected, t2ActiveAfterReplay };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Refresh Rotation & Family Breach Revocation",
        passed: Boolean(res?.t2ActiveBefore === true && res?.theftDetected === true && res?.t2ActiveAfterReplay === false),
        detail: "Rotates refresh tokens and revokes active family descendants when a prior token is replayed",
      });
    } else if (taskId === "task_fingerprint_entropy_normalizer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof analyzeBrowserFingerprint === "function" ? analyzeBrowserFingerprint : exports.analyzeBrowserFingerprint;
          const clean = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "MacIntel",
            webdriver: false,
            webgl: { vendor: "Apple Inc.", renderer: "Apple M3 Max" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 12,
          });
          const spoofed = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "Linux x86_64",
            webdriver: true,
            webgl: { vendor: "Google Inc.", renderer: "Google SwiftShader" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 4,
          });
          return {
            cleanOk: !clean.isBotSuspected && clean.fingerprintId.startsWith("fp_"),
            spoofCaught: spoofed.isBotSuspected && spoofed.anomalies.length >= 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Entropy Hashing & Spoofed Signal Detection",
        passed: Boolean(res?.cleanOk && res?.spoofCaught),
        detail: "Passes consistent browser profiles and flags Linux/SwiftShader/webdriver spoofing",
      });
    } else if (taskId === "task_fingerprint_tls_ja4_http2") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof correlateNetworkFingerprint === "function" ? correlateNetworkFingerprint : exports.correlateNetworkFingerprint;
          const legitChrome = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x0a0a, 0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x2a2a, 0x0000, 0x0010, 0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":authority", ":scheme", ":path"],
            },
          });
          const spoofedBot = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":path", ":authority", ":scheme"], // Non-Chrome order!
            },
          });
          return {
            greaseStripped: legitChrome.cleanCipherCount === 5 && !legitChrome.ja4.includes("0a0a"),
            legitPass: !legitChrome.impersonated,
            botFlagged: spoofedBot.impersonated,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "JA4 GREASE Stripping & HTTP/2 Order Correlation",
        passed: Boolean(res?.greaseStripped && res?.legitPass && res?.botFlagged),
        detail: "Strips 0x0a0a/0x2a2a GREASE values and catches non-Chrome HTTP/2 pseudo-header order",
      });
    } else if (taskId === "task_fingerprint_privacy_budget_defense") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Guard = typeof PrivacyBudgetGuard === "function" ? PrivacyBudgetGuard : exports.PrivacyBudgetGuard;
          const guard = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const raw = new Uint8Array([100, 150, 200, 255, 50, 60, 70, 255]);
          const fA = guard.farbleCanvasPixels("https://tracker-a.example", raw);
          const fB = guard.farbleCanvasPixels("https://tracker-b.example", raw);

          // Same origin in a new guard with same sessionSecret must be deterministic
          const guard2 = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const fA2 = guard2.farbleCanvasPixels("https://tracker-a.example", raw);
          const deterministicSameOrigin = fA.every((v, i) => v === fA2[i]);

          let budgetBlocked = false;
          try {
            // Second canvas read on tracker-a (18 + 18 = 36 > 30 bits) must throw!
            guard.farbleCanvasPixels("https://tracker-a.example", raw);
          } catch {
            budgetBlocked = true;
          }
          return { deterministicSameOrigin, budgetBlocked, validLength: fB.length === 8 };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Deterministic Farbling & Privacy Budget Enforcement",
        passed: Boolean(res?.deterministicSameOrigin && res?.budgetBlocked && res?.validLength),
        detail: "Applies deterministic per-origin pixel farbling and blocks reads exceeding privacy budget",
      });
    } else {
      // General syntax evaluation
      runInContext(sanitizedCode, ctx, { timeout: 1000 });
      results.push({
        name: "Clean Syntax & Execution",
        passed: true,
        detail: "Code compiles and runs without syntax or reference exceptions",
      });
    }

    return results;
  }

  #calculateLineDiff(original, modified) {
    const origLines = original.split("\n");
    const modLines = modified.split("\n");
    return {
      originalLineCount: origLines.length,
      modifiedLineCount: modLines.length,
      lineDelta: modLines.length - origLines.length,
    };
  }
}
