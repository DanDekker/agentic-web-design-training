/**
 * Web Component: <loom-capabilities>
 *
 * Live feature-detection for the 2026 web platform surface this app targets.
 * Demonstrates two bleeding-edge patterns at once:
 *   1. Declarative Shadow DOM (DSD) hydration — the element ships with a
 *      <template shadowrootmode="open"> so first paint exists before JS runs;
 *      the constructor adopts that root instead of throwing on re-attach.
 *   2. Adopted StyleSheets on the hydrated root, so no <style> is duplicated.
 */

const capsStyles = new CSSStyleSheet();
capsStyles.replaceSync(`
  :host {
    display: block;
    margin-top: 0.9rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.4rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.7rem;
    color: var(--muted, oklch(0.6 0.01 90));
    padding: 0.2rem 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    flex: none;
    background: var(--faint, oklch(0.4 0.01 90));
  }

  li[data-supported="true"] .dot {
    background: var(--accent-pass, oklch(0.72 0.16 150));
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--accent-pass, oklch(0.72 0.16 150)) 25%, transparent);
  }

  li[data-supported="false"] .dot {
    background: var(--accent-fail, oklch(0.68 0.20 25));
  }

  .summary {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.68rem;
    color: var(--faint, oklch(0.4 0.01 90));
    margin-top: 0.6rem;
    letter-spacing: 0.04em;
  }
`);

/** Each probe returns a boolean. Wrapped so a throwing probe is "unsupported". */
const PROBES = [
  ["Popover API", () => typeof HTMLElement.prototype.showPopover === "function"],
  ["Native <dialog>", () => typeof HTMLDialogElement !== "undefined"],
  ["Interest invokers", () => Object.hasOwn(HTMLButtonElement.prototype, "interestForElement")],
  ["Declarative Shadow DOM", () => Object.hasOwn(HTMLTemplateElement.prototype, "shadowRootMode")],
  ["CSS anchor positioning", () => CSS.supports("anchor-name: --probe")],
  ["Scroll-driven animations", () => CSS.supports("animation-timeline: scroll()")],
  ["field-sizing: content", () => CSS.supports("field-sizing: content")],
  ["interpolate-size", () => CSS.supports("interpolate-size: allow-keywords")],
  ["::details-content", () => CSS.supports("selector(::details-content)")],
  ["Container style queries", () => CSS.supports("container-type: style")],
  ["Same-doc View Transitions", () => typeof document.startViewTransition === "function"],
  ["light-dark()", () => CSS.supports("color: light-dark(#000, #fff)")],
  ["ElementInternals", () => typeof HTMLElement.prototype.attachInternals === "function"],
  ["@starting-style", () => CSS.supports("selector(:popover-open)")],
];

export function probeCapabilities() {
  const results = [];
  for (const [name, probe] of PROBES) {
    let supported = false;
    try {
      supported = Boolean(probe());
    } catch {
      supported = false;
    }
    results.push({ name, supported });
  }
  return results;
}

export class LoomCapabilities extends HTMLElement {
  #root;

  constructor() {
    super();
    // Hydrate a declarative shadow root if the document shipped one.
    this.#root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    this.#root.adoptedStyleSheets = [capsStyles];
  }

  connectedCallback() {
    const doc = this.ownerDocument ?? globalThis.document;
    if (!doc) return;

    const results = probeCapabilities();
    const supported = results.filter((r) => r.supported).length;

    const list = doc.createElement("ul");
    for (const { name, supported: ok } of results) {
      const li = doc.createElement("li");
      li.dataset.supported = String(ok);
      const dot = doc.createElement("span");
      dot.className = "dot";
      const label = doc.createElement("span");
      label.textContent = name;
      li.append(dot, label);
      list.append(li);
    }

    const summary = doc.createElement("p");
    summary.className = "summary";
    summary.textContent = `${supported}/${results.length} platform features live in this browser`;

    this.#root.replaceChildren(list, summary);
    this.setAttribute("data-score", String(supported));
    this.dispatchEvent(
      new CustomEvent("capabilities-detected", {
        bubbles: true,
        composed: true,
        detail: { supported, total: results.length, results },
      }),
    );
  }
}

if (!customElements.get("loom-capabilities")) {
  customElements.define("loom-capabilities", LoomCapabilities);
}
