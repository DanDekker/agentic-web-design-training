# 1M Agentic Tasks & Monochrome Suite

A modern, minimalist monochrome web application built entirely with **vanilla JavaScript, Bun, HTML, and CSS**. Zero frontend frameworks, zero runtime npm dependencies, zero build step.

```bash
bun run start   # http://localhost:3000
bun run dev     # same, with --watch
bun test        # auth, oauth, store, api, curriculum, evaluator, benchmark, components, client
```

---

## Architecture

```
src/
  auth.js         1st-party authentication (Bun.password hashing, cryptographically secure sessions)
  oauth.js        1st-party OAuth 2.0 & OIDC provider (PKCE S256, Code, Token, Userinfo, Revocation, Introspection)
  curriculum.js   Agentic Curriculum refactoring challenges (94 tasks across 24 categories & 10 tracks)
  chat.js         Real-time two-user chat engine, protocol debugger, and P99 latency benchmark
  seo.js          1st-party Schema.org JSON-LD @graph builder & HTML5 / Technical SEO auditor
  commerce.js     1st-party WebShopStore (Guest-to-Account Cart Merge, Checkout Promotion, Immutable Order Snapshots, Stripe/Polar.sh Webhooks & Ledger)
  web_traffic.js  1st-party Web Cookies (RFC 6265bis/CHIPS/DBSC), Client Storage & HTTP Traffic (RFC 9111/IETF RateLimit/W3C traceparent/RFC 9218) engine
  ts_ecosystem.js TypeScript framework catalog, cross-framework migration matrix & package manager registry
  evaluator.js    Isolated execution sandbox with Bun.Transpiler TypeScript support, AST checks, and telemetry scoring
  benchmark.js    Automated benchmark suite & markdown report generator
  store.js        Multi-board task store, atomic JSON writes, corrupt-file quarantine
  api.js          Pure Request → Response route handlers
  events.js       Server-Sent Events (SSE) live multi-tab & multi-agent synchronization
  static.js       Static file server with directory traversal protection
  server.js       Bun.serve integrating API, OAuth, and static assets
public/
  index.html      Semantic HTML5 monochrome layout, benchmark modal, diff tabs, & modals
  styles.css      Monochrome design system (light + dark mode, editorial typography, telemetry grid, diff styling)
  app.js          Reactive client state, boards, refactor inspector, auth, PKCE simulator, and benchmark runner
  components/     Custom elements for badges, diffs, tasks, and platform capability detection
tests/
  store.test.js       Task store persistence, validation, reordering
  api.test.js         API routes, lifecycle, validation, status codes
  auth_oauth.test.js  Proprietary Auth + OAuth 2.0 PKCE, client_credentials, & RFC 7662 Introspection
  curriculum.test.js  Agentic refactoring curriculum tasks & code verification
  evaluator.test.js   Sandboxed VM execution, test assertions, and runtime error capture
  benchmark.test.js   Catalog statistics, automated reference solution benchmarking, & markdown report
  components.test.js  Custom element registration, Shadow DOM, attributes, & feature detection
  client.test.js      Dialogs, shortcuts, diff updates, live synchronization, & safe rendering
  chat.test.js        Two-user real-time chat engine, out-of-order resequencing, debugger & benchmark
```

---

## 1st-Party Proprietary Authentication

Built-in proprietary authentication system using `Bun.password` (bcrypt/argon2id) and cryptographically secure 256-bit hex session tokens.

- `POST /api/auth/register` — Register a new account (`username`, `password`, `displayName`).
- `POST /api/auth/login` — Login, returns session token and sets `loom_session` HttpOnly cookie.
- `POST /api/auth/logout` — Revokes active session and clears auth cookie.
- `GET /api/auth/me` — Returns current authenticated user and role.
- Supports both `Authorization: Bearer <token>` and `Cookie: loom_session=<token>`.

### Pre-Configured Accounts:
- **Agent**: `agent` / `agent-demo-2026` (role: `agent`)
- **Lead Architect**: `pp` / `curriculum-1m` (role: `admin`)

---

## 1st-Party Proprietary OAuth 2.0 & OIDC Provider

Full RFC 6749, RFC 7636, and RFC 7662 Authorization Server:

