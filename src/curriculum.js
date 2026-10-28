/**
 * Desktop / Weaver Curriculum: 1M Agentic Tasks — Refactoring Suite.
 * Pre-seeded high-signal refactoring challenges designed for desktop/weaver agent training.
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
];
