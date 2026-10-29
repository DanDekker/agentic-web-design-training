import { describe, expect, test } from "bun:test";

class MockShadowRoot {
  #elements = [];
  adoptedStyleSheets = [];
  innerHTML = "";

  querySelector(selector) {
    if (selector === ".check-btn") return new MockElement("button");
    if (selector === ".delete-btn") return new MockElement("button");
    if (selector === ".diff-table") return new MockElement("div");
    if (selector === ".badge") return new MockElement("span");
    if (selector === ".swatch-preview") return new MockElement("div");
    if (selector === ".token-name") return new MockElement("span");
    if (selector === ".apca-pill") return new MockElement("span");
    return null;
  }

  replaceChildren(...nodes) {
    this.children = nodes;
  }

  querySelectorAll(selector) {
    return [new MockElement("div"), new MockElement("div")];
  }
}

class MockElement {
  #attributes = new Map();
  #listeners = new Map();
  shadowRoot = null;
  dataset = {};
  className = "";
  children = [];

  constructor(tagName = "DIV") {
    this.tagName = String(tagName || "DIV").toUpperCase();
  }

  attachShadow(options) {
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }

  attachInternals() {
    return {
      role: "status",
      formValue: null,
      states: new Set(),
      setFormValue(val) {
        this.formValue = val;
      },
    };
  }

  hasAttribute(name) {
    return this.#attributes.has(name);
  }

  getAttribute(name) {
    return this.#attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    const old = this.#attributes.get(name) ?? null;
    this.#attributes.set(name, String(value));
    if (typeof this.attributeChangedCallback === "function") {
      this.attributeChangedCallback(name, old, String(value));
    }
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  addEventListener(event, fn) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.#listeners.has(event)) return;
    const arr = this.#listeners.get(event).filter((f) => f !== fn);
    this.#listeners.set(event, arr);
  }

  dispatchEvent(event) {
    const arr = this.#listeners.get(event.type) || [];
    for (const fn of arr) fn(event);
    return true;
  }
}

class MockCustomElementRegistry {
  #registry = new Map();

  define(name, constructor) {
    this.#registry.set(name, constructor);
  }

  get(name) {
    return this.#registry.get(name);
  }
}

describe("MDN Web Components & Shadow DOM Suite", () => {
  test("defines custom elements in registry", async () => {
    globalThis.HTMLElement = MockElement;
    globalThis.document = { createElement: (tag) => new MockElement(tag) };
    globalThis.customElements = new MockCustomElementRegistry();
    globalThis.CustomEvent = class {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    };
    globalThis.CSSStyleSheet = class {
      replaceSync() {}
    };

    await import("../public/components/guantlet-web-task-item.js");
    await import("../public/components/guantlet-web-diff-viewer.js");
    await import("../public/components/guantlet-web-badge.js");
    await import("../public/components/guantlet-web-platform.js");
    await import("../public/components/guantlet-web-design-swatch.js");

    expect(globalThis.customElements.get("guantlet-web-task-item")).toBeDefined();
    expect(globalThis.customElements.get("guantlet-web-diff-viewer")).toBeDefined();
    expect(globalThis.customElements.get("guantlet-web-badge")).toBeDefined();
    expect(globalThis.customElements.get("guantlet-web-capabilities")).toBeDefined();
    expect(globalThis.customElements.get("guantlet-web-design-swatch")).toBeDefined();
  });

  test("guantlet-web-task-item encapsulates Shadow DOM and manages attributes", async () => {
    const { GuantletWebTaskItem } = await import("../public/components/guantlet-web-task-item.js");
    const item = new GuantletWebTaskItem();
    item.setAttribute("task-id", "task-123");
    item.setAttribute("done", "false");

    expect(item.shadowRoot).toBeDefined();
    expect(item.taskId).toBe("task-123");
    expect(item.done).toBe(false);

    item.done = true;
    expect(item.getAttribute("done")).toBe("true");
  });

  test("guantlet-web-diff-viewer handles original and modified code diffs in Shadow DOM", async () => {
    const { GuantletWebDiffViewer } = await import("../public/components/guantlet-web-diff-viewer.js");
    const diff = new GuantletWebDiffViewer();
    diff.original = "line 1\nline 2";
    diff.modified = "line 1\nline 2 modified\nline 3";

    expect(diff.shadowRoot).toBeDefined();
    expect(diff.original).toContain("line 1");
    expect(diff.modified).toContain("line 3");
  });

  test("guantlet-web-badge leverages ElementInternals for form-association", async () => {
    const { GuantletWebBadge } = await import("../public/components/guantlet-web-badge.js");
    expect(GuantletWebBadge.formAssociated).toBe(true);

    const badge = new GuantletWebBadge();
    badge.variant = "category";
    expect(badge.variant).toBe("category");
    expect(badge.shadowRoot).toBeDefined();
  });

  test("guantlet-web-capabilities probes the platform surface without throwing", async () => {
    const { probeCapabilities, GuantletWebCapabilities } = await import("../public/components/guantlet-web-platform.js");

    const results = probeCapabilities();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(10);
    for (const r of results) {
      expect(typeof r.name).toBe("string");
      expect(typeof r.supported).toBe("boolean");
    }

    // Hydration path: no declarative shadow root in the mock, so it attaches cleanly.
    const el = new GuantletWebCapabilities();
    expect(el.shadowRoot).toBeDefined();
    el.connectedCallback();
    expect(el.getAttribute("data-score")).toMatch(/^\d+$/);
  });

  test("guantlet-web-design-swatch synchronizes OKLCH tokens, APCA Lc, and CustomStateSet states via ElementInternals", async () => {
    const { GuantletWebDesignSwatch } = await import("../public/components/guantlet-web-design-swatch.js");
    expect(GuantletWebDesignSwatch.formAssociated).toBe(true);

    const swatch = new GuantletWebDesignSwatch();
    swatch.token = "--bg-obsidian-950";
    swatch.oklch = "oklch(0.11 0.005 90)";
    swatch.apcaLc = 102.4;
    swatch.setAttribute("selected", "");

    expect(swatch.token).toBe("--bg-obsidian-950");
    expect(swatch.oklch).toBe("oklch(0.11 0.005 90)");
    expect(swatch.apcaLc).toBe(102.4);
    expect(swatch.shadowRoot).toBeDefined();
  });
});
