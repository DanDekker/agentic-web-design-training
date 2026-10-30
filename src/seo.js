/**
 * 1st-Party Technical SEO, Schema.org JSON-LD @graph Builder & HTML5 Structured Data Auditor.
 * Generates connected Knowledge Graph JSON-LD (@graph) and audits HTML documents for
 * WHATWG HTML Living Standard landmarks, heading hierarchy, OpenGraph, Canonical, and Schema.org compliance.
 */

import {
  REFACTORING_CURRICULUM_TASKS,
  CURRICULUM_CATEGORIES,
  CURRICULUM_TRACKS,
} from "./curriculum.js";
import { parse } from "parse5";

export function safeSerializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildApplicationJsonLdGraph(origin = "http://localhost:3000") {
  const cleanOrigin = String(origin || "http://localhost:3000").replace(/\/+$/, "");
  const orgId = `${cleanOrigin}/#organization`;
  const websiteId = `${cleanOrigin}/#website`;
  const webpageId = `${cleanOrigin}/#webpage`;
  const appId = `${cleanOrigin}/#application`;
  const catalogId = `${cleanOrigin}/#curriculum-catalog`;

  const trackItems = Object.values(CURRICULUM_TRACKS).map((track, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: {
      "@type": "Course",
      "@id": `${cleanOrigin}/#track-${track.id}`,
      name: track.name,
      courseCode: track.id,
      description: `AI model training track covering ${track.categories.join(", ")}`,
      provider: { "@id": orgId },
    },
  }));

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "gauntlet-web Agentic Systems",
        url: cleanOrigin,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: cleanOrigin,
        name: `gauntlet-web — ${REFACTORING_CURRICULUM_TASKS.length}-Exercise Curriculum & Monochrome Suite`,
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: `${cleanOrigin}/`,
        name: "gauntlet-web — Agentic Curriculum & Monochrome Task Suite",
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": appId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: `gauntlet-web ${REFACTORING_CURRICULUM_TASKS.length}-Exercise Curriculum Suite`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web, macOS, Linux, Windows",
        offers: {
          "@type": "Offer",
          price: "0.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        featureList: [
          `${REFACTORING_CURRICULUM_TASKS.length} Sandboxed AI Training Tasks across ${CURRICULUM_CATEGORIES.length} Categories`,
          "1st-Party OAuth 2.0 PKCE & Proprietary Authentication",
          "Instrumented Two-User Real-Time Chat & Protocol Debugger",
          "Native Bun.Transpiler TypeScript Sandbox & Automated Markdown Benchmark Reports",
        ],
        publisher: { "@id": orgId },
      },
      {
        "@type": "ItemList",
        "@id": catalogId,
        name: `${REFACTORING_CURRICULUM_TASKS.length}-Exercise Curriculum Domain Tracks`,
        numberOfItems: trackItems.length,
        itemListElement: trackItems,
      },
    ],
  };

  return {
    payload,
    scriptHtml: `<script type="application/ld+json">${safeSerializeJsonLd(payload)}</script>`,
  };
}

function schemaContext(value, inherited) {
  if (value === null) return false;
  if (Array.isArray(value)) return value.reduce((current, item) => schemaContext(item, current), inherited);
  if (typeof value === "string") return /^https?:\/\/schema\.org\/?$/i.test(value);
  if (value && typeof value === "object" && Object.hasOwn(value, "@vocab")) {
    return typeof value["@vocab"] === "string" && /^https?:\/\/schema\.org\/?$/i.test(value["@vocab"]);
  }
  return inherited;
}

// This detects common Schema.org contexts and typed nodes without fetching remote
// contexts or claiming to perform full JSON-LD expansion or rich-result validation.
function countSchemaTypes(value) {
  const queue = [{ value, schema: false }];
  let count = 0;
  while (queue.length) {
    const current = queue.pop();
    if (Array.isArray(current.value)) {
      for (const item of current.value) queue.push({ value: item, schema: current.schema });
    } else if (current.value && typeof current.value === "object") {
      const node = current.value;
      const schema = Object.hasOwn(node, "@context") ? schemaContext(node["@context"], current.schema) : current.schema;
      const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
      if (schema && !Object.hasOwn(node, "@value") && types.some((type) => typeof type === "string" && /^(?:[A-Za-z][A-Za-z0-9]*|schema:[A-Za-z][A-Za-z0-9]*|https?:\/\/schema\.org\/[A-Za-z][A-Za-z0-9]*)$/i.test(type))) count++;
      for (const [key, child] of Object.entries(node)) {
        if (key !== "@context" && child && typeof child === "object") queue.push({ value: child, schema });
      }
    }
  }
  return count;
}

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

