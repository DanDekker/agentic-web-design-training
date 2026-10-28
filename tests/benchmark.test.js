import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { BenchmarkSuite } from "../src/benchmark.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let handle;
let suite;

const call = (method, path, body) =>
  handle(
    new Request(`http://loom.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "loom-bench-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  suite = new BenchmarkSuite();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Weaver 1M Curriculum Benchmark Suite", () => {
  test("generates catalog stats with difficulty and category distribution", async () => {
    const stats = suite.getCatalogStats();
    expect(stats.totalTasks).toBeGreaterThanOrEqual(12);
    expect(stats.byDifficulty.intermediate).toBeGreaterThan(0);
    expect(stats.byCategory.async).toBeGreaterThan(0);
    expect(stats.byCategory.performance).toBeGreaterThan(0);

    const res = await call("GET", "/api/curriculum/benchmark");
    expect(res.status).toBe(200);
    const apiStats = await res.json();
    expect(apiStats.totalTasks).toBe(stats.totalTasks);
  });

  test("runs automated benchmark across curriculum reference solutions", async () => {
    const res = await call("POST", "/api/curriculum/benchmark/run-all");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.totalTasks).toBeGreaterThanOrEqual(12);
    expect(data.summary.passedTasks).toBeGreaterThanOrEqual(10);
    expect(typeof data.summary.totalDurationMs).toBe("number");
    expect(data.results.length).toBe(data.summary.totalTasks);
  });

  test("exports formatted Markdown benchmark report", async () => {
    const res = await call("GET", "/api/curriculum/benchmark?format=markdown");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const markdown = await res.text();
    expect(markdown).toContain("# Weaver 1M Agentic Benchmark Report");
    expect(markdown).toContain("| Task Title | Category | Difficulty |");
    expect(markdown).toContain("PASSED");
  });
});