- `GET /.well-known/openid-configuration` — OIDC discovery metadata.
- `GET /oauth/authorize` — Interactive monochrome consent screen supporting PKCE (`code_challenge`, `code_challenge_method=S256`).
- `POST /oauth/authorize/decision` — Processes user consent and issues authorization code.
- `POST /oauth/token` — Exchange authorization code for Bearer `access_token` and `refresh_token` (with PKCE `code_verifier` validation).
- `POST /oauth/token` — Machine-to-machine `grant_type=client_credentials`.
- `GET /oauth/userinfo` — Validates Bearer access token and returns user claims.
- `POST /oauth/introspect` — RFC 7662 token introspection (returns active status, scope, client_id, and exp).
- `POST /oauth/revoke` — Revokes access or refresh tokens.
- `GET /oauth/clients` — Lists registered clients (e.g. `agent-runner`, `desktop-curriculum-suite`).

---

## 1M Refactoring Curriculum Tasks

Designed for training and evaluating autonomous agents (36 curated challenges across 12 categories):

### Core Systems, Async, Performance & UI (12 Tasks)
1. **Async Pipeline**: Refactor nested callback hell into an idiomatic `async/await` pipeline with `Promise.all`.
2. **DOM Memory Leak**: Eliminate unbounded event listener subscriptions using `AbortController` signals.
3. **Algorithm Optimization**: Optimize $O(N^2)$ nested loop lookups into $O(N)$ indexed `Map` lookups.
4. **CSS Modernization**: Migrate legacy float & clearfix layouts to responsive CSS Grid & monochrome semantic tokens.
5. **Security Hardening**: Protect deep merge utilities against prototype pollution (`__proto__`, `constructor`) and ReDoS.
6. **Architecture**: Extract pure reducer state machines from tangled god-object components.
7. **Buffer Allocation**: Zero-allocation stream chunking with typed `Uint8Array` ring buffers.
8. **Middleware Pipeline**: Composable onion request middleware with `(context, next)` chaining.
9. **Reactive Debounce**: Cancelable microtask search debounce with active `AbortController`.
10. **Semantic A11y**: Convert unsemantic clickable divs to WCAG-compliant accessible ARIA primitives.
11. **Runtime Schema**: Type-safe schema validator replacing brittle unchecked property access.
12. **Worker Pool**: Decouple CPU-intensive work to non-blocking bounded concurrency pools.

### Database Connectivity & Distributed Persistence (`database` — 4 Tasks)
13. **Connection Pool**: Bounded connection pool with idle reuse, `ping()` health checks, waiter queue timeouts, and `withConnection()` automatic release.
14. **Transactional Outbox**: Parameterized SQL (`$1, $2`), atomic `BEGIN`/`COMMIT`/`ROLLBACK` outbox event insertion, and transient deadlock (`40001`/`40P01`/`SQLITE_BUSY`) retry.
15. **Keyset Pagination & DataLoader**: Eliminate $1+N$ queries via `queueMicrotask` batch coalescing and indexed keyset cursor pagination.
16. **Causal LSN Replica Router**: Read/write split router tracking session `minLsn` against replica `appliedLsn` for read-your-own-writes consistency with primary failover.

### Deep Web Authentication (`web-auth` — 4 Tasks)
17. **OAuth 2.0 DPoP (RFC 9449)**: Sender-constrained proof-of-possession verifier validating `dpop+jwt`, `htm`, `htu`, `ath`, `cnf.jkt` thumbprint binding, and `jti` replay cache.
18. **WebAuthn / FIDO2 Passkey Verifier**: Validates `clientDataJSON`, binary `authenticatorData` (`UP`/`UV` flags, RP ID hash), and big-endian `signCount` clone detection.
19. **Refresh Token Rotation & Reuse Detection**: Single-use refresh tokens grouped by `familyId` with immediate family-wide revocation upon replay of a rotated token.
20. **OIDC Federated JWT & JWKS Key Rotation**: Enforces asymmetric signing algorithm allowlists (`RS256`, `ES256`, `EdDSA`), on-miss JWKS `kid` rotation refresh, `azp`, and `nonce` validation.

### Web Fingerprinting & Anti-Bot Signals (`web-fingerprinting` — 4 Tasks)
21. **Multi-Surface Entropy Normalizer**: Deterministic FNV-1a hashing across Canvas, WebGL, AudioContext, and platform signals with cross-layer OS/renderer spoofing detection (`SwiftShader`, `webdriver`).
22. **JA4+ TLS ClientHello & HTTP/2 Correlator**: Strips RFC 8701 TLS GREASE values, computes canonical JA4 signatures, and correlates HTTP/2 pseudo-header order (`:method,:authority,:scheme,:path`).
23. **Privacy Budget & Canvas Farbling Guard**: Per-origin cumulative entropy budget enforcement with deterministic session+origin keyed PRNG LSB pixel perturbation.
24. **Behavioral Biometrics Classifier**: Pointer velocity variance, 2D cross-product collinearity, untrusted DOM event detection, and keystroke dwell-time analysis.

