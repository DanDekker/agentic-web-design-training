# Links, sources & citations

Every outbound link used by this repository, grouped by purpose. All external URLs were
last re-verified on **2026-10-30**.

- [Project links](#project-links)
- [Technology map](#technology-map)
- [Logo & asset provenance](#logo--asset-provenance)
- [Structured data & vocabulary](#structured-data--vocabulary)
- [Agentic web, WebMCP & 2026 discovery citations](#agentic-web-webmcp--2026-discovery-citations)
  - [WebMCP](#webmcp)
  - [Agentic discovery, GEO & AEO](#agentic-discovery-geo--aeo)
  - [Agentic commerce & agent payments](#agentic-commerce--agent-payments)
  - [Further reading](#further-reading)
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

### WebMCP

Primary sources (normative / official) are listed first; the rest are implementation
guides, explainers and commentary that were used to cross-check behaviour.

| Document | URL |
| --- | --- |
| WebMCP specification — Draft Community Group Report, 2026-10-27 | <https://webmachinelearning.github.io/webmcp/> |
| WebMCP editor's repository & issue tracker | <https://github.com/webmachinelearning/webmcp> |
| WebMCP issue tracker | <https://github.com/webmachinelearning/webmcp/issues> |
| Web Machine Learning Community Group charter | <https://webmachinelearning.github.io/charter/> |
| W3C Web Machine Learning Community Group | <https://w3.org/community/webmachinelearning/> |
| W3C AI Knowledge Representation CG technical notes | <https://w3c-cg.github.io/aikr/webMCP/webmcp-technical-notes.html> |
| Chrome — WebMCP overview (updated 2026-10-07) | <https://developer.chrome.com/docs/ai/webmcp> |
| Chrome — imperative API | <https://developer.chrome.com/docs/ai/webmcp/imperative-api> |
| Chrome — declarative API | <https://developer.chrome.com/docs/ai/webmcp/declarative-api> |
| Chrome — WebMCP versus MCP | <https://developer.chrome.com/docs/ai/webmcp/compare-mcp> |
| Chrome — when to use WebMCP | <https://developer.chrome.com/docs/ai/webmcp/use-cases> |
| Chrome — build effective tools | <https://developer.chrome.com/docs/ai/webmcp/build-tools> |
| Chrome — WebMCP tool security | <https://developer.chrome.com/docs/ai/webmcp/secure-tools> |
| Chrome — best practices | <https://developer.chrome.com/docs/ai/webmcp/best-practices> |
| Chrome — WebMCP Evals | <https://developer.chrome.com/docs/ai/webmcp/evals> |
| Chrome — WebMCP and Agents | <https://developer.chrome.com/docs/ai/agents> |
| WebMCP community portal | <https://getwebmcp.dev/> |
| MCP-B (pre-native polyfill) documentation | <https://docs.mcp-b.ai/introduction> |
| WebMCP organisation repositories | <https://github.com/WebMCP-org> |
| WPT test results | <https://wpt.fyi/results/webmcp> |

Implementation guides & commentary:

| Document | URL |
| --- | --- |
| WebMCP cheat sheet | <https://webfuse.com/webmcp-cheat-sheet> |
| Complete guide to WebMCP | <https://webmcpexpert.com/blog/what-is-webmcp-complete-guide> |
| WebMCP guide (VyomEdge) | <https://vyomedge.com/blog/what-is-webmcp-complete-guide> |
| WebMCP implementation guide 2026 | <https://openhermit.com/blog/webmcp-implementation-guide-2026> |
| WebMCP debugging in Chrome DevTools | <https://openhermit.com/blog/webmcp-debugging-chrome-devtools-2026> |
| Chrome WebMCP: complete 2026 guide | <https://a2aprotocol.ai/insights/2026-chrome-webmcp-complete-guide> |
| WebMCP tutorial (DataCamp) | <https://datacamp.com/tutorial/webmcp-tutorial> |
| WebMCP browser standard guide | <https://buildmvpfast.com/blog/webmcp-browser-standard-ai-agents-2026> |
| Agents are learning to browse better (A. B. Vijay Kumar) | <https://abvijaykumar.medium.com/webmcp-web-model-context-protocol-agents-are-learning-to-browse-better-22fcefc981d7> |

### Agentic discovery, GEO & AEO

| Document | URL |
| --- | --- |
| `/llms.txt` proposal, v2 (2026-08) | <https://llmstxt.org/> |
| `/llms.txt` — what changed since v1 | <https://llmstxt.org/changes.html> |
| `/llms.txt` reference implementation | <https://github.com/AnswerDotAI/llms-txt> |
| Lighthouse — llms.txt audit (agentic browsing checks) | <https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt> |
| Cloudflare — Content Signals Policy | <https://blog.cloudflare.com/content-signals-policy> |
| Cloudflare — controlling content use for AI training | <https://blog.cloudflare.com/control-content-use-for-ai-training> |
| Cloudflare — AI Crawl Control | <https://developers.cloudflare.com/ai-crawl-control> |
| Cloudflare — tracking robots.txt directives | <https://developers.cloudflare.com/ai-crawl-control/features/track-robots-txt> |
| Cloudflare — managed robots.txt | <https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt> |
| Addy Osmani — Agentic Engine Optimization (2026-04-11) | <https://addyosmani.com/blog/agentic-engine-optimization> |
| Search Engine Land — Google AI director's AEO playbook | <https://searchengineland.com/agentic-engine-optimization-google-ai-director-474358> |
| Google — Search at I/O 2026 | <https://blog.google/products-and-platforms/products/search/search-io-2026> |

**Real `/llms.txt` files published by AI labs** (the format in production):

| Site | URL |
| --- | --- |
| OpenAI developer docs | <https://developers.openai.com/llms.txt> |
| Anthropic docs | <https://docs.anthropic.com/llms.txt> |
| Google Gemini API docs | <https://ai.google.dev/gemini-api/docs/llms.txt> |

**Content Signals syntax** — the directive carries three independent signals
(`search`, `ai-input`, `ai-train`), e.g. `Content-Signal: search=yes, ai-train=no`:

| Document | URL |
| --- | --- |
| Content Signals in robots.txt explained | <https://glippy.dev/glossary/content-signals> |
| Content Signals: a use declaration, not a block | <https://cookingmetrics.com/blog/content-signals-robots-txt> |
| What `ai-train=no` does | <https://contextbolt.com/blog/content-signals-robots-txt> |
| `search`, `ai-input` and `ai-train` guide | <https://crawlcheck.io/guides/content-signals-in-robots-txt-search-ai-input-ai-train> |
| Content-Signal rule reference | <https://docs.squirrelscan.com/rules/ax/content-signals> |
| Cloudflare enters the robots.txt fray | <https://searchengineworld.com/cloudflare-enters-the-robots-txt-fray-with-a-content-signals-policy-for-ai-bots> |
| Original `Content-signal` discussion | <https://stackoverflow.com/questions/79807126/content-signal-search-yes-ai-train-no> |

**AI crawler user agents** — training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`,
`meta-externalagent`, `MistralAI-Training`, `CCBot`, `AI2Bot`, `Amazonbot`) versus search
crawlers (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`) versus user-triggered
fetchers (`ChatGPT-User`, `Claude-User`, `Perplexity-User`):

| Document | URL |
| --- | --- |
| AI crawler user agents explained (2026) | <https://honeyb.ai/blog/ai-crawler-user-agents-reference-2026> |
| AI search crawlers and user agents | <https://momenticmarketing.com/blog/ai-search-crawlers-bots> |
| AI crawler list (2026) | <https://samedaydesk.com/guides/ai-crawler-list-2026.html> |
| AI crawler user-agent list | <https://marcodiversi.com/blog/ai-crawler-user-agents> |
| AI crawler user-agent list (tooling) | <https://clickfrom.ai/tools/ai-crawler-user-agent-list> |
| 14 AI crawlers and robots.txt tokens | <https://anagram.ai/blog/ai-crawler-user-agent-list-2026-14-bots-and-robotstxt-tokens-to-know> |
| AI bots robots.txt guide | <https://soar.sh/blog/ai-bots-robots-txt-guide> |
| AI crawlers list (2026-10-13) | <https://contadu.com/ai-crawlers-list-2026-oai-searchbot-gptbot-claudebot-perplexitybot-and-how-to-allow-them> |

**GEO / AEO commentary:**

| Document | URL |
| --- | --- |
| GEO for AI search visibility | <https://llmrefs.com/generative-engine-optimization> |
| GEO for AI agents | <https://agentic-commerce.de/en/seo-und-geo> |
| llms.txt explained (2026 guide) | <https://c-sharpcorner.com/article/llms-txt-explained-the-ultimate-2026-guide-to-ai-search-geo-ai-crawlers-and> |
| What is llms.txt? | <https://yotpo.com/blog/what-is-llms-txt> |
| GEO guide for 2026 | <https://mecanik.dev/en/posts/generative-engine-optimization-geo-guide> |
| GEO 2026 overview | <https://digitalrootsmedia.com/blog/seo/generative-engine-optimization-geo-new-seo-2026> |
| GEO for AI Overviews (2026-06-14) | <https://techtimes.com/articles/318359/20260614/generative-engine-optimization-geo-2026-how-get-your-content-cited-chatgpt-ai-overviews.htm> |
| AEO framework guide | <https://digitalapplied.com/blog/agentic-engine-optimization-google-aeo-framework-guide> |
| AEO framework guide (2026) | <https://pressfrolic.com/ai-search-optimization/agentic-engine-optimization> |
| AEO roadmap | <https://stradiji.com/agentic-engine-optimization> |
| A third AEO — Google's AI contribution pilot | <https://cassieclarkmarketing.com/found-in-ai-a-third-aeo-google-ai-contribution-pilot-the-nyt-accuracy-study> |

**llms.txt directories, generators & tooling:**

| Tool | URL |
| --- | --- |
| llms.txt directory | <https://llmstxt.site/> |
| directory.llmstxt.cloud | <https://directory.llmstxt.cloud/> |
| llms.txt spec reference | <https://geodocs.dev/technical/llms-txt> |
| llms.txt guide (generator/validator) | <https://llmpulse.ai/blog/llms-txt-guide> |
| llms.txt format and adoption data | <https://ayautomate.com/blog/llms-txt> |
| llms.txt specification, element by element | <https://llmstxtgenerator.co/llms-txt-specification> |
| llms.txt format guide | <https://llmstxtgenerator.dev/blog/llms-txt-format> |
| llms.txt spec, real adoption, 2026 data | <https://macmdviewer.com/blog/llms-txt-guide> |
| Mintlify — automatic llms.txt generation | <https://mintlify.com/docs/ai/llmstxt> |

**AI Mode & agentic search:**

| Document | URL |
| --- | --- |
| Google AI Mode update, October 2026 | <https://coachdo.com/google-ai-mode-update-october-2026> |
| Google I/O 2026: AI Mode reaches 1B users | <https://digitalapplied.com/blog/google-search-overhaul-ai-mode-1b-users> |
| The agentic search era (I/O 2026) | <https://apiserpent.com/blog/agentic-search-io-2026-traffic-playbook> |
| Google AI Mode workflows 2026 | <https://news.creeta.com/en/google-ai-mode-agentic-search-2026> |
| AI Mode SEO impact (I/O 2026) | <https://launchcodex.com/blog/seo-geo-ai/google-io-ai-search-seo-update> |
| Google is set to remake search with agentic AI | <https://arstechnica.com/google/2026/05/buckle-up-google-is-set-to-remake-search-with-agentic-ai-in-2026> |

### Agentic commerce & agent payments

| Document | URL |
| --- | --- |
| Agentic Commerce Protocol (ACP) — OpenAI & Stripe | <https://www.agenticcommerce.dev/docs> |
| ACP — OpenAI "Buy it in ChatGPT" announcement | <https://openai.com/index/buy-it-in-chatgpt> |
| Stripe — Instant Checkout / ACP newsroom post | <https://stripe.com/newsroom/news/stripe-openai-instant-checkout> |
| Agentic Checkout Specification (ACS) | <https://agenticcommerce.pro/specification/checkout/> |
| ACS — community mirror | <https://acplib.com/en/specification/checkout> |
| Checkout.com — accept a payment via Google AI | <https://checkout.com/docs/payments/accept-payments/accept-a-payment-via-agentic-commerce/accept-a-payment-via-google-ai> |
| Agent Payments Protocol (AP2) — Google | <https://ap2-protocol.org/> |
| AP2 technical specification | <https://ap2-protocol.org/ap2/specification/> |
| AP2 sample flows | <https://ap2-protocol.org/ap2/flows/> |
| AP2 reference implementation | <https://github.com/google-agentic-commerce/AP2> |
| AP2 announcement (2025-09-16) | <https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol> |
| AP2 v0.2 and FIDO Alliance donation | <https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/> |
| FIDO Alliance — standards for trusted AI agent interactions | <https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/> |
| CSA — Secure use of AP2 | <https://cloudsecurityalliance.org/blog/2025/10/06/secure-use-of-the-agent-payments-protocol-ap2-a-framework-for-trustworthy-ai-driven-transactions> |
| arXiv — systematic security analysis of AP2 | <https://arxiv.org/abs/2608.23858v1> |
| Agent2Agent (A2A) protocol | <https://a2a-protocol.org/> |
| Universal Commerce Protocol (UCP) + AP2 | <https://ucp.dev/documentation/ucp-and-ap2/> |
| UCP REST API reference | <https://perfectpay.ai/docs/agent-commerce/ucp-rest-api> |
| x402 — HTTP 402 Payment Required | <https://docs.x402.org/core-concepts/http-402> |
| x402 — payment schemes | <https://docs.x402.org/schemes/overview> |
| x402 — V1 to V2 migration guide | <https://docs.x402.org/guides/migration-v1-to-v2> |
| x402 Foundation repository | <https://github.com/x402-foundation/x402> |
| x402 issue — v1-to-v2 PaymentRequired envelope defect | <https://github.com/x402-foundation/x402/issues/3210> |

**ACP / AP2 / x402 commentary:**

| Document | URL |
| --- | --- |
| ACP explained (2026) | <https://ayautomate.com/blog/agentic-commerce-protocol> |
| ACP and ChatGPT Checkout explained | <https://swell.is/content/agentic-commerce-protocol-explained> |
| ACP: what it is | <https://stellagent.ai/insights/openai-acp-agentic-commerce-protocol> |
| ACP retailer's guide | <https://ekamoira.com/blog/chatgpt-instant-checkout-agentic-commerce-protocol-2026> |
| AP2 explained | <https://mintmcp.com/blog/ap2-agent-payments-protocol> |
| ACP, AP2 and x402 compared | <https://orium.com/blog/agentic-payments-acp-ap2-x402> |
| AP2, x402 and ACP compared | <https://formance.com/blog/product/ap2-x402-acp-agentic-payment-protocols> |
| Top 3 agentic payment protocols in 2026 | <https://fystack.io/blog/top-3-agentic-payment-protocols-what-fintechs-need-to-know> |
| The agentic payments map | <https://www.fintechbrainfood.com/p/the-agentic-payments-map> |

**x402 implementation notes:**

| Document | URL |
| --- | --- |
| HTTP 402 Payment Required explained | <https://bmdpat.com/blog/http-402-payment-required-x402> |
| thirdweb — x402 protocol v2 support | <https://blog.thirdweb.com/changelog/support-for-x402-protocol-v2> |
| FurlPay — v2 PAYMENT-SIGNATURE headers issue | <https://github.com/FurlPay/furlpay-x402/issues/17> |
| mercury402 — accept v1 `X-PAYMENT` alongside v2 | <https://github.com/dudman1/mercury402/pull/27> |
| x402 v1→v2 migration field notes | <https://github.com/ukenal/x402-v1-to-v2-migration> |
| x402 payment flow (Avalanche) | <https://build.avax.network/academy/blockchain/x402-payment-infrastructure/03-technical-architecture/01-payment-flow> |
| Paying an x402 API without an SDK | <https://dev.to/storkhost/paying-an-x402-http-402-api-from-python-without-an-sdk-v1-body-vs-v2-payment-required-header-4jd4> |
| x402 flow reference (XDC AI) | <https://docs.xdcai.tech/reference/x402-flow> |

### Further reading

| Document | URL |
| --- | --- |
| Web Bot Auth / signed agent requests (IETF drafts) | <https://datatracker.ietf.org/> |

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
