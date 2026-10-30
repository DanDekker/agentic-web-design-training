import { join } from "node:path";
import { TaskStore } from "./store.js";
import { AuthStore } from "./auth.js";
import { OAuthServer } from "./oauth.js";
import { createHandler } from "./api.js";
import { createStatic } from "./static.js";
import { createHub } from "./events.js";
import { ChatEngine } from "./chat.js";

const ROOT = join(import.meta.dir, "..");
const PUBLIC_DIR = join(ROOT, "public");
const DATA_DIR = process.env.GUANTLET_WEB_DATA_DIR ?? join(ROOT, "data");
const DATA_FILE = process.env.GUANTLET_WEB_DATA ?? join(DATA_DIR, "tasks.json");
const AUTH_FILE = process.env.GUANTLET_WEB_AUTH_DATA ?? join(DATA_DIR, "auth.json");
const OAUTH_FILE = process.env.GUANTLET_WEB_OAUTH_DATA ?? join(DATA_DIR, "oauth.json");
const PORT = Number(process.env.PORT ?? 3000);
const HOSTNAME = process.env.GUANTLET_WEB_HOST ?? "127.0.0.1";

const store = await new TaskStore(DATA_FILE).load();
if (store.listTasks().length === 0) {
  await store.seedCurriculumTasks();
}
const authStore = await new AuthStore(AUTH_FILE).load();
const oauthServer = await new OAuthServer(OAUTH_FILE).load();
const hub = createHub();
const chatEngine = new ChatEngine();

const handleApi = createHandler(store, hub, authStore, oauthServer, chatEngine);
const serveStatic = createStatic(PUBLIC_DIR);

const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  development: process.env.NODE_ENV !== "production",
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/oauth/") ||
      pathname.startsWith("/.well-known/")
    ) {
      const res = await handleApi(req);
      if (!["GET", "HEAD"].includes(req.method) && res.status < 400) {
        hub.broadcast({ type: "state", at: Date.now() });
      }
      return res;
    }

    return serveStatic(pathname);
  },
});

console.log(`gauntlet-web  →  ${server.url.href} (listening on ${server.hostname})`);
console.log(`data  →  ${DATA_FILE}`);