### Web Cybersecurity Hardening (`web-cybersec` — 4 Tasks)
25. **SSRF & DNS Rebinding Guard**: Blocks loopback, RFC 1918, CGNAT, IPv6-mapped IPv4 (`::ffff:127.0.0.1`), and cloud metadata (`169.254.169.254`) while pinning resolved DNS IPs with `redirect: "manual"`.
26. **DOM XSS Sanitizer & Trusted Types CSP**: Strips dangerous tags, `on*` attributes, and entity-obfuscated `javascript:`/`data:` URIs paired with a `strict-dynamic` nonce CSP requiring Trusted Types.
27. **Constant-Time HMAC Webhook & Fetch-Metadata CSRF**: Bitwise XOR constant-time comparison, timestamp replay window + nonce deduplication, and `Sec-Fetch-Site` / Origin / double-submit CSRF verification.
28. **HTTP/1.1 Desync (CL.TE / TE.CL) & CRLF Guard**: RFC 9112 framing validator rejecting simultaneous `Transfer-Encoding` and `Content-Length`, conflicting duplicate lengths, and CRLF header splitting.

### Long-Horizon Agentic Workflows (`agentic-workflow` — 4 Tasks)
29. **Hierarchical DAG Planner & Saga Compensation**: Cycle detection, concurrent topological wave execution, durable checkpoint resumption, and reverse-order Saga `compensate()` rollback.
30. **Self-Healing Multi-Tool Loop & Circuit Breakers**: Per-tool circuit breakers with automatic fallback routing, action-signature loop detection, and strict token/step budgets.
31. **Episodic Memory Compactor & Goal-Drift Guard**: Pins immutable root goal contracts across context compactions, indexes evicted turns for lexical+importance recall, and blocks out-of-scope drift.
32. **Multi-Agent Lease Coordinator & Fencing Arbiter**: Hierarchical parent/child path conflict detection with monotonically increasing fencing epochs to block zombie agent overwrites.

### Real-Time Two-User Chat & Protocol Engineering (`realtime-chat` — 4 Tasks)
33. **Two-User Real-Time Chat Instrumentation**: Canonical `dm:<userA>:<userB>` rooms, monotonic sequence IDs (`seq`), per-user read watermarks, typing TTL pruning, and telemetry counters.
34. **Debug Out-of-Order & Reconnect Duplication**: Client message ID (`clientMsgId`) idempotency table, contiguous sequence holdback resequencing buffer, and ghost typing eviction.
35. **Pure Chat Protocol State Machine**: Refactor tangled imperative socket/DOM callbacks into a deterministic reducer (`chatProtocolReducer`) emitting `{ state, effects }`.
36. **O(1) Circular Ring Buffer & P99 Fanout Benchmark**: Replace $O(N^2)$ array spread copies with modular ring-buffer slot indexing, single-encode SSE wire frames, and P50/P99 latency benchmarking.

### Advanced Modern CSS Architecture (`css` — 5 Tasks)
37. **Container Size/Style Queries & Subgrid**: Intrinsic `container-type: inline-size`, `@container` size and `style(--featured: true)` queries, and `grid-template-rows: subgrid` alignment.
38. **Cascade Layers (`@layer`), `@property` & Relative `oklch()` Tokens**: Deterministic `@layer reset, tokens, base, components, utilities;`, typed `@property` descriptors, `light-dark()`, and `oklch(from var(--brand) ...)` relative color derivation.
39. **Scroll-Driven Animations & View Transitions**: Compositor-driven `animation-timeline: scroll()` and `view()` with `animation-range`, `::view-transition-old/new(root)`, and `@media (prefers-reduced-motion: reduce)`.
40. **CSS Anchor Positioning & Relational `:has()`**: Native `anchor-name`, `position-anchor`, `anchor()`, `position-try-fallbacks`, `@position-try`, and `:has([popover]:popover-open)` parent styling.