// Template contents live in a separate document fragment and are not page content.
function htmlElements(root) {
  const found = [];
  const stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop();
    if (node.tagName && node.namespaceURI === HTML_NAMESPACE) found.push(node);
    const children = node.childNodes || [];
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  return found;
}

const attribute = (element, name) => element.attrs?.find((attr) => attr.name === name)?.value ?? null;
const tokens = (value) => (value || "").trim().toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean);
const elementText = (element) => (element.childNodes || []).filter((node) => node.nodeName === "#text").map((node) => node.value).join("");

function isAbsoluteHttpUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u0020\u007f]/.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function auditHtmlSeoAndStructuredData(html) {
  const document = parse(String(html || ""));
  const all = htmlElements(document);
  const head = all.find((element) => element.tagName === "head");
  const body = all.find((element) => element.tagName === "body");
  const headElements = htmlElements(head);
  const bodyElements = htmlElements(body);
  const checks = [];

  // 1. Single <h1> & sequential source heading outline
  const headingMatches = bodyElements.filter((element) => /^h[1-6]$/.test(element.tagName)).map((element) => Number(element.tagName[1]));
  const h1Count = headingMatches.filter((lvl) => lvl === 1).length;
  let skippedHeading = false;
  for (let i = 1; i < headingMatches.length; i++) {
    if (headingMatches[i] > headingMatches[i - 1] + 1) {
      skippedHeading = true;
      break;
    }
  }
  checks.push({
    id: "heading_hierarchy",
    passed: h1Count === 1 && !skippedHeading,
    detail: `h1Count=${h1Count}, skippedLevel=${skippedHeading}`,
  });

  // 2. Semantic HTML5 landmarks (<main>, <header>, <search> or role="search")
  const hasMain = bodyElements.some((element) => element.tagName === "main");
  const hasHeader = bodyElements.some((element) => element.tagName === "header");
  const hasSearch = bodyElements.some((element) => element.tagName === "search" || tokens(attribute(element, "role"))[0] === "search");
  checks.push({
    id: "html5_landmarks",
    passed: hasMain && hasHeader && hasSearch,
    detail: `main=${hasMain}, header=${hasHeader}, search=${hasSearch}`,
  });

  // 3. Technical metadata; a canonical is optional until there is a public URL.
  const titles = headElements.filter((element) => element.tagName === "title");
  const descriptions = headElements.filter((element) => element.tagName === "meta" && attribute(element, "name")?.toLowerCase() === "description");
  const ogTitles = headElements.filter((element) => element.tagName === "meta" && attribute(element, "property")?.toLowerCase() === "og:title");
  const isCanonical = (element) => element.tagName === "link" && tokens(attribute(element, "rel")).includes("canonical");
  const canonicals = headElements.filter(isCanonical);
  const misplacedCanonicals = bodyElements.filter(isCanonical).length;
  const hasTitle = titles.length === 1 && Boolean(elementText(titles[0]).trim());
  const hasDescription = descriptions.length === 1 && Boolean(attribute(descriptions[0], "content")?.trim());
  const hasOgTitle = ogTitles.length === 1 && Boolean(attribute(ogTitles[0], "content")?.trim());
  const canonicalHref = canonicals.length === 1 ? attribute(canonicals[0], "href") : null;
  const canonicalValid = misplacedCanonicals === 0 && (canonicals.length === 0 || (canonicals.length === 1 && isAbsoluteHttpUrl(canonicalHref)));
  checks.push({
    id: "technical_seo_head",
    passed: hasTitle && hasDescription && canonicalValid && hasOgTitle,
    detail: `titles=${titles.length}, descriptions=${descriptions.length}, canonicals=${canonicals.length}, misplacedCanonicals=${misplacedCanonicals}, canonicalValid=${canonicalValid}, ogTitles=${ogTitles.length}`,
  });

  // 4. JSON syntax and common Schema.org context/type detection.
  const jsonLdBlocks = [];
  const scripts = all.filter((element) => element.tagName === "script" && attribute(element, "type")?.split(";")[0].trim().toLowerCase() === "application/ld+json");
  let totalBlocks = 0;
  let invalidBlocks = 0;
  let entityCount = 0;

  for (const script of scripts) {
    totalBlocks++;
    try {
      const parsed = JSON.parse(elementText(script).trim());
      jsonLdBlocks.push(parsed);
      if (!parsed || typeof parsed !== "object" || (Array.isArray(parsed) && parsed.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) invalidBlocks++;
      else entityCount += countSchemaTypes(parsed);
    } catch {
      invalidBlocks++;
    }
  }

  checks.push({
    id: "schema_org_json_ld",
    passed: totalBlocks > 0 && invalidBlocks === 0 && entityCount > 0,
    detail: `blocks=${totalBlocks}, invalid=${invalidBlocks}, schemaTypes=${entityCount}`,
  });

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    jsonLdBlocks,
  };
}
