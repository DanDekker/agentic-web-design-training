/**
 * TypeScript Framework Ecosystem, Cross-Framework Migration Matrix & Package Manager Registry.
 * Provides structured metadata for AI model training across Fortune 500 TypeScript stacks,
 * reactive/server migration pathways, and Node / Bun / Deno / pnpm / Yarn / JSR package managers.
 */

export const TS_FRAMEWORKS_CATALOG = Object.freeze([
  {
    id: "react-nextjs",
    name: "React 19 & Next.js App Router",
    tier: "fortune-500-frontend-fullstack",
    reactivityModel: "fiber-hooks-rsc-useOptimistic",
    ssrModel: "react-server-components-streaming-suspense",
    keyPrimitives: ["Server Actions", "useOptimistic", "React Server Components (RSC)", "revalidateTag", "Route Handlers"],
    curriculumTasks: ["task_ts_react_nextjs_server_actions", "task_migrate_nextjs_pages_to_app_router_rsc"],
  },
  {
    id: "angular",
    name: "Angular (Signals & RxJS)",
    tier: "fortune-500-enterprise-spa",
    reactivityModel: "fine-grained-signals-plus-rxjs-interop",
    ssrModel: "incremental-hydration-ssr",
    keyPrimitives: ["signal<T>()", "computed<T>()", "effect()", "Injectable DI", "switchMap / takeUntilDestroyed"],
    curriculumTasks: ["task_ts_angular_signals_computed_rx"],
  },
  {
    id: "vue-nuxt",
    name: "Vue 3 & Nuxt 3/4",
    tier: "enterprise-progressive-fullstack",
    reactivityModel: "proxy-ref-computed-watchEffect",
    ssrModel: "nitro-universal-rendering",
    keyPrimitives: ["ref<T>()", "computed<T>()", "watchEffect()", "Composables", "Nitro Server Routes"],
    curriculumTasks: ["task_migrate_react_hooks_to_svelte5_vue3_signals"],
  },
  {
    id: "svelte-sveltekit",
    name: "Svelte 5 (Runes) & SvelteKit",
    tier: "compiler-first-fine-grained",
    reactivityModel: "compiler-runes-state-derived-effect",
    ssrModel: "adapter-universal-form-actions",
    keyPrimitives: ["$state<T>()", "$derived<T>()", "$effect()", "Universal .svelte.ts stores", "Loaders & Form Actions"],
    curriculumTasks: ["task_migrate_react_hooks_to_svelte5_vue3_signals"],
  },
  {
    id: "solidjs",
    name: "SolidJS & SolidStart",
    tier: "high-frequency-fine-grained-ui",
    reactivityModel: "createSignal-createMemo-createEffect",
    ssrModel: "streaming-islands-vinxi",
    keyPrimitives: ["createSignal", "createMemo", "createEffect", "createResource", "Fine-grained DOM updates"],
    curriculumTasks: ["task_migrate_react_hooks_to_svelte5_vue3_signals"],
  },
  {
    id: "nestjs",
    name: "NestJS Enterprise Backend",
    tier: "fortune-500-backend-microservices",
    reactivityModel: "ioc-di-decorators-interceptors",
    ssrModel: "api-gateway-microservices-graphql-grpc",
    keyPrimitives: ["IoC Container", "CanActivate Guards", "NestInterceptor", "Pipes", "ExecutionContext"],
    curriculumTasks: ["task_ts_nestjs_di_guard_interceptor"],
  },
  {
    id: "trpc-zod",
    name: "tRPC + Zod End-to-End Type-Safe RPC",
    tier: "fullstack-typescript-rpc",
    reactivityModel: "procedure-builder-context-inference",
    ssrModel: "server-callers-and-react-query-bridge",
    keyPrimitives: ["ProcedureBuilder<TContext, TInput>", ".use() context narrowing", ".input(zodSchema)", "TRPCError", "createCaller"],
    curriculumTasks: ["task_ts_trpc_zod_end_to_end_rpc"],
  },
  {
    id: "hono-fastify",
    name: "Hono & Fastify Web-Standard Routers",
    tier: "multi-runtime-edge-and-low-overhead-api",
    reactivityModel: "web-standard-fetch-request-response",
    ssrModel: "edge-workers-bun-deno-node",
    keyPrimitives: ["Request / Response", "Typed EdgeContext<TVariables>", "Onion Middleware", "Schema Serialization"],
    curriculumTasks: ["task_migrate_express_to_hono_edge_ts"],
  },
  {
    id: "tanstack-query-rtk",
    name: "TanStack Query & Redux Toolkit (RTK)",
    tier: "fortune-500-async-and-client-state",
    reactivityModel: "swr-query-cache-and-normalized-slices",
    ssrModel: "dehydrated-state-streaming",
    keyPrimitives: ["QueryClient", "hashQueryKey", "In-flight deduplication", "staleTime SWR", "Optimistic mutation rollback"],
    curriculumTasks: ["task_migrate_redux_thunks_to_tanstack_query_ts"],
  },
]);

