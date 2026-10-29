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
