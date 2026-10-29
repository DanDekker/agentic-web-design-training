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
  curriculum.js   Agentic Curriculum refactoring challenges (62 tasks across 17 categories & 7 tracks)
  chat.js         Real-time two-user chat engine, protocol debugger, and P99 latency benchmark
  seo.js          1st-party Schema.org JSON-LD @graph builder & HTML5 / Technical SEO auditor
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
- `GET /api/seo/json-ld` & `POST /api/seo/audit` — Generates connected Schema.org JSON-LD `@graph` structured data and audits raw HTML for HTML5 landmarks, heading outline, OpenGraph, Canonical, and JSON-LD `@graph` validity.
- `GET /api/curriculum/ecosystem` — Returns the TypeScript Framework Ecosystem catalog, cross-framework migration pathways, and multi-runtime package manager specs (`npm`, `pnpm`, `yarn-berry`, `bun`, `deno`, `jsr`).
- `GET /api/curriculum/tasks?category=...&difficulty=...&track=...` — Filters curriculum challenges by domain category, difficulty, or track.
- `POST /api/curriculum/evaluate` — Evaluates candidate refactorings (including native `Bun.Transpiler` TypeScript execution) with live telemetry.
- `POST /api/curriculum/benchmark/run-all` — Evaluates all 62 curriculum tasks (or a filtered category) in automated batch mode.

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
| `T` | Toggle Light / Dark Monochrome Theme |
| `1` / `2` / `3` / `4` | Filter: All / Active / Done / Refactoring |
| `Delete` | Remove task |
