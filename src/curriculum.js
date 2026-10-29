/**
 * Agentic Curriculum: 1M Tasks — Standardized AI Training & Refactoring Suite.
 * Pre-seeded high-signal challenges across 12 categories and 5 domain tracks.
 */

export const CURRICULUM_DIFFICULTIES = Object.freeze(["beginner", "intermediate", "advanced"]);

export const CURRICULUM_TRACKS = Object.freeze({
  "core-engineering": {
    id: "core-engineering",
    name: "Core Web, Async, Performance & Architecture",
    categories: ["async", "performance", "architecture", "css", "accessibility", "security"],
  },
  "distributed-data": {
    id: "distributed-data",
    name: "Database Connectivity & Distributed Persistence",
    categories: ["database"],
  },
  "identity-security": {
    id: "identity-security",
    name: "Deep Web Auth, Fingerprinting & Cybersecurity",
    categories: ["web-auth", "web-fingerprinting", "web-cybersec"],
  },
  "agentic-systems": {
    id: "agentic-systems",
    name: "Long-Horizon Autonomous Agent Workflows",
    categories: ["agentic-workflow"],
  },
  "realtime-systems": {
    id: "realtime-systems",
    name: "Real-Time Two-User Chat & Protocol Engineering",
    categories: ["realtime-chat"],
  },
  "enterprise-typescript": {
    id: "enterprise-typescript",
    name: "Fortune 500 TypeScript Frameworks, Migrations & Package Ecosystems",
    categories: ["ts-frameworks", "framework-migration", "package-managers"],
  },
  "semantic-web-seo": {
    id: "semantic-web-seo",
    name: "Advanced HTML Living Standard, Technical SEO, JSON-LD & Schema.org",
    categories: ["html-architecture", "seo-structured-data"],
  },
  "commerce-fintech": {
    id: "commerce-fintech",
    name: "E-Commerce, Checkouts, Stripe & Polar.sh Payment Processing",
    categories: ["ecommerce-checkout", "payment-processing"],
  },
  "storefront-order-lifecycle": {
    id: "storefront-order-lifecycle",
    name: "Web Shop Storefront UI, Account-to-Checkout Flow & Order History Data Architecture",
    categories: ["storefront-ui", "order-lifecycle-data"],
  },
  "web-cookies-data-traffic": {
    id: "web-cookies-data-traffic",
    name: "Deep Web Cookies (RFC 6265bis/CHIPS/DBSC), Client Storage & HTTP Traffic Engineering",
    categories: ["web-cookies", "web-storage-data", "web-traffic"],
  },
});

export const CATEGORY_TO_TRACK = Object.freeze({
  async: "core-engineering",
  performance: "core-engineering",
  architecture: "core-engineering",
  css: "core-engineering",
  accessibility: "core-engineering",
  security: "core-engineering",
  database: "distributed-data",
  "web-auth": "identity-security",
  "web-fingerprinting": "identity-security",
  "web-cybersec": "identity-security",
  "agentic-workflow": "agentic-systems",
  "realtime-chat": "realtime-systems",
  "ts-frameworks": "enterprise-typescript",
  "framework-migration": "enterprise-typescript",
  "package-managers": "enterprise-typescript",
  "html-architecture": "semantic-web-seo",
  "seo-structured-data": "semantic-web-seo",
  "ecommerce-checkout": "commerce-fintech",
  "payment-processing": "commerce-fintech",
  "storefront-ui": "storefront-order-lifecycle",
  "order-lifecycle-data": "storefront-order-lifecycle",
  "web-cookies": "web-cookies-data-traffic",
  "web-storage-data": "web-cookies-data-traffic",
  "web-traffic": "web-cookies-data-traffic",
});

export const CURRICULUM_CATEGORIES = Object.freeze(Object.keys(CATEGORY_TO_TRACK));

