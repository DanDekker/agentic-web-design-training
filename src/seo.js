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
        name: "guantlet-web Agentic Systems",
        url: cleanOrigin,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: cleanOrigin,
        name: "guantlet-web — 106-Exercise Curriculum & Monochrome Suite",
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: `${cleanOrigin}/`,
        name: "guantlet-web — Agentic Curriculum & Monochrome Task Suite",
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": appId },
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: "guantlet-web 106-Exercise Curriculum Suite",
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
        name: "106-Exercise Curriculum Domain Tracks",
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

export function auditHtmlSeoAndStructuredData(html) {
  const source = String(html || "");
  const checks = [];

  // 1. Single <h1> & sequential heading outline
  const headingMatches = Array.from(source.matchAll(/<h([1-6])\b[^>]*>/gi)).map((m) => Number(m[1]));
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
  const hasMain = /<main\b[^>]*>/i.test(source);
  const hasHeader = /<header\b[^>]*>/i.test(source);
  const hasSearch = /<search\b[^>]*>/i.test(source) || /role=["']search["']/i.test(source);
  checks.push({
    id: "html5_landmarks",
    passed: hasMain && hasHeader && hasSearch,
    detail: `main=${hasMain}, header=${hasHeader}, search=${hasSearch}`,
  });

  // 3. Technical metadata; a canonical is optional until there is a public URL.
  const hasTitle = /<title>[^<]+<\/title>/i.test(source);
  const hasDescription = /<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(source);
  const canonicalHref = source.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? null;
  const canonicalValid = !canonicalHref || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(canonicalHref);
  const hasOgTitle = /<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/i.test(source);
  checks.push({
    id: "technical_seo_head",
    passed: hasTitle && hasDescription && canonicalValid && hasOgTitle,
    detail: `title=${hasTitle}, description=${hasDescription}, canonical=${canonicalHref ?? "omitted"}, og:title=${hasOgTitle}`,
  });

  // 4. Schema.org JSON-LD validity, either a graph or one typed entity.
  const jsonLdBlocks = [];
  const ldRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  let jsonLdValid = false;
  let entityCount = 0;

  while ((ldMatch = ldRegex.exec(source)) !== null) {
    try {
      const parsed = JSON.parse(ldMatch[1].trim());
      jsonLdBlocks.push(parsed);
      const nodes = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
      if (parsed["@context"] === "https://schema.org" && nodes.length > 0 && nodes.every((node) => Boolean(node["@type"]))) {
        jsonLdValid = true;
        entityCount += nodes.length;
      }
    } catch {
      jsonLdValid = false;
    }
  }

  checks.push({
    id: "schema_org_json_ld",
    passed: jsonLdValid && entityCount > 0,
    detail: `blocks=${jsonLdBlocks.length}, entities=${entityCount}`,
  });

  const passedCount = checks.filter((c) => c.passed).length;
  return {
    passed: passedCount === checks.length,
    score: Math.round((passedCount / checks.length) * 100),
    checks,
    jsonLdBlocks,
  };
}
