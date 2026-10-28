/**
 * Agentic Curriculum: 1M Tasks — Refactoring Suite.
 * Pre-seeded high-signal refactoring challenges designed for agent-agnostic training.
 */

export const REFACTORING_CURRICULUM_TASKS = [
  {
    id: "task_refactor_async_pipeline",
    title: "Refactor Nested Callback Hell to Modern Async/Await Pipeline",
    category: "async",
    difficulty: "intermediate",
    tags: ["refactor", "async", "promises", "clean-code"],
    instructions:
      "Transform the legacy pyramid of doom callback style into a clean, readable async/await flow with structured try/catch error propagation and promise cancellation handling.",
    starterCode: `// Legacy Callback Hell\nfunction processUserData(userId, callback) {\n  fetchUser(userId, function(err, user) {\n    if (err) return callback(err);\n    fetchUserPreferences(user.id, function(err, prefs) {\n      if (err) return callback(err);\n      fetchRecentActivity(user.id, function(err, activity) {\n        if (err) return callback(err);\n        calculateScore(activity, prefs, function(err, score) {\n          if (err) return callback(err);\n          callback(null, { user, prefs, activity, score });\n        });\n      });\n    });\n  });\n}`,
    solutionCode: `// Clean Async/Await Pipeline with Concurrent Fetching\nasync function processUserData(userId) {\n  const user = await fetchUser(userId);\n  const [prefs, activity] = await Promise.all([\n    fetchUserPreferences(user.id),\n    fetchRecentActivity(user.id)\n  ]);\n  const score = await calculateScore(activity, prefs);\n  return { user, prefs, activity, score };\n}`,
    criteria: [
      "Eliminates nested callback pyramid",
      "Performs independent fetches in parallel using Promise.all",
      "Uses idiomatic async/await syntax",
      "Properly bubbles or handles errors through standard Promise rejections",
    ],
  },
  {
    id: "task_refactor_event_leak",
    title: "Eliminate DOM Memory Leaks in EventListener Subscriptions",
    category: "performance",
    difficulty: "intermediate",
    tags: ["refactor", "performance", "memory", "dom"],
    instructions:
      "The component repeatedly attaches resize and scroll event listeners on window without tracking or removing them, causing unbounded memory growth during view transitions. Refactor using an AbortController signal or explicit dispose pattern.",
    starterCode: `// Memory Leak: Unbounded Listener Accumulation\nclass VisualizerWidget {\n  constructor(element) {\n    this.el = element;\n    this.attach();\n  }\n  attach() {\n    window.addEventListener("resize", () => {\n      this.render();\n    });\n    window.addEventListener("scroll", () => {\n      this.updateViewport();\n    });\n  }\n  render() { this.el.innerText = window.innerWidth; }\n  updateViewport() { /* ... */ }\n}`,
    solutionCode: `// Memory-Safe: AbortController Signal Cleanup\nclass VisualizerWidget {\n  #controller = new AbortController();\n  constructor(element) {\n    this.el = element;\n    this.attach();\n  }\n  attach() {\n    const { signal } = this.#controller;\n    window.addEventListener("resize", () => this.render(), { signal });\n    window.addEventListener("scroll", () => this.updateViewport(), { signal });\n  }\n  render() { this.el.innerText = window.innerWidth; }\n  updateViewport() { /* ... */ }\n  destroy() {\n    this.#controller.abort();\n  }\n}`,
    criteria: [
      "Encapsulates lifecycle with an explicit destroy/dispose method",
      "Uses AbortController or removeEventListener with stable references",
      "Prevents detached DOM tree leaks across re-renders",
    ],
  },
  {
    id: "task_refactor_o_n2_lookup",
    title: "Optimize O(N²) Nested Filter Loop to O(N) Indexed Map Lookup",
    category: "performance",
    difficulty: "beginner",
    tags: ["refactor", "algorithms", "performance", "optimization"],
    instructions:
      "A reconciliation step pairs items from two 50,000 element lists by nested search array.find(). The O(N²) time complexity causes 12-second UI freezes. Refactor to an indexed Map lookup running in linear O(N) time.",
    starterCode: `// O(N^2) Performance Bottleneck\nfunction reconcileTransactions(orders, payments) {\n  return orders.map(order => {\n    const match = payments.find(p => p.orderId === order.id);\n    return {\n      ...order,\n      isPaid: Boolean(match),\n      paymentReference: match ? match.txHash : null\n    };\n  });\n}`,
    solutionCode: `// O(N) Optimized Indexed Map Reconciliation\nfunction reconcileTransactions(orders, payments) {\n  const paymentMap = new Map();\n  for (const payment of payments) {\n    paymentMap.set(payment.orderId, payment);\n  }\n  return orders.map(order => {\n    const match = paymentMap.get(order.id);\n    return {\n      ...order,\n      isPaid: Boolean(match),\n      paymentReference: match ? match.txHash : null\n    };\n  });\n}`,
    criteria: [
      "Replaces nested find with Map pre-indexing",
      "Reduces computational complexity from O(N*M) to O(N+M)",
      "Preserves identical return structure and edge-case behavior",
    ],
  },
  {
    id: "task_refactor_css_grid",
    title: "Migrate Legacy Float Layout to Modern Monochrome Flexbox & CSS Grid",
    category: "css",
    difficulty: "beginner",
    tags: ["refactor", "css", "layout", "monochrome", "modern-web"],
    instructions:
      "Modernize legacy float: left and clearfix CSS hacks into a responsive CSS Grid with monochrome semantic tokens and clamp-based fluid spacing.",
    starterCode: `/* Legacy CSS with float hacks */\n.task-board {\n  width: 100%;\n}\n.task-board:after {\n  content: "";\n  display: table;\n  clear: both;\n}\n.board-column {\n  float: left;\n  width: 33.333%;\n  box-sizing: border-box;\n  padding: 10px;\n}`,
    solutionCode: `/* Modern CSS Grid Layout with Semantic Tokens */\n.task-board {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));\n  gap: clamp(1rem, 2vw, 2rem);\n  width: 100%;\n}\n.board-column {\n  display: flex;\n  flex-direction: column;\n  padding: 1rem;\n  border: 1px solid var(--line);\n  border-radius: var(--radius);\n}`,
    criteria: [
      "Eliminates clearfix hacks and CSS floats",
      "Uses responsive CSS Grid with auto-fit and minmax",
      "Leverages CSS variables for clean monochrome styling",
    ],
  },
  {
    id: "task_refactor_input_sanitization",
    title: "Harden Input Sanitization against Prototype Pollution & ReDoS",
    category: "security",
    difficulty: "advanced",
    tags: ["refactor", "security", "hardening", "prototype-pollution", "redos"],
    instructions:
      "Deep object merge utility allows object prototype pollution (__proto__, constructor) and uses an evil exponential regular expression that can crash the server via ReDoS. Refactor with strict key validation and bounded non-backtracking parsing.",
    starterCode: `// Vulnerable to Prototype Pollution & ReDoS\nfunction mergeConfig(target, source) {\n  for (let key in source) {\n    if (typeof source[key] === 'object' && source[key] !== null) {\n      if (!target[key]) target[key] = {};\n      mergeConfig(target[key], source[key]);\n    } else {\n      target[key] = source[key];\n    }\n  }\n  return target;\n}\nconst EMAIL_REGEX = /^([a-zA-Z0-9_\\.-]+)+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$/;`,
    solutionCode: `// Hardened Deep Merge with Prototype Guard & Linear Regex\nconst SAFE_KEY_REGEX = /^[a-zA-Z0-9_.-]{1,64}$/;\nconst EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\n\nfunction mergeConfig(target, source) {\n  if (!source || typeof source !== 'object') return target;\n  for (const key of Object.keys(source)) {\n    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;\n    const val = source[key];\n    if (val && typeof val === 'object' && !Array.isArray(val)) {\n      if (!target[key] || typeof target[key] !== 'object') target[key] = Object.create(null);\n      mergeConfig(target[key], val);\n    } else {\n      target[key] = val;\n    }\n  }\n  return target;\n}`,
    criteria: [
      "Blocks __proto__, constructor, and prototype overrides",
      "Uses linear non-nested regex to eliminate catastrophic backtracking",
      "Operates safely on plain objects",
    ],
  },
  {
    id: "task_refactor_reducer_state",
    title: "Extract Pure Reducer Pattern from God Object Component",
    category: "architecture",
    difficulty: "intermediate",
    tags: ["refactor", "architecture", "state-machine", "clean-code"],
    instructions:
      "A massive stateful class mutates 18 boolean flags across 30 asynchronous event handlers. Refactor the core transitions into an immutable, pure state reducer that is 100% unit-testable without mock DOM.",
    starterCode: `// Tangled Stateful Mutation\nclass TaskUIManager {\n  handleAction(action, payload) {\n    if (action === 'TOGGLE') {\n      this.tasks.find(t => t.id === payload.id).done = !this.tasks.find(t => t.id === payload.id).done;\n      this.selectedCount = this.tasks.filter(t => t.done).length;\n      this.refreshUI();\n    } else if (action === 'FILTER') {\n      this.currentFilter = payload.filter;\n      this.refreshUI();\n    }\n  }\n}`,
    solutionCode: `// Pure Immutable Reducer with Deterministic Transitions\nexport function taskReducer(state, action) {\n  switch (action.type) {\n    case 'TASK_TOGGLED': {\n      const tasks = state.tasks.map(t =>\n        t.id === action.id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null } : t\n      );\n      return { ...state, tasks };\n    }\n    case 'FILTER_CHANGED': {\n      return { ...state, filter: action.filter, cursor: -1 };\n    }\n    case 'TASK_ADDED': {\n      return { ...state, tasks: [...state.tasks, action.task] };\n    }\n    default:\n      return state;\n  }\n}`,
    criteria: [
      "Replaces in-place mutations with immutable object returns",
      "Decouples UI side-effects from pure state calculations",
      "Enables pure unit testing without browser DOM dependencies",
    ],
  },
  {
    id: "task_refactor_buffer_alloc",
    title: "Zero-Allocation Stream Chunking with Typed Uint8Array Buffers",
    category: "performance",
    difficulty: "advanced",
    tags: ["refactor", "performance", "buffers", "streams", "low-allocation"],
    instructions:
      "A high-throughput telemetry ingestion pipeline repeatedly allocates and concatenates UTF-8 strings in a hot loop, triggering massive V8 garbage collection pauses. Refactor to a pre-allocated Uint8Array ring buffer with subarray slicing.",
    starterCode: `// Heavy GC Pressure: Unbounded String Concatenation in Hot Loop
function processTelemetryStream(chunks) {
  let accumulated = "";
  for (const chunk of chunks) {
    accumulated += chunk.toString("utf8");
    if (accumulated.includes("\\n")) {
      const lines = accumulated.split("\\n");
      accumulated = lines.pop();
      for (const line of lines) {
        dispatchPacket(line);
      }
    }
  }
}`,
    solutionCode: `// Zero-Allocation Uint8Array Ring Buffer with Offset Pointers
function processTelemetryStream(chunks) {
  const NEWLINE = 10; // 0x0A
  let buffer = new Uint8Array(65536);
  let length = 0;

  for (const chunk of chunks) {
    if (length + chunk.byteLength > buffer.byteLength) {
      const expanded = new Uint8Array(Math.max(buffer.byteLength * 2, length + chunk.byteLength));
      expanded.set(buffer.subarray(0, length));
      buffer = expanded;
    }
    buffer.set(chunk, length);
    length += chunk.byteLength;

    let start = 0;
    for (let i = 0; i < length; i++) {
      if (buffer[i] === NEWLINE) {
        dispatchPacket(buffer.subarray(start, i));
        start = i + 1;
      }
    }
    if (start > 0) {
      buffer.copyWithin(0, start, length);
      length -= start;
    }
  }
}`,
    criteria: [
      "Uses typed Uint8Arrays instead of raw string concatenation",
      "Eliminates intermediate split array allocations",
      "Maintains ring/sliding buffer with copyWithin or subarray offsets",
    ],
  },
  {
    id: "task_refactor_middleware_pipeline",
    title: "Refactor Monolithic Request Handler into Onion Middleware Pipeline",
    category: "architecture",
    difficulty: "intermediate",
    tags: ["refactor", "architecture", "middleware", "pipeline", "onion"],
    instructions:
      "A 600-line monolithic request handler has logging, auth, rate limiting, and response formatting tangled together. Refactor into an extensible (context, next) onion middleware pipeline.",
    starterCode: `// Monolithic Tangled Route Handler
async function handleRequest(req) {
  const start = Date.now();
  console.log("--> " + req.method + " " + req.url);
  const token = req.headers.get("authorization");
  if (!token) return new Response("Unauthorized", { status: 401 });
  const user = verifyToken(token);
  if (!user) return new Response("Forbidden", { status: 403 });

  // Rate limiting check
  if (isRateLimited(user.id)) return new Response("Too Many Requests", { status: 429 });

  const result = await executeBusinessLogic(req, user);
  console.log("<-- 200 (" + (Date.now() - start) + "ms)");
  return new Response(JSON.stringify(result));
}`,
    solutionCode: `// Composable Onion Middleware Pipeline
export class Pipeline {
  #middlewares = [];
  use(fn) {
    this.#middlewares.push(fn);
    return this;
  }
  execute(context) {
    let index = -1;
    const dispatch = (i) => {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = this.#middlewares[i];
      if (!fn) return Promise.resolve();
      return Promise.resolve(fn(context, () => dispatch(i + 1)));
    };
    return dispatch(0).then(() => context.response);
  }
}`,
    criteria: [
      "Extracts cross-cutting concerns into composable middleware functions",
      "Implements standard (context, next) onion dispatch pattern",
      "Guards against multiple next() calls and preserves async flow",
    ],
  },
  {
    id: "task_refactor_debounce_search",
    title: "Reactive Search Input with Cancelable Microtask Debounce",
    category: "async",
    difficulty: "beginner",
    tags: ["refactor", "async", "debounce", "microtask", "reactive"],
    instructions:
      "Every single keystroke triggers an instantaneous un-debounced fetch request, causing out-of-order race conditions and server DDOS. Refactor to a cancelable debounce with AbortController cancellation on subsequent keystrokes.",
    starterCode: `// Un-debounced Race Condition Prone Search
searchInput.addEventListener("input", async (e) => {
  const query = e.target.value;
  const res = await fetch("/api/search?q=" + encodeURIComponent(query));
  const data = await res.json();
  renderSearchResults(data.results);
});`,
    solutionCode: `// Cancelable Debounce with Active AbortController
export function createDebouncedSearch(delay = 250) {
  let timer = null;
  let activeAbort = null;

  return function onSearch(query, onResults) {
    if (timer) clearTimeout(timer);
    if (activeAbort) activeAbort.abort();

    const controller = new AbortController();
    activeAbort = controller;

    timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/search?q=" + encodeURIComponent(query), { signal: controller.signal });
        const data = await res.json();
        onResults(data.results);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    }, delay);
  };
}`,
    criteria: [
      "Throttles rapid keystrokes with configurable timeout delay",
      "Aborts in-flight outdated HTTP requests using AbortController",
      "Silently ignores expected AbortError rejections",
    ],
  },
  {
    id: "task_refactor_semantic_a11y",
    title: "Refactor Inaccessible Clickable Divs into Accessible ARIA Primitives",
    category: "accessibility",
    difficulty: "beginner",
    tags: ["refactor", "a11y", "semantic-html", "wcag", "aria"],
    instructions:
      "Custom UI elements built with generic <div onclick='...'> lack keyboard accessibility (Tab, Enter, Space), screen reader roles, and focus outlines. Refactor to accessible semantic button/tablist components meeting WCAG 2.1 AA.",
    starterCode: `<!-- Inaccessible Custom Toggle -->
<div class="my-toggle" onclick="toggleOption(this)">
  <span class="custom-dot"></span>
  <span class="label">Dark Mode</span>
</div>`,
    solutionCode: `<!-- Accessible ARIA Switch Primitive -->
<button
  type="button"
  role="switch"
  aria-checked="false"
  aria-label="Toggle dark mode"
  class="my-toggle"
  onkeydown="if(event.key==='Enter'||event.key===' ')toggleOption(this)"
  onclick="toggleOption(this)">
  <span class="custom-dot" aria-hidden="true"></span>
  <span class="label">Dark Mode</span>
</button>`,
    criteria: [
      "Replaces non-semantic div with button element",
      "Applies correct ARIA role (switch/checkbox) and aria-checked attribute",
      "Supports native keyboard focus and Enter/Space activation",
    ],
  },
  {
    id: "task_refactor_typed_schema",
    title: "Replace Brittle Object Access with Runtime Schema Validator",
    category: "security",
    difficulty: "intermediate",
    tags: ["refactor", "security", "validation", "schema", "type-guards"],
    instructions:
      "Unvalidated external JSON payloads cause TypeError crashes when optional fields are missing or wrongly typed. Refactor using a concise, zero-dependency composable schema validator with strict type guards.",
    starterCode: `// Brittle Unchecked Property Chaining
function processWebhook(payload) {
  const id = payload.event.id;
  const amount = payload.data.transaction.amount.toFixed(2);
  const items = payload.data.transaction.items.map(i => i.sku.toUpperCase());
  return { id, amount, items };
}`,
    solutionCode: `// Composable Zero-Dependency Type Guard Schema
export const schema = {
  string: (v) => typeof v === "string" && v.length > 0,
  number: (v) => typeof v === "number" && !Number.isNaN(v),
  array: (itemGuard) => (v) => Array.isArray(v) && v.every(itemGuard),
};

export function parseTransactionWebhook(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Invalid payload");
  const eventId = payload?.event?.id;
  if (!schema.string(eventId)) throw new Error("Invalid event.id");

  const amount = payload?.data?.transaction?.amount;
  if (!schema.number(amount)) throw new Error("Invalid transaction.amount");

  const rawItems = payload?.data?.transaction?.items;
  if (!schema.array((i) => schema.string(i?.sku))(rawItems)) {
    throw new Error("Invalid transaction.items");
  }

  return {
    id: eventId,
    amount: amount.toFixed(2),
    items: rawItems.map((i) => i.sku.toUpperCase()),
  };
}`,
    criteria: [
      "Eliminates unhandled TypeError null/undefined crashes",
      "Validates nested fields with composable type guards",
      "Throws clear validation errors for malformed structures",
    ],
  },
  {
    id: "task_refactor_worker_pool",
    title: "Decouple Heavy CPU Math to Concurrent Worker Pool",
    category: "architecture",
    difficulty: "advanced",
    tags: ["refactor", "concurrency", "worker-threads", "performance"],
    instructions:
      "A long-running cryptographic hash computation blocks the Node/Bun main event loop for 800ms, causing dropped HTTP connections. Refactor using a managed worker pool with task queues and concurrency limits.",
    starterCode: `// Main Thread Blocking CPU Computation
function computeHeavyHashes(records) {
  return records.map(record => {
    // 50,000 iterations of crypto hash blocks the event loop
    return intensiveHash(record.payload, 50000);
  });
}`,
    solutionCode: `// Non-blocking Concurrency-Limited Async Batch Dispatch
export async function computeHeavyHashes(records, concurrency = 4) {
  const results = new Array(records.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < records.length) {
      const idx = currentIndex++;
      // Yield to event loop between chunks or dispatch to Worker
      results[idx] = await new Promise((resolve) => {
        setImmediate(() => resolve(intensiveHash(records[idx].payload, 50000)));
      });
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, records.length) }, () => worker());
  await Promise.all(pool);
  return results;
}`,
    criteria: [
      "Eliminates synchronous event loop blocking",
      "Controls concurrency with worker pool bounds",
      "Preserves original order of indexed results",
    ],
  },
];
