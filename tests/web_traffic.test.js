import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let handle;

const call = (method, path, body) =>
  handle(
    new Request(`http://guantlet-web.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "guantlet-web-traffic-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("First-Party Web Cookies (RFC 6265bis/CHIPS/DBSC), Client Data & HTTP Traffic Engine", () => {
  test("exposes Web Cookies, Client Storage & HTTP Traffic catalog via GET /api/traffic/overview", async () => {
    const res = await call("GET", "/api/traffic/overview");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.track).toBe("web-cookies-data-traffic");
    expect(data.categories).toEqual(["web-cookies", "web-storage-data", "web-traffic"]);
    expect(data.cookieStandards.some((c) => c.id === "rfc6265bis")).toBe(true);
    expect(data.cookieStandards.some((c) => c.id === "chips-partitioned")).toBe(true);
    expect(data.cookieStandards.some((c) => c.id === "w3c-dbsc")).toBe(true);
    expect(data.clientStorageEngines.some((s) => s.id === "indexeddb")).toBe(true);
    expect(data.httpTrafficSpecs.some((t) => t.id === "rfc9111-http-caching")).toBe(true);
  });

  test("audits and serializes RFC 6265bis __Host- & CHIPS Partitioned cookies via POST /api/traffic/cookies/audit", async () => {
    const validRes = await call("POST", "/api/traffic/cookies/audit", {
      name: "__Host-guantlet-web_sid",
      value: "token_xyz",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None",
      partitioned: true,
      maxAgeSec: 99_999_999,
      signingSecret: "secret_key_2026",
      kid: "k_01",
    });
    expect(validRes.status).toBe(200);
    const valid = await validRes.json();
    expect(valid.valid).toBe(true);
    expect(valid.score).toBe(100);
    expect(valid.clampedMaxAgeSec).toBe(34_560_000);
    expect(valid.setCookieHeader).toContain("__Host-guantlet-web_sid=v1.k_01.");
    expect(valid.setCookieHeader).toContain("Partitioned");

    // Invalid __Host- cookie with Domain attribute and Path=/app
    const badRes = await call("POST", "/api/traffic/cookies/audit", {
      name: "__Host-broken",
      value: "1",
      domain: "guantlet-web.test",
      path: "/app",
      secure: false,
      sameSite: "None",
    });
    const bad = await badRes.json();
    expect(bad.valid).toBe(false);
    expect(bad.violations.length).toBeGreaterThanOrEqual(3);
  });

  test("simulates RFC 9111 HTTP caching (SWR, Vary, ETag 304), W3C traceparent & IETF RateLimit via POST /api/traffic/cache-trace/simulate", async () => {
    // 1. Stale-While-Revalidate hit (age=90s > maxAge=60s, within 60+120=180s)
    const swrRes = await call("POST", "/api/traffic/cache-trace/simulate", {
      url: "/api/curriculum/tasks",
      requestHeaders: {
        "accept-encoding": "br",
        "accept-language": "en-us",
        priority: "u=0, i",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
      nowSec: 1090,
    });
    expect(swrRes.status).toBe(200);
    const swr = await swrRes.json();
    expect(swr.cacheStatus).toBe("HIT_STALE_WHILE_REVALIDATE");
    expect(swr.backgroundRevalidate).toBe(true);
    expect(swr.priority.urgency).toBe(0);
    expect(swr.priority.incremental).toBe(true);
    expect(swr.trace.validIncoming).toBe(true);
    expect(swr.trace.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(swr.responseHeaders["server-timing"]).toContain("HIT_STALE_WHILE_REVALIDATE");

    // 2. Conditional If-None-Match within maxAge -> 304 Not Modified
    const etag304Res = await call("POST", "/api/traffic/cache-trace/simulate", {
      url: "/api/curriculum/tasks",
      requestHeaders: {
        "accept-encoding": "br",
        "accept-language": "en-us",
        "if-none-match": '"guantlet-web_v2_106tasks"',
      },
      nowSec: 1020,
    });
    const etag304 = await etag304Res.json();
    expect(etag304.cacheStatus).toBe("REVALIDATED_304");
    expect(etag304.httpStatus).toBe(304);
  });
});
