import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";
import { buildApplicationJsonLdGraph, auditHtmlSeoAndStructuredData } from "../src/seo.js";

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
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-seo-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Technical SEO, Schema.org JSON-LD @graph & HTML5 Auditor", () => {
  test("builds connected Schema.org JSON-LD @graph with XSS-safe script serialization", async () => {
    const graphRes = buildApplicationJsonLdGraph("https://gauntlet-web.test");
    expect(graphRes.payload["@context"]).toBe("https://schema.org");
    expect(graphRes.payload["@graph"].length).toBe(5);
    expect(graphRes.scriptHtml).toContain("application/ld+json");

    const apiRes = await call("GET", "/api/seo/json-ld");
    expect(apiRes.status).toBe(200);
    const data = await apiRes.json();
    expect(data.payload["@context"]).toBe("https://schema.org");
    expect(data.payload["@graph"].some((n) => n["@type"] === "SoftwareApplication")).toBe(true);
    expect(data.payload["@graph"].some((n) => n["@type"] === "ItemList")).toBe(true);
  });

  test("audits public/index.html for HTML5 landmarks, sharing metadata, and valid structured data", async () => {
    const indexHtml = await readFile(join(process.cwd(), "public", "index.html"), "utf8");
    const report = auditHtmlSeoAndStructuredData(indexHtml);
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
    expect(report.jsonLdBlocks.length).toBeGreaterThanOrEqual(1);
    expect(report.jsonLdBlocks[0].codeRepository).toBe("https://github.com/DanDekker/gauntlet-web");
    expect(indexHtml).not.toContain('href="http://localhost:3000/"');

    const apiAudit = await call("POST", "/api/seo/audit", { html: indexHtml });
    expect(apiAudit.status).toBe(200);
    const body = await apiAudit.json();
    expect(body.passed).toBe(true);
    expect(body.score).toBe(100);
  });

  test("checks all JSON-LD blocks regardless of order and accepts mixed graphs", () => {
    const block = (value) => `<script type="application/ld+json">${value}</script>`;
    const valid = block(JSON.stringify({ "@context": "https://schema.org/", "@graph": [
      { "@id": "https://example.test/#reference" },
      { "@type": ["Thing", "Product"], name: "Product" },
    ] }));
    const invalid = block('{"@context":');
    const check = (html) => auditHtmlSeoAndStructuredData(html).checks.find((item) => item.id === "schema_org_json_ld");
    expect(check(valid).passed).toBe(true);
    expect(check(valid + invalid).passed).toBe(false);
    expect(check(invalid + valid).passed).toBe(false);
    expect(check(valid + block("null")).passed).toBe(false);
    const array = block(JSON.stringify([{ "@context": { "@vocab": "https://schema.org/" }, "@type": "Article" }]));
    expect(check(array).passed).toBe(true);
    expect(check(block(JSON.stringify({ "@context": "https://example.test/context", "@type": "Thing" }))).passed).toBe(false);
  });
});
