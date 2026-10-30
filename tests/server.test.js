import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHub } from "../src/events.js";
import { createRequestHandler } from "../src/http.js";
import { createHandler } from "../src/api.js";
import { TaskStore } from "../src/store.js";
import { REFACTORING_CURRICULUM_TASKS } from "../src/curriculum.js";

async function startServer(dir) {
  const env = { ...process.env, PORT: "0", GUANTLET_WEB_DATA_DIR: dir };
  for (const name of ["GUANTLET_WEB_HOST", "GUANTLET_WEB_DATA", "GUANTLET_WEB_AUTH_DATA", "GUANTLET_WEB_OAUTH_DATA"]) delete env[name];
  const child = Bun.spawn([process.execPath, "src/server.js"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)), env, stdout: "pipe", stderr: "pipe",
  });
  const reader = child.stdout.getReader();
  let timer;
  try {
    const started = (async () => {
      let output = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) throw new Error(`Server exited before listening: ${await new Response(child.stderr).text()}`);
        output += new TextDecoder().decode(value);
        const match = output.match(/gauntlet-web\s+→\s+(http:\/\/\S+) \(listening on ([^)]+)\)/);
        if (match) return match;
      }
    })();
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Server did not start")), 8000); });
    const [, address, hostname] = await Promise.race([started, timeout]);
    let stopped = false;
    return { address, hostname, async stop() {
      if (stopped) return;
      stopped = true;
      child.kill();
      await child.exited;
      await reader.cancel().catch(() => {});
    } };
  } catch (error) {
    child.kill();
    await child.exited;
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

test("the standalone server listens on loopback and seeds a fresh store", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gauntlet-web-server-"));
  let server;
  try {
    server = await startServer(dir);
    expect(server.hostname).toBe("127.0.0.1");
    const response = await fetch(new URL("/api/health", server.address));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const tasks = await (await fetch(new URL("/api/tasks", server.address))).json();
    expect(tasks.tasks).toHaveLength(REFACTORING_CURRICULUM_TASKS.length);
  } finally {
    await server?.stop();
    await rm(dir, { recursive: true, force: true });
  }
}, 12000);

test("restarting an existing empty store does not recreate curriculum tasks", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gauntlet-web-server-"));
  let server;
  try {
    await writeFile(join(dir, "tasks.json"), JSON.stringify({
      version: 1, boards: [{ id: "board_today", name: "Today", slug: "today" }], tasks: [],
    }));
    server = await startServer(dir);
    expect((await (await fetch(new URL("/api/tasks", server.address))).json()).tasks).toEqual([]);
    const created = await (await fetch(new URL("/api/tasks", server.address), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Temporary" }),
    })).json();
    expect((await fetch(new URL(`/api/tasks/${created.id}`, server.address), { method: "DELETE" })).status).toBe(204);
    await server.stop();
    server = await startServer(dir);
    expect((await (await fetch(new URL("/api/tasks", server.address))).json()).tasks).toEqual([]);
  } finally {
    await server?.stop();
    await rm(dir, { recursive: true, force: true });
  }
}, 20000);

test("event streams stay open across the server idle timeout and deliver later updates", async () => {
  const hub = createHub();
  const handler = createRequestHandler({
    handleApi: () => hub.stream(),
    serveStatic: () => new Response("Not found", { status: 404 }),
  });
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, idleTimeout: 1, fetch: handler });
  let reader;
  let timer;
  try {
    const response = await fetch(new URL("/api/events", server.url));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    reader = response.body.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain(": connected");
    await Bun.sleep(1400);
    hub.broadcast({ type: "state", at: 42 });
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("No event arrived")), 3000); });
    const message = await Promise.race([reader.read(), timeout]);
    expect(message.done).toBe(false);
    expect(new TextDecoder().decode(message.value)).toContain('data: {"type":"state","at":42}');
  } finally {
    clearTimeout(timer);
    await reader?.cancel().catch(() => {});
    await server.stop(true);
  }
}, 8000);

test("event subscriptions are removed when a reader cancels", async () => {
  const hub = createHub();
  const reader = hub.stream().body.getReader();
  await reader.read();
  expect(hub.size).toBe(1);
  await reader.cancel();
  expect(hub.size).toBe(0);
});

test("HTTP routing emits one update for a task mutation and none for read-only work", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gauntlet-web-events-"));
  const broadcasts = [];
  try {
    const store = await new TaskStore(join(dir, "tasks.json")).load();
    const hub = { broadcast: (event) => broadcasts.push(event) };
    const handler = createRequestHandler({
      handleApi: createHandler(store, hub),
      serveStatic: () => new Response("static"),
    });
    const server = { timeout() {} };
    const post = (path, body) => handler(new Request(`http://localhost${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    }), server);
    const created = await post("/api/tasks", { title: "One update" });
    expect(created.status).toBe(201);
    expect(broadcasts.map((event) => event.type)).toEqual(["state"]);
    await post("/api/tasks/clear-completed", {});
    await post("/api/seo/audit", { html: "<html></html>" });
    expect(broadcasts).toHaveLength(1);
    expect(await (await handler(new Request("http://localhost/"), server)).text()).toBe("static");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