### Fortune 500 TypeScript Frameworks (`ts-frameworks` — 4 Tasks)
41. **React 19 / Next.js App Router Server Actions**: Strict TypeScript discriminated union `ActionResult<T>`, `useOptimistic`-compatible rollback reducer (`OPTIMISTIC_ADD`, `COMMIT_SUCCESS`, `ROLLBACK_FAILURE`), and validated `createSafeServerAction`.
42. **Angular Enterprise Signals & `switchMap` Store**: Reactive `signal<T>()`, lazy memoized `computed<T>()` with automatic dependency tracking, and cancelable `createSwitchMapLoader` with `AbortController`.
43. **NestJS IoC Container, RBAC Guard & Audit Interceptor**: Token-based `NestContainer` singleton/factory DI, `CanActivate` role guard, and around-advice `NestInterceptor` (`CallHandler`).
44. **tRPC + Zod Generic Procedure Builder**: Fluent generic `ProcedureBuilder<TContext, TInput>` with context-narrowing `.use()` middleware, `.input()` runtime schema validation, `TRPCError`, and `createCaller`.

### Cross-Framework TypeScript Migrations (`framework-migration` — 4 Tasks)
45. **Express.js → Hono / Fastify Web-Standard Edge Router**: Migrate legacy `req`/`res` callback mutation to Web-Standard Fetch `Request`/`Response`, typed `EdgeContext<TVariables>`, `:param` extraction, and async onion middleware.
46. **React Hooks → Svelte 5 Runes (`$state`/`$derived`/`$effect`) & Vue 3 Reactivity**: Eliminate manual dependency arrays and stale closures using auto-tracking fine-grained reactive primitives and deterministic effect cleanup.
47. **Redux Thunks → TanStack Query SWR Cache Engine**: Canonical `QueryKey` hashing, concurrent in-flight Promise deduplication, `staleTimeMs` SWR caching, prefix `invalidateQueries`, and optimistic mutation rollback.
48. **Next.js Pages Router (`getServerSideProps`) → App Router Parallel RSC & `revalidateTag`**: Parallel Server Component tagged caching (`fetchWithTags`) and Web-Standard `POST` Route Handler cache eviction.

### Multi-Runtime & Package Manager Ecosystem (`package-managers` — 4 Tasks)
49. **npm / Yarn Classic → Strict `pnpm` & `bun` Workspaces**: Detect undeclared phantom dependencies in hoisted `node_modules`, rewrite sibling versions to `workspace:^`, extract shared versions to `catalog:`, and pin `packageManager`.
50. **Dual CJS/ESM Conditional `exports` Map & Deno/JSR (`jsr.json`)**: Order `types` first inside `import` (`.d.mts`/`.mjs`) and `require` (`.d.cts`/`.cjs`) blocks alongside native `bun`/`deno` TypeScript conditions and `jsr.json`.
51. **Cross-Package-Manager Lockfile Supply-Chain Auditor (`npm`, `pnpm`, `yarn`, `bun`, `deno`)**: Detect `@corp/*` dependency confusion scope leaks, untrusted tarball hosts, weak/missing `sha512-` SRI digests, and unapproved install scripts.
52. **Content-Addressable Monorepo Task Orchestrator (`Turborepo` / `Nx` / `bun --filter` / `pnpm -r`)**: Concurrent topological wave scheduler with cycle detection, upstream dependency hash propagation, and `CACHE_HIT` artifact replay.

### WHATWG HTML Living Standard Architecture (`html-architecture` — 5 Tasks)
53. **WHATWG Speculation Rules API (`<script type="speculationrules">`)**: Document-scoped `prerender`/`prefetch` rules with `where.and`/`not` route & selector exclusions (`/logout`, `/api/*`, `[data-no-prerender]`) and `Save-Data` / `slow-2g` suppression.
54. **SSR Declarative Shadow DOM (`<template shadowrootmode="open">`)**: Streaming SSR Declarative Shadow DOM with `shadowrootdelegatesfocus`, `shadowrootclonable`, named `<slot>` fallbacks, and idempotent `host.shadowRoot` client hydration.
55. **Native `<dialog closedby="any">`, Popover API, Invoker Commands & `inert`**: Declarative `commandfor` / `command="show-modal"` / `command="close"`, `popover="auto"`, `<search>` landmark, and background `inert` state.
56. **Hero LCP & CLS `<picture>` Art Direction & `fetchpriority="high"`**: Progressive `image/avif` and `image/webp` `<source>` sets, explicit `width`/`height` dimensions, `loading="eager"`, `fetchpriority="high"`, and `<link rel="preload" as="image" imagesrcset>`.
57. **HTML `<script type="importmap">` with Scoped Resolution, SRI Map & `<link rel="modulepreload">`**: Enforces WHATWG importmap parser ordering, maps module URLs to `sha384-` Subresource Integrity digests, and flattens ESM waterfalls with `modulepreload`.

