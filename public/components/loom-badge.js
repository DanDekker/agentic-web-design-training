/**
 * Web Component: <loom-badge>
 * MDN Standards: Autonomous Custom Element, Form-Associated Custom Element,
 * ElementInternals API (accessibility role mapping & validation), Shadow DOM.
 */

const badgeStyles = new CSSStyleSheet();
badgeStyles.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .badge {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.65rem;
    padding: 0.12rem 0.45rem;
    border: 1px solid var(--line, oklch(0.9 0.005 90));
    border-radius: 4px;
    color: var(--muted, oklch(0.6 0.01 90));
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
    transition: all 0.15s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  :host([variant="category"]) .badge {
    background: var(--ink, oklch(0.12 0.005 90));
    color: var(--bg, oklch(0.96 0.004 90));
    border-color: var(--ink, oklch(0.12 0.005 90));
  }

  :host([variant="difficulty"][level="advanced"]) .badge {
    border-color: var(--ink, oklch(0.12 0.005 90));
    font-weight: 600;
  }

  :host([variant="tag"]) .badge {
    text-transform: lowercase;
    font-size: 0.62rem;
    padding: 0.08rem 0.35rem;
  }
`);

export class LoomBadge extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["variant", "level", "value"];

  #shadowRoot;
  #internals;
  #badgeEl;

  constructor() {
    super();
    this.#internals = this.attachInternals?.() || null;
    if (this.#internals) {
      this.#internals.role = "status";
    }

    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.adoptedStyleSheets = [badgeStyles];
    this.#shadowRoot.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
    this.#badgeEl = this.#shadowRoot.querySelector(".badge");
  }

  get variant() {
    return this.getAttribute("variant") || "default";
  }

  set variant(val) {
    this.setAttribute("variant", val);
  }

  get level() {
    return this.getAttribute("level") || "";
  }

  set level(val) {
    this.setAttribute("level", val);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "variant" && this.#badgeEl) {
      this.#badgeEl.dataset.variant = newValue;
    }
  }
}

if (!customElements.get("loom-badge")) {
  customElements.define("loom-badge", LoomBadge);
}
