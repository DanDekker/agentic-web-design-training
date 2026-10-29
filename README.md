<div align="center">

<img src="assets/gauntlet-banner.svg" alt="LLM Webdev Gauntlet" width="100%">

<p><strong>106 web development challenges. One local workspace for testing solutions.</strong></p>

<p><a href="#get-started">Get started</a> · <a href="#the-curriculum">Curriculum</a> · <a href="#how-evaluation-works">Evaluation</a> · <a href="#project-layout">Project layout</a></p>

</div>

---

**LLM Webdev Gauntlet** is a local curriculum and evaluation workspace for web development agents. It combines code challenges, an interactive task board, automated checks, and a benchmark of the included reference solutions. The application is called **guantlet-web** and runs on Bun with vanilla JavaScript, HTML, and CSS; it has no runtime package dependencies or build step.

## Get started

Requires [Bun](https://bun.sh/).

```bash
git clone https://github.com/DanDekker/llm-webdev-gauntlet.git
cd llm-webdev-gauntlet
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

The server stores local state in `data/`, which is ignored by Git. Set `PORT` to change the HTTP port or `GUANTLET_WEB_DATA_DIR` to move the data directory.

## Scope

The project also contains local demos for auth, OAuth, chat, storefront flows, web traffic, and design systems. They provide hands-on context for the exercises. The seeded sign-in accounts are for local use only; replace them before using this application in any shared environment.
