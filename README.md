<div align="center">

<img src="assets/gauntlet-banner.svg" alt="LLM Webdev Gauntlet" width="100%">

<p><strong>Web development challenges. One local workspace for testing solutions.</strong></p>

<p><a href="https://github.com/DanDekker/webdev-gauntlet/actions/workflows/ci.yml"><img src="https://github.com/DanDekker/webdev-gauntlet/actions/workflows/ci.yml/badge.svg" alt="CI status"></a></p>

<p><a href="#technology-map">Technologies</a> · <a href="#get-started">Get started</a> · <a href="#the-curriculum">Curriculum</a> · <a href="#how-evaluation-works">Evaluation</a> · <a href="#ci-and-container-releases">CI &amp; releases</a></p>

</div>

---

**LLM Webdev Gauntlet** is a local curriculum and evaluation workspace for web development agents. It combines code challenges, an interactive task board, automated checks, and a benchmark of the included reference solutions. The application is called **guantlet-web** and runs on Bun with vanilla JavaScript, HTML, and CSS; it has no runtime package dependencies or build step.

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
git clone https://github.com/DanDekker/webdev-gauntlet.git
cd webdev-gauntlet
bun run dev
```

Open **http://localhost:3000**. Use **Demo Agent** on the sign-in screen, then open the curriculum board. Select an exercise to read its prompt, starter code, and acceptance criteria. Submit a JavaScript or TypeScript solution to see assertion results and a diff. The **Benchmark** view runs the bundled reference solutions across the catalog and can export a Markdown report.

For a regular server without file watching, use `bun run start`. Run the test suite with `bun test`.

## The curriculum

The repository currently includes **106 exercises in 27 categories and 11 tracks**, from introductory refactoring to more involved web systems work. Topics include:

| Area | Examples |
| --- | --- |
| Core web engineering | Async flows, performance, architecture, CSS, accessibility |
| Data and identity | Database access, distributed persistence, authentication, security |
| Application systems | Realtime chat, commerce, storefronts, order lifecycles |
| Web platform | HTML, structured data, cookies, storage, HTTP traffic |
| UI engineering | Design tokens, interaction patterns, web components |
| Developer tooling | TypeScript frameworks, migrations, package management |

Each exercise defines a prompt, starter code, acceptance criteria, and a reference solution in [the curriculum catalog](src/curriculum.js). Framework exercise code lives in [individual TypeScript files](exercises/frameworks/) that the catalog imports. Reference solutions are intentionally included for learning and for checking the evaluator; this is an open-book workspace, not a hidden test set.

### Frontend framework exercises

| Framework | Exercise |
| --- | --- |
| React 19 and Next.js | [Typed server action and optimistic updates](exercises/frameworks/ts_react_nextjs_server_actions/starter.ts) |
| Angular | [Signals and cancelable async state](exercises/frameworks/ts_angular_signals_computed_rx/starter.ts) |
| Vue 3 and Svelte 5 | [Migrate React hooks to fine-grained reactivity](exercises/frameworks/migrate_react_hooks_to_svelte5_vue3_signals/starter.ts) |
| Next.js App Router | [Migrate from Pages Router data loading](exercises/frameworks/migrate_nextjs_pages_to_app_router_rsc/starter.ts) |
| TanStack Query | [Replace Redux thunks with a typed cache](exercises/frameworks/migrate_redux_thunks_to_tanstack_query_ts/starter.ts) |

GitHub's **Languages** bar counts source file types, not frameworks. These exercises contribute to **TypeScript** there; React and Angular do not appear as separate languages. The Vue and Svelte exercise models their reactive primitives in TypeScript rather than shipping `.vue` or `.svelte` components.

## How evaluation works

The [evaluator](src/evaluator.js) combines structural checks with task-specific runtime assertions. It reports pass/fail results, a score, execution time, and a line diff. TypeScript submissions are transpiled with Bun before evaluation. The [benchmark suite](src/benchmark.js) runs those same checks against the bundled reference solutions, either for one category or for the full catalog.

Evaluation uses `node:vm` to run submitted code. **A VM context is not a security boundary.** Run this application locally with code you trust; do not expose the evaluator as a public service for untrusted submissions.

## Project layout

| Path | Purpose |
| --- | --- |
| [`src/curriculum.js`](src/curriculum.js) | Exercise catalog and tracks |
| [`exercises/frameworks/`](exercises/frameworks/) | TypeScript starter and reference files for framework challenges |
| [`src/evaluator.js`](src/evaluator.js) | Solution checks and runtime assertions |
| [`src/benchmark.js`](src/benchmark.js) | Catalog statistics and benchmark reports |
| [`src/server.js`](src/server.js) and [`src/api.js`](src/api.js) | Bun server and HTTP routes |
| [`src/store.js`](src/store.js) | JSON-backed task boards and persistence |
| [`public/`](public/) | Browser interface and web components |
| [`tests/`](tests/) | Bun tests for the curriculum and application modules |
| [`.github/workflows/`](.github/workflows/) | CI checks and tagged container publishing |
| [`Dockerfile`](Dockerfile) | Bun runtime image for local use and releases |

The server stores local state in `data/`, which is ignored by Git. Set `PORT` to change the HTTP port or `GUANTLET_WEB_DATA_DIR` to move the data directory.

## CI and container releases

GitHub Actions runs the Bun test suite on Linux and macOS for pushes and pull requests. It also builds the container and checks that the HTTP server responds. [Dependabot](.github/dependabot.yml) proposes updates for workflow actions and the Bun base image.

Version tags such as `v1.0.0` trigger a tested container build published to `ghcr.io/dandekker/webdev-gauntlet:1.0.0`. The workflow also tags the latest stable release as `latest`. No image is published from pull requests.

To run the container locally:

```bash
docker build -t webdev-gauntlet .
docker run --rm -p 127.0.0.1:3000:3000 -v webdev-gauntlet-data:/data webdev-gauntlet
```

The volume keeps local board and account data between runs. Keep the evaluator on a trusted local machine; it executes submitted code in a VM context.

## Scope

The project also contains local demos for auth, OAuth, chat, storefront flows, web traffic, and design systems. They provide hands-on context for the exercises. The seeded sign-in accounts are for local use only; replace them before using this application in any shared environment.