### Technical SEO, JSON-LD `@graph`, Structured Data & Schema.org (`seo-structured-data` — 5 Tasks)
58. **Connected Schema.org JSON-LD `@graph` Builder**: Cross-linked `Organization`, `WebSite`, `BreadcrumbList`, `WebPage`, and `TechArticle` entities using stable `@id` URIs (`#organization`, `#website`, `#webpage`, `#article`, `#breadcrumb`) and XSS-safe unicode escaping (`\u003c/script\u003e`).
59. **Rich-Result Schema.org `Product`, `Offer`, `MerchantReturnPolicy` & `AggregateRating`**: Validates GTIN-13, ISO-4217 currency, `https://schema.org/InStock` full enum URIs, `MerchantReturnPolicy`, `OfferShippingDetails`, and rating bounds.
60. **Technical SEO `<head>` Compiler (Canonical, `hreflang`, Robots & OpenGraph)**: Strips `utm_*`/`fbclid`/`gclid` tracking params, normalizes HTTPS canonical URLs, emits localized `hreflang` clusters with `x-default`, `max-image-preview:large`, and escaped OpenGraph tags.
61. **Automated HTML5 Landmark, Heading Outline & Schema.org Microdata Linter**: Audits single `<h1>`, sequential heading hierarchy, `<main>` landmark, `<time datetime>` ISO-8601 format, and `itemscope`/`itemtype="https://schema.org/..."`/`itemprop` integrity.
62. **Schema.org `Dataset`, WebSite `SearchAction` & `FAQPage` Multi-Entity Graph**: Connects `Dataset` (`DataDownload`, `encodingFormat`, `license`), `WebSite` `potentialAction` (`SearchAction` with `{search_term_string}`), `Organization` `sameAs`, and `FAQPage` `Question`/`Answer` nodes.

### E-Commerce & Checkout Engineering (`ecommerce-checkout` — 5 Tasks)
63. **Integer Minor-Unit (`Dinero` Pattern) Multi-Currency Cart & Hamilton's Largest-Remainder Proration**: Eliminates IEEE-754 float drift, handles 0-decimal (`JPY`, `KRW`) vs 2-decimal (`USD`, `EUR`, `GBP`) currencies, and splits cart-level discounts across line items without losing rounding pennies.
64. **Atomic Inventory Reservation Hold Engine with TTL Lease Expiry & Flash-Sale Oversell Guard**: Subtracts active TTL-bound reservation holds from physical stock, reclaims expired leases automatically, and commits stock atomically on payment capture.
65. **Global Cross-Border Tax, EU VAT Reverse-Charge (`B2B` VIES) & US Economic Nexus Calculator**: Applies `0%` VAT with `reverseCharge: true` and statutory Article 196 invoice notices for valid cross-border EU B2B VAT IDs, destination OSS VAT for EU B2C, and `$100,000` / `200`-transaction US state economic nexus thresholds.
66. **Multi-Step Checkout & 3-D Secure (`requires_action`) Saga Coordinator**: Transitions deterministically through `INVENTORY_RESERVED` -> `PROMO_LOCKED` -> `AWAITING_3DS_ACTION` -> `FULFILLED` and executes LIFO reverse-order compensation (`cancelPaymentIntent` -> `unlockPromoCoupon` -> `releaseInventory`) on failure.
67. **Polar.sh Merchant-of-Record (`@polar-sh/sdk`) Digital Entitlement, License Key & Device Seat Engine**: Provisions scoped `POLAR-PRO-*` license keys, enforces `maxActivations` per machine fingerprint with idempotent re-activation, and revokes seats on `subscription.revoked` or `order.refunded`.

### Payment Processing, Stripe & Polar.sh (`payment-processing` — 5 Tasks)
68. **Stripe `PaymentIntent` & `Checkout.Session` Idempotency Coordinator**: Hashes request parameters per `Idempotency-Key` (throwing `IdempotencyParameterMismatchError` on mutated payload reuse), replays cached intents on retry, and supports `capture_method: "manual"` partial/full settlement.
69. **Dual Stripe (`Stripe-Signature` `t=,v1=`) & Polar.sh Standard Webhooks (`webhook-signature` `v1,`) HMAC Verifier**: Raw-body constant-time signature verification, 300-second replay window tolerance, event ID deduplication, and per-entity timestamp watermarks to drop stale out-of-order webhooks.
70. **SaaS Subscription Mid-Cycle Upgrade/Downgrade Proration & Smart Dunning State Machine**: Computes second-granularity unused credit and remaining new-plan debit (`netInvoiceDeltaMinor`), plus exponential dunning retries (`past_due` -> `grace_hold` -> `unpaid_suspended`) that preserve entitlements during grace periods.
71. **Immutable Double-Entry Financial Ledger for Stripe Connect Marketplace Splits & Partial Refunds**: Enforces `sum(DEBIT) === sum(CREDIT)` across `buyer_external`, `stripe_processing_fee`, `platform_commission`, and `seller_escrow_payable` with proportional fee clawbacks on partial refunds.
72. **Usage-Based AI Token & GPU Meter Billing Engine (Polar Meters / Stripe Billing)**: Idempotent `eventId` meter ingestion, graduated tier bracket pricing (`upToUnits`, `blockSize`, `unitCostMinorPerBlock`), and automatic prepaid credit wallet drawdown.

