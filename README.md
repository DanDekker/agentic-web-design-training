<div align="center">

<img src="assets/gauntlet-banner.svg" alt="LLM Webdev Gauntlet" width="100%">

<p><strong>Web development challenges. One local workspace for testing solutions.</strong></p>

<p><a href="https://github.com/DanDekker/gauntlet-web/actions/workflows/ci.yml"><img src="https://github.com/DanDekker/gauntlet-web/actions/workflows/ci.yml/badge.svg" alt="CI status"></a></p>

<p><a href="#technology-map">Technologies</a> · <a href="#get-started">Get started</a> · <a href="#the-curriculum">Curriculum</a> · <a href="#how-evaluation-works">Evaluation</a> · <a href="#ci-and-container-releases">CI &amp; releases</a></p>

</div>

---

**LLM Webdev Gauntlet** is a local curriculum and evaluation workspace for web development agents. It combines code challenges, an interactive task board, automated checks, and a benchmark of the included reference solutions. The application is called **gauntlet-web** and runs on Bun with vanilla JavaScript, HTML, and CSS. It includes the parse5 HTML parser as a locked dependency; there is no build step.

## Technology map

The app uses the first row. The remaining logos show technologies covered by the curriculum. Every logo links to the project’s source repository.

**Built with**

<table>
  <tr>
    <td align="center"><a href="https://github.com/oven-sh/bun"><img src="assets/logos/bun.svg" alt="Bun logo" width="40" height="40"><br>Bun</a></td>
    <td align="center"><a href="https://github.com/tc39/ecma262"><img src="assets/logos/javascript.svg" alt="JavaScript logo" width="40" height="40"><br>JavaScript</a></td>
    <td align="center"><a href="https://github.com/whatwg/html"><img src="assets/logos/html5.svg" alt="HTML logo" width="40" height="40"><br>HTML</a></td>
    <td align="center"><a href="https://github.com/w3c/csswg-drafts"><img src="assets/logos/css.svg" alt="CSS logo" width="40" height="40"><br>CSS</a></td>
  </tr>
</table>

**Frameworks and UI state in the curriculum**

<table>
  <tr>
    <td align="center"><a href="https://github.com/microsoft/TypeScript"><img src="assets/logos/typescript.svg" alt="TypeScript logo" width="40" height="40"><br>TypeScript</a></td>
    <td align="center"><a href="https://github.com/react/react"><img src="assets/logos/react.svg" alt="React logo" width="40" height="40"><br>React</a></td>
    <td align="center"><a href="https://github.com/vercel/next.js"><img src="assets/logos/nextdotjs.svg" alt="Next.js logo" width="40" height="40"><br>Next.js</a></td>
    <td align="center"><a href="https://github.com/angular/angular"><img src="assets/logos/angular.svg" alt="Angular logo" width="40" height="40"><br>Angular</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/vuejs/core"><img src="assets/logos/vuedotjs.svg" alt="Vue logo" width="40" height="40"><br>Vue</a></td>
    <td align="center"><a href="https://github.com/sveltejs/svelte"><img src="assets/logos/svelte.svg" alt="Svelte logo" width="40" height="40"><br>Svelte</a></td>
    <td align="center"><a href="https://github.com/reduxjs/redux"><img src="assets/logos/redux.svg" alt="Redux logo" width="40" height="40"><br>Redux</a></td>
    <td align="center"><a href="https://github.com/TanStack/query"><img src="assets/logos/tanstack.svg" alt="TanStack Query logo" width="40" height="40"><br>TanStack Query</a></td>
  </tr>
</table>

**Server and API tooling in the curriculum**

