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
    new Request(`http://gauntlet-web.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-bench-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  suite = new BenchmarkSuite();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Agentic 1M Curriculum Benchmark Suite", () => {
  test("generates catalog stats with difficulty and category distribution", async () => {
    const stats = suite.getCatalogStats();
    expect(stats.totalTasks).toBe(219);
    expect(stats.byDifficulty.intermediate).toBeGreaterThan(0);
    expect(stats.byDifficulty.advanced).toBeGreaterThanOrEqual(81);
    expect(stats.byCategory.async).toBeGreaterThan(0);
    expect(stats.byCategory.performance).toBeGreaterThan(0);
    expect(stats.byCategory.css).toBe(56);
    expect(stats.byCategory.database).toBe(4);
    expect(stats.byCategory["web-auth"]).toBe(4);
    expect(stats.byCategory["web-fingerprinting"]).toBe(4);
    expect(stats.byCategory["web-cybersec"]).toBe(4);
    expect(stats.byCategory["agentic-workflow"]).toBe(4);
    expect(stats.byCategory["realtime-chat"]).toBe(4);
    expect(stats.byCategory["ts-frameworks"]).toBe(4);
    expect(stats.byCategory["framework-migration"]).toBe(6);
    expect(stats.byCategory["package-managers"]).toBe(4);
    expect(stats.byCategory["html-architecture"]).toBe(12);
    expect(stats.byCategory["seo-structured-data"]).toBe(5);
    expect(stats.byCategory["technical-seo"]).toBe(6);
    expect(stats.byCategory["ecommerce-checkout"]).toBe(5);
    expect(stats.byCategory["payment-processing"]).toBe(5);
    expect(stats.byCategory["storefront-ui"]).toBe(5);
    expect(stats.byCategory["order-lifecycle-data"]).toBe(5);
    expect(stats.byCategory["web-cookies"]).toBe(4);
    expect(stats.byCategory["web-storage-data"]).toBe(4);
    expect(stats.byCategory["web-traffic"]).toBe(4);
    expect(stats.byCategory["proprietary-design-systems"]).toBe(4);
    expect(stats.byCategory["ui-ux-interaction"]).toBe(4);
    expect(stats.byCategory["web-components"]).toBe(4);
    expect(stats.byCategory.webgpu).toBe(3);
    expect(stats.byCategory.webrtc).toBe(3);
    expect(stats.byCategory.webcodecs).toBe(3);
    expect(stats.byTrack["enterprise-typescript"]).toBe(14);
    expect(stats.byTrack["css-engineering"]).toBe(56);
    expect(stats.byTrack["semantic-web-seo"]).toBe(23);
    expect(stats.byTrack["commerce-fintech"]).toBe(10);
    expect(stats.byTrack["storefront-order-lifecycle"]).toBe(10);
    expect(stats.byTrack["web-cookies-data-traffic"]).toBe(12);
    expect(stats.byTrack["design-systems-web-components"]).toBe(12);
    expect(stats.byTrack["gpu-realtime-media"]).toBe(9);

    const res = await call("GET", "/api/curriculum/benchmark");
    expect(res.status).toBe(200);
    const apiStats = await res.json();
    expect(apiStats.totalTasks).toBe(stats.totalTasks);
  });

  test("filters curriculum tasks and benchmarks by domain category", async () => {
    const res = await call("GET", "/api/curriculum/tasks?category=agentic-workflow");
    expect(res.status).toBe(200);
    const { tasks } = await res.json();
    expect(tasks.length).toBe(4);
    expect(tasks.every((t) => t.category === "agentic-workflow")).toBe(true);

    const benchRes = await call("POST", "/api/curriculum/benchmark/run-all", {
      category: "web-cybersec",
    });
    expect(benchRes.status).toBe(200);
    const benchData = await benchRes.json();
    expect(benchData.summary.totalTasks).toBe(4);
    expect(benchData.summary.passedTasks).toBe(4);
  });

  test("runs automated benchmark across curriculum reference solutions", async () => {
    const res = await call("POST", "/api/curriculum/benchmark/run-all");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.totalTasks).toBeGreaterThanOrEqual(12);
    expect(data.summary.passedTasks).toBe(data.summary.totalTasks);
    expect(data.summary.failedTasks).toBe(0);
    expect(typeof data.summary.totalDurationMs).toBe("number");
    expect(data.results.length).toBe(data.summary.totalTasks);
  });

  test("exports formatted Markdown benchmark report", async () => {
    const res = await call("GET", "/api/curriculum/benchmark?format=markdown");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const markdown = await res.text();
    expect(markdown).toContain("# gauntlet-web Benchmark Report");
    expect(markdown).toContain("## Category Breakdown");
    expect(markdown).toContain("| Task Title | Category | Difficulty |");
    expect(markdown).toContain("PASSED");
  });

  test("Markdown report keeps task text inside table cells", () => {
    const category = "css|layout";
    const title = "CSS | `grid` *literal*\n<script>alert(1)</script> [docs](https://example.test)";
    const report = suite.formatMarkdown({
      timestamp: "2026-01-01T00:00:00Z",
      summary: { totalTasks: 1, passedTasks: 1, passRate: "100%", averageScore: 100, averageDurationMs: 1, totalDurationMs: 1,
        byCategory: { [category]: { passed: 1, total: 1 } } },
      results: [{ title, category, difficulty: "advanced|custom", score: 100, durationMs: 1, passed: true }],
    });
    const html = Bun.markdown.html(report, { autolinks: true });
    const tables = html.match(/<table>[\s\S]*?<\/table>/g);
    expect(tables).toHaveLength(2);
    const rows = tables[1].match(/<tbody>[\s\S]*?<\/tbody>/)?.[0] ?? "";
    expect((rows.match(/<td(?:\s[^>]*)?>/g) ?? [])).toHaveLength(6);
    expect(rows).toContain("CSS | `grid` *literal* &lt;script&gt;alert(1)&lt;/script&gt; [docs](https://example.test)");
    expect(rows).toContain("css|layout");
    expect(rows).not.toContain("<script>");
    expect(rows).not.toContain("<a ");
  });
});
