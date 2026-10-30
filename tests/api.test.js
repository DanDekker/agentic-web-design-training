import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { createHandler } from "../src/api.js";

let dir;
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
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-api-"));
  handle = createHandler(await new TaskStore(join(dir, "tasks.json")).load());
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("/api", () => {
  test("health check", async () => {
    const res = await call("GET", "/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("full task lifecycle", async () => {
    const created = await call("POST", "/api/tasks", { title: "ship it" });
    expect(created.status).toBe(201);
    const task = await created.json();

    const listed = await (await call("GET", "/api/tasks")).json();
    expect(listed.tasks.map((t) => t.title)).toEqual(["ship it"]);

    const patched = await call("PATCH", `/api/tasks/${task.id}`, { done: true, title: "ship it twice" });
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({ title: "ship it twice", done: true });

    const deleted = await call("DELETE", `/api/tasks/${task.id}`);
    expect(deleted.status).toBe(204);
    expect((await (await call("GET", "/api/tasks")).json()).tasks).toEqual([]);
  });

  test("validates input", async () => {
    expect((await call("POST", "/api/tasks", { title: "  " })).status).toBe(422);
    const raw = await handle(new Request("http://gauntlet-web.test/api/tasks", { method: "POST", body: "{oops" }));
    expect(raw.status).toBe(400);
  });

  test("404s for unknown tasks and endpoints", async () => {
    expect((await call("PATCH", "/api/tasks/missing", { done: true })).status).toBe(404);
    expect((await call("DELETE", "/api/tasks/missing")).status).toBe(404);
    expect((await call("GET", "/api/nope")).status).toBe(404);
  });

  test("reorders and clears", async () => {
    const a = await (await call("POST", "/api/tasks", { title: "a" })).json();
    const b = await (await call("POST", "/api/tasks", { title: "b" })).json();

    const reordered = await (await call("POST", "/api/tasks/reorder", { ids: [b.id, a.id] })).json();
    expect(reordered.tasks.map((t) => t.title)).toEqual(["b", "a"]);

    await call("PATCH", `/api/tasks/${a.id}`, { done: true });
    const cleared = await (await call("POST", "/api/tasks/clear-completed")).json();
    expect(cleared.removed).toBe(1);
    expect(cleared.tasks.map((t) => t.title)).toEqual(["b"]);
  });
});
