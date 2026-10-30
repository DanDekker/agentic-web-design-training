import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";
import { buildApplicationJsonLdGraph, auditHtmlSeoAndStructuredData, safeSerializeJsonLd } from "../src/seo.js";

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
    const application = graphRes.payload["@graph"].find((node) => node["@type"] === "SoftwareApplication");
    const author = graphRes.payload["@graph"].find((node) => node["@type"] === "Person");
    expect(author.name).toBe("DanDekker");
    expect(application.offers).toBeUndefined();
    expect(application.featureList.join(" ")).not.toContain("Sandboxed");

    const apiRes = await call("GET", "/api/seo/json-ld");
    expect(apiRes.status).toBe(200);
    const data = await apiRes.json();
    expect(data.payload["@context"]).toBe("https://schema.org");
    expect(data.payload["@graph"].some((n) => n["@type"] === "SoftwareApplication")).toBe(true);
    expect(data.payload["@graph"].some((n) => n["@type"] === "ItemList")).toBe(true);
  });

  test("normalizes graph origins and safely serializes hostile JSON-LD text", () => {
    const graph = buildApplicationJsonLdGraph("HTTPS://Example.test:443/");
    expect(graph.payload["@graph"].find((node) => node["@type"] === "WebSite").url).toBe("https://example.test");
    for (const origin of ["javascript:alert(1)", "https://user:pass@example.test", "https://example.test/path", "https://example.test/?q=1", "https://example.test/#fragment"]) {
      expect(() => buildApplicationJsonLdGraph(origin)).toThrow("Origin must be");
    }
    const data = { "@context": "https://schema.org", "@type": "Thing", name: '</script><img src=x> & \u2028 \u2029' };
    const encoded = safeSerializeJsonLd(data);
    expect(encoded.toLowerCase()).not.toContain("</script");
    expect(JSON.parse(encoded)).toEqual(data);
    const result = auditHtmlSeoAndStructuredData(`<script type="application/ld+json">${encoded}</script>`);
    expect(result.jsonLdBlocks).toEqual([data]);
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
    expect(check(valid + block("[1]")).passed).toBe(false);
    const array = block(JSON.stringify([{ "@context": { "@vocab": "https://schema.org/" }, "@type": "Article" }]));
    expect(check(array).passed).toBe(true);
    expect(check(block(JSON.stringify({ "@context": "https://example.test/context", "@type": "Thing" }))).passed).toBe(false);
    expect(check(block(JSON.stringify({ "@context": "https://schema.org", "@value": "literal", "@type": "Text" }))).passed).toBe(false);
  });

  test("parses reordered metadata and ignores comments, scripts, and inert templates", async () => {
    const html = `<!doctype html><html><head>
      <title data-source="cms">Practical &amp; useful</title>
      <meta content="A useful description" data-extra="yes" name="DESCRIPTION">
      <meta content="A useful title" property="og:title">
      <link href="https://example.test/docs?a=1&amp;b=2" rel="canonical">
      <script id="schema" type="application/ld+json; profile=example">{"@context":"https://schema.org","@type":"Article","name":"<h4>literal</h4>"}</script>
      </head><body><!-- <h1>Comment</h1><h6>Fake</h6> -->
      <template><header></header><main><search></search><h1>Inert</h1><h6>Inert</h6></main>
        <script type="application/ld+json">invalid</script></template>
      <header></header><main><h1>Real heading</h1><h2>Details</h2><search></search></main>
      <script>const sample = '<h1>Not a heading</h1>';</script></body></html>`;
    const report = auditHtmlSeoAndStructuredData(html);
    expect(report.passed).toBe(true);
    expect(report.jsonLdBlocks).toHaveLength(1);
    expect(report.jsonLdBlocks[0].name).toBe("<h4>literal</h4>");
    const response = await call("POST", "/api/seo/audit", { html });
    expect(response.status).toBe(200);
    expect((await response.json()).score).toBe(100);

    const fake = `<html><head><!-- <title>Fake</title><meta name="description" content="Fake"><meta property="og:title" content="Fake"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Thing"}</script> --></head>
      <body><script>const html = '<header><main><search><h1>Fake</h1></search></main></header>';</script></body></html>`;
    expect(auditHtmlSeoAndStructuredData(fake).checks.every((item) => !item.passed)).toBe(true);
  });

  test("flags empty, duplicate, relative, malformed, and misplaced canonical metadata", () => {
    const head = '<title>Title</title><meta content="Description" name="description"><meta content="Title" property="og:title">';
    const check = (markup, body = "") => auditHtmlSeoAndStructuredData(`<html><head>${head}${markup}</head><body>${body}</body></html>`).checks.find((item) => item.id === "technical_seo_head");
    expect(check("").passed).toBe(true);
    expect(check('<link rel="canonical" href="https://example.test/path?a=1&amp;b=2">').passed).toBe(true);
    for (const markup of [
      '<link rel="canonical">',
      '<link rel="canonical" href="">',
      '<link rel="canonical" href="/relative">',
      '<link rel="canonical" href="javascript:alert(1)">',
      '<link rel="canonical" href="https://example.test/one"><link rel="canonical" href="https://example.test/two">',
    ]) expect(check(markup).passed).toBe(false);
    expect(check("", '<link rel="canonical" href="https://example.test/">').passed).toBe(false);
    expect(check('<meta name="description" content="Second">').passed).toBe(false);
    const emptyTitle = auditHtmlSeoAndStructuredData('<head><title>&#32;&nbsp;</title><meta name="description" content="x"><meta property="og:title" content="x"></head>');
    expect(emptyTitle.checks.find((item) => item.id === "technical_seo_head").passed).toBe(false);
  });

  test("reports Google robots meta restrictions without treating intentional noindex as a failed check", async () => {
    const html = `<!doctype html><html><head><title>Private page</title>
      <meta name="description" content="A private page"><meta property="og:title" content="Private page">
      <meta name="robots" content="index, nofollow, max-image-preview: none">
      <meta name="GOOGLEBOT" content="NOINDEX, indexifembedded">
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
      </head><body><header></header><main><h1>Private page</h1><search></search></main></body></html>`;
    const report = auditHtmlSeoAndStructuredData(html);
    expect(report.passed).toBe(true);
    expect(report.robotsMeta.robots).toEqual(["index", "nofollow"]);
    expect(report.robotsMeta.googlebot).toEqual(["noindex", "indexifembedded"]);
    expect(report.robotsMeta.googleSearch).toEqual({ noindex: true, nofollow: true, indexIfEmbedded: true });
    const response = await call("POST", "/api/seo/audit", { html });
    expect((await response.json()).robotsMeta).toEqual(report.robotsMeta);

    const none = auditHtmlSeoAndStructuredData('<body><meta name="robots" content="none"><template><meta name="googlebot" content="noindex"></template></body>');
    expect(none.robotsMeta.googleSearch).toEqual({ noindex: true, nofollow: true, indexIfEmbedded: false });
    expect(none.robotsMeta.googlebot).toEqual([]);
    const preview = auditHtmlSeoAndStructuredData('<meta name="robots" content="max-image-preview: none"><meta name="googlebot-news" content="noindex">');
    expect(preview.robotsMeta.googleSearch).toEqual({ noindex: false, nofollow: false, indexIfEmbedded: false });
  });
});
