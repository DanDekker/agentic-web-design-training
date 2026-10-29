/**
 * Web Component: <guantlet-web-design-swatch>
 * MDN & WHATWG Standards:
 * - Autonomous Form-Associated Custom Element (static formAssociated = true)
 * - ElementInternals API (setFormValue, CustomStateSet :state(selected), :state(apca-aaa))
 * - Constructable Stylesheets (CSSStyleSheet.replaceSync + adoptedStyleSheets)
 * - Shadow DOM ::part(swatch), ::part(label), ::part(contrast) & Named <slot> projection
 */

const swatchSheet = new CSSStyleSheet();
swatchSheet.replaceSync(`
  :host {
    display: inline-flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.65rem;
    border: 1px solid var(--line, oklch(0.25 0.005 90));
    border-radius: 10px;
    background: var(--panel, oklch(0.14 0.005 90));
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.72rem;
    cursor: pointer;
    user-select: none;
    transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.16s ease;
  }

  :host(:state(selected)) {
    border-color: var(--ink, oklch(0.96 0.004 90));
    box-shadow: inset 0 1px 0 0 oklch(1 0 0 / 0.14);
  }

  .swatch-preview {
    width: 100%;
    min-width: 7.5rem;
    height: 2.4rem;
    border-radius: 6px;
    border: 1px solid oklch(1 0 0 / 0.12);
  }

  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .token-name {
    font-weight: 600;
    color: var(--ink, oklch(0.96 0.004 90));
  }

  .apca-pill {
    font-size: 0.64rem;
    padding: 0.08rem 0.35rem;
    border-radius: 4px;
    border: 1px solid var(--line, oklch(0.25 0.005 90));
    color: var(--muted, oklch(0.68 0.006 90));
  }
`);

export class GuantletWebDesignSwatch extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["token", "oklch", "apca-lc", "selected"];

  #shadowRoot;
  #internals;
  #previewEl;
  #nameEl;
  #contrastEl;

  constructor() {
    super();
    this.#internals = this.attachInternals?.() || null;
    if (this.#internals) {
      this.#internals.role = "option";
    }

    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.adoptedStyleSheets = [swatchSheet];
    this.#shadowRoot.innerHTML = `
      <div class="swatch-preview" part="swatch"></div>
      <div class="meta-row" part="meta">
        <span class="token-name" part="label"><slot name="label">--token</slot></span>
        <span class="apca-pill" part="contrast">Lc —</span>
      </div>
    `;

    this.#previewEl = this.#shadowRoot.querySelector(".swatch-preview");
    this.#nameEl = this.#shadowRoot.querySelector(".token-name");
    this.#contrastEl = this.#shadowRoot.querySelector(".apca-pill");
  }

  get token() {
    return this.getAttribute("token") || "--surface-obsidian";
  }

  set token(val) {
    this.setAttribute("token", String(val));
  }

  get oklch() {
    return this.getAttribute("oklch") || "oklch(0.14 0.005 90)";
  }

  set oklch(val) {
    this.setAttribute("oklch", String(val));
  }

  get apcaLc() {
    return Number(this.getAttribute("apca-lc") || 0);
  }

  set apcaLc(val) {
    this.setAttribute("apca-lc", String(val));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.#syncViewAndInternals();
  }

  #syncViewAndInternals() {
    const token = this.token;
    const oklch = this.oklch;
    const lc = this.apcaLc;
    const isSelected = this.hasAttribute("selected");

    if (this.#previewEl) {
      this.#previewEl.style = `background: ${oklch};`;
    }
    if (this.#nameEl) {
      this.#nameEl.textContent = token;
    }
    if (this.#contrastEl) {
      this.#contrastEl.textContent = `Lc ${lc}`;
    }

    if (this.#internals) {
      this.#internals.setFormValue?.(isSelected ? `${token}:${oklch}` : null);
      if (this.#internals.states) {
        if (isSelected) this.#internals.states.add("selected");
        else this.#internals.states.delete("selected");

        if (lc >= 75) this.#internals.states.add("apca-aaa");
        else this.#internals.states.delete("apca-aaa");
      }
    }
  }
}

if (!customElements.get("guantlet-web-design-swatch")) {
  customElements.define("guantlet-web-design-swatch", GuantletWebDesignSwatch);
}
