/**
 * Web Component: <gauntlet-web-task-item>
 * MDN Standards: Autonomous Custom Element, Open Shadow DOM, Adopted StyleSheets, Slot API.
 */

const itemStyles = new CSSStyleSheet();
itemStyles.replaceSync(`
  :host {
    display: block;
    border-bottom: 1px solid var(--line, oklch(0.9 0.005 90));
    transition: opacity 0.2s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  :host(:last-child) {
    border-bottom: 0;
  }

  :host([cursor]) {
    box-shadow: inset 2px 0 0 var(--ink, oklch(0.12 0.005 90));
  }

  :host([dragging]) {
    opacity: 0.3;
  }

  :host([drop-target]) {
    box-shadow: inset 0 2px 0 var(--ink, oklch(0.12 0.005 90));
  }

  .row {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    align-items: start;
    gap: 0.85rem;
    padding: 0.8rem 0.2rem;
  }

  .check-btn {
    appearance: none;
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    margin: 0.16rem 0 0;
    padding: 0;
    border: 1.4px solid var(--faint, oklch(0.78 0.008 90));
    border-radius: 999px;
    background: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .check-btn:hover {
    border-color: var(--ink, oklch(0.12 0.005 90));
  }

  :host([done="true"]) .check-btn {
    border-color: var(--ink, oklch(0.12 0.005 90));
    background: var(--ink, oklch(0.12 0.005 90));
  }

  .check-icon {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: var(--bg, oklch(0.96 0.004 90));
    stroke-width: 2.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 22;
    stroke-dashoffset: 22;
    transition: stroke-dashoffset 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  :host([done="true"]) .check-icon {
    stroke-dashoffset: 0;
  }

  .content-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .actions-col {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .delete-btn {
    appearance: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--faint, oklch(0.78 0.008 90));
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  :host(:hover) .delete-btn,
  .delete-btn:focus-visible,
  :host([cursor]) .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--ink, oklch(0.12 0.005 90));
    background: color-mix(in oklch, var(--ink) 8%, transparent);
  }

  .delete-icon {
    width: 13px;
    height: 13px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }
`);

export class GauntletWebTaskItem extends HTMLElement {
  static observedAttributes = ["done", "priority", "task-id", "cursor", "dragging", "drop-target"];

  #shadowRoot;
  #checkBtn;
  #deleteBtn;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.adoptedStyleSheets = [itemStyles];

    this.#shadowRoot.innerHTML = `
      <div class="row" part="row">
        <button type="button" class="check-btn" part="checkbox" aria-label="Toggle task">
          <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.6l4.4 4.4L19 7.4" />
          </svg>
        </button>

        <div class="content-col" part="content">
          <slot name="title"></slot>
          <slot name="meta"></slot>
        </div>

        <div class="actions-col" part="actions">
          <button type="button" class="delete-btn" part="delete" aria-label="Delete task">
            <svg class="delete-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    `;

    this.#checkBtn = this.#shadowRoot.querySelector(".check-btn");
    this.#deleteBtn = this.#shadowRoot.querySelector(".delete-btn");
  }

  get taskId() {
    return this.getAttribute("task-id") || "";
  }

  get done() {
    return this.getAttribute("done") === "true";
  }

  set done(val) {
    this.setAttribute("done", String(Boolean(val)));
  }

  connectedCallback() {
    this.#checkBtn.addEventListener("click", this.#handleCheckClick);
    this.#deleteBtn.addEventListener("click", this.#handleDeleteClick);
  }

  disconnectedCallback() {
    this.#checkBtn.removeEventListener("click", this.#handleCheckClick);
    this.#deleteBtn.removeEventListener("click", this.#handleDeleteClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "done" && this.#checkBtn) {
      this.#checkBtn.setAttribute("aria-pressed", String(newValue === "true"));
    }
  }

  #handleCheckClick = (e) => {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("task-toggle", {
        bubbles: true,
        composed: true,
        detail: { id: this.taskId, currentDone: this.done },
      }),
    );
  };

  #handleDeleteClick = (e) => {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("task-delete", {
        bubbles: true,
        composed: true,
        detail: { id: this.taskId },
      }),
    );
  };
}

if (!customElements.get("gauntlet-web-task-item")) {
  customElements.define("gauntlet-web-task-item", GauntletWebTaskItem);
}
