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
