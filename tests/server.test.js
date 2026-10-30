import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
