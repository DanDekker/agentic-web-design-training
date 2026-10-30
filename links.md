# Links, sources & citations

Every outbound link used by this repository, grouped by purpose. All external URLs were
last re-verified on **2026-10-30**.

- [Project links](#project-links)
- [Technology map](#technology-map)
- [Logo & asset provenance](#logo--asset-provenance)
- [Structured data & vocabulary](#structured-data--vocabulary)
- [Agentic web, WebMCP & 2026 discovery citations](#agentic-web-webmcp--2026-discovery-citations)
- [Local development](#local-development)
- [Fixture hosts used in tests](#fixture-hosts-used-in-tests)

---

## Project links

| Purpose | URL |
| --- | --- |
| Repository | <https://github.com/DanDekker/webdev-gauntlet> |
| Clone URL | <https://github.com/DanDekker/webdev-gauntlet.git> |
| GitHub profile | <https://github.com/DanDekker> |
| CI workflow | <https://github.com/DanDekker/webdev-gauntlet/actions/workflows/ci.yml> |
| CI status badge | <https://github.com/DanDekker/webdev-gauntlet/actions/workflows/ci.yml/badge.svg> |
| Social preview image (Open Graph) | <https://raw.githubusercontent.com/DanDekker/webdev-gauntlet/main/assets/social-preview.png> |

## Technology map

Every logo in the README links to the upstream project the curriculum exercises target.

**Runtime & core**

| Technology | URL |
| --- | --- |
| Bun | <https://github.com/oven-sh/bun> |
| JavaScript (ECMA-262) | <https://github.com/tc39/ecma262> |
| HTML Living Standard | <https://github.com/whatwg/html> |
| CSS WG Drafts | <https://github.com/w3c/csswg-drafts> |

**Frameworks & UI state**

| Technology | URL |
| --- | --- |
| TypeScript | <https://github.com/microsoft/TypeScript> |
| React | <https://github.com/react/react> |
| Next.js | <https://github.com/vercel/next.js> |
| Angular | <https://github.com/angular/angular> |
| Vue | <https://github.com/vuejs/core> |
| Svelte | <https://github.com/sveltejs/svelte> |
| Redux | <https://github.com/reduxjs/redux> |
| TanStack Query | <https://github.com/TanStack/query> |

**Server & API tooling**

| Technology | URL |
| --- | --- |
| NestJS | <https://github.com/nestjs/nest> |
| tRPC | <https://github.com/trpc/trpc> |
| Zod | <https://github.com/colinhacks/zod> |
| Hono | <https://github.com/honojs/hono> |
| Fastify | <https://github.com/fastify/fastify> |

**Package ecosystems**

| Technology | URL |
| --- | --- |
| npm | <https://github.com/npm/cli> |
| pnpm | <https://github.com/pnpm/pnpm> |
| Yarn | <https://github.com/yarnpkg/berry> |
| Deno | <https://github.com/denoland/deno> |
| JSR | <https://github.com/jsr-io/jsr> |

**Payments**

| Technology | URL |
| --- | --- |
| Stripe | <https://github.com/stripe/stripe-node> |
| Polar | <https://github.com/polarsource/polar> |

## Logo & asset provenance

| Purpose | URL |
| --- | --- |
| Simple Icons set (pinned commit `90646e4b`) | <https://github.com/simple-icons/simple-icons/tree/90646e4bf7f3b89df6c37e65baf3e7bc759a517c/icons> |
| Simple Icons trademark disclaimer | <https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md> |
| Polar brand mark (pinned commit `2aef55c9`) | <https://github.com/polarsource/polar/blob/2aef55c966b20f6d0dd8ecd50479a3f3b8dbd0fe/server/polar/backoffice/static/logo.dark.svg> |

Individual `.svg` assets under `assets/logos/` are vendored from the pinned Simple Icons
commit above. See [`assets/logos/SOURCES.md`](assets/logos/SOURCES.md) for the full note.

## Structured data & vocabulary

| Purpose | URL |
| --- | --- |
| Schema.org vocabulary | <https://schema.org/> |
| `Offer.availability` — `InStock` | <https://schema.org/InStock> |
| `Offer.availability` — `OutOfStock` | <https://schema.org/OutOfStock> |
| `ItemCondition` — `NewCondition` | <https://schema.org/NewCondition> |
| `MerchantReturnPolicy` — finite return window | <https://schema.org/MerchantReturnFiniteReturnWindow> |
| `OfferShippingDetails` — `ReturnByMail` | <https://schema.org/ReturnByMail> |
| `TechArticle` | <https://schema.org/TechArticle> |
| SVG namespace | <http://www.w3.org/2000/svg> |

## Agentic web, WebMCP & 2026 discovery citations

These are the primary sources behind the `agentic-web` curriculum track. Each exercise
references the specific document it was derived from.

### WebMCP (Web Model Context Protocol)

| Document | URL |
| --- | --- |
| WebMCP specification — Draft Community Group Report, 2026-10-27 | <https://webmachinelearning.github.io/webmcp/> |
| WebMCP editor's repository & issue tracker | <https://github.com/webmachinelearning/webmcp> |
| W3C Web Machine Learning Community Group technical notes | <https://w3c-cg.github.io/aikr/webMCP/webmcp-technical-notes.html> |
| Chrome for Developers — WebMCP overview (updated 2026-10-07) | <https://developer.chrome.com/docs/ai/webmcp> |
| Chrome for Developers — imperative API (`registerTool` / `getTools` / `executeTool`) | <https://developer.chrome.com/docs/ai/webmcp/imperative-api> |
| Chrome for Developers — declarative API (HTML form annotations) | <https://developer.chrome.com/docs/ai/webmcp/declarative-api> |

### Agentic discovery, GEO & AEO

| Document | URL |
| --- | --- |
| `/llms.txt` proposal, v2 (2026-08) | <https://llmstxt.org/> |
| Lighthouse — llms.txt audit (agentic browsing checks) | <https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt> |
| Cloudflare — Content Signals Policy | <https://blog.cloudflare.com/content-signals-policy> |
| Cloudflare — AI Crawl Control | <https://developers.cloudflare.com/ai-crawl-control> |
| Addy Osmani — Agentic Engine Optimization (2026-04-11) | <https://addyosmani.com/blog/agentic-engine-optimization> |

### Agentic commerce & agent payments

| Document | URL |
| --- | --- |
| Agentic Commerce Protocol (ACP) — OpenAI & Stripe | <https://www.agenticcommerce.dev/docs> |
| Agent Payments Protocol (AP2) — Google | <https://ap2-protocol.org/> |
| AP2 technical specification | <https://ap2-protocol.org/ap2/specification/> |
| x402 — HTTP 402 Payment Required | <https://docs.x402.org/core-concepts/http-402> |
| x402 — payment schemes | <https://docs.x402.org/schemes/overview> |
| x402 — V1 to V2 migration guide | <https://docs.x402.org/guides/migration-v1-to-v2> |
| x402 Foundation repository | <https://github.com/x402-foundation/x402> |

## Local development

| Purpose | URL |
| --- | --- |
| Bun installation | <https://bun.sh/> |
| Dev server | <http://localhost:3000/> |
| OAuth callback (local) | <http://localhost:3000/oauth/callback> |
| Container health check | <http://127.0.0.1:4317/api/health> |

## Fixture hosts used in tests

These are reserved/example domains used as **fixtures** in exercises and test assertions.
They are not live services and are not linked from production code paths.

| Host | Used for |
| --- | --- |
| `guantlet-web.test` | Canonical/URL-normalisation fixtures |
| `api.example.com`, `app.example.com`, `idp.example.com`, `login.example.com` | API, app and identity-provider fixtures |
| `evil.example.com` | Negative security fixtures |
| `tracker-a.example`, `tracker-b.example` | Tracking / fingerprinting fixtures |
| `app.local`, `edge.local`, `npm.corp.internal`, `registry.npmjs.org` | Internal-infrastructure fixtures |
| `oauth.pstmn.io` | OAuth provider fixture |
| `github.com/guantlet-web-labs`, `wikidata.org/wiki/Q12345` | `sameAs` entity-linking fixtures |