<table>
  <tr>
    <td align="center"><a href="https://github.com/expressjs/express"><img src="assets/logos/express.svg" alt="Express logo" width="40" height="40"><br>Express</a></td>
    <td align="center"><a href="https://github.com/nestjs/nest"><img src="assets/logos/nestjs.svg" alt="NestJS logo" width="40" height="40"><br>NestJS</a></td>
    <td align="center"><a href="https://github.com/trpc/trpc"><img src="assets/logos/trpc.svg" alt="tRPC logo" width="40" height="40"><br>tRPC</a></td>
    <td align="center"><a href="https://github.com/colinhacks/zod"><img src="assets/logos/zod.svg" alt="Zod logo" width="40" height="40"><br>Zod</a></td>
    <td align="center"><a href="https://github.com/honojs/hono"><img src="assets/logos/hono.svg" alt="Hono logo" width="40" height="40"><br>Hono</a></td>
    <td align="center"><a href="https://github.com/fastify/fastify"><img src="assets/logos/fastify.svg" alt="Fastify logo" width="40" height="40"><br>Fastify</a></td>
  </tr>
</table>

**Package ecosystems in the curriculum**

<table>
  <tr>
    <td align="center"><a href="https://github.com/npm/cli"><img src="assets/logos/npm.svg" alt="npm logo" width="40" height="40"><br>npm</a></td>
    <td align="center"><a href="https://github.com/pnpm/pnpm"><img src="assets/logos/pnpm.svg" alt="pnpm logo" width="40" height="40"><br>pnpm</a></td>
    <td align="center"><a href="https://github.com/yarnpkg/berry"><img src="assets/logos/yarn.svg" alt="Yarn logo" width="40" height="40"><br>Yarn</a></td>
    <td align="center"><a href="https://github.com/denoland/deno"><img src="assets/logos/deno.svg" alt="Deno logo" width="40" height="40"><br>Deno</a></td>
    <td align="center"><a href="https://github.com/jsr-io/jsr"><img src="assets/logos/jsr.svg" alt="JSR logo" width="40" height="40"><br>JSR</a></td>
  </tr>
</table>

**Payments in the curriculum**

<table>
  <tr>
    <td align="center"><a href="https://github.com/stripe/stripe-node"><img src="assets/logos/stripe.svg" alt="Stripe logo" width="40" height="40"><br>Stripe</a></td>
    <td align="center"><a href="https://github.com/polarsource/polar"><img src="assets/logos/polar.svg" alt="Polar logo" width="40" height="40"><br>Polar</a></td>
  </tr>
</table>

Logo sources: [Simple Icons and Polar](assets/logos/SOURCES.md).

## Get started