### Web Shop Storefront UI & Account-to-Checkout Flow (`storefront-ui` — 5 Tasks)
73. **Faceted Product Catalog Filter & Multi-Axis Variant Matrix (`Color` × `Size` × `Storage`) SKU Selector**: Evaluates cross-axis stock availability (`inStockWithCurrentSelection`) to disable out-of-stock combinations before click, resolves `IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK` badges, and syncs canonical `?color=...&layout=...&sku=...` URL parameters.
74. **Optimistic Slide-Over Cart Drawer UI Controller with Rollback & Catalog Price-Drift Guard**: Applies optimistic quantity updates with full snapshot rollback on server rejection, drops stale out-of-order responses via monotonic `mutationId` watermarks, and surfaces `priceDriftNotices` + ARIA live announcements.
75. **Seamless Guest-to-Account Creation, Cart Line-Item Conflict Merger & Address Book Deduplicator**: Upgrades anonymous guest carts into authenticated customer accounts, merges overlapping SKUs clamped to `Math.min(availableStock, maxPerOrder)`, and deduplicates shipping addresses via canonical postal fingerprints.
76. **Accessible Multi-Step Checkout Stepper (`Account` → `Shipping` → `Payment` → `Review`)**: Enforces step prerequisite gates, invalidates downstream payment locks and tax quotes whenever the shipping address is modified, and emits WHATWG section-scoped `autocomplete` tokens (`shipping email`, `shipping address-line1`, `shipping postal-code`).
77. **Interactive Order History, Split-Shipment Timeline & Self-Service Return (`RMA`) Eligibility Portal UI**: Computes per-line returnable quantities (`deliveredQty - alreadyReturnedQty`), blocks returns on digital license keys or expired 30-day windows, and previews exact minor-unit refunds.

### Order Lifecycle & Commerce Data Architecture (`order-lifecycle-data` — 5 Tasks)
78. **Normalized Commerce Entity Store (`customers`, `orders`, `orderItems`, `shipments`) with Referential Integrity**: Eliminates duplicated nested state using primary-key maps, $O(1)$ foreign-key secondary indexes (`ordersByCustomer`, `itemsByOrder`, `shipmentsByOrder`), and `ForeignKeyConstraintError` guards.
79. **Immutable Order Line-Item Price, Tax & Title Snapshot Vault**: Deep-freezes (`Object.freeze`) checkout line-item prices, discounts, tax rates, and titles with a tamper-evident `snapshotHash` so future catalog price changes or SKU deletions never corrupt historical customer invoices.
80. **Atomic Checkout-to-Order Promotion Pipeline**: Pre-validates stock across all cart SKUs, deducts inventory, issues sequential `INV-2026-XXXXX` invoice numbers, rolls up customer `orderCount` and `lifetimeSpendMinor`, and marks the cart `CONVERTED_TO_ORDER` idempotently.
81. **Split-Shipment Fulfillment, Backorder Cancellations & Partial Capture Reconciler**: Enforces line-item quantity conservation (`shippedQty + canceledQty <= orderedQty`) and reconciles `authorizedTotalMinor === capturedMinor + releasedAuthorizationMinor + remainingCapturableMinor`.
82. **Hash-Chained Event-Sourced Customer & Order Lifecycle Audit Log**: Enforces causal transitions (`ACCOUNT_CREATED` -> `GUEST_CART_MERGED` -> `CHECKOUT_AUTHORIZED` -> `ORDER_CAPTURED` -> `SHIPMENT_DELIVERED` -> `RMA_RETURN_APPROVED` -> `ORDER_REFUNDED`) over a tamper-evident hash chain and guards against over-refunding.