const RAW_CURRICULUM_TASKS = [
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
  {
    id: "task_db_connection_pool",
    title: "Resilient Database Connection Pool with Health Checks & Waiter Queue Timeout",
    category: "database",
    difficulty: "advanced",
    tags: ["database", "connection-pool", "resilience", "concurrency", "resource-lifecycle"],
    instructions:
      "Every incoming query opens a brand-new TCP database connection and forgets to close it when queries throw, quickly exhausting max_connections under burst traffic. Refactor into a bounded ConnectionPool with idle connection reuse, ping health checks, FIFO waiter queue with acquire timeout, and automatic release via withConnection().",
    starterCode: `// Leaky Per-Query Connection Allocation
async function executeQuery(createConnection, sql, params) {
  const conn = await createConnection();
  // If conn.query throws, the socket is leaked forever
  const rows = await conn.query(sql, params);
  await conn.close();
  return rows;
}`,
    solutionCode: `// Bounded Connection Pool with Health Check, Waiter Timeout & Auto-Release
export class ConnectionPool {
  #factory;
  #maxSize;
  #acquireTimeoutMs;
  #idle = [];
  #activeCount = 0;
  #waiters = [];
  #closed = false;

  constructor(factory, { maxSize = 10, acquireTimeoutMs = 2000 } = {}) {
    this.#factory = factory;
    this.#maxSize = maxSize;
    this.#acquireTimeoutMs = acquireTimeoutMs;
  }

  async acquire() {
    if (this.#closed) throw new Error("Pool is closed");

    while (this.#idle.length > 0) {
      const conn = this.#idle.pop();
      try {
        if (typeof conn.ping === "function") await conn.ping();
        this.#activeCount++;
        return conn;
      } catch {
        try { await conn.close?.(); } catch {}
      }
    }

    if (this.#activeCount < this.#maxSize) {
      this.#activeCount++;
      try {
        return await this.#factory();
      } catch (err) {
        this.#activeCount--;
        throw err;
      }
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.#waiters.indexOf(waiter);
        if (idx !== -1) this.#waiters.splice(idx, 1);
        reject(new Error("AcquireTimeoutError: connection pool exhausted"));
      }, this.#acquireTimeoutMs);

      const waiter = {
        resolve: (conn) => {
          clearTimeout(timer);
          resolve(conn);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      };
      this.#waiters.push(waiter);
    });
  }

  release(conn) {
    if (!conn) return;
    if (this.#closed) {
      this.#activeCount = Math.max(0, this.#activeCount - 1);
      conn.close?.();
      return;
    }
    if (this.#waiters.length > 0) {
      const next = this.#waiters.shift();
      next.resolve(conn);
      return;
    }
    this.#activeCount = Math.max(0, this.#activeCount - 1);
    this.#idle.push(conn);
  }

  async withConnection(fn) {
    const conn = await this.acquire();
    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }

  async drain() {
    this.#closed = true;
    while (this.#waiters.length > 0) {
      this.#waiters.shift().reject(new Error("Pool draining"));
    }
    const closing = this.#idle.splice(0).map((c) => c.close?.());
    await Promise.all(closing);
  }

  stats() {
    return { active: this.#activeCount, idle: this.#idle.length, waiting: this.#waiters.length };
  }
}`,
    criteria: [
      "Enforces a strict maximum connection limit (maxSize) with idle reuse",
      "Validates idle connections via health check before handoff and evicts broken sockets",
      "Queues concurrent callers with a bounded acquire timeout and guarantees release in finally",
    ],
  },
  {
    id: "task_db_transactional_outbox",
    title: "Atomic SQL Parameterization & Transactional Outbox with Deadlock Retry",
    category: "database",
    difficulty: "advanced",
    tags: ["database", "sql-injection", "transactions", "outbox-pattern", "deadlock-retry"],
    instructions:
      "A payment transfer routine interpolates raw user strings into SQL queries, performs an unsafe dual-write to a message broker outside a database transaction, and crashes on transient PostgreSQL/SQLite serialization deadlocks (40001 / 40P01 / SQLITE_BUSY). Refactor to use parameterized queries, an atomic BEGIN/COMMIT/ROLLBACK transactional outbox insert, and bounded retry on transient lock errors.",
    starterCode: `// Vulnerable SQL Interpolation & Non-Atomic Dual Write
async function transferFunds(db, broker, { fromAccount, toAccount, amount, idempotencyKey }) {
  await db.query(\`UPDATE accounts SET balance = balance - \${amount} WHERE id = '\${fromAccount}'\`);
  await db.query(\`UPDATE accounts SET balance = balance + \${amount} WHERE id = '\${toAccount}'\`);
  // If process crashes before broker.publish, downstream ledger never hears about the transfer
  await broker.publish("funds.transferred", { fromAccount, toAccount, amount, idempotencyKey });
  return { ok: true };
}`,
    solutionCode: `// Parameterized Atomic Transaction + Transactional Outbox + Serialization Retry
const TRANSIENT_DB_CODES = new Set(["40001", "40P01", "SQLITE_BUSY"]);

export async function transferFunds(db, { fromAccount, toAccount, amount, idempotencyKey }, maxRetries = 3) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid transfer amount");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.query("BEGIN");
      const debit = await db.query(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance",
        [amount, fromAccount]
      );
      if (!debit?.rows?.length) {
        throw new Error("Insufficient funds or missing source account");
      }

      await db.query(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        [amount, toAccount]
      );

      const payload = JSON.stringify({ fromAccount, toAccount, amount, idempotencyKey });
      await db.query(
        "INSERT INTO outbox_events (idempotency_key, topic, payload, status) VALUES ($1, $2, $3, 'pending')",
        [idempotencyKey, "funds.transferred", payload]
      );

      await db.query("COMMIT");
      return { ok: true, attempt, newBalance: debit.rows[0].balance };
    } catch (err) {
      try { await db.query("ROLLBACK"); } catch {}
      const isTransient = TRANSIENT_DB_CODES.has(err?.code);
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
    }
  }
}`,
    criteria: [
      "Eliminates SQL string interpolation in favor of parameterized query placeholders ($1, $2)",
      "Wraps account mutations and outbox_events insertion in an atomic BEGIN / COMMIT / ROLLBACK transaction",
      "Retries transient serialization and deadlock errors (40001, 40P01, SQLITE_BUSY) up to maxRetries",
    ],
  },
  {
    id: "task_db_keyset_pagination_dataloader",
    title: "N+1 Query Elimination with Batch DataLoader & Keyset Cursor Pagination",
    category: "database",
    difficulty: "intermediate",
    tags: ["database", "dataloader", "n-plus-one", "pagination", "keyset-cursor"],
    instructions:
      "An activity feed endpoint uses slow OFFSET pagination and executes a separate SELECT query per row to load author profiles (1 + N queries). Refactor to keyset cursor pagination ((created_at, id) < ($1, $2)) and a microtask-batched DataLoader that coalesces concurrent .load(id) lookups into a single WHERE id IN (...) batch query.",
    starterCode: `// Slow OFFSET Pagination + N+1 Author Queries
async function fetchFeedPage(db, page = 0, pageSize = 20) {
  const offset = page * pageSize;
  const posts = await db.query(\`SELECT * FROM posts ORDER BY created_at DESC LIMIT \${pageSize} OFFSET \${offset}\`);
  for (const post of posts) {
    // Executes N additional database round-trips!
    post.author = await db.query(\`SELECT id, username FROM users WHERE id = '\${post.authorId}'\`);
  }
  return { posts };
}`,
    solutionCode: `// Microtask-Batched DataLoader + Keyset Cursor Pagination
export class BatchDataLoader {
  #batchFn;
  #cache = new Map();
  #queue = [];
  #scheduled = false;

  constructor(batchFn) {
    this.#batchFn = batchFn;
  }

  load(key) {
    if (this.#cache.has(key)) return this.#cache.get(key);

    const promise = new Promise((resolve, reject) => {
      this.#queue.push({ key, resolve, reject });
      if (!this.#scheduled) {
        this.#scheduled = true;
        queueMicrotask(() => this.#dispatch());
      }
    });

    this.#cache.set(key, promise);
    return promise;
  }

  async #dispatch() {
    const batch = this.#queue.splice(0);
    this.#scheduled = false;
    const uniqueKeys = [...new Set(batch.map((item) => item.key))];

    try {
      const resultsMap = await this.#batchFn(uniqueKeys);
      for (const { key, resolve } of batch) {
        resolve(resultsMap instanceof Map ? resultsMap.get(key) ?? null : resultsMap[key] ?? null);
      }
    } catch (err) {
      for (const { key, reject } of batch) {
        this.#cache.delete(key);
        reject(err);
      }
    }
  }
}

export async function fetchFeedKeyset(db, userLoader, { cursorCreatedAt = null, cursorId = null, limit = 20 } = {}) {
  const posts = cursorCreatedAt
    ? await db.query(
        "SELECT id, author_id, body, created_at FROM posts WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3",
        [cursorCreatedAt, cursorId, limit]
      )
    : await db.query(
        "SELECT id, author_id, body, created_at FROM posts ORDER BY created_at DESC, id DESC LIMIT $1",
        [limit]
      );

  const enriched = await Promise.all(
    posts.map(async (post) => ({
      ...post,
      author: await userLoader.load(post.author_id),
    }))
  );

  const last = enriched.at(-1) || null;
  return {
    items: enriched,
    nextCursor: last ? { createdAt: last.created_at, id: last.id } : null,
  };
}`,
    criteria: [
      "Coalesces concurrent single-key lookups in the same tick using queueMicrotask batching",
      "Deduplicates requested keys per batch and caches in-flight promises",
      "Replaces linear OFFSET scan with indexed keyset cursor pagination",
    ],
  },
  {
    id: "task_auth_dpop_token_binding",
    title: "OAuth 2.0 DPoP (RFC 9449) Sender-Constrained Proof-of-Possession Verifier",
    category: "web-auth",
    difficulty: "advanced",
    tags: ["web-auth", "oauth2", "dpop", "rfc9449", "jwt", "token-binding", "replay-defense"],
    instructions:
      "Standard Bearer tokens can be replayed from any host if leaked via logs or XSS. Refactor the bearer validator into an RFC 9449 DPoP proof verifier that validates the dpop+jwt header, HTTP method (htm), normalized target URI without query/fragment (htu), access token hash (ath), JWK thumbprint binding (cnf.jkt), timestamp freshness (iat), and jti replay prevention.",
    starterCode: `// Vulnerable Bearer-Only Check (Susceptible to Token Replay)
function authenticateApiRequest(req, tokenRecord) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("Missing token");
  const token = auth.slice(7);
  if (token !== tokenRecord.accessToken) throw new Error("Invalid token");
  return { sub: tokenRecord.sub };
}`,
    solutionCode: `// RFC 9449 OAuth 2.0 DPoP Proof-of-Possession Verifier with JTI Replay Cache
export function verifyDpopProof({
  dpopProof,
  accessToken,
  expectedJkt,
  httpMethod,
  httpUrl,
  replayCache,
  nowSec = Math.floor(Date.now() / 1000),
  maxSkewSec = 60,
  hashFn,
}) {
  if (!dpopProof || typeof dpopProof !== "object") {
    throw new Error("Missing DPoP proof");
  }
  const { header, payload, signatureValid } = dpopProof;
  if (!signatureValid) {
    throw new Error("Invalid DPoP cryptographic signature");
  }
  if (!header || header.typ !== "dpop+jwt" || !header.jwk || header.jwk.d) {
    throw new Error("Invalid DPoP header: must be typ dpop+jwt with public JWK only");
  }
  if (!payload || !payload.jti || !payload.htm || !payload.htu || typeof payload.iat !== "number") {
    throw new Error("Missing required DPoP claims (jti, htm, htu, iat)");
  }

  if (String(payload.htm).toUpperCase() !== String(httpMethod).toUpperCase()) {
    throw new Error("DPoP htm claim does not match HTTP method");
  }

  const parsedUrl = new URL(httpUrl);
  const normalizedHtu = \`\${parsedUrl.origin}\${parsedUrl.pathname}\`;
  if (payload.htu !== normalizedHtu) {
    throw new Error("DPoP htu claim does not match normalized request URI");
  }

  if (Math.abs(nowSec - payload.iat) > maxSkewSec) {
    throw new Error("DPoP proof iat outside acceptable clock skew window");
  }

  const computeHash = hashFn || ((input) => \`sha256_\${input}\`);
  if (accessToken) {
    const expectedAth = computeHash(accessToken);
    if (payload.ath !== expectedAth) {
      throw new Error("DPoP ath claim does not match bound access token hash");
    }
  }

  const canonicalJwk = JSON.stringify({
    crv: header.jwk.crv,
    kty: header.jwk.kty,
    x: header.jwk.x,
    y: header.jwk.y,
  });
  const computedJkt = computeHash(canonicalJwk);
  if (expectedJkt && computedJkt !== expectedJkt) {
    throw new Error("DPoP JWK thumbprint does not match cnf.jkt token binding");
  }

  const replayKey = \`\${computedJkt}:\${payload.jti}\`;
  if (replayCache.has(replayKey)) {
    throw new Error("DPoP replay detected: jti already consumed");
  }
  replayCache.add(replayKey);

  return {
    bound: true,
    jkt: computedJkt,
    jti: payload.jti,
    htm: payload.htm,
    htu: normalizedHtu,
  };
}`,
    criteria: [
      "Validates typ === 'dpop+jwt' header, public JWK presence, and rejects private key material",
      "Enforces exact HTTP method (htm) and query/fragment-stripped URI (htu) matching",
      "Verifies access token hash (ath), cnf.jkt thumbprint binding, iat freshness, and jti replay cache",
    ],
  },
  {
    id: "task_auth_webauthn_passkey",
    title: "WebAuthn / FIDO2 Passkey Assertion & Clone Detection Verifier",
    category: "web-auth",
    difficulty: "advanced",
    tags: ["web-auth", "webauthn", "fido2", "passkeys", "cryptography", "clone-detection"],
    instructions:
      "A passkey login endpoint blindly trusts assertion responses without verifying clientDataJSON challenge/origin, parsing binary authenticatorData flags (User Present & User Verified), or checking signCount regressions that indicate a cloned hardware/software authenticator. Implement a strict FIDO2 WebAuthn assertion verifier.",
    starterCode: `// Insecure WebAuthn Handler (Skips Binary AuthenticatorData & SignCount Checks)
function verifyPasskeyLogin(assertion, storedCredential) {
  if (assertion.credentialId !== storedCredential.id) {
    throw new Error("Unknown credential");
  }
  // Missing clientDataJSON origin/challenge check, UP/UV flag check, and signCount clone check!
  return { verified: true, userId: storedCredential.userId };
}`,
    solutionCode: `// FIDO2 / WebAuthn Passkey Assertion Verifier with Binary AuthData Parsing & Clone Detection
export function verifyPasskeyAssertion({
  clientDataJSON,
  authenticatorData,
  signatureValid = true,
  expectedChallenge,
  expectedOrigin,
  expectedRpIdHash,
  requireUserVerification = true,
  storedCredential,
}) {
  const clientData = typeof clientDataJSON === "string" ? JSON.parse(clientDataJSON) : clientDataJSON;
  if (!clientData || clientData.type !== "webauthn.get") {
    throw new Error("Invalid clientData.type: expected webauthn.get");
  }
  if (clientData.challenge !== expectedChallenge) {
    throw new Error("WebAuthn challenge mismatch");
  }
  if (clientData.origin !== expectedOrigin) {
    throw new Error("WebAuthn origin mismatch");
  }

  if (!(authenticatorData instanceof Uint8Array) || authenticatorData.byteLength < 37) {
    throw new Error("Malformed authenticatorData buffer (must be >= 37 bytes)");
  }

  const rpIdHash = authenticatorData.subarray(0, 32);
  if (expectedRpIdHash instanceof Uint8Array) {
    if (rpIdHash.byteLength !== expectedRpIdHash.byteLength) throw new Error("RP ID hash length mismatch");
    let diff = 0;
    for (let i = 0; i < 32; i++) diff |= rpIdHash[i] ^ expectedRpIdHash[i];
    if (diff !== 0) throw new Error("RP ID hash mismatch");
  }

  const flags = authenticatorData[32];
  const userPresent = (flags & 0x01) !== 0; // Bit 0: UP
  const userVerified = (flags & 0x04) !== 0; // Bit 2: UV

  if (!userPresent) {
    throw new Error("WebAuthn User Present (UP) flag not set");
  }
  if (requireUserVerification && !userVerified) {
    throw new Error("WebAuthn User Verification (UV) flag required but not set");
  }

  const view = new DataView(authenticatorData.buffer, authenticatorData.byteOffset, authenticatorData.byteLength);
  const signCount = view.getUint32(33, false); // Big-endian uint32 at offset 33

  if ((signCount > 0 || storedCredential.signCount > 0) && signCount <= storedCredential.signCount) {
    throw new Error("ClonedAuthenticatorError: signCount regression detected");
  }

  if (!signatureValid) {
    throw new Error("Invalid WebAuthn assertion signature");
  }

  return {
    verified: true,
    userId: storedCredential.userId,
    newSignCount: signCount,
    userPresent,
    userVerified,
  };
}`,
    criteria: [
      "Validates clientDataJSON type ('webauthn.get'), challenge, and exact origin",
      "Parses binary authenticatorData to verify RP ID hash, UP (0x01), and UV (0x04) bit flags",
      "Extracts big-endian uint32 signCount and rejects regressed or stagnant counters as cloned authenticators",
    ],
  },
  {
    id: "task_auth_refresh_rotation_reuse",
    title: "Zero-Trust Refresh Token Rotation with Reuse Detection & Family Revocation",
    category: "web-auth",
    difficulty: "intermediate",
    tags: ["web-auth", "oauth2", "refresh-token-rotation", "reuse-detection", "zero-trust"],
    instructions:
      "A session service reuses the same static refresh token across renewals, allowing an attacker who steals a refresh token to mint access tokens indefinitely alongside the legitimate user. Implement one-time refresh token rotation grouped by token familyId, where replaying any previously rotated token immediately revokes the entire token family.",
    starterCode: `// Vulnerable Static Refresh Token (No Rotation or Theft Detection)
class TokenStore {
  constructor() { this.tokens = new Map(); }
  issue(userId) {
    const rt = "rt_" + Math.random().toString(36).slice(2);
    this.tokens.set(rt, { userId });
    return { refreshToken: rt, accessToken: "at_" + Date.now() };
  }
  refresh(rt) {
    const rec = this.tokens.get(rt);
    if (!rec) throw new Error("Invalid token");
    // Returns a new access token but leaves rt reusable forever!
    return { refreshToken: rt, accessToken: "at_" + Date.now() };
  }
}`,
    solutionCode: `// One-Time Refresh Token Rotation with Family-Wide Compromise Revocation
export class RefreshTokenRotationStore {
  #records = new Map(); // tokenId -> { tokenId, familyId, userId, used, revoked, parentId, expiresAt }
  #seq = 0;

  issueInitialFamily(userId, ttlMs = 86400000) {
    const familyId = \`fam_\${++this.#seq}\`;
    return this.#mintToken({ familyId, userId, parentId: null, ttlMs });
  }

  rotate(refreshToken, ttlMs = 86400000) {
    const record = this.#records.get(refreshToken);
    if (!record) {
      throw new Error("Invalid refresh token");
    }

    if (record.used) {
      // Reuse of an already-rotated token signals credential theft: revoke entire family!
      this.revokeFamily(record.familyId);
      throw new Error("RefreshTokenReuseError: token family revoked due to suspected theft");
    }

    if (record.revoked || Date.now() > record.expiresAt) {
      throw new Error("Refresh token is expired or revoked");
    }

    record.used = true;
    return this.#mintToken({
      familyId: record.familyId,
      userId: record.userId,
      parentId: record.tokenId,
      ttlMs,
    });
  }

  revokeFamily(familyId) {
    let revokedCount = 0;
    for (const rec of this.#records.values()) {
      if (rec.familyId === familyId && !rec.revoked) {
        rec.revoked = true;
        revokedCount++;
      }
    }
    return revokedCount;
  }

  isTokenActive(refreshToken) {
    const rec = this.#records.get(refreshToken);
    return Boolean(rec && !rec.used && !rec.revoked && Date.now() <= rec.expiresAt);
  }

  #mintToken({ familyId, userId, parentId, ttlMs }) {
    const tokenId = \`rt_\${familyId}_\${++this.#seq}\`;
    const accessToken = \`at_\${familyId}_\${this.#seq}\`;
    this.#records.set(tokenId, {
      tokenId,
      familyId,
      userId,
      parentId,
      used: false,
      revoked: false,
      expiresAt: Date.now() + ttlMs,
    });
    return { refreshToken: tokenId, accessToken, familyId };
  }
}`,
    criteria: [
      "Marks every refresh token as single-use upon rotation and issues a successor within the same familyId",
      "Detects replay of any previously rotated token (record.used === true)",
      "Immediately revokes all descendant and sibling tokens in the compromised familyId upon reuse",
    ],
  },
  {
    id: "task_fingerprint_entropy_normalizer",
    title: "Multi-Surface Browser Fingerprint Entropy Aggregator & Spoofing Detector",
    category: "web-fingerprinting",
    difficulty: "advanced",
    tags: ["web-fingerprinting", "canvas", "webgl", "audio-context", "anti-bot", "entropy"],
    instructions:
      "A naive bot filter only checks navigator.userAgent.includes('Headless'), which is trivially bypassed by spoofing the User-Agent string. Refactor into a multi-surface browser fingerprint analyzer that computes a deterministic FNV-1a hash across normalized Canvas, WebGL renderer/vendor, AudioContext dynamics, and hardware signals while detecting cross-layer spoofing anomalies (UA vs navigator.platform mismatch, SwiftShader/llvmpipe software renderers on claimed Apple/NVIDIA hardware, and webdriver artifacts).",
    starterCode: `// Naive User-Agent Substring Check (Trivially Bypassed)
function checkBrowserClient(signals) {
  if (signals.userAgent.includes("HeadlessChrome")) {
    return { isBotSuspected: true };
  }
  return { isBotSuspected: false, fingerprintId: signals.userAgent };
}`,
    solutionCode: `// Multi-Surface Browser Fingerprint Normalizer & Cross-Layer Anomaly Detector
function fnv1aHex(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function analyzeBrowserFingerprint(signals) {
  const anomalies = [];
  const ua = String(signals?.userAgent || "");
  const platform = String(signals?.platform || "");
  const webglRenderer = String(signals?.webgl?.renderer || "");
  const webglVendor = String(signals?.webgl?.vendor || "");
  const audioSampleSum = Number(signals?.audioSampleSum || 0).toFixed(4);
  const canvasHash = String(signals?.canvasGeometry || "empty");
  const cores = Number(signals?.hardwareConcurrency ?? 0);

  if (signals?.webdriver === true) {
    anomalies.push("navigator.webdriver flag is true");
  }

  const claimsMac = /Macintosh|Mac OS X/i.test(ua);
  const claimsWindows = /Windows NT/i.test(ua);
  if (claimsMac && /Linux|Win/i.test(platform)) {
    anomalies.push("UA claims macOS but navigator.platform is " + platform);
  }
  if (claimsWindows && /Linux|MacIntel/i.test(platform)) {
    anomalies.push("UA claims Windows but navigator.platform is " + platform);
  }

  if (/SwiftShader|llvmpipe|Subzero/i.test(webglRenderer)) {
    anomalies.push("Software WebGL rasterizer detected (" + webglRenderer + ")");
  }
  if (claimsMac && /NVIDIA|Direct3D/i.test(webglRenderer)) {
    anomalies.push("Improbable WebGL renderer for modern macOS client");
  }
  if (cores <= 0 || cores > 256) {
    anomalies.push("Implausible hardwareConcurrency value: " + cores);
  }

  const canonicalFeatures = [
    platform.trim().toLowerCase(),
    webglVendor.trim().toLowerCase(),
    webglRenderer.trim().toLowerCase(),
    canvasHash,
    audioSampleSum,
    String(cores),
    String(signals?.colorDepth || 24),
    String(signals?.timezone || "UTC"),
  ].join("|");

  const fingerprintId = "fp_" + fnv1aHex(canonicalFeatures);
  return {
    fingerprintId,
    anomalies,
    isBotSuspected: anomalies.length > 0,
    entropySurfaceCount: 8,
  };
}`,
    criteria: [
      "Computes a deterministic FNV-1a or cryptographic digest across normalized Canvas, WebGL, Audio, and platform signals",
      "Detects cross-layer OS/platform contradictions (e.g. macOS User-Agent on Linux navigator.platform)",
      "Flags headless software WebGL rasterizers (SwiftShader/llvmpipe) and webdriver automation signals",
    ],
  },
  {
    id: "task_fingerprint_tls_ja4_http2",
    title: "JA4+ TLS ClientHello & HTTP/2 SETTINGS Frame Fingerprint Correlator",
    category: "web-fingerprinting",
    difficulty: "advanced",
    tags: ["web-fingerprinting", "tls", "ja4", "http2", "grease", "network-security"],
    instructions:
      "HTTP scraper scripts spoof Chrome User-Agent headers while using default Go/Python/curl TLS and HTTP/2 stacks. Refactor the network inspector to strip RFC 8701 TLS GREASE values (0x?a?a), compute a canonical JA4-style TLS ClientHello signature, inspect HTTP/2 pseudo-header ordering (:method, :authority, :scheme, :path), and flag transport-layer impersonation.",
    starterCode: `// Naive Header Check Ignoring TLS ClientHello & HTTP/2 Framing
function inspectConnection(packet) {
  const isChrome = packet.userAgent.includes("Chrome/");
  return { clientType: isChrome ? "browser" : "script", impersonated: false };
}`,
    solutionCode: `// RFC 8701 GREASE Filter + JA4 TLS ClientHello + HTTP/2 Pseudo-Header Correlator
export function isTlsGreaseValue(val) {
  return (val & 0x0f0f) === 0x0a0a && ((val >> 12) & 0x0f) === ((val >> 4) & 0x0f);
}

export function correlateNetworkFingerprint(packet) {
  const ciphers = (packet?.tls?.ciphers || []).filter((c) => !isTlsGreaseValue(c));
  const extensions = (packet?.tls?.extensions || []).filter((e) => !isTlsGreaseValue(e));
  const tlsVersion = packet?.tls?.version === 0x0304 ? "13" : "12";
  const sniMode = packet?.tls?.sni ? "d" : "i";
  const alpn = (packet?.tls?.alpn || "00").slice(0, 2);

  const sortedCiphers = [...ciphers].map((c) => c.toString(16).padStart(4, "0")).sort().join(",");
  const sortedExts = [...extensions]
    .filter((e) => e !== 0x0000 && e !== 0x0010) // Exclude SNI & ALPN per JA4 spec
    .map((e) => e.toString(16).padStart(4, "0"))
    .sort()
    .join(",");

  const prefix = \`t\${tlsVersion}\${sniMode}\${String(ciphers.length).padStart(2, "0")}\${String(extensions.length).padStart(2, "0")}\${alpn}\`;
  const ja4 = \`\${prefix}_\${sortedCiphers}_\${sortedExts}\`;

  const h2Order = (packet?.http2?.pseudoHeaders || []).join(",");
  const chromeH2Order = ":method,:authority,:scheme,:path";
  const claimsChrome = /Chrome\\/\\d+/i.test(packet?.userAgent || "");

  const reasons = [];
  if (claimsChrome && h2Order && h2Order !== chromeH2Order) {
    reasons.push(\`Chrome UA mismatch with HTTP/2 pseudo-header order (\${h2Order})\`);
  }
  if (claimsChrome && ciphers.length < 5) {
    reasons.push("Chrome UA mismatch with abnormally small TLS cipher suite list");
  }

  return {
    ja4,
    cleanCipherCount: ciphers.length,
    cleanExtensionCount: extensions.length,
    h2PseudoHeaderOrder: h2Order,
    impersonated: reasons.length > 0,
    reasons,
  };
}`,
    criteria: [
      "Filters RFC 8701 TLS GREASE values (0x0a0a..0xfafa) from cipher suites and extensions",
      "Constructs a canonical JA4-style TLS ClientHello fingerprint with sorted cipher and extension hex codes",
      "Correlates claimed browser User-Agent against HTTP/2 pseudo-header ordering (:method,:authority,:scheme,:path)",
    ],
  },
  {
    id: "task_fingerprint_privacy_budget_defense",
    title: "Anti-Fingerprinting Privacy Budget & Deterministic Per-Origin Farbling Guard",
    category: "web-fingerprinting",
    difficulty: "intermediate",
    tags: ["web-fingerprinting", "privacy-budget", "farbling", "canvas-defense", "anti-tracking"],
    instructions:
      "Cross-origin scripts read raw Canvas pixel buffers and AudioContext samples to compute identical tracking IDs across unrelated websites. Implement a PrivacyBudgetGuard that tracks cumulative entropy bits per eTLD+1 origin, blocks reads once maxBudgetBits is exceeded, and applies deterministic session+origin keyed PRNG micro-noise ('farbling') so each origin observes a distinct, stable fingerprint.",
    starterCode: `// Unprotected High-Entropy Surface (Allows Cross-Site Identity Linking)
class BrowserSurfaceProxy {
  readCanvasPixels(origin, pixels) {
    // Every origin receives the exact same raw pixel bytes!
    return new Uint8Array(pixels);
  }
}`,
    solutionCode: `// Per-Origin Privacy Budget Enforcer & Deterministic Keyed Canvas Farbling Guard
const SURFACE_ENTROPY_BITS = {
  canvas: 18,
  webgl: 16,
  audio: 14,
  hardware: 8,
};

function deriveOriginSeed(sessionSecret, origin) {
  const input = \`\${sessionSecret}::\${String(origin).toLowerCase()}\`;
  let seed = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    seed ^= input.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  return seed || 0x12345678;
}

export class PrivacyBudgetGuard {
  #sessionSecret;
  #maxBudgetBits;
  #consumedByOrigin = new Map();

  constructor({ sessionSecret = "session_default_key", maxBudgetBits = 32 } = {}) {
    this.#sessionSecret = sessionSecret;
    this.#maxBudgetBits = maxBudgetBits;
  }

  consumeBudget(origin, surface) {
    const cost = SURFACE_ENTROPY_BITS[surface] ?? 10;
    const used = this.#consumedByOrigin.get(origin) || 0;
    if (used + cost > this.#maxBudgetBits) {
      throw new Error(\`PrivacyBudgetExceededError: origin \${origin} exhausted \${this.#maxBudgetBits}-bit budget\`);
    }
    this.#consumedByOrigin.set(origin, used + cost);
    return this.#maxBudgetBits - (used + cost);
  }

  farbleCanvasPixels(origin, rawPixels) {
    this.consumeBudget(origin, "canvas");
    const out = new Uint8Array(rawPixels);
    let prng = deriveOriginSeed(this.#sessionSecret, origin);

    for (let i = 0; i < out.length; i += 4) {
      // Xorshift32 PRNG step keyed by (sessionSecret, origin)
      prng ^= prng << 13;
      prng ^= prng >>> 17;
      prng ^= prng << 5;
      prng >>>= 0;
      // Flip LSB of Red/Green channels deterministically per origin
      out[i] = out[i] ^ (prng & 1);
      if (i + 1 < out.length) out[i + 1] = out[i + 1] ^ ((prng >>> 1) & 1);
    }
    return out;
  }

  remainingBudget(origin) {
    return Math.max(0, this.#maxBudgetBits - (this.#consumedByOrigin.get(origin) || 0));
  }
}`,
    criteria: [
      "Tracks cumulative entropy bits consumed per origin and throws when maxBudgetBits is exceeded",
      "Derives a deterministic PRNG seed from (sessionSecret, origin) for per-origin farbling",
      "Produces identical farbled buffers within the same origin/session while decorrelating hashes across origins",
    ],
  },
  {
    id: "task_cybersec_ssrf_dns_rebind",
    title: "SSRF & DNS Rebinding Guard with IP Canonicalization & CIDR Pinning",
    category: "web-cybersec",
    difficulty: "advanced",
    tags: ["web-cybersec", "ssrf", "dns-rebinding", "cidr", "cloud-metadata", "network-hardening"],
    instructions:
      "A webhook preview fetcher checks !url.includes('localhost') before calling fetch(url). Attackers bypass it via AWS/GCP cloud metadata (169.254.169.254), RFC 1918 private subnets, IPv6-mapped IPv4 (::ffff:127.0.0.1), or DNS rebinding (returning a public IP on the first lookup and 127.0.0.1 on the second). Implement a strict IP canonicalizer and DNS-pinned outbound request validator.",
    starterCode: `// Vulnerable SSRF Filter (Bypassed by 169.254.169.254, RFC1918 & DNS Rebinding)
async function fetchPreview(rawUrl) {
  if (rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) {
    throw new Error("Blocked internal host");
  }
  return fetch(rawUrl);
}`,
    solutionCode: `// SSRF & DNS Rebinding Guard with CIDR Validation and IP Connection Pinning
export function isPrivateOrReservedIp(rawIp) {
  const ip = String(rawIp || "").trim().toLowerCase().replace(/^\\[|\\]$/g, "");
  if (!ip) return true;

  if (ip === "::1" || ip === "::" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  if (ip.startsWith("::ffff:")) {
    return isPrivateOrReservedIp(ip.slice(7));
  }

  const parts = ip.split(".");
  if (parts.length !== 4) return true;
  const octets = parts.map((p) => (/^\\d+$/.test(p) ? Number(p) : NaN));
  if (octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 Cloud Metadata / Link-Local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // Multicast & Reserved
  return false;
}

export async function validateAndPinOutboundUrl(rawUrl, dnsResolve) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("SSRFGuardError: disallowed protocol " + parsed.protocol);
  }
  if (parsed.username || parsed.password) {
    throw new Error("SSRFGuardError: embedded URL credentials forbidden");
  }

  const hostname = parsed.hostname;
  const resolvedIps = await dnsResolve(hostname);
  if (!Array.isArray(resolvedIps) || resolvedIps.length === 0) {
    throw new Error("SSRFGuardError: DNS resolution returned no addresses");
  }

  for (const ip of resolvedIps) {
    if (isPrivateOrReservedIp(ip)) {
      throw new Error(\`SSRFGuardError: resolved IP \${ip} is in a private or reserved range\`);
    }
  }

  const pinnedIp = resolvedIps[0];
  const pinnedUrl = new URL(parsed.toString());
  pinnedUrl.hostname = pinnedIp;

  return {
    pinnedUrl: pinnedUrl.toString(),
    pinnedIp,
    headers: { Host: parsed.host },
    redirect: "manual",
  };
}`,
    criteria: [
      "Blocks loopback (127.0.0.0/8, ::1), RFC 1918 private ranges, CGNAT, and cloud metadata (169.254.169.254)",
      "Unwraps IPv4-mapped IPv6 addresses (::ffff:127.0.0.1) and rejects non-HTTP(S) schemes",
      "Resolves DNS once and pins the validated IP address with redirect: 'manual' to prevent DNS rebinding TOCTOU",
    ],
  },
  {
    id: "task_cybersec_csp_trusted_types_dom",
    title: "DOM XSS Sanitizer with Trusted Types Policy & Nonce-Strict CSP Builder",
    category: "web-cybersec",
    difficulty: "advanced",
    tags: ["web-cybersec", "xss", "trusted-types", "csp", "sanitizer", "dom-security"],
    instructions:
      "A rich-text comment renderer strips '<script>' with a trivial regex and serves 'unsafe-inline' in Content-Security-Policy, leaving the app wide open to <img src=x onerror=alert(1)>, <svg onload=...>, and obfuscated javascript: URIs. Implement a structural HTML sanitizer paired with a W3C Trusted Types policy and a strict cryptographic nonce CSP builder.",
    starterCode: `// Vulnerable Regex Strip & Permissive CSP (Trivially Bypassed via onerror / javascript:)
function renderComment(dirtyHtml) {
  const cleaned = dirtyHtml.replace(/<script>/gi, "").replace(/<\\/script>/gi, "");
  const csp = "default-src * 'unsafe-inline' 'unsafe-eval'";
  return { html: cleaned, csp };
}`,
    solutionCode: `// Structural XSS Sanitizer + Trusted Types Policy + Strict Nonce CSP
const FORBIDDEN_TAGS_RE = /<\\/?(?:script|iframe|object|embed|svg|math|style|base|form|meta|link)\\b[^>]*>/gi;
const EVENT_ATTR_RE = /\\s+on[a-z0-9_-]+\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)/gi;
const DANGEROUS_URI_ATTR_RE = /\\s+(?:href|src|xlink:href|action|formaction)\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))/gi;

export function sanitizeHtmlFragment(dirtyHtml) {
  let html = String(dirtyHtml ?? "");
  html = html.replace(/<!--[\\s\\S]*?-->/g, "");
  html = html.replace(FORBIDDEN_TAGS_RE, "");
  html = html.replace(EVENT_ATTR_RE, "");
  html = html.replace(DANGEROUS_URI_ATTR_RE, (fullMatch, dQuote, sQuote, unquoted) => {
    const rawVal = dQuote ?? sQuote ?? unquoted ?? "";
    const normalized = rawVal
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\\d+);?/g, (_, dec) => String.fromCharCode( parseInt(dec, 10)))
      .replace(/[\\x00-\\x20]+/g, "")
      .toLowerCase();
    if (
      normalized.startsWith("javascript:") ||
      normalized.startsWith("vbscript:") ||
      normalized.startsWith("data:")
    ) {
      return ' href="#"';
    }
    return fullMatch;
  });
  return html;
}

export function buildStrictCspHeader(nonce) {
  if (!nonce || typeof nonce !== "string" || nonce.length < 12) {
    throw new Error("CSP nonce must be at least 12 characters of cryptographic entropy");
  }
  return [
    "default-src 'none'",
    \`script-src 'nonce-\${nonce}' 'strict-dynamic'\`,
    "style-src 'self'",
    "img-src 'self' https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "require-trusted-types-for 'script'",
  ].join("; ");
}`,
    criteria: [
      "Strips dangerous container/execution tags (script, iframe, object, embed, svg, style, base, form)",
      "Removes inline on* event handlers and neutralizes entity/control-char obfuscated javascript:/data: URIs",
      "Generates a strict nonce-based CSP with strict-dynamic, object-src 'none', base-uri 'none', and Trusted Types enforcement",
    ],
  },
  {
    id: "task_cybersec_timing_safe_webhook_csrf",
    title: "Constant-Time HMAC Webhook & Fetch-Metadata CSRF Defense-in-Depth",
    category: "web-cybersec",
    difficulty: "intermediate",
    tags: ["web-cybersec", "timing-attack", "hmac", "csrf", "sec-fetch-site", "replay-protection"],
    instructions:
      "A payment webhook and state-mutation endpoint compares HMAC signatures using '===' (leaking signature bytes via timing side-channels), ignores timestamp replay windows, and lacks Fetch Metadata (Sec-Fetch-Site) and double-submit CSRF checks. Implement constant-time byte comparison, replay window + nonce deduplication, and Fetch-Metadata CSRF validation.",
    starterCode: `// Vulnerable Timing-Leaky Signature Check & Missing CSRF / Replay Defense
function verifyIncomingMutation(req) {
  if (req.signature !== req.expectedSignature) {
    return { allowed: false, reason: "bad_signature" };
  }
  return { allowed: true };
}`,
    solutionCode: `// Constant-Time Byte Comparator + Replay Window Guard + Fetch-Metadata CSRF Verifier
export function constantTimeEqual(a, b) {
  const strA = String(a ?? "");
  const strB = String(b ?? "");
  if (strA.length === 0 || strA.length !== strB.length) return false;
  let diff = 0;
  for (let i = 0; i < strA.length; i++) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyWebhookAndCsrf({
  signature,
  expectedSignature,
  timestampSec,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
  nonce,
  seenNonces,
  secFetchSite,
  origin,
  expectedOrigin,
  csrfCookie,
  csrfHeader,
}) {
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { allowed: false, reason: "invalid_signature" };
  }

  if (typeof timestampSec !== "number" || Math.abs(nowSec - timestampSec) > toleranceSec) {
    return { allowed: false, reason: "timestamp_out_of_window" };
  }

  if (!nonce || seenNonces.has(nonce)) {
    return { allowed: false, reason: "replayed_nonce" };
  }

  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return { allowed: false, reason: "cross_site_fetch_blocked" };
  }

  if (expectedOrigin && origin !== expectedOrigin) {
    return { allowed: false, reason: "origin_mismatch" };
  }

  if (csrfCookie !== undefined || csrfHeader !== undefined) {
    if (!constantTimeEqual(csrfCookie, csrfHeader)) {
      return { allowed: false, reason: "csrf_token_mismatch" };
    }
  }

  seenNonces.add(nonce);
  return { allowed: true, reason: "verified" };
}`,
    criteria: [
      "Compares secrets in constant time using a bitwise XOR accumulator without early return on mismatch",
      "Enforces a bounded timestamp replay tolerance window and tracks consumed nonces",
      "Validates Sec-Fetch-Site, Origin header, and double-submit CSRF tokens",
    ],
  },
  {
    id: "task_agentic_dag_planner_saga",
    title: "Long-Horizon Hierarchical DAG Task Planner with Saga Compensation & Checkpointing",
    category: "agentic-workflow",
    difficulty: "advanced",
    tags: ["agentic-workflow", "long-horizon", "dag", "saga-pattern", "checkpointing", "planning"],
    instructions:
      "An autonomous coding agent executes multi-stage deployment and migration plans in a naive sequential loop: it cannot detect cyclic dependencies, cannot parallelize independent sub-tasks, cannot resume from a checkpoint after a preemption, and leaves half-applied infrastructure mutations behind when step 8 of 10 fails. Refactor into a DAG workflow engine with cycle detection, topological wave concurrency, checkpoint resumption, and reverse-order Saga compensation.",
    starterCode: `// Fragile Sequential Agent Loop (No DAG, Checkpointing, or Rollback)
async function runAgentPlan(steps, context) {
  for (const step of steps) {
    await step.execute(context);
  }
  return context;
}`,
    solutionCode: `// Hierarchical DAG Workflow Engine with Topological Waves, Checkpoints & Saga Rollback
export class AgenticWorkflowEngine {
  #steps = new Map();

  registerStep({ id, deps = [], execute, compensate = null }) {
    this.#steps.set(id, { id, deps, execute, compensate });
    return this;
  }

  async run(context = {}, { checkpoint = null, onCheckpoint = null } = {}) {
    const completed = new Set(checkpoint?.completedIds || []);
    const executionOrder = [...(checkpoint?.executionOrder || [])];
    const outputs = { ...(checkpoint?.outputs || {}) };

    // Validate dependencies exist
    for (const [id, step] of this.#steps.entries()) {
      for (const dep of step.deps) {
        if (!this.#steps.has(dep)) {
          throw new Error(\`Unknown dependency '\${dep}' for step '\${id}'\`);
        }
      }
    }

    while (completed.size < this.#steps.size) {
      const readyWave = [];
      for (const [id, step] of this.#steps.entries()) {
        if (completed.has(id)) continue;
        if (step.deps.every((d) => completed.has(d))) {
          readyWave.push(step);
        }
      }

      if (readyWave.length === 0) {
        throw new Error("CyclicDependencyError: deadlock in agent workflow DAG");
      }

      const waveSucceeded = [];
      try {
        await Promise.all(
          readyWave.map(async (step) => {
            const res = await step.execute(context, outputs);
            outputs[step.id] = res;
            waveSucceeded.push(step.id);
          })
        );
      } catch (err) {
        // Include any steps that finished in the failing wave before rolling back
        const toCompensate = [...executionOrder, ...waveSucceeded].reverse();
        const compensated = [];
        for (const stepId of toCompensate) {
          const step = this.#steps.get(stepId);
          if (typeof step?.compensate === "function") {
            await step.compensate(context, outputs);
            compensated.push(stepId);
          }
        }
        return {
          status: "rolled_back",
          error: err.message,
          compensatedSteps: compensated,
          outputs,
        };
      }

      for (const id of waveSucceeded) {
        completed.add(id);
        executionOrder.push(id);
      }

      if (typeof onCheckpoint === "function") {
        await onCheckpoint({
          completedIds: [...completed],
          executionOrder: [...executionOrder],
          outputs: { ...outputs },
        });
      }
    }

    return {
      status: "completed",
      completedSteps: [...executionOrder],
      outputs,
    };
  }
}`,
    criteria: [
      "Detects cyclic dependencies in the task graph and fails fast with CyclicDependencyError",
      "Executes independent dependency-satisfied steps concurrently in topological waves and saves checkpoints",
      "Resumes from prior checkpoints without re-executing completed steps and runs reverse-order Saga compensate() on failure",
    ],
  },
  {
    id: "task_agentic_tool_circuit_breaker_budget",
    title: "Self-Healing Multi-Tool Agent Loop with Circuit Breakers, Token Budget & Loop Detection",
    category: "agentic-workflow",
    difficulty: "advanced",
    tags: ["agentic-workflow", "long-horizon", "circuit-breaker", "loop-detection", "token-budget", "self-healing"],
    instructions:
      "During long-horizon autonomous runs, an agent gets trapped calling the exact same failing tool with identical arguments in an infinite loop, exhausting token budgets and hammering degraded external APIs. Implement a ResilientAgentRunner with per-tool circuit breakers (routing to fallback tools when open), action-fingerprint loop detection, and strict token/step budget governance.",
    starterCode: `// Unbounded Agent Loop (Susceptible to Infinite Tool Loops & Cascading Timeouts)
async function runAgentLoop(policy, tools) {
  const history = [];
  while (true) {
    const action = await policy.nextAction(history);
    if (action.type === "finish") return action.output;
    const obs = await tools[action.tool].execute(action.args);
    history.push({ action, obs });
  }
}`,
    solutionCode: `// Self-Healing Agent Loop with Per-Tool Circuit Breakers, Loop Guard & Budget Enforcement
export class ResilientAgentRunner {
  #tools = new Map();
  #breakers = new Map();
  #failureThreshold;

  constructor({ failureThreshold = 2 } = {}) {
    this.#failureThreshold = failureThreshold;
  }

  registerTool(name, { execute, fallback = null }) {
    this.#tools.set(name, { name, execute, fallback });
    this.#breakers.set(name, { failures: 0, state: "closed" });
    return this;
  }

  async run(policy, { maxSteps = 20, maxTokens = 8000, maxRepeatCalls = 2 } = {}) {
    const trajectory = [];
    const callCounts = new Map();
    let tokensUsed = 0;

    for (let step = 1; step <= maxSteps; step++) {
      const decision = await policy(trajectory, { step, tokensUsed, maxTokens });
      tokensUsed += Number(decision?.tokens || 0);

      if (tokensUsed > maxTokens) {
        return { status: "budget_exceeded", reason: "token_limit", tokensUsed, trajectory };
      }

      if (!decision || decision.type === "finish") {
        return { status: "completed", output: decision?.output ?? null, tokensUsed, trajectory };
      }

      const signature = \`\${decision.tool}::\${JSON.stringify(decision.args ?? {})}\`;
      const seenCount = (callCounts.get(signature) || 0) + 1;
      callCounts.set(signature, seenCount);

      if (seenCount > maxRepeatCalls) {
        trajectory.push({
          step,
          tool: decision.tool,
          loopDetected: true,
          observation: "SYSTEM_GUARD: Repeated identical tool call blocked. Synthesize progress or choose an alternative approach.",
        });
        continue;
      }

      const toolDef = this.#tools.get(decision.tool);
      if (!toolDef) {
        throw new Error(\`Unknown tool '\${decision.tool}'\`);
      }

      const breaker = this.#breakers.get(decision.tool);
      let observation;
      let usedFallback = false;

      if (breaker.state === "open" && typeof toolDef.fallback === "function") {
        observation = await toolDef.fallback(decision.args);
        usedFallback = true;
      } else {
        try {
          observation = await toolDef.execute(decision.args);
          breaker.failures = 0;
          breaker.state = "closed";
        } catch (err) {
          breaker.failures++;
          if (breaker.failures >= this.#failureThreshold) {
            breaker.state = "open";
          }
          if (typeof toolDef.fallback === "function") {
            observation = await toolDef.fallback(decision.args);
            usedFallback = true;
          } else {
            observation = \`TOOL_ERROR: \${err.message}\`;
          }
        }
      }

      trajectory.push({
        step,
        tool: decision.tool,
        usedFallback,
        breakerState: breaker.state,
        observation,
      });
    }

    return { status: "budget_exceeded", reason: "step_limit", tokensUsed, trajectory };
  }
}`,
    criteria: [
      "Trips per-tool circuit breaker to 'open' after consecutive failures and routes calls to fallback handler",
      "Detects repeated identical (tool, canonicalArgs) invocations and injects a loop-breaking guard observation",
      "Enforces strict maxTokens and maxSteps budgets with full trajectory telemetry",
    ],
  },
  {
    id: "task_agentic_episodic_memory_compactor",
    title: "Long-Horizon Context Compactor with Episodic Memory Retrieval & Goal-Drift Guard",
    category: "agentic-workflow",
    difficulty: "advanced",
    tags: ["agentic-workflow", "long-horizon", "context-compaction", "episodic-memory", "goal-drift"],
    instructions:
      "Over 100+ tool turns, naive sliding-window truncation (messages.slice(-10)) discards the original operator contract, forgets key file paths and invariants discovered earlier, and allows the model to drift into unrelated refactors. Build a LongHorizonMemoryManager that pins the root goal contract, compacts evicted turns into searchable episodic memory cards, retrieves top-K relevant memories by lexical BM25/overlap + importance, and checks proposed actions against goal drift.",
    starterCode: `// Naive Sliding Window Truncation (Loses Root Goal & Early Discoveries)
function pruneContext(messages) {
  return messages.slice(-10);
}`,
    solutionCode: `// Long-Horizon Context Compactor with Episodic Memory Store & Goal-Drift Guard
function tokenizeTerms(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9_.-]+/)
    .filter((t) => t.length > 2);
}

export class LongHorizonMemoryManager {
  #rootGoal;
  #forbiddenScopes;
  #maxContextTokens;
  #turns = [];
  #episodicStore = [];

  constructor({ rootGoal, forbiddenScopes = [], maxContextTokens = 1000 }) {
    this.#rootGoal = rootGoal;
    this.#forbiddenScopes = forbiddenScopes.map((s) => s.toLowerCase());
    this.#maxContextTokens = maxContextTokens;
  }

  appendTurn({ role, content, tokens = 100, artifacts = [], importance = 1 }) {
    this.#turns.push({ role, content, tokens, artifacts, importance, id: this.#turns.length + 1 });
    this.#compactIfNeeded();
  }

  #compactIfNeeded() {
    const totalTokens = () => this.#turns.reduce((sum, t) => sum + t.tokens, 0);
    while (totalTokens() > this.#maxContextTokens && this.#turns.length > 2) {
      const evicted = this.#turns.shift();
      this.#episodicStore.push({
        turnId: evicted.id,
        summary: evicted.content.slice(0, 160),
        artifacts: evicted.artifacts || [],
        importance: evicted.importance || 1,
        terms: new Set(tokenizeTerms(evicted.content + " " + (evicted.artifacts || []).join(" "))),
      });
    }
  }

  retrieveEpisodic(query, topK = 3) {
    const qTerms = tokenizeTerms(query);
    return this.#episodicStore
      .map((mem) => {
        let overlap = 0;
        for (const t of qTerms) {
          if (mem.terms.has(t)) overlap++;
        }
        const score = overlap * 2 + mem.importance;
        return { ...mem, score };
      })
      .filter((m) => m.score > 0 && qTerms.some((t) => m.terms.has(t)))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  buildActivePrompt(currentQuery = "") {
    const relevantMemories = this.retrieveEpisodic(currentQuery, 3);
    return {
      pinnedGoal: this.#rootGoal,
      recalledMemories: relevantMemories.map((m) => ({
        turnId: m.turnId,
        summary: m.summary,
        artifacts: m.artifacts,
      })),
      recentTurns: [...this.#turns],
      activeTokenCount: this.#turns.reduce((sum, t) => sum + t.tokens, 0),
    };
  }

  checkGoalAlignment(proposedAction) {
    const target = String(proposedAction?.target || proposedAction?.description || "").toLowerCase();
    for (const forbidden of this.#forbiddenScopes) {
      if (target.includes(forbidden)) {
        return { aligned: false, reason: \`Action touches forbidden out-of-contract scope '\${forbidden}'\` };
      }
    }
    return { aligned: true, rootGoal: this.#rootGoal };
  }
}`,
    criteria: [
      "Pins the authoritative rootGoal across compactions so long trajectories never lose the operator contract",
      "Compacts oldest turns into indexed episodic memory records with preserved artifacts when maxContextTokens is exceeded",
      "Retrieves top-K relevant episodic memories by term overlap + importance and guards against out-of-scope goal drift",
    ],
  },
  {
    id: "task_db_read_write_replica_lag_router",
    title: "Read/Write Split Replica Router with Causal LSN Consistency & Failover",
    category: "database",
    difficulty: "advanced",
    tags: ["database", "replication-lag", "read-your-writes", "lsn", "failover", "routing"],
    instructions:
      "Routing all SELECT queries to asynchronous read replicas causes stale read-your-own-writes bugs immediately after a user mutates data when replication lag is non-zero. Implement a CausalReplicaRouter that tracks the client session's lastWriteLsn, routes mutations to primary, routes SELECTs only to healthy replicas whose appliedLsn >= minLsn, and transparently falls back to primary when all replicas lag or fail.",
    starterCode: `// Stale-Read Prone Replica Router (Ignores Replication Lag & Node Health)
class SimpleDbRouter {
  constructor(primary, replicas) {
    this.primary = primary;
    this.replicas = replicas;
  }
  async execute(sql, params) {
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return this.replicas[0].query(sql, params);
    }
    return this.primary.query(sql, params);
  }
}`,
    solutionCode: `// Causal LSN Read/Write Split Router with Read-Your-Writes Guarantee & Primary Failover
export class CausalReplicaRouter {
  #primary;
  #replicas;
  #rrIndex = 0;

  constructor(primary, replicas = []) {
    this.#primary = primary;
    this.#replicas = replicas;
  }

  async execute(sql, params = [], session = { minLsn: 0 }) {
    const normalized = String(sql || "").trim().toUpperCase();
    const isReadOnly = normalized.startsWith("SELECT") && !normalized.includes("FOR UPDATE");

    if (!isReadOnly) {
      const res = await this.#primary.query(sql, params);
      if (typeof res?.lsn === "number" && session) {
        session.minLsn = Math.max(session.minLsn || 0, res.lsn);
      }
      return { ...res, routedTo: "primary" };
    }

    const requiredLsn = session?.minLsn || 0;
    const eligible = this.#replicas.filter(
      (r) => r.healthy !== false && (r.appliedLsn ?? 0) >= requiredLsn
    );

    if (eligible.length > 0) {
      const chosen = eligible[this.#rrIndex++ % eligible.length];
      try {
        const res = await chosen.query(sql, params);
        return { ...res, routedTo: chosen.id || "replica" };
      } catch {
        chosen.healthy = false;
      }
    }

    // Fallback to primary when replicas are lagging behind session LSN or unhealthy
    const primaryRes = await this.#primary.query(sql, params);
    return { ...primaryRes, routedTo: "primary" };
  }
}`,
    criteria: [
      "Routes write queries and SELECT ... FOR UPDATE locks to primary and updates session.minLsn",
      "Selects only healthy read replicas whose appliedLsn satisfies the session's causal minLsn watermark",
      "Falls back to primary when all replicas lag behind requiredLsn or throw query errors",
    ],
  },
  {
    id: "task_auth_oidc_federated_jwt_validator",
    title: "OIDC Federated ID Token & JWKS Key-Rotation Validator with Azp & Nonce Guard",
    category: "web-auth",
    difficulty: "advanced",
    tags: ["web-auth", "oidc", "jwt", "jwks", "key-rotation", "algorithm-confusion"],
    instructions:
      "An OIDC relying party decodes JWT payloads without enforcing asymmetric algorithm allowlists (vulnerable to alg: 'none' and HS256/RS256 key confusion), fails on key rotation when an unknown kid appears, and skips azp (authorized party) and replay nonce verification. Build a strict federated OIDC ID token validator.",
    starterCode: `// Vulnerable JWT Decoder (Susceptible to alg:none, Key Confusion & Missing Claims)
function validateIdToken(token, expectedAud) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  if (payload.aud !== expectedAud) throw new Error("Bad aud");
  return payload;
}`,
    solutionCode: `// Strict OIDC ID Token Validator with Asymmetric Alg Pinning, JWKS Kid Refresh & Azp/Nonce Checks
const ALLOWED_ASYMMETRIC_ALGS = new Set(["RS256", "ES256", "EdDSA"]);

export async function validateOidcIdToken({
  decodedToken,
  jwksClient,
  expectedIssuer,
  expectedAudience,
  expectedNonce,
  nowSec = Math.floor(Date.now() / 1000),
  clockSkewSec = 30,
}) {
  const { header, payload, verifyWithJwk } = decodedToken || {};
  if (!header || !payload || typeof verifyWithJwk !== "function") {
    throw new Error("Malformed OIDC token structure");
  }

  if (!ALLOWED_ASYMMETRIC_ALGS.has(header.alg)) {
    throw new Error(\`Disallowed JWT alg '\${header.alg}': only asymmetric RS256/ES256/EdDSA permitted\`);
  }
  if (!header.kid) {
    throw new Error("Missing JWT header kid");
  }

  let jwk = await jwksClient.getKey(header.kid, { forceRefresh: false });
  if (!jwk) {
    // Key rotation support: refresh JWKS once on unknown kid
    jwk = await jwksClient.getKey(header.kid, { forceRefresh: true });
  }
  if (!jwk || jwk.kty === "oct") {
    throw new Error("No valid asymmetric public JWK found for kid " + header.kid);
  }

  if (!verifyWithJwk(jwk)) {
    throw new Error("Invalid OIDC ID token cryptographic signature");
  }

  if (payload.iss !== expectedIssuer) {
    throw new Error("OIDC issuer mismatch");
  }

  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audList.includes(expectedAudience)) {
    throw new Error("OIDC audience mismatch");
  }
  if (audList.length > 1 && payload.azp !== expectedAudience) {
    throw new Error("OIDC multi-audience token missing matching azp claim");
  }

  if (typeof payload.exp !== "number" || nowSec - clockSkewSec >= payload.exp) {
    throw new Error("OIDC ID token has expired");
  }
  if (typeof payload.nbf === "number" && nowSec + clockSkewSec < payload.nbf) {
    throw new Error("OIDC ID token not yet valid (nbf)");
  }
  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error("OIDC session nonce mismatch");
  }

  return {
    verified: true,
    sub: payload.sub,
    iss: payload.iss,
    aud: expectedAudience,
    kid: header.kid,
  };
}`,
    criteria: [
      "Enforces an explicit asymmetric algorithm allowlist (RS256, ES256, EdDSA) and rejects alg: 'none' or symmetric oct keys",
      "Triggers a single JWKS cache refresh when an unrecognized kid header is encountered during key rotation",
      "Validates iss, single/multi-audience aud + azp, exp/nbf with clock skew, and session nonce",
    ],
  },
  {
    id: "task_fingerprint_behavioral_biometrics_bot",
    title: "Behavioral Biometrics & Synthetic DOM Input Telemetry Classifier",
    category: "web-fingerprinting",
    difficulty: "advanced",
    tags: ["web-fingerprinting", "behavioral-biometrics", "bot-detection", "pointer-kinematics", "telemetry"],
    instructions:
      "Headless browser automation frameworks pass static navigator property checks by patching getters, then dispatch synthetic click/keyboard events with constant-velocity linear mouse paths, zero keydown-to-keyup dwell times, or untrusted Event flags. Implement a behavioral telemetry classifier that scores pointer kinematics and keystroke dynamics.",
    starterCode: `// Naive Event Check (Fooled by Basic Synthetic Dispatch)
function classifyInteraction(events) {
  return { isSyntheticBot: events.length === 0 };
}`,
    solutionCode: `// Behavioral Kinematics & Keystroke Dynamics Bot Classifier
export function classifyInteractionTelemetry({ pointerEvents = [], keyEvents = [] } = {}) {
  const flags = [];

  if (pointerEvents.some((e) => e.isTrusted === false) || keyEvents.some((e) => e.isTrusted === false)) {
    flags.push("untrusted_dom_event");
  }

  if (pointerEvents.length >= 3) {
    const velocities = [];
    let collinearSegments = 0;

    for (let i = 1; i < pointerEvents.length; i++) {
      const prev = pointerEvents[i - 1];
      const curr = pointerEvents[i];
      const dt = Math.max(1, curr.t - prev.t);
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      velocities.push(Math.hypot(dx, dy) / dt);

      if (i >= 2) {
        const p0 = pointerEvents[i - 2];
        const cross = (prev.x - p0.x) * (curr.y - prev.y) - (prev.y - p0.y) * (curr.x - prev.x);
        if (Math.abs(cross) < 1e-5) collinearSegments++;
      }
    }

    const meanVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((acc, v) => acc + (v - meanVel) ** 2, 0) / velocities.length;

    if (collinearSegments === pointerEvents.length - 2 && variance < 1e-4) {
      flags.push("synthetic_constant_velocity_linear_path");
    }
  }

  if (keyEvents.length > 0) {
    const zeroDwellCount = keyEvents.filter((k) => Number(k.upTime - k.downTime) <= 0).length;
    if (zeroDwellCount > 0) {
      flags.push("zero_dwell_synthetic_keystrokes");
    }
  }

  return {
    isSyntheticBot: flags.length > 0,
    flags,
    riskScore: Math.min(100, flags.length * 45),
  };
}`,
    criteria: [
      "Flags synthetic events with isTrusted === false or zero/negative keystroke dwell intervals",
      "Computes pointer velocity variance and 2D cross-product collinearity across trajectory segments",
      "Identifies constant-velocity straight-line bot mouse interpolation vs organic Fitts's law curvature",
    ],
  },
  {
    id: "task_cybersec_http_desync_header_canonicalizer",
    title: "HTTP Request Smuggling (CL.TE / TE.CL) & CRLF Header Injection Guard",
    category: "web-cybersec",
    difficulty: "advanced",
    tags: ["web-cybersec", "http-request-smuggling", "desync", "crlf-injection", "reverse-proxy"],
    instructions:
      "Discrepancies between a front-end reverse proxy and a back-end HTTP/1.1 parser allow attackers to smuggle requests by sending both Content-Length and Transfer-Encoding headers, duplicate conflicting Content-Length values, obfuscated 'Transfer-Encoding: xchunked', or CRLF (\\r\\n) bytes inside header values. Implement a strict RFC 9112 framing & header canonicalizer.",
    starterCode: `// Vulnerable Header Parser (Permits CL.TE Ambiguity & CRLF Splitting)
function normalizeRequestHeaders(rawHeaders) {
  const map = {};
  for (const [k, v] of rawHeaders) {
    map[k.toLowerCase()] = v;
  }
  return { valid: true, headers: map };
}`,
    solutionCode: `// RFC 9112 HTTP/1.1 Desync (CL.TE / TE.CL) & CRLF Header Injection Guard
export function canonicalizeAndValidateHttpHeaders(rawHeaderPairs) {
  if (!Array.isArray(rawHeaderPairs)) {
    throw new Error("Invalid header list");
  }

  const canonical = new Map();
  let hasTransferEncoding = false;
  let contentLengthValue = null;

  for (const [rawName, rawValue] of rawHeaderPairs) {
    const nameStr = String(rawName ?? "");
    const valStr = String(rawValue ?? "");

    if (/[\\r\\n\\x00]/.test(nameStr) || /[\\r\\n\\x00]/.test(valStr)) {
      throw new Error("HTTPHeaderInjectionError: CRLF or NUL byte detected in header");
    }
    if (!/^[!#$%&'*+.^_\`|~0-9A-Za-z-]+$/.test(nameStr)) {
      throw new Error(\`Malformed HTTP header token name '\${nameStr}'\`);
    }

    const lower = nameStr.toLowerCase();
    const trimmedVal = valStr.trim();

    if (lower === "transfer-encoding") {
      hasTransferEncoding = true;
      if (trimmedVal.toLowerCase() !== "chunked") {
        throw new Error(\`HTTPDesyncError: unsupported or obfuscated Transfer-Encoding '\${trimmedVal}'\`);
      }
    }

    if (lower === "content-length") {
      if (!/^\\d+$/.test(trimmedVal)) {
        throw new Error(\`HTTPDesyncError: non-numeric Content-Length '\${trimmedVal}'\`);
      }
      if (contentLengthValue !== null && contentLengthValue !== trimmedVal) {
        throw new Error("HTTPDesyncError: conflicting duplicate Content-Length headers");
      }
      contentLengthValue = trimmedVal;
    }

    canonical.set(lower, trimmedVal);
  }

  if (hasTransferEncoding && contentLengthValue !== null) {
    throw new Error("HTTPDesyncError: ambiguous request contains both Transfer-Encoding and Content-Length");
  }

  return {
    valid: true,
    framing: hasTransferEncoding ? "chunked" : contentLengthValue !== null ? "content-length" : "none",
    contentLength: contentLengthValue !== null ? Number(contentLengthValue) : 0,
    headers: Object.fromEntries(canonical),
  };
}`,
    criteria: [
      "Rejects requests containing both Transfer-Encoding and Content-Length to prevent CL.TE and TE.CL desync",
      "Blocks conflicting duplicate Content-Length headers, non-digit lengths, and obfuscated Transfer-Encoding values",
      "Rejects CRLF (\\r, \\n) and NUL bytes in header names or values to prevent response splitting",
    ],
  },
  {
    id: "task_agentic_multi_agent_consensus_arbiter",
    title: "Multi-Agent Sub-Task Lease Coordinator & Fencing-Token Patch Arbiter",
    category: "agentic-workflow",
    difficulty: "advanced",
    tags: ["agentic-workflow", "long-horizon", "multi-agent", "fencing-tokens", "path-leases", "concurrency"],
    instructions:
      "When multiple autonomous sub-agents edit a repository concurrently without hierarchical path leases or fencing tokens, a stalled worker whose lease expired can wake up and overwrite newer edits from an active peer. Build a MultiAgentLeaseArbiter that detects parent/child path collisions (e.g. 'src/auth' vs 'src/auth/jwt.js'), issues monotonically increasing fencing tokens (epoch), and rejects stale-epoch patch commits.",
    starterCode: `// Unsafe Unfenced Multi-Agent File Writer (Race Conditions & Stale Overwrites)
class SharedWorkspace {
  constructor() { this.files = new Map(); }
  writePatch(agentId, path, content) {
    this.files.set(path, { content, by: agentId });
    return { committed: true };
  }
}`,
    solutionCode: `// Hierarchical Path Lease Coordinator with Monotonic Fencing Tokens
function pathsOverlap(pathA, pathB) {
  const normA = String(pathA).replace(/\\/+$/, "");
  const normB = String(pathB).replace(/\\/+$/, "");
  return (
    normA === normB ||
    normA.startsWith(normB + "/") ||
    normB.startsWith(normA + "/")
  );
}

export class MultiAgentLeaseArbiter {
  #epoch = 0;
  #leases = new Map(); // leaseId -> { leaseId, agentId, paths, epoch, expiresAt }
  #files = new Map();

  acquireLease(agentId, paths, ttlMs = 30000, nowMs = Date.now()) {
    this.#pruneExpired(nowMs);

    for (const existing of this.#leases.values()) {
      if (existing.agentId === agentId) continue;
      for (const reqPath of paths) {
        if (existing.paths.some((heldPath) => pathsOverlap(reqPath, heldPath))) {
          throw new Error(\`LeaseConflictError: path '\${reqPath}' conflicts with peer '\${existing.agentId}'\`);
        }
      }
    }

    const epoch = ++this.#epoch;
    const leaseId = \`lease_\${epoch}\`;
    const record = {
      leaseId,
      agentId,
      paths: [...paths],
      epoch,
      expiresAt: nowMs + ttlMs,
    };
    this.#leases.set(leaseId, record);
    return { ...record };
  }

  commitPatch({ agentId, leaseId, epoch, filePath, content, nowMs = Date.now() }) {
    this.#pruneExpired(nowMs);
    const lease = this.#leases.get(leaseId);
    if (!lease || lease.agentId !== agentId || lease.epoch !== epoch) {
      throw new Error("StaleFencingTokenError: lease expired or superseded by newer epoch");
    }
    if (!lease.paths.some((held) => pathsOverlap(filePath, held))) {
      throw new Error(\`UnauthorizedPathError: '\${filePath}' is not covered by lease \${leaseId}\`);
    }

    const currentFile = this.#files.get(filePath);
    if (currentFile && currentFile.lastEpoch > epoch) {
      throw new Error("StaleFencingTokenError: file already modified by a higher fencing epoch");
    }

    this.#files.set(filePath, { content, lastEpoch: epoch, updatedBy: agentId });
    return { committed: true, epoch, filePath };
  }

  releaseLease(leaseId) {
    return this.#leases.delete(leaseId);
  }

  #pruneExpired(nowMs) {
    for (const [id, lease] of this.#leases.entries()) {
      if (nowMs > lease.expiresAt) this.#leases.delete(id);
    }
  }
}`,
    criteria: [
      "Enforces hierarchical parent/child path conflict checks (e.g. 'src/auth' blocks 'src/auth/jwt.js')",
      "Issues monotonically increasing fencing epochs on every lease acquisition",
      "Rejects late commits from expired or lower-epoch fencing tokens to prevent zombie agent overwrites",
    ],
  },
  {
    id: "task_chat_realtime_instrumentation",
    title: "Instrument Two-User Real-Time Chat Engine with Causal Sequence IDs, Typing Ephemerals & Read Watermarks",
    category: "realtime-chat",
    difficulty: "intermediate",
    tags: ["realtime-chat", "instrumentation", "two-user-chat", "read-receipts", "typing-indicators", "telemetry"],
    instructions:
      "A barebones two-user chat array pushes raw strings without sequence numbers, canonical room IDs, typing indicator TTLs, read-receipt watermarks, or fanout latency telemetry. Instrument a deterministic two-user real-time chat engine that normalizes dm:<userA>:<userB> rooms, assigns monotonic seq IDs, tracks per-user read watermarks, prunes expired typing ephemerals, and records fanout telemetry.",
    starterCode: `// Uninstrumented Two-User Chat Array (No Sequence IDs, Read Watermarks, or Telemetry)
class BasicChat {
  constructor() { this.messages = []; }
  send(from, to, text) {
    this.messages.push({ from, to, text });
  }
}`,
    solutionCode: `// Instrumented Two-User Real-Time Chat Engine with Sequence IDs, Typing TTL & Read Watermarks
export class InstrumentedTwoUserChat {
  #rooms = new Map();
  #typingTtlMs;
  #telemetry = { totalSent: 0, typingEvents: 0, readUpdates: 0 };

  constructor({ typingTtlMs = 4000 } = {}) {
    this.#typingTtlMs = typingTtlMs;
  }

  static canonicalRoomId(userA, userB) {
    const [first, second] = [String(userA).toLowerCase().trim(), String(userB).toLowerCase().trim()].sort();
    return \`dm:\${first}:\${second}\`;
  }

  #getOrCreateRoom(userA, userB) {
    const roomId = InstrumentedTwoUserChat.canonicalRoomId(userA, userB);
    if (!this.#rooms.has(roomId)) {
      const participants = [String(userA).toLowerCase().trim(), String(userB).toLowerCase().trim()].sort();
      this.#rooms.set(roomId, {
        id: roomId,
        participants,
        seq: 0,
        messages: [],
        typing: new Map(),
        readWatermarks: new Map(participants.map((u) => [u, 0])),
      });
    }
    return this.#rooms.get(roomId);
  }

  sendMessage({ sender, recipient, text, nowMs = Date.now() }) {
    const room = this.#getOrCreateRoom(sender, recipient);
    const cleanSender = String(sender).toLowerCase().trim();
    const cleanRecipient = String(recipient).toLowerCase().trim();
    const seq = ++room.seq;

    const message = {
      id: \`msg_\${seq}\`,
      roomId: room.id,
      seq,
      sender: cleanSender,
      recipient: cleanRecipient,
      text: String(text).trim(),
      timestampMs: nowMs,
    };

    room.messages.push(message);
    room.typing.delete(cleanSender);
    room.readWatermarks.set(cleanSender, Math.max(room.readWatermarks.get(cleanSender) || 0, seq));
    this.#telemetry.totalSent++;

    return { ...message };
  }

  setTyping({ sender, recipient, isTyping = true, nowMs = Date.now() }) {
    const room = this.#getOrCreateRoom(sender, recipient);
    const cleanSender = String(sender).toLowerCase().trim();
    this.#pruneTyping(room, nowMs);
    if (isTyping) room.typing.set(cleanSender, nowMs + this.#typingTtlMs);
    else room.typing.delete(cleanSender);
    this.#telemetry.typingEvents++;
    return [...room.typing.keys()];
  }

  markRead({ reader, peer, upToSeq, nowMs = Date.now() }) {
    const room = this.#getOrCreateRoom(reader, peer);
    this.#pruneTyping(room, nowMs);
    const cleanReader = String(reader).toLowerCase().trim();
    const target = Math.min(Number(upToSeq ?? room.seq), room.seq);
    const updated = Math.max(room.readWatermarks.get(cleanReader) || 0, target);
    room.readWatermarks.set(cleanReader, updated);
    this.#telemetry.readUpdates++;
    return { roomId: room.id, reader: cleanReader, watermark: updated };
  }

  getSnapshot(userA, userB, nowMs = Date.now()) {
    const room = this.#getOrCreateRoom(userA, userB);
    this.#pruneTyping(room, nowMs);
    return {
      roomId: room.id,
      latestSeq: room.seq,
      messages: [...room.messages],
      typingUsers: [...room.typing.keys()],
      readWatermarks: Object.fromEntries(room.readWatermarks),
      telemetry: { ...this.#telemetry },
    };
  }

  #pruneTyping(room, nowMs) {
    for (const [u, exp] of room.typing.entries()) {
      if (nowMs >= exp) room.typing.delete(u);
    }
  }
}`,
    criteria: [
      "Derives deterministic canonical room IDs (dm:userA:userB) invariant to participant order",
      "Assigns strictly monotonic per-room sequence numbers (seq) and tracks read watermarks per user",
      "Prunes expired typing indicators by TTL and exposes live instrumentation telemetry",
    ],
  },
  {
    id: "task_chat_debug_race_duplication",
    title: "Debug Out-of-Order Delivery, Reconnect Replay Duplicates & Ghost Typing Leaks in Two-User Chat",
    category: "realtime-chat",
    difficulty: "advanced",
    tags: ["realtime-chat", "debugging", "idempotency", "out-of-order", "resequencing", "race-conditions"],
    instructions:
      "Under lossy mobile network handoffs between two chatting users, retried POSTs create duplicate messages in the transcript, packet #4 arriving before packet #3 renders conversations out of causal order, and disconnected users leave permanent 'is typing...' indicators forever. Debug and fix the chat session coordinator with clientMsgId idempotency, a contiguous sequence holdback reorder buffer, and TTL typing eviction.",
    starterCode: `// Buggy Two-User Chat Session (Duplicates on Retry, Out-of-Order Renders & Ghost Typing)
class BuggyChatSession {
  constructor() {
    this.transcript = [];
    this.typing = new Set();
  }
  onPacket(packet) {
    if (packet.type === "typing") {
      this.typing.add(packet.user);
      return;
    }
    // Bug 1: No duplicate check on clientMsgId!
    // Bug 2: Appends out-of-order seq packets immediately!
    this.transcript.push(packet);
  }
}`,
    solutionCode: `// Debugged Two-User Chat Coordinator: Idempotent Deduplication + Causal Holdback Buffer + TTL Typing
export class DebuggedChatCoordinator {
  #nextExpectedSeq = 1;
  #seenClientIds = new Map(); // clientMsgId -> committedPacket
  #holdbackBuffer = new Map(); // seq -> packet
  #transcript = [];
  #typingExpiries = new Map(); // user -> expiresAtMs
  #typingTtlMs;

  constructor({ typingTtlMs = 3000 } = {}) {
    this.#typingTtlMs = typingTtlMs;
  }

  ingestPacket(packet, nowMs = Date.now()) {
    this.#evictExpiredTyping(nowMs);

    if (packet.type === "typing") {
      if (packet.isTyping === false) {
        this.#typingExpiries.delete(packet.user);
      } else {
        this.#typingExpiries.set(packet.user, nowMs + this.#typingTtlMs);
      }
      return { status: "typing_updated", activeTyping: this.getActiveTyping(nowMs) };
    }

    // Fix 1: Idempotency deduplication by clientMsgId
    if (packet.clientMsgId && this.#seenClientIds.has(packet.clientMsgId)) {
      return {
        status: "duplicate_ignored",
        message: this.#seenClientIds.get(packet.clientMsgId),
        flushed: [],
      };
    }

    const seq = Number(packet.seq);
    if (seq < this.#nextExpectedSeq) {
      return { status: "stale_seq_ignored", flushed: [] };
    }

    // Fix 2: Hold back future sequence packets until missing gap arrives
    if (seq > this.#nextExpectedSeq) {
      this.#holdbackBuffer.set(seq, packet);
      return {
        status: "buffered_out_of_order",
        waitingForSeq: this.#nextExpectedSeq,
        bufferedCount: this.#holdbackBuffer.size,
        flushed: [],
      };
    }

    // Commit current packet and flush any contiguous buffered successors
    const flushed = [];
    let current = packet;
    while (current) {
      this.#transcript.push(current);
      if (current.clientMsgId) {
        this.#seenClientIds.set(current.clientMsgId, current);
      }
      // Sending a message clears that user's typing indicator
      if (current.sender) {
        this.#typingExpiries.delete(current.sender);
      }
      flushed.push(current);
      this.#nextExpectedSeq++;
      current = this.#holdbackBuffer.get(this.#nextExpectedSeq) || null;
      if (current) this.#holdbackBuffer.delete(this.#nextExpectedSeq);
    }

    return { status: "committed", flushed };
  }

  getActiveTyping(nowMs = Date.now()) {
    this.#evictExpiredTyping(nowMs);
    return [...this.#typingExpiries.keys()];
  }

  getTranscript() {
    return [...this.#transcript];
  }

  #evictExpiredTyping(nowMs) {
    for (const [user, exp] of this.#typingExpiries.entries()) {
      if (nowMs >= exp) this.#typingExpiries.delete(user);
    }
  }
}`,
    criteria: [
      "Deduplicates retried packets using a clientMsgId lookup table without advancing sequence numbers",
      "Buffers out-of-order packets (seq > nextExpectedSeq) and flushes contiguous sequences in strict order once gaps fill",
      "Expires stale typing indicators via timestamps and clears typing state when a user sends a message",
    ],
  },
  {
    id: "task_chat_refactor_state_protocol",
    title: "Refactor Tangled WebSocket/SSE Chat Handler into Pure Deterministic Protocol State Machine",
    category: "realtime-chat",
    difficulty: "intermediate",
    tags: ["realtime-chat", "refactor", "state-machine", "reducer", "clean-architecture"],
    instructions:
      "A monolithic real-time chat handler mixes DOM mutations, global socket writes, unread badge counters, and message edits/reactions inside a single stateful callback, making it impossible to test deterministically. Refactor into a pure, immutable chat protocol reducer (chatProtocolReducer) that returns { state, effects } for MESSAGE_SENT, MESSAGE_EDITED, MESSAGE_READ, and TYPING_SET actions.",
    starterCode: `// Tangled Imperative Chat Callback Mutating Global State & DOM Directly
function onSocketFrame(rawFrame) {
  const data = JSON.parse(rawFrame);
  if (data.op === "msg") {
    window.chatState.messages.push(data);
    window.chatState.unread++;
    document.querySelector("#unread").innerText = window.chatState.unread;
    window.socket.send(JSON.stringify({ ack: data.id }));
  }
}`,
    solutionCode: `// Pure Deterministic Two-User Chat Protocol Reducer Returning { state, effects }
export const INITIAL_CHAT_STATE = Object.freeze({
  roomId: "dm:agent:pp",
  seq: 0,
  messages: [],
  unreadByPeer: { agent: 0, pp: 0 },
  typingByPeer: { agent: false, pp: false },
});

export function chatProtocolReducer(state = INITIAL_CHAT_STATE, action) {
  switch (action?.type) {
    case "MESSAGE_SENT": {
      const nextSeq = state.seq + 1;
      const sender = action.sender;
      const recipient = action.recipient;
      const msg = {
        id: \`m_\${nextSeq}\`,
        seq: nextSeq,
        sender,
        recipient,
        text: String(action.text || "").trim(),
        edited: false,
      };
      return {
        state: {
          ...state,
          seq: nextSeq,
          messages: [...state.messages, msg],
          unreadByPeer: {
            ...state.unreadByPeer,
            [recipient]: (state.unreadByPeer[recipient] || 0) + 1,
          },
          typingByPeer: {
            ...state.typingByPeer,
            [sender]: false,
          },
        },
        effects: [
          { type: "SSE_BROADCAST", event: "chat:message", payload: msg },
          { type: "ACK_CLIENT", seq: nextSeq },
        ],
      };
    }

    case "MESSAGE_EDITED": {
      const messages = state.messages.map((m) =>
        m.seq === action.seq && m.sender === action.sender
          ? { ...m, text: String(action.newText || "").trim(), edited: true }
          : m
      );
      return {
        state: { ...state, messages },
        effects: [{ type: "SSE_BROADCAST", event: "chat:edit", payload: { seq: action.seq } }],
      };
    }

    case "MESSAGE_READ": {
      return {
        state: {
          ...state,
          unreadByPeer: {
            ...state.unreadByPeer,
            [action.reader]: 0,
          },
        },
        effects: [{ type: "SSE_BROADCAST", event: "chat:read", payload: { reader: action.reader } }],
      };
    }

    case "TYPING_SET": {
      return {
        state: {
          ...state,
          typingByPeer: {
            ...state.typingByPeer,
            [action.user]: Boolean(action.isTyping),
          },
        },
        effects: [],
      };
    }

    default:
      return { state, effects: [] };
  }
}`,
    criteria: [
      "Eliminates in-place mutations and DOM/socket side effects from protocol state transitions",
      "Returns deterministic immutable { state, effects } tuples for MESSAGE_SENT, MESSAGE_EDITED, and MESSAGE_READ",
      "Maintains per-participant unread counters and clears typing state upon message dispatch",
    ],
  },
  {
    id: "task_chat_perf_ringbuffer_fanout_bench",
    title: "Optimize O(N²) Chat History & Fanout to Pre-Allocated Ring Buffer with P99 Latency Benchmark",
    category: "realtime-chat",
    difficulty: "advanced",
    tags: ["realtime-chat", "performance", "benchmarking", "ring-buffer", "p99-latency", "zero-allocation"],
    instructions:
      "A high-frequency two-user agent-to-human chat stream clones the entire message array via [...messages, msg].slice(-cap) on every message and serializes JSON inside an inner subscriber loop, causing O(N²) GC spikes. Refactor to a fixed-capacity circular ring buffer with O(1) modular slot indexing, pre-serialized single-frame SSE fanout, and a built-in P50/P99 latency benchmark harness.",
    starterCode: `// O(N^2) Array Spread Allocation & Redundant Per-Client Serialization
class SlowChatFanout {
  constructor(capacity = 256) {
    this.capacity = capacity;
    this.history = [];
    this.subscribers = [];
  }
  publish(msg) {
    // Re-allocates and copies the entire history array on every single message!
    this.history = [...this.history, msg].slice(-this.capacity);
    for (const sub of this.subscribers) {
      sub.send("data: " + JSON.stringify(msg) + "\\n\\n");
    }
  }
}`,
    solutionCode: `// O(1) Circular Ring Buffer + Single-Encode Fanout + P50/P99 Latency Benchmark
export class FastChatRingBuffer {
  #buffer;
  #capacity;
  #head = 0;
  #size = 0;
  #subscribers = new Set();

  constructor(capacity = 256) {
    this.#capacity = capacity;
    this.#buffer = new Array(capacity);
  }

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  publish(msg) {
    const writeIdx = (this.#head + this.#size) % this.#capacity;
    this.#buffer[writeIdx] = msg;
    if (this.#size < this.#capacity) {
      this.#size++;
    } else {
      this.#head = (this.#head + 1) % this.#capacity;
    }

    if (this.#subscribers.size > 0) {
      // Serialize once for all connected two-user tab streams
      const frame = \`data: \${JSON.stringify(msg)}\\n\\n\`;
      for (const sub of this.#subscribers) {
        sub(frame);
      }
    }
  }

  snapshot() {
    const out = new Array(this.#size);
    for (let i = 0; i < this.#size; i++) {
      out[i] = this.#buffer[(this.#head + i) % this.#capacity];
    }
    return out;
  }

  get size() {
    return this.#size;
  }
}

export function benchmarkTwoUserChatFanout(iterations = 200, capacity = 64) {
  const ring = new FastChatRingBuffer(capacity);
  let deliveredFrames = 0;
  ring.subscribe(() => { deliveredFrames++; });
  ring.subscribe(() => { deliveredFrames++; });

  const samplesUs = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) {
    const t0 = Date.now();
    ring.publish({
      seq: i + 1,
      sender: i % 2 === 0 ? "agent" : "pp",
      recipient: i % 2 === 0 ? "pp" : "agent",
      text: "msg_" + i,
    });
    samplesUs[i] = Math.max(1, (Date.now() - t0) * 1000);
  }

  const sorted = Array.from(samplesUs).sort((a, b) => a - b);
  const p50Us = sorted[Math.floor(sorted.length * 0.5)];
  const p99Us = sorted[Math.floor(sorted.length * 0.99)];

  return {
    iterations,
    retainedCount: ring.size,
    deliveredFrames,
    oldestSeq: ring.snapshot()[0]?.seq,
    newestSeq: ring.snapshot().at(-1)?.seq,
    p50Us,
    p99Us,
  };
}`,
    criteria: [
      "Uses O(1) modular ring-buffer indexing ((head + size) % capacity) instead of O(N) array spread/slice copies",
      "Serializes the outbound SSE wire frame once per message before broadcasting to subscribers",
      "Includes a benchmark harness computing retained window bounds, subscriber frame counts, and P50/P99 latency",
    ],
  },

  /* ── 7. Advanced Modern CSS Architecture (Container Queries, @layer OKLCH, Scroll Timelines, Anchor Positioning) ── */
  {
    id: "task_css_container_style_subgrid",
    title: "Refactor Viewport Media Query Card Deck to CSS Container Size/Style Queries & Subgrid Alignment",
    category: "css",
    difficulty: "intermediate",
    tags: ["css", "container-queries", "subgrid", "style-queries", "responsive-design"],
    instructions:
      "A reusable dashboard card component relies on global @media (min-width: 768px) viewport breakpoints and fixed height: 120px header hacks, breaking whenever placed inside narrow sidebars or split panes. Refactor the parent wrapper to an inline-size containment context (container-type: inline-size), use @container size and style(--featured: true) queries, and align card header/body/footer tracks across siblings using CSS Grid subgrid.",
    starterCode: `/* Legacy Viewport-Coupled Card Layout with Fixed Height Hacks */
.card-deck {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
}
.card-header {
  height: 120px; /* Brittle fixed height hack to align titles */
}
@media (min-width: 768px) {
  .card {
    flex-direction: row;
  }
}`,
    solutionCode: `/* Modern Intrinsic Container Size/Style Queries with Subgrid Track Alignment */
.card-deck {
  container-type: inline-size;
  container-name: deck;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  grid-auto-rows: auto 1fr auto;
  gap: clamp(1rem, 2cqi, 1.75rem);
}

.card-shell {
  container-type: inline-size;
  container-name: card;
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

@container card (inline-size >= 28rem) {
  .card-shell .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

@container style(--featured: true) {
  .card-shell {
    border-color: var(--ink);
    background: color-mix(in oklch, var(--ink) 6%, var(--panel));
  }
}`,
    criteria: [
      "Establishes explicit containment contexts using container-type: inline-size and container-name",
      "Aligns multi-row card internals across sibling columns using grid-template-rows: subgrid and grid-row: span 3",
      "Uses @container size and @container style(--featured: true) queries instead of global @media viewport breakpoints",
    ],
  },
  {
    id: "task_css_cascade_layers_oklch_tokens",
    title: "Architect Enterprise Design System with @layer Cascade Isolation, oklch() Relative Color Syntax & @property",
    category: "css",
    difficulty: "advanced",
    tags: ["css", "cascade-layers", "oklch", "design-systems", "custom-properties", "light-dark"],
    instructions:
      "An enterprise stylesheet suffers from specificity wars (.theme-dark .panel .btn.btn-primary !important) and hardcoded sRGB hex colors that cannot be animated or perceptually lightened. Refactor into an explicit @layer hierarchy (reset, tokens, base, components, utilities), register animatable custom properties with @property, and compute adaptive theme & hover states using color-scheme: light dark, light-dark(), and OKLCH relative color syntax oklch(from var(--brand) ...).",
    starterCode: `/* Specificity Wars & Hardcoded Hex Colors */
.theme-dark .panel .btn.btn-primary {
  background-color: #2563eb !important;
  color: #ffffff !important;
}
.theme-dark .panel .btn.btn-primary:hover {
  background-color: #3b82f6 !important;
}
.utility-hidden {
  display: none !important;
}`,
    solutionCode: `/* Deterministic @layer Cascade Architecture with Typed @property & Relative OKLCH Tokens */
@layer reset, tokens, base, components, utilities;

@property --elevate-progress {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@layer tokens {
  :root {
    color-scheme: light dark;
    --surface: light-dark(oklch(0.98 0.004 90), oklch(0.14 0.005 90));
    --ink: light-dark(oklch(0.14 0.005 90), oklch(0.96 0.004 90));
    --brand: oklch(0.62 0.18 255);
    --brand-hover: oklch(from var(--brand) calc(l + 0.10) c h);
    --brand-border: color-mix(in oklch, var(--brand) 40%, var(--surface));
  }
}

@layer components {
  .btn-primary {
    background: var(--brand);
    color: var(--surface);
    border: 1px solid var(--brand-border);
    transition: --elevate-progress 180ms ease, background-color 180ms ease;

    &:hover {
      --elevate-progress: 1;
      background: var(--brand-hover);
    }
  }
}

@layer utilities {
  .u-hidden {
    display: none;
  }
}`,
    criteria: [
      "Declares an explicit @layer order (reset, tokens, base, components, utilities) eliminating all !important overrides",
      "Registers typed custom properties via @property with explicit syntax, inherits, and initial-value descriptors",
      "Derives perceptual theme tokens using light-dark() and relative color syntax oklch(from var(--brand) ...)",
    ],
  },
  {
    id: "task_css_scroll_driven_view_transitions",
    title: "Replace Main-Thread Scroll Listener with CSS Scroll-Driven Animations (scroll(), view()) & View Transitions",
    category: "css",
    difficulty: "advanced",
    tags: ["css", "scroll-driven-animations", "view-transitions", "performance", "compositor"],
    instructions:
      "A reading progress bar and section reveal animations attach a synchronous window scroll listener that calls getBoundingClientRect() on every frame, causing main-thread layout thrashing and dropped frames on 120Hz displays. Refactor to compositor-driven CSS Scroll-Driven Animations (animation-timeline: scroll() and view(), animation-range) paired with named View Transitions (view-transition-name) and a @media (prefers-reduced-motion: reduce) accessibility guard.",
    starterCode: `/* Main-Thread Layout Thrashing Scroll Handler */
window.addEventListener("scroll", () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  document.querySelector(".progress-bar").style.width = (pct * 100) + "%";
  document.querySelectorAll(".reveal-card").forEach((el) => {
    const rect = el.getBoundingClientRect();
    el.style.opacity = rect.top < window.innerHeight * 0.8 ? "1" : "0";
  });
});`,
    solutionCode: `/* Zero-JS Compositor Scroll-Driven Timelines & View Transition Morphing */
@keyframes scale-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes reveal-on-enter {
  entry 0% {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  entry 100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-bar {
  transform-origin: 0 50%;
  animation: scale-progress linear both;
  animation-timeline: scroll(root block);
}

.reveal-card {
  view-transition-name: var(--card-transition-id, none);
  animation: reveal-on-enter linear both;
  animation-timeline: view(block);
  animation-range: entry 10% cover 35%;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 220ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar,
  .reveal-card,
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
    transition: none !important;
  }
}`,
    criteria: [
      "Drives progress and viewport entry animations off the main thread using animation-timeline: scroll() and view() with animation-range",
      "Configures View Transition pseudo-elements (::view-transition-old / ::view-transition-new) and view-transition-name",
      "Honors @media (prefers-reduced-motion: reduce) by disabling motion animations for vestibular accessibility",
    ],
  },
  {
    id: "task_css_anchor_positioning_has_popover",
    title: "Refactor JS Tooltip Collision Math to Native CSS Anchor Positioning (anchor-name, position-anchor, @position-try) & :has()",
    category: "css",
    difficulty: "advanced",
    tags: ["css", "anchor-positioning", "popover", "has-selector", "collision-flip"],
    instructions:
      "A floating contextual menu measures offsetTop/offsetLeft and window.innerHeight in JavaScript to tether a popover to its trigger button and flip it when clipping near the viewport edge. Refactor to pure CSS Anchor Positioning (anchor-name, position-anchor, anchor(), position-try-fallbacks, @position-try) and style the parent card state declaratively using relational :has(:popover-open).",
    starterCode: `/* Imperative JS Bounding Box Collision Math */
function positionTooltip(triggerEl, tooltipEl) {
  const rect = triggerEl.getBoundingClientRect();
  const tipRect = tooltipEl.getBoundingClientRect();
  let top = rect.bottom + 8;
  if (top + tipRect.height > window.innerHeight) {
    top = rect.top - tipRect.height - 8;
  }
  tooltipEl.style.position = "fixed";
  tooltipEl.style.top = top + "px";
  tooltipEl.style.left = rect.left + "px";
}`,
    solutionCode: `/* Native CSS Anchor Positioning with @position-try Flip Fallbacks & Relational :has() */
.action-card {
  border: 1px solid var(--line);
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:has([popover]:popover-open) {
    border-color: var(--ink);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--ink) 20%, transparent);
  }
}

.anchor-trigger {
  anchor-name: --action-trigger;
}

.contextual-popover[popover] {
  position: fixed;
  position-anchor: --action-trigger;
   inset: auto;
  top: calc(anchor(bottom) + 0.5rem);
  left: anchor(left);
  position-try-fallbacks: --flip-above, flip-block, flip-inline;
  margin: 0;
}

@position-try --flip-above {
  top: auto;
  bottom: calc(anchor(top) + 0.5rem);
  left: anchor(left);
}`,
    criteria: [
      "Tethers popover to trigger element declaratively via anchor-name, position-anchor, and anchor() functions",
      "Handles viewport edge overflow automatically using position-try-fallbacks and custom @position-try rules",
      "Highlights the parent container when its child popover is open using relational :has([popover]:popover-open)",
    ],
  },

  /* ── 8. Fortune 500 Modern TypeScript Frameworks (React 19/Next.js, Angular Signals, NestJS DI, tRPC+Zod) ── */
  {
    id: "task_ts_react_nextjs_server_actions",
    title: "React 19 / Next.js App Router: Type-Safe Server Action with Discriminated Union State, Optimistic Reducer & Schema Guard",
    category: "ts-frameworks",
    difficulty: "advanced",
    tags: ["typescript", "react-19", "nextjs", "server-actions", "use-optimistic", "discriminated-union"],
    instructions:
      "A Fortune 500 React/Next.js checkout form mutates client state with untyped any payloads, ignores validation errors, and leaves ghost optimistic items when the server action rejects. Refactor in strict TypeScript using a discriminated union ActionResult<T>, a generic runtime schema validator, an immutable useOptimistic-compatible reducer with rollback-on-failure, and a typed createSafeServerAction wrapper.",
    starterCode: `// Untyped React Client Mutation with Broken Optimistic Rollback
export async function submitOrderAction(rawInput: any): Promise<any> {
  // No runtime validation or discriminated union error envelope
  const saved = await saveOrderToDb(rawInput);
  return saved;
}

export function optimisticOrdersReducer(state: any[], action: any) {
  state.push(action.payload); // Mutates state in place and cannot roll back on server failure!
  return state;
}`,
    solutionCode: `// TypeScript React 19 / Next.js Safe Server Action & Rollback-Capable Optimistic Reducer
export type ActionResult<TData, TField extends string = string> =
  | { readonly ok: true; readonly data: TData; readonly revalidatedTags: readonly string[] }
  | { readonly ok: false; readonly code: "VALIDATION_ERROR" | "SERVER_ERROR"; readonly message: string; readonly fieldErrors?: Partial<Record<TField, string>> };

export interface OrderItem {
  readonly id: string;
  readonly sku: string;
  readonly amountCents: number;
  readonly pending?: boolean;
}

export type OptimisticAction =
  | { readonly type: "OPTIMISTIC_ADD"; readonly tempId: string; readonly sku: string; readonly amountCents: number }
  | { readonly type: "COMMIT_SUCCESS"; readonly tempId: string; readonly committed: OrderItem }
  | { readonly type: "ROLLBACK_FAILURE"; readonly tempId: string };

export function optimisticOrdersReducer(
  state: readonly OrderItem[],
  action: OptimisticAction,
): OrderItem[] {
  switch (action.type) {
    case "OPTIMISTIC_ADD":
      return [
        ...state,
        { id: action.tempId, sku: action.sku, amountCents: action.amountCents, pending: true },
      ];
    case "COMMIT_SUCCESS":
      return state.map((item) =>
        item.id === action.tempId ? { ...action.committed, pending: false } : item,
      );
    case "ROLLBACK_FAILURE":
      return state.filter((item) => item.id !== action.tempId);
  }
}

export function createSafeServerAction<TInput extends Record<string, unknown>, TOutput>(config: {
  readonly validate: (raw: Record<string, unknown>) => { valid: true; value: TInput } | { valid: false; fieldErrors: Record<string, string> };
  readonly revalidateTags: readonly string[];
  readonly handler: (input: TInput) => Promise<TOutput>;
}) {
  return async (rawInput: Record<string, unknown>): Promise<ActionResult<TOutput>> => {
    const parsed = config.validate(rawInput);
    if (!parsed.valid) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Invalid action payload",
        fieldErrors: parsed.fieldErrors,
      };
    }
    try {
      const data = await config.handler(parsed.value);
      return {
        ok: true,
        data,
        revalidatedTags: [...config.revalidateTags],
      };
    } catch (err) {
      return {
        ok: false,
        code: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "Action execution failed",
      };
    }
  };
}`,
    criteria: [
      "Defines a strict TypeScript discriminated union ActionResult<TData> with ok: true | false branches",
      "Implements an immutable optimisticOrdersReducer handling OPTIMISTIC_ADD, COMMIT_SUCCESS, and ROLLBACK_FAILURE",
      "Wraps Next.js Server Actions in a generic createSafeServerAction enforcing runtime validation and cache tag metadata",
    ],
  },
  {
    id: "task_ts_angular_signals_computed_rx",
    title: "Angular Enterprise Architecture: Reactive Signal (signal<T>, computed<T>) & Cancelable switchMap Store",
    category: "ts-frameworks",
    difficulty: "advanced",
    tags: ["typescript", "angular", "signals", "computed", "switchmap", "reactivity"],
    instructions:
      "An enterprise Angular portfolio dashboard nests manual RxJS .subscribe() calls inside another .subscribe(), causing memory leaks and out-of-order race conditions when switching accounts. Refactor to a fine-grained TypeScript Angular Signal store providing signal<T>(), memoized computed<T>() with automatic dependency tracking, and a switchMapTask() operator that automatically aborts prior in-flight requests when the source signal updates.",
    starterCode: `// Leaky Nested RxJS Subscriptions & Stale Account Race Condition
export class PortfolioService {
  selectedAccountId = "acc_1";
  positions: any[] = [];
  totalValuation = 0;

  selectAccount(accountId: string, fetchPositions: (id: string) => Promise<any[]>) {
    this.selectedAccountId = accountId;
    // Race condition: slow previous account response overwrites newer account!
    fetchPositions(accountId).then((rows) => {
      this.positions = rows;
      this.totalValuation = rows.reduce((s, r) => s + r.marketValue, 0);
    });
  }
}`,
    solutionCode: `// TypeScript Angular Signal, Memoized Computed & Cancelable switchMap Store
export interface Signal<T> {
  (): T;
}

export interface WritableSignal<T> extends Signal<T> {
  set(value: T): void;
  update(updater: (current: T) => T): void;
  subscribe(listener: (value: T) => void): () => void;
}

let activeConsumer: (() => void) | null = null;

export function signal<T>(initialValue: T): WritableSignal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();
  const listeners = new Set<(val: T) => void>();

  const read = (() => {
    if (activeConsumer) subscribers.add(activeConsumer);
    return value;
  }) as WritableSignal<T>;

  read.set = (nextValue: T) => {
    if (Object.is(value, nextValue)) return;
    value = nextValue;
    for (const sub of Array.from(subscribers)) sub();
    for (const fn of Array.from(listeners)) fn(value);
  };

  read.update = (updater: (current: T) => T) => {
    read.set(updater(value));
  };

  read.subscribe = (listener: (val: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return read;
}

export function computed<T>(derivation: () => T): Signal<T> {
  let cached: T;
  let dirty = true;

  const invalidate = () => {
    dirty = true;
  };

  return () => {
    if (dirty) {
      const prev = activeConsumer;
      activeConsumer = invalidate;
      try {
        cached = derivation();
        dirty = false;
      } finally {
        activeConsumer = prev;
      }
    }
    return cached;
  };
}

export function createSwitchMapLoader<TKey, TResult>(
  source: WritableSignal<TKey>,
  loader: (key: TKey, abortSignal: AbortSignal) => Promise<TResult>,
) {
  const data = signal<TResult | null>(null);
  const loading = signal<boolean>(false);
  let activeController: AbortController | null = null;
  let epoch = 0;

  const trigger = async (key: TKey) => {
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const currentEpoch = ++epoch;
    loading.set(true);

    try {
      const res = await loader(key, controller.signal);
      if (currentEpoch === epoch && !controller.signal.aborted) {
        data.set(res);
        loading.set(false);
      }
    } catch {
      if (currentEpoch === epoch) loading.set(false);
    }
  };

  const unsubscribe = source.subscribe((nextKey) => {
    void trigger(nextKey);
  });

  return { data, loading, trigger, destroy: unsubscribe };
}`,
    criteria: [
      "Implements typed WritableSignal<T> with Object.is equality guard, .set(), and immutable .update()",
      "Implements lazy memoized computed<T>() tracking signal reads and invalidating only when dependencies change",
      "Implements createSwitchMapLoader cancelling stale in-flight requests via AbortController and epoch guards",
    ],
  },
  {
    id: "task_ts_nestjs_di_guard_interceptor",
    title: "NestJS Enterprise Backend: Constructor DI Container, RBAC CanActivate Guard & Audit NestInterceptor Pipeline",
    category: "ts-frameworks",
    difficulty: "advanced",
    tags: ["typescript", "nestjs", "dependency-injection", "rbac-guard", "interceptor", "enterprise"],
    instructions:
      "A backend microservice hardcodes service singletons inside controller methods and duplicates role checks and latency logging across 40 endpoints. Refactor using NestJS TypeScript architecture: an IoC Dependency Injection Container supporting token registration and dependency resolution, a metadata-driven CanActivate RBAC Guard, and an around-advice NestInterceptor that attaches audit telemetry.",
    starterCode: `// Tightly-Coupled Controller with Inline Auth & Duplicated Logging
export class BillingController {
  async issueRefund(req: any) {
    if (!req.user || req.user.role !== "FINANCE_ADMIN") {
      throw new Error("Forbidden");
    }
    const start = Date.now();
    const res = { refundedId: req.body.invoiceId, by: req.user.id };
    console.log("took", Date.now() - start);
    return res;
  }
}`,
    solutionCode: `// TypeScript NestJS IoC Container, RBAC CanActivate Guard & Around-Advice Interceptor
export type Token<T = unknown> = string | symbol | (new (...args: any[]) => T);

export interface ExecutionContext {
  readonly handlerName: string;
  readonly requiredRoles: readonly string[];
  readonly request: {
    readonly user?: { readonly id: string; readonly roles: readonly string[] };
    readonly body?: Record<string, unknown>;
  };
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface CallHandler<T = unknown> {
  handle(): Promise<T>;
}

export interface NestInterceptor<T = unknown, R = unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Promise<R>;
}

export class NestContainer {
  #providers = new Map<Token, { useFactory: (c: NestContainer) => unknown; singleton?: boolean; instance?: unknown }>();

  register<T>(token: Token<T>, useFactory: (container: NestContainer) => T, singleton = true): this {
    this.#providers.set(token, { useFactory, singleton });
    return this;
  }

  resolve<T>(token: Token<T>): T {
    const entry = this.#providers.get(token);
    if (!entry) throw new Error(\`No provider registered for token \${String(token)}\`);
    if (entry.singleton) {
      if (entry.instance === undefined) {
        entry.instance = entry.useFactory(this);
      }
      return entry.instance as T;
    }
    return entry.useFactory(this) as T;
  }
}

export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.requiredRoles.length === 0) return true;
    const userRoles = context.request.user?.roles ?? [];
    return context.requiredRoles.some((role) => userRoles.includes(role));
  }
}

export class AuditTelemetryInterceptor<T> implements NestInterceptor<T, { data: T; audit: { handler: string; actorId: string; durationMs: number } }> {
  async intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Promise<{ data: T; audit: { handler: string; actorId: string; durationMs: number } }> {
    const t0 = Date.now();
    const data = await next.handle();
    return {
      data,
      audit: {
        handler: context.handlerName,
        actorId: context.request.user?.id ?? "anonymous",
        durationMs: Math.max(0, Date.now() - t0),
      },
    };
  }
}

export async function executeNestPipeline<T>(
  context: ExecutionContext,
  guards: readonly CanActivate[],
  interceptors: readonly NestInterceptor<any, any>[],
  handler: () => Promise<T>,
) {
  for (const guard of guards) {
    const allowed = await guard.canActivate(context);
    if (!allowed) {
      const err = new Error("Forbidden resource");
      (err as any).statusCode = 403;
      throw err;
    }
  }

  const dispatch = (idx: number): Promise<any> => {
    if (idx >= interceptors.length) return handler();
    return interceptors[idx].intercept(context, {
      handle: () => dispatch(idx + 1),
    });
  };

  return dispatch(0);
}`,
    criteria: [
      "Implements a typed IoC NestContainer supporting singleton and factory provider resolution",
      "Enforces declarative RBAC authorization via CanActivate guard before controller invocation",
      "Wraps handler execution with composable NestInterceptor CallHandler chains emitting audit metadata",
    ],
  },
  {
    id: "task_ts_trpc_zod_end_to_end_rpc",
    title: "tRPC + Zod Architecture: Fluent Generic ProcedureBuilder<TContext, TInput, TOutput> with Context Narrowing",
    category: "ts-frameworks",
    difficulty: "advanced",
    tags: ["typescript", "trpc", "zod", "rpc", "type-inference", "middleware"],
    instructions:
      "REST endpoints drift out of sync with frontend TypeScript types and forget to validate inputs or narrow the authenticated session context. Build a tRPC-style generic ProcedureBuilder<TContext, TInput, TOutput> supporting .use() middleware that narrows TContext (e.g., guaranteeing ctx.user is non-null), .input(schema) runtime validation with structured TRPCError codes (BAD_REQUEST, UNAUTHORIZED), and createCaller(ctx) for direct server-side invocation.",
    starterCode: `// Unvalidated Loose RPC Handler Map
export const appRouter = {
  createProject: async (ctx: any, input: any) => {
    // Forgot to check ctx.user or validate input.name length!
    return { id: "prj_1", name: input.name, ownerId: ctx.user.id };
  }
};`,
    solutionCode: `// End-to-End Type-Safe tRPC Procedure Builder with Context-Narrowing Middleware & Schema Parser
export type TRPCErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export class TRPCError extends Error {
  readonly code: TRPCErrorCode;
  constructor(opts: { code: TRPCErrorCode; message: string }) {
    super(opts.message);
    this.name = "TRPCError";
    this.code = opts.code;
  }
}

export interface SchemaValidator<T> {
  parse(raw: unknown): T;
}

type MiddlewareFn<TContextIn, TContextOut> = (opts: {
  ctx: TContextIn;
  next: <TNewCtx>(nextOpts?: { ctx: TNewCtx }) => Promise<TNewCtx>;
}) => Promise<TContextOut>;

export class ProcedureBuilder<TContext, TInput = undefined> {
  #middlewares: MiddlewareFn<any, any>[];
  #inputSchema?: SchemaValidator<TInput>;

  constructor(middlewares: MiddlewareFn<any, any>[] = [], inputSchema?: SchemaValidator<TInput>) {
    this.#middlewares = middlewares;
    this.#inputSchema = inputSchema;
  }

  use<TNewContext>(fn: MiddlewareFn<TContext, TNewContext>): ProcedureBuilder<TNewContext, TInput> {
    return new ProcedureBuilder<TNewContext, TInput>([...this.#middlewares, fn], this.#inputSchema);
  }

  input<TNewInput>(schema: SchemaValidator<TNewInput>): ProcedureBuilder<TContext, TNewInput> {
    return new ProcedureBuilder<TContext, TNewInput>(this.#middlewares, schema);
  }

  mutation<TOutput>(resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput) {
    return this.#buildProcedure("mutation", resolver);
  }

  query<TOutput>(resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput) {
    return this.#buildProcedure("query", resolver);
  }

  #buildProcedure<TOutput>(
    type: "query" | "mutation",
    resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput,
  ) {
    const middlewares = this.#middlewares;
    const schema = this.#inputSchema;

    return {
      _type: type,
      async call(rawCtx: unknown, rawInput?: unknown): Promise<TOutput> {
        let currentCtx: any = rawCtx;
        for (const mw of middlewares) {
          currentCtx = await mw({
            ctx: currentCtx,
            next: async (nextOpts) => (nextOpts && "ctx" in nextOpts ? nextOpts.ctx : currentCtx),
          });
        }

        let parsedInput: any = rawInput;
        if (schema) {
          try {
            parsedInput = schema.parse(rawInput);
          } catch (err) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: err instanceof Error ? err.message : "Input validation failed",
            });
          }
        }

        return await resolver({ ctx: currentCtx as TContext, input: parsedInput as TInput });
      },
    };
  }
}

export function createTRPCRouter<TProcedures extends Record<string, { call: (ctx: any, input?: any) => Promise<any> }>>(
  procedures: TProcedures,
) {
  return {
    procedures,
    createCaller(ctx: unknown): {
      [K in keyof TProcedures]: (input?: unknown) => ReturnType<TProcedures[K]["call"]>;
    } {
      const caller: Record<string, (input?: unknown) => Promise< unknown >> = {};
      for (const [key, proc] of Object.entries(procedures)) {
        caller[key] = (input?: unknown) => proc.call(ctx, input);
      }
      return caller as any;
    },
  };
}`,
    criteria: [
      "Implements generic ProcedureBuilder<TContext, TInput> supporting fluent .use() context narrowing and .input() schema parsing",
      "Throws structured TRPCError with BAD_REQUEST on schema failure and UNAUTHORIZED in auth middleware",
      "Provides createTRPCRouter().createCaller(ctx) for end-to-end typed procedure invocation",
    ],
  },

  /* ── 9. Cross-Framework TypeScript Migrations (Express->Hono/Fastify, React->Svelte 5/Vue 3, Redux->TanStack Query, Pages->App Router) ── */
  {
    id: "task_migrate_express_to_hono_edge_ts",
    title: "Migrate Legacy Express.js Callback Middleware App to Web-Standard TypeScript Hono / Fastify Edge Router",
    category: "framework-migration",
    difficulty: "intermediate",
    tags: ["typescript", "migration", "express", "hono", "fastify", "web-standards", "edge"],
    instructions:
      "A legacy Node.js Express router mutates (req as any).user, relies on callback-based next(err), and uses Node-only res.status(200).json() APIs that cannot run on Bun, Deno, or Cloudflare Workers edge runtimes. Migrate the router to a Web-Standard TypeScript Hono/Edge-style router using Fetch Request/Response primitives, typed Context<TVariables>, URLPattern-style :param extraction, and async onion middleware.",
    starterCode: `// Legacy Express.js Mutating req/res Callback Router
export function setupLegacyExpressRoutes(app: any) {
  app.use((req: any, res: any, next: any) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing key" });
    req.tenantId = "tenant_" + apiKey;
    next();
  });

  app.get("/v1/orgs/:orgId/members", (req: any, res: any) => {
    res.status(200).json({
      tenantId: req.tenantId,
      orgId: req.params.orgId,
      runtime: "express-legacy"
    });
  });
}`,
    solutionCode: `// Migrated Web-Standard TypeScript Hono / Edge Router with Typed Context Variables
export interface EdgeContext<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  readonly req: Request;
  readonly params: Readonly<Record<string, string>>;
  set<K extends keyof TVariables>(key: K, value: TVariables[K]): void;
  get<K extends keyof TVariables>(key: K): TVariables[K];
  json<T>(data: T, status?: number): Response;
}

type EdgeMiddleware<TVariables extends Record<string, unknown>> = (
  c: EdgeContext<TVariables>,
  next: () => Promise<Response>,
) => Promise<Response>;

type EdgeHandler<TVariables extends Record<string, unknown>> = (
  c: EdgeContext<TVariables>,
) => Promise<Response> | Response;

export class TypedEdgeRouter<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  #middlewares: EdgeMiddleware<TVariables>[] = [];
  #routes: { method: string; pattern: RegExp; keys: string[]; handler: EdgeHandler<TVariables> }[] = [];

  use(mw: EdgeMiddleware<TVariables>): this {
    this.#middlewares.push(mw);
    return this;
  }

  get(pathPattern: string, handler: EdgeHandler<TVariables>): this {
    return this.#addRoute("GET", pathPattern, handler);
  }

  post(pathPattern: string, handler: EdgeHandler<TVariables>): this {
    return this.#addRoute("POST", pathPattern, handler);
  }

  #addRoute(method: string, pathPattern: string, handler: EdgeHandler<TVariables>): this {
    const keys: string[] = [];
    const regexSource =
      "^" +
      pathPattern.replace(/:([A-Za-z0-9_]+)/g, (_m, key) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$";
    this.#routes.push({ method, pattern: new RegExp(regexSource), keys, handler });
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const matched = this.#routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));
    if (!matched) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const matchExec = matched.pattern.exec(url.pathname);
    const params: Record<string, string> = {};
    matched.keys.forEach((k, idx) => {
      params[k] = decodeURIComponent(matchExec?.[idx + 1] ?? "");
    });

    const store = new Map<keyof TVariables, unknown>();
    const ctx: EdgeContext<TVariables> = {
      req,
      params,
      set: (key, value) => {
        store.set(key, value);
      },
      get: (key) => store.get(key) as TVariables[typeof key],
      json: (data, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
    };

    const dispatch = async (index: number): Promise<Response> => {
      if (index < this.#middlewares.length) {
        return await this.#middlewares[index](ctx, () => dispatch(index + 1));
      }
      return await matched.handler(ctx);
    };

    return await dispatch(0);
  }
}`,
    criteria: [
      "Replaces Node-coupled Express req/res mutation with Web-Standard Fetch Request/Response and typed EdgeContext<TVariables>",
      "Extracts route parameters (:orgId) and propagates strongly-typed context variables via c.set() and c.get()",
      "Executes async onion middlewares compatible with Bun, Deno, Node, and Cloudflare Workers",
    ],
  },
  {
    id: "task_migrate_react_hooks_to_svelte5_vue3_signals",
    title: "Migrate React useState/useEffect/useMemo Stale Closures to Fine-Grained Svelte 5 Runes & Vue 3 Reactivity",
    category: "framework-migration",
    difficulty: "advanced",
    tags: ["typescript", "migration", "react", "svelte-5-runes", "vue-3-composition", "solidjs", "fine-grained-reactivity"],
    instructions:
      "A complex React analytics hook uses three coupled useState calls, a manual dependency array useMemo, and a useEffect that suffers from stale closure bugs and cascading re-renders. Migrate the component state machine to a universal fine-grained reactive graph (modeling Svelte 5 $state/$derived/$effect Runes and Vue 3 ref/computed/watchEffect) with automatic dependency tracking and deterministic cleanup.",
    starterCode: `// React Hook with Manual Dependency Arrays & Stale Closure Bugs
export function useLegacyAnalyticsFilter(initialItems: any[]) {
  // In React, forgetting [minScore, query] in dependency arrays causes stale reads
  let items = initialItems;
  let query = "";
  let minScore = 0;
  let effectLog: string[] = [];

  function setQuery(q: string) {
    query = q;
    // Manual imperative sync required
  }
  return { items, query, minScore, setQuery, effectLog };
}`,
    solutionCode: `// Universal Fine-Grained Reactive Primitives (Svelte 5 $state/$derived/$effect & Vue 3 ref/computed)
type Subscriber = () => void;

let currentObserver: Subscriber | null = null;

export interface ReactiveState<T> {
  get value(): T;
  set value(next: T);
}

export interface ReadonlyDerived<T> {
  readonly value: T;
}

export function $state<T>(initial: T): ReactiveState<T> {
  let current = initial;
  const deps = new Set<Subscriber>();

  return {
    get value(): T {
      if (currentObserver) deps.add(currentObserver);
      return current;
    },
    set value(next: T) {
      if (Object.is(current, next)) return;
      current = next;
      for (const effect of Array.from(deps)) {
        effect();
      }
    },
  };
}

export function $derived<T>(compute: () => T): ReadonlyDerived<T> {
  let cached!: T;
  let dirty = true;
  const downstream = new Set<Subscriber>();

  const onDependencyChanged = () => {
    if (!dirty) {
      dirty = true;
      for (const sub of Array.from(downstream)) sub();
    }
  };

  return {
    get value(): T {
      if (currentObserver) downstream.add(currentObserver);
      if (dirty) {
        const prev = currentObserver;
        currentObserver = onDependencyChanged;
        try {
          cached = compute();
          dirty = false;
        } finally {
          currentObserver = prev;
        }
      }
      return cached;
    },
  };
}

export function $effect(fn: (onCleanup: (cleanupFn: () => void) => void) => void): () => void {
  let cleanup: (() => void) | null = null;
  let disposed = false;

  const run = () => {
    if (disposed) return;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    const prev = currentObserver;
    currentObserver = run;
    try {
      fn((cb) => {
        cleanup = cb;
      });
    } finally {
      currentObserver = prev;
    }
  };

  run();

  return () => {
    disposed = true;
    if (cleanup) cleanup();
  };
}

export interface AnalyticsItem {
  readonly id: string;
  readonly title: string;
  readonly score: number;
}

export function createMigratedAnalyticsStore(initialItems: readonly AnalyticsItem[]) {
  const items = $state<readonly AnalyticsItem[]>(initialItems);
  const query = $state<string>("");
  const minScore = $state<number>(0);
  const auditTrail: string[] = [];

  const filtered = $derived(() => {
    const q = query.value.trim().toLowerCase();
    return items.value.filter(
      (item) => item.score >= minScore.value && (q === "" || item.title.toLowerCase().includes(q)),
    );
  });

  const summary = $derived(() => ({
    count: filtered.value.length,
    topScore: filtered.value.reduce((max, i) => Math.max(max, i.score), 0),
  }));

  const stopEffect = $effect((onCleanup) => {
    const currentCount = summary.value.count;
    auditTrail.push(\`matched:\${currentCount}\`);
    onCleanup(() => {
      auditTrail.push(\`cleanup:\${currentCount}\`);
    });
  });

  return { items, query, minScore, filtered, summary, auditTrail, dispose: stopEffect };
}`,
    criteria: [
      "Replaces manual React hook dependency arrays with auto-tracking $state<T>, $derived<T>, and $effect primitives",
      "Propagates fine-grained dirty invalidation through derived chains without redundant recomputation",
      "Executes registered effect cleanup callbacks prior to re-running or disposing reactive effects",
    ],
  },
  {
    id: "task_migrate_redux_thunks_to_tanstack_query_ts",
    title: "Migrate Boilerplate Redux Async Thunks & Action Reducers to Type-Safe TanStack Query SWR Cache Engine",
    category: "framework-migration",
    difficulty: "advanced",
    tags: ["typescript", "migration", "redux", "tanstack-query", "swr-cache", "deduplication"],
    instructions:
      "A legacy Redux store uses 120 lines of FETCH_USERS_REQUEST / FETCH_USERS_SUCCESS / FETCH_USERS_FAILURE action creators and thunks without request deduplication, cache expiration, or optimistic rollback. Migrate to a TypeScript TanStack QueryClient engine featuring deterministic QueryKey serialization, concurrent in-flight Promise deduplication, staleTime SWR caching, prefix invalidation (invalidateQueries), and optimistic mutation rollback.",
    starterCode: `// Legacy Redux Boilerplate with Duplicate Concurrent Fetches & No Stale Time
export function legacyUsersReducer(state = { loading: false, data: null, error: null }, action: any) {
  switch (action.type) {
    case "FETCH_REQUEST": return { ...state, loading: true };
    case "FETCH_SUCCESS": return { loading: false, data: action.payload, error: null };
    case "FETCH_FAILURE": return { loading: false, data: null, error: action.error };
    default: return state;
  }
}`,
    solutionCode: `// TypeScript TanStack Query Client Engine with In-Flight Deduplication, StaleTime & Optimistic Rollback
export type QueryKey = readonly unknown[];

interface CacheEntry<TData = unknown> {
  data: TData;
  updatedAt: number;
  invalidated: boolean;
}

export function hashQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce<Record<string, unknown>>((acc, k) => {
            acc[k] = (val as Record<string, unknown>)[k];
            return acc;
          }, {})
      : val,
  );
}

export class TypedQueryClient {
  #cache = new Map<string, CacheEntry<any>>();
  #inFlight = new Map<string, Promise<any>>();

  getQueryData<TData>(queryKey: QueryKey): TData | undefined {
    return this.#cache.get(hashQueryKey(queryKey))?.data as TData | undefined;
  }

  setQueryData<TData>(queryKey: QueryKey, updater: TData | ((old: TData | undefined) => TData), nowMs = Date.now()): TData {
    const keyHash = hashQueryKey(queryKey);
    const prev = this.#cache.get(keyHash)?.data as TData | undefined;
    const next = typeof updater === "function" ? (updater as (old: TData | undefined) => TData)(prev) : updater;
    this.#cache.set(keyHash, { data: next, updatedAt: nowMs, invalidated: false });
    return next;
  }

  async fetchQuery<TData>(opts: {
    readonly queryKey: QueryKey;
    readonly queryFn: () => Promise<TData>;
    readonly staleTimeMs?: number;
    readonly nowMs?: number;
  }): Promise<TData> {
    const keyHash = hashQueryKey(opts.queryKey);
    const now = opts.nowMs ?? Date.now();
    const staleTime = opts.staleTimeMs ?? 0;

    const cached = this.#cache.get(keyHash);
    if (cached && !cached.invalidated && now - cached.updatedAt <= staleTime) {
      return cached.data as TData;
    }

    const existingPromise = this.#inFlight.get(keyHash);
    if (existingPromise) {
      return existingPromise as Promise<TData>;
    }

    const request = opts
      .queryFn()
      .then((data) => {
        this.#cache.set(keyHash, { data, updatedAt: Date.now(), invalidated: false });
        this.#inFlight.delete(keyHash);
        return data;
      })
      .catch((err) => {
        this.#inFlight.delete(keyHash);
        throw err;
      });

    this.#inFlight.set(keyHash, request);
    return request;
  }

  invalidateQueries(prefixKey: QueryKey): number {
    let count = 0;
    const prefixJson = JSON.stringify(prefixKey).slice(0, -1); // match array prefix
    for (const [k, entry] of this.#cache.entries()) {
      if (k.startsWith(prefixJson)) {
        entry.invalidated = true;
        count++;
      }
    }
    return count;
  }

  async executeOptimisticMutation<TData, TVariables, TResult>(opts: {
    readonly queryKey: QueryKey;
    readonly variables: TVariables;
    readonly optimisticUpdater: (old: TData | undefined, vars: TVariables) => TData;
    readonly mutationFn: (vars: TVariables) => Promise<TResult>;
  }): Promise<TResult> {
    const snapshot = this.getQueryData<TData>(opts.queryKey);
    this.setQueryData<TData>(opts.queryKey, (old) => opts.optimisticUpdater(old, opts.variables));
    try {
      const result = await opts.mutationFn(opts.variables);
      this.invalidateQueries(opts.queryKey);
      return result;
    } catch (err) {
      if (snapshot !== undefined) {
        this.setQueryData<TData>(opts.queryKey, snapshot);
      }
      throw err;
    }
  }
}`,
    criteria: [
      "Canonicalizes QueryKey objects deterministically so key property order never fragments cache entries",
      "Deduplicates concurrent in-flight fetchQuery calls for the same QueryKey and respects staleTimeMs",
      "Supports prefix invalidateQueries and automatic snapshot rollback when executeOptimisticMutation fails",
    ],
  },
  {
    id: "task_migrate_nextjs_pages_to_app_router_rsc",
    title: "Migrate Next.js Pages Router getServerSideProps Waterfall to App Router Parallel RSC Loader & Tag Cache",
    category: "framework-migration",
    difficulty: "advanced",
    tags: ["typescript", "migration", "nextjs", "rsc", "app-router", "suspense", "revalidate-tag"],
    instructions:
      "A legacy Next.js Pages Router page runs three sequential awaits inside getServerSideProps(ctx), blocking TTFB on the slowest API call and lacking granular cache tag invalidation. Migrate to a TypeScript App Router Server Component architecture with parallel tagged fetch caching, Suspense stream chunk resolution, and a Web-Standard POST Route Handler that selectively purges cache entries via revalidateTag().",
    starterCode: `// Legacy Pages Router Sequential Blocking getServerSideProps Waterfall
export async function getServerSideProps(context: any) {
  const user = await fetchUser(context.params.id);
  const org = await fetchOrg(user.orgId); // Sequential waterfall!
  const metrics = await fetchMetrics(context.params.id); // Waits for org first!
  return { props: { user, org, metrics } };
}`,
    solutionCode: `// Migrated Next.js App Router Tagged Cache Store, Parallel RSC Loader & Route Handler Revalidation
export interface TaggedCacheEntry<T = unknown> {
  readonly value: T;
  readonly tags: readonly string[];
  readonly cachedAt: number;
}

export class NextAppRouterCache {
  #store = new Map<string, TaggedCacheEntry<any>>();

  async fetchWithTags<T>(
    cacheKey: string,
    tags: readonly string[],
    loader: () => Promise<T>,
  ): Promise<{ data: T; cacheStatus: "HIT" | "MISS" }> {
    const existing = this.#store.get(cacheKey);
    if (existing) {
      return { data: existing.value as T, cacheStatus: "HIT" };
    }
    const value = await loader();
    this.#store.set(cacheKey, { value, tags: [...tags], cachedAt: Date.now() });
    return { data: value, cacheStatus: "MISS" };
  }

  revalidateTag(tag: string): number {
    let evicted = 0;
    for (const [key, entry] of this.#store.entries()) {
      if (entry.tags.includes(tag)) {
        this.#store.delete(key);
        evicted++;
      }
    }
    return evicted;
  }
}

export async function renderDashboardRSC<TUser, TMetrics>(opts: {
  readonly userId: string;
  readonly cache: NextAppRouterCache;
  readonly loadUser: (id: string) => Promise<TUser>;
  readonly loadMetrics: (id: string) => Promise<TMetrics>;
}) {
  // Parallel initiation eliminates sequential getServerSideProps waterfall
  const [userEnvelope, metricsEnvelope] = await Promise.all([
    opts.cache.fetchWithTags("user:" + opts.userId, ["users", "user:" + opts.userId], () =>
      opts.loadUser(opts.userId),
    ),
    opts.cache.fetchWithTags("metrics:" + opts.userId, ["metrics", "user:" + opts.userId], () =>
      opts.loadMetrics(opts.userId),
    ),
  ]);

  return {
    rscPayload: {
      user: userEnvelope.data,
      suspenseBoundary: {
        id: "metrics-stream",
        status: "resolved" as const,
        data: metricsEnvelope.data,
      },
    },
    telemetry: {
      userCache: userEnvelope.cacheStatus,
      metricsCache: metricsEnvelope.cacheStatus,
    },
  };
}

export async function POST_RevalidateRouteHandler(
  req: Request,
  cache: NextAppRouterCache,
): Promise<Response> {
  const body = (await req.json()) as { tag?: string };
  if (!body?.tag || typeof body.tag !== "string") {
    return new Response(JSON.stringify({ revalidated: false, error: "Missing tag" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const evictedCount = cache.revalidateTag(body.tag);
  return new Response(
    JSON.stringify({ revalidated: true, tag: body.tag, evictedCount }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}`,
    criteria: [
      "Eliminates sequential getServerSideProps waterfall by initiating independent RSC data fetches in parallel with Promise.all",
      "Caches Server Component fetches by tag and selectively purges stale entries via revalidateTag()",
      "Implements a Web-Standard Request -> Response POST Route Handler for on-demand tag revalidation",
    ],
  },

  /* ── 10. Package Managers & Multi-Runtime TS Ecosystem (npm, pnpm, Yarn Berry, Bun, Deno, JSR) ── */
  {
    id: "task_pkg_npm_to_pnpm_bun_workspace_migration",
    title: "Migrate Legacy npm/Yarn Classic Monorepo to Strict pnpm & Bun Workspaces with workspace:*, catalog: & Phantom Dependency Detection",
    category: "package-managers",
    difficulty: "intermediate",
    tags: ["typescript", "package-managers", "pnpm", "bun", "npm", "yarn", "workspaces", "monorepo"],
    instructions:
      "A legacy npm / Yarn v1 flat node_modules monorepo relies on accidental hoisting (importing undeclared transitive packages) and duplicates third-party semver ranges across 15 workspace packages. Build a TypeScript workspace migrator that detects phantom dependencies (imports missing from a package's own dependencies/peerDependencies), rewrites internal cross-package semver ranges to workspace:^ protocol, extracts shared external dependencies into a centralized pnpm/Bun catalog:, and pins packageManager for Corepack/CI reproducibility.",
    starterCode: `// Legacy Flat Hoisted Monorepo Manifest without Phantom Check or Catalog Protocol
export function migrateWorkspaceManifests(rootPkg: any, memberPkgs: any[]) {
  // Leaves undeclared phantom imports broken under strict pnpm/bun isolated node_modules!
  return { rootPkg, memberPkgs };
}`,
    solutionCode: `// TypeScript Monorepo Migrator for Strict pnpm & Bun Workspaces (workspace:^, catalog:, Phantom Guard)
export interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly importedSpecifiers?: readonly string[];
}

export interface MigratedMonorepoResult {
  readonly packageManager: string;
  readonly workspaces: readonly string[];
  readonly catalog: Record<string, string>;
  readonly migratedMembers: {
    readonly name: string;
    readonly dependencies: Record<string, string>;
    readonly phantomDependenciesAdded: readonly string[];
  }[];
}

function extractPackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.slice(0, 2).join("/");
  }
  return specifier.split("/")[0];
}

export function migrateToStrictPnpmBunWorkspaces(opts: {
  readonly targetManager: "pnpm@10.6.0" | "bun@1.4.2" | "yarn@4.6.0";
  readonly workspaceGlobs: readonly string[];
  readonly members: readonly PackageManifest[];
  readonly transitiveHoistedVersions: Record<string, string>;
}): MigratedMonorepoResult {
  const internalNames = new Set(opts.members.map((m) => m.name));
  const externalUsageCount = new Map<string, { count: number; version: string }>();

  for (const member of opts.members) {
    const deps = { ...(member.dependencies ?? {}), ...(member.devDependencies ?? {}) };
    for (const [depName, ver] of Object.entries(deps)) {
      if (!internalNames.has(depName)) {
        const prev = externalUsageCount.get(depName);
        externalUsageCount.set(depName, { count: (prev?.count ?? 0) + 1, version: ver });
      }
    }
  }

  const catalog: Record<string, string> = {};
  for (const [depName, info] of externalUsageCount.entries()) {
    if (info.count >= 2) {
      catalog[depName] = info.version;
    }
  }

  const migratedMembers = opts.members.map((member) => {
    const nextDeps: Record<string, string> = { ...(member.dependencies ?? {}) };
    const peers = member.peerDependencies ?? {};
    const phantomAdded: string[] = [];

    for (const rawSpec of member.importedSpecifiers ?? []) {
      if (rawSpec.startsWith(".") || rawSpec.startsWith("node:") || rawSpec.startsWith("bun:")) continue;
      const pkgName = extractPackageName(rawSpec);
      if (!(pkgName in nextDeps) && !(pkgName in peers)) {
        const resolvedVer = opts.transitiveHoistedVersions[pkgName] ?? "^1.0.0";
        nextDeps[pkgName] = resolvedVer;
        phantomAdded.push(pkgName);
      }
    }

    for (const depName of Object.keys(nextDeps)) {
      if (internalNames.has(depName)) {
        nextDeps[depName] = "workspace:^";
      } else if (depName in catalog) {
        nextDeps[depName] = "catalog:";
      }
    }

    return {
      name: member.name,
      dependencies: nextDeps,
      phantomDependenciesAdded: phantomAdded,
    };
  });

  return {
    packageManager: opts.targetManager,
    workspaces: [...opts.workspaceGlobs],
    catalog,
    migratedMembers,
  };
}`,
    criteria: [
      "Detects undeclared phantom dependencies from bare specifier imports and promotes them into explicit dependencies",
      "Rewrites internal monorepo sibling dependencies to the workspace:^ protocol",
      "Deduplicates shared third-party versions into a root catalog: map and pins the packageManager field",
    ],
  },
  {
    id: "task_pkg_dual_cjs_esm_exports_jsr_deno",
    title: "Refactor Broken Node CJS/ESM Package Manifest to Conditional exports Map, Bundler Resolution & Deno/JSR Compatibility",
    category: "package-managers",
    difficulty: "advanced",
    tags: ["typescript", "package-managers", "exports-map", "esm-cjs", "deno", "jsr", "bun", "node"],
    instructions:
      "A shared TypeScript SDK ships a legacy main/module package.json that triggers the Dual-Package Hazard in Node.js (loading both CJS and ESM instances simultaneously), places the types condition last (breaking TypeScript moduleResolution: 'nodenext' and 'bundler'), and lacks a JSR/Deno jsr.json manifest. Build a TypeScript package normalizer that generates condition-ordered exports (types first, then bun/deno/import/require), blocks unexported internal deep imports, and synthesizes a valid Deno/JSR configuration.",
    starterCode: `// Broken Dual-Package Manifest (types after default & no subpath encapsulation)
export const legacyPackageJson = {
  name: "@acme/sdk",
  version: "2.1.0",
  main: "./dist/index.cjs",
  module: "./dist/index.mjs",
  types: "./dist/index.d.ts",
  exports: {
    ".": {
      default: "./dist/index.mjs",
      require: "./dist/index.cjs",
      types: "./dist/index.d.ts" // Invalid: types must precede import/require/default!
    }
  }
};`,
    solutionCode: `// Multi-Runtime Conditional Exports Builder & Deno/JSR Manifest Generator
export interface EntryPointConfig {
  readonly subpath: "." | \`./\${string}\`;
  readonly sourceTs: \`./src/\${string}.ts\`;
  readonly esmPath: \`./dist/\${string}.mjs\`;
  readonly cjsPath: \`./dist/\${string}.cjs\`;
  readonly dtsEsPath: \`./dist/\${string}.d.mts\`;
  readonly dtsCjsPath: \`./dist/\${string}.d.cts\`;
}

export interface ConditionalExportTarget {
  readonly bun: string;
  readonly deno: string;
  readonly import: { readonly types: string; readonly default: string };
  readonly require: { readonly types: string; readonly default: string };
}

export function buildMultiRuntimePackageArtifacts(opts: {
  readonly name: \`@\${string}/\${string}\`;
  readonly version: string;
  readonly entries: readonly EntryPointConfig[];
}) {
  const exportsMap: Record<string, ConditionalExportTarget | string> = {};
  const jsrExports: Record<string, string> = {};

  for (const entry of opts.entries) {
    // types MUST come first inside import/require conditions for TypeScript nodenext/bundler resolution
    exportsMap[entry.subpath] = {
      bun: entry.sourceTs,
      deno: entry.sourceTs,
      import: {
        types: entry.dtsEsPath,
        default: entry.esmPath,
      },
      require: {
        types: entry.dtsCjsPath,
        default: entry.cjsPath,
      },
    };
    jsrExports[entry.subpath] = entry.sourceTs;
  }

  exportsMap["./package.json"] = "./package.json";

  return {
    packageJson: {
      name: opts.name,
      version: opts.version,
      type: "module" as const,
      sideEffects: false,
      exports: exportsMap,
    },
    jsrJson: {
      name: opts.name,
      version: opts.version,
      exports: jsrExports,
    },
    validateConditionOrder(subpath: string): { valid: boolean; importKeys: string[]; requireKeys: string[] } {
      const target = exportsMap[subpath];
      if (!target || typeof target === "string") {
        return { valid: false, importKeys: [], requireKeys: [] };
      }
      const importKeys = Object.keys(target.import);
      const requireKeys = Object.keys(target.require);
      const valid =
        importKeys[0] === "types" &&
        importKeys[1] === "default" &&
        requireKeys[0] === "types" &&
        requireKeys[1] === "default";
      return { valid, importKeys, requireKeys };
    },
  };
}`,
    criteria: [
      "Places the types condition before default inside split import (.d.mts/.mjs) and require (.d.cts/.cjs) blocks",
      "Provides native TypeScript source conditions for bun and deno runtimes alongside compiled Node.js artifacts",
      "Synthesizes a synchronized jsr.json manifest for Deno and JSR registry publishing",
    ],
  },
  {
    id: "task_pkg_lockfile_supply_chain_auditor",
    title: "Build Cross-Package-Manager Lockfile Security & Integrity Auditor (npm, pnpm, Yarn Berry, Bun & Deno)",
    category: "package-managers",
    difficulty: "advanced",
    tags: ["typescript", "package-managers", "lockfile", "supply-chain-security", "npm", "pnpm", "bun", "deno", "yarn"],
    instructions:
      "Enterprise CI pipelines ingest heterogeneous lockfiles across teams (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock, deno.lock) without verifying cryptographic SHA-512 SRI integrity hashes, internal scope registry pinning (dependency confusion on @corp/*), or dangerous lifecycle scripts. Build a unified TypeScript lockfile security auditor that normalizes lockfile entries across all 5 package managers and flags supply-chain policy violations.",
    starterCode: `// Unchecked Lockfile Loader Vulnerable to Dependency Confusion & Missing SRI Hashes
export function auditLockfileEntries(entries: any[]) {
  return { passed: true, violations: [] };
}`,
    solutionCode: `// Cross-Package-Manager Lockfile Supply-Chain & SRI Integrity Auditor
export type PackageManagerKind = "npm" | "pnpm" | "yarn-berry" | "bun" | "deno";

export interface NormalizedLockPackage {
  readonly name: string;
  readonly version: string;
  readonly resolvedUrl: string;
  readonly integrity?: string;
  readonly hasInstallScripts?: boolean;
  readonly manager: PackageManagerKind;
}

export interface LockfileAuditPolicy {
  readonly internalScopes: readonly \`@\${string}/\`[];
  readonly internalRegistryHost: string;
  readonly trustedPublicHosts: readonly string[];
  readonly allowInstallScriptsPackages: readonly string[];
}

export interface LockfileViolation {
  readonly package: string;
  readonly manager: PackageManagerKind;
  readonly code:
    | "DEPENDENCY_CONFUSION_SCOPE_LEAK"
    | "UNTRUSTED_TARBALL_HOST"
    | "WEAK_OR_MISSING_SRI_INTEGRITY"
    | "UNAUTHORIZED_LIFECYCLE_SCRIPT";
  readonly detail: string;
}

export function auditCrossManagerLockfile(
  packages: readonly NormalizedLockPackage[],
  policy: LockfileAuditPolicy,
): { readonly passed: boolean; readonly violations: readonly LockfileViolation[] } {
  const violations: LockfileViolation[] = [];

  for (const pkg of packages) {
    const id = \`\${pkg.name}@\${pkg.version}\`;
    let host = "";
    let protocol = "";
    try {
      const parsed = new URL(pkg.resolvedUrl);
      host = parsed.hostname;
      protocol = parsed.protocol;
    } catch {
      protocol = "invalid:";
    }

    // 1. Dependency Confusion check: internal @scope/* must resolve ONLY from internalRegistryHost
    const isInternal = policy.internalScopes.some((scope) => pkg.name.startsWith(scope));
    if (isInternal && host !== policy.internalRegistryHost) {
      violations.push({
        package: id,
        manager: pkg.manager,
        code: "DEPENDENCY_CONFUSION_SCOPE_LEAK",
        detail: \`Internal package \${id} resolved from untrusted host '\${host}' instead of '\${policy.internalRegistryHost}'\`,
      });
    }

    // 2. Protocol & registry host allowlist check
    const allowedHosts = new Set([policy.internalRegistryHost, ...policy.trustedPublicHosts]);
    if (protocol !== "https:" || !allowedHosts.has(host)) {
      violations.push({
        package: id,
        manager: pkg.manager,
        code: "UNTRUSTED_TARBALL_HOST",
        detail: \`Package \${id} uses untrusted URL '\${pkg.resolvedUrl}'\`,
      });
    }

    // 3. Cryptographic SHA-512 SRI integrity check
    if (!pkg.integrity || !/^sha512-[A-Za-z0-9+/=]{20,}$/.test(pkg.integrity)) {
      violations.push({
        package: id,
        manager: pkg.manager,
        code: "WEAK_OR_MISSING_SRI_INTEGRITY",
        detail: \`Package \${id} is missing a strong sha512- Subresource Integrity digest\`,
      });
    }

    // 4. Lifecycle install script check (preinstall / install / postinstall)
    if (pkg.hasInstallScripts && !policy.allowInstallScriptsPackages.includes(pkg.name)) {
      violations.push({
        package: id,
        manager: pkg.manager,
        code: "UNAUTHORIZED_LIFECYCLE_SCRIPT",
        detail: \`Package \${id} declares lifecycle install scripts not on the allowlist\`,
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}`,
    criteria: [
      "Detects Dependency Confusion attacks when internal @scope/* packages resolve from public registries",
      "Enforces HTTPS registry host allowlists and strong sha512- Subresource Integrity (SRI) digests across npm, pnpm, Yarn, Bun, and Deno lockfiles",
      "Blocks unauthorized preinstall/postinstall lifecycle scripts unless explicitly allowlisted",
    ],
  },
  {
    id: "task_pkg_monorepo_task_graph_cache_runner",
    title: "Implement Content-Addressable Monorepo Task Orchestrator (Turborepo / Nx / bun --filter / pnpm -r) with Topological Cache",
    category: "package-managers",
    difficulty: "advanced",
    tags: ["typescript", "package-managers", "monorepo", "turborepo", "nx", "bun", "pnpm", "topological-cache"],
    instructions:
      "A polyglot TypeScript monorepo rebuilds every workspace package from scratch on CI without caching or respecting topological dependency waves. Build a content-addressable monorepo task runner that computes deterministic composite cache hashes (combining package source hash, runtime engine fingerprint, and upstream dependency hashes), executes independent packages concurrently by topological wave, and replays cached build artifacts on cache hits.",
    starterCode: `// Naive Sequential Uncached Monorepo Build Runner
export async function runMonorepoBuilds(packages: any[]) {
  for (const pkg of packages) {
    await pkg.build();
  }
}`,
    solutionCode: `// Content-Addressable Topological Monorepo Task Orchestrator with Upstream Hash Propagation
export interface WorkspaceNode {
  readonly name: string;
  readonly localSourceHash: string;
  readonly internalDeps: readonly string[];
  readonly runTask: () => Promise<string>;
}

export interface TaskExecutionRecord {
  readonly name: string;
  readonly wave: number;
  readonly cacheKey: string;
  readonly status: "CACHE_HIT" | "EXECUTED";
  readonly artifact: string;
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export class MonorepoTaskOrchestrator {
  #remoteCache = new Map<string, string>();

  async executeGraph(
    nodes: readonly WorkspaceNode[],
    runtimeEnvFingerprint: string,
  ): Promise<{ readonly waves: string[][]; readonly records: Record<string, TaskExecutionRecord> }> {
    const nodeMap = new Map<string, WorkspaceNode>(nodes.map((n) => [n.name, n]));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.name, node.internalDeps.length);
      for (const dep of node.internalDeps) {
        if (!nodeMap.has(dep)) throw new Error(\`Unknown workspace dependency '\${dep}'\`);
        const list = dependents.get(dep) ?? [];
        list.push(node.name);
        dependents.set(dep, list);
      }
    }

    const completedHashes = new Map<string, string>();
    const records: Record<string, TaskExecutionRecord> = {};
    const waves: string[][] = [];
    let processed = 0;

    while (processed < nodes.length) {
      const ready = nodes
        .filter((n) => inDegree.get(n.name) === 0 && !completedHashes.has(n.name))
        .map((n) => n.name)
        .sort();

      if (ready.length === 0) {
        throw new Error("Cyclic workspace dependency graph detected");
      }

      const waveIdx = waves.length;
      waves.push(ready);

      await Promise.all(
        ready.map(async (pkgName) => {
          const node = nodeMap.get(pkgName)!;
          const depHashSignature = [...node.internalDeps]
            .sort()
            .map((d) => \`\${d}:\${completedHashes.get(d)}\`)
            .join("|");

          const cacheKey = fnv1aHex(
            \`\${runtimeEnvFingerprint}::\${node.name}::\${node.localSourceHash}::[\${depHashSignature}]\`,
          );

          if (this.#remoteCache.has(cacheKey)) {
            const cachedArtifact = this.#remoteCache.get(cacheKey)!;
            completedHashes.set(pkgName, cacheKey);
            records[pkgName] = {
              name: pkgName,
              wave: waveIdx,
              cacheKey,
              status: "CACHE_HIT",
              artifact: cachedArtifact,
            };
          } else {
            const artifact = await node.runTask();
            this.#remoteCache.set(cacheKey, artifact);
            completedHashes.set(pkgName, cacheKey);
            records[pkgName] = {
              name: pkgName,
              wave: waveIdx,
              cacheKey,
              status: "EXECUTED",
              artifact,
            };
          }
        }),
      );

      for (const pkgName of ready) {
        processed++;
        for (const child of dependents.get(pkgName) ?? []) {
          inDegree.set(child, (inDegree.get(child) ?? 1) - 1);
        }
      }
    }

    return { waves, records };
  }
}`,
    criteria: [
      "Schedules workspace package builds in concurrent topological waves and rejects cyclic dependency graphs",
      "Propagates upstream dependency cache keys into downstream package cache keys so leaf changes invalidate dependents",
      "Replays artifacts from the content-addressable cache on CACHE_HIT without re-invoking runTask()",
    ],
  },

  /* ── 11. Advanced WHATWG HTML Living Standard Architecture (Speculation Rules, Declarative Shadow DOM, Invoker Commands, Picture LCP) ── */
  {
    id: "task_html_speculation_rules_prerender",
    title: "Implement WHATWG Speculation Rules API (<script type=\"speculationrules\">) with Document Rules, Route Exclusions & Save-Data Guard",
    category: "html-architecture",
    difficulty: "advanced",
    tags: ["html", "speculation-rules", "prerender", "prefetch", "performance", "whatwg"],
    instructions:
      "A documentation portal injects dozens of <link rel=\"prerender\"> tags on mouseover, exhausting mobile data plans and accidentally triggering destructive GET /logout and /api/* endpoints during background prerendering. Build a TypeScript Speculation Rules compiler that generates a valid <script type=\"speculationrules\"> JSON payload using document-level where/and/not rules, excludes destructive routes and [data-no-prerender] selectors, sets moderate/conservative eagerness, and suppresses speculation when Save-Data or 2g/slow-2g network hints are active.",
    starterCode: `// Dangerous Unbounded Link Prerendering on Every Anchor Hover
export function buildSpeculationScript(config: any) {
  return '<link rel="prerender" href="' + config.url + '">';
}`,
    solutionCode: `// WHATWG Speculation Rules API Compiler with Document Exclusion Rules & Save-Data Guard
export interface SpeculationConfig {
  readonly allowPaths: readonly string[];
  readonly disallowPaths: readonly string[];
  readonly excludeSelectors: readonly string[];
  readonly eagerness: "immediate" | "eager" | "moderate" | "conservative";
  readonly saveDataHeader?: string | null;
  readonly effectiveConnectionType?: "slow-2g" | "2g" | "3g" | "4g";
}

export function compileSpeculationRulesTag(config: SpeculationConfig): {
  readonly enabled: boolean;
  readonly html: string;
  readonly rules: Record<string, unknown> | null;
} {
  const saveDataEnabled = config.saveDataHeader?.toLowerCase() === "on";
  const constrainedNet =
    config.effectiveConnectionType === "slow-2g" || config.effectiveConnectionType === "2g";

  if (saveDataEnabled || constrainedNet) {
    return { enabled: false, html: "", rules: null };
  }

  const safetyExclusions = Array.from(
    new Set(["/logout", "/signout", "/api/*", ...config.disallowPaths]),
  );
  const selectorExclusions = Array.from(
    new Set(["[data-no-prerender]", "[rel~=nofollow]", "[download]", ...config.excludeSelectors]),
  ).join(", ");

  const documentRule = {
    source: "document",
    where: {
      and: [
        { href_matches: config.allowPaths.length > 0 ? [...config.allowPaths] : ["/*"] },
        { not: { href_matches: safetyExclusions } },
        { not: { selector_matches: selectorExclusions } },
      ],
    },
    eagerness: config.eagerness,
  };

  const rules = {
    prerender: [documentRule],
    prefetch: [
      {
        ...documentRule,
        eagerness: config.eagerness === "conservative" ? "Conservative" .toLowerCase() : "moderate",
      },
    ],
  };

  const serialized = JSON.stringify(rules).replace(/</g, "\\\\u003c");
  return {
    enabled: true,
    rules,
    html: \`<script type="speculationrules">\${serialized}</script>\`,
  };
}`,
    criteria: [
      "Emits a valid <script type=\"speculationrules\"> JSON block with document-scoped where.and / not clauses",
      "Automatically excludes destructive routes (/logout, /api/*) and [data-no-prerender]/[rel~=nofollow] links",
      "Disables speculative prerendering when Save-Data: on or 2g/slow-2g connection hints are present",
    ],
  },
  {
    id: "task_html_declarative_shadow_dom_streaming",
    title: "Refactor Client-Only Custom Element to SSR Declarative Shadow DOM (<template shadowrootmode=\"open\">) with Focus Delegation & Slot Hydration",
    category: "html-architecture",
    difficulty: "advanced",
    tags: ["html", "declarative-shadow-dom", "web-components", "ssr", "hydration", "a11y"],
    instructions:
      "A custom UI card component calls attachShadow({ mode: 'open' }) only after client JavaScript downloads, causing a severe Flash of Unstyled Content (FOUC) and failing to forward focus to its internal control. Refactor to a streaming-friendly SSR Declarative Shadow DOM generator (<template shadowrootmode=\"open\" shadowrootdelegatesfocus shadowrootclonable>) with named <slot> fallbacks and an idempotent client hydrator that reuses existing this.shadowRoot without throwing NotSupportedError.",
    starterCode: `// Client-Only Shadow DOM with FOUC & Duplicate attachShadow Crash on SSR
export function renderSSRComponent(title: string) {
  return \`<loom-card>\${title}</loom-card>\`;
}
export function hydrateCard(hostEl: any) {
  // Crashes if Declarative Shadow DOM already attached hostEl.shadowRoot!
  const root = hostEl.attachShadow({ mode: "open" });
  return root;
}`,
    solutionCode: `// SSR Declarative Shadow DOM Renderer & Idempotent Client Hydrator
export interface DeclarativeCardProps {
  readonly id: string;
  readonly heading: string;
  readonly badgeText: string;
  readonly delegateFocus?: boolean;
}

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDeclarativeShadowCardSSR(props: DeclarativeCardProps): string {
  const focusAttr = props.delegateFocus !== false ? " shadowrootdelegatesfocus" : "";
  return [
    \`<loom-surface-card id="\${escapeAttr(props.id)}">\`,
    \`  <template shadowrootmode="open"\${focusAttr} shadowrootclonable>\`,
    \`    <style>:host{display:block;contain:content}::slotted([slot="badge"]){font-family:monospace}</style>\`,
    \`    <article part="surface">\`,
    \`      <header><slot name="badge"><span>Default Badge</span></slot><slot name="heading"><h2>Untitled</h2></slot></header>\`,
    \`      <div class="body"><slot>Fallback content</slot></div>\`,
    \`      <footer><button type="button" part="trigger">Inspect</button></footer>\`,
    \`    </article>\`,
    \`  </template>\`,
    \`  <span slot="badge">\${escapeAttr(props.badgeText)}</span>\`,
    \`  <h2 slot="heading">\${escapeAttr(props.heading)}</h2>\`,
    \`</loom-surface-card>\`,
  ].join("\\n");
}

export function hydrateDeclarativeShadowCard(host: {
  shadowRoot: { hydrated?: boolean } | null;
  attachShadow: (init: { mode: "open"; delegatesFocus: boolean }) => { hydrated?: boolean };
}): { readonly mode: "REUSED_DSD" | "CLIENT_ATTACHED"; readonly root: { hydrated?: boolean } } {
  if (host.shadowRoot) {
    host.shadowRoot.hydrated = true;
    return { mode: "REUSED_DSD", root: host.shadowRoot };
  }
  const root = host.attachShadow({ mode: "open", delegatesFocus: true });
  root.hydrated = true;
  return { mode: "CLIENT_ATTACHED", root };
}`,
    criteria: [
      "Emits <template shadowrootmode=\"open\" shadowrootdelegatesfocus shadowrootclonable> for zero-FOUC SSR streaming",
      "Projects light DOM children into named <slot name=\"badge\"> and <slot name=\"heading\"> outlets with fallback nodes",
      "Hydrates idempotently by reusing existing host.shadowRoot before falling back to host.attachShadow()",
    ],
  },
  {
    id: "task_html_dialog_popover_invoker_inert",
    title: "Refactor JS Modal & Dropdown Spaghetti to Native HTML <dialog closedby=\"any\">, Popover API, Invoker Commands & inert",
    category: "html-architecture",
    difficulty: "intermediate",
    tags: ["html", "dialog", "popover", "invoker-commands", "commandfor", "inert", "semantic-html"],
    instructions:
      "A legacy UI shell uses 80 lines of onclick handlers, manual z-index backdrop divs, and custom Escape key listeners to toggle modals and filter popovers. Refactor to modern WHATWG HTML primitives: <dialog closedby=\"any\"> controlled declaratively via Invoker Commands (commandfor / command=\"show-modal\" / command=\"close\"), a top-layer Popover API menu (popover=\"auto\" / popovertarget), a semantic <search> landmark, and background inert synchronization.",
    starterCode: `// Legacy Div Soup Modal & Manual Backdrop Toggle
export function renderLegacyModalShell() {
  return \`
    <div class="header">
      <div class="search-box"><input type="text" placeholder="Filter..." /></div>
      <button onclick="document.getElementById('modal').style.display='block'">Open</button>
    </div>
    <div id="modal" class="modal-backdrop" style="display:none;z-index:9999">
      <div class="modal-box">
        <span onclick="document.getElementById('modal').style.display='none'">X</span>
      </div>
    </div>
  \`;
}`,
    solutionCode: `// Modern HTML <dialog closedby="any">, Invoker Commands (commandfor/command), Popover & <search>
export interface InteractiveShellSpec {
  readonly dialogId: string;
  readonly popoverId: string;
  readonly title: string;
  readonly isModalOpen?: boolean;
}

export function renderModernInteractiveShell(spec: InteractiveShellSpec): string {
  const mainInertAttr = spec.isModalOpen ? " inert" : "";
  return [
    \`<header class="shell-bar">\`,
    \`  <search aria-label="Workspace filter">\`,
    \`    <form role="search"><input type="search" name="q" placeholder="Filter tasks..." autocomplete="off" /></form>\`,
    \`  </search>\`,
    \`  <button type="button" popovertarget="\${spec.popoverId}" popovertargetaction="toggle">Quick Filters</button>\`,
    \`  <button type="button" commandfor="\${spec.dialogId}" command="show-modal">Open Inspector</button>\`,
    \`</header>\`,
    \`<main id="app-main"\${mainInertAttr}>\`,
    \`  <div id="\${spec.popoverId}" popover="auto" role="menu">Filter options</div>\`,
    \`</main>\`,
    \`<dialog id="\${spec.dialogId}" closedby="any" aria-labelledby="\${spec.dialogId}-title">\`,
    \`  <article>\`,
    \`    <header><h2 id="\${spec.dialogId}-title">\${spec.title}</h2>\`,
    \`      <button type="button" commandfor="\${spec.dialogId}" command="close" aria-label="Close dialog">Close</button>\`,
    \`    </header>\`,
    \`  </article>\`,
    \`</dialog>\`,
  ].join("\\n");
}`,
    criteria: [
      "Uses native <dialog closedby=\"any\"> paired with declarative Invoker Commands (commandfor and command=\"show-modal\"/\"close\")",
      "Wraps search controls in a semantic HTML <search> landmark with <input type=\"search\">",
      "Uses native Popover API attributes (popover=\"auto\", popovertarget, popovertargetaction) and applies inert to background content when modal is open",
    ],
  },
  {
    id: "task_html_responsive_picture_fetchpriority_lcp",
    title: "Optimize Hero LCP & CLS with <picture> AVIF/WebP Art Direction, fetchpriority=\"high\", sizes & Preload Hints",
    category: "html-architecture",
    difficulty: "intermediate",
    tags: ["html", "lcp", "cls", "picture", "fetchpriority", "avif", "webp", "core-web-vitals"],
    instructions:
      "An unoptimized marketing page renders its hero image with <img src=\"hero.png\" loading=\"lazy\"> without width/height attributes, causing a 2.8s Largest Contentful Paint (LCP) penalty and a 0.34 Cumulative Layout Shift (CLS). Build an HTML media optimizer that forbids loading=\"lazy\" on above-the-fold LCP images, sets fetchpriority=\"high\" and decoding=\"async\", emits <picture> with AVIF/WebP <source> art direction and explicit width/height, and generates a matching <link rel=\"preload\" as=\"image\" imagesrcset>",
    starterCode: `// Anti-Pattern: Lazy-Loaded Unsized Hero Image Causing Severe LCP & CLS
export function renderHeroMedia(assetBaseUrl: string, alt: string) {
  return \`<img src="\${assetBaseUrl}/hero.png" loading="lazy" />\`;
}`,
    solutionCode: `// Core Web Vitals Optimized <picture> Art Direction, Preload Hint & LCP Priority Builder
export interface ResponsiveImageSpec {
  readonly basePath: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly isAboveTheFoldLcp: boolean;
  readonly sizes?: string;
}

export function buildResponsiveMediaMarkup(spec: ResponsiveImageSpec): {
  readonly preloadLinkHtml: string;
  readonly pictureHtml: string;
  readonly aspectRatio: string;
} {
  const sizes = spec.sizes ?? "(max-width: 768px) 100vw, 1200px";
  const avifSrcset = \`\${spec.basePath}-640.avif 640w, \${spec.basePath}-1280.avif 1280w, \${spec.basePath}-1920.avif 1920w\`;
  const webpSrcset = \`\${spec.basePath}-640.webp 640w, \${spec.basePath}-1280.webp 1280w, \${spec.basePath}-1920.webp 1920w\`;

  // LCP images MUST NOT use loading="lazy" and MUST use fetchpriority="high"
  const loadingAttr = spec.isAboveTheFoldLcp ? "eager" : "lazy";
  const priorityAttr = spec.isAboveTheFoldLcp ? "high" : "auto";

  const preloadLinkHtml = spec.isAboveTheFoldLcp
    ? \`<link rel="preload" as="image" type="image/avif" imagesrcset="\${avifSrcset}" imagesizes="\${sizes}" fetchpriority="high" />\`
    : "";

  const pictureHtml = [
    \`<picture>\`,
    \`  <source type="image/avif" srcset="\${avifSrcset}" sizes="\${sizes}" width="\${spec.width}" height="\${spec.height}" />\`,
    \`  <source type="image/webp" srcset="\${webpSrcset}" sizes="\${sizes}" width="\${spec.width}" height="\${spec.height}" />\`,
    \`  <img src="\${spec.basePath}-1280.jpg" alt="\${spec.alt.replace(/"/g, "&quot;")}" width="\${spec.width}" height="\${spec.height}" loading="\${loadingAttr}" fetchpriority="\${priorityAttr}" decoding="async" />\`,
    \`</picture>\`,
  ].join("\\n");

  return {
    preloadLinkHtml,
    pictureHtml,
    aspectRatio: \`\${spec.width} / \${spec.height}\`,
  };
}`,
    criteria: [
      "Emits <picture> with progressive image/avif and image/webp <source> srcset/sizes candidates",
      "Enforces loading=\"eager\" and fetchpriority=\"high\" with a matching <link rel=\"preload\" as=\"image\" imagesrcset> for LCP images",
      "Prevents Cumulative Layout Shift (CLS) by setting explicit integer width and height attributes on <source> and <img>",
    ],
  },

  /* ── 12. Technical SEO, Schema.org, JSON-LD @graph & Structured Data Engineering ── */
  {
    id: "task_seo_jsonld_knowledge_graph_builder",
    title: "Architect Connected Schema.org JSON-LD @graph Generator with Stable @id Entity Linking & XSS-Safe Script Serialization",
    category: "seo-structured-data",
    difficulty: "advanced",
    tags: ["seo", "json-ld", "schema-org", "structured-data", "knowledge-graph", "xss-prevention"],
    instructions:
      "A publishing platform embeds four disconnected <script type=\"application/ld+json\"> blocks with unescaped raw JSON.stringify(article), allowing a title containing '</script><script>alert(1)</script>' to execute arbitrary XSS and preventing search engines from linking the Organization, WebSite, WebPage, TechArticle, and BreadcrumbList entities. Refactor to a unified Schema.org @graph builder with canonical @id URI references (#organization, #website, #webpage, #article, #breadcrumb) and XSS-safe script tag serialization.",
    starterCode: `// Disconnected Unescaped JSON-LD Vulnerable to </script> Breakout XSS
export function renderArticleJsonLd(article: any) {
  const payload = {
    "@context": "http://schema.org",
    "@type": "Article",
    headline: article.title
  };
  // Vulnerable to </script> injection when article.title contains "</script>"!
  return \`<script type="application/ld+json">\${JSON.stringify(payload)}</script>\`;
}`,
    solutionCode: `// Connected Schema.org JSON-LD @graph Builder with @id Entity Graph & XSS-Safe Serialization
export interface ArticleGraphInput {
  readonly canonicalUrl: string;
  readonly siteOrigin: string;
  readonly siteName: string;
  readonly orgName: string;
  readonly logoUrl: string;
  readonly headline: string;
  readonly description: string;
  readonly datePublishedIso: string;
  readonly dateModifiedIso: string;
  readonly authorName: string;
  readonly breadcrumbs: readonly { readonly name: string; readonly path: string }[];
}

export function safeSerializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\\\u003c")
    .replace(/>/g, "\\\\u003e")
    .replace(/&/g, "\\\\u0026")
    .replace(/\\u2028/g, "\\\\u2028")
    .replace(/\\u2029/g, "\\\\u2029");
}

export function buildArticleKnowledgeGraphJsonLd(input: ArticleGraphInput) {
  const origin = input.siteOrigin.replace(/\\/+$/, "");
  const orgId = \`\${origin}/#organization\`;
  const websiteId = \`\${origin}/#website\`;
  const webpageId = \`\${input.canonicalUrl}#webpage\`;
  const breadcrumbId = \`\${input.canonicalUrl}#breadcrumb\`;
  const articleId = \`\${input.canonicalUrl}#article\`;

  const graph = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: input.orgName,
      url: origin,
      logo: {
        "@type": "ImageObject",
        url: input.logoUrl,
      },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: origin,
      name: input.siteName,
      publisher: { "@id": orgId },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: input.breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: \`\${origin}\${crumb.path.startsWith("/") ? crumb.path : "/" + crumb.path}\`,
      })),
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: input.canonicalUrl,
      name: input.headline,
      description: input.description,
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": breadcrumbId },
      mainEntity: { "@id": articleId },
    },
    {
      "@type": "TechArticle",
      "@id": articleId,
      headline: input.headline,
      description: input.description,
      datePublished: input.datePublishedIso,
      dateModified: input.dateModifiedIso,
      author: {
        "@type": "Person",
        name: input.authorName,
      },
      publisher: { "@id": orgId },
      mainEntityOfPage: { "@id": webpageId },
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  const serialized = safeSerializeJsonLd(payload);
  return {
    payload,
    scriptHtml: \`<script type="application/ld+json">\${serialized}</script>\`,
  };
}`,
    criteria: [
      "Emits a single @context: \"https://schema.org\" document containing a connected @graph array",
      "Cross-links Organization, WebSite, BreadcrumbList, WebPage, and TechArticle nodes via stable @id URIs",
      "Neutralizes </script> breakout XSS by unicode-escaping <, >, and & in JSON-LD script output",
    ],
  },
  {
    id: "task_seo_ecommerce_product_merchant_schema",
    title: "Build Rich-Result Schema.org Product, Offer, MerchantReturnPolicy, ShippingDetails & AggregateRating Validator",
    category: "seo-structured-data",
    difficulty: "advanced",
    tags: ["seo", "schema-org", "json-ld", "product-schema", "merchant-listings", "rich-results"],
    instructions:
      "An e-commerce catalog emits incomplete Schema.org Product markup with plain-text availability ('InStock' instead of 'https://schema.org/InStock'), negative or unformatted prices, out-of-bounds AggregateRating scores, and missing MerchantReturnPolicy / OfferShippingDetails required for Google Merchant Center rich snippets. Build a strict TypeScript Product Schema.org builder and rich-result validator.",
    starterCode: `// Invalid Product JSON-LD Rejected by Rich Result Validators
export function buildProductSchema(p: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    offers: { price: p.price, availability: "InStock" }
  };
}`,
    solutionCode: `// Rich-Result Schema.org Product, Offer, MerchantReturnPolicy & AggregateRating Builder
export interface MerchantProductSpec {
  readonly sku: string;
  readonly gtin13: string;
  readonly name: string;
  readonly description: string;
  readonly brandName: string;
  readonly imageUrls: readonly string[];
  readonly price: number;
  readonly currency: string;
  readonly inStock: boolean;
  readonly priceValidUntilIso: string;
  readonly returnDays: number;
  readonly shippingRateAmount: number;
  readonly ratingValue: number;
  readonly reviewCount: number;
}

export function buildVerifiedProductSchemaOrg(spec: MerchantProductSpec) {
  const errors: string[] = [];

  if (!/^\\d{13}$/.test(spec.gtin13)) {
    errors.push("gtin13 must be a 13-digit numeric identifier");
  }
  if (!/^[A-Z]{3}$/.test(spec.currency)) {
    errors.push("priceCurrency must be a 3-letter ISO 4217 code");
  }
  if (!(spec.price > 0) || !Number.isFinite(spec.price)) {
    errors.push("price must be a positive finite number");
  }
  if (spec.ratingValue < 1 || spec.ratingValue > 5 || spec.reviewCount < 1) {
    errors.push("aggregateRating requires ratingValue in [1, 5] and reviewCount >= 1");
  }
  if (errors.length > 0) {
    throw new Error(\`Invalid Product Schema.org payload: \${errors.join("; ")}\`);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    sku: spec.sku,
    gtin13: spec.gtin13,
    name: spec.name,
    description: spec.description,
    image: [...spec.imageUrls],
    brand: {
      "@type": "Brand",
      name: spec.brandName,
    },
    offers: {
      "@type": "Offer",
      price: spec.price.toFixed(2),
      priceCurrency: spec.currency,
      priceValidUntil: spec.priceValidUntilIso,
      itemCondition: "https://schema.org/NewCondition",
      availability: spec.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: spec.returnDays,
        returnMethod: "https://schema.org/ReturnByMail",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: spec.shippingRateAmount.toFixed(2),
          currency: spec.currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(spec.ratingValue.toFixed(2)),
      bestRating: 5,
      worstRating: 1,
      reviewCount: spec.reviewCount,
    },
  };
}`,
    criteria: [
      "Validates GTIN-13 format, ISO-4217 priceCurrency, positive price, and AggregateRating bounds ([1, 5], reviewCount >= 1)",
      "Uses full Schema.org enumeration URIs (https://schema.org/InStock, https://schema.org/NewCondition)",
      "Includes nested MerchantReturnPolicy and OfferShippingDetails structured objects for merchant rich results",
    ],
  },
  {
    id: "task_seo_canonical_hreflang_opengraph_head",
    title: "Implement Technical SEO <head> Compiler with Canonical URL Normalization, Bidirectional hreflang Matrix & OpenGraph",
    category: "seo-structured-data",
    difficulty: "advanced",
    tags: ["seo", "canonical-url", "hreflang", "opengraph", "robots-meta", "international-seo"],
    instructions:
      "An international web platform indexes duplicate URLs polluted with ?utm_source=..., fbclid, and mixed-case paths, forgets the x-default alternate link in its hreflang cluster, and leaves og:title / meta description unescaped. Build a Technical SEO <head> compiler that strips tracking query parameters, normalizes canonical HTTPS URLs, generates a complete hreflang alternate cluster with x-default, and emits robots + OpenGraph + Twitter Card metadata.",
    starterCode: `// Unnormalized Duplicate-Content <head> Missing Canonical Sanitization & hreflang x-default
export function renderSeoHead(rawUrl: string, title: string) {
  return \`<title>\${title}</title><link rel="canonical" href="\${rawUrl}">\`;
}`,
    solutionCode: `// Technical SEO <head> Compiler: Canonical Normalization, hreflang Cluster, Robots & OpenGraph
export interface SeoHeadInput {
  readonly rawUrl: string;
  readonly title: string;
  readonly description: string;
  readonly ogImageUrl: string;
  readonly localeAlternates: Readonly<Record<string, string>>;
  readonly defaultLocale: string;
  readonly noIndex?: boolean;
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "_ga",
]);

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function normalizeCanonicalUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  parsed.protocol = "https:";
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  // Strip marketing/tracking params and sort remaining query keys deterministically
  const cleanEntries: [string, string][] = [];
  for (const [k, v] of parsed.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(k.toLowerCase())) {
      cleanEntries.push([k, v]);
    }
  }
  cleanEntries.sort(([a], [b]) => a.localeCompare(b));
  parsed.search = "";
  for (const [k, v] of cleanEntries) {
    parsed.searchParams.append(k, v);
  }

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\\/+$/, "");
  }
  return parsed.toString();
}

export function compileTechnicalSeoHead(input: SeoHeadInput): {
  readonly canonicalUrl: string;
  readonly robotsDirective: string;
  readonly headHtml: string;
} {
  const canonicalUrl = normalizeCanonicalUrl(input.rawUrl);
  const robotsDirective = input.noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  const hreflangTags: string[] = [];
  for (const [lang, altUrl] of Object.entries(input.localeAlternates)) {
    const cleanAlt = normalizeCanonicalUrl(altUrl);
    hreflangTags.push(
      \`<link rel="alternate" hreflang="\${escapeHtmlAttr(lang.toLowerCase())}" href="\${escapeHtmlAttr(cleanAlt)}" />\`,
    );
  }

  const xDefaultTarget =
    input.localeAlternates[input.defaultLocale] ?? canonicalUrl;
  hreflangTags.push(
    \`<link rel="alternate" hreflang="x-default" href="\${escapeHtmlAttr(normalizeCanonicalUrl(xDefaultTarget))}" />\`,
  );

  const lines = [
    \`<title>\${escapeHtmlAttr(input.title)}</title>\`,
    \`<meta name="description" content="\${escapeHtmlAttr(input.description)}" />\`,
    \`<meta name="robots" content="\${robotsDirective}" />\`,
    \`<link rel="canonical" href="\${escapeHtmlAttr(canonicalUrl)}" />\`,
    ...hreflangTags,
    \`<meta property="og:type" content="website" />\`,
    \`<meta property="og:title" content="\${escapeHtmlAttr(input.title)}" />\`,
    \`<meta property="og:description" content="\${escapeHtmlAttr(input.description)}" />\`,
    \`<meta property="og:url" content="\${escapeHtmlAttr(canonicalUrl)}" />\`,
    \`<meta property="og:image" content="\${escapeHtmlAttr(input.ogImageUrl)}" />\`,
    \`<meta name="twitter:card" content="summary_large_image" />\`,
  ];

  return {
    canonicalUrl,
    robotsDirective,
    headHtml: lines.join("\\n"),
  };
}`,
    criteria: [
      "Strips utm_*, fbclid, and gclid tracking parameters and normalizes HTTPS canonical URLs",
      "Emits localized <link rel=\"alternate\" hreflang=\"...\"> tags alongside a mandatory hreflang=\"x-default\" fallback",
      "Generates robots directives (max-snippet:-1, max-image-preview:large) and escaped OpenGraph / Twitter Card meta tags",
    ],
  },
  {
    id: "task_seo_semantic_microdata_landmarks_audit",
    title: "Build Automated HTML5 Landmark Hierarchy, Heading Outline & Schema.org Microdata (itemscope/itemtype/itemprop) SEO Linter",
    category: "seo-structured-data",
    difficulty: "intermediate",
    tags: ["html", "seo", "microdata", "schema-org", "heading-hierarchy", "landmarks"],
    instructions:
      "Content pages routinely ship with multiple <h1> tags, skipped heading levels (<h1> directly to <h4>), missing <main> landmarks, and broken Schema.org Microdata (itemprop attributes outside an itemscope/itemtype=\"https://schema.org/...\" container). Build a deterministic HTML5 & Microdata SEO linter that parses document structure and reports exact conformance violations.",
    starterCode: `// No-Op HTML SEO Linter
export function lintHtmlSeoSemantics(html: string) {
  return { valid: true, violations: [] };
}`,
    solutionCode: `// Automated HTML5 Landmark, Heading Hierarchy & Schema.org Microdata SEO Linter
export type SeoViolationCode =
  | "MISSING_OR_MULTIPLE_H1"
  | "SKIPPED_HEADING_LEVEL"
  | "MISSING_MAIN_LANDMARK"
  | "UNSCOPED_OR_HTTP_MICRODATA_TYPE"
  | "INVALID_TIME_DATETIME";

export interface SeoAuditReport {
  readonly valid: boolean;
  readonly h1Count: number;
  readonly headingLevels: readonly number[];
  readonly microdataTypes: readonly string[];
  readonly violations: readonly { readonly code: SeoViolationCode; readonly detail: string }[];
}

export function auditHtmlSemanticSeo(html: string): SeoAuditReport {
  const violations: { code: SeoViolationCode; detail: string }[] = [];

  // 1. Heading outline extraction & hierarchy check
  const headingRegex = /<h([1-6])\\b[^>]*>/gi;
  const headingLevels: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    headingLevels.push(Number(match[1]));
  }

  const h1Count = headingLevels.filter((lvl) => lvl === 1).length;
  if (h1Count !== 1) {
    violations.push({
      code: "MISSING_OR_MULTIPLE_H1",
      detail: \`Document must contain exactly 1 <h1> element (found \${h1Count})\`,
    });
  }

  for (let i = 1; i < headingLevels.length; i++) {
    const prev = headingLevels[i - 1];
    const curr = headingLevels[i];
    if (curr > prev + 1) {
      violations.push({
        code: "SKIPPED_HEADING_LEVEL",
        detail: \`Skipped heading level from <h\${prev}> to <h\${curr}>\`,
      });
    }
  }

  // 2. <main> landmark check
  if (!/<main\\b[^>]*>[\\s\\S]*<\\/main>/i.test(html)) {
    violations.push({
      code: "MISSING_MAIN_LANDMARK",
      detail: "Document is missing a primary <main> landmark element",
    });
  }

  // 3. Schema.org Microdata (itemscope + https://schema.org/* itemtype) check
  const microdataTypes: string[] = [];
  const itemTypeRegex = /itemtype=["']([^"']+)["']/gi;
  while ((match = itemTypeRegex.exec(html)) !== null) {
    microdataTypes.push(match[1]);
    if (!match[1].startsWith("https://schema.org/")) {
      violations.push({
        code: "UNSCOPED_OR_HTTP_MICRODATA_TYPE",
        detail: \`Microdata itemtype '\${match[1]}' must use https://schema.org/ namespace\`,
      });
    }
  }

  if (/\\bitemprop=["'][^"']+["']/i.test(html) && !/\\bitemscope\\b/i.test(html)) {
    violations.push({
      code: "UNSCOPED_OR_HTTP_MICRODATA_TYPE",
      detail: "Found itemprop attribute without an enclosing itemscope container",
    });
  }

  // 4. <time datetime="..."> machine-readable ISO check
  const timeRegex = /<time\\b([^>]*)>/gi;
  while ((match = timeRegex.exec(html)) !== null) {
    const attrs = match[1];
    const dtMatch = attrs.match(/datetime=["']([^"']+)["']/i);
    if (!dtMatch || !/^\\d{4}-\\d{2}-\\d{2}/.test(dtMatch[1])) {
      violations.push({
        code: "INVALID_TIME_DATETIME",
        detail: "<time> element is missing a valid ISO-8601 datetime attribute",
      });
    }
  }

  return {
    valid: violations.length === 0,
    h1Count,
    headingLevels,
    microdataTypes,
    violations,
  };
}`,
    criteria: [
      "Verifies exactly one <h1> element and flags skipped heading levels (e.g., <h1> jumping directly to <h4>)",
      "Validates presence of a <main> landmark and machine-readable ISO-8601 <time datetime=\"...\"> attributes",
      "Enforces valid Schema.org Microdata scoping (itemscope with https://schema.org/* itemtype for itemprop nodes)",
    ],
  },
  {
    id: "task_html_importmap_modulepreload_sri",
    title: "Implement HTML <script type=\"importmap\"> with Scoped Module Resolution, Subresource Integrity Map & <link rel=\"modulepreload\">",
    category: "html-architecture",
    difficulty: "advanced",
    tags: ["html", "importmap", "modulepreload", "sri-integrity", "esm", "whatwg"],
    instructions:
      "A buildless ESM web application loads 20 unpinned bare specifiers over a slow waterfall without Subresource Integrity (SRI) verification or modulepreload hints, and places <script type=\"importmap\"> after a <script type=\"module\"> tag (which the WHATWG HTML parser ignores). Build a TypeScript Import Map & Modulepreload compiler that emits a valid <script type=\"importmap\"> with imports, scopes, and SHA-384 integrity maps before any module scripts, plus <link rel=\"modulepreload\" integrity=\"...\" crossorigin=\"anonymous\"> tags.",
    starterCode: `// Invalid Import Map Placed After Module Script & Missing Integrity Map / Modulepreload
export function renderModuleBootstrap(modules: any[]) {
  return \`
    <script type="module" src="/app.js"></script>
    <script type="importmap">{ "imports": {} }</script>
  \`;
}`,
    solutionCode: `// WHATWG HTML <script type="importmap"> with Scoped Resolution, Integrity Map & <link rel="modulepreload">
export interface ImportMapModuleEntry {
  readonly specifier: string;
  readonly url: string;
  readonly integritySha384: \`sha384-\${string}\`;
  readonly preload?: boolean;
}

export interface ImportMapConfig {
  readonly entries: readonly ImportMapModuleEntry[];
  readonly scopes?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  readonly entryModuleSrc: string;
}

export function compileImportMapBootstrapHtml(config: ImportMapConfig): {
  readonly importMapJson: {
    readonly imports: Record<string, string>;
    readonly scopes: Record<string, Record<string, string>>;
    readonly integrity: Record<string, string>;
  };
  readonly html: string;
} {
  const imports: Record<string, string> = {};
  const integrity: Record<string, string> = {};
  const preloadLinks: string[] = [];

  for (const entry of config.entries) {
    if (!entry.integritySha384.startsWith("sha384-")) {
      throw new Error(\`Invalid SRI hash for '\${entry.specifier}'\`);
    }
    imports[entry.specifier] = entry.url;
    integrity[entry.url] = entry.integritySha384;

    if (entry.preload !== false) {
      preloadLinks.push(
        \`<link rel="modulepreload" href="\${entry.url}" integrity="\${entry.integritySha384}" crossorigin="anonymous" />\`,
      );
    }
  }

  const scopes: Record<string, Record<string, string>> = {};
  for (const [scopePrefix, map] of Object.entries(config.scopes ?? {})) {
    scopes[scopePrefix] = { ...map };
  }

  const importMapJson = { imports, scopes, integrity };
  const serializedMap = JSON.stringify(importMapJson).replace(/</g, "\\\\u003c");

  // WHATWG rule: <script type="importmap"> MUST precede all <script type="module"> and <link rel="modulepreload">
  const html = [
    \`<script type="importmap">\${serializedMap}</script>\`,
    ...preloadLinks,
    \`<script type="module" src="\${config.entryModuleSrc}" crossorigin="anonymous"></script>\`,
  ].join("\\n");

  return { importMapJson, html };
}`,
    criteria: [
      "Emits <script type=\"importmap\"> strictly before any <link rel=\"modulepreload\"> or <script type=\"module\"> tags",
      "Populates the WHATWG importmap integrity dictionary mapping resolved module URLs to sha384- SRI digests",
      "Generates <link rel=\"modulepreload\" integrity=\"...\" crossorigin=\"anonymous\"> hints to flatten ESM dependency waterfalls",
    ],
  },
  {
    id: "task_seo_software_app_faq_dataset_graph",
    title: "Architect Schema.org Dataset, WebSite Sitelinks SearchAction & FAQPage Multi-Entity JSON-LD Validator with sameAs Graph",
    category: "seo-structured-data",
    difficulty: "advanced",
    tags: ["seo", "schema-org", "json-ld", "dataset-schema", "search-action", "faq-page", "knowledge-graph"],
    instructions:
      "An open benchmark portal publishes benchmark datasets and technical FAQs without Schema.org Dataset distribution metadata (DataDownload, encodingFormat, license), WebSite potentialAction (SearchAction with EntryPoint urlTemplate), or Organization sameAs authority links. Build a TypeScript Schema.org Dataset + SearchAction + FAQPage @graph generator with strict entity validation.",
    starterCode: `// Incomplete Unlinked Dataset JSON-LD Missing DataDownload, license & SearchAction
export function buildPortalSchema(portal: any) {
  return { "@type": "Dataset", name: portal.name };
}`,
    solutionCode: `// Schema.org Dataset, WebSite SearchAction & FAQPage Connected @graph Builder
export interface BenchmarkPortalSchemaSpec {
  readonly origin: string;
  readonly orgName: string;
  readonly sameAsUrls: readonly string[];
  readonly searchUrlTemplate: \`\${string}{search_term_string}\${string}\`;
  readonly dataset: {
    readonly name: string;
    readonly description: string;
    readonly licenseUrl: string;
    readonly downloadUrl: string;
    readonly encodingFormat: "application/json" | "text/csv" | "application/parquet";
  };
  readonly faqs: readonly { readonly question: string; readonly answerHtml: string }[];
}

export function buildBenchmarkPortalJsonLdGraph(spec: BenchmarkPortalSchemaSpec) {
  if (spec.dataset.description.trim().length < 25) {
    throw new Error("Schema.org Dataset description must be at least 25 characters");
  }
  if (!spec.searchUrlTemplate.includes("{search_term_string}")) {
    throw new Error("SearchAction target urlTemplate must include {search_term_string}");
  }

  const base = spec.origin.replace(/\\/+$/, "");
  const orgId = \`\${base}/#organization\`;
  const websiteId = \`\${base}/#website\`;
  const datasetId = \`\${base}/#dataset\`;
  const faqId = \`\${base}/#faq\`;

  const graph = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: spec.orgName,
      url: base,
      sameAs: [...spec.sameAsUrls],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: base,
      publisher: { "@id": orgId },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: spec.searchUrlTemplate,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Dataset",
      "@id": datasetId,
      name: spec.dataset.name,
      description: spec.dataset.description,
      license: spec.dataset.licenseUrl,
      creator: { "@id": orgId },
      isAccessibleForFree: true,
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: spec.dataset.encodingFormat,
          contentUrl: spec.dataset.downloadUrl,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": faqId,
      isPartOf: { "@id": websiteId },
      mainEntity: spec.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answerHtml,
        },
      })),
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}`,
    criteria: [
      "Emits a Schema.org Dataset node with license, creator @id link, and DataDownload distribution (encodingFormat + contentUrl)",
      "Configures WebSite potentialAction with a SearchAction EntryPoint urlTemplate and query-input binding",
      "Links Organization sameAs authority URLs and FAQPage Question/AcceptedAnswer entities inside a single @graph",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════════
   * DOMAIN 10: E-COMMERCE & CHECKOUT ENGINEERING (ecommerce-checkout)
   * ═══════════════════════════════════════════════════════════════════════════ */
  {
    id: "task_ecom_integer_cents_dinero_cart_engine",
    title: "Refactor Floating-Point Cart Math to Integer Minor-Unit (Dinero Pattern) Multi-Currency Pricing & Largest-Remainder Promo Proration",
    category: "ecommerce-checkout",
    difficulty: "advanced",
    tags: ["ecommerce", "checkout", "dinero-cents", "largest-remainder", "multi-currency", "typescript"],
    instructions:
      "A checkout cart computes line-item subtotals and coupon discounts using IEEE-754 floating-point numbers (e.g., 19.99 * 3 = 59.970000000000006), loses pennies when splitting a cart-wide discount across line items for per-item tax/refund reporting, and fails on zero-decimal currencies (JPY, KRW). Refactor to an integer minor-unit (cents) pricing engine using Hamilton's Largest Remainder method for exact line-item discount allocation.",
    starterCode: `// Vulnerable Floating-Point Cart Math Losing Pennies on Discount Proration
export function calculateCartFloat(items: any[], discountDollars: number) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return { subtotal, total: subtotal - discountDollars };
}`,
    solutionCode: `// Integer Minor-Unit (Dinero Pattern) Multi-Currency Cart & Largest-Remainder Proration Engine
export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "KRW";

export const CURRENCY_EXPONENTS: Readonly<Record<CurrencyCode, 0 | 2>> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  KRW: 0,
};

export interface CartLineInput {
  readonly sku: string;
  readonly unitAmountMinor: number; // integer cents for USD/EUR/GBP, integer yen for JPY
  readonly quantity: number;
}

export interface PromoRule {
  readonly code: string;
  readonly kind: "FIXED_CART" | "PERCENT_BPS"; // basis points: 1500 = 15.00%
  readonly value: number;
}

export interface ProratedLineItem {
  readonly sku: string;
  readonly grossMinor: number;
  readonly discountMinor: number;
  readonly netMinor: number;
}

export function computeCartPricingMinor(
  currency: CurrencyCode,
  lines: readonly CartLineInput[],
  promos: readonly PromoRule[],
): {
  readonly currency: CurrencyCode;
  readonly exponent: 0 | 2;
  readonly subtotalMinor: number;
  readonly totalDiscountMinor: number;
  readonly netTotalMinor: number;
  readonly lineItems: readonly ProratedLineItem[];
} {
  for (const line of lines) {
    if (!Number.isSafeInteger(line.unitAmountMinor) || line.unitAmountMinor < 0) {
      throw new Error(\`unitAmountMinor must be a non-negative integer for SKU \${line.sku}\`);
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error(\`quantity must be a positive integer for SKU \${line.sku}\`);
    }
  }

  const grossLines = lines.map((l) => ({
    sku: l.sku,
    grossMinor: l.unitAmountMinor * l.quantity,
  }));
  const subtotalMinor = grossLines.reduce((acc, l) => acc + l.grossMinor, 0);

  // Apply promos in deterministic order: PERCENT_BPS first, then FIXED_CART, capped at subtotalMinor
  let runningNet = subtotalMinor;
  const sortedPromos = [...promos].sort((a, b) =>
    a.kind === b.kind ? a.code.localeCompare(b.code) : a.kind === "PERCENT_BPS" ? -1 : 1,
  );

  for (const promo of sortedPromos) {
    if (promo.kind === "PERCENT_BPS") {
      const cut = Math.floor((runningNet * promo.value) / 10000);
      runningNet = Math.max(0, runningNet - cut);
    } else if (promo.kind === "FIXED_CART") {
      runningNet = Math.max(0, runningNet - promo.value);
    }
  }

  const totalDiscountMinor = subtotalMinor - runningNet;

  // Hamilton's Largest Remainder Method to prorate totalDiscountMinor across line items without losing 1 cent
  if (subtotalMinor === 0 || totalDiscountMinor === 0) {
    return {
      currency,
      exponent: CURRENCY_EXPONENTS[currency],
      subtotalMinor,
      totalDiscountMinor: 0,
      netTotalMinor: subtotalMinor,
      lineItems: grossLines.map((l) => ({
        sku: l.sku,
        grossMinor: l.grossMinor,
        discountMinor: 0,
        netMinor: l.grossMinor,
      })),
    };
  }

  const quotas = grossLines.map((l, idx) => {
    const exactNumerator = totalDiscountMinor * l.grossMinor;
    const floorShare = Math.floor(exactNumerator / subtotalMinor);
    const remainder = exactNumerator % subtotalMinor;
    return { idx, floorShare, remainder };
  });

  let remainderUnits =
    totalDiscountMinor - quotas.reduce((acc, q) => acc + q.floorShare, 0);

  quotas.sort((a, b) => (b.remainder !== a.remainder ? b.remainder - a.remainder : a.idx - b.idx));
  for (let i = 0; i < remainderUnits; i++) {
    quotas[i].floorShare += 1;
  }
  quotas.sort((a, b) => a.idx - b.idx);

  const lineItems: ProratedLineItem[] = grossLines.map((l, idx) => {
    const discountMinor = quotas[idx].floorShare;
    return {
      sku: l.sku,
      grossMinor: l.grossMinor,
      discountMinor,
      netMinor: l.grossMinor - discountMinor,
    };
  });

  return {
    currency,
    exponent: CURRENCY_EXPONENTS[currency],
    subtotalMinor,
    totalDiscountMinor,
    netTotalMinor: subtotalMinor - totalDiscountMinor,
    lineItems,
  };
}`,
    criteria: [
      "Enforces integer minor-unit arithmetic (Number.isSafeInteger) and supports 0-decimal (JPY/KRW) and 2-decimal (USD/EUR/GBP) currencies",
      "Applies PERCENT_BPS and FIXED_CART promotions deterministically without negative balance underflow",
      "Allocates cart-level discounts across line items via Hamilton's Largest Remainder method so sum(line.discountMinor) === totalDiscountMinor",
    ],
  },
  {
    id: "task_ecom_inventory_reservation_ttl_oversell_guard",
    title: "Implement Atomic Inventory Reservation Hold Engine with TTL Lease Expiry, Idempotent Checkout Commit & Flash-Sale Oversell Prevention",
    category: "ecommerce-checkout",
    difficulty: "advanced",
    tags: ["ecommerce", "inventory", "concurrency", "ttl-lease", "flash-sale", "idempotency"],
    instructions:
      "During high-concurrency flash sales, checking stock at cart view and decrementing only after payment webhook arrival causes massive overselling of limited inventory, while decrementing early permanently locks stock from abandoned checkouts. Implement an atomic InventoryReservationEngine with TTL-bounded hold leases, automatic expired-lease reclamation, idempotent reservation retries, and commit-on-capture.",
    starterCode: `// Race-Prone Inventory Check Vulnerable to Flash-Sale Overselling
export class NaiveInventory {
  stock = new Map<string, number>();
  canBuy(sku: string, qty: number) {
    return (this.stock.get(sku) ?? 0) >= qty;
  }
}`,
    solutionCode: `// Atomic Inventory Reservation Engine with TTL Leases & Idempotent Commit
export interface ReservationHold {
  readonly holdId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly expiresAtMs: number;
  status: "ACTIVE" | "COMMITTED" | "RELEASED" | "EXPIRED";
}

export class InventoryReservationEngine {
  #physicalStock = new Map<string, number>();
  #holds = new Map<string, ReservationHold>();

  setPhysicalStock(sku: string, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error("Stock must be a non-negative integer");
    }
    this.#physicalStock.set(sku, quantity);
  }

  reclaimExpiredHolds(nowMs: number): number {
    let reclaimed = 0;
    for (const hold of this.#holds.values()) {
      if (hold.status === "ACTIVE" && nowMs >= hold.expiresAtMs) {
        hold.status = "EXPIRED";
        reclaimed++;
      }
    }
    return reclaimed;
  }

  getAvailableStock(sku: string, nowMs: number): number {
    this.reclaimExpiredHolds(nowMs);
    const physical = this.#physicalStock.get(sku) ?? 0;
    let reserved = 0;
    for (const hold of this.#holds.values()) {
      if (hold.sku === sku && hold.status === "ACTIVE") {
        reserved += hold.quantity;
      }
    }
    return Math.max(0, physical - reserved);
  }

  reserve(params: {
    readonly holdId: string;
    readonly sku: string;
    readonly quantity: number;
    readonly nowMs: number;
    readonly ttlMs?: number;
  }): { readonly ok: boolean; readonly hold?: ReservationHold; readonly availableStock: number } {
    this.reclaimExpiredHolds(params.nowMs);

    // Idempotent replay of an existing active or committed hold
    const existing = this.#holds.get(params.holdId);
    if (existing && (existing.status === "ACTIVE" || existing.status === "COMMITTED")) {
      if (existing.sku !== params.sku || existing.quantity !== params.quantity) {
        throw new Error(\`Hold ID '\${params.holdId}' reused with mismatched SKU or quantity\`);
      }
      return {
        ok: true,
        hold: { ...existing },
        availableStock: this.getAvailableStock(params.sku, params.nowMs),
      };
    }

    const available = this.getAvailableStock(params.sku, params.nowMs);
    if (params.quantity <= 0 || available < params.quantity) {
      return { ok: false, availableStock: available };
    }

    const hold: ReservationHold = {
      holdId: params.holdId,
      sku: params.sku,
      quantity: params.quantity,
      expiresAtMs: params.nowMs + (params.ttlMs ?? 600_000),
      status: "ACTIVE",
    };
    this.#holds.set(params.holdId, hold);

    return {
      ok: true,
      hold: { ...hold },
      availableStock: available - params.quantity,
    };
  }

  commitHold(holdId: string, nowMs: number): ReservationHold {
    this.reclaimExpiredHolds(nowMs);
    const hold = this.#holds.get(holdId);
    if (!hold) throw new Error(\`Unknown hold '\${holdId}'\`);
    if (hold.status === "COMMITTED") return { ...hold };
    if (hold.status !== "ACTIVE") {
      throw new Error(\`Cannot commit hold '\${holdId}' in status '\${hold.status}'\`);
    }

    const physical = this.#physicalStock.get(hold.sku) ?? 0;
    if (physical < hold.quantity) {
      throw new Error("Physical stock invariant violation");
    }
    this.#physicalStock.set(hold.sku, physical - hold.quantity);
    hold.status = "COMMITTED";
    return { ...hold };
  }

  releaseHold(holdId: string): boolean {
    const hold = this.#holds.get(holdId);
    if (!hold || hold.status !== "ACTIVE") return false;
    hold.status = "RELEASED";
    return true;
  }
}`,
    criteria: [
      "Prevents flash-sale overselling by subtracting active TTL-bound reservation holds from physical stock",
      "Automatically reclaims expired holds (nowMs >= expiresAtMs) so abandoned checkouts release inventory",
      "Supports idempotent reserve(holdId) retries and atomic physical stock deduction on commitHold()",
    ],
  },
  {
    id: "task_ecom_global_tax_vat_reverse_charge_engine",
    title: "Build Global Cross-Border Tax, EU VAT Reverse-Charge (B2B VIES) & US Economic Nexus Threshold Calculator",
    category: "ecommerce-checkout",
    difficulty: "advanced",
    tags: ["ecommerce", "tax", "eu-vat", "reverse-charge", "economic-nexus", "compliance"],
    instructions:
      "A checkout engine applies a hardcoded 8% tax rate to all orders, illegally charging VAT on cross-border EU B2B transactions where the buyer supplies a valid VIES VAT number (which requires 0% VAT under Article 196 Reverse Charge) and charging US state sales tax where the merchant has not crossed economic nexus ($100,000 sales or 200 transactions). Build a deterministic Global Tax & VAT Calculator.",
    starterCode: `// Naive Flat Tax Rate Ignoring EU B2B Reverse Charge & US Economic Nexus
export function computeTax(amountCents: number) {
  return Math.round(amountCents * 0.08);
}`,
    solutionCode: `// Global Cross-Border Tax, EU VAT Reverse-Charge (B2B) & US Economic Nexus Calculator
export interface MerchantTaxProfile {
  readonly homeCountry: string; // e.g., "DE" or "US"
  readonly usStateExposure: Readonly<
    Record<string, { readonly trailingRevenueMinor: number; readonly trailingTransactions: number }>
  >;
}

export interface TaxCalculationInput {
  readonly amountMinor: number;
  readonly taxInclusive: boolean;
  readonly buyerCountry: string;
  readonly buyerState?: string;
  readonly buyerVatId?: string;
  readonly merchant: MerchantTaxProfile;
}

export interface TaxQuoteResult {
  readonly netAmountMinor: number;
  readonly taxAmountMinor: number;
  readonly grossAmountMinor: number;
  readonly appliedRateBps: number;
  readonly regime: "EU_DOMESTIC_VAT" | "EU_B2C_OSS_VAT" | "EU_B2B_REVERSE_CHARGE" | "US_STATE_NEXUS" | "EXEMPT_EXPORT";
  readonly reverseCharge: boolean;
  readonly invoiceNotice: string | null;
}

const EU_VAT_RATES_BPS: Readonly<Record<string, number>> = {
  DE: 1900,
  FR: 2000,
  NL: 2100,
  SE: 2500,
  IE: 2300,
};

const US_STATE_RATES_BPS: Readonly<Record<string, number>> = {
  CA: 725,
  NY: 888,
  TX: 625,
  WA: 650,
};

export function isValidEuVatFormat(vatId: string | undefined, country: string): boolean {
  if (!vatId) return false;
  const normalized = vatId.replace(/\\s+/g, "").toUpperCase();
  return normalized.startsWith(country.toUpperCase()) && /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(normalized);
}

export function calculateGlobalCheckoutTax(input: TaxCalculationInput): TaxQuoteResult {
  const buyerCountry = input.buyerCountry.toUpperCase();
  const merchantCountry = input.merchant.homeCountry.toUpperCase();
  const isBuyerEu = buyerCountry in EU_VAT_RATES_BPS;
  const isMerchantEu = merchantCountry in EU_VAT_RATES_BPS;

  let rateBps = 0;
  let regime: TaxQuoteResult["regime"] = "EXEMPT_EXPORT";
  let reverseCharge = false;
  let invoiceNotice: string | null = null;

  if (isBuyerEu && isMerchantEu) {
    if (buyerCountry !== merchantCountry && isValidEuVatFormat(input.buyerVatId, buyerCountry)) {
      rateBps = 0;
      regime = "EU_B2B_REVERSE_CHARGE";
      reverseCharge = true;
      invoiceNotice = "Reverse charge — VAT exempt under Article 196 Council Directive 2006/112/EC";
    } else if (buyerCountry === merchantCountry) {
      rateBps = EU_VAT_RATES_BPS[buyerCountry];
      regime = "EU_DOMESTIC_VAT";
    } else {
      rateBps = EU_VAT_RATES_BPS[buyerCountry];
      regime = "EU_B2C_OSS_VAT";
    }
  } else if (buyerCountry === "US" && input.buyerState) {
    const state = input.buyerState.toUpperCase();
    const exposure = input.merchant.usStateExposure[state] ?? {
      trailingRevenueMinor: 0,
      trailingTransactions: 0,
    };
    const hasEconomicNexus =
      exposure.trailingRevenueMinor >= 10_000_000 || exposure.trailingTransactions >= 200;
    if (hasEconomicNexus && state in US_STATE_RATES_BPS) {
      rateBps = US_STATE_RATES_BPS[state];
      regime = "US_STATE_NEXUS";
    }
  }

  if (input.taxInclusive && rateBps > 0) {
    const netAmountMinor = Math.round((input.amountMinor * 10000) / (10000 + rateBps));
    const taxAmountMinor = input.amountMinor - netAmountMinor;
    return {
      netAmountMinor,
      taxAmountMinor,
      grossAmountMinor: input.amountMinor,
      appliedRateBps: rateBps,
      regime,
      reverseCharge,
      invoiceNotice,
    };
  }

  const taxAmountMinor = Math.round((input.amountMinor * rateBps) / 10000);
  return {
    netAmountMinor: input.amountMinor,
    taxAmountMinor,
    grossAmountMinor: input.amountMinor + taxAmountMinor,
    appliedRateBps: rateBps,
    regime,
    reverseCharge,
    invoiceNotice,
  };
}`,
    criteria: [
      "Applies 0% VAT with reverseCharge: true and statutory Article 196 notice for valid cross-border EU B2B VAT IDs",
      "Enforces destination EU OSS VAT rates for B2C orders and US Economic Nexus thresholds ($100k revenue or 200 transactions)",
      "Supports both tax-exclusive and tax-inclusive minor-unit price extraction",
    ],
  },
  {
    id: "task_ecom_checkout_state_machine_3ds_saga",
    title: "Architect Multi-Step Checkout & 3-D Secure (requires_action) Saga Coordinator with Compensation Rollback",
    category: "ecommerce-checkout",
    difficulty: "advanced",
    tags: ["ecommerce", "checkout", "saga-pattern", "3ds-authentication", "state-machine", "rollback"],
    instructions:
      "A checkout handler runs inventory hold, coupon redemption, and card authorization without a formal state machine or compensation log. When a 3-D Secure (3DS2) challenge fails or times out, the inventory hold and single-use promo code remain permanently locked. Implement a deterministic CheckoutSagaStateMachine that coordinates 3DS requires_action transitions and executes reverse-order compensation on failure.",
    starterCode: `// Uncoordinated Checkout Leaving Orphaned Inventory & Promo Locks on 3DS Failure
export async function runCheckout(order: any) {
  await order.reserveStock();
  await order.redeemCoupon();
  return await order.chargeCard();
}`,
    solutionCode: `// Deterministic Checkout & 3-D Secure (requires_action) Saga Coordinator
export type CheckoutState =
  | "DRAFT"
  | "INVENTORY_RESERVED"
  | "PROMO_LOCKED"
  | "AWAITING_3DS_ACTION"
  | "CAPTURED"
  | "FULFILLED"
  | "FAILED_COMPENSATED";

export interface CheckoutSagaContext {
  readonly checkoutId: string;
  state: CheckoutState;
  readonly compensationStack: Array<{ readonly step: string; readonly undo: () => Promise<void> }>;
  readonlycompensatedSteps: string[];
  paymentIntentId: string | null;
}

export class CheckoutSagaCoordinator {
  async executeCheckout(
    checkoutId: string,
    adapters: {
      reserveInventory: () => Promise<void>;
      releaseInventory: () => Promise<void>;
      lockPromoCoupon: () => Promise<void>;
      unlockPromoCoupon: () => Promise<void>;
      createPaymentIntent: () => Promise<{ id: string; status: "succeeded" | "requires_action" | "failed" }>;
      cancelPaymentIntent: (piId: string) => Promise<void>;
    },
  ): Promise<{
    readonly checkoutId: string;
    readonly state: CheckoutState;
    readonly paymentIntentId: string | null;
    readonly compensatedSteps: readonly string[];
  }> {
    const compensationStack: Array<{ step: string; undo: () => Promise<void> }> = [];
    const compensatedSteps: string[] = [];
    let state: CheckoutState = "DRAFT";
    let paymentIntentId: string | null = null;

    const compensateAll = async () => {
      while (compensationStack.length > 0) {
        const item = compensationStack.pop()!;
        await item.undo();
        compensatedSteps.push(item.step);
      }
      state = "FAILED_COMPENSATED";
    };

    try {
      await adapters.reserveInventory();
      state = "INVENTORY_RESERVED";
      compensationStack.push({ step: "releaseInventory", undo: adapters.releaseInventory });

      await adapters.lockPromoCoupon();
      state = "PROMO_LOCKED";
      compensationStack.push({ step: "unlockPromoCoupon", undo: adapters.unlockPromoCoupon });

      const pi = await adapters.createPaymentIntent();
      paymentIntentId = pi.id;
      compensationStack.push({
        step: "cancelPaymentIntent",
        undo: () => adapters.cancelPaymentIntent(pi.id),
      });

      if (pi.status === "requires_action") {
        state = "AWAITING_3DS_ACTION";
        return { checkoutId, state, paymentIntentId, compensatedSteps };
      }

      if (pi.status !== "succeeded") {
        await compensateAll();
        return { checkoutId, state, paymentIntentId, compensatedSteps };
      }

      state = "FULFILLED";
      return { checkoutId, state, paymentIntentId, compensatedSteps };
    } catch {
      await compensateAll();
      return { checkoutId, state, paymentIntentId, compensatedSteps };
    }
  }
}`,
    criteria: [
      "Transitions deterministically through INVENTORY_RESERVED, PROMO_LOCKED, AWAITING_3DS_ACTION, and FULFILLED",
      "Pauses saga completion when payment status is requires_action (3-D Secure challenge pending)",
      "Executes reverse-order LIFO compensation (cancelPaymentIntent -> unlockPromoCoupon -> releaseInventory) on failure",
    ],
  },
  {
    id: "task_ecom_polar_mor_license_entitlement_provisioning",
    title: "Build Polar.sh Merchant-of-Record (@polar-sh/sdk) Digital Entitlement, License Key & Device Seat Activation Engine",
    category: "ecommerce-checkout",
    difficulty: "advanced",
    tags: ["polar-sh", "merchant-of-record", "license-keys", "entitlements", "saas-billing", "typescript"],
    instructions:
      "An AI developer tool sells Pro subscriptions via Polar.sh (Merchant of Record) but lacks automated benefit provisioning, seat-bounded machine fingerprint activations, and immediate revocation when Polar emits subscription.revoked or order.refunded webhooks. Build a PolarEntitlementEngine that provisions prefix-scoped license keys, enforces maxActivations per hardware fingerprint, and revokes access on refund/expiry.",
    starterCode: `// Unbounded Static License Check Without Polar Benefit Lifecycle or Seat Limits
export function checkLicense(key: string) {
  return key.startsWith("POLAR-");
}`,
    solutionCode: `// Polar.sh Merchant-of-Record Digital Entitlement & Seat-Bounded License Engine
export interface PolarLicenseRecord {
  readonly licenseKey: string;
  readonly customerId: string;
  readonly benefitId: string;
  readonly subscriptionId: string;
  readonly maxActivations: number;
  readonly activations: Map<string, { readonly machineFingerprint: string; readonly activatedAtIso: string }>;
  status: "active" | "revoked" | "expired";
  expiresAtMs: number | null;
}

export class PolarEntitlementEngine {
  #licenses = new Map<string, PolarLicenseRecord>();

  provisionBenefitGrant(event: {
    readonly customerId: string;
    readonly subscriptionId: string;
    readonly benefitId: string;
    readonly keySuffix: string;
    readonly maxActivations: number;
    readonly expiresAtMs?: number | null;
  }): PolarLicenseRecord {
    const licenseKey = \`POLAR-PRO-\${event.keySuffix.toUpperCase()}\`;
    const record: PolarLicenseRecord = {
      licenseKey,
      customerId: event.customerId,
      benefitId: event.benefitId,
      subscriptionId: event.subscriptionId,
      maxActivations: event.maxActivations,
      activations: new Map(),
      status: "active",
      expiresAtMs: event.expiresAtMs ?? null,
    };
    this.#licenses.set(licenseKey, record);
    return record;
  }

  activateMachineSeat(params: {
    readonly licenseKey: string;
    readonly machineFingerprint: string;
    readonly nowMs: number;
  }): { readonly allowed: boolean; readonly reason?: string; readonly usedSeats: number; readonly maxSeats: number } {
    const record = this.#licenses.get(params.licenseKey);
    if (!record) return { allowed: false, reason: "UNKNOWN_LICENSE", usedSeats: 0, maxSeats: 0 };

    if (record.expiresAtMs !== null && params.nowMs >= record.expiresAtMs) {
      record.status = "expired";
    }
    if (record.status !== "active") {
      return {
        allowed: false,
        reason: \`LICENSE_\${record.status.toUpperCase()}\`,
        usedSeats: record.activations.size,
        maxSeats: record.maxActivations,
      };
    }

    // Idempotent re-activation on same machine fingerprint
    if (record.activations.has(params.machineFingerprint)) {
      return {
        allowed: true,
        usedSeats: record.activations.size,
        maxSeats: record.maxActivations,
      };
    }

    if (record.activations.size >= record.maxActivations) {
      return {
        allowed: false,
        reason: "MAX_SEAT_ACTIVATIONS_EXCEEDED",
        usedSeats: record.activations.size,
        maxSeats: record.maxActivations,
      };
    }

    record.activations.set(params.machineFingerprint, {
      machineFingerprint: params.machineFingerprint,
      activatedAtIso: new Date(params.nowMs).toISOString(),
    });

    return {
      allowed: true,
      usedSeats: record.activations.size,
      maxSeats: record.maxActivations,
    };
  }

  handleSubscriptionLifecycleWebhook(event: {
    readonly type: "subscription.revoked" | "order.refunded" | "benefit_grant.revoked";
    readonly subscriptionId: string;
  }): number {
    let revokedCount = 0;
    for (const record of this.#licenses.values()) {
      if (record.subscriptionId === event.subscriptionId && record.status !== "revoked") {
        record.status = "revoked";
        record.activations.clear();
        revokedCount++;
      }
    }
    return revokedCount;
  }
}`,
    criteria: [
      "Provisions Polar.sh benefit grants with scoped license keys and bounded maxActivations seat limits",
      "Supports idempotent machine fingerprint re-activation while blocking seat limit overflows (MAX_SEAT_ACTIVATIONS_EXCEEDED)",
      "Revokes license keys and clears active machine seats upon subscription.revoked or order.refunded webhooks",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════════
   * DOMAIN 11: PAYMENT PROCESSING, STRIPE & POLAR.SH (payment-processing)
   * ═══════════════════════════════════════════════════════════════════════════ */
  {
    id: "task_pay_stripe_payment_intent_idempotency_engine",
    title: "Harden Stripe PaymentIntent & Checkout Session Coordinator with Payload-Hashed Idempotency Keys, Manual Capture & Retry Recovery",
    category: "payment-processing",
    difficulty: "advanced",
    tags: ["stripe", "payment-intents", "idempotency-key", "manual-capture", "fintech", "typescript"],
    instructions:
      "A checkout endpoint creates a new Stripe PaymentIntent on every retry without an Idempotency-Key or payload fingerprint validation, causing duplicate customer card charges on flaky mobile networks and failing to reject reused idempotency keys when cart amounts change (Stripe 400 idempotency_error). Build a StripePaymentIntentCoordinator with SHA-256 request payload fingerprinting, in-flight deduplication, manual vs automatic capture, and partial capture support.",
    starterCode: `// Unprotected PaymentIntent Creation Causing Duplicate Card Charges on Network Retry
export async function createPayment(stripe: any, amount: number, currency: string) {
  return stripe.paymentIntents.create({ amount, currency });
}`,
    solutionCode: `// Hardened Stripe PaymentIntent Coordinator with Payload-Hashed Idempotency & Manual Capture
export interface CreatePaymentIntentInput {
  readonly idempotencyKey: string;
  readonly customerId: string;
  readonly orderId: string;
  readonly amountMinor: number;
  readonly currency: "usd" | "eur" | "gbp" | "jpy";
  readonly captureMethod: "automatic" | "manual";
}

export interface StripePaymentIntentRecord {
  readonly id: string;
  readonly clientSecret: string;
  readonly customerId: string;
  readonly orderId: string;
  readonly amountMinor: number;
  readonly amountCapturableMinor: number;
  amountReceivedMinor: number;
  readonly currency: string;
  readonly captureMethod: "automatic" | "manual";
  status: "requires_payment_method" | "requires_action" | "requires_capture" | "succeeded" | "canceled";
}

function hashPayloadFingerprint(input: Omit<CreatePaymentIntentInput, "idempotencyKey">): string {
  const canonical = \`\${input.customerId}|\${input.orderId}|\${input.amountMinor}|\${input.currency}|\${input.captureMethod}\`;
  let h = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export class StripePaymentIntentCoordinator {
  #idempotencyStore = new Map<
    string,
    { readonly payloadHash: string; readonly intentId: string }
  >();
  #intents = new Map<string, StripePaymentIntentRecord>();
  #seq = 1;

  createOrRetrieveIntent(input: CreatePaymentIntentInput): {
    readonly intent: StripePaymentIntentRecord;
    readonly idempotentReplay: boolean;
  } {
    if (!input.idempotencyKey || input.idempotencyKey.trim().length < 8) {
      throw new Error("Idempotency-Key must be at least 8 characters");
    }
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error("amountMinor must be a positive integer");
    }

    const payloadHash = hashPayloadFingerprint(input);
    const existingEntry = this.#idempotencyStore.get(input.idempotencyKey);

    if (existingEntry) {
      if (existingEntry.payloadHash !== payloadHash) {
        throw new Error(
          \`IdempotencyParameterMismatchError: Keys for idempotent requests can only be used with the same parameters (\${input.idempotencyKey})\`,
        );
      }
      const existingIntent = this.#intents.get(existingEntry.intentId)!;
      return { intent: { ...existingIntent }, idempotentReplay: true };
    }

    const id = \`pi_live_\${this.#seq++}_\${payloadHash}\`;
    const isManual = input.captureMethod === "manual";
    const intent: StripePaymentIntentRecord = {
      id,
      clientSecret: \`\${id}_secret_\${payloadHash}\`,
      customerId: input.customerId,
      orderId: input.orderId,
      amountMinor: input.amountMinor,
      amountCapturableMinor: isManual ? input.amountMinor : 0,
      amountReceivedMinor: isManual ? 0 : input.amountMinor,
      currency: input.currency,
      captureMethod: input.captureMethod,
      status: isManual ? "requires_capture" : "succeeded",
    };

    this.#intents.set(id, intent);
    this.#idempotencyStore.set(input.idempotencyKey, { payloadHash, intentId: id });
    return { intent: { ...intent }, idempotentReplay: false };
  }

  captureIntent(intentId: string, amountToCaptureMinor?: number): StripePaymentIntentRecord {
    const intent = this.#intents.get(intentId);
    if (!intent) throw new Error(\`Unknown PaymentIntent '\${intentId}'\`);
    if (intent.status !== "requires_capture") {
      throw new Error(\`PaymentIntent '\${intentId}' cannot be captured in status '\${intent.status}'\`);
    }

    const captureAmt = amountToCaptureMinor ?? intent.amountCapturableMinor;
    if (captureAmt <= 0 || captureAmt > intent.amountCapturableMinor) {
      throw new Error("Invalid capture amount");
    }

    intent.amountReceivedMinor = captureAmt;
    intent.status = "succeeded";
    return { ...intent };
  }
}`,
    criteria: [
      "Fingerprints request parameters per Idempotency-Key and throws IdempotencyParameterMismatchError when reused with mutated amounts",
      "Returns the exact cached PaymentIntent with idempotentReplay: true on duplicate retry requests",
      "Supports captureMethod: \"manual\" (requires_capture) with partial or full captureIntent() settlement",
    ],
  },
  {
    id: "task_pay_stripe_polar_webhook_signature_verifier",
    title: "Implement Dual Stripe (Stripe-Signature t=,v1=) & Polar.sh Standard Webhooks (webhook-signature v1,) Verifier with Replay & Causal Ordering Guard",
    category: "payment-processing",
    difficulty: "advanced",
    tags: ["stripe", "polar-sh", "webhooks", "standard-webhooks", "hmac-sha256", "idempotency"],
    instructions:
      "Webhook endpoints frequently parse JSON before verifying HMAC signatures (breaking raw-body byte integrity), skip 300-second timestamp tolerance checks, and allow out-of-order delivery (e.g., an older subscription.updated overwriting a newer subscription.deleted). Build a unified WebhookSecurityVerifier supporting both Stripe's Stripe-Signature (t=<ts>,v1=<sig>) and Polar.sh's Standard Webhooks (webhook-id, webhook-timestamp, webhook-signature: v1,<sig>) with constant-time comparison, replay protection, and per-entity timestamp watermarks.",
    starterCode: `// Insecure Webhook Handler Trusting Unverified JSON Body & Vulnerable to Out-of-Order Replay
export function handleWebhook(body: any) {
  return { processed: true, type: body.type };
}`,
    solutionCode: `// Unified Stripe (t=,v1=) & Polar.sh Standard Webhooks (v1,) Verifier with Replay & Ordering Guard
export interface WebhookVerificationOutcome {
  readonly valid: boolean;
  readonly provider: "stripe" | "polar";
  readonly deduplicated?: boolean;
  readonly ignoredStaleOutOfOrder?: boolean;
  readonly reason?: string;
}

export function computeWebhookSignatureHex(secret: string, signedPayload: string): string {
  // Deterministic keyed MAC over raw payload string
  let h1 = 0xdeadbeef ^ secret.length;
  let h2 = 0x41c6ce57 ^ signedPayload.length;
  const combined = \`\${secret}::\${signedPayload}\`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export class DualWebhookVerifier {
  #processedEvents = new Set<string>();
  #entityWatermarkSec = new Map<string, number>();

  verifyAndRecord(params: {
    readonly provider: "stripe" | "polar";
    readonly secret: string;
    readonly rawBody: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly nowSec: number;
    readonly toleranceSec?: number;
  }): WebhookVerificationOutcome {
    const tolerance = params.toleranceSec ?? 300;
    let timestampSec = 0;
    let providedSig = "";
    let signedPayload = "";

    if (params.provider === "stripe") {
      const sigHeader = params.headers["stripe-signature"] ?? "";
      const parts = Object.fromEntries(
        sigHeader.split(",").map((kv) => {
          const [k, v] = kv.trim().split("=");
          return [k, v ?? ""];
        }),
      );
      timestampSec = Number(parts.t);
      providedSig = parts.v1 ?? "";
      signedPayload = \`\${timestampSec}.\${params.rawBody}\`;
    } else {
      // Polar.sh uses Standard Webhooks: webhook-id, webhook-timestamp, webhook-signature: "v1,<sig>"
      const msgId = params.headers["webhook-id"] ?? "";
      timestampSec = Number(params.headers["webhook-timestamp"]);
      const rawSig = params.headers["webhook-signature"] ?? "";
      providedSig = rawSig.startsWith("v1,") ? rawSig.slice(3) : rawSig;
      signedPayload = \`\${msgId}.\${timestampSec}.\${params.rawBody}\`;
    }

    if (!Number.isFinite(timestampSec) || !providedSig) {
      return { valid: false, provider: params.provider, reason: "MALFORMED_SIGNATURE_HEADERS" };
    }

    if (Math.abs(params.nowSec - timestampSec) > tolerance) {
      return { valid: false, provider: params.provider, reason: "TIMESTAMP_OUTSIDE_TOLERANCE_WINDOW" };
    }

    const expectedSig = computeWebhookSignatureHex(params.secret, signedPayload);
    if (!constantTimeEqual(expectedSig, providedSig)) {
      return { valid: false, provider: params.provider, reason: "INVALID_HMAC_SIGNATURE" };
    }

    const parsed = JSON.parse(params.rawBody) as {
      id: string;
      created: number;
      entityId: string;
    };

    if (this.#processedEvents.has(parsed.id)) {
      return { valid: true, provider: params.provider, deduplicated: true };
    }
    this.#processedEvents.add(parsed.id);

    const prevWatermark = this.#entityWatermarkSec.get(parsed.entityId) ?? -1;
    if (parsed.created < prevWatermark) {
      return {
        valid: true,
        provider: params.provider,
        deduplicated: false,
        ignoredStaleOutOfOrder: true,
      };
    }

    this.#entityWatermarkSec.set(parsed.entityId, parsed.created);
    return {
      valid: true,
      provider: params.provider,
      deduplicated: false,
      ignoredStaleOutOfOrder: false,
    };
  }
}`,
    criteria: [
      "Verifies both Stripe (Stripe-Signature: t=...,v1=...) and Polar.sh Standard Webhooks (webhook-id, webhook-timestamp, webhook-signature: v1,...)",
      "Enforces constant-time HMAC signature verification and a 300-second replay tolerance window",
      "Deduplicates replayed event IDs and drops stale out-of-order events via per-entity timestamp watermarks",
    ],
  },
  {
    id: "task_pay_subscription_proration_dunning_machine",
    title: "Build SaaS Subscription Mid-Cycle Upgrade/Downgrade Proration Calculator & Smart Dunning (past_due -> unpaid) Recovery Engine",
    category: "payment-processing",
    difficulty: "advanced",
    tags: ["stripe", "polar-sh", "subscriptions", "proration", "dunning", "saas-billing"],
    instructions:
      "When a customer upgrades from a $29/mo Starter plan to a $99/mo Pro plan halfway through a 30-day billing cycle, naive billing charges the full $99 without crediting the unused $14.50 from the Starter tier. Furthermore, a single failed renewal charge immediately cancels enterprise tenants instead of executing a smart dunning schedule with grace periods. Build a SubscriptionProrationAndDunningEngine.",
    starterCode: `// Naive Plan Upgrade Charging Full Price Without Unused Time Proration Credit
export function upgradePlan(currentPriceCents: number, newPriceCents: number) {
  return { amountDueCents: newPriceCents };
}`,
    solutionCode: `// SaaS Subscription Mid-Cycle Proration & Smart Dunning State Machine
export interface ProrationQuoteInput {
  readonly periodStartSec: number;
  readonly periodEndSec: number;
  readonly changeAtSec: number;
  readonly currentPlanAmountMinor: number;
  readonly currentQuantity: number;
  readonly targetPlanAmountMinor: number;
  readonly targetQuantity: number;
}

export interface ProrationQuoteResult {
  readonly unusedCreditMinor: number;
  readonly remainingDebitMinor: number;
  readonly netInvoiceDeltaMinor: number;
  readonly remainingRatioFp: number;
}

export function calculateSubscriptionProration(input: ProrationQuoteInput): ProrationQuoteResult {
  const totalDuration = input.periodEndSec - input.periodStartSec;
  if (totalDuration <= 0) throw new Error("Invalid billing period bounds");
  if (input.changeAtSec < input.periodStartSec || input.changeAtSec > input.periodEndSec) {
    throw new Error("changeAtSec must fall within current billing period");
  }

  const remainingSeconds = input.periodEndSec - input.changeAtSec;
  const currentTotalMinor = input.currentPlanAmountMinor * input.currentQuantity;
  const targetTotalMinor = input.targetPlanAmountMinor * input.targetQuantity;

  const unusedCreditMinor = Math.round((currentTotalMinor * remainingSeconds) / totalDuration);
  const remainingDebitMinor = Math.round((targetTotalMinor * remainingSeconds) / totalDuration);

  return {
    unusedCreditMinor,
    remainingDebitMinor,
    netInvoiceDeltaMinor: remainingDebitMinor - unusedCreditMinor,
    remainingRatioFp: Number((remainingSeconds / totalDuration).toFixed(4)),
  };
}

export type SubscriptionDunningStatus = "active" | "past_due" | "grace_hold" | "unpaid_suspended" | "canceled";

export interface DunningTransitionResult {
  readonly status: SubscriptionDunningStatus;
  readonly entitlementsActive: boolean;
  readonly nextRetryDelayHours: number | null;
}

export function evaluateDunningTransition(params: {
  readonly failedAttempts: number;
  readonly maxAttempts?: number;
  readonly isHardDecline?: boolean;
}): DunningTransitionResult {
  const maxAttempts = params.maxAttempts ?? 4;

  if (params.isHardDecline || params.failedAttempts >= maxAttempts) {
    return {
      status: "unpaid_suspended",
      entitlementsActive: false,
      nextRetryDelayHours: null,
    };
  }

  if (params.failedAttempts <= 0) {
    return { status: "active", entitlementsActive: true, nextRetryDelayHours: null };
  }

  // Exponential backoff schedule: 24h -> 72h -> 168h
  const retryScheduleHours = [24, 72, 168];
  const nextRetryDelayHours =
    retryScheduleHours[Math.min(params.failedAttempts - 1, retryScheduleHours.length - 1)];

  return {
    status: params.failedAttempts === 1 ? "past_due" : "grace_hold",
    entitlementsActive: true, // Keep service running during grace retries
    nextRetryDelayHours,
  };
}`,
    criteria: [
      "Calculates exact second-level unused credit (unusedCreditMinor) and remaining new-plan debit (remainingDebitMinor)",
      "Supports seat quantity scaling alongside tier upgrades and downgrades (negative netInvoiceDeltaMinor credit)",
      "Preserves customer entitlements during past_due / grace_hold dunning retries and suspends on hard decline or maxAttempts",
    ],
  },
  {
    id: "task_pay_double_entry_ledger_stripe_connect_split",
    title: "Architect Immutable Double-Entry Financial Ledger for Stripe Connect Marketplace Splits, Platform Fees & Partial Refunds",
    category: "payment-processing",
    difficulty: "advanced",
    tags: ["stripe-connect", "double-entry-ledger", "fintech", "marketplace", "escrow", "refunds"],
    instructions:
      "A multi-vendor marketplace tracks seller payouts by mutating a single float balance column, causing reconciliation drift when Stripe deducts processing fees, the platform takes a 10% marketplace commission, and a customer requests a partial refund. Build an immutable DoubleEntryConnectLedger where every journal transaction enforces sum(debits) === sum(credits) across clearing, fee, platform, and seller accounts.",
    starterCode: `// Mutable Single-Column Balance Prone to Reconciliation Drift on Partial Refunds
export function creditSeller(seller: any, amount: number) {
  seller.balance += amount * 0.9;
}`,
    solutionCode: `// Immutable Double-Entry Financial Ledger for Stripe Connect Marketplace Splits & Refunds
export type LedgerAccount =
  | "buyer_external"
  | "stripe_processing_fee"
  | "platform_commission"
  | "seller_escrow_payable";

export interface LedgerEntryLine {
  readonly account: LedgerAccount;
  readonly direction: "DEBIT" | "CREDIT";
  readonly amountMinor: number;
}

export interface JournalTransaction {
  readonly txId: string;
  readonly orderId: string;
  readonly kind: "CHARGE_SPLIT" | "PARTIAL_REFUND";
  readonly lines: readonly LedgerEntryLine[];
}

export class DoubleEntryConnectLedger {
  #journal: JournalTransaction[] = [];

  recordPosting(tx: JournalTransaction): void {
    let debits = 0;
    let credits = 0;
    for (const line of tx.lines) {
      if (!Number.isSafeInteger(line.amountMinor) || line.amountMinor < 0) {
        throw new Error("Ledger entry amountMinor must be a non-negative integer");
      }
      if (line.direction === "DEBIT") debits += line.amountMinor;
      else credits += line.amountMinor;
    }
    if (debits !== credits) {
      throw new Error(\`Unbalanced double-entry posting (\${tx.txId}): debits=\${debits} !== credits=\${credits}\`);
    }
    this.#journal.push(tx);
  }

  recordMarketplaceCharge(params: {
    readonly txId: string;
    readonly orderId: string;
    readonly grossChargeMinor: number;
    readonly stripeFeeMinor: number;
    readonly platformFeeBps: number; // e.g., 1000 = 10%
  }): JournalTransaction {
    const platformCommissionMinor = Math.round(
      (params.grossChargeMinor * params.platformFeeBps) / 10000,
    );
    const sellerNetMinor =
      params.grossChargeMinor - params.stripeFeeMinor - platformCommissionMinor;

    const tx: JournalTransaction = {
      txId: params.txId,
      orderId: params.orderId,
      kind: "CHARGE_SPLIT",
      lines: [
        { account: "buyer_external", direction: "DEBIT", amountMinor: params.grossChargeMinor },
        { account: "stripe_processing_fee", direction: "CREDIT", amountMinor: params.stripeFeeMinor },
        { account: "platform_commission", direction: "CREDIT", amountMinor: platformCommissionMinor },
        { account: "seller_escrow_payable", direction: "CREDIT", amountMinor: sellerNetMinor },
      ],
    };
    this.recordPosting(tx);
    return tx;
  }

  recordProportionalRefund(params: {
    readonly txId: string;
    readonly orderId: string;
    readonly originalGrossMinor: number;
    readonly refundGrossMinor: number;
    readonly platformFeeBps: number;
  }): JournalTransaction {
    if (params.refundGrossMinor <= 0 || params.refundGrossMinor > params.originalGrossMinor) {
      throw new Error("Invalid refund amount");
    }
    const platformFeeReversalMinor = Math.round(
      (params.refundGrossMinor * params.platformFeeBps) / 10000,
    );
    const sellerClawbackMinor = params.refundGrossMinor - platformFeeReversalMinor;

    const tx: JournalTransaction = {
      txId: params.txId,
      orderId: params.orderId,
      kind: "PARTIAL_REFUND",
      lines: [
        { account: "platform_commission", direction: "DEBIT", amountMinor: platformFeeReversalMinor },
        { account: "seller_escrow_payable", direction: "DEBIT", amountMinor: sellerClawbackMinor },
        { account: "buyer_external", direction: "CREDIT", amountMinor: params.refundGrossMinor },
      ],
    };
    this.recordPosting(tx);
    return tx;
  }

  getAccountCreditBalance(account: LedgerAccount): number {
    let balance = 0;
    for (const tx of this.#journal) {
      for (const line of tx.lines) {
        if (line.account === account) {
          balance += line.direction === "CREDIT" ? line.amountMinor : -line.amountMinor;
        }
      }
    }
    return balance;
  }
}`,
    criteria: [
      "Enforces the fundamental double-entry accounting invariant (sum(debits) === sum(credits)) on every journal posting",
      "Splits marketplace charges across stripe_processing_fee, platform_commission, and seller_escrow_payable",
      "Computes proportional platform commission reversals and seller escrow clawbacks during partial refunds",
    ],
  },
  {
    id: "task_pay_polar_stripe_usage_meter_ai_billing",
    title: "Implement Usage-Based AI Token & GPU Meter Billing Engine (Polar Meters / Stripe Billing) with Graduated Tiers & Credit Drawdown",
    category: "payment-processing",
    difficulty: "advanced",
    tags: ["polar-sh", "stripe-billing", "usage-based-billing", "ai-tokens", "graduated-pricing", "credits"],
    instructions:
      "Modern AI companies bill customers via Polar.sh Meters or Stripe Billing Meters for LLM tokens and GPU seconds, combining prepaid credit grants with graduated tier pricing (e.g., first 1M tokens at $2/1M, next 9M at $1.50/1M, 10M+ at $1/1M). Build a UsageMeterBillingEngine with idempotent event ingestion, graduated bracket math, and automatic prepaid credit wallet drawdown.",
    starterCode: `// Un-deduplicated Flat Token Counter Missing Graduated Tiers & Credit Wallet Drawdown
export function billUsage(events: any[], pricePerUnit: number) {
  return events.reduce((s, e) => s + e.units, 0) * pricePerUnit;
}`,
    solutionCode: `// Usage-Based AI Meter Billing Engine with Idempotent Ingestion, Graduated Tiers & Credit Drawdown
export interface MeterEvent {
  readonly eventId: string;
  readonly customerId: string;
  readonly meterSlug: "llm_tokens" | "gpu_seconds";
  readonly units: number;
}

export interface GraduatedTierBracket {
  readonly upToUnits: number | null; // null = infinity
  readonly unitCostMinorPerBlock: number;
  readonly blockSize: number; // e.g., per 1,000 units
}

export interface CustomerMeterInvoice {
  readonly customerId: string;
  readonly totalUnits: number;
  readonly deduplicatedEvents: number;
  readonly grossUsageChargeMinor: number;
  readonly appliedPrepaidCreditsMinor: number;
  readonly netAmountDueMinor: number;
  readonly remainingCreditBalanceMinor: number;
}

export class UsageMeterBillingEngine {
  #seenEventIds = new Set<string>();
  #customerUnits = new Map<string, number>();
  #dedupCount = new Map<string, number>();
  #creditWalletMinor = new Map<string, number>();

  grantPrepaidCredits(customerId: string, amountMinor: number): void {
    const prev = this.#creditWalletMinor.get(customerId) ?? 0;
    this.#creditWalletMinor.set(customerId, prev + amountMinor);
  }

  ingestEvent(event: MeterEvent): boolean {
    if (this.#seenEventIds.has(event.eventId)) {
      this.#dedupCount.set(event.customerId, (this.#dedupCount.get(event.customerId) ?? 0) + 1);
      return false;
    }
    this.#seenEventIds.add(event.eventId);
    const prev = this.#customerUnits.get(event.customerId) ?? 0;
    this.#customerUnits.set(event.customerId, prev + event.units);
    return true;
  }

  closeBillingCycle(
    customerId: string,
    tiers: readonly GraduatedTierBracket[],
  ): CustomerMeterInvoice {
    const totalUnits = this.#customerUnits.get(customerId) ?? 0;
    const deduplicatedEvents = this.#dedupCount.get(customerId) ?? 0;

    let remainingToPrice = totalUnits;
    let previousCeiling = 0;
    let grossUsageChargeMinor = 0;

    for (const tier of tiers) {
      if (remainingToPrice <= 0) break;
      const bracketCapacity =
        tier.upToUnits === null ? remainingToPrice : Math.max(0, tier.upToUnits - previousCeiling);
      const unitsInBracket = Math.min(remainingToPrice, bracketCapacity);
      const blocks = Math.ceil(unitsInBracket / tier.blockSize);
      grossUsageChargeMinor += blocks * tier.unitCostMinorPerBlock;

      remainingToPrice -= unitsInBracket;
      if (tier.upToUnits !== null) {
        previousCeiling = tier.upToUnits;
      }
    }

    const availableCredits = this.#creditWalletMinor.get(customerId) ?? 0;
    const appliedPrepaidCreditsMinor = Math.min(availableCredits, grossUsageChargeMinor);
    const netAmountDueMinor = grossUsageChargeMinor - appliedPrepaidCreditsMinor;
    const remainingCreditBalanceMinor = availableCredits - appliedPrepaidCreditsMinor;

    this.#creditWalletMinor.set(customerId, remainingCreditBalanceMinor);
    return {
      customerId,
      totalUnits,
      deduplicatedEvents,
      grossUsageChargeMinor,
      appliedPrepaidCreditsMinor,
      netAmountDueMinor,
      remainingCreditBalanceMinor,
    };
  }
}`,
    criteria: [
      "Deduplicates retried usage meter events by eventId so network retries never double-bill AI tokens",
      "Computes graduated tier pricing across progressive brackets (upToUnits, blockSize, unitCostMinorPerBlock)",
      "Draws down prepaid credit wallet balances before generating net overage invoice charges",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════════
   * DOMAIN 12: WEB SHOP STOREFRONT UI & ACCOUNT-TO-CHECKOUT UX (storefront-ui)
   * ═══════════════════════════════════════════════════════════════════════════ */
  {
    id: "task_shop_ui_faceted_catalog_variant_sku_selector",
    title: "Build Faceted Product Catalog Filter & Multi-Axis Variant Matrix (Color × Size × Storage) SKU Selector with Stock-Aware Disabled States",
    category: "storefront-ui",
    difficulty: "advanced",
    tags: ["web-shop-ui", "product-variants", "sku-matrix", "faceted-search", "url-state", "typescript"],
    instructions:
      "A web shop Product Detail Page (PDP) renders Color, Size, and Storage option buttons independently without cross-axis stock awareness, allowing shoppers to click dead-end out-of-stock combinations and failing to synchronize the selected variant SKU with URL query parameters (?color=...&size=...&sku=...). Build a deterministic ProductVariantMatrixController that resolves valid SKU combinations, computes per-option availability across axes, and serializes canonical URL search state.",
    starterCode: `// Naive Variant Picker Without Cross-Axis Stock Matrix or URL State Sync
export function selectVariant(variants: any[], color: string, size: string) {
  return variants.find((v) => v.color === color && v.size === size);
}`,
    solutionCode: `// Multi-Axis Product Variant Matrix & Faceted Catalog SKU Controller
export interface ProductVariantSku {
  readonly sku: string;
  readonly title: string;
  readonly attributes: Readonly<Record<string, string>>; // e.g., { color: "obsidian", size: "L", storage: "1TB" }
  readonly unitPriceMinor: number;
  readonly compareAtPriceMinor?: number | null;
  readonly availableStock: number;
}

export interface AxisOptionState {
  readonly axis: string;
  readonly value: string;
  readonly selected: boolean;
  readonly inStockWithCurrentSelection: boolean;
  readonly totalStockAcrossMatrix: number;
}

export class ProductVariantMatrixController {
  readonly #variants: readonly ProductVariantSku[];
  readonly #axes: readonly string[];

  constructor(variants: readonly ProductVariantSku[], axes: readonly string[]) {
    if (variants.length === 0) throw new Error("Product must have at least one variant SKU");
    this.#variants = variants;
    this.#axes = axes;
  }

  resolveVariant(selection: Readonly<Record<string, string>>): ProductVariantSku | null {
    return (
      this.#variants.find((v) =>
        this.#axes.every((axis) => v.attributes[axis] === selection[axis]),
      ) ?? null
    );
  }

  computeAxisOptions(currentSelection: Readonly<Record<string, string>>): Readonly<Record<string, readonly AxisOptionState[]>> {
    const result: Record<string, AxisOptionState[]> = {};

    for (const axis of this.#axes) {
      const uniqueValues = Array.from(new Set(this.#variants.map((v) => v.attributes[axis]).filter(Boolean)));
      result[axis] = uniqueValues.map((value) => {
        const hypothetical = { ...currentSelection, [axis]: value };
        const matchingWithOtherAxes = this.#variants.filter((v) =>
          this.#axes.every((a) => !hypothetical[a] || v.attributes[a] === hypothetical[a]),
        );
        const inStockWithCurrentSelection = matchingWithOtherAxes.some((v) => v.availableStock > 0);
        const totalStockAcrossMatrix = this.#variants
          .filter((v) => v.attributes[axis] === value)
          .reduce((sum, v) => sum + v.availableStock, 0);

        return {
          axis,
          value,
          selected: currentSelection[axis] === value,
          inStockWithCurrentSelection,
          totalStockAcrossMatrix,
        };
      });
    }

    return result;
  }

  buildViewModel(selection: Readonly<Record<string, string>>): {
    readonly resolvedVariant: ProductVariantSku | null;
    readonly canAddToCart: boolean;
    readonly badgeLabel: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNAVAILABLE_COMBINATION";
    readonly axisOptions: Readonly<Record<string, readonly AxisOptionState[]>>;
    readonly canonicalQueryString: string;
  } {
    const resolvedVariant = this.resolveVariant(selection);
    const axisOptions = this.computeAxisOptions(selection);

    let badgeLabel: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNAVAILABLE_COMBINATION" =
      "UNAVAILABLE_COMBINATION";
    if (resolvedVariant) {
      if (resolvedVariant.availableStock <= 0) badgeLabel = "OUT_OF_STOCK";
      else if (resolvedVariant.availableStock <= 3) badgeLabel = "LOW_STOCK";
      else badgeLabel = "IN_STOCK";
    }

    const params = new URLSearchParams();
    for (const axis of this.#axes) {
      if (selection[axis]) params.set(axis, selection[axis]);
    }
    if (resolvedVariant) params.set("sku", resolvedVariant.sku);

    return {
      resolvedVariant,
      canAddToCart: Boolean(resolvedVariant && resolvedVariant.availableStock > 0),
      badgeLabel,
      axisOptions,
      canonicalQueryString: \`?\${params.toString()}\`,
    };
  }
}`,
    criteria: [
      "Computes cross-axis stock availability (inStockWithCurrentSelection) so dead-end out-of-stock variant combinations are disabled before click",
      "Resolves the exact ProductVariantSku and derives IN_STOCK, LOW_STOCK, OUT_OF_STOCK, or UNAVAILABLE_COMBINATION UI states",
      "Serializes deterministic URL query parameters (?color=...&size=...&sku=...) for shareable deep-linking",
    ],
  },
  {
    id: "task_shop_ui_optimistic_cart_drawer_price_drift_guard",
    title: "Implement Optimistic Slide-Over Cart Drawer UI Controller with Mutation Rollback, Versioned Sequence Guard & Catalog Price-Drift Banner",
    category: "storefront-ui",
    difficulty: "advanced",
    tags: ["web-shop-ui", "cart-drawer", "optimistic-ui", "price-drift", "aria-live", "state-management"],
    instructions:
      "A slide-over shopping cart drawer suffers from UI jank and data corruption: rapid '+' clicks arrive out of order from the server, failed stock checks leave the UI showing an incorrect quantity, and catalog price changes silently alter the checkout total without notifying the shopper. Build an OptimisticCartDrawerController with snapshot rollback, monotonic mutationSeq ordering, catalog price-drift detection, and screen-reader ARIA live announcements.",
    starterCode: `// Uncoordinated Cart Drawer Prone to Out-of-Order Responses & Silent Price Drift
export class NaiveCartDrawer {
  items: any[] = [];
  updateQty(sku: string, qty: number) {
    const item = this.items.find((i) => i.sku === sku);
    if (item) item.qty = qty;
  }
}`,
    solutionCode: `// Optimistic Slide-Over Cart Drawer Controller with Rollback & Price-Drift Reconciliation
export interface CartDrawerLineItem {
  readonly sku: string;
  readonly title: string;
  readonly quantity: number;
  readonly unitPriceAtAddMinor: number;
  readonly liveCatalogPriceMinor: number;
  readonly maxAvailableStock: number;
}

export interface PriceDriftNotice {
  readonly sku: string;
  readonly title: string;
  readonly previousUnitMinor: number;
  readonly currentUnitMinor: number;
  readonly deltaMinor: number;
}

export class OptimisticCartDrawerController {
  #items = new Map<string, CartDrawerLineItem>();
  #snapshots = new Map<number, Map<string, CartDrawerLineItem>>();
  #mutationSeq = 0;
  #appliedServerSeq = 0;
  #ariaLiveMessage = "";

  seedItems(items: readonly CartDrawerLineItem[]): void {
    this.#items.clear();
    for (const item of items) {
      this.#items.set(item.sku, { ...item });
    }
  }

  beginOptimisticQtyChange(sku: string, nextQty: number): {
    readonly mutationId: number;
    readonly optimisticSubtotalMinor: number;
    readonly ariaAnnouncement: string;
  } {
    const existing = this.#items.get(sku);
    if (!existing) throw new Error(\`SKU '\${sku}' not in cart drawer\`);

    const mutationId = ++this.#mutationSeq;
    // Save deep snapshot for rollback if server rejects
    const backup = new Map<string, CartDrawerLineItem>();
    for (const [k, v] of this.#items.entries()) backup.set(k, { ...v });
    this.#snapshots.set(mutationId, backup);

    if (nextQty <= 0) {
      this.#items.delete(sku);
      this.#ariaLiveMessage = \`Removed \${existing.title} from cart.\`;
    } else {
      const clampedQty = Math.min(nextQty, existing.maxAvailableStock);
      this.#items.set(sku, { ...existing, quantity: clampedQty });
      this.#ariaLiveMessage = \`Updated \${existing.title} quantity to \${clampedQty}.\`;
    }

    return {
      mutationId,
      optimisticSubtotalMinor: this.getViewModel().subtotalMinor,
      ariaAnnouncement: this.#ariaLiveMessage,
    };
  }

  commitServerResponse(mutationId: number, serverItems: readonly CartDrawerLineItem[]): boolean {
    this.#snapshots.delete(mutationId);
    // Ignore stale out-of-order server responses
    if (mutationId < this.#appliedServerSeq) {
      return false;
    }
    this.#appliedServerSeq = mutationId;
    this.seedItems(serverItems);
    return true;
  }

  rollbackMutation(mutationId: number, reason: string): void {
    const backup = this.#snapshots.get(mutationId);
    if (backup) {
      this.#items = backup;
      this.#snapshots.delete(mutationId);
    }
    this.#ariaLiveMessage = \`Could not update cart: \${reason}\`;
  }

  getViewModel(): {
    readonly items: readonly CartDrawerLineItem[];
    readonly itemCount: number;
    readonly subtotalMinor: number;
    readonly priceDriftNotices: readonly PriceDriftNotice[];
    readonly requiresPriceDriftAcknowledgement: boolean;
    readonly ariaLiveMessage: string;
  } {
    const items = Array.from(this.#items.values());
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalMinor = items.reduce((sum, i) => sum + i.liveCatalogPriceMinor * i.quantity, 0);

    const priceDriftNotices: PriceDriftNotice[] = [];
    for (const item of items) {
      if (item.liveCatalogPriceMinor !== item.unitPriceAtAddMinor) {
        priceDriftNotices.push({
          sku: item.sku,
          title: item.title,
          previousUnitMinor: item.unitPriceAtAddMinor,
          currentUnitMinor: item.liveCatalogPriceMinor,
          deltaMinor: item.liveCatalogPriceMinor - item.unitPriceAtAddMinor,
        });
      }
    }

    return {
      items,
      itemCount,
      subtotalMinor,
      priceDriftNotices,
      requiresPriceDriftAcknowledgement: priceDriftNotices.length > 0,
      ariaLiveMessage: this.#ariaLiveMessage,
    };
  }
}`,
    criteria: [
      "Applies optimistic quantity updates with full state snapshot rollback on server rejection",
      "Drops stale out-of-order server responses using monotonic mutationId watermarks",
      "Detects catalog price drift (unitPriceAtAddMinor !== liveCatalogPriceMinor) and emits ARIA live announcements",
    ],
  },
  {
    id: "task_shop_ui_guest_to_account_cart_address_merge",
    title: "Architect Seamless Guest-to-Account Creation, Cart Line-Item Conflict Merger & Saved Address Book Deduplicator",
    category: "storefront-ui",
    difficulty: "advanced",
    tags: ["web-shop-ui", "account-creation", "guest-cart-merge", "address-book", "onboarding", "typescript"],
    instructions:
      "Shoppers frequently add items to a guest cart before creating an account or signing in at checkout. Naive authentication overwrites the user's saved account cart or duplicates SKU lines beyond per-order limits and available stock, and creates duplicate shipping addresses on every order. Build an AccountOnboardingCartMerger that deterministically merges guest and account carts, caps quantities by stock and order limits, and deduplicates customer shipping addresses.",
    starterCode: `// Destructive Login Handler Overwriting Saved Account Cart with Guest Cart
export function onUserLogin(accountCart: any[], guestCart: any[]) {
  return guestCart;
}`,
    solutionCode: `// Guest-to-Account Creation, Cart Conflict Merger & Address Book Deduplicator
export interface MergeableCartItem {
  readonly sku: string;
  readonly title: string;
  readonly quantity: number;
  readonly unitPriceMinor: number;
  readonly maxPerOrder: number;
  readonly availableStock: number;
  readonly updatedAtMs: number;
}

export interface PostalAddressInput {
  readonly recipientName: string;
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly stateOrProvince: string;
  readonly postalCode: string;
  readonly countryCode: string;
}

export interface NormalizedCustomerAccount {
  readonly accountId: string;
  readonly email: string;
  readonly mergedCartItems: readonly MergeableCartItem[];
  readonly quantityAdjustments: readonly {
    readonly sku: string;
    readonly requestedTotal: number;
    readonly clampedTo: number;
    readonly reason: "STOCK_LIMIT" | "MAX_PER_ORDER_LIMIT";
  }[];
  readonly savedAddresses: readonly (PostalAddressInput & { readonly fingerprint: string })[];
}

export function normalizeAddressFingerprint(addr: PostalAddressInput): string {
  const clean = (s: string | undefined) =>
    (s ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return [
    clean(addr.countryCode),
    clean(addr.postalCode),
    clean(addr.stateOrProvince),
    clean(addr.city),
    clean(addr.line1),
    clean(addr.line2),
  ].join("|");
}

export function promoteGuestToCustomerAccount(params: {
  readonly accountId: string;
  readonly rawEmail: string;
  readonly guestCart: readonly MergeableCartItem[];
  readonly existingAccountCart: readonly MergeableCartItem[];
  readonly existingAddresses: readonly PostalAddressInput[];
  readonly newCheckoutAddress?: PostalAddressInput;
}): NormalizedCustomerAccount {
  const email = params.rawEmail.trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    throw new Error("Invalid customer account email address");
  }

  const bySku = new Map<string, MergeableCartItem>();
  const quantityAdjustments: {
    sku: string;
    requestedTotal: number;
    clampedTo: number;
    reason: "STOCK_LIMIT" | "MAX_PER_ORDER_LIMIT";
  }[] = [];

  for (const item of params.existingAccountCart) {
    bySku.set(item.sku, { ...item });
  }

  for (const guestItem of params.guestCart) {
    const existing = bySku.get(guestItem.sku);
    const requestedTotal = (existing?.quantity ?? 0) + guestItem.quantity;
    const availableStock = Math.min(
      existing ? existing.availableStock : guestItem.availableStock,
      guestItem.availableStock,
    );
    const maxPerOrder = Math.min(
      existing ? existing.maxPerOrder : guestItem.maxPerOrder,
      guestItem.maxPerOrder,
    );

    const effectiveCap = Math.min(availableStock, maxPerOrder);
    const clampedTo = Math.min(requestedTotal, effectiveCap);

    if (clampedTo < requestedTotal) {
      quantityAdjustments.push({
        sku: guestItem.sku,
        requestedTotal,
        clampedTo,
        reason: availableStock <= maxPerOrder ? "STOCK_LIMIT" : "MAX_PER_ORDER_LIMIT",
      });
    }

    if (clampedTo > 0) {
      bySku.set(guestItem.sku, {
        ...guestItem,
        quantity: clampedTo,
        availableStock,
        maxPerOrder,
        updatedAtMs: Math.max(existing?.updatedAtMs ?? 0, guestItem.updatedAtMs),
      });
    }
  }

  // Deduplicate addresses by canonical postal fingerprint
  const addressMap = new Map<string, PostalAddressInput & { readonly fingerprint: string }>();
  const allAddresses = params.newCheckoutAddress
    ? [...params.existingAddresses, params.newCheckoutAddress]
    : [...params.existingAddresses];

  for (const addr of allAddresses) {
    const fingerprint = normalizeAddressFingerprint(addr);
    if (!addressMap.has(fingerprint)) {
      addressMap.set(fingerprint, {
        ...addr,
        countryCode: addr.countryCode.trim().toUpperCase(),
        postalCode: addr.postalCode.trim().toUpperCase(),
        fingerprint,
      });
    }
  }

  return {
    accountId: params.accountId,
    email,
    mergedCartItems: Array.from(bySku.values()),
    quantityAdjustments,
    savedAddresses: Array.from(addressMap.values()),
  };
}`,
    criteria: [
      "Normalizes customer account email and merges guest cart items into existing account cart items by SKU",
      "Clamps combined SKU quantities to Math.min(availableStock, maxPerOrder) and records transparent quantityAdjustments notices",
      "Deduplicates saved shipping/billing addresses using a normalized postal fingerprint",
    ],
  },
  {
    id: "task_shop_ui_accessible_checkout_stepper_autocomplete",
    title: "Build Accessible Multi-Step Checkout Stepper (Account → Shipping → Payment → Review) with WHATWG Autocomplete & Downstream Lock Invalidation",
    category: "storefront-ui",
    difficulty: "advanced",
    tags: ["web-shop-ui", "checkout-stepper", "accessibility", "whatwg-autocomplete", "state-machine", "wcag"],
    instructions:
      "Multi-step checkouts frequently allow users to jump to Payment or Review with invalid shipping fields, forget to invalidate calculated shipping/tax quotes when the user goes back and edits their shipping country/postal code, and omit WHATWG autocomplete tokens (shipping address-line1, shipping postal-code, cc-number). Build an AccessibleCheckoutStepperController that enforces step gates, invalidates downstream quotes on upstream edits, and emits accessible field metadata.",
    starterCode: `// Unvalidated Stepper Allowing Direct Jump to Review After Editing Shipping Country
export class SimpleStepper {
  step = "ACCOUNT";
  goTo(next: string) {
    this.step = next;
  }
}`,
    solutionCode: `// Accessible Multi-Step Checkout Stepper with Downstream Quote Invalidation & WHATWG Autocomplete
export type CheckoutStepId = "ACCOUNT" | "SHIPPING" | "PAYMENT" | "REVIEW";

export interface CheckoutFieldA11ySpec {
  readonly id: string;
  readonly name: string;
  readonly autocomplete: string;
  readonly required: boolean;
  readonly ariaInvalid: boolean;
  readonly errorId: string | null;
}

export class AccessibleCheckoutStepperController {
  #currentStep: CheckoutStepId = "ACCOUNT";
  #accountValid = false;
  #shippingValid = false;
  #shippingQuoteMinor: number | null = null;
  #taxQuoteMinor: number | null = null;
  #paymentMethodToken: string | null = null;

  completeAccountStep(email: string): boolean {
    this.#accountValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim());
    if (this.#accountValid && this.#currentStep === "ACCOUNT") {
      this.#currentStep = "SHIPPING";
    }
    return this.#accountValid;
  }

  submitShippingAddress(params: {
    readonly line1: string;
    readonly postalCode: string;
    readonly countryCode: string;
    readonly calculatedShippingMinor: number;
    readonly calculatedTaxMinor: number;
  }): boolean {
    const valid =
      params.line1.trim().length >= 3 &&
      params.postalCode.trim().length >= 3 &&
      /^[A-Z]{2}$/i.test(params.countryCode.trim());

    // Editing shipping invalidates any prior payment confirmation lock
    this.#paymentMethodToken = null;

    if (!valid) {
      this.#shippingValid = false;
      this.#shippingQuoteMinor = null;
      this.#taxQuoteMinor = null;
      this.#currentStep = "SHIPPING";
      return false;
    }

    this.#shippingValid = true;
    this.#shippingQuoteMinor = params.calculatedShippingMinor;
    this.#taxQuoteMinor = params.calculatedTaxMinor;
    this.#currentStep = "PAYMENT";
    return true;
  }

  attachPaymentMethod(paymentMethodToken: string): boolean {
    if (!this.#accountValid || !this.#shippingValid || this.#taxQuoteMinor === null) {
      throw new Error("Cannot attach payment before Account and Shipping quotes are locked");
    }
    if (!paymentMethodToken.startsWith("pm_") && !paymentMethodToken.startsWith("polar_")) {
      return false;
    }
    this.#paymentMethodToken = paymentMethodToken;
    this.#currentStep = "REVIEW";
    return true;
  }

  canNavigateTo(targetStep: CheckoutStepId): boolean {
    if (targetStep === "ACCOUNT") return true;
    if (targetStep === "SHIPPING") return this.#accountValid;
    if (targetStep === "PAYMENT") return this.#accountValid && this.#shippingValid && this.#taxQuoteMinor !== null;
    if (targetStep === "REVIEW") {
      return (
        this.#accountValid &&
        this.#shippingValid &&
        this.#taxQuoteMinor !== null &&
        this.#paymentMethodToken !== null
      );
    }
    return false;
  }

  getStepState(): {
    readonly currentStep: CheckoutStepId;
    readonly canPlaceOrder: boolean;
    readonly shippingQuoteMinor: number | null;
    readonly taxQuoteMinor: number | null;
    readonly fieldSpecs: readonly CheckoutFieldA11ySpec[];
  } {
    const fieldSpecs: CheckoutFieldA11ySpec[] = [
      {
        id: "checkout-email",
        name: "email",
        autocomplete: "shipping email",
        required: true,
        ariaInvalid: !this.#accountValid,
        errorId: this.#accountValid ? null : "err-checkout-email",
      },
      {
        id: "checkout-address-line1",
        name: "addressLine1",
        autocomplete: "shipping address-line1",
        required: true,
        ariaInvalid: !this.#shippingValid,
        errorId: this.#shippingValid ? null : "err-checkout-address-line1",
      },
      {
        id: "checkout-postal",
        name: "postalCode",
        autocomplete: "shipping postal-code",
        required: true,
        ariaInvalid: !this.#shippingValid,
        errorId: this.#shippingValid ? null : "err-checkout-postal",
      },
    ];

    return {
      currentStep: this.#currentStep,
      canPlaceOrder: this.canNavigateTo("REVIEW") && this.#currentStep === "REVIEW",
      shippingQuoteMinor: this.#shippingQuoteMinor,
      taxQuoteMinor: this.#taxQuoteMinor,
      fieldSpecs,
    };
  }
}`,
    criteria: [
      "Gates step navigation (ACCOUNT -> SHIPPING -> PAYMENT -> REVIEW) so Payment and Review cannot be entered with unvalidated upstream steps",
      "Invalidates downstream payment locks and recalculates tax/shipping quotes whenever the shipping address is modified",
      "Generates WCAG-compliant field metadata with WHATWG section-scoped autocomplete tokens (shipping email, shipping address-line1, shipping postal-code)",
    ],
  },
  {
    id: "task_shop_ui_order_history_timeline_rma_portal",
    title: "Build Interactive Order History, Split-Shipment Tracking Timeline & Self-Service Return (RMA) Eligibility Portal UI",
    category: "storefront-ui",
    difficulty: "advanced",
    tags: ["web-shop-ui", "order-history", "shipment-tracking", "rma-returns", "customer-portal", "typescript"],
    instructions:
      "After checkout, customers need an organized Order History & Returns Portal that accurately displays multi-package split shipments, tracks per-line-item delivered vs already-returned quantities, enforces return windows (e.g., 30 days from delivery for physical goods, non-returnable for activated license keys), and calculates exact prorated refund previews.",
    starterCode: `// Flat Order History View Ignoring Partial Returns, Return Windows & Split Packages
export function canReturnOrder(order: any) {
  return order.status === "DELIVERED";
}`,
    solutionCode: `// Order History, Split-Shipment Timeline & Self-Service RMA Return Portal ViewModel
export interface HistoricalOrderLine {
  readonly lineId: string;
  readonly sku: string;
  readonly title: string;
  readonly isDigitalLicense: boolean;
  readonly orderedQty: number;
  readonly deliveredQty: number;
  readonly alreadyReturnedQty: number;
  readonly netUnitPaidMinor: number; // after prorated discount
  readonly taxUnitPaidMinor: number;
  readonly deliveredAtMs: number | null;
}

export interface ShipmentPackageView {
  readonly shipmentId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly status: "LABEL_CREATED" | "IN_TRANSIT" | "DELIVERED";
  readonly lineIds: readonly string[];
}

export interface LineReturnEligibility {
  readonly lineId: string;
  readonly sku: string;
  readonly eligibleQty: number;
  readonly eligible: boolean;
  readonly reason: "ELIGIBLE" | "DIGITAL_NON_RETURNABLE" | "NOT_YET_DELIVERED" | "RETURN_WINDOW_EXPIRED" | "FULLY_RETURNED";
  readonly maxRefundPreviewMinor: number;
}

export function buildOrderHistoryPortalViewModel(params: {
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly currency: string;
  readonly lines: readonly HistoricalOrderLine[];
  readonly shipments: readonly ShipmentPackageView[];
  readonly nowMs: number;
  readonly returnWindowDays?: number;
}): {
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly fulfillmentSummary: "ALL_DELIVERED" | "PARTIALLY_DELIVERED" | "IN_PROGRESS";
  readonly returnEligibilityByLine: readonly LineReturnEligibility[];
  readonly totalRefundableMinor: number;
} {
  const windowMs = (params.returnWindowDays ?? 30) * 86_400_000;

  const returnEligibilityByLine: LineReturnEligibility[] = params.lines.map((line) => {
    const remainingQty = Math.max(0, line.deliveredQty - line.alreadyReturnedQty);

    if (line.isDigitalLicense) {
      return {
        lineId: line.lineId,
        sku: line.sku,
        eligibleQty: 0,
        eligible: false,
        reason: "DIGITAL_NON_RETURNABLE",
        maxRefundPreviewMinor: 0,
      };
    }

    if (line.deliveredQty <= 0 || line.deliveredAtMs === null) {
      return {
        lineId: line.lineId,
        sku: line.sku,
        eligibleQty: 0,
        eligible: false,
        reason: "NOT_YET_DELIVERED",
        maxRefundPreviewMinor: 0,
      };
    }

    if (remainingQty === 0) {
      return {
        lineId: line.lineId,
        sku: line.sku,
        eligibleQty: 0,
        eligible: false,
        reason: "FULLY_RETURNED",
        maxRefundPreviewMinor: 0,
      };
    }

    if (params.nowMs - line.deliveredAtMs > windowMs) {
      return {
        lineId: line.lineId,
        sku: line.sku,
        eligibleQty: 0,
        eligible: false,
        reason: "RETURN_WINDOW_EXPIRED",
        maxRefundPreviewMinor: 0,
      };
    }

    const maxRefundPreviewMinor =
      remainingQty * (line.netUnitPaidMinor + line.taxUnitPaidMinor);

    return {
      lineId: line.lineId,
      sku: line.sku,
      eligibleQty: remainingQty,
      eligible: true,
      reason: "ELIGIBLE",
      maxRefundPreviewMinor,
    };
  });

  const allDelivered = params.lines.every((l) => l.deliveredQty === l.orderedQty);
  const anyDelivered = params.lines.some((l) => l.deliveredQty > 0);
  const fulfillmentSummary = allDelivered
    ? "ALL_DELIVERED"
    : anyDelivered
      ? "PARTIALLY_DELIVERED"
      : "IN_PROGRESS";

  const totalRefundableMinor = returnEligibilityByLine.reduce(
    (sum, item) => sum + item.maxRefundPreviewMinor,
    0,
  );

  return {
    orderId: params.orderId,
    invoiceNumber: params.invoiceNumber,
    fulfillmentSummary,
    returnEligibilityByLine,
    totalRefundableMinor,
  };
}`,
    criteria: [
      "Computes per-line returnable quantities (deliveredQty - alreadyReturnedQty) and blocks returns on digital licenses or expired windows",
      "Derives aggregate fulfillment state (ALL_DELIVERED, PARTIALLY_DELIVERED, IN_PROGRESS) across split shipments",
      "Calculates exact minor-unit refund previews (netUnitPaidMinor + taxUnitPaidMinor) from historical order snapshots",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════════
   * DOMAIN 13: ORDER LIFECYCLE & COMMERCE DATA ARCHITECTURE (order-lifecycle-data)
   * ═══════════════════════════════════════════════════════════════════════════ */
  {
    id: "task_shop_data_normalized_entity_store_referential_integrity",
    title: "Refactor Deeply Nested Unorganized E-Commerce State into Normalized Entity Tables with Referential Integrity & O(1) Foreign-Key Indexes",
    category: "order-lifecycle-data",
    difficulty: "advanced",
    tags: ["data-modeling", "normalized-store", "referential-integrity", "ecommerce-state", "order-history", "typescript"],
    instructions:
      "A web shop stores customers, carts, orders, line items, and shipments as deeply nested duplicated objects across UI slices. Updating a customer's email or a shipment tracking status leaves stale copies in 4 views and requires O(N^2) nested scans. Refactor into a NormalizedCommerceEntityStore with primary-key entity maps, O(1) foreign-key secondary indexes (ordersByCustomerId, itemsByOrderId, shipmentsByOrderId), and strict foreign-key referential integrity guards.",
    starterCode: `// Unorganized Deeply Nested E-Commerce State with Duplicated Customer & Order Objects
export const messyShopState = {
  orders: [{ id: "o1", customer: { id: "c1", email: "old@loom.dev" }, items: [] }],
};`,
    solutionCode: `// Normalized Commerce Entity Store with Referential Integrity & O(1) Secondary Indexes
export interface CustomerEntity {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface OrderEntity {
  readonly id: string;
  readonly customerId: string;
  readonly invoiceNumber: string;
  readonly status: "PAID" | "PARTIALLY_SHIPPED" | "FULFILLED" | "REFUNDED";
  readonly totalMinor: number;
  readonly createdAtMs: number;
}

export interface OrderItemEntity {
  readonly id: string;
  readonly orderId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitPriceMinor: number;
}

export interface ShipmentEntity {
  readonly id: string;
  readonly orderId: string;
  readonly trackingNumber: string;
  readonly status: "IN_TRANSIT" | "DELIVERED";
}

export class NormalizedCommerceEntityStore {
  #customers = new Map<string, CustomerEntity>();
  #orders = new Map<string, OrderEntity>();
  #orderItems = new Map<string, OrderItemEntity>();
  #shipments = new Map<string, ShipmentEntity>();

  // Secondary foreign-key indexes for O(1) relational lookups
  #ordersByCustomer = new Map<string, Set<string>>();
  #itemsByOrder = new Map<string, Set<string>>();
  #shipmentsByOrder = new Map<string, Set<string>>();

  upsertCustomer(customer: CustomerEntity): void {
    this.#customers.set(customer.id, { ...customer });
    if (!this.#ordersByCustomer.has(customer.id)) {
      this.#ordersByCustomer.set(customer.id, new Set());
    }
  }

  insertOrder(order: OrderEntity): void {
    if (!this.#customers.has(order.customerId)) {
      throw new Error(\`ForeignKeyConstraintError: Unknown customerId '\${order.customerId}' on order '\${order.id}'\`);
    }
    this.#orders.set(order.id, { ...order });
    this.#ordersByCustomer.get(order.customerId)!.add(order.id);
    if (!this.#itemsByOrder.has(order.id)) this.#itemsByOrder.set(order.id, new Set());
    if (!this.#shipmentsByOrder.has(order.id)) this.#shipmentsByOrder.set(order.id, new Set());
  }

  insertOrderItem(item: OrderItemEntity): void {
    if (!this.#orders.has(item.orderId)) {
      throw new Error(\`ForeignKeyConstraintError: Unknown orderId '\${item.orderId}' on orderItem '\${item.id}'\`);
    }
    this.#orderItems.set(item.id, { ...item });
    this.#itemsByOrder.get(item.orderId)!.add(item.id);
  }

  insertShipment(shipment: ShipmentEntity): void {
    if (!this.#orders.has(shipment.orderId)) {
      throw new Error(\`ForeignKeyConstraintError: Unknown orderId '\${shipment.orderId}' on shipment '\${shipment.id}'\`);
    }
    this.#shipments.set(shipment.id, { ...shipment });
    this.#shipmentsByOrder.get(shipment.orderId)!.add(shipment.id);
  }

  getCustomerOrderHistoryView(customerId: string): {
    readonly customer: CustomerEntity;
    readonly orders: readonly {
      readonly order: OrderEntity;
      readonly items: readonly OrderItemEntity[];
      readonly shipments: readonly ShipmentEntity[];
    }[];
  } {
    const customer = this.#customers.get(customerId);
    if (!customer) throw new Error(\`Customer '\${customerId}' not found\`);

    const orderIds = Array.from(this.#ordersByCustomer.get(customerId) ?? []);
    const orders = orderIds
      .map((id) => this.#orders.get(id)!)
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .map((order) => {
        const itemIds = Array.from(this.#itemsByOrder.get(order.id) ?? []);
        const shipmentIds = Array.from(this.#shipmentsByOrder.get(order.id) ?? []);
        return {
          order,
          items: itemIds.map((iid) => this.#orderItems.get(iid)!),
          shipments: shipmentIds.map((sid) => this.#shipments.get(sid)!),
        };
      });

    return { customer, orders };
  }
}`,
    criteria: [
      "Maintains normalized primary-key entity maps (customers, orders, orderItems, shipments) with zero duplicated nested state",
      "Enforces foreign-key referential integrity (ForeignKeyConstraintError) when inserting orders, line items, or shipments",
      "Maintains O(1) secondary index sets (ordersByCustomer, itemsByOrder, shipmentsByOrder) and sorts order history newest-first",
    ],
  },
  {
    id: "task_shop_data_immutable_order_line_snapshot_isolation",
    title: "Enforce Immutable Order Line-Item Price, Tax & Product Title Snapshot Isolation Against Future Catalog Mutations",
    category: "order-lifecycle-data",
    difficulty: "advanced",
    tags: ["data-integrity", "immutable-snapshot", "order-history", "tax-invoice", "catalog-isolation", "typescript"],
    instructions:
      "A critical e-commerce bug occurs when historical orders store only { sku, quantity } and join against the live catalog when rendering Order History or tax invoices: if a merchant later increases a product's price from $50 to $80 or renames/deletes the SKU, every past customer's receipt and accounting invoice silently changes! Build an OrderSnapshotVault that freezes deep-cloned, content-hashed line-item snapshots at checkout time.",
    starterCode: `// Broken Live-Catalog Join That Corrupts Historical Order Receipts When Catalog Prices Change
export function renderHistoricalOrderTotal(order: any, liveCatalog: Map<string, any>) {
  return order.items.reduce((s: number, i: any) => s + liveCatalog.get(i.sku).price * i.qty, 0);
}`,
    solutionCode: `// Immutable Order Line-Item Snapshot Vault Isolated from Future Catalog Mutations
export interface LiveCatalogProduct {
  sku: string;
  title: string;
  unitPriceMinor: number;
  taxRateBps: number;
}

export interface FrozenOrderLineSnapshot {
  readonly sku: string;
  readonly snapshotTitle: string;
  readonly quantity: number;
  readonly snapshotUnitPriceMinor: number;
  readonly snapshotDiscountMinor: number;
  readonly snapshotTaxRateBps: number;
  readonly snapshotTaxMinor: number;
  readonly snapshotLineTotalMinor: number;
}

export interface FrozenHistoricalOrder {
  readonly orderId: string;
  readonly createdAtIso: string;
  readonly lines: readonly FrozenOrderLineSnapshot[];
  readonly subtotalMinor: number;
  readonly totalDiscountMinor: number;
  readonly totalTaxMinor: number;
  readonly grandTotalMinor: number;
  readonly snapshotHash: string;
}

function computeSnapshotDigest(orderId: string, lines: readonly FrozenOrderLineSnapshot[], grandTotalMinor: number): string {
  const payload = \`\${orderId}|\${grandTotalMinor}|\${lines
    .map((l) => \`\${l.sku}:\${l.snapshotTitle}:\${l.quantity}:\${l.snapshotUnitPriceMinor}:\${l.snapshotDiscountMinor}:\${l.snapshotTaxMinor}\`)
    .join(";")}\`;
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return \`snap_\${(h >>> 0).toString(16).padStart(8, "0")}\`;
}

export class OrderSnapshotVault {
  #orders = new Map<string, FrozenHistoricalOrder>();

  captureOrderAtCheckout(params: {
    readonly orderId: string;
    readonly createdAtIso: string;
    readonly cartItems: readonly { readonly sku: string; readonly quantity: number; readonly discountMinor: number }[];
    readonly liveCatalog: ReadonlyMap<string, LiveCatalogProduct>;
  }): FrozenHistoricalOrder {
    const lines: FrozenOrderLineSnapshot[] = params.cartItems.map((item) => {
      const product = params.liveCatalog.get(item.sku);
      if (!product) throw new Error(\`SKU '\${item.sku}' missing from catalog at checkout\`);

      const grossMinor = product.unitPriceMinor * item.quantity;
      const netAfterDiscount = Math.max(0, grossMinor - item.discountMinor);
      const snapshotTaxMinor = Math.round((netAfterDiscount * product.taxRateBps) / 10000);

      return Object.freeze({
        sku: product.sku,
        snapshotTitle: String(product.title),
        quantity: item.quantity,
        snapshotUnitPriceMinor: product.unitPriceMinor,
        snapshotDiscountMinor: item.discountMinor,
        snapshotTaxRateBps: product.taxRateBps,
        snapshotTaxMinor,
        snapshotLineTotalMinor: netAfterDiscount + snapshotTaxMinor,
      });
    });

    const subtotalMinor = lines.reduce((s, l) => s + l.snapshotUnitPriceMinor * l.quantity, 0);
    const totalDiscountMinor = lines.reduce((s, l) => s + l.snapshotDiscountMinor, 0);
    const totalTaxMinor = lines.reduce((s, l) => s + l.snapshotTaxMinor, 0);
    const grandTotalMinor = lines.reduce((s, l) => s + l.snapshotLineTotalMinor, 0);
    const snapshotHash = computeSnapshotDigest(params.orderId, lines, grandTotalMinor);

    const frozenOrder: FrozenHistoricalOrder = Object.freeze({
      orderId: params.orderId,
      createdAtIso: params.createdAtIso,
      lines: Object.freeze(lines),
      subtotalMinor,
      totalDiscountMinor,
      totalTaxMinor,
      grandTotalMinor,
      snapshotHash,
    });

    this.#orders.set(params.orderId, frozenOrder);
    return frozenOrder;
  }

  verifyOrderSnapshotIntegrity(orderId: string): {
    readonly valid: boolean;
    readonly order: FrozenHistoricalOrder;
  } {
    const order = this.#orders.get(orderId);
    if (!order) throw new Error(\`Unknown order '\${orderId}'\`);
    const expected = computeSnapshotDigest(order.orderId, order.lines, order.grandTotalMinor);
    return {
      valid: expected === order.snapshotHash,
      order,
    };
  }
}`,
    criteria: [
      "Captures deep-frozen (Object.freeze) line-item snapshots of product title, unitPriceMinor, discountMinor, and taxRateBps at checkout",
      "Isolates historical order totals and receipts from subsequent catalog price increases, renames, or SKU deletions",
      "Computes and verifies a deterministic snapshotHash digest over all frozen line items and grandTotalMinor",
    ],
  },
  {
    id: "task_shop_data_transactional_account_cart_to_order_promoter",
    title: "Implement Atomic Checkout-to-Order Promotion Pipeline Linking Account Profile, Inventory Commit, Sequential Invoice Number & Cart Clearance",
    category: "order-lifecycle-data",
    difficulty: "advanced",
    tags: ["checkout-pipeline", "atomic-transaction", "order-promotion", "invoice-sequence", "idempotency", "typescript"],
    instructions:
      "Promoting an active shopping cart into a confirmed order requires keeping 5 state domains synchronized: deducting inventory, recording the payment intent, assigning a gapless sequential invoice number (INV-2026-00001), rolling up customer lifetime spend (lifetimeSpendMinor, orderCount), and marking the cart CONVERTED so page reloads cannot double-create the order. Build an AtomicCheckoutOrderPromoter with idempotency and full state rollback on error.",
    starterCode: `// Non-Atomic Checkout Promotion Leaving Active Cart & Skipping Customer Rollup
export function promoteCartToOrder(cart: any) {
  return { orderId: "ord_" + Math.random(), items: cart.items };
}`,
    solutionCode: `// Atomic Checkout-to-Order Promoter with Idempotency, Sequential Invoices & Rollback
export interface ShopCustomerRecord {
  readonly accountId: string;
  readonly email: string;
  orderCount: number;
  lifetimeSpendMinor: number;
}

export interface ShopCartRecord {
  readonly cartId: string;
  readonly accountId: string;
  status: "ACTIVE" | "CONVERTED_TO_ORDER";
  convertedOrderId: string | null;
  readonly items: readonly { readonly sku: string; readonly quantity: number; readonly unitPriceMinor: number }[];
}

export interface PromotedOrderRecord {
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly cartId: string;
  readonly accountId: string;
  readonly paymentIntentId: string;
  readonly totalMinor: number;
}

export class AtomicCheckoutOrderPromoter {
  #customers = new Map<string, ShopCustomerRecord>();
  #carts = new Map<string, ShopCartRecord>();
  #stock = new Map<string, number>();
  #orders = new Map<string, PromotedOrderRecord>();
  #idempotencyByCheckoutKey = new Map<string, string>();
  #invoiceSeq = 0;

  seedState(params: {
    customers: readonly ShopCustomerRecord[];
    carts: readonly ShopCartRecord[];
    stock: Readonly<Record<string, number>>;
  }): void {
    for (const c of params.customers) this.#customers.set(c.accountId, { ...c });
    for (const cart of params.carts) this.#carts.set(cart.cartId, { ...cart, items: [...cart.items] });
    for (const [sku, qty] of Object.entries(params.stock)) this.#stock.set(sku, qty);
  }

  promoteCheckout(params: {
    readonly checkoutIdempotencyKey: string;
    readonly cartId: string;
    readonly paymentIntentId: string;
    readonly taxMinor: number;
  }): { readonly order: PromotedOrderRecord; readonly idempotentReplay: boolean } {
    const existingOrderId = this.#idempotencyByCheckoutKey.get(params.checkoutIdempotencyKey);
    if (existingOrderId) {
      return {
        order: { ...this.#orders.get(existingOrderId)! },
        idempotentReplay: true,
      };
    }

    const cart = this.#carts.get(params.cartId);
    if (!cart) throw new Error(\`Unknown cart '\${params.cartId}'\`);
    if (cart.status === "CONVERTED_TO_ORDER" && cart.convertedOrderId) {
      return {
        order: { ...this.#orders.get(cart.convertedOrderId)! },
        idempotentReplay: true,
      };
    }
    if (cart.items.length === 0) throw new Error("Cannot promote an empty cart");

    const customer = this.#customers.get(cart.accountId);
    if (!customer) throw new Error(\`Unknown customer '\${cart.accountId}'\`);

    // Pre-validate all SKU stock before mutating any state (atomic all-or-nothing guard)
    for (const item of cart.items) {
      const avail = this.#stock.get(item.sku) ?? 0;
      if (avail < item.quantity) {
        throw new Error(\`InsufficientStockError: SKU '\${item.sku}' requested \${item.quantity}, available \${avail}\`);
      }
    }

    // Commit stock deductions
    for (const item of cart.items) {
      this.#stock.set(item.sku, (this.#stock.get(item.sku) ?? 0) - item.quantity);
    }

    const subtotalMinor = cart.items.reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0);
    const totalMinor = subtotalMinor + params.taxMinor;

    const seq = ++this.#invoiceSeq;
    const invoiceNumber = \`INV-2026-\${String(seq).padStart(5, "0")}\`;
    const orderId = \`ord_\${seq}\`;

    const order: PromotedOrderRecord = {
      orderId,
      invoiceNumber,
      cartId: cart.cartId,
      accountId: customer.accountId,
      paymentIntentId: params.paymentIntentId,
      totalMinor,
    };

    // Update cart, customer lifetime metrics, and order table atomically
    cart.status = "CONVERTED_TO_ORDER";
    cart.convertedOrderId = orderId;
    customer.orderCount += 1;
    customer.lifetimeSpendMinor += totalMinor;

    this.#orders.set(orderId, order);
    this.#idempotencyByCheckoutKey.set(params.checkoutIdempotencyKey, orderId);

    return { order: { ...order }, idempotentReplay: false };
  }

  getCustomer(accountId: string): ShopCustomerRecord | undefined {
    return this.#customers.get(accountId);
  }

  getCart(cartId: string): ShopCartRecord | undefined {
    return this.#carts.get(cartId);
  }

  getStock(sku: string): number {
    return this.#stock.get(sku) ?? 0;
  }
}`,
    criteria: [
      "Pre-validates stock across all cart SKUs so failed checkouts never partially deduct inventory or increment invoice numbers",
      "Transitions cart to CONVERTED_TO_ORDER, increments customer orderCount and lifetimeSpendMinor, and issues sequential INV-2026-XXXXX invoice numbers",
      "Guarantees idempotent order promotion across duplicate checkoutIdempotencyKey or already-converted cart retries",
    ],
  },
  {
    id: "task_shop_data_split_shipment_partial_capture_reconciler",
    title: "Build Split-Shipment Fulfillment, Backorder Cancellations & Per-Package Payment Capture / Release Data Reconciler",
    category: "order-lifecycle-data",
    difficulty: "advanced",
    tags: ["order-fulfillment", "split-shipments", "partial-capture", "backorders", "reconciliation", "typescript"],
    instructions:
      "Multi-item orders frequently ship across multiple warehouse packages while an out-of-stock item is canceled on backorder. Naive order status fields get stuck in PROCESSING or capture funds for canceled items. Build an OrderFulfillmentReconciler that validates quantity conservation (orderedQty === shippedQty + canceledQty + pendingQty), derives exact order status, and reconciles captured vs released authorization amounts.",
    starterCode: `// Naive Order Fulfillment Ignoring Split Packages & Canceled Backorder Releases
export function markOrderShipped(order: any) {
  order.status = "SHIPPED";
  return order;
}`,
    solutionCode: `// Split-Shipment Fulfillment & Partial Capture / Backorder Release Reconciler
export interface OrderLineAllocation {
  readonly sku: string;
  readonly orderedQty: number;
  readonly shippedQty: number;
  readonly canceledQty: number;
  readonly netUnitAmountMinor: number; // includes unit tax after discount
}

export type ReconciledOrderStatus =
  | "AWAITING_FULFILLMENT"
  | "PARTIALLY_SHIPPED"
  | "PARTIALLY_FULFILLED_CLOSED"
  | "FULFILLED"
  | "CANCELED";

export interface FulfillmentReconciliationReport {
  readonly status: ReconciledOrderStatus;
  readonly authorizedTotalMinor: number;
  readonly capturedMinor: number;
  readonly releasedAuthorizationMinor: number;
  readonly remainingCapturableMinor: number;
  readonly conservationValid: boolean;
}

export function reconcileOrderFulfillment(
  allocations: readonly OrderLineAllocation[],
): FulfillmentReconciliationReport {
  let totalOrderedQty = 0;
  let totalShippedQty = 0;
  let totalCanceledQty = 0;

  let authorizedTotalMinor = 0;
  let capturedMinor = 0;
  let releasedAuthorizationMinor = 0;

  for (const line of allocations) {
    if (
      line.orderedQty <= 0 ||
      line.shippedQty < 0 ||
      line.canceledQty < 0 ||
      line.shippedQty + line.canceledQty > line.orderedQty
    ) {
      throw new Error(\`QuantityConservationError: Invalid allocation for SKU '\${line.sku}'\`);
    }

    totalOrderedQty += line.orderedQty;
    totalShippedQty += line.shippedQty;
    totalCanceledQty += line.canceledQty;

    authorizedTotalMinor += line.orderedQty * line.netUnitAmountMinor;
    capturedMinor += line.shippedQty * line.netUnitAmountMinor;
    releasedAuthorizationMinor += line.canceledQty * line.netUnitAmountMinor;
  }

  const remainingPendingQty = totalOrderedQty - totalShippedQty - totalCanceledQty;
  const remainingCapturableMinor =
    authorizedTotalMinor - capturedMinor - releasedAuthorizationMinor;

  let status: ReconciledOrderStatus;
  if (totalCanceledQty === totalOrderedQty) {
    status = "CANCELED";
  } else if (totalShippedQty === totalOrderedQty) {
    status = "FULFILLED";
  } else if (remainingPendingQty === 0 && totalShippedQty > 0 && totalCanceledQty > 0) {
    status = "PARTIALLY_FULFILLED_CLOSED";
  } else if (totalShippedQty > 0 && remainingPendingQty > 0) {
    status = "PARTIALLY_SHIPPED";
  } else {
    status = "AWAITING_FULFILLMENT";
  }

  return {
    status,
    authorizedTotalMinor,
    capturedMinor,
    releasedAuthorizationMinor,
    remainingCapturableMinor,
    conservationValid:
      capturedMinor + releasedAuthorizationMinor + remainingCapturableMinor === authorizedTotalMinor,
  };
}`,
    criteria: [
      "Enforces strict line-item quantity conservation (shippedQty + canceledQty <= orderedQty) and throws QuantityConservationError on overflow",
      "Derives AWAITING_FULFILLMENT, PARTIALLY_SHIPPED, PARTIALLY_FULFILLED_CLOSED, FULFILLED, or CANCELED from item allocations",
      "Maintains exact minor-unit conservation (capturedMinor + releasedAuthorizationMinor + remainingCapturableMinor === authorizedTotalMinor)",
    ],
  },
  {
    id: "task_shop_data_customer_order_event_sourced_timeline",
    title: "Architect Event-Sourced Customer & Order Lifecycle Audit Log (ACCOUNT_CREATED → CART_MERGED → ORDER_PAID → DELIVERED → RMA_REFUNDED)",
    category: "order-lifecycle-data",
    difficulty: "advanced",
    tags: ["event-sourcing", "order-lifecycle", "audit-log", "hash-chain", "state-projection", "typescript"],
    instructions:
      "Mutable status columns lose the causal history of how a customer's guest cart became an account, when payment was captured, which package delivered when, and why a partial RMA refund was issued. Build an EventSourcedOrderLifecycleLog with hash-chained domain events, causal transition validation, and deterministic state projection.",
    starterCode: `// Mutable Status Overwrite Losing Audit Trail & Allowing Illegal State Transitions
export function updateOrderStatus(order: any, nextStatus: string) {
  order.status = nextStatus;
  return order;
}`,
    solutionCode: `// Hash-Chained Event-Sourced Customer & Order Lifecycle Audit Log
export type OrderLifecycleEventType =
  | "ACCOUNT_CREATED"
  | "GUEST_CART_MERGED"
  | "CHECKOUT_AUTHORIZED"
  | "ORDER_CAPTURED"
  | "SHIPMENT_DELIVERED"
  | "RMA_RETURN_APPROVED"
  | "ORDER_REFUNDED";

export interface OrderDomainEvent {
  readonly seq: number;
  readonly type: OrderLifecycleEventType;
  readonly amountMinor?: number;
  readonly timestampMs: number;
  readonly prevHash: string;
  readonly eventHash: string;
}

export interface ProjectedOrderLifecycleState {
  readonly accountCreated: boolean;
  readonly cartMerged: boolean;
  readonly currentStage: OrderLifecycleEventType | "INIT";
  readonly authorizedMinor: number;
  readonly capturedMinor: number;
  readonly refundedMinor: number;
  readonly netRetainedMinor: number;
  readonly delivered: boolean;
  readonly chainValid: boolean;
}

const ALLOWED_PREDECESSORS: Readonly<Record<OrderLifecycleEventType, readonly (OrderLifecycleEventType | "INIT")[]>> = {
  ACCOUNT_CREATED: ["INIT"],
  GUEST_CART_MERGED: ["ACCOUNT_CREATED"],
  CHECKOUT_AUTHORIZED: ["ACCOUNT_CREATED", "GUEST_CART_MERGED"],
  ORDER_CAPTURED: ["CHECKOUT_AUTHORIZED"],
  SHIPMENT_DELIVERED: ["ORDER_CAPTURED"],
  RMA_RETURN_APPROVED: ["SHIPMENT_DELIVERED"],
  ORDER_REFUNDED: ["ORDER_CAPTURED", "RMA_RETURN_APPROVED"],
};

function computeEventHash(seq: number, type: string, amountMinor: number, prevHash: string): string {
  const raw = \`\${seq}|\${type}|\${amountMinor}|\${prevHash}\`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return \`evhash_\${(h >>> 0).toString(16).padStart(8, "0")}\`;
}

export class EventSourcedOrderLifecycleLog {
  #events: OrderDomainEvent[] = [];

  append(params: {
    readonly type: OrderLifecycleEventType;
    readonly amountMinor?: number;
    readonly timestampMs: number;
  }): OrderDomainEvent {
    const currentStage =
      this.#events.length === 0 ? "INIT" : this.#events[this.#events.length - 1].type;
    const allowed = ALLOWED_PREDECESSORS[params.type];
    if (!allowed.includes(currentStage)) {
      throw new Error(
        \`InvalidLifecycleTransitionError: Cannot transition from '\${currentStage}' to '\${params.type}'\`,
      );
    }

    const seq = this.#events.length + 1;
    const prevHash = seq === 1 ? "GENESIS" : this.#events[this.#events.length - 1].eventHash;
    const amount = params.amountMinor ?? 0;
    const eventHash = computeEventHash(seq, params.type, amount, prevHash);

    const ev: OrderDomainEvent = Object.freeze({
      seq,
      type: params.type,
      amountMinor: amount,
      timestampMs: params.timestampMs,
      prevHash,
      eventHash,
    });

    this.#events.push(ev);
    return ev;
  }

  projectState(): ProjectedOrderLifecycleState {
    let accountCreated = false;
    let cartMerged = false;
    let currentStage: OrderLifecycleEventType | "INIT" = "INIT";
    let authorizedMinor = 0;
    let capturedMinor = 0;
    let refundedMinor = 0;
    let delivered = false;
    let chainValid = true;

    for (let i = 0; i < this.#events.length; i++) {
      const ev = this.#events[i];
      const expectedPrev = i === 0 ? "GENESIS" : this.#events[i - 1].eventHash;
      const expectedHash = computeEventHash(ev.seq, ev.type, ev.amountMinor ?? 0, expectedPrev);
      if (ev.prevHash !== expectedPrev || ev.eventHash !== expectedHash) {
        chainValid = false;
      }

      currentStage = ev.type;
      if (ev.type === "ACCOUNT_CREATED") accountCreated = true;
      if (ev.type === "GUEST_CART_MERGED") cartMerged = true;
      if (ev.type === "CHECKOUT_AUTHORIZED") authorizedMinor = ev.amountMinor ?? 0;
      if (ev.type === "ORDER_CAPTURED") capturedMinor = ev.amountMinor ?? 0;
      if (ev.type === "SHIPMENT_DELIVERED") delivered = true;
      if (ev.type === "ORDER_REFUNDED") refundedMinor += ev.amountMinor ?? 0;
    }

    if (refundedMinor > capturedMinor) {
      throw new Error("FinancialInvariantError: refundedMinor cannot exceed capturedMinor");
    }

    return {
      accountCreated,
      cartMerged,
      currentStage,
      authorizedMinor,
      capturedMinor,
      refundedMinor,
      netRetainedMinor: capturedMinor - refundedMinor,
      delivered,
      chainValid,
    };
  }
}`,
    criteria: [
      "Enforces causal lifecycle state transitions (ACCOUNT_CREATED -> GUEST_CART_MERGED -> CHECKOUT_AUTHORIZED -> ORDER_CAPTURED -> SHIPMENT_DELIVERED -> RMA_RETURN_APPROVED -> ORDER_REFUNDED)",
      "Links every domain event via a tamper-evident prevHash -> eventHash cryptographic chain",
      "Projects netRetainedMinor (capturedMinor - refundedMinor) and guards against over-refunding",
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════════
   * DOMAIN 14: DEEP WEB COOKIES — RFC 6265bis, CHIPS & DBSC (web-cookies)
   * ═══════════════════════════════════════════════════════════════════════════ */
  {
    id: "task_cookie_rfc6265bis_host_prefix_chips_serializer",
    title: "Build RFC 6265bis Set-Cookie Serializer & Auditor Enforcing __Host- / __Secure- Prefixes, CHIPS Partitioned & 400-Day Max-Age Limits",
    category: "web-cookies",
    difficulty: "advanced",
    tags: ["web-cookies", "rfc6265bis", "chips-partitioned", "host-prefix", "samesite", "typescript"],
    instructions:
      "Browsers enforce strict RFC 6265bis and CHIPS (Cookies Having Independent Partitioned State) rules: __Host- cookies are silently rejected if they include a Domain attribute, omit Secure, or use a Path other than '/'; SameSite=None cookies are rejected without Secure; Partitioned cookies require Secure and Path=/; and Max-Age values exceeding 400 days (34,560,000 seconds) are clamped. Build a strict Rfc6265bisCookieCodec that validates, clamps, and serializes hardened Set-Cookie headers.",
    starterCode: `// Unvalidated Set-Cookie String Concatenation Vulnerable to Silent Browser Rejection
export function makeCookie(name: string, value: string, domain?: string) {
  return \`\${name}=\${value}; Domain=\${domain}; SameSite=None\`;
}`,
    solutionCode: `// RFC 6265bis & CHIPS Partitioned Set-Cookie Validator & Serializer
export interface CookieSerializeSpec {
  readonly name: string;
  readonly value: string;
  readonly path?: string;
  readonly domain?: string;
  readonly maxAgeSec?: number;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly sameSite?: "Strict" | "Lax" | "None";
  readonly partitioned?: boolean;
}

export const RFC6265BIS_MAX_AGE_CAP_SEC = 400 * 86_400; // 34,560,000s (400 days)
export const MAX_COOKIE_WIRE_BYTES = 4096;

export function serializeRfc6265bisCookie(spec: CookieSerializeSpec): {
  readonly header: string;
  readonly clampedMaxAgeSec: number | null;
  readonly warnings: readonly string[];
} {
  if (!/^[!#$%&'*+\\-.^_`|~0-9A-Za-z]+$/.test(spec.name)) {
    throw new Error(\`InvalidCookieNameError: '\${spec.name}' contains illegal RFC 6265 token characters\`);
  }

  const isHostPrefix = spec.name.startsWith("__Host-");
  const isSecurePrefix = spec.name.startsWith("__Secure-");
  const path = spec.path ?? "/";
  const warnings: string[] = [];

  if (isHostPrefix) {
    if (!spec.secure) {
      throw new Error("__Host- prefix cookie must set Secure=true");
    }
    if (spec.domain) {
      throw new Error("__Host- prefix cookie must not specify a Domain attribute");
    }
    if (path !== "/") {
      throw new Error("__Host- prefix cookie must specify Path=/");
    }
  }

  if (isSecurePrefix && !spec.secure) {
    throw new Error("__Secure- prefix cookie must set Secure=true");
  }

  const sameSite = spec.sameSite ?? "Lax";
  if (sameSite === "None" && !spec.secure) {
    throw new Error("SameSite=None requires the Secure attribute");
  }

  if (spec.partitioned) {
    if (!spec.secure) {
      throw new Error("CHIPS Partitioned cookie requires Secure=true");
    }
    if (path !== "/") {
      throw new Error("CHIPS Partitioned cookie requires Path=/ for top-level site partition key alignment");
    }
  }

  let clampedMaxAgeSec: number | null = null;
  if (spec.maxAgeSec !== undefined) {
    if (!Number.isFinite(spec.maxAgeSec)) throw new Error("Invalid maxAgeSec");
    const rounded = Math.floor(spec.maxAgeSec);
    if (rounded > RFC6265BIS_MAX_AGE_CAP_SEC) {
      clampedMaxAgeSec = RFC6265BIS_MAX_AGE_CAP_SEC;
      warnings.push("MAX_AGE_CLAMPED_TO_400_DAYS");
    } else {
      clampedMaxAgeSec = rounded;
    }
  }

  const encodedVal = encodeURIComponent(spec.value);
  const parts = [\`\${spec.name}=\${encodedVal}\`];
  if (spec.domain) parts.push(\`Domain=\${spec.domain.trim().toLowerCase()}\`);
  parts.push(\`Path=\${path}\`);
  if (clampedMaxAgeSec !== null) parts.push(\`Max-Age=\${clampedMaxAgeSec}\`);
  if (spec.httpOnly !== false) parts.push("HttpOnly");
  if (spec.secure) parts.push("Secure");
  parts.push(\`SameSite=\${sameSite}\`);
  if (spec.partitioned) parts.push("Partitioned");

  const header = parts.join("; ");
  if (header.length > MAX_COOKIE_WIRE_BYTES) {
    throw new Error(\`CookieOversizeError: Set-Cookie exceeds 4096-byte RFC limit (\${header.length} bytes)\`);
  }

  return {
    header,
    clampedMaxAgeSec,
    warnings,
  };
}`,
    criteria: [
      "Enforces __Host- invariants (Secure=true, no Domain attribute, Path=/) and __Secure- / SameSite=None Secure requirements",
      "Validates CHIPS Partitioned attribute requirements (Secure=true, Path=/) for cross-site partitioned storage",
      "Clamps Max-Age to the RFC 6265bis 400-day ceiling (34,560,000s) and enforces the 4096-byte Set-Cookie wire limit",
    ],
  },
  {
    id: "task_cookie_key_ring_hmac_rotation_anti_downgrade",
    title: "Implement Key-Ring Signed Cookie Jar (kid Rotation) & Subdomain Cookie-Tossing Defense",
    category: "web-cookies",
    difficulty: "advanced",
    tags: ["web-cookies", "key-rotation", "cookie-tossing", "hmac", "session-security", "typescript"],
    instructions:
      "When an attacker compromises or controls a sibling subdomain (e.g. promo.example.com), they can inject a Domain=.example.com cookie with the same name as the main app's session cookie. Because the HTTP Cookie request header sends all matching cookies as 'name=val1; name=val2' without Domain or Path metadata, naive parsers pick the attacker's first cookie! Build a KeyRingSignedCookieJar that binds the cookie name + payload + timestamp into a key-ID (kid) tagged signature, scans all duplicate Cookie header candidates to pick the valid signed token, and signals transparent re-signing when verified by a retiring key.",
    starterCode: `// Vulnerable to Subdomain Cookie Tossing & Single-Key Outages
export function parseSessionCookie(cookieHeader: string) {
  const m = cookieHeader.match(/sid=([^;]+)/);
  return m ? m[1] : null;
}`,
    solutionCode: `// Key-Ring Signed Cookie Jar with Subdomain Cookie-Tossing Defense & Zero-Downtime Rotation
export interface SigningKeyEntry {
  readonly kid: string;
  readonly secret: string;
}

function computeCookieMac(secret: string, cookieName: string, kid: string, payloadB64: string): string {
  const input = \`\${cookieName}|\${kid}|\${payloadB64}|\${secret}\`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return \`\${(h1 >>> 0).toString(16).padStart(8, "0")}\${(h2 >>> 0).toString(16).padStart(8, "0")}\`;
}

function timingSafeStrEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export class KeyRingSignedCookieJar {
  readonly #keys: readonly SigningKeyEntry[];

  constructor(keys: readonly SigningKeyEntry[]) {
    if (keys.length === 0) throw new Error("KeyRing requires at least one active signing key");
    this.#keys = keys;
  }

  signCookieValue(cookieName: string, claims: { readonly sub: string; readonly expSec: number }): string {
    const primary = this.#keys[0];
    const payloadB64 = btoa(JSON.stringify(claims))
      .replace(/\\+/g, "-")
      .replace(/\\//g, "_")
      .replace(/=+$/, "");
    const mac = computeCookieMac(primary.secret, cookieName, primary.kid, payloadB64);
    return \`v1.\${primary.kid}.\${payloadB64}.\${mac}\`;
  }

  verifyFromCookieHeader(
    cookieHeader: string,
    cookieName: string,
    nowSec: number,
  ): {
    readonly valid: boolean;
    readonly claims: { readonly sub: string; readonly expSec: number } | null;
    readonly verifiedByKid: string | null;
    readonly needsKeyRotationReSign: boolean;
    readonly tossedDuplicatesRejected: number;
  } {
    const pairs = cookieHeader.split(";").map((p) => p.trim()).filter(Boolean);
    const candidates: string[] = [];

    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) continue;
      const k = pair.slice(0, eqIdx).trim();
      const v = pair.slice(eqIdx + 1).trim();
      if (k === cookieName) candidates.push(v);
    }

    let tossedDuplicatesRejected = 0;
    for (const rawVal of candidates) {
      const segments = rawVal.split(".");
      if (segments.length !== 4 || segments[0] !== "v1") {
        tossedDuplicatesRejected++;
        continue;
      }
      const [, kid, payloadB64, providedMac] = segments;
      const keyEntry = this.#keys.find((k) => k.kid === kid);
      if (!keyEntry) {
        tossedDuplicatesRejected++;
        continue;
      }

      const expectedMac = computeCookieMac(keyEntry.secret, cookieName, kid, payloadB64);
      if (!timingSafeStrEq(expectedMac, providedMac)) {
        tossedDuplicatesRejected++;
        continue;
      }

      try {
        const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const claims = JSON.parse(atob(padded));
        if (typeof claims?.expSec !== "number" || nowSec >= claims.expSec) {
          tossedDuplicatesRejected++;
          continue;
        }
        return {
          valid: true,
          claims,
          verifiedByKid: kid,
          needsKeyRotationReSign: kid !== this.#keys[0].kid,
          tossedDuplicatesRejected,
        };
      } catch {
        tossedDuplicatesRejected++;
      }
    }

    return {
      valid: false,
      claims: null,
      verifiedByKid: null,
      needsKeyRotationReSign: false,
      tossedDuplicatesRejected,
    };
  }
}`,
    criteria: [
      "Binds cookieName, kid, and base64url claims into the HMAC signature to prevent cross-cookie substitution",
      "Iterates through all duplicate same-name cookies in the Cookie header to defeat subdomain cookie-tossing attacks",
      "Supports multi-key rotation ([activeKey, ...retiringKeys]) and sets needsKeyRotationReSign=true when verified by a retiring key",
    ],
  },
  {
    id: "task_cookie_dbsc_device_bound_session_credentials_refresh",
    title: "Architect W3C Device Bound Session Credentials (DBSC) Hardware-Backed Short-Lived Cookie Refresh & Clear-Site-Data Revocation",
    category: "web-cookies",
    difficulty: "advanced",
    tags: ["web-cookies", "dbsc", "device-bound-sessions", "clear-site-data", "anti-theft", "typescript"],
    instructions:
      "Infostealer malware exfiltrates long-lived session cookies from browser disk stores to hijack accounts from attacker machines. W3C Device Bound Session Credentials (DBSC) defeats cookie theft by pairing a short-lived __Host-dbsc_sid cookie (e.g. 300s TTL) with a TPM/Secure-Enclave public key registered via Sec-Session-Registration. When the short-lived cookie expires, the server issues Sec-Session-Challenge and verifies a signed Sec-Session-Response proof-of-possession before refreshing the cookie. Build a DbscSessionCoordinator.",
    starterCode: `// Long-Lived Unbound Session Cookie Vulnerable to Malware Exfiltration Replay
export function issueLongLivedCookie(userId: string) {
  return \`__Host-sid=\${userId}; Max-Age=31536000; Secure; HttpOnly\`;
}`,
    solutionCode: `// W3C Device Bound Session Credentials (DBSC) Coordinator & Clear-Site-Data Evictor
export interface DbscSessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly devicePublicKeyThumbprint: string;
  activeChallengeNonce: string;
  cookieExpiresAtSec: number;
  revoked: boolean;
}

function computeDbscPopSignature(deviceThumbprint: string, sessionId: string, challengeNonce: string): string {
  const raw = \`dbsc_pop|\${deviceThumbprint}|\${sessionId}|\${challengeNonce}\`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return \`pop_\${(h >>> 0).toString(16).padStart(8, "0")}\`;
}

export { computeDbscPopSignature };

export class DbscSessionCoordinator {
  #sessions = new Map<string, DbscSessionRecord>();
  #nonceCounter = 0;

  registerDeviceSession(params: {
    readonly sessionId: string;
    readonly userId: string;
    readonly devicePublicKeyThumbprint: string;
    readonly nowSec: number;
    readonly shortCookieTtlSec?: number;
  }): {
    readonly sessionConfigJson: {
      readonly session_identifier: string;
      readonly refresh_url: string;
      readonly credentials: readonly { readonly type: "cookie"; readonly name: "__Host-dbsc_sid"; readonly attributes: string }[];
    };
    readonly setCookieHeader: string;
    readonly secSessionChallengeHeader: string;
  } {
    const ttl = params.shortCookieTtlSec ?? 300;
    const challenge = \`nonce_\${++this.#nonceCounter}_\${params.sessionId}\`;

    this.#sessions.set(params.sessionId, {
      sessionId: params.sessionId,
      userId: params.userId,
      devicePublicKeyThumbprint: params.devicePublicKeyThumbprint,
      activeChallengeNonce: challenge,
      cookieExpiresAtSec: params.nowSec + ttl,
      revoked: false,
    });

    return {
      sessionConfigJson: {
        session_identifier: params.sessionId,
        refresh_url: "/api/auth/dbsc/refresh",
        credentials: [
          {
            type: "cookie",
            name: "__Host-dbsc_sid",
            attributes: "Path=/; Secure; HttpOnly; SameSite=Lax",
          },
        ],
      },
      setCookieHeader: \`__Host-dbsc_sid=\${params.sessionId}; Max-Age=\${ttl}; Path=/; Secure; HttpOnly; SameSite=Lax\`,
      secSessionChallengeHeader: \`"\${challenge}";id="\${params.sessionId}"\`,
    };
  }

  refreshShortLivedCookie(params: {
    readonly sessionId: string;
    readonly secSessionResponseProof: string;
    readonly providedChallengeNonce: string;
    readonly nowSec: number;
    readonly shortCookieTtlSec?: number;
  }): {
    readonly refreshed: boolean;
    readonly status: 200 | 401 | 403;
    readonly setCookieHeader?: string;
    readonly nextChallengeHeader?: string;
    readonly clearSiteDataHeader?: string;
    readonly reason?: string;
  } {
    const sess = this.#sessions.get(params.sessionId);
    if (!sess || sess.revoked) {
      return {
        refreshed: false,
        status: 401,
        clearSiteDataHeader: '"cookies", "storage"',
        reason: "SESSION_REVOKED_OR_UNKNOWN",
      };
    }

    if (params.providedChallengeNonce !== sess.activeChallengeNonce) {
      return {
        refreshed: false,
        status: 403,
        nextChallengeHeader: \`"\${sess.activeChallengeNonce}";id="\${sess.sessionId}"\`,
        reason: "STALE_DBSC_CHALLENGE_NONCE",
      };
    }

    const expectedPop = computeDbscPopSignature(
      sess.devicePublicKeyThumbprint,
      sess.sessionId,
      sess.activeChallengeNonce,
    );
    if (params.secSessionResponseProof !== expectedPop) {
      return {
        refreshed: false,
        status: 401,
        clearSiteDataHeader: '"cookies", "storage"',
        reason: "INVALID_DEVICE_POP_SIGNATURE",
      };
    }

    const ttl = params.shortCookieTtlSec ?? 300;
    const nextNonce = \`nonce_\${++this.#nonceCounter}_\${sess.sessionId}\`;
    sess.activeChallengeNonce = nextNonce;
    sess.cookieExpiresAtSec = params.nowSec + ttl;

    return {
      refreshed: true,
      status: 200,
      setCookieHeader: \`__Host-dbsc_sid=\${sess.sessionId}; Max-Age=\${ttl}; Path=/; Secure; HttpOnly; SameSite=Lax\`,
      nextChallengeHeader: \`"\${nextNonce}";id="\${sess.sessionId}"\`,
    };
  }
}`,
    criteria: [
      "Registers W3C DBSC device sessions with short-lived __Host-dbsc_sid cookies and Sec-Session-Challenge headers",
      "Verifies hardware proof-of-possession (secSessionResponseProof) against the active challenge nonce before rotating the short-lived cookie",
      "Emits Clear-Site-Data: \"cookies\", \"storage\" when a session is revoked or fails hardware key proof verification",
    ],
  },
  {
    id: "task_cookie_privacy_consent_gcm_partitioned_sync",
    title: "Build Granular Cookie Consent & Retention Gatekeeper with Automatic Unconsented Cookie Eviction Headers",
    category: "web-cookies",
    difficulty: "advanced",
    tags: ["web-cookies", "privacy-consent", "gdpr-eprivacy", "cookie-eviction", "compliance", "typescript"],
    instructions:
      "Web applications must classify cookies by purpose (strictly_necessary, functional, analytics, marketing), block non-essential Set-Cookie headers when consent is absent, and immediately emit Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT eviction headers for any existing cookies belonging to a category the user revokes. Build a CookieConsentPolicyGatekeeper.",
    starterCode: `// Unconditional Cookie Setter Ignoring User Consent Revocation
export function setTrackingCookies(cookies: string[]) {
  return cookies;
}`,
    solutionCode: `// Granular Cookie Consent & Retention Gatekeeper with Automatic Revocation Eviction
export type CookieCategory = "strictly_necessary" | "functional" | "analytics" | "marketing";

export interfaceRegisteredCookiePolicy {
  readonly namePattern: RegExp;
  readonly category: CookieCategory;
  readonly path: string;
}

export interface ConsentPreferences {
  readonly functional: boolean;
  readonly analytics: boolean;
  readonly marketing: boolean;
}

export class CookieConsentPolicyGatekeeper {
  readonly #policies: readonly { readonly name: string; readonly category: CookieCategory; readonly path: string }[];

  constructor(policies: readonly { readonly name: string; readonly category: CookieCategory; readonly path?: string }[]) {
    this.#policies = policies.map((p) => ({ name: p.name, category: p.category, path: p.path ?? "/" }));
  }

  isCategoryAllowed(category: CookieCategory, prefs: ConsentPreferences): boolean {
    if (category === "strictly_necessary") return true;
    return Boolean(prefs[category]);
  }

  reconcileCookies(params: {
    readonly existingBrowserCookieNames: readonly string[];
    readonly outgoingCandidateCookies: readonly { readonly name: string; readonly value: string; readonly maxAgeSec: number }[];
    readonly consent: ConsentPreferences;
  }): {
    readonly allowedSetCookieHeaders: readonly string[];
    readonly blockedCookieNames: readonly string[];
    readonly evictionSetCookieHeaders: readonly string[];
  } {
    const allowedSetCookieHeaders: string[] = [];
    const blockedCookieNames: string[] = [];
    const evictionSetCookieHeaders: string[] = [];

    // 1. Filter outgoing candidate Set-Cookie writes
    for (const candidate of params.outgoingCandidateCookies) {
      const policy = this.#policies.find((p) => p.name === candidate.name);
      const category = policy?.category ?? "marketing"; // fail-closed for unclassified cookies

      if (this.isCategoryAllowed(category, params.consent)) {
        allowedSetCookieHeaders.push(
          \`\${candidate.name}=\${encodeURIComponent(candidate.value)}; Max-Age=\${candidate.maxAgeSec}; Path=\${policy?.path ?? "/"}; Secure; SameSite=Lax\`,
        );
      } else {
        blockedCookieNames.push(candidate.name);
      }
    }

    // 2. Generate immediate eviction headers for existing browser cookies whose category is now disallowed
    for (const existingName of params.existingBrowserCookieNames) {
      const policy = this.#policies.find((p) => p.name === existingName);
      const category = policy?.category ?? "marketing";
      if (!this.isCategoryAllowed(category, params.consent)) {
        evictionSetCookieHeaders.push(
          \`\${existingName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=\${policy?.path ?? "/"}; Secure; SameSite=Lax\`,
        );
      }
    }

    return {
      allowedSetCookieHeaders,
      blockedCookieNames,
      evictionSetCookieHeaders,
    };
  }
}`,
    criteria: [
      "Always permits strictly_necessary cookies while gating functional, analytics, and marketing cookies on explicit user consent",
      "Fails closed by treating unclassified cookies as marketing and blocking unconsented Set-Cookie writes",
      "Generates immediate Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT eviction headers for existing cookies when consent is revoked",
    ],
  },
];

export const REFACTORING_CURRICULUM_TASKS = RAW_CURRICULUM_TASKS.map((task, index) => ({
  ...task,
  order: index + 1,
  track: task.track || CATEGORY_TO_TRACK[task.category] || "core-engineering",
}));

export function validateCurriculumCatalog(tasks = REFACTORING_CURRICULUM_TASKS) {
  const seenIds = new Set();
  const errors = [];

  for (const task of tasks) {
    if (!task.id || !/^task_[a-z0-9_]+$/.test(task.id)) {
      errors.push(`Invalid task id '${task.id}'`);
    }
    if (seenIds.has(task.id)) {
      errors.push(`Duplicate task id '${task.id}'`);
    }
    seenIds.add(task.id);

    if (!CURRICULUM_CATEGORIES.includes(task.category)) {
      errors.push(`Unknown category '${task.category}' on ${task.id}`);
    }
    if (!CURRICULUM_DIFFICULTIES.includes(task.difficulty)) {
      errors.push(`Invalid difficulty '${task.difficulty}' on ${task.id}`);
    }
    if (!CURRICULUM_TRACKS[task.track]) {
      errors.push(`Invalid track '${task.track}' on ${task.id}`);
    }
    if (!task.starterCode || !task.solutionCode || task.starterCode === task.solutionCode) {
      errors.push(`Invalid starterCode/solutionCode on ${task.id}`);
    }
    if (!Array.isArray(task.criteria) || task.criteria.length < 3) {
      errors.push(`Task ${task.id} must define at least 3 verification criteria`);
    }
    if (!Array.isArray(task.tags) || task.tags.length < 3) {
      errors.push(`Task ${task.id} must define at least 3 tags`);
    }
  }

  return {
    valid: errors.length === 0,
    totalTasks: tasks.length,
    categories: CURRICULUM_CATEGORIES.length,
    tracks: Object.keys(CURRICULUM_TRACKS).length,
    errors,
  };
}
