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
];
