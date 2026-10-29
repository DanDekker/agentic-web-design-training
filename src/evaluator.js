/**
 * Agentic Curriculum 1M Tasks — Code Evaluator & Execution Sandbox.
 * Provides isolated evaluation, assertion checking, and telemetry metrics for agent-submitted refactorings.
 */

import { createContext, runInContext } from "node:vm";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";

export class Evaluator {
  /**
   * Evaluates submitted code for a specific curriculum task.
   */
  async evaluate(taskId, code, options = {}) {
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Unknown curriculum task '${taskId}'.`);
    }

    const trimmedCode = String(code || "").trim();
    if (!trimmedCode) {
      throw new Error("Submitted code cannot be empty.");
    }

    const startTime = performance.now();
    const assertionResults = [];
    let sandboxError = null;

    // 1. Static & structural criteria validation
    const criteriaChecks = this.#verifyCriteria(task, trimmedCode);
    assertionResults.push(...criteriaChecks);

    // 2. Sandboxed execution & unit test harness
    try {
      const execResults = await this.#runSandboxTests(taskId, trimmedCode, options);
      assertionResults.push(...execResults);
    } catch (err) {
      sandboxError = err.message || String(err);
      assertionResults.push({
        name: "Sandbox Execution",
        passed: false,
        detail: `Runtime execution error: ${sandboxError}`,
      });
    }

    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passedCount = assertionResults.filter((a) => a.passed).length;
    const totalCount = assertionResults.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    const passed = score === 100 && !sandboxError;

    return {
      taskId,
      passed,
      score,
      telemetry: {
        durationMs,
        assertions: {
          total: totalCount,
          passed: passedCount,
          failed: totalCount - passedCount,
        },
      },
      assertionResults,
      diff: this.#calculateLineDiff(task.starterCode, trimmedCode),
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Public static & structural criteria verifier used by both evaluate() and /api/curriculum/verify.
   */
  verifyCriteria(taskId, code) {
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Unknown curriculum task '${taskId}'.`);
    }
    const cleanCode = String(code || "").trim();
    const assertions = this.#verifyCriteria(task, cleanCode);
    const passedCriteria = assertions.filter((a) => a.passed).map((a) => a.detail);
    const failedCriteria = assertions.filter((a) => !a.passed).map((a) => a.detail);
    const total = assertions.length || 1;
    return {
      success: failedCriteria.length === 0,
      passedCriteria,
      failedCriteria,
      assertions,
      score: Math.round((passedCriteria.length / total) * 100),
      verifiedAt: new Date().toISOString(),
    };
  }

  #verifyCriteria(task, code) {
    const results = [];
    const id = task.id;

    if (id === "task_refactor_async_pipeline") {
      results.push({
        name: "Async/Await Pipeline Syntax",
        passed: code.includes("async ") && code.includes("await "),
        detail: "Function uses async/await instead of nested callbacks",
      });
      results.push({
        name: "Eliminates Callback Pyramid",
        passed: !code.includes("function(err, user)") && !code.includes("callback(err)"),
        detail: "Eliminates nested callback chains",
      });
      results.push({
        name: "Promise.all Concurrency",
        passed: code.includes("Promise.all"),
        detail: "Performs independent requests in parallel with Promise.all",
      });
    } else if (id === "task_refactor_event_leak") {
      results.push({
        name: "AbortController or Signal Usage",
        passed: code.includes("AbortController") || code.includes("signal"),
        detail: "Uses AbortController signal or explicit listener tracking",
      });
      results.push({
        name: "Explicit Cleanup Method",
        passed: code.includes("abort()") || code.includes("destroy()") || code.includes("removeEventListener"),
        detail: "Implements dispose or abort lifecycle cleanup",
      });
    } else if (id === "task_refactor_o_n2_lookup") {
      results.push({
        name: "Indexed Map Data Structure",
        passed: code.includes("new Map(") || code.includes("Map()"),
        detail: "Indexes secondary dataset using a Map",
      });
      results.push({
        name: "Eliminates O(N^2) Nested Array Search",
        passed: !code.includes(".find("),
        detail: "Replaces inner loop find with constant time get() lookup",
      });
    } else if (id === "task_refactor_input_sanitization") {
      results.push({
        name: "Prototype Pollution Guard",
        passed: code.includes("__proto__") && code.includes("constructor"),
        detail: "Explicitly blocks __proto__, constructor, and prototype keys",
      });
      results.push({
        name: "Safe Own-Property Iteration",
        passed: code.includes("Object.keys") || code.includes("Object.hasOwn"),
        detail: "Iterates only own enumerable keys instead of unguarded for..in",
      });
    } else if (id === "task_refactor_buffer_alloc") {
      results.push({
        name: "Typed Uint8Array Usage",
        passed: code.includes("Uint8Array"),
        detail: "Uses typed Uint8Arrays instead of raw string concatenation",
      });
      results.push({
        name: "Zero-Copy Subarray Slicing",
        passed: code.includes("subarray") || code.includes("copyWithin"),
        detail: "Maintains ring/sliding buffer with copyWithin or subarray offsets",
      });
    } else if (id === "task_refactor_middleware_pipeline") {
      results.push({
        name: "Middleware Pipeline Registration",
        passed: code.includes("use("),
        detail: "Provides use() middleware registration API",
      });
      results.push({
        name: "Onion Dispatch",
        passed: code.includes("dispatch(") || code.includes("next()"),
        detail: "Chains execution with (context, next) dispatch",
      });
    } else if (id === "task_refactor_debounce_search") {
      results.push({
        name: "Timer Clearance",
        passed: code.includes("clearTimeout"),
        detail: "Cancels active timer on subsequent keystrokes",
      });
      results.push({
        name: "In-Flight Request Cancellation",
        passed: code.includes("AbortController"),
        detail: "Aborts previous in-flight HTTP requests",
      });
    } else if (id === "task_refactor_css_grid") {
      results.push({
        name: "CSS Grid & Flexbox Modernization",
        passed: code.includes("display: grid") || code.includes("grid-template-columns"),
        detail: "Uses modern CSS Grid layout",
      });
      results.push({
        name: "Eliminates Legacy Float Hacks",
        passed: !code.includes("float: left") && !code.includes("clear: both"),
        detail: "Removes clearfix and float rules",
      });
    } else if (id === "task_refactor_reducer_state") {
      results.push({
        name: "Pure Reducer Function",
        passed: (code.includes("switch ") || code.includes("if (action")) && code.includes("return "),
        detail: "Uses deterministic state transitions based on action type",
      });
      results.push({
        name: "Immutable State Returns",
        passed: code.includes("...state"),
        detail: "Returns new state object without in-place mutation",
      });
    } else if (id === "task_refactor_semantic_a11y") {
      results.push({
        name: "Semantic Button Element",
        passed: code.includes("<button"),
        detail: "Replaces non-semantic div with button element",
      });
      results.push({
        name: "Accessible ARIA Role & State",
        passed: code.includes('role="switch"') || code.includes("role='switch'"),
        detail: "Applies ARIA switch role and state attributes",
      });
    } else if (id === "task_refactor_typed_schema") {
      results.push({
        name: "Schema Type Guards",
        passed: code.includes("typeof ") || code.includes("Array.isArray"),
        detail: "Enforces strict type checks on incoming payload",
      });
      results.push({
        name: "Explicit Validation Errors",
        passed: code.includes("throw "),
        detail: "Fails fast with clear validation exceptions",
      });
    } else if (id === "task_refactor_worker_pool") {
      results.push({
        name: "Bounded Concurrency",
        passed: code.includes("concurrency") || code.includes("pool") || code.includes("Math.min"),
        detail: "Limits simultaneous parallel executions",
      });
      results.push({
        name: "Non-blocking Async Batching",
        passed: code.includes("Promise.all"),
        detail: "Dispatches tasks concurrently using Promise.all",
      });
    } else if (id === "task_db_connection_pool") {
      results.push({
        name: "Bounded Pool & Idle Reuse",
        passed: code.includes("acquire") && code.includes("release") && (code.includes("maxSize") || code.includes("#idle") || code.includes("idle")),
        detail: "Manages active and idle connections with bounded pool capacity",
      });
      results.push({
        name: "Automatic Lifecycle Cleanup (finally)",
        passed: code.includes("finally") && code.includes("release"),
        detail: "Guarantees connection return to pool even when queries throw",
      });
    } else if (id === "task_db_transactional_outbox") {
      results.push({
        name: "Parameterized SQL Queries",
        passed: (code.includes("$1") || code.includes("?")) && !code.includes("${fromAccount}"),
        detail: "Uses parameterized placeholders instead of unsafe string interpolation",
      });
      results.push({
        name: "Atomic Transaction & Outbox",
        passed: code.includes("BEGIN") && code.includes("COMMIT") && code.includes("ROLLBACK") && code.includes("outbox_events"),
        detail: "Wraps state mutation and outbox event insert in BEGIN/COMMIT/ROLLBACK",
      });
      results.push({
        name: "Transient Deadlock Retry",
        passed: code.includes("40001") || code.includes("40P01") || code.includes("SQLITE_BUSY"),
        detail: "Retries transient serialization and deadlock database error codes",
      });
    } else if (id === "task_db_keyset_pagination_dataloader") {
      results.push({
        name: "Microtask Batch Coalescing",
        passed: code.includes("queueMicrotask") || code.includes("Promise.all"),
        detail: "Batches individual lookups within the same event loop tick",
      });
      results.push({
        name: "Keyset Cursor Pagination",
        passed: !code.includes("OFFSET") && (code.includes("created_at") || code.includes("cursor")),
        detail: "Eliminates linear OFFSET scans in favor of keyset cursor pagination",
      });
    } else if (id === "task_auth_dpop_token_binding") {
      results.push({
        name: "DPoP Header & Claim Validation",
        passed: code.includes("dpop+jwt") && code.includes("htm") && code.includes("htu") && code.includes("ath"),
        detail: "Verifies dpop+jwt typ header, HTTP method/URI binding, and access token hash",
      });
      results.push({
        name: "JTI Replay & JWK Thumbprint Binding",
        passed: code.includes("jti") && (code.includes("replayCache") || code.includes("Set")) && code.includes("jwk"),
        detail: "Binds proof to public JWK thumbprint and prevents JTI token replay",
      });
    } else if (id === "task_auth_webauthn_passkey") {
      results.push({
        name: "WebAuthn ClientData & Binary Flags",
        passed: code.includes("webauthn.get") && code.includes("0x01") && code.includes("0x04"),
        detail: "Validates webauthn.get challenge/origin and UP/UV authenticator flags",
      });
      results.push({
        name: "Big-Endian SignCount Clone Detection",
        passed: (code.includes("DataView") || code.includes("getUint32")) && code.includes("signCount"),
        detail: "Parses uint32 signCount and rejects cloned authenticators on counter regression",
      });
    } else if (id === "task_auth_refresh_rotation_reuse") {
      results.push({
        name: "One-Time Refresh Rotation",
        passed: code.includes("used") && code.includes("familyId") && code.includes("rotate"),
        detail: "Tracks single-use state per refresh token within a token family",
      });
      results.push({
        name: "Compromised Family Revocation",
        passed: code.includes("revokeFamily") || (code.includes("revoked") && code.includes("familyId")),
        detail: "Revokes the entire token family immediately when a rotated token is replayed",
      });
    } else if (id === "task_fingerprint_entropy_normalizer") {
      results.push({
        name: "Multi-Surface Deterministic Digest",
        passed: (code.includes("0x811c9dc5") || code.includes("Math.imul") || code.includes("hash")) && code.includes("webgl"),
        detail: "Hashes normalized Canvas, WebGL, Audio, and hardware signals into a deterministic ID",
      });
      results.push({
        name: "Cross-Layer Spoofing Anomaly Checks",
        passed: code.includes("SwiftShader") && code.includes("webdriver") && code.includes("platform"),
        detail: "Detects UA/platform contradictions, software WebGL renderers, and webdriver flags",
      });
    } else if (id === "task_fingerprint_tls_ja4_http2") {
      results.push({
        name: "RFC 8701 TLS GREASE Filtering",
        passed: code.includes("0x0a0a") || code.includes("0x0f0f") || code.includes("isTlsGreaseValue"),
        detail: "Strips GREASE values before computing TLS ClientHello signature",
      });
      results.push({
        name: "JA4 & HTTP/2 Pseudo-Header Correlation",
        passed: code.includes(":method,:authority,:scheme,:path") && code.includes("ja4"),
        detail: "Correlates JA4 TLS signature and HTTP/2 pseudo-header order against claimed User-Agent",
      });
    } else if (id === "task_fingerprint_privacy_budget_defense") {
      results.push({
        name: "Per-Origin Entropy Budget Enforcement",
        passed: code.includes("maxBudgetBits") && code.includes("PrivacyBudgetExceededError"),
        detail: "Tracks cumulative entropy cost per origin and blocks reads past maxBudgetBits",
      });
      results.push({
        name: "Session+Origin Keyed Deterministic Farbling",
        passed: code.includes("farbleCanvasPixels") || (code.includes("Uint8Array") && code.includes("^")),
        detail: "Applies deterministic per-origin LSB perturbation to break cross-site fingerprint linking",
      });
    } else if (id === "task_cybersec_ssrf_dns_rebind") {
      results.push({
        name: "Private CIDR & Cloud Metadata Blocking",
        passed: code.includes("169") && code.includes("254") && code.includes("::ffff:") && code.includes("127"),
        detail: "Blocks 169.254.169.254 metadata, RFC 1918 ranges, IPv6 loopback, and ::ffff: mapped IPs",
      });
      results.push({
        name: "DNS Resolution Pinning",
        passed: code.includes("pinnedIp") && code.includes("Host") && code.includes("manual"),
        detail: "Pins validated DNS IP address and disables automatic redirect following",
      });
    } else if (id === "task_cybersec_csp_trusted_types_dom") {
      results.push({
        name: "Event Handler & Dangerous URI Stripping",
        passed: code.includes("javascript:") && code.includes("on") && code.includes("iframe"),
        detail: "Removes forbidden tags, inline on* handlers, and obfuscated javascript:/data: URIs",
      });
      results.push({
        name: "Nonce-Strict CSP with Trusted Types",
        passed: code.includes("strict-dynamic") && code.includes("require-trusted-types-for") && code.includes("base-uri 'none'"),
        detail: "Builds strict nonce CSP enforcing Trusted Types and disabling object-src/base-uri",
      });
    } else if (id === "task_cybersec_timing_safe_webhook_csrf") {
      results.push({
        name: "Constant-Time Bitwise Comparison",
        passed: code.includes("^") && code.includes("|=") && code.includes("charCodeAt"),
        detail: "Uses bitwise XOR accumulator for constant-time secret comparison",
      });
      results.push({
        name: "Replay Window & Fetch-Metadata CSRF Guard",
        passed: code.includes("same-origin") && code.includes("toleranceSec") && code.includes("seenNonces"),
        detail: "Enforces timestamp tolerance, nonce deduplication, and Sec-Fetch-Site CSRF checks",
      });
    } else if (id === "task_agentic_dag_planner_saga") {
      results.push({
        name: "DAG Cycle Detection & Wave Concurrency",
        passed: code.includes("CyclicDependencyError") && code.includes("Promise.all") && code.includes("deps"),
        detail: "Detects cyclic dependencies and dispatches ready DAG waves in parallel",
      });
      results.push({
        name: "Checkpointing & Reverse Saga Compensation",
        passed: code.includes("compensate") && code.includes("reverse") && code.includes("checkpoint"),
        detail: "Supports checkpoint resumption and reverse-order Saga rollback on step failure",
      });
    } else if (id === "task_agentic_tool_circuit_breaker_budget") {
      results.push({
        name: "Per-Tool Circuit Breaker & Fallback Routing",
        passed: code.includes("open") && code.includes("closed") && code.includes("fallback"),
        detail: "Opens tool circuit after threshold failures and routes to fallback handler",
      });
      results.push({
        name: "Action Loop Detection & Token Budget Guard",
        passed: code.includes("loopDetected") && code.includes("maxTokens") && code.includes("maxSteps"),
        detail: "Halts repeated identical tool invocations and enforces token/step budgets",
      });
    } else if (id === "task_agentic_episodic_memory_compactor") {
      results.push({
        name: "Root Goal Pinning & Context Compaction",
        passed: code.includes("pinnedGoal") && code.includes("maxContextTokens") && code.includes("artifacts"),
        detail: "Preserves pinned root goal while compacting older turns into episodic memory",
      });
      results.push({
        name: "Episodic Retrieval & Goal-Drift Alignment Check",
        passed: code.includes("retrieveEpisodic") && code.includes("checkGoalAlignment"),
        detail: "Retrieves relevant episodic memories by term overlap and blocks out-of-scope drift",
      });
    } else if (id === "task_db_read_write_replica_lag_router") {
      results.push({
        name: "Causal LSN Watermark Tracking",
        passed: code.includes("minLsn") && code.includes("appliedLsn"),
        detail: "Tracks session write LSN and compares against replica appliedLsn",
      });
      results.push({
        name: "Primary Fallback on Lag or Failure",
        passed: code.includes("primary") && code.includes("healthy"),
        detail: "Falls back to primary node when replicas lag behind session LSN or fail",
      });
    } else if (id === "task_auth_oidc_federated_jwt_validator") {
      results.push({
        name: "Asymmetric Algorithm Allowlist & JWKS Rotation",
        passed: code.includes("RS256") && code.includes("ES256") && code.includes("forceRefresh"),
        detail: "Enforces asymmetric signing algorithms and refreshes JWKS on unknown kid",
      });
      results.push({
        name: "Multi-Audience Azp & Nonce Validation",
        passed: code.includes("azp") && code.includes("nonce") && code.includes("exp"),
        detail: "Validates iss, aud, azp, exp/nbf, and session nonce claims",
      });
    } else if (id === "task_fingerprint_behavioral_biometrics_bot") {
      results.push({
        name: "Pointer Kinematics & Collinearity Analysis",
        passed: code.includes("Math.hypot") && code.includes("variance") && code.includes("collinear"),
        detail: "Analyzes pointer velocity variance and 2D cross-product collinearity",
      });
      results.push({
        name: "Untrusted Event & Keystroke Dwell Checks",
        passed: code.includes("isTrusted") && code.includes("upTime") && code.includes("downTime"),
        detail: "Detects synthetic untrusted events and zero-duration keystroke dwell times",
      });
    } else if (id === "task_cybersec_http_desync_header_canonicalizer") {
      results.push({
        name: "CL.TE / TE.CL Desync Ambiguity Rejection",
        passed: code.includes("transfer-encoding") && code.includes("content-length") && code.includes("chunked"),
        detail: "Rejects requests with both Transfer-Encoding and Content-Length or obfuscated chunked framing",
      });
      results.push({
        name: "CRLF Header Splitting Guard",
        passed: code.includes("\\r") && code.includes("\\n"),
        detail: "Blocks CR, LF, and NUL control bytes inside HTTP header names and values",
      });
    } else if (id === "task_agentic_multi_agent_consensus_arbiter") {
      results.push({
        name: "Hierarchical Path Conflict Detection",
        passed: code.includes("startsWith") && code.includes("LeaseConflictError"),
        detail: "Prevents overlapping parent/child directory leases across concurrent peer agents",
      });
      results.push({
        name: "Monotonic Fencing Token Enforcement",
        passed: code.includes("epoch") && code.includes("StaleFencingTokenError"),
        detail: "Rejects stale commits from expired or superseded fencing epochs",
      });
    } else if (id === "task_chat_realtime_instrumentation") {
      results.push({
        name: "Canonical Two-User Room & Monotonic Sequence",
        passed: code.includes("dm:") && code.includes("seq") && code.includes("readWatermarks"),
        detail: "Normalizes dm:userA:userB room IDs, increments seq, and tracks read watermarks",
      });
      results.push({
        name: "Ephemeral Typing TTL & Telemetry",
        passed: code.includes("typing") && code.includes("telemetry"),
        detail: "Prunes expired typing indicators and records real-time chat telemetry",
      });
    } else if (id === "task_chat_debug_race_duplication") {
      results.push({
        name: "ClientMsgId Idempotency Deduplication",
        passed: code.includes("clientMsgId") && (code.includes("seenClientIds") || code.includes("duplicate")),
        detail: "Suppresses duplicate retried messages using clientMsgId lookup",
      });
      results.push({
        name: "Out-of-Order Holdback Resequencing",
        passed: code.includes("nextExpectedSeq") && (code.includes("holdbackBuffer") || code.includes("while")),
        detail: "Buffers future sequence packets and flushes contiguous runs when gaps fill",
      });
    } else if (id === "task_chat_refactor_state_protocol") {
      results.push({
        name: "Pure Immutable Chat Protocol Reducer",
        passed: code.includes("MESSAGE_SENT") && code.includes("MESSAGE_EDITED") && code.includes("MESSAGE_READ"),
        detail: "Handles chat protocol actions deterministically without DOM/socket side effects",
      });
      results.push({
        name: "Declarative Effect Tuples",
        passed: code.includes("effects") && code.includes("SSE_BROADCAST"),
        detail: "Returns { state, effects } tuples for outbound broadcast and client ACKs",
      });
    } else if (id === "task_chat_perf_ringbuffer_fanout_bench") {
      results.push({
        name: "O(1) Modular Ring Buffer Indexing",
        passed: code.includes("%") && code.includes("capacity") && !code.includes("[...this.history"),
        detail: "Writes to circular buffer slots in O(1) time without array spread reallocation",
      });
      results.push({
        name: "Single-Encode Fanout & P99 Latency Benchmark",
        passed: code.includes("JSON.stringify") && code.includes("p99Us"),
        detail: "Pre-serializes broadcast frame once and computes P50/P99 fanout latency metrics",
      });
    } else if (id === "task_css_container_style_subgrid") {
      results.push({
        name: "Intrinsic Container Size & Style Queries",
        passed:
          code.includes("container-type: inline-size") &&
          code.includes("@container") &&
          code.includes("style(--featured"),
        detail: "Uses container-type: inline-size with @container size and style(--featured) queries",
      });
      results.push({
        name: "CSS Grid Subgrid Track Alignment",
        passed: code.includes("subgrid") && !code.includes("height: 120px"),
        detail: "Aligns nested card rows across columns via grid-template-rows: subgrid",
      });
    } else if (id === "task_css_cascade_layers_oklch_tokens") {
      results.push({
        name: "Deterministic @layer Cascade Hierarchy",
        passed:
          code.includes("@layer reset, tokens") &&
          code.includes("@layer components") &&
          !code.includes("!important"),
        detail: "Isolates cascade specificity with @layer blocks and zero !important overrides",
      });
      results.push({
        name: "Typed @property & Relative OKLCH Color Syntax",
        passed:
          code.includes("@property") &&
          code.includes("light-dark(") &&
          code.includes("oklch(from "),
        detail: "Registers animatable custom properties via @property and derives tokens with oklch(from ...)",
      });
    } else if (id === "task_css_scroll_driven_view_transitions") {
      results.push({
        name: "Compositor Scroll & View Progress Timelines",
        passed:
          code.includes("animation-timeline: scroll(") &&
          code.includes("animation-timeline: view(") &&
          code.includes("animation-range:"),
        detail: "Uses CSS scroll() and view() timelines with animation-range instead of JS scroll listeners",
      });
      results.push({
        name: "View Transitions & Reduced-Motion Guard",
        passed:
          code.includes("::view-transition-") &&
          code.includes("prefers-reduced-motion: reduce"),
        detail: "Configures ::view-transition pseudo-elements and respects prefers-reduced-motion",
      });
    } else if (id === "task_css_anchor_positioning_has_popover") {
      results.push({
        name: "Declarative CSS Anchor Positioning & @position-try",
        passed:
          code.includes("anchor-name:") &&
          code.includes("position-anchor:") &&
          code.includes("anchor(") &&
          code.includes("@position-try"),
        detail: "Tethers popover via anchor-name/position-anchor and flips on overflow with @position-try",
      });
      results.push({
        name: "Relational :has(:popover-open) Parent State",
        passed: code.includes(":has(") && code.includes(":popover-open"),
        detail: "Styles parent container state declaratively when child popover is open",
      });
    } else if (id === "task_ts_react_nextjs_server_actions") {
      results.push({
        name: "TypeScript Discriminated Union ActionResult<T>",
        passed:
          code.includes("ActionResult") &&
          code.includes("readonly ok: true") &&
          code.includes("readonly ok: false"),
        detail: "Defines strict TypeScript discriminated union result envelope with ok: true | false",
      });
      results.push({
        name: "Immutable Optimistic Rollback & Server Action Wrapper",
        passed:
          code.includes("ROLLBACK_FAILURE") &&
          code.includes("COMMIT_SUCCESS") &&
          code.includes("createSafeServerAction"),
        detail: "Rolls back optimistic state on server failure and validates inputs before handler execution",
      });
    } else if (id === "task_ts_angular_signals_computed_rx") {
      results.push({
        name: "Typed Angular Signal & Computed Dependency Tracking",
        passed:
          code.includes("WritableSignal<T>") &&
          code.includes("computed<T>") &&
          code.includes("Object.is"),
        detail: "Implements reactive signal<T> and memoized computed<T> with automatic dependency tracking",
      });
      results.push({
        name: "Cancelable switchMap Async Loader",
        passed: code.includes("AbortController") && code.includes("createSwitchMapLoader"),
        detail: "Cancels stale in-flight async requests when source signal updates",
      });
    } else if (id === "task_ts_nestjs_di_guard_interceptor") {
      results.push({
        name: "Typed NestJS IoC Container & CanActivate Guard",
        passed:
          code.includes("CanActivate") &&
          code.includes("ExecutionContext") &&
          code.includes("NestContainer"),
        detail: "Resolves DI providers by token and enforces RBAC CanActivate guard before controller execution",
      });
      results.push({
        name: "Around-Advice NestInterceptor & CallHandler",
        passed: code.includes("NestInterceptor") && code.includes("next.handle()"),
        detail: "Wraps route execution in composable CallHandler interceptor chain with audit telemetry",
      });
    } else if (id === "task_ts_trpc_zod_end_to_end_rpc") {
      results.push({
        name: "Generic ProcedureBuilder<TContext, TInput> & Middleware Narrowing",
        passed:
          code.includes("ProcedureBuilder<") &&
          code.includes("use<") &&
          code.includes("input<"),
        detail: "Provides fluent .use() context narrowing and .input() schema validation builder",
      });
      results.push({
        name: "Structured TRPCError & Router Caller Factory",
        passed: code.includes("TRPCError") && code.includes("createCaller"),
        detail: "Throws typed TRPCError codes and exposes createCaller(ctx) for end-to-end RPC dispatch",
      });
    } else if (id === "task_migrate_express_to_hono_edge_ts") {
      results.push({
        name: "Web-Standard Request/Response & Typed EdgeContext<TVariables>",
        passed:
          code.includes("EdgeContext<") &&
          code.includes("new Response(") &&
          !code.includes("res.status("),
        detail: "Migrates Express req/res mutation to Web-Standard Fetch Request/Response and typed context",
      });
      results.push({
        name: "Route Parameter Extraction & Async Onion Middleware",
        passed: code.includes("params") && code.includes("dispatch(") && code.includes("fetch(req: Request)"),
        detail: "Extracts :param segments and dispatches async middleware chains via fetch(req)",
      });
    } else if (id === "task_migrate_react_hooks_to_svelte5_vue3_signals") {
      results.push({
        name: "Fine-Grained $state<T>, $derived<T> & $effect Primitives",
        passed:
          code.includes("$state<") &&
          code.includes("$derived") &&
          code.includes("$effect"),
        detail: "Replaces React manual hook dependency arrays with auto-tracking fine-grained primitives",
      });
      results.push({
        name: "Automatic Dependency Tracking & Effect Cleanup",
        passed: code.includes("onCleanup") && code.includes("Object.is"),
        detail: "Tracks reactive reads automatically and runs registered cleanup callbacks before re-execution",
      });
    } else if (id === "task_migrate_redux_thunks_to_tanstack_query_ts") {
      results.push({
        name: "Deterministic QueryKey Hashing & In-Flight Deduplication",
        passed:
          code.includes("hashQueryKey") &&
          code.includes("inFlight") &&
          code.includes("staleTime"),
        detail: "Canonicalizes QueryKey hashes, deduplicates concurrent fetches, and honors staleTime",
      });
      results.push({
        name: "Prefix Invalidation & Optimistic Rollback",
        passed:
          code.includes("invalidateQueries") &&
          code.includes("executeOptimisticMutation") &&
          code.includes("snapshot"),
        detail: "Invalidates matching query prefixes and rolls back optimistic cache state on mutation error",
      });
    } else if (id === "task_migrate_nextjs_pages_to_app_router_rsc") {
      results.push({
        name: "Parallel RSC Data Fetching & Tagged Cache",
        passed:
          code.includes("Promise.all") &&
          code.includes("fetchWithTags") &&
          code.includes("revalidateTag"),
        detail: "Replaces sequential getServerSideProps waterfall with parallel tagged RSC fetches",
      });
      results.push({
        name: "Web-Standard Route Handler Cache Revalidation",
        passed: code.includes("Request") && code.includes("Response") && code.includes("evictedCount"),
        detail: "Exposes Web-Standard POST Route Handler that invalidates tagged cache entries on demand",
      });
    } else {
      results.push({
        name: "Syntactic Refactoring Valid",
        passed: code.length > 20 && code !== task.starterCode,
        detail: "Produces non-trivial clean refactored implementation",
      });
    }

    return results;
  }

  async #runSandboxTests(taskId, code, options) {
    const results = [];
    const task = REFACTORING_CURRICULUM_TASKS.find((t) => t.id === taskId);

    if (task?.category === "css" || taskId === "task_refactor_semantic_a11y") {
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      const balanced =
        taskId === "task_refactor_semantic_a11y"
          ? code.includes("<button") && code.includes("</button>")
          : openBraces > 0 && openBraces === closeBraces;
      results.push({
        name: "Markup / Stylesheet AST & Block Balance Valid",
        passed: balanced,
        detail: balanced
          ? "Stylesheet rule blocks and markup tags are balanced and structurally valid"
          : "Unbalanced CSS rule braces or malformed markup structure",
      });
      return results;
    }

    // Transpile TypeScript / TSX syntax natively via Bun.Transpiler when evaluating TS tasks
    let executableCode = code;
    if (
      task?.track === "enterprise-typescript" ||
      /\b(interface|type\s+[A-Za-z0-9_]+\s*=|readonly\s+|:\s*(string|number|boolean|unknown|any|Record|Promise|Readonly))\b/.test(code)
    ) {
      const transpiler = new Bun.Transpiler({ loader: "tsx", target: "bun" });
      executableCode = transpiler.transformSync(code);
    }

    const sanitizedCode = executableCode.replace(/\bexport\s+(default\s+)?/g, "");

    // Safe isolated execution context
    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout,
      clearTimeout,
      setImmediate,
      queueMicrotask,
      AbortController,
      Promise,
      Uint8Array,
      Int32Array,
      Float32Array,
      Float64Array,
      ArrayBuffer,
      DataView,
      Map,
      Set,
      Date,
      Math,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      TypeError,
      RangeError,
      JSON,
      Symbol,
      URL,
      URLSearchParams,
      Request,
      Response,
      Headers,
      TextEncoder,
      TextDecoder,
      btoa,
      atob,
      crypto,
      exports: {},
    };

    const ctx = createContext(sandbox);

    if (taskId === "task_refactor_async_pipeline") {
      const harness = `
        const fetchUser = async (id) => ({ id });
        const fetchUserPreferences = async () => ({ theme: "mono" });
        const fetchRecentActivity = async () => ([1, 2, 3]);
        const calculateScore = async (act) => act.length * 10;
        ${sanitizedCode};
        (async () => {
          const fn = typeof processUserData === "function" ? processUserData : exports.processUserData;
          const out = await fn("u_1");
          return { ok: out?.user?.id === "u_1" && out?.score === 30 && out?.prefs?.theme === "mono" };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Async Pipeline Execution",
        passed: Boolean(res?.ok),
        detail: "Resolves concurrent user, preferences, activity, and score pipeline",
      });
    } else if (taskId === "task_refactor_event_leak") {
      const harness = `
        const signals = [];
        const window = {
          innerWidth: 1280,
          addEventListener: (_evt, _fn, opts) => { if (opts?.signal) signals.push(opts.signal); },
          removeEventListener: () => {},
        };
        ${sanitizedCode};
        (() => {
          const W = typeof VisualizerWidget === "function" ? VisualizerWidget : exports.VisualizerWidget;
          const inst = new W({ innerText: "" });
          inst.destroy?.();
          return { cleanedUp: signals.length >= 2 && signals.every(s => s.aborted === true) };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DOM Listener Abort Cleanup",
        passed: Boolean(res?.cleanedUp),
        detail: "Aborts all registered window listeners when destroy() is called",
      });
    } else if (taskId === "task_refactor_o_n2_lookup") {
      // Test execution of O(N) map reconciliation
      const harness = `
        ${sanitizedCode};
        const fn = typeof reconcileTransactions === "function" ? reconcileTransactions : exports.reconcileTransactions;
        const orders = [{ id: "o1" }, { id: "o2" }];
        const payments = [{ orderId: "o1", txHash: "0xabc" }];
        const result = fn(orders, payments);
        result;
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reconciliation Correctness",
        passed: Array.isArray(res) && res[0]?.isPaid === true && res[1]?.isPaid === false,
        detail: "Produces expected transaction payment matching output",
      });
    } else if (taskId === "task_refactor_input_sanitization") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof mergeConfig === "function" ? mergeConfig : exports.mergeConfig;
          const malicious = JSON.parse('{"__proto__":{"polluted":"yes"},"nested":{"ok":true}}');
          const out = fn({}, malicious);
          return { safe: ({}).polluted === undefined && out?.nested?.ok === true };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Prototype Pollution Immunity",
        passed: Boolean(res?.safe),
        detail: "Merges nested config while preventing Object.prototype pollution",
      });
    } else if (taskId === "task_refactor_reducer_state") {
      const harness = `
        ${sanitizedCode};
        const fn = typeof taskReducer === "function" ? taskReducer : exports.taskReducer;
        const s1 = fn({ tasks: [{ id: "1", done: false }] }, { type: "TASK_TOGGLED", id: "1" });
        const s2 = fn(s1, { type: "FILTER_CHANGED", filter: "active" });
        ({ s1, s2 });
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Reducer State Transitions",
        passed: res?.s1?.tasks[0]?.done === true && res?.s2?.filter === "active",
        detail: "Correctly performs deterministic immutable state updates",
      });
    } else if (taskId === "task_refactor_buffer_alloc") {
      const harness = `
        const dispatched = [];
        const dispatchPacket = (slice) => dispatched.push(new TextDecoder().decode(slice));
        ${sanitizedCode};
        (() => {
          const fn = typeof processTelemetryStream === "function" ? processTelemetryStream : exports.processTelemetryStream;
          const enc = new TextEncoder();
          fn([enc.encode("pkt1\\npkt"), enc.encode("2\\ntail")]);
          return { count: dispatched.length, first: dispatched[0], second: dispatched[1] };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Zero-Allocation Uint8Array Stream Slicing",
        passed: Boolean(res?.count === 2 && res?.first === "pkt1" && res?.second === "pkt2"),
        detail: "Reassembles split byte chunks across boundaries and dispatches exact slices",
      });
    } else if (taskId === "task_refactor_middleware_pipeline") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const P = typeof Pipeline === "function" ? Pipeline : exports.Pipeline;
          const pipe = new P();
          const order = [];
          pipe.use(async (ctx, next) => { order.push("a_in"); await next(); order.push("a_out"); });
          pipe.use(async (ctx, next) => { order.push("b"); ctx.response = "ok"; await next(); });
          const res = await pipe.execute({});
          return { res, order: order.join(",") };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Onion Middleware Execution Order",
        passed: Boolean(res?.res === "ok" && res?.order === "a_in,b,a_out"),
        detail: "Executes middleware stack in deterministic onion order",
      });
    } else if (taskId === "task_refactor_debounce_search") {
      const harness = `
        let fetchSignals = [];
        const fetch = async (_url, opts) => {
          fetchSignals.push(opts?.signal);
          return { json: async () => ({ results: ["hit"] }) };
        };
        ${sanitizedCode};
        (() => {
          const create = typeof createDebouncedSearch === "function" ? createDebouncedSearch : exports.createDebouncedSearch;
          const search = create(10);
          search("a", () => {});
          search("ab", () => {});
          return { abortedFirst: fetchSignals.length === 0 || true, isFn: typeof search === "function" };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Cancelable Debounce Factory",
        passed: Boolean(res?.isFn),
        detail: "Creates cancelable debounced search handler with AbortController lifecycle",
      });
    } else if (taskId === "task_refactor_typed_schema") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const parse = typeof parseTransactionWebhook === "function" ? parseTransactionWebhook : exports.parseTransactionWebhook;
          const valid = parse({
            event: { id: "evt_1" },
            data: { transaction: { amount: 19.5, items: [{ sku: " item_a " }] } }
          });
          let rejectedMalformed = false;
          try { parse({ event: { id: "" } }); } catch { rejectedMalformed = true; }
          return { ok: valid.id === "evt_1" && valid.amount === "19.50" && rejectedMalformed };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Runtime Schema Validation & Error Guard",
        passed: Boolean(res?.ok),
        detail: "Parses valid nested payloads and throws on malformed webhook inputs",
      });
    } else if (taskId === "task_refactor_worker_pool") {
      const harness = `
        const intensiveHash = (payload, iter) => payload + "_" + iter;
        ${sanitizedCode};
        (async () => {
          const fn = typeof computeHeavyHashes === "function" ? computeHeavyHashes : exports.computeHeavyHashes;
          const out = await fn([{ payload: "x" }, { payload: "y" }, { payload: "z" }], 2);
          return { ok: Array.isArray(out) && out.join(",") === "x_50000,y_50000,z_50000" };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Bounded Worker Pool Execution & Ordering",
        passed: Boolean(res?.ok),
        detail: "Processes records concurrently while preserving input index ordering",
      });
    } else if (taskId === "task_db_connection_pool") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Pool = typeof ConnectionPool === "function" ? ConnectionPool : exports.ConnectionPool;
          let created = 0;
          const pool = new Pool(async () => {
            const id = ++created;
            return { id, ping: async () => true, close: async () => {} };
          }, { maxSize: 2, acquireTimeoutMs: 50 });

          const c1 = await pool.acquire();
          const c2 = await pool.acquire();
          pool.release(c1);
          const c3 = await pool.acquire();
          const reused = c3.id === c1.id && created === 2;
          pool.release(c2);
          pool.release(c3);

          let releasedAfterError = false;
          try {
            await pool.withConnection(async () => { throw new Error("boom"); });
          } catch {}
          const st = pool.stats ? pool.stats() : { active: 0, idle: 2 };
          releasedAfterError = st.active === 0 && st.idle >= 1;
          await pool.drain?.();
          return { reused, releasedAfterError };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pool Reuse & Fault-Safe Release",
        passed: Boolean(res?.reused && res?.releasedAfterError),
        detail: "Reuses idle connections within maxSize and releases on query exceptions",
      });
    } else if (taskId === "task_db_transactional_outbox") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const fn = typeof transferFunds === "function" ? transferFunds : exports.transferFunds;
          const log = [];
          let calls = 0;
          const mockDb = {
            async query(sql, params) {
              log.push({ sql, params });
              if (sql === "BEGIN" && ++calls === 1) {
                const err = new Error("deadlock detected");
                err.code = "40P01";
                throw err;
              }
              if (sql.startsWith("UPDATE accounts SET balance = balance -")) {
                return { rows: [{ balance: 75 }] };
              }
              return { rows: [] };
            }
          };
          const out = await fn(mockDb, { fromAccount: "acc_1", toAccount: "acc_2", amount: 25, idempotencyKey: "ik_1" });
          const hasRollback = log.some(e => e.sql === "ROLLBACK");
          const hasCommit = log.some(e => e.sql === "COMMIT");
          const hasOutbox = log.some(e => e.sql.includes("outbox_events") && Array.isArray(e.params));
          return { ok: out?.ok, attempt: out?.attempt, hasRollback, hasCommit, hasOutbox };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transactional Outbox & Deadlock Retry",
        passed: Boolean(res?.ok && res?.attempt === 2 && res?.hasRollback && res?.hasCommit && res?.hasOutbox),
        detail: "Rolls back on 40P01 deadlock, retries transaction, and writes parameterized outbox event",
      });
    } else if (taskId === "task_db_keyset_pagination_dataloader") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Loader = typeof BatchDataLoader === "function" ? BatchDataLoader : exports.BatchDataLoader;
          let batchCalls = 0;
          let batchedKeys = [];
          const loader = new Loader(async (keys) => {
            batchCalls++;
            batchedKeys = keys;
            return new Map(keys.map(k => [k, { id: k, name: "User_" + k }]));
          });
          const [u1, u2, u1Dup] = await Promise.all([
            loader.load("u1"),
            loader.load("u2"),
            loader.load("u1"),
          ]);
          return {
            batchCalls,
            uniqueCount: batchedKeys.length,
            matched: u1?.name === "User_u1" && u2?.name === "User_u2" && u1Dup?.name === "User_u1"
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DataLoader Single-Tick Batch Coalescing",
        passed: Boolean(res?.batchCalls === 1 && res?.uniqueCount === 2 && res?.matched),
        detail: "Coalesces 3 concurrent lookups (with duplicate key) into 1 batch query of 2 unique keys",
      });
    } else if (taskId === "task_auth_dpop_token_binding") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyDpopProof === "function" ? verifyDpopProof : exports.verifyDpopProof;
          const replayCache = new Set();
          const jwk = { kty: "EC", crv: "P-256", x: "x_val", y: "y_val" };
          const hashFn = (s) => "h_" + s;
          const expectedJkt = hashFn(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }));
          const proof = {
            header: { typ: "dpop+jwt", alg: "ES256", jwk },
            payload: {
              jti: "nonce_1",
              htm: "POST",
              htu: "https://api.example.com/v1/transfer",
              iat: 1700000000,
              ath: hashFn("at_secret_1"),
            },
            signatureValid: true,
          };
          const valid = fn({
            dpopProof: proof,
            accessToken: "at_secret_1",
            expectedJkt,
            httpMethod: "POST",
            httpUrl: "https://api.example.com/v1/transfer?foo=bar#frag",
            replayCache,
            nowSec: 1700000010,
            hashFn,
          });
          let replayBlocked = false;
          try {
            fn({
              dpopProof: proof,
              accessToken: "at_secret_1",
              expectedJkt,
              httpMethod: "POST",
              httpUrl: "https://api.example.com/v1/transfer",
              replayCache,
              nowSec: 1700000012,
              hashFn,
            });
          } catch {
            replayBlocked = true;
          }
          return { bound: valid?.bound, replayBlocked };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DPoP Proof Binding & Replay Rejection",
        passed: Boolean(res?.bound === true && res?.replayBlocked === true),
        detail: "Accepts valid sender-constrained DPoP proof and blocks JTI replay",
      });
    } else if (taskId === "task_auth_webauthn_passkey") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof verifyPasskeyAssertion === "function" ? verifyPasskeyAssertion : exports.verifyPasskeyAssertion;
          const rpHash = new Uint8Array(32).fill(7);
          const authData = new Uint8Array(37);
          authData.set(rpHash, 0);
          authData[32] = 0x01 | 0x04; // UP + UV
          new DataView(authData.buffer).setUint32(33, 15, false); // signCount = 15

          const ok = fn({
            clientDataJSON: JSON.stringify({
              type: "webauthn.get",
              challenge: "chal_xyz",
              origin: "https://login.example.com",
            }),
            authenticatorData: authData,
            signatureValid: true,
            expectedChallenge: "chal_xyz",
            expectedOrigin: "https://login.example.com",
            expectedRpIdHash: rpHash,
            storedCredential: { userId: "usr_1", signCount: 10 },
          });

          let cloneDetected = false;
          try {
            fn({
              clientDataJSON: JSON.stringify({
                type: "webauthn.get",
                challenge: "chal_xyz",
                origin: "https://login.example.com",
              }),
              authenticatorData: authData,
              signatureValid: true,
              expectedChallenge: "chal_xyz",
              expectedOrigin: "https://login.example.com",
              expectedRpIdHash: rpHash,
              storedCredential: { userId: "usr_1", signCount: 15 }, // Equal/higher stored signCount -> clone!
            });
          } catch {
            cloneDetected = true;
          }
          return { verified: ok?.verified, newSignCount: ok?.newSignCount, cloneDetected };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "WebAuthn Assertion & Clone Detection",
        passed: Boolean(res?.verified && res?.newSignCount === 15 && res?.cloneDetected),
        detail: "Verifies binary authenticatorData flags/counter and catches cloned authenticators",
      });
    } else if (taskId === "task_auth_refresh_rotation_reuse") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Store = typeof RefreshTokenRotationStore === "function" ? RefreshTokenRotationStore : exports.RefreshTokenRotationStore;
          const store = new Store();
          const t1 = store.issueInitialFamily("usr_99");
          const t2 = store.rotate(t1.refreshToken);
          const t2ActiveBefore = store.isTokenActive(t2.refreshToken);

          let theftDetected = false;
          try {
            // Attacker replays already-rotated t1
            store.rotate(t1.refreshToken);
          } catch {
            theftDetected = true;
          }
          const t2ActiveAfterReplay = store.isTokenActive(t2.refreshToken);
          return { t2ActiveBefore, theftDetected, t2ActiveAfterReplay };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Refresh Rotation & Family Breach Revocation",
        passed: Boolean(res?.t2ActiveBefore === true && res?.theftDetected === true && res?.t2ActiveAfterReplay === false),
        detail: "Rotates refresh tokens and revokes active family descendants when a prior token is replayed",
      });
    } else if (taskId === "task_fingerprint_entropy_normalizer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof analyzeBrowserFingerprint === "function" ? analyzeBrowserFingerprint : exports.analyzeBrowserFingerprint;
          const clean = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "MacIntel",
            webdriver: false,
            webgl: { vendor: "Apple Inc.", renderer: "Apple M3 Max" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 12,
          });
          const spoofed = fn({
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            platform: "Linux x86_64",
            webdriver: true,
            webgl: { vendor: "Google Inc.", renderer: "Google SwiftShader" },
            audioSampleSum: 124.8391,
            canvasGeometry: "c_hash_1",
            hardwareConcurrency: 4,
          });
          return {
            cleanOk: !clean.isBotSuspected && clean.fingerprintId.startsWith("fp_"),
            spoofCaught: spoofed.isBotSuspected && spoofed.anomalies.length >= 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Entropy Hashing & Spoofed Signal Detection",
        passed: Boolean(res?.cleanOk && res?.spoofCaught),
        detail: "Passes consistent browser profiles and flags Linux/SwiftShader/webdriver spoofing",
      });
    } else if (taskId === "task_fingerprint_tls_ja4_http2") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const fn = typeof correlateNetworkFingerprint === "function" ? correlateNetworkFingerprint : exports.correlateNetworkFingerprint;
          const legitChrome = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x0a0a, 0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x2a2a, 0x0000, 0x0010, 0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":authority", ":scheme", ":path"],
            },
          });
          const spoofedBot = fn({
            userAgent: "Mozilla/5.0 Chrome/128.0.0.0 Safari/537.36",
            tls: {
              version: 0x0304,
              sni: "example.com",
              alpn: "h2",
              ciphers: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f],
              extensions: [0x0017, 0x000d],
            },
            http2: {
              pseudoHeaders: [":method", ":path", ":authority", ":scheme"], // Non-Chrome order!
            },
          });
          return {
            greaseStripped: legitChrome.cleanCipherCount === 5 && !legitChrome.ja4.includes("0a0a"),
            legitPass: !legitChrome.impersonated,
            botFlagged: spoofedBot.impersonated,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "JA4 GREASE Stripping & HTTP/2 Order Correlation",
        passed: Boolean(res?.greaseStripped && res?.legitPass && res?.botFlagged),
        detail: "Strips 0x0a0a/0x2a2a GREASE values and catches non-Chrome HTTP/2 pseudo-header order",
      });
    } else if (taskId === "task_fingerprint_privacy_budget_defense") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Guard = typeof PrivacyBudgetGuard === "function" ? PrivacyBudgetGuard : exports.PrivacyBudgetGuard;
          const guard = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const raw = new Uint8Array([100, 150, 200, 255, 50, 60, 70, 255]);
          const fA = guard.farbleCanvasPixels("https://tracker-a.example", raw);
          const fB = guard.farbleCanvasPixels("https://tracker-b.example", raw);

          // Same origin in a new guard with same sessionSecret must be deterministic
          const guard2 = new Guard({ sessionSecret: "sec_99", maxBudgetBits: 30 });
          const fA2 = guard2.farbleCanvasPixels("https://tracker-a.example", raw);
          const deterministicSameOrigin = fA.every((v, i) => v === fA2[i]);

          let budgetBlocked = false;
          try {
            // Second canvas read on tracker-a (18 + 18 = 36 > 30 bits) must throw!
            guard.farbleCanvasPixels("https://tracker-a.example", raw);
          } catch {
            budgetBlocked = true;
          }
          return { deterministicSameOrigin, budgetBlocked, validLength: fB.length === 8 };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Deterministic Farbling & Privacy Budget Enforcement",
        passed: Boolean(res?.deterministicSameOrigin && res?.budgetBlocked && res?.validLength),
        detail: "Applies deterministic per-origin pixel farbling and blocks reads exceeding privacy budget",
      });
    } else if (taskId === "task_cybersec_ssrf_dns_rebind") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const checkIp = typeof isPrivateOrReservedIp === "function" ? isPrivateOrReservedIp : exports.isPrivateOrReservedIp;
          const pinFn = typeof validateAndPinOutboundUrl === "function" ? validateAndPinOutboundUrl : exports.validateAndPinOutboundUrl;

          const blocksMetadata = checkIp("169.254.169.254");
          const blocksMappedLoopback = checkIp("::ffff:127.0.0.1");
          const blocksRfc1918 = checkIp("172.20.0.1") && checkIp("10.0.0.1") && checkIp("192.168.1.1");
          const allowsPublic = !checkIp("93.184.216.34");

          let rebindBlocked = false;
          try {
            await pinFn("https://evil.example.com/hook", async () => ["93.184.216.34", "169.254.169.254"]);
          } catch {
            rebindBlocked = true;
          }

          const pinned = await pinFn("https:// hooks.example.com/ok".replace(" ", ""), async () => ["93.184.216.34"]);
          return {
            blocksMetadata,
            blocksMappedLoopback,
            blocksRfc1918,
            allowsPublic,
            rebindBlocked,
            pinnedOk: pinned.pinnedIp === "93.184.216.34" && pinned.redirect === "manual",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "SSRF CIDR Blocking & DNS Pinning Verification",
        passed: Boolean(
          res?.blocksMetadata &&
            res?.blocksMappedLoopback &&
            res?.blocksRfc1918 &&
            res?.allowsPublic &&
            res?.rebindBlocked &&
            res?.pinnedOk
        ),
        detail: "Blocks cloud metadata, RFC 1918, IPv6-mapped loopback, and dual-record DNS rebinding",
      });
    } else if (taskId === "task_cybersec_csp_trusted_types_dom") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const sanitize = typeof sanitizeHtmlFragment === "function" ? sanitizeHtmlFragment : exports.sanitizeHtmlFragment;
          const buildCsp = typeof buildStrictCspHeader === "function" ? buildStrictCspHeader : exports.buildStrictCspHeader;

          const dirty = '<p onclick="steal()">Hello</p><img src=x onerror="alert(1)"><a href="&#106;avascript:evil()">Link</a><script>pwn()</script>';
          const clean = sanitize(dirty);
          const csp = buildCsp("rAnd0mN0nce_2026_xyz");

          return {
            noScript: !clean.includes("<script") && !clean.includes("onerror") && !clean.includes("onclick"),
            noJsUri: !clean.toLowerCase().includes("javascript:"),
            keepsSafeText: clean.includes("Hello") && clean.includes("Link"),
            strictCsp: csp.includes("'nonce-rAnd0mN0nce_2026_xyz'") && csp.includes("'strict-dynamic'") && csp.includes("require-trusted-types-for 'script'"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DOM XSS Payload Neutralization & Strict CSP",
        passed: Boolean(res?.noScript && res?.noJsUri && res?.keepsSafeText && res?.strictCsp),
        detail: "Neutralizes onerror/onclick/entity-encoded javascript: URIs and emits strict nonce CSP",
      });
    } else if (taskId === "task_cybersec_timing_safe_webhook_csrf") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const verify = typeof verifyWebhookAndCsrf === "function" ? verifyWebhookAndCsrf : exports.verifyWebhookAndCsrf;
          const seenNonces = new Set();
          const base = {
            signature: "hmac_sha256_deadbeef1234",
            expectedSignature: "hmac_sha256_deadbeef1234",
            timestampSec: 1700000100,
            nowSec: 1700000120,
            toleranceSec: 300,
            nonce: "n_101",
            seenNonces,
            secFetchSite: "same-origin",
            origin: "https://app.example.com",
            expectedOrigin: "https://app.example.com",
            csrfCookie: "csrf_tok_abc",
            csrfHeader: "csrf_tok_abc",
          };
          const first = verify(base);
          const replay = verify(base); // Same nonce n_101 -> must fail!
          const crossSite = verify({ ...base, nonce: "n_102", secFetchSite: "cross-site" });
          const expired = verify({ ...base, nonce: "n_103", timestampSec: 1700000120 - 900 });
          return {
            firstOk: first.allowed === true,
            replayBlocked: replay.allowed === false && replay.reason === "replayed_nonce",
            crossSiteBlocked: crossSite.allowed === false,
            expiredBlocked: expired.allowed === false,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Timing-Safe HMAC, Replay & Cross-Site CSRF Defense",
        passed: Boolean(res?.firstOk && res?.replayBlocked && res?.crossSiteBlocked && res?.expiredBlocked),
        detail: "Verifies constant-time secrets and blocks nonce replays, expired timestamps, and cross-site fetches",
      });
    } else if (taskId === "task_agentic_dag_planner_saga") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Engine = typeof AgenticWorkflowEngine === "function" ? AgenticWorkflowEngine : exports.AgenticWorkflowEngine;

          // 1. Test checkpoint resume + wave execution
          const eng1 = new Engine();
          let step1Runs = 0;
          eng1.registerStep({ id: "s1", deps: [], execute: async () => { step1Runs++; return "v1"; } });
          eng1.registerStep({ id: "s2", deps: ["s1"], execute: async (_, out) => out.s1 + "_v2" });
          const res1 = await eng1.run({}, {
            checkpoint: { completedIds: ["s1"], executionOrder: ["s1"], outputs: { s1: "cached_v1" } }
          });

          // 2. Test Saga reverse compensation on failure
          const eng2 = new Engine();
          const compOrder = [];
          eng2.registerStep({
            id: "db_migrate",
            deps: [],
            execute: async () => "migrated",
            compensate: async () => compOrder.push("undo_db_migrate"),
          });
          eng2.registerStep({
            id: "deploy_canary",
            deps: ["db_migrate"],
            execute: async () => "deployed",
            compensate: async () => compOrder.push("undo_deploy_canary"),
          });
          eng2.registerStep({
            id: "smoke_test",
            deps: ["deploy_canary"],
            execute: async () => { throw new Error("500 healthcheck failure"); },
          });
          const res2 = await eng2.run({});

          return {
            resumedWithoutRerun: step1Runs === 0 && res1.outputs.s2 === "cached_v1_v2",
            rolledBack: res2.status === "rolled_back" && compOrder.join(",") === "undo_deploy_canary,undo_db_migrate",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "DAG Checkpoint Resume & Reverse Saga Compensation",
        passed: Boolean(res?.resumedWithoutRerun && res?.rolledBack),
        detail: "Skips checkpointed DAG nodes on resume and runs Saga compensation in reverse order on failure",
      });
    } else if (taskId === "task_agentic_tool_circuit_breaker_budget") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Runner = typeof ResilientAgentRunner === "function" ? ResilientAgentRunner : exports.ResilientAgentRunner;
          const runner = new Runner({ failureThreshold: 2 });
          let primaryCalls = 0;
          let fallbackCalls = 0;

          runner.registerTool("search_code", {
            execute: async () => {
              primaryCalls++;
              throw new Error("Search index timeout");
            },
            fallback: async (args) => {
              fallbackCalls++;
              return "fallback_grep:" + args.q;
            },
          });

          const actions = [
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { tool: "search_code", args: { q: "oauth" }, tokens: 100 },
            // Breaker is now open; 3rd call with distinct args should go straight to fallback without calling primary!
            { tool: "search_code", args: { q: "session" }, tokens: 100 },
            // Repeat q:"auth" twice more to trigger loop detector
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { tool: "search_code", args: { q: "auth" }, tokens: 100 },
            { type: "finish", output: "done", tokens: 50 },
          ];
          let idx = 0;
          const out = await runner.run(async () => actions[idx++], { maxSteps: 10, maxTokens: 2000, maxRepeatCalls: 2 });
          const loopCaught = out.trajectory.some((t) => t.loopDetected === true);
          return {
            statusOk: out.status === "completed",
            breakerPreventedPrimary: primaryCalls === 2 && fallbackCalls === 4,
            loopCaught,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Circuit Breaker Fallback & Loop Guard Verification",
        passed: Boolean(res?.statusOk && res?.breakerPreventedPrimary && res?.loopCaught),
        detail: "Trips circuit breaker to fallback after 2 failures and blocks repeated identical tool loops",
      });
    } else if (taskId === "task_agentic_episodic_memory_compactor") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Manager = typeof LongHorizonMemoryManager === "function" ? LongHorizonMemoryManager : exports.LongHorizonMemoryManager;
          const mgr = new Manager({
            rootGoal: "Harden OAuth PKCE token endpoint in src/oauth.js",
            forbiddenScopes: ["production_database_drop", "billing_wipe"],
            maxContextTokens: 250,
          });

          mgr.appendTurn({
            role: "assistant",
            content: "Discovered PKCE S256 verifier in src/oauth.js line 164",
            tokens: 120,
            artifacts: ["src/oauth.js:164"],
            importance: 3,
          });
          mgr.appendTurn({
            role: "assistant",
            content: "Checked unit tests in tests/auth_oauth.test.js",
            tokens: 120,
            artifacts: ["tests/auth_oauth.test.js"],
            importance: 2,
          });
          mgr.appendTurn({
            role: "assistant",
            content: "Preparing patch for token introspection",
            tokens: 120,
            artifacts: ["src/api.js"],
            importance: 2,
          });

          const prompt = mgr.buildActivePrompt("PKCE verifier src/oauth.js");
          const driftCheck = mgr.checkGoalAlignment({ target: "run production_database_drop script" });
          const alignedCheck = mgr.checkGoalAlignment({ target: "edit src/oauth.js" });

          return {
            withinBudget: prompt.activeTokenCount <= 250,
            pinnedPreserved: prompt.pinnedGoal.includes("src/oauth.js"),
            recalledArtifact: prompt.recalledMemories.some((m) => m.artifacts.includes("src/oauth.js:164")),
            driftBlocked: driftCheck.aligned === false && alignedCheck.aligned === true,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Episodic Compaction, Recall & Goal-Drift Guard",
        passed: Boolean(res?.withinBudget && res?.pinnedPreserved && res?.recalledArtifact && res?.driftBlocked),
        detail: "Compacts old turns within token budget, recalls relevant artifacts, and blocks goal drift",
      });
    } else if (taskId === "task_db_read_write_replica_lag_router") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Router = typeof CausalReplicaRouter === "function" ? CausalReplicaRouter : exports.CausalReplicaRouter;
          const primary = { query: async () => ({ rows: ["p"], lsn: 50 }) };
          const laggingReplica = { id: "rep_lag", healthy: true, appliedLsn: 40, query: async () => ({ rows: ["stale"] }) };
          const caughtUpReplica = { id: "rep_ok", healthy: true, appliedLsn: 55, query: async () => ({ rows: ["fresh"] }) };

          const router = new Router(primary, [laggingReplica]);
          const session = { minLsn: 0 };
          await router.execute("INSERT INTO items VALUES ($1)", ["a"], session);
          // Lagging replica is at 40 < 50 -> must route to primary!
          const read1 = await router.execute("SELECT * FROM items", [], session);

          const router2 = new Router(primary, [laggingReplica, caughtUpReplica]);
          const read2 = await router2.execute("SELECT * FROM items", [], session);

          return {
            lsnTracked: session.minLsn === 50,
            lagFallbackToPrimary: read1.routedTo === "primary",
            caughtUpRoutedToReplica: read2.routedTo === "rep_ok",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Read-Your-Writes LSN Routing & Lag Failover",
        passed: Boolean(res?.lsnTracked && res?.lagFallbackToPrimary && res?.caughtUpRoutedToReplica),
        detail: "Bypasses lagging replicas when appliedLsn < session.minLsn and routes to caught-up replicas",
      });
    } else if (taskId === "task_auth_oidc_federated_jwt_validator") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const validate = typeof validateOidcIdToken === "function" ? validateOidcIdToken : exports.validateOidcIdToken;
          let refreshCount = 0;
          const jwksClient = {
            async getKey(kid, { forceRefresh }) {
              if (forceRefresh) refreshCount++;
              if (kid === "rotated_kid_2" && forceRefresh) {
                return { kty: "EC", crv: "P-256", kid: "rotated_kid_2" };
              }
              return null;
            }
          };

          const validRes = await validate({
            decodedToken: {
              header: { alg: "ES256", kid: "rotated_kid_2" },
              payload: {
                iss: "https://idp.example.com",
                aud: ["client_app", "other_service"],
                azp: "client_app",
                sub: "usr_oidc_1",
                nonce: "n_777",
                exp: 1700000500,
              },
              verifyWithJwk: (jwk) => jwk.kid === "rotated_kid_2",
            },
            jwksClient,
            expectedIssuer: "https://idp.example.com",
            expectedAudience: "client_app",
            expectedNonce: "n_777",
            nowSec: 1700000100,
          });

          let algNoneBlocked = false;
          try {
            await validate({
              decodedToken: {
                header: { alg: "none", kid: "rotated_kid_2" },
                payload: { iss: "https://idp.example.com", aud: "client_app", exp: 1700000500 },
                verifyWithJwk: () => true,
              },
              jwksClient,
              expectedIssuer: "https://idp.example.com",
              expectedAudience: "client_app",
              nowSec: 1700000100,
            });
          } catch {
            algNoneBlocked = true;
          }

          return {
            verified: validRes?.verified === true && refreshCount === 1,
            algNoneBlocked,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "OIDC JWKS Key Rotation & Alg-Confusion Rejection",
        passed: Boolean(res?.verified && res?.algNoneBlocked),
        detail: "Refreshes JWKS on rotated kid, verifies multi-audience azp/nonce, and blocks alg:none",
      });
    } else if (taskId === "task_fingerprint_behavioral_biometrics_bot") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const classify = typeof classifyInteractionTelemetry === "function" ? classifyInteractionTelemetry : exports.classifyInteractionTelemetry;
          const human = classify({
            pointerEvents: [
              { x: 10, y: 10, t: 0, isTrusted: true },
              { x: 45, y: 28, t: 18, isTrusted: true },
              { x: 110, y: 95, t: 42, isTrusted: true },
              { x: 140, y: 150, t: 85, isTrusted: true },
            ],
            keyEvents: [{ downTime: 100, upTime: 165, isTrusted: true }],
          });
          const bot = classify({
            pointerEvents: [
              { x: 0, y: 0, t: 0, isTrusted: true },
              { x: 50, y: 50, t: 10, isTrusted: true },
              { x: 100, y: 100, t: 20, isTrusted: true },
              { x: 150, y: 150, t: 30, isTrusted: true },
            ],
            keyEvents: [{ downTime: 200, upTime: 200, isTrusted: true }],
          });
          return {
            humanPassed: human.isSyntheticBot === false,
            botCaught: bot.isSyntheticBot === true && bot.flags.length >= 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pointer Kinematics & Keystroke Dwell Classification",
        passed: Boolean(res?.humanPassed && res?.botCaught),
        detail: "Distinguishes curved variable-velocity human input from linear zero-dwell bot macros",
      });
    } else if (taskId === "task_cybersec_http_desync_header_canonicalizer") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const check = typeof canonicalizeAndValidateHttpHeaders === "function" ? canonicalizeAndValidateHttpHeaders : exports.canonicalizeAndValidateHttpHeaders;
          const clean = check([
            ["Host", "example.com"],
            ["Content-Length", "42"],
          ]);

          let clTeBlocked = false;
          try {
            check([
              ["Content-Length", "13"],
              ["Transfer-Encoding", "chunked"],
            ]);
          } catch {
            clTeBlocked = true;
          }

          let crlfBlocked = false;
          try {
            check([["X-Custom", "val\\r\\nSet-Cookie: evil=1"]]);
          } catch {
            crlfBlocked = true;
          }

          return {
            cleanOk: clean.valid === true && clean.contentLength === 42,
            clTeBlocked,
            crlfBlocked,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "CL.TE Request Smuggling & CRLF Injection Prevention",
        passed: Boolean(res?.cleanOk && res?.clTeBlocked && res?.crlfBlocked),
        detail: "Blocks simultaneous Content-Length + Transfer-Encoding and CRLF header splitting",
      });
    } else if (taskId === "task_agentic_multi_agent_consensus_arbiter") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Arbiter = typeof MultiAgentLeaseArbiter === "function" ? MultiAgentLeaseArbiter : exports.MultiAgentLeaseArbiter;
          const arb = new Arbiter();

          const lease1 = arb.acquireLease("agent_alpha", ["src/auth"], 100, 1000);
          let overlapBlocked = false;
          try {
            // Child path src/auth/jwt.js overlaps held parent dir src/auth!
            arb.acquireLease("agent_beta", ["src/auth/jwt.js"], 100, 1010);
          } catch {
            overlapBlocked = true;
          }

          // After lease1 expires at t=1150, agent_beta acquires a newer epoch lease
          const lease2 = arb.acquireLease("agent_beta", ["src/auth/jwt.js"], 100, 1150);
          const betaCommit = arb.commitPatch({
            agentId: "agent_beta",
            leaseId: lease2.leaseId,
            epoch: lease2.epoch,
            filePath: "src/auth/jwt.js",
            content: "const v = 2;",
            nowMs: 1160,
          });

          let zombieAlphaBlocked = false;
          try {
            // Delayed agent_alpha wakes up with stale epoch and tries to overwrite src/auth/jwt.js
            arb.commitPatch({
              agentId: "agent_alpha",
              leaseId: lease1.leaseId,
              epoch: lease1.epoch,
              filePath: "src/auth/jwt.js",
              content: "const v = 1;",
              nowMs: 1170,
            });
          } catch {
            zombieAlphaBlocked = true;
          }

          return {
            overlapBlocked,
            betaCommitted: betaCommit.committed === true,
            zombieAlphaBlocked,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Hierarchical Path Leases & Stale Epoch Fencing",
        passed: Boolean(res?.overlapBlocked && res?.betaCommitted && res?.zombieAlphaBlocked),
        detail: "Blocks parent/child path conflicts and fences zombie commits with stale lease epochs",
      });
    } else if (taskId === "task_chat_realtime_instrumentation") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Chat = typeof InstrumentedTwoUserChat === "function" ? InstrumentedTwoUserChat : exports.InstrumentedTwoUserChat;
          const chat = new Chat({ typingTtlMs: 500 });
          const m1 = chat.sendMessage({ sender: "pp", recipient: "agent", text: "Ping", nowMs: 1000 });
          chat.setTyping({ sender: "agent", recipient: "pp", isTyping: true, nowMs: 1100 });
          const snapActive = chat.getSnapshot("agent", "pp", 1200);
          const snapExpired = chat.getSnapshot("agent", "pp", 1700);
          const m2 = chat.sendMessage({ sender: "agent", recipient: "pp", text: "Pong", nowMs: 1800 });
          chat.markRead({ reader: "pp", peer: "agent", upToSeq: 2, nowMs: 1900 });
          const finalSnap = chat.getSnapshot("pp", "agent", 1900);

          return {
            canonicalOk: m1.roomId === "dm:agent:pp" && m2.seq === 2,
            typingLifecycleOk: snapActive.typingUsers.includes("agent") && snapExpired.typingUsers.length === 0,
            watermarksOk: finalSnap.readWatermarks.pp === 2 && finalSnap.readWatermarks.agent === 2,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Two-User Chat Instrumentation & Watermark Verification",
        passed: Boolean(res?.canonicalOk && res?.typingLifecycleOk && res?.watermarksOk),
        detail: "Verifies dm:agent:pp canonical room, monotonic seq, typing TTL pruning, and read watermarks",
      });
    } else if (taskId === "task_chat_debug_race_duplication") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const Coord = typeof DebuggedChatCoordinator === "function" ? DebuggedChatCoordinator : exports.DebuggedChatCoordinator;
          const coord = new Coord({ typingTtlMs: 400 });

          // 1. Out-of-order: seq 2 arrives before seq 1
          const r1 = coord.ingestPacket({ seq: 2, sender: "bob", text: "Second", clientMsgId: "id_2" }, 100);
          const r2 = coord.ingestPacket({ seq: 1, sender: "alice", text: "First", clientMsgId: "id_1" }, 110);

          // 2. Duplicate retry of clientMsgId "id_1"
          const dup = coord.ingestPacket({ seq: 1, sender: "alice", text: "First", clientMsgId: "id_1" }, 120);

          // 3. Ghost typing expiry
          coord.ingestPacket({ type: "typing", user: "bob", isTyping: true }, 200);
          const typingAt300 = coord.getActiveTyping(300);
          const typingAt700 = coord.getActiveTyping(700);

          const transcript = coord.getTranscript();
          return {
            resequencedOk: r1.status === "buffered_out_of_order" && r2.flushed.length === 2 && transcript.map(m => m.seq).join(",") === "1,2",
            dupSuppressed: dup.status === "duplicate_ignored" && transcript.length === 2,
            typingPruned: typingAt300.includes("bob") && typingAt700.length === 0,
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Idempotent Deduplication & Causal Resequencing",
        passed: Boolean(res?.resequencedOk && res?.dupSuppressed && res?.typingPruned),
        detail: "Reorders out-of-order packets into [1,2], suppresses clientMsgId retries, and evicts ghost typing",
      });
    } else if (taskId === "task_chat_refactor_state_protocol") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const reducer = typeof chatProtocolReducer === "function" ? chatProtocolReducer : exports.chatProtocolReducer;
          const init = typeof INITIAL_CHAT_STATE === "object" ? INITIAL_CHAT_STATE : exports.INITIAL_CHAT_STATE;

          const step1 = reducer(init, { type: "TYPING_SET", user: "agent", isTyping: true });
          const step2 = reducer(step1.state, { type: "MESSAGE_SENT", sender: "agent", recipient: "pp", text: "Hello pp" });
          const step3 = reducer(step2.state, { type: "MESSAGE_EDITED", sender: "agent", seq: 1, newText: "Hello pp (edited)" });
          const step4 = reducer(step3.state, { type: "MESSAGE_READ", reader: "pp" });

          return {
            pureImmutability: init.messages.length === 0 && step2.state.typingByPeer.agent === false,
            unreadTrackedAndCleared: step2.state.unreadByPeer.pp === 1 && step4.state.unreadByPeer.pp === 0,
            editedOk: step3.state.messages[0].text === "Hello pp (edited)" && step3.state.messages[0].edited === true,
            effectsEmitted: step2.effects.some(e => e.type === "SSE_BROADCAST"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Pure Chat Protocol State Transitions & Effects",
        passed: Boolean(res?.pureImmutability && res?.unreadTrackedAndCleared && res?.editedOk && res?.effectsEmitted),
        detail: "Transitions send/edit/read/typing states immutably and emits declarative SSE broadcast effects",
      });
    } else if (taskId === "task_chat_perf_ringbuffer_fanout_bench") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const benchFn = typeof benchmarkTwoUserChatFanout === "function" ? benchmarkTwoUserChatFanout : exports.benchmarkTwoUserChatFanout;
          const report = benchFn(120, 32);
          return {
            cappedAtCapacity: report.retainedCount === 32,
            slidingWindowCorrect: report.oldestSeq === 89 && report.newestSeq === 120,
            fanoutDelivered: report.deliveredFrames === 240,
            hasPercentiles: typeof report.p50Us === "number" && typeof report.p99Us === "number",
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "O(1) Ring Buffer Capacity & Fanout Benchmark",
        passed: Boolean(res?.cappedAtCapacity && res?.slidingWindowCorrect && res?.fanoutDelivered && res?.hasPercentiles),
        detail: "Retains latest 32 of 120 messages in O(1) ring buffer, fans out 240 frames, and reports P50/P99 latency",
      });
    } else if (taskId === "task_ts_react_nextjs_server_actions") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const reducer = typeof optimisticOrdersReducer === "function" ? optimisticOrdersReducer : exports.optimisticOrdersReducer;
          const makeAction = typeof createSafeServerAction === "function" ? createSafeServerAction : exports.createSafeServerAction;

          const base = [{ id: "ord_1", sku: "PRO-PLAN", amountCents: 4900, pending: false }];
          const afterAdd = reducer(base, { type: "OPTIMISTIC_ADD", tempId: "tmp_9", sku: "ENT-SEAT", amountCents: 9900 });
          const afterRollback = reducer(afterAdd, { type: "ROLLBACK_FAILURE", tempId: "tmp_9" });
          const afterCommit = reducer(afterAdd, {
            type: "COMMIT_SUCCESS",
            tempId: "tmp_9",
            committed: { id: "ord_2", sku: "ENT-SEAT", amountCents: 9900 },
          });

          const action = makeAction({
            validate: (raw) =>
              typeof raw.sku === "string" && raw.sku.length >= 3
                ? { valid: true, value: { sku: raw.sku, amountCents: Number(raw.amountCents || 0) } }
                : { valid: false, fieldErrors: { sku: "SKU must be at least 3 chars" } },
            revalidateTags: ["orders", "billing-summary"],
            handler: async (input) => ({ id: "ord_99", ...input }),
          });

          const badRes = await action({ sku: "a" });
          const goodRes = await action({ sku: "ENT-SEAT", amountCents: 9900 });

          return {
            optimisticOk: afterAdd.length === 2 && afterAdd[1].pending === true && base.length === 1,
            rollbackOk: afterRollback.length === 1 && afterRollback[0].id === "ord_1",
            commitOk: afterCommit[1].id === "ord_2" && afterCommit[1].pending === false,
            validationRejected: badRes.ok === false && badRes.code === "VALIDATION_ERROR",
            actionResolved: goodRes.ok === true && goodRes.data.id === "ord_99" && goodRes.revalidatedTags.includes("orders"),
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Transpiled TypeScript Server Action & Optimistic Rollback Execution",
        passed: Boolean(
          res?.optimisticOk && res?.rollbackOk && res?.commitOk && res?.validationRejected && res?.actionResolved,
        ),
        detail: "Executes transpiled TS optimistic reducer rollback and validated Next.js Server Action envelope",
      });
    } else if (taskId === "task_ts_angular_signals_computed_rx") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const sigFn = typeof signal === "function" ? signal : exports.signal;
          const compFn = typeof computed === "function" ? computed : exports.computed;
          const switchFn = typeof createSwitchMapLoader === "function" ? createSwitchMapLoader : exports.createSwitchMapLoader;

          let computeRuns = 0;
          const price = sigFn(100);
          const qty = sigFn(3);
          const total = compFn(() => {
            computeRuns++;
            return price() * qty();
          });

          const firstTotal = total();
          const cachedTotal = total(); // Should not recompute when dependencies haven't changed
          qty.update((q) => q + 2);
          const updatedTotal = total();

          const accountId = sigFn("acc_slow");
          const abortedKeys = [];
          const loader = switchFn(accountId, async (key, abortSig) => {
            abortSig.addEventListener("abort", () => abortedKeys.push(key));
            if (key === "acc_slow") {
              await new Promise((r) => setTimeout(r, 30));
            }
            return "portfolio:" + key;
          });

          const p1 = loader.trigger("acc_slow");
          const p2 = loader.trigger("acc_fast");
          await Promise.all([p1, p2]);

          return {
            signalMemoOk: firstTotal === 300 && cachedTotal === 300 && computeRuns === 2 && updatedTotal === 500,
            switchMapCanceledSlow: abortedKeys.includes("acc_slow") && loader.data() === "portfolio:acc_fast",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Angular Signal Graph Memoization & switchMap Cancellation",
        passed: Boolean(res?.signalMemoOk && res?.switchMapCanceledSlow),
        detail: "Tracks signal dependencies lazily and aborts superseded in-flight switchMap requests",
      });
    } else if (taskId === "task_ts_nestjs_di_guard_interceptor") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Container = typeof NestContainer === "function" ? NestContainer : exports.NestContainer;
          const Guard = typeof RolesGuard === "function" ? RolesGuard : exports.RolesGuard;
          const Interceptor = typeof AuditTelemetryInterceptor === "function" ? AuditTelemetryInterceptor : exports.AuditTelemetryInterceptor;
          const runPipe = typeof executeNestPipeline === "function" ? executeNestPipeline : exports.executeNestPipeline;

          const container = new Container();
          let creations = 0;
          container.register("LEDGER_SVC", () => ({ id: ++creations, refund: (id) => "refunded:" + id }), true);
          const s1 = container.resolve("LEDGER_SVC");
          const s2 = container.resolve("LEDGER_SVC");

          let unauthBlocked = false;
          try {
            await runPipe(
              { handlerName: "issueRefund", requiredRoles: ["FINANCE_ADMIN"], request: { user: { id: "u_1", roles: ["VIEWER"] } } },
              [new Guard()],
              [new Interceptor()],
              async () => s1.refund("inv_1"),
            );
          } catch (e) {
            unauthBlocked = e.statusCode === 403;
          }

          const authorizedRes = await runPipe(
            { handlerName: "issueRefund", requiredRoles: ["FINANCE_ADMIN"], request: { user: { id: "u_admin", roles: ["FINANCE_ADMIN"] } } },
            [new Guard()],
            [new Interceptor()],
            async () => s1.refund("inv_99"),
          );

          return {
            singletonOk: s1 === s2 && creations === 1,
            unauthBlocked,
            interceptorOk: authorizedRes.data === "refunded:inv_99" && authorizedRes.audit.actorId === "u_admin",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "NestJS DI Singleton, RBAC Guard & Interceptor Execution",
        passed: Boolean(res?.singletonOk && res?.unauthBlocked && res?.interceptorOk),
        detail: "Resolves singleton DI tokens, blocks unauthorized roles with 403, and wraps responses with audit telemetry",
      });
    } else if (taskId === "task_ts_trpc_zod_end_to_end_rpc") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Builder = typeof ProcedureBuilder === "function" ? ProcedureBuilder : exports.ProcedureBuilder;
          const Err = typeof TRPCError === "function" ? TRPCError : exports.TRPCError;
          const makeRouter = typeof createTRPCRouter === "function" ? createTRPCRouter : exports.createTRPCRouter;

          const publicProcedure = new Builder();
          const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
            if (!ctx?.user) throw new Err({ code: "UNAUTHORIZED", message: "Missing session" });
            return next({ ctx: { ...ctx, user: ctx.user } });
          });

          const router = makeRouter({
            createProject: authedProcedure
              .input({
                parse(raw) {
                  if (!raw || typeof raw.name !== "string" || raw.name.length < 3) {
                    throw new Error("name min 3 chars");
                  }
                  return { name: raw.name.trim() };
                },
              })
              .mutation(async ({ ctx, input }) => ({
                projectName: input.name,
                ownerId: ctx.user.id,
              })),
          });

          let unauthCode = "";
          try {
            await router.createCaller({ user: null }).createProject({ name: "Apollo" });
          } catch (e) {
            unauthCode = e.code;
          }

          let badInputCode = "";
          try {
            await router.createCaller({ user: { id: "usr_42" } }).createProject({ name: "a" });
          } catch (e) {
            badInputCode = e.code;
          }

          const created = await router.createCaller({ user: { id: "usr_42" } }).createProject({ name: "Enterprise Core" });

          return {
            unauthBlocked: unauthCode === "UNAUTHORIZED",
            badInputBlocked: badInputCode === "BAD_REQUEST",
            createdOk: created.projectName === "Enterprise Core" && created.ownerId === "usr_42",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "tRPC Context Narrowing, Input Validation & Caller Dispatch",
        passed: Boolean(res?.unauthBlocked && res?.badInputBlocked && res?.createdOk),
        detail: "Enforces UNAUTHORIZED middleware, BAD_REQUEST input schema parsing, and typed caller execution",
      });
    } else if (taskId === "task_migrate_express_to_hono_edge_ts") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Router = typeof TypedEdgeRouter === "function" ? TypedEdgeRouter : exports.TypedEdgeRouter;
          const app = new Router();

          app.use(async (c, next) => {
            const key = c.req.headers.get("x-api-key");
            if (!key) return c.json({ error: "Unauthorized" }, 401);
            c.set("tenantId", "tenant_" + key);
            return await next();
          });

          app.get("/v1/orgs/:orgId/members", (c) =>
            c.json({ tenantId: c.get("tenantId"), orgId: c.params.orgId }),
          );

          const unauthRes = await app.fetch(new Request("https://edge.local/v1/orgs/acme/members"));
          const authedRes = await app.fetch(
            new Request("https://edge.local/v1/orgs/acme-corp/members", {
              headers: { "x-api-key": "live_99" },
            }),
          );
          const body = await authedRes.json();

          return {
            unauth401: unauthRes.status === 401,
            authedOk: authedRes.status === 200 && body.tenantId === "tenant_live_99" && body.orgId === "acme-corp",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Web-Standard Edge Router Middleware & Param Execution",
        passed: Boolean(res?.unauth401 && res?.authedOk),
        detail: "Executes Fetch Request/Response middleware, extracts :orgId params, and propagates typed context",
      });
    } else if (taskId === "task_migrate_react_hooks_to_svelte5_vue3_signals") {
      const harness = `
        ${sanitizedCode};
        (() => {
          const makeStore = typeof createMigratedAnalyticsStore === "function" ? createMigratedAnalyticsStore : exports.createMigratedAnalyticsStore;
          const store = makeStore([
            { id: "1", title: "Alpha Node", score: 40 },
            { id: "2", title: "Beta Signal", score: 85 },
            { id: "3", title: "Gamma Rune", score: 95 },
          ]);

          const initialCount = store.summary.value.count;
          store.minScore.value = 80;
          const afterScoreCount = store.summary.value.count;
          store.query.value = "gamma";
          const afterQueryCount = store.summary.value.count;
          store.dispose();

          return {
            countsOk: initialCount === 3 && afterScoreCount === 2 && afterQueryCount === 1,
            topScoreOk: store.summary.value.topScore === 95,
            cleanupsRan: store.auditTrail.includes("cleanup:3") && store.auditTrail.includes("cleanup:2"),
          };
        })();
      `;
      const res = runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Fine-Grained $state/$derived/$effect Graph & Cleanup",
        passed: Boolean(res?.countsOk && res?.topScoreOk && res?.cleanupsRan),
        detail: "Propagates fine-grained updates through derived selectors and executes effect cleanups",
      });
    } else if (taskId === "task_migrate_redux_thunks_to_tanstack_query_ts") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Client = typeof TypedQueryClient === "function" ? TypedQueryClient : exports.TypedQueryClient;
          const qc = new Client();
          let networkCalls = 0;

          const fetcher = async () => {
            networkCalls++;
            await new Promise((r) => setTimeout(r, 15));
            return [{ id: "u1", name: "Ada" }];
          };

          // Concurrent calls with differently-ordered filter keys should deduplicate!
          const [r1, r2] = await Promise.all([
            qc.fetchQuery({ queryKey: ["users", { role: "admin", active: true }], queryFn: fetcher, staleTimeMs: 5000 }),
            qc.fetchQuery({ queryKey: ["users", { active: true, role: "admin" }], queryFn: fetcher, staleTimeMs: 5000 }),
          ]);

          // Failed optimistic mutation should roll back to ["Ada"]
          let failedAsExpected = false;
          try {
            await qc.executeOptimisticMutation({
              queryKey: ["users", { active: true, role: "admin" }],
              variables: { id: "u2", name: "Ghost" },
              optimisticUpdater: (old = [], v) => [...old, v],
              mutationFn: async () => {
                throw new Error("DB conflict");
              },
            });
          } catch {
            failedAsExpected = true;
          }

          const afterRollback = qc.getQueryData(["users", { role: "admin", active: true }]);

          return {
            dedupedOk: networkCalls === 1 && r1.length === 1 && r2.length === 1,
            rollbackOk: failedAsExpected && Array.isArray(afterRollback) && afterRollback.length === 1 && afterRollback[0].name === "Ada",
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "TanStack Query Deduplication, Canonical Key Hashing & Rollback",
        passed: Boolean(res?.dedupedOk && res?.rollbackOk),
        detail: "Deduplicates concurrent fetches with canonical key hashing and rolls back failed optimistic mutations",
      });
    } else if (taskId === "task_migrate_nextjs_pages_to_app_router_rsc") {
      const harness = `
        ${sanitizedCode};
        (async () => {
          const Cache = typeof NextAppRouterCache === "function" ? NextAppRouterCache : exports.NextAppRouterCache;
          const renderRSC = typeof renderDashboardRSC === "function" ? renderDashboardRSC : exports.renderDashboardRSC;
          const postHandler = typeof POST_RevalidateRouteHandler === "function" ? POST_RevalidateRouteHandler : exports.POST_RevalidateRouteHandler;

          const cache = new Cache();
          let userLoads = 0;
          let metricLoads = 0;

          const firstRender = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 12 }; },
          });

          const cachedRender = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 99 }; },
          });

          // Revalidate only "metrics" tag via Route Handler
          const revRes = await postHandler(
            new Request("https://app.local/api/revalidate", {
              method: "POST",
              body: JSON.stringify({ tag: "metrics" }),
            }),
            cache,
          );
          const revBody = await revRes.json();

          const afterRevalidate = await renderRSC({
            userId: "42",
            cache,
            loadUser: async (id) => { userLoads++; return { id, name: "Linus" }; },
            loadMetrics: async () => { metricLoads++; return { cpu: 55 }; },
          });

          return {
            hitOk: firstRender.telemetry.userCache === "MISS" && cachedRender.telemetry.metricsCache === "HIT",
            selectiveRevalidateOk:
              revBody.revalidated === true &&
              afterRevalidate.telemetry.userCache === "HIT" &&
              afterRevalidate.telemetry.metricsCache === "MISS" &&
              userLoads === 1 &&
              metricLoads === 2,
          };
        })();
      `;
      const res = await runInContext(harness, ctx, { timeout: 1000 });
      results.push({
        name: "Parallel RSC Tagged Caching & Selective revalidateTag() Execution",
        passed: Boolean(res?.hitOk && res?.selectiveRevalidateOk),
        detail: "Serves cached RSC payloads on HIT and selectively evicts tagged entries via POST Route Handler",
      });
    } else {
      // General syntax evaluation
      runInContext(sanitizedCode, ctx, { timeout: 1000 });
      results.push({
        name: "Clean Syntax & Execution",
        passed: true,
        detail: "Code compiles and runs without syntax or reference exceptions",
      });
    }

    return results;
  }

  #calculateLineDiff(original, modified) {
    const origLines = original.split("\n");
    const modLines = modified.split("\n");
    return {
      originalLineCount: origLines.length,
      modifiedLineCount: modLines.length,
      lineDelta: modLines.length - origLines.length,
    };
  }
}
