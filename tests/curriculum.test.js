import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";
import {
  REFACTORING_CURRICULUM_TASKS,
  CURRICULUM_CATEGORIES,
  CURRICULUM_TRACKS,
  validateCurriculumCatalog,
} from "../src/curriculum.js";

let dir;
let taskStore;
let handle;

const call = (method, path, body) =>
  handle(
    new Request(`http://gauntlet-web.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-curriculum-"));
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

  test("verifies web-cybersec curriculum tasks (SSRF DNS Rebind, Trusted Types CSP, Timing-Safe CSRF)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const secTasks = tasks.filter((t) => t.category === "web-cybersec");
    expect(secTasks.length).toBeGreaterThanOrEqual(3);

    for (const secTask of secTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: secTask.id,
        code: secTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies long-horizon agentic-workflow curriculum tasks (DAG Saga, Circuit Breaker, Episodic Memory)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const agenticTasks = tasks.filter((t) => t.category === "agentic-workflow");
    expect(agenticTasks.length).toBeGreaterThanOrEqual(3);

    for (const wfTask of agenticTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: wfTask.id,
        code: wfTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies real-time two-user chat curriculum tasks (Instrumentation, Debugging, Protocol Refactor, RingBuffer Benchmark)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks");
    const { tasks } = await tasksRes.json();
    const chatTasks = tasks.filter((t) => t.category === "realtime-chat");
    expect(chatTasks.length).toBeGreaterThanOrEqual(4);

    for (const chatTask of chatTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: chatTask.id,
        code: chatTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies the CSS engineering track from legacy renewals through modern platform features", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=css");
    const { tasks: cssTasks } = await tasksRes.json();
    expect(cssTasks.length).toBe(53);

    for (const cssTask of cssTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: cssTask.id,
        code: cssTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Fortune 500 TypeScript framework tasks (React 19/Next.js, Angular Signals, NestJS DI, tRPC+Zod)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=ts-frameworks");
    const { tasks: tsTasks } = await tasksRes.json();
    expect(tsTasks.length).toBe(4);

    for (const tsTask of tsTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: tsTask.id,
        code: tsTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies cross-framework TypeScript migration tasks (Express->Hono, React->Svelte5/Vue3, Redux->TanStack, Pages->App Router)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=framework-migration");
    const { tasks: migTasks } = await tasksRes.json();
    expect(migTasks.length).toBe(4);

    for (const migTask of migTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: migTask.id,
        code: migTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies multi-runtime & package manager ecosystem tasks (npm/pnpm/Yarn/Bun/Deno/JSR)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=package-managers");
    const { tasks: pkgTasks } = await tasksRes.json();
    expect(pkgTasks.length).toBe(4);

    for (const pkgTask of pkgTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: pkgTask.id,
        code: pkgTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies HTML architecture tasks across native forms, Shadow DOM, invoker commands, media, and module maps", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=html-architecture");
    const { tasks: htmlTasks } = await tasksRes.json();
    expect(htmlTasks.length).toBe(8);

    for (const htmlTask of htmlTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: htmlTask.id,
        code: htmlTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Technical SEO, JSON-LD @graph & Schema.org structured data tasks", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=seo-structured-data");
    const { tasks: seoTasks } = await tasksRes.json();
    expect(seoTasks.length).toBe(5);

    for (const seoTask of seoTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: seoTask.id,
        code: seoTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies the technical SEO crawl and indexing category", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=technical-seo");
    const { tasks: technicalSeoTasks } = await tasksRes.json();
    expect(technicalSeoTasks.length).toBe(6);

    for (const task of technicalSeoTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: task.id,
        code: task.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies E-Commerce & Checkout engineering tasks (Dinero cents, Inventory TTL holds, EU VAT Reverse Charge, 3DS Saga, Polar.sh MoR entitlements)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=ecommerce-checkout");
    const { tasks: ecomTasks } = await tasksRes.json();
    expect(ecomTasks.length).toBe(5);

    for (const ecomTask of ecomTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: ecomTask.id,
        code: ecomTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Payment Processing, Stripe & Polar.sh tasks (PaymentIntent Idempotency, Dual Webhooks, Proration/Dunning, Connect Ledger, AI Usage Meters)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=payment-processing");
    const { tasks: payTasks } = await tasksRes.json();
    expect(payTasks.length).toBe(5);

    for (const payTask of payTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: payTask.id,
        code: payTask.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Web Shop Storefront UI & Account-to-Checkout tasks (Variant Matrix, Optimistic Cart Drawer, Guest Cart Merge, Accessible Checkout Stepper, Order History & RMA Portal)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=storefront-ui");
    const { tasks: shopUiTasks } = await tasksRes.json();
    expect(shopUiTasks.length).toBe(5);

    for (const task of shopUiTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: task.id,
        code: task.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Order Lifecycle & Commerce Data Architecture tasks (Normalized Entity Store, Immutable Order Snapshots, Transactional Order Promoter, Split-Shipment Reconciler, Event-Sourced Audit Log)", async () => {
    const tasksRes = await call("GET", "/api/curriculum/tasks?category=order-lifecycle-data");
    const { tasks: dataTasks } = await tasksRes.json();
    expect(dataTasks.length).toBe(5);

    for (const task of dataTasks) {
      const verifyRes = await call("POST", "/api/curriculum/verify", {
        taskId: task.id,
        code: task.solutionCode,
      });
      expect(verifyRes.status).toBe(200);
      const body = await verifyRes.json();
      expect(body.success).toBe(true);
      expect(body.score).toBe(100);
    }
  });

  test("verifies Deep Web Cookies, Client Storage Data & HTTP Traffic tasks (RFC 6265bis/CHIPS/DBSC, IndexedDB/Web Locks/Quota/Outbox, RFC 9111/Singleflight/RateLimit/traceparent)", async () => {
    for (const cat of ["web-cookies", "web-storage-data", "web-traffic"]) {
      const tasksRes = await call("GET", `/api/curriculum/tasks?category=${cat}`);
      const { tasks: catTasks } = await tasksRes.json();
      expect(catTasks.length).toBe(4);

      for (const task of catTasks) {
        const verifyRes = await call("POST", "/api/curriculum/verify", {
          taskId: task.id,
          code: task.solutionCode,
        });
        expect(verifyRes.status).toBe(200);
        const body = await verifyRes.json();
        expect(body.success).toBe(true);
        expect(body.score).toBe(100);
      }
    }
  });

  test("verifies Proprietary Design Systems, UI/UX Interaction Craft & Advanced Web Components tasks (W3C DTCG 2025.10, OKLCH/APCA, Utopia Fluid Type, Roving tabindex, CSS Anchor Positioning, View Transitions, ElementInternals, adoptedStyleSheets, Virtualized Shadow List)", async () => {
    for (const cat of ["proprietary-design-systems", "ui-ux-interaction", "web-components"]) {
      const tasksRes = await call("GET", `/api/curriculum/tasks?category=${cat}`);
      const { tasks: catTasks } = await tasksRes.json();
      expect(catTasks.length).toBe(4);

      for (const task of catTasks) {
        const verifyRes = await call("POST", "/api/curriculum/verify", {
          taskId: task.id,
          code: task.solutionCode,
        });
        expect(verifyRes.status).toBe(200);
        const body = await verifyRes.json();
        expect(body.success).toBe(true);
        expect(body.score).toBe(100);
      }
    }
  });

  test("exposes TypeScript framework ecosystem catalog, migration matrix, and package manager specs via API", async () => {
    const res = await call("GET", "/api/curriculum/ecosystem");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.frameworks.length).toBeGreaterThanOrEqual(9);
    expect(data.migrations.length).toBe(4);
    expect(data.packageManagers.map((p) => p.id)).toEqual(["npm", "pnpm", "yarn-berry", "bun", "deno", "jsr"]);
  });

  test("verifies browser platform primitives tasks (Web Workers, SharedArrayBuffer/Atomics, Streams)", async () => {
    for (const cat of ["web-workers", "web-streams"]) {
      const tasksRes = await call("GET", `/api/curriculum/tasks?category=${cat}`);
      const { tasks: catTasks } = await tasksRes.json();
      expect(catTasks.length).toBe(3);

      for (const task of catTasks) {
        const evaluateRes = await call("POST", "/api/curriculum/evaluate", {
          taskId: task.id,
          code: task.solutionCode,
        });
        expect(evaluateRes.status).toBe(200);
        const body = await evaluateRes.json();
        expect(body.passed).toBe(true);
        expect(body.score).toBe(100);
      }
    }
  });

  test("verifies agentic web tasks (WebMCP tool APIs, GEO/AEO discovery, agentic commerce protocols)", async () => {
    for (const cat of ["webmcp", "agentic-seo", "agentic-commerce"]) {
      const tasksRes = await call("GET", `/api/curriculum/tasks?category=${cat}`);
      expect(tasksRes.status).toBe(200);
      const { tasks: catTasks } = await tasksRes.json();
      expect(catTasks.length).toBe(3);

      for (const task of catTasks) {
        const evaluateRes = await call("POST", "/api/curriculum/evaluate", {
          taskId: task.id,
          code: task.solutionCode,
        });
        expect(evaluateRes.status).toBe(200);
        const body = await evaluateRes.json();
        expect(body.passed).toBe(true);
        expect(body.score).toBe(100);
      }
    }
  });

  test("validates normalized curriculum schema, categories, and domain tracks", () => {
    const validation = validateCurriculumCatalog();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.totalTasks).toBe(210);
    expect(CURRICULUM_CATEGORIES.length).toBe(42);
    expect(Object.keys(CURRICULUM_TRACKS).length).toBe(21);
    expect(REFACTORING_CURRICULUM_TASKS.every((t) => Boolean(t.track && t.order > 0))).toBe(true);
  });
});