Requires [Bun](https://bun.sh/).

```bash
git clone https://github.com/DanDekker/gauntlet-web.git
cd gauntlet-web
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

Open **http://localhost:3000**. Use **Demo Agent** on the sign-in screen, then open the curriculum board. Select an exercise to read its prompt, starter code, and acceptance criteria. Submit a JavaScript or TypeScript solution to see assertion results and a diff. The **Benchmark** view runs the bundled reference solutions across the catalog and can export a Markdown report. A new task store is seeded on first launch; use **Curriculum** to add missing exercises later without replacing existing progress.

For a regular server without file watching, use `bun run start`. Run the test suite with `bun test`.

Use **⌘K** or **Ctrl+K** to open the command palette, then use the arrow keys and Enter to choose a command; Tab reaches its close button and Escape dismisses it. Single-key page shortcuts apply when focus is outside interactive controls. Task filters use the native radio-group arrow keys. Use each task's move-up and move-down buttons to reorder without dragging. In the exercise inspector, use Left/Right or Home/End to move between code tabs. Board and task controls retain focus when live updates replace their rows.

Inline task edits save on Enter or when focus leaves the field; Escape cancels an edit. If a save fails, the draft stays in the field or appears as an **Unsaved edit — resume** button when you return to the task. Drafts are kept in the current page only. Move buttons work relative to the visible tasks, while preserving tasks hidden by a filter.

## The curriculum

The repository currently includes **220 exercises in 42 categories and 21 tracks**, from introductory refactoring to more involved web systems work. Topics include:

| Area | Examples |
| --- | --- |
| Core web engineering | Async flows, performance, architecture, CSS, accessibility |
| Data and identity | Database access, distributed persistence, authentication, security |
| Application systems | Realtime chat, commerce, storefronts, order lifecycles |
| Web platform | HTML, structured data, cookies, storage, HTTP traffic |
| UI engineering | Design tokens, interaction patterns, web components |
| Developer tooling | Express 5, TypeScript frameworks, migrations, package management |
| Browser platform | Web Workers, streams, WebGPU compute, WebTransport, WebAssembly, WebNN, Digital Credentials |
| Spatial and real-time media | WebXR depth sensing, WebRTC signaling and encoded transforms, SFrame, WebCodecs |
| Agentic web | WebMCP tool APIs, GEO/AEO discovery, agentic commerce protocols |

Each exercise defines a prompt, starter code, acceptance criteria, and a reference solution in [the curriculum catalog](src/curriculum.js). Framework exercise code lives in [individual TypeScript files](exercises/frameworks/) that the catalog imports, and browser-platform and agentic-web code lives in [individual JavaScript files](exercises/platform/) that it imports the same way. Reference solutions are intentionally included for learning and for checking the evaluator; this is an open-book workspace, not a hidden test set.

The Express 5 labs cover a claims API error-pipeline upgrade, tenant-scoped nested routes, and a payment webhook that verifies raw bytes before recording an event and queueing work. The exercises use injected interfaces so the evaluator runs without installing Express. A real integration must supply authentication, scoped database queries, a provider signature-verification adapter, and an atomic durable outbox; webhook workers still need idempotent effects. See the [Express 5 references](links.md#express-5-api-migration-labs).

The HTML Architecture track now includes a bidi-safe claims intake lab covering native field direction metadata, mixed-script text isolation, and direction-aware logical CSS, plus a find-in-page lab for collapsed support annexes using `hidden="until-found"`, `beforematch`, and layout containment.

### CSS engineering and renewal

The dedicated **CSS Engineering** track contains 56 exercises that move from fundamentals through legacy upgrades, practical production interfaces, and advanced platform work. Eight focused web labs teach intrinsic sizing, float containment with `flow-root`, transformed stacking contexts, native form color schemes, responsive embeds, GFM rendering, Markdown fragment navigation, and markup-preserving search with the CSS Custom Highlight API. Twelve industry labs cover retail catalogs, healthcare intake forms, banking ledgers, logistics dispatch boards, newsroom publishing, restaurant point-of-sale menus, public permit applications, SaaS vendor stylesheets, support workspaces and reply composers, warehouse inventory, and help-center disclosures. They practice container-aware layouts, resilient content, accessible state styling, financial and stock data tables, nested scrolling, native form sizing, intrinsic-size transitions, print paths, cascade migrations, and user preference handling. The advanced print lab adds CSS Paged Media headers, footers, recto/verso placement, and page counters while preserving a useful baseline for clients without margin-box support. Native-platform labs cover scroll-state sticky checkout summaries, nested `exportparts` contracts, directly slotted CMS content, form-associated custom states with a public `::part()` API, a mobile-safe native dialog, and repeated popovers isolated with `anchor-scope`. Timeline labs isolate identical scroll timeline names across repeated components and align accessible reading flow with responsive Grid layouts.

The newest exercises cover bounded `@scope`, proposed `@function` and `if()` syntax, cross-document View Transitions, scroll-state queries, advanced Shadow DOM styling, and a CSS Custom Highlight search that spans inline markup without adding wrapper elements. The latest practical labs also cover nested scroll containment, two-axis sticky data tables, content-sized textareas through `field-sizing`, and feature-gated `<details>` animations through `interpolate-size`. CSS Custom Highlight API, CSS Paged Media Level 3, CSS Shadow Module Level 1, and CSS Sizing Level 4 are CSSWG drafts; the labs mark feature maturity and keep useful baseline behavior where browser support may vary. See the [CSS standards references](links.md#css-specifications-and-emerging-proposals).

HTML and CSS now meet in production interface work too: the clinical intake lab pairs semantic forms with container-aware error styling, the SSR status-card lab defines a Declarative Shadow DOM and CSS theming contract using slots, `::part()`, custom properties, and forced-colors support, a native `<details name>` lab builds exclusive disclosures for sequential troubleshooting flows, and the support-annex lab keeps browser find and fragment navigation working through native collapsed content.

Less common platform details now have dedicated labs too: `timeline-scope` isolates repeated named scroll timelines, CSS `reading-flow` aligns navigation with dense Grid placement, dialog `requestClose()` keeps close requests cancellable, `requestSubmit(submitter)` preserves native form behavior, and prioritized `scheduler.postTask()`/`yield()` work supports bounded batches with cancellation and a lower-capability fallback.

Technical SEO covers crawl/index reconciliation, migration planning, JavaScript render parity, multilingual sitemaps, Search Console triage, and faceted commerce URL governance. Labs distinguish robots.txt crawl blocks from fetched `noindex`, audit redirect graphs and final destinations, compare source and rendered metadata/content, preserve curated facet landing pages while containing filter URL growth, validate reciprocal locale clusters, and analyze page-level CTR against market/device/position-specific baselines.

| Renewal stage | Topics |
| --- | --- |
| Foundations | Reset strategy, box sizing, logical properties, Flexbox, intrinsic Grid, typography, responsive images and mobile viewport units |
| Modernization | Sass-to-native CSS, layered cascades, feature-query fallbacks, `:has()` state, native popover transitions |
| Production quality | Keyboard focus, reduced motion, forced colors, font loading, content visibility, scroll snap and print styles |
| Advanced platform | Container queries, subgrid, OKLCH tokens, scroll-driven animations, anchor positioning, `@scope`, custom CSS functions, `if()`, cross-document view transitions, scroll-state queries, and Shadow DOM parts and slots |
| Essential browser behavior | Intrinsic sizing, local overflow, flow-root float containment, fixed containing blocks, stacking contexts, native control schemes, and responsive embeds |
| Markdown interfaces | GFM task lists, fenced-code and table overflow, heading fragment offsets, and focusable skip links under sticky headers |
| Industry implementation | Retail product discovery, patient intake, account ledgers, dispatch operations, editorial publishing, touch-first POS, public-service forms, and SaaS vendor migrations |

### Frontend framework exercises

| Framework | Exercise |
| --- | --- |
| React 19 and Next.js | [Typed server action and optimistic updates](exercises/frameworks/ts_react_nextjs_server_actions/starter.ts) |
| Angular | [Signals and cancelable async state](exercises/frameworks/ts_angular_signals_computed_rx/starter.ts) |
| Vue 3 and Svelte 5 | [Migrate React hooks to fine-grained reactivity](exercises/frameworks/migrate_react_hooks_to_svelte5_vue3_signals/starter.ts) |
| Next.js App Router | [Migrate from Pages Router data loading](exercises/frameworks/migrate_nextjs_pages_to_app_router_rsc/starter.ts) |
| TanStack Query | [Replace Redux thunks with a typed cache](exercises/frameworks/migrate_redux_thunks_to_tanstack_query_ts/starter.ts) |

GitHub's **Languages** bar counts source file types, not frameworks. These exercises contribute to **TypeScript** there; React and Angular do not appear as separate languages. The Vue and Svelte exercise models their reactive primitives in TypeScript rather than shipping `.vue` or `.svelte` components.

### Server framework exercises

| Framework | Exercise |
| --- | --- |
| Express 5 | [Upgrade a claims API error pipeline](exercises/frameworks/express5_problem_details/starter.ts) |
| Express 5 | [Protect a multi-tenant claims router](exercises/frameworks/express5_tenant_claims/starter.ts) |
| Express 5 | [Verify and durably queue payment webhooks](exercises/frameworks/express5_payment_webhook/starter.ts) |
| Express and Hono | [Migrate callback middleware to a Fetch-based router](exercises/frameworks/migrate_express_to_hono_edge_ts/starter.ts) |
| NestJS | [Build dependency injection, authorization guards, and interceptors](exercises/frameworks/ts_nestjs_di_guard_interceptor/starter.ts) |
| tRPC | [Model typed procedures and input validation](exercises/frameworks/ts_trpc_zod_end_to_end_rpc/starter.ts) |

### Browser platform exercises

| Platform primitive | Exercise |
| --- | --- |
| Web Workers | [Transferable `ArrayBuffer` chunked reduction](exercises/platform/web_workers/transferable_offload/starter.js) |
| Web Workers | [`SharedArrayBuffer` + `Atomics` race-free counter](exercises/platform/web_workers/shared_atomics_counter/starter.js) |
| Web Workers | [Bounded worker pool with graceful drain](exercises/platform/web_workers/pool_lifecycle/starter.js) |
| Streams | [Streaming NDJSON frame decoder](exercises/platform/web_streams/json_frame_decoder/starter.js) |
| Streams | [Resumable SSE parser with `Last-Event-ID`](exercises/platform/web_streams/sse_reconnect_parser/starter.js) |
| Streams | [Constant-memory streaming checksum](exercises/platform/web_streams/streaming_checksum/starter.js) |
| WebGPU | [Tile compute dispatches within adapter limits](exercises/platform/webgpu/dispatch_tiling/starter.js) |
| WebGPU | [Negotiate only supported features and limits](exercises/platform/webgpu/capability_selection/starter.js) |
| WebGPU | [Read back results with aligned staging buffers](exercises/platform/webgpu/buffer_readback/starter.js) |
| WebRTC | [Resolve simultaneous offers with perfect negotiation](exercises/platform/webrtc/perfect_negotiation/starter.js) |
| WebRTC | [Buffer trickle ICE across remote-description and restart boundaries](exercises/platform/webrtc/ice_candidate_inbox/starter.js) |
| WebRTC | [Control data-channel send pressure by queued UTF-8 bytes](exercises/platform/webrtc/data_channel_backpressure/starter.js) |
| WebCodecs | [Bound the encoder queue and release every frame](exercises/platform/webcodecs/bounded_encode_queue/starter.js) |
| WebCodecs | [Map source-clock timestamps to monotonic microseconds](exercises/platform/webcodecs/timestamp_mapper/starter.js) |
| WebCodecs | [Flush before changing decoder configuration](exercises/platform/webcodecs/decoder_config_router/starter.js) |
| WebTransport | [Bound datagrams by expiry, size and backpressure](exercises/platform/webtransport/datagram_sender/starter.js) |
| WebTransport | [Reassemble length-prefixed stream messages](exercises/platform/webtransport/framed_stream/starter.js) |
| WebTransport | [Reject duplicate and stale datagrams across sequence wrap](exercises/platform/webtransport/datagram_replay_window/starter.js) |
| WebAssembly | [Refresh memory views after growth and validate pointers](exercises/platform/webassembly/memory_view/starter.js) |
| WebAssembly Component Model | [Enforce owned and borrowed resource lifetimes](exercises/platform/webassembly/component_resources/starter.js) |
| WebAssembly JSPI proposal | [Bridge promises across experimental boundaries](exercises/platform/webassembly/jspi_bindings/starter.js) |
| WebAssembly | [Load modules across CDN MIME and runtime differences](exercises/platform/webassembly/streaming_loader/starter.js) |
| WebAssembly | [Marshal UTF-8 strings across the guest allocator boundary](exercises/platform/webassembly/utf8_abi/starter.js) |
| WebAssembly threads | [Gate shared memory on browser isolation](exercises/platform/webassembly/threaded_runtime/starter.js) |
| WebAssembly plugins | [Instantiate with explicit host capabilities](exercises/platform/webassembly/plugin_capabilities/starter.js) |
| WebNN | [Run a graph with permissioned tensors and cleanup](exercises/platform/webnn/tensor_inference/starter.js) |
| WebNN | [Serialize concurrent runs over shared tensors](exercises/platform/webnn/shared_tensor_queue/starter.js) |
| WebNN | [Recover inference sessions after context loss](exercises/platform/webnn/context_loss_runner/starter.js) |
| Digital Credentials | [Build capability-gated presentation and issuance requests](exercises/platform/digital_credentials/request_builder/starter.js) |
| Digital Credentials | [Preserve user activation and single-flight credential choosers](exercises/platform/digital_credentials/prompt_coordinator/starter.js) |
| Digital Credentials | [Forward opaque responses to a same-origin verifier](exercises/platform/digital_credentials/server_verification/starter.js) |
| WebXR Depth Sensing | [Negotiate required or optional depth features](exercises/platform/webxr_depth/session_options/starter.js) |
| WebXR Depth Sensing | [Sample depth in meters without assuming buffer encoding](exercises/platform/webxr_depth/depth_sampling/starter.js) |
| WebXR Depth Sensing | [Run a failure-safe per-view depth frame loop](exercises/platform/webxr_depth/frame_loop/starter.js) |
| WebRTC Encoded Transform | [Attach a worker-based RTCRtpScriptTransform](exercises/platform/webrtc_encoded_transform/script_transform/starter.js) |
| WebRTC SFrame | [Rotate keys without an undecryptable media window](exercises/platform/webrtc_encoded_transform/sframe_key_rotation/starter.js) |
| WebRTC Encoded Transform | [Keep frame transforms synchronous and ownership-safe](exercises/platform/webrtc_encoded_transform/frame_pipe/starter.js) |

Digital Credentials, WebXR depth sensing, and WebRTC Encoded Transform are evolving
W3C drafts. Their exercises use injected APIs and device shims, and separate optional
capabilities from required ones so they can be evaluated without a wallet, headset, or
browser-specific media implementation. See [links.md](links.md) for primary specs.

### Agentic web exercises

| Area | Exercise |
| --- | --- |
| WebMCP | [Tool registry with spec name validation and abort unregistration](exercises/platform/webmcp/tool_registry/starter.js) |
| WebMCP | [`executeTool` with JSON round-trip and `DOMException` error taxonomy](exercises/platform/webmcp/tool_execution/starter.js) |
| WebMCP | [Cross-origin tool exposure with `exposedTo` allowlists](exercises/platform/webmcp/origin_exposure/starter.js) |
| GEO / AEO | [Generate a spec-shape `/llms.txt` v2 discovery file](exercises/platform/agentic_seo/llms_txt_generator/starter.js) |
| GEO / AEO | [Validate `/llms.txt` and resolve the most specific covering file](exercises/platform/agentic_seo/llms_txt_validator/starter.js) |
| GEO / AEO | [AI crawler classification and RFC 9309 longest-match evaluation](exercises/platform/agentic_seo/ai_crawler_policy/starter.js) |
| Agentic commerce | [Agentic Commerce checkout session lifecycle and idempotency](exercises/platform/agentic_commerce/acp_checkout_session/starter.js) |
| Agentic commerce | [x402 v2 HTTP 402 payment gate with CORS header disclosure](exercises/platform/agentic_commerce/x402_payment_gate/starter.js) |
| Agentic commerce | [AP2 checkout mandate verification with hash binding](exercises/platform/agentic_commerce/ap2_mandate_verification/starter.js) |

These exercises track live 2026 drafts and protocols. The primary sources behind each one are cited in [links.md](links.md).

## How evaluation works

The [evaluator](src/evaluator.js) combines structural checks with task-specific runtime assertions. It reports pass/fail results, a score, execution time, and a line diff. TypeScript submissions are transpiled with Bun before evaluation. The [benchmark suite](src/benchmark.js) runs those same checks against the bundled reference solutions, either for one category or for the full catalog. Its category choices and counts come from the current catalog; downloading a Markdown report uses the selected category.

Evaluation uses `node:vm` to run submitted code. **A VM context is not a security boundary.** Run this application locally with code you trust; do not expose the evaluator as a public service for untrusted submissions.

## Project layout

| Path | Purpose |
| --- | --- |
| [`src/curriculum.js`](src/curriculum.js) | Exercise catalog and tracks |
| [`exercises/frameworks/`](exercises/frameworks/) | TypeScript starter and reference files for framework challenges |
| [`exercises/platform/`](exercises/platform/) | Starter and reference files for browser platforms, GPU, realtime media, and agentic-web challenges |
| [`src/evaluator.js`](src/evaluator.js) | Solution checks and runtime assertions |
| [`src/benchmark.js`](src/benchmark.js) | Catalog statistics and benchmark reports |
| [`src/server.js`](src/server.js), [`src/http.js`](src/http.js), and [`src/api.js`](src/api.js) | Bun server, request routing, and HTTP endpoints |
| [`src/store.js`](src/store.js) | JSON-backed task boards and persistence |
| [`public/`](public/) | Browser interface and web components |
| [`tests/`](tests/) | Bun tests for the curriculum and application modules |
| [`.github/workflows/`](.github/workflows/) | CI checks and tagged container publishing |
| [`Dockerfile`](Dockerfile) | Bun runtime image for local use and releases |

### Local data and recovery

The server stores tasks, accounts, and OAuth clients in `data/`, which is ignored by Git, and listens on `127.0.0.1` by default. Set `PORT` to change the HTTP port, `GUANTLET_WEB_DATA_DIR` to move the data directory, or `GUANTLET_WEB_HOST` to choose another listening address. Individual file paths can be set with `GUANTLET_WEB_DATA`, `GUANTLET_WEB_AUTH_DATA`, and `GUANTLET_WEB_OAUTH_DATA`. The container listens on `0.0.0.0` inside the container; the example below publishes it only on the host's loopback interface.

Writes are serialized within each store and use a temporary file and rename; run only one server against a data directory because there is no interprocess lock. An existing empty task store remains empty on restart. If a JSON file is malformed, the server moves it to a uniquely named `.corrupt-…` file before initializing a fresh store and logs the backup path. Read errors and unsupported data formats stop startup without replacing the file; preserve the backup before repairing or restoring data.

Live events are notifications, not a replayable history. The browser reloads the current task state and any open chat when the event stream connects or reconnects; a subscriber that falls too far behind is disconnected to keep its queue bounded. Chat is an in-memory demo: messages and pending packets disappear on restart, and duplicate message IDs are retained only while their messages remain in the room history. Future sequence numbers are limited to 256 positions ahead, and conflicting retries or occupied sequence slots are rejected. Participant names are checked for consistency, but they are not authentication.

## CI and container releases

GitHub Actions installs the locked dependencies and runs the Bun test suite on Linux and macOS for pushes and pull requests. It also builds the container and checks that the HTTP server responds. [Dependabot](.github/dependabot.yml) proposes updates for Bun packages, workflow actions, and the Bun base image.

Version tags such as `v1.0.0` trigger a tested container build published to `ghcr.io/dandekker/gauntlet-web:1.0.0`. The workflow also tags the latest stable release as `latest`. No image is published from pull requests.

To run the container locally:

```bash
docker build -t gauntlet-web .
docker run --rm -p 127.0.0.1:3000:3000 -v gauntlet-web-data:/data gauntlet-web
```

The volume keeps local board and account data between runs. Keep the evaluator on a trusted local machine; it executes submitted code in a VM context.

## Scope

The project also contains local demos for auth, OAuth, chat, storefront flows, web traffic, and design systems. The OAuth demo checks exact registered redirect URIs and allowed scopes, supports S256 PKCE, and binds refresh tokens to clients. Authorization-code exchanges without PKCE require a client secret. Refresh tokens rotate and expire seven days after the original grant. Integrations using `plain` PKCE, an unregistered or omitted redirect URI, or a refresh request without a matching `client_id` need to be updated.

These auth features are demonstrations: task endpoints do not enforce OAuth permissions, authorization can fall back to the demo agent, and sessions and tokens live in memory. The seeded accounts and clients are intended for a trusted local workspace; the application is not a production identity provider or a service for untrusted submissions.
