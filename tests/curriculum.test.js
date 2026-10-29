import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";
import { REFACTORING_CURRICULUM_TASKS } from "../src/curriculum.js";

let dir;
let taskStore;
let handle;

const call = (method, path, body) =>
  handle(
    new Request(`http://loom.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "loom-curriculum-"));
  taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Agentic Curriculum Refactoring Tasks", () => {
  test("lists pre-configured refactoring curriculum tasks", async () => {
    const res = await call("GET", "/api/curriculum/tasks");
    expect(res.status).toBe(200);
    const { tasks } = await res.json();
    expect(tasks.length).toBeGreaterThanOrEqual(6);
    expect(tasks.some((t) => t.id === "task_refactor_async_pipeline")).toBe(true);
    expect(tasks.some((t) => t.id === "task_refactor_o_n2_lookup")).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(12);
    expect(tasks.some((t) => t.id === "task_refactor_buffer_alloc")).toBe(true);
    expect(tasks.some((t) => t.id === "task_refactor_middleware_pipeline")).toBe(true);
  });

  test("seeds curriculum tasks into the Agentic Refactoring board", async () => {
    const seedRes = await call("POST", "/api/curriculum/seed");
    expect(seedRes.status).toBe(200);
    const { seededCount, tasks } = await seedRes.json();
    expect(seededCount).toBeGreaterThanOrEqual(6);

    const boardTasks = await (await call("GET", "/api/tasks?boardId=board_refactor_curriculum")).json();
    expect(boardTasks.tasks.length).toBeGreaterThanOrEqual(6);
    const asyncTask = boardTasks.tasks.find((t) => t.id === "task_refactor_async_pipeline");
    expect(boardTasks.tasks.length).toBeGreaterThanOrEqual(12);
    expect(asyncTask).toBeTruthy();
    expect(asyncTask.refactorData.starterCode).toContain("fetchUser");
  });

  test("verifies correct agent refactored solution", async () => {
    const solution = `
      async function processUserData(userId) {
        const user = await fetchUser(userId);
        const [prefs, activity] = await Promise.all([
          fetchUserPreferences(user.id),
          fetchRecentActivity(user.id)
        ]);
        const score = await calculateScore(activity, prefs);
        return { user, prefs, activity, score };
      }
    `;

    const res = await call("POST", "/api/curriculum/verify", {
      taskId: "task_refactor_async_pipeline",
      code: solution,
    });

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.score).toBe(100);
    expect(result.passedCriteria.length).toBeGreaterThanOrEqual(3);
  });

  test("flags failing refactored solution", async () => {
    const badCode = `function processUserData(userId) { return null; }`;
    const res = await call("POST", "/api/curriculum/verify", {
      taskId: "task_refactor_async_pipeline",
      code: badCode,
    });

    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(false);
    expect(result.failedCriteria.length).toBeGreaterThan(0);
  });
  test("verifies advanced zero-allocation buffer solution", async () => {
    const solution = `
      function processTelemetryStream(chunks) {
        let buffer = new Uint8Array(1024);
        let slice = buffer.subarray(0, 10);
      }
    `;
    const res = await call("POST", "/api/curriculum/verify", {
      taskId: "task_refactor_buffer_alloc",
      code: solution,
    });
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.passedCriteria).toContain("Uses typed Uint8Arrays instead of raw string concatenation");
  });

  test("verifies database connectivity curriculum tasks (pool, outbox, dataloader)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const dbTasks = tasks.filter((t) => t.category === "database");
    expect(dbTasks.length).toBeGreaterThanOrEqual(3);

    for (const dbTask of dbTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: dbTask.id,
        code: dbTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies deep web-auth curriculum tasks (DPoP, WebAuthn, Refresh Rotation)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const authTasks = tasks.filter((t) => t.category === "web-auth");
    expect(authTasks.length).toBeGreaterThanOrEqual(3);

    for (const authTask of authTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: authTask.id,
        code: authTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies web-fingerprinting curriculum tasks (Entropy Normalizer, JA4/HTTP2, Privacy Budget)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const fpTasks = tasks.filter((t) => t.category === "web-fingerprinting");
    expect(fpTasks.length).toBeGreaterThanOrEqual(3);

    for (const fpTask of fpTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: fpTask.id,
        code: fpTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });
});
