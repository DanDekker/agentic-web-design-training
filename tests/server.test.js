import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHub } from "../src/events.js";
import { createRequestHandler } from "../src/http.js";

test("the standalone server listens on loopback by default", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gauntlet-web-server-"));
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
    expect(hostname).toBe("127.0.0.1");
    const response = await fetch(new URL("/api/health", address));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  } finally {
    clearTimeout(timer);
    child.kill();
    await child.exited;
    await reader.cancel().catch(() => {});
    await rm(dir, { recursive: true, force: true });
  }
}, 12000);

test("event streams stay open across the server idle timeout and deliver later updates", async () => {
  const hub = createHub();
  const handler = createRequestHandler({
    handleApi: () => hub.stream(),
    serveStatic: () => new Response("Not found", { status: 404 }),
    hub,
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

test("HTTP routing broadcasts successful mutations only", async () => {
  const broadcasts = [];
  const handler = createRequestHandler({
    handleApi: (req) => new Response(null, { status: req.url.endsWith("/failure") ? 422 : 204 }),
    serveStatic: () => new Response("static"),
    hub: { broadcast: (event) => broadcasts.push(event) },
  });
  const server = { timeout() {} };
  await handler(new Request("http://localhost/api/items", { method: "GET" }), server);
  await handler(new Request("http://localhost/api/failure", { method: "POST" }), server);
  expect(broadcasts).toHaveLength(0);
  await handler(new Request("http://localhost/api/items", { method: "POST" }), server);
  expect(broadcasts).toHaveLength(1);
  expect(broadcasts[0].type).toBe("state");
  expect(await (await handler(new Request("http://localhost/"), server)).text()).toBe("static");
});