### Deep Web Cookies — RFC 6265bis, CHIPS & W3C DBSC (`web-cookies` — 4 Tasks)
83. **RFC 6265bis `Set-Cookie` Serializer & Auditor (`__Host-`, `__Secure-`, CHIPS `Partitioned`, 400-Day Cap)**: Enforces `__Host-` invariants (`Secure=true`, no `Domain`, `Path=/`), `SameSite=None` `Secure` requirement, CHIPS `Partitioned` top-level site isolation, 4096-byte size limit, and the 400-day (`34,560,000s`) `Max-Age` cap.
84. **Key-Ring Signed Cookie Jar (`kid` Rotation) & Subdomain Cookie-Tossing Defense**: Binds `cookieName`, `kid`, and payload into an HMAC signature, iterates across all duplicate same-name cookies in the `Cookie` request header to defeat subdomain cookie-tossing, and signals `needsKeyRotationReSign` when verified by a retiring key.
85. **W3C Device Bound Session Credentials (`DBSC`) Short-Lived Cookie Refresh & `Clear-Site-Data` Eviction**: Pairs short-lived `__Host-dbsc_sid` cookies with TPM/Secure-Enclave public keys, challenges refresh requests with `Sec-Session-Challenge`, verifies `Sec-Session-Response` hardware proof-of-possession, and emits `Clear-Site-Data: "cookies", "storage"` on compromise.
86. **Granular Cookie Consent & Retention Gatekeeper**: Classifies cookies by purpose (`strictly_necessary`, `functional`, `analytics`, `marketing`), fails closed on unclassified cookies, and generates immediate `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT` eviction headers when consent is withdrawn.

### Client Web Data & Storage Engineering (`web-storage-data` — 4 Tasks)
87. **Transactional IndexedDB Schema Migration Runner (`v1` → `v3`) & Compound Index Range Cursors**: Executes sequential step-by-step schema upgrades with full snapshot rollback on failure and supports bounded cursor queries over `[tenantId, updatedAtMs]`.
88. **Multi-Tab State Synchronization & Single-Leader Election (`BroadcastChannel`, `Web Locks` Lease & Lamport Clocks)**: Elects a single active leader tab with lease expiry failover, orders cross-tab writes via Lamport logical clocks `(lamportCounter, originTabId)`, and deduplicates broadcast packets.
89. **Quota-Aware Client Storage Manager (`navigator.storage.estimate`) & Weighted Cost-LRU Eviction**: Tracks byte usage against origin quota, protects `pinned: true` user drafts from eviction, and evicts lowest-score unpinned cache entries (`lastAccessedMs * regenerationCostWeight`) before throwing `QuotaExceededError`.
90. **Offline-First Mutation Outbox Queue with Causal Log Compaction & 3-Way `ETag` Conflict Merge**: Compacts `CREATE + UPDATE` into `CREATE`, elides `CREATE + DELETE` pairs, and resolves HTTP `412 Precondition Failed` conflicts via field-level 3-way merge (`baseSnapshot`, `localModified`, `serverCurrent`).

