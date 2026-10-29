import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { Evaluator } from "../src/evaluator.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let handle;
let evaluator;

const call = (method, path, body) =>
  handle(
    new Request(`http://loom.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "loom-eval-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  evaluator = new Evaluator();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Agentic Evaluator & Execution Sandbox", () => {
  test("evaluates O(N^2) optimization with real sandboxed execution", async () => {
    const code = `
      function reconcileTransactions(orders, payments) {
        const paymentMap = new Map();
        for (const payment of payments) {
          paymentMap.set(payment.orderId, payment);
        }
        return orders.map(order => {
          const match = paymentMap.get(order.id);
          return {
            ...order,
            isPaid: Boolean(match),
            paymentReference: match ? match.txHash : null
          };
        });
      }
    `;

    const res = await call("POST", "/api/curriculum/evaluate", {
      taskId: "task_refactor_o_n2_lookup",
      code,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.passed).toBe(true);
    expect(data.score).toBe(100);
    expect(typeof data.telemetry.durationMs).toBe("number");
    expect(data.assertionResults.length).toBeGreaterThanOrEqual(3);
    expect(data.diff).toHaveProperty("lineDelta");
  });

  test("evaluates pure reducer state transitions in sandbox", async () => {
    const code = `
      function taskReducer(state, action) {
        if (action.type === "TASK_TOGGLED") {
          return {
            ...state,
            tasks: state.tasks.map(t => t.id === action.id ? { ...t, done: !t.done } : t)
          };
        }
        if (action.type === "FILTER_CHANGED") {
          return { ...state, filter: action.filter };
        }
        return state;
      }
    `;

    const result = await evaluator.evaluate("task_refactor_reducer_state", code);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.assertionResults.some((a) => a.name === "Reducer State Transitions")).toBe(true);
  });

  test("captures runtime syntax and execution errors in sandbox", async () => {
    const code = `throw new Error("Syntax detonation");`;
    const result = await evaluator.evaluate("task_refactor_async_pipeline", code);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.assertionResults.some((a) => !a.passed)).toBe(true);
  });

  test.each([
    "/* new Map() */ function broken( {",
    "<div>new Map()</div>",
  ])("does not let a JavaScript submission bypass execution: %s", async (code) => {
    const result = await evaluator.evaluate("task_refactor_o_n2_lookup", code);
    expect(result.passed).toBe(false);
    expect(result.assertionResults.some((assertion) => assertion.name === "Sandbox Execution" && !assertion.passed)).toBe(true);
  });

  test("evaluates database connection pool, transactional outbox, and dataloader tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_db_connection_pool",
      "task_db_transactional_outbox",
      "task_db_keyset_pagination_dataloader",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates deep web-auth tasks (DPoP, WebAuthn Passkey, Refresh Token Rotation) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_auth_dpop_token_binding",
      "task_auth_webauthn_passkey",
      "task_auth_refresh_rotation_reuse",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates web-fingerprinting tasks (Entropy Normalizer, JA4+ TLS/HTTP2, Privacy Budget Farbling) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_fingerprint_entropy_normalizer",
      "task_fingerprint_tls_ja4_http2",
      "task_fingerprint_privacy_budget_defense",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates web-cybersec tasks (SSRF DNS Rebind, Trusted Types CSP, Timing-Safe Webhook/CSRF) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_cybersec_ssrf_dns_rebind",
      "task_cybersec_csp_trusted_types_dom",
      "task_cybersec_timing_safe_webhook_csrf",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates long-horizon agentic-workflow tasks (DAG Saga, Circuit Breaker, Episodic Memory) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_agentic_dag_planner_saga",
      "task_agentic_tool_circuit_breaker_budget",
      "task_agentic_episodic_memory_compactor",
      "task_agentic_multi_agent_consensus_arbiter",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates real-time two-user chat tasks (Instrumentation, Debugging, Protocol Refactor, RingBuffer Benchmark) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_chat_realtime_instrumentation",
      "task_chat_debug_race_duplication",
      "task_chat_refactor_state_protocol",
      "task_chat_perf_ringbuffer_fanout_bench",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("every single task in the 36-task curriculum has both static criteria and sandbox assertions", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    expect(REFACTORING_CURRICULUM_TASKS.length).toBe(36);
    for (const task of REFACTORING_CURRICULUM_TASKS) {
      const res = await evaluator.evaluate(task.id, task.solutionCode);
      expect(res.passed).toBe(true);
      expect(res.score).toBe(100);
      expect(res.assertionResults.length).toBeGreaterThanOrEqual(3);
    }
  });
});
