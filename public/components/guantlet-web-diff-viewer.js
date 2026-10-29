/**
 * Web Component: <guantlet-web-diff-viewer>
 * MDN Standards: Autonomous Custom Element, Open Shadow DOM, Adopted StyleSheets.
 * Provides encapsulated line-by-line diff viewing with zero host stylesheet leakage.
 */

const diffStyles = new CSSStyleSheet();
diffStyles.replaceSync(`
  :host {
    display: block;
    border: 1px solid var(--line, oklch(0.9 0.005 90));
    border-radius: 8px;
    background: color-mix(in oklch, var(--bg, oklch(0.12 0.005 90)) 85%, black);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.76rem;
    line-height: 1.6;
    overflow: hidden;
  }

  .scroll-wrap {
    max-height: 380px;
    overflow-y: auto;
  }

  .diff-table {
    width: 100%;
    border-collapse: collapse;
  }

  .diff-row {
    display: flex;
    padding: 0.12rem 0.6rem;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .line-num {
    display: inline-block;
    width: 2.8rem;
    color: var(--faint, oklch(0.4 0.008 90));
    user-select: none;
    text-align: right;
    margin-right: 0.8rem;
    opacity: 0.7;
    flex: none;
  }

  .code-text {
    flex: 1;
  }

  .diff-row.removed {
    background: color-mix(in oklch, var(--accent-fail, oklch(0.68 0.20 25)) 14%, transparent);
    color: var(--accent-fail, oklch(0.68 0.20 25));
  }

  .diff-row.added {
    background: color-mix(in oklch, var(--accent-pass, oklch(0.72 0.16 150)) 14%, transparent);
    color: var(--accent-pass, oklch(0.72 0.16 150));
  }

  .diff-row.unchanged {
    color: var(--muted, oklch(0.6 0.01 90));
  }
`);

export class GuantletWebDiffViewer extends HTMLElement {
  static observedAttributes = ["original", "modified"];
  #shadowRoot;
  #container;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "open" });
    this.#shadowRoot.adoptedStyleSheets = [diffStyles];
    this.#shadowRoot.innerHTML = `<div class="scroll-wrap"><div class="diff-table"></div></div>`;
    this.#container = this.#shadowRoot.querySelector(".diff-table");
  }

  get original() {
    return this.getAttribute("original") || "";
  }

  set original(val) {
    this.setAttribute("original", val);
  }

  get modified() {
    return this.getAttribute("modified") || "";
  }

  set modified(val) {
    this.setAttribute("modified", val);
  }

  attributeChangedCallback() {
    this.#render();
  }

  connectedCallback() {
    this.#render();
  }

  #render() {
    if (!this.#container) return;
    const origLines = this.original.split("\n");
    const modLines = this.modified.split("\n");
    const max = Math.max(origLines.length, modLines.length);
    const rows = [];

    let origNum = 1;
    let modNum = 1;

    for (let i = 0; i < max; i++) {
      const o = origLines[i];
      const m = modLines[i];

      if (o === undefined && m !== undefined) {
        rows.push({ type: "added", num: modNum++, text: `+ ${m}` });
      } else if (m === undefined && o !== undefined) {
        rows.push({ type: "removed", num: origNum++, text: `- ${o}` });
      } else if (o !== m) {
        rows.push({ type: "removed", num: origNum++, text: `- ${o}` });
        rows.push({ type: "added", num: modNum++, text: `+ ${m}` });
      } else {
        rows.push({ type: "unchanged", num: origNum++, text: `  ${o}` });
        modNum++;
      }
    }

    this.#container.innerHTML = rows
      .map(
        (r) => `
      <div class="diff-row ${r.type}">
        <span class="line-num">${r.num}</span>
        <span class="code-text">${this.#escape(r.text)}</span>
      </div>
    `,
      )
      .join("");
  }

  #escape(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

if (!customElements.get("guantlet-web-diff-viewer")) {
  customElements.define("guantlet-web-diff-viewer", GuantletWebDiffViewer);
}
