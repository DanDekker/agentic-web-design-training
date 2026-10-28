/**
 * Desktop / Weaver Curriculum 1M Agentic Tasks — Code Evaluator & Execution Sandbox.
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

    // Safe isolated execution context
    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout,
      clearTimeout,
      setImmediate,
      AbortController,
      Promise,
      Uint8Array,
      Map,
      Set,
      Date,
      Math,
      Array,
      Object,
      exports: {},
    };

    const ctx = createContext(sandbox);

    if (taskId === "task_refactor_o_n2_lookup") {
      // Test execution of O(N) map reconciliation
      const harness = `
        ${code};
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
        ${code};
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
    } else {
      // General syntax evaluation
      runInContext(code, ctx, { timeout: 1000 });
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