### Web Traffic, HTTP Caching & Telemetry (`web-traffic` — 4 Tasks)
91. **RFC 9111 HTTP Cache Coordinator (`stale-while-revalidate`, `Vary` Keys & `ETag` `304 Not Modified`)**: Computes composite cache keys across normalized `Vary` request headers, serves `stale-while-revalidate` responses with background refresh, and short-circuits `304 Not Modified` on `If-None-Match`.
92. **CDN Edge Request Coalescing (`Singleflight`) & Negative Cache Stampede Shield**: Collapses $N$ concurrent cache misses for the same key into 1 origin fetch Promise (`COALESCED_IN_FLIGHT`) and applies short-TTL negative caching for `404 Not Found` responses.
93. **Multi-Tier Token-Bucket Rate Limiter Emitting IETF `RateLimit-*` & `Retry-After` Headers**: Continuous time-based token refill, route-specific cost weights, and standard `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `RateLimit-Policy`, and `Retry-After` headers.
94. **W3C Trace Context (`traceparent`) Propagator, `Server-Timing` Compiler & RFC 9218 HTTP `Priority` (`u=0..7, i`) Scheduler**: Validates incoming W3C `traceparent` headers, mints child span IDs, orders requests by RFC 9218 urgency/incremental directives, and formats `Server-Timing` headers.

---

## Real-Time Two-User Chat, Protocol Debugger & Latency Benchmark

- `GET /api/chat/rooms` & `POST /api/chat/rooms` — Lists or provisions canonical two-user direct chat rooms (`dm:agent:pp`).
- `GET /api/chat/messages?roomId=...&afterSeq=...` & `POST /api/chat/messages` — Real-time message delivery with monotonic `seq`, `clientMsgId` idempotency deduplication, out-of-order holdback resequencing, and SSE broadcast (`type: "chat"`).
- `POST /api/chat/typing` & `POST /api/chat/read` — Ephemeral TTL typing indicators and monotonic read-receipt watermarks.
- `GET /api/chat/debug?roomId=...` — Runs 5 automated protocol invariant checks (sequence contiguity, ring-buffer bounds, ghost typing TTL hygiene, read watermark bounds, and reorder holdback queue).
- `POST /api/chat/benchmark` — Executes a high-throughput two-user chat benchmark measuring `throughputMsgsPerSec`, `p50Ms`/`p95Ms`/`p99Ms` fanout latency, duplicate suppression, and out-of-order resequencing.

---

## Automated Sandbox Evaluation & Benchmark Suite

- **Execution Telemetry**: Evaluates code in an isolated VM context and measures execution duration (ms), memory, and assertion pass rates.
- **Live Code Diff**: Side-by-side and inline diff viewer highlighting additions and deletions.
- **Benchmark Suite (`GET /api/curriculum/benchmark`)**: Generates automated benchmark summaries, domain breakdowns, and formatted Markdown reports for agent evaluation.
- `GET /api/traffic/overview`, `POST /api/traffic/cookies/audit` & `POST /api/traffic/cache-trace/simulate` — Audits RFC 6265bis `__Host-` / CHIPS `Partitioned` / key-rotated signed cookies and simulates RFC 9111 HTTP caching (`stale-while-revalidate`, `Vary`, `ETag` 304), IETF `RateLimit` headers, RFC 9218 `Priority`, W3C `traceparent`, and `Server-Timing`.
- `GET /api/commerce/shop/state`, `POST /api/commerce/shop/cart/items`, `POST /api/commerce/shop/account`, `POST /api/commerce/shop/checkout`, `POST /api/commerce/shop/orders/lifecycle` & `POST /api/commerce/shop/catalog-mutate` — Full normalized Web Shop engine handling guest carts, account creation + cart merge, atomic checkout-to-order promotion (`INV-2026-XXXXX`), immutable order snapshot isolation, split-shipment delivery, RMA returns, and store-wide data integrity verification.
- `GET /api/commerce/catalog`, `POST /api/commerce/checkout/quote`, `POST /api/commerce/webhooks/verify` & `POST /api/commerce/ledger/split` — Exposes Stripe & Polar.sh payment architecture specs, computes integer minor-unit cart quotes with Largest-Remainder discount proration and EU VAT / US Nexus taxes, verifies Stripe (`Stripe-Signature`) and Polar.sh Standard Webhooks (`webhook-signature`), and computes double-entry Connect ledger splits.
- `GET /api/seo/json-ld` & `POST /api/seo/audit` — Generates connected Schema.org JSON-LD `@graph` structured data and audits raw HTML for HTML5 landmarks, heading outline, OpenGraph, Canonical, and JSON-LD `@graph` validity.
- `GET /api/curriculum/ecosystem` — Returns the TypeScript Framework Ecosystem catalog, cross-framework migration pathways, and multi-runtime package manager specs (`npm`, `pnpm`, `yarn-berry`, `bun`, `deno`, `jsr`).
- `GET /api/curriculum/tasks?category=...&difficulty=...&track=...` — Filters curriculum challenges by domain category, difficulty, or track.
- `POST /api/curriculum/evaluate` — Evaluates candidate refactorings (including native `Bun.Transpiler` TypeScript execution) with live telemetry.
- `POST /api/curriculum/benchmark/run-all` — Evaluates all 94 curriculum tasks (or a filtered category) in automated batch mode.

---

## Keyboard Navigation

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Open Command Palette |
| `N` / `/` | New Task / Focus Search |
| `J` / `K` | Move focus down / up |
| `X` | Toggle task completion |
| `Enter` | Edit task title |
| `R` | Open Refactor Inspector or Seed Curriculum |
| `O` | Open OAuth 2.0 Applications & Simulator |
| `B` | Open Benchmark Suite Modal & Runner |
| `C` | Open Two-User Real-Time Chat, Debugger & P99 Benchmark |
| `S` | Open Web Shop Storefront, Checkout & Order History Inspector |
| `W` | Open Web Cookies, Client Data & HTTP Traffic Inspector |
| `T` | Toggle Light / Dark Monochrome Theme |
| `1` / `2` / `3` / `4` | Filter: All / Active / Done / Refactoring |
| `Delete` | Remove task |