export const FRAMEWORK_MIGRATION_PATHS = Object.freeze([
  {
    id: "express-to-hono-fastify",
    from: "Express.js (Node.js req/res callbacks)",
    to: "Hono / Fastify (Web-Standard Fetch Request/Response)",
    keyShifts: [
      "Replace (req, res, next) callback mutation with immutable Fetch Request -> Promise<Response> handlers",
      "Replace untyped req.user monkey-patching with generic Context<TVariables> c.set() / c.get()",
      "Enable zero-adapter execution across Bun.serve, Deno.serve, Cloudflare Workers, and Node.js",
    ],
    taskId: "task_migrate_express_to_hono_edge_ts",
  },
  {
    id: "react-hooks-to-fine-grained-signals",
    from: "React Hooks (useState / useMemo / useEffect)",
    to: "Svelte 5 Runes ($state/$derived/$effect), Vue 3 Composition (ref/computed), or Angular/Solid Signals",
    keyShifts: [
      "Eliminate manual dependency arrays ([a, b]) and stale closure bugs via automatic getter dependency tracking",
      "Replace full component tree re-execution with lazy dirty-flag propagation in derived computation graphs",
      "Standardize deterministic effect cleanup callbacks prior to re-execution or disposal",
    ],
    taskId: "task_migrate_react_hooks_to_svelte5_vue3_signals",
  },
  {
    id: "redux-thunks-to-tanstack-query",
    from: "Redux Async Thunks & Manual FETCH_REQUEST/SUCCESS/FAILURE Reducers",
    to: "TanStack Query (SWR Cache, In-Flight Deduplication & Optimistic Mutations)",
    keyShifts: [
      "Replace manual boolean loading/error flags with deterministic QueryKey hashing and staleTime SWR cache",
      "Coalesce concurrent identical network requests using an in-flight Promise map",
      "Implement snapshot-backed optimistic cache updates with automatic rollback on mutation failure",
    ],
    taskId: "task_migrate_redux_thunks_to_tanstack_query_ts",
  },
  {
    id: "nextjs-pages-to-app-router-rsc",
    from: "Next.js Pages Router (getServerSideProps sequential waterfalls)",
    to: "Next.js App Router (Parallel React Server Components, Suspense & revalidateTag)",
    keyShifts: [
      "Replace sequential blocking getServerSideProps(ctx) awaits with parallel Promise.all RSC data loaders",
      "Attach granular cache tags to server fetches and purge selectively via revalidateTag() in Web-Standard Route Handlers",
    ],
    taskId: "task_migrate_nextjs_pages_to_app_router_rsc",
  },
]);

export const PACKAGE_MANAGERS_AND_RUNTIMES = Object.freeze([
  {
    id: "npm",
    name: "npm (Node.js Default)",
    runtime: "node",
    lockfile: "package-lock.json",
    ciFrozenCommand: "npm ci",
    nodeModulesStrategy: "flat-hoisted",
    workspaceProtocol: "semver-range (no workspace:^ in public publish without pack)",
    notes: "Default Node package manager; flat hoisting allows accidental phantom imports unless migrated to isolated linkers.",
  },
  {
    id: "pnpm",
    name: "pnpm (Content-Addressable Store)",
    runtime: "node / bun",
    lockfile: "pnpm-lock.yaml",
    ciFrozenCommand: "pnpm install --frozen-lockfile",
    nodeModulesStrategy: "hardlink-symlink-isolated",
    workspaceProtocol: "workspace:^ and catalog:",
    notes: "Strict symlinked node_modules prevents phantom dependencies and supports centralized catalog: version pinning.",
  },
  {
    id: "yarn-berry",
    name: "Yarn Berry (v4 PnP / node-modules)",
    runtime: "node",
    lockfile: "yarn.lock",
    ciFrozenCommand: "yarn install --immutable",
    nodeModulesStrategy: "plug-n-play-zip-or-isolated-pnp",
    workspaceProtocol: "workspace:^ and constraints",
    notes: "Supports zero-installs, Plug'n'Play (.pnp.cjs), and workspace constraints.",
  },
  {
    id: "bun",
    name: "Bun Package Manager & Runtime",
    runtime: "bun",
    lockfile: "bun.lock",
    ciFrozenCommand: "bun install --frozen-lockfile",
    nodeModulesStrategy: "fast-clonefile-hardlink-or-isolated",
    workspaceProtocol: "workspace:^ and catalog:",
    notes: "Native TypeScript execution, JSONC text lockfile (bun.lock), workspace catalog:, and built-in bundler/test runner.",
  },
  {
    id: "deno",
    name: "Deno 2.x Runtime & Package Manager",
    runtime: "deno",
    lockfile: "deno.lock",
    ciFrozenCommand: "deno install --frozen",
    nodeModulesStrategy: "optional-node-modules-dir-or-global-cache",
    workspaceProtocol: "deno.json workspaces + npm: / jsr: specifiers",
    notes: "First-class TypeScript runtime supporting both deno.json and package.json with npm: and jsr: specifiers.",
  },
  {
    id: "jsr",
    name: "JSR (JavaScript Registry)",
    runtime: "deno / bun / node / cloudflare-workers",
    lockfile: "jsr.json + runtime lockfile",
    ciFrozenCommand: "npx jsr publish --dry-run",
    nodeModulesStrategy: "native-ts-for-deno-bun-transpiled-dts-for-node",
    workspaceProtocol: "jsr:@scope/pkg",
    notes: "TypeScript-first package registry publishing .ts source directly while auto-generating .d.ts/.js for npm consumers.",
  },
]);

export function getTypeScriptEcosystemOverview() {
  return {
    frameworks: TS_FRAMEWORKS_CATALOG,
    migrations: FRAMEWORK_MIGRATION_PATHS,
    packageManagers: PACKAGE_MANAGERS_AND_RUNTIMES,
  };
}
