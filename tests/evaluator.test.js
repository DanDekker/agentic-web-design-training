import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { Evaluator } from "../src/evaluator.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let handle;
let evaluator;

const call = (method, path, body) =>
  handle(
    new Request(`http://gauntlet-web.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-eval-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  evaluator = new Evaluator();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("Agentic Evaluator & Execution Sandbox", () => {
  test("evaluates O(N^2) optimization with real sandboxed execution", async () => {
    const code = `
      function reconcileTransactions(orders, payments) {
        const paymentMap = new Map();
        for (const payment of payments) {
          paymentMap.set(payment.orderId, payment);
        }
        return orders.map(order => {
          const match = paymentMap.get(order.id);
          return {
            ...order,
            isPaid: Boolean(match),
            paymentReference: match ? match.txHash : null
          };
        });
      }
    `;

    const res = await call("POST", "/api/curriculum/evaluate", {
      taskId: "task_refactor_o_n2_lookup",
      code,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.passed).toBe(true);
    expect(data.score).toBe(100);
    expect(typeof data.telemetry.durationMs).toBe("number");
    expect(data.assertionResults.length).toBeGreaterThanOrEqual(3);
    expect(data.diff).toHaveProperty("lineDelta");
  });

  test("evaluates pure reducer state transitions in sandbox", async () => {
    const code = `
      function taskReducer(state, action) {
        if (action.type === "TASK_TOGGLED") {
          return {
            ...state,
            tasks: state.tasks.map(t => t.id === action.id ? { ...t, done: !t.done } : t)
          };
        }
        if (action.type === "FILTER_CHANGED") {
          return { ...state, filter: action.filter };
        }
        return state;
      }
    `;

    const result = await evaluator.evaluate("task_refactor_reducer_state", code);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.assertionResults.some((a) => a.name === "Reducer State Transitions")).toBe(true);
  });

  test("captures runtime syntax and execution errors in sandbox", async () => {
    const code = `throw new Error("Syntax detonation");`;
    const result = await evaluator.evaluate("task_refactor_async_pipeline", code);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.assertionResults.some((a) => !a.passed)).toBe(true);
  });

  test.each([
    "/* new Map() */ function broken( {",
    "<div>new Map()</div>",
  ])("does not let a JavaScript submission bypass execution: %s", async (code) => {
    const result = await evaluator.evaluate("task_refactor_o_n2_lookup", code);
    expect(result.passed).toBe(false);
    expect(result.assertionResults.some((assertion) => assertion.name === "Sandbox Execution" && !assertion.passed)).toBe(true);
  });

  test("evaluates database connection pool, transactional outbox, and dataloader tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_db_connection_pool",
      "task_db_transactional_outbox",
      "task_db_keyset_pagination_dataloader",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates deep web-auth tasks (DPoP, WebAuthn Passkey, Refresh Token Rotation) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_auth_dpop_token_binding",
      "task_auth_webauthn_passkey",
      "task_auth_refresh_rotation_reuse",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates web-fingerprinting tasks (Entropy Normalizer, JA4+ TLS/HTTP2, Privacy Budget Farbling) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_fingerprint_entropy_normalizer",
      "task_fingerprint_tls_ja4_http2",
      "task_fingerprint_privacy_budget_defense",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates web-cybersec tasks (SSRF DNS Rebind, Trusted Types CSP, Timing-Safe Webhook/CSRF) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_cybersec_ssrf_dns_rebind",
      "task_cybersec_csp_trusted_types_dom",
      "task_cybersec_timing_safe_webhook_csrf",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates long-horizon agentic-workflow tasks (DAG Saga, Circuit Breaker, Episodic Memory) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_agentic_dag_planner_saga",
      "task_agentic_tool_circuit_breaker_budget",
      "task_agentic_episodic_memory_compactor",
      "task_agentic_multi_agent_consensus_arbiter",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates real-time two-user chat tasks (Instrumentation, Debugging, Protocol Refactor, RingBuffer Benchmark) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_chat_realtime_instrumentation",
      "task_chat_debug_race_duplication",
      "task_chat_refactor_state_protocol",
      "task_chat_perf_ringbuffer_fanout_bench",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates Fortune 500 TypeScript framework tasks via native Bun.Transpiler in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_ts_react_nextjs_server_actions",
      "task_ts_angular_signals_computed_rx",
      "task_ts_nestjs_di_guard_interceptor",
      "task_ts_trpc_zod_end_to_end_rpc",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates cross-framework TypeScript migration tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_migrate_express_to_hono_edge_ts",
      "task_migrate_react_hooks_to_svelte5_vue3_signals",
      "task_migrate_redux_thunks_to_tanstack_query_ts",
      "task_migrate_nextjs_pages_to_app_router_rsc",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates multi-runtime & package manager ecosystem tasks (npm/pnpm/Yarn/Bun/Deno/JSR) in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_pkg_npm_to_pnpm_bun_workspace_migration",
      "task_pkg_dual_cjs_esm_exports_jsr_deno",
      "task_pkg_lockfile_supply_chain_auditor",
      "task_pkg_monorepo_task_graph_cache_runner",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates WHATWG HTML Living Standard & Schema.org JSON-LD / SEO tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_html_speculation_rules_prerender",
      "task_html_declarative_shadow_dom_streaming",
      "task_html_dialog_popover_invoker_inert",
      "task_html_responsive_picture_fetchpriority_lcp",
      "task_html_importmap_modulepreload_sri",
      "task_html_patient_intake_accessible_error_styling",
      "task_html_dsd_public_css_theming_contract",
      "task_seo_jsonld_knowledge_graph_builder",
      "task_seo_ecommerce_product_merchant_schema",
      "task_seo_canonical_hreflang_opengraph_head",
      "task_seo_semantic_microdata_landmarks_audit",
      "task_seo_software_app_faq_dataset_graph",
      "task_seo_indexability_signal_reconciler",
      "task_seo_multilingual_sitemap_sharding",
      "task_seo_search_console_opportunity_analyzer",
      "task_seo_site_migration_redirect_auditor",
      "task_seo_javascript_render_parity_auditor",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates E-Commerce, Checkout, Stripe & Polar.sh payment processing tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_ecom_integer_cents_dinero_cart_engine",
      "task_ecom_inventory_reservation_ttl_oversell_guard",
      "task_ecom_global_tax_vat_reverse_charge_engine",
      "task_ecom_checkout_state_machine_3ds_saga",
      "task_ecom_polar_mor_license_entitlement_provisioning",
      "task_pay_stripe_payment_intent_idempotency_engine",
      "task_pay_stripe_polar_webhook_signature_verifier",
      "task_pay_subscription_proration_dunning_machine",
      "task_pay_double_entry_ledger_stripe_connect_split",
      "task_pay_polar_stripe_usage_meter_ai_billing",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates Web Shop Storefront UI, Account-to-Checkout & Order Lifecycle Data tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_shop_ui_faceted_catalog_variant_sku_selector",
      "task_shop_ui_optimistic_cart_drawer_price_drift_guard",
      "task_shop_ui_guest_to_account_cart_address_merge",
      "task_shop_ui_accessible_checkout_stepper_autocomplete",
      "task_shop_ui_order_history_timeline_rma_portal",
      "task_shop_data_normalized_entity_store_referential_integrity",
      "task_shop_data_immutable_order_line_snapshot_isolation",
      "task_shop_data_transactional_account_cart_to_order_promoter",
      "task_shop_data_split_shipment_partial_capture_reconciler",
      "task_shop_data_customer_order_event_sourced_timeline",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates Deep Web Cookies, Client Storage Data & HTTP Traffic tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_cookie_rfc6265bis_host_prefix_chips_serializer",
      "task_cookie_key_ring_hmac_rotation_anti_downgrade",
      "task_cookie_dbsc_device_bound_session_credentials_refresh",
      "task_cookie_privacy_consent_gcm_partitioned_sync",
      "task_webdata_indexeddb_schema_migration_cursor_index",
      "task_webdata_cross_tab_broadcast_web_locks_leader",
      "task_webdata_quota_eviction_opfs_tiered_cache",
      "task_webdata_offline_mutation_outbox_etag_reconciler",
      "task_traffic_rfc9111_http_cache_swr_vary_etag",
      "task_traffic_edge_request_coalescing_singleflight_stampede",
      "task_traffic_ietf_ratelimit_token_bucket_sliding_window",
      "task_traffic_w3c_traceparent_server_timing_rfc9218_priority",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("evaluates Proprietary Design Systems, UI/UX Interaction Craft & Advanced Web Components tasks in sandbox", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    for (const id of [
      "task_design_w3c_dtcg_token_compiler_multi_brand_alias",
      "task_design_oklch_perceptual_palette_apca_contrast_guard",
      "task_design_fluid_utopia_typography_bento_spatial_grid",
      "task_design_proprietary_elevation_glassmorphism_spring_tokens",
      "task_ui_roving_tabindex_command_chord_ergonomics",
      "task_ui_css_anchor_positioning_collision_flip_solver",
      "task_ui_view_transitions_shared_element_morph_orchestrator",
      "task_ui_optimistic_skeleton_shimmer_cls_zero_hydrator",
      "task_webcomp_form_associated_element_internals_custom_states",
      "task_webcomp_constructable_stylesheets_reactive_attribute_bridge",
      "task_webcomp_named_slot_projection_part_theming_guard",
      "task_webcomp_virtualized_shadow_list_resize_observer",
    ]) {
      const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === id);
      expect(task).toBeTruthy();
      const result = await evaluator.evaluate(id, task.solutionCode);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    }
  });

  test("every single task in the curriculum has both static criteria and sandbox assertions", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    expect(REFACTORING_CURRICULUM_TASKS.length).toBe(206);
    for (const task of REFACTORING_CURRICULUM_TASKS) {
      const res = await evaluator.evaluate(task.id, task.solutionCode);
      expect(res.passed).toBe(true);
      expect(res.score).toBe(100);
      expect(res.assertionResults.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("CSS industry checks bind layout rules to selectors and ignore braces inside comments", async () => {
    const { REFACTORING_CURRICULUM_TASKS } = await import("../src/curriculum.js");
    const task = REFACTORING_CURRICULUM_TASKS.find((item) => item.id === "task_css_industry_retail_catalog");
    const commented = await evaluator.evaluate(task.id, `${task.solutionCode}\n/* braces in release notes: } { */`);
    expect(commented.passed).toBe(true);

    const misplaced = task.solutionCode.replace(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);",
      "grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);",
    );
    const misplacedResult = await evaluator.evaluate(task.id, misplaced);
    expect(misplacedResult.passed).toBe(false);
    expect(
      misplacedResult.assertionResults.some((result) => result.name === "Card-Local Responsive Layout" && !result.passed),
    ).toBe(true);

    const malformed = await evaluator.evaluate(task.id, `${task.solutionCode}\n.unclosed {`);
    expect(malformed.passed).toBe(false);
    expect(
      malformed.assertionResults.some((result) => result.name === "Markup / Stylesheet AST & Block Balance Valid" && !result.passed),
    ).toBe(true);
  });
});
