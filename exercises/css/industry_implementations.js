
export const cssIndustryExercises = Object.freeze({
  retail: {
    starter: `/* Storefront catalog: fixed columns, clipped names, uneven image boxes */
.retail-catalog { display: block; }
.retail-product { float: left; width: 31%; margin: 1%; }
.retail-product__media img { width: 280px; height: 180px; }
.retail-product__name { white-space: nowrap; }
.retail-product__variant { padding: 4px; }
.retail-product__variant[aria-pressed="true"] { background: #b21f35; }`,
    solution: `@layer retail.tokens, retail.components;

@layer retail.tokens {
  :root {
    --retail-ink: #20242a;
    --retail-surface: #fff;
    --retail-line: #c7ccd2;
    --retail-focus: #075fcc;
  }
}

@layer retail.components {
  .retail-catalog {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: clamp(1rem, 2cqi, 1.75rem);
  }

  .retail-product {
    container: retail-product / inline-size;
    display: grid;
    align-content: start;
    min-inline-size: 0;
    color: var(--retail-ink);
    background: var(--retail-surface);
    border: 1px solid var(--retail-line);
    border-radius: 0.75rem;
    overflow: clip;
  }

  .retail-product__layout {
    display: grid;
    min-inline-size: 0;
  }

  .retail-product__media {
    aspect-ratio: 4 / 3;
    overflow: clip;
    background: #f2f3f5;
  }

  .retail-product__media img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  .retail-product__details {
    display: grid;
    align-content: start;
    gap: 0.75rem;
    min-inline-size: 0;
    padding: 1rem;
  }

  .retail-product__name {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .retail-product__price {
    font-variant-numeric: tabular-nums;
  }

  .retail-product__variants {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .retail-product__variant {
    min-inline-size: max(2.75rem, 44px);
    min-block-size: max(2.75rem, 44px);
    padding: 0.5rem;
  }

  .retail-product__variant[aria-pressed="true"] {
    border: 3px double currentColor;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .retail-product:focus-within {
    outline: 2px solid var(--retail-focus);
    outline-offset: 3px;
  }

  @container retail-product (min-width: 28rem) {
    .retail-product__layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }

    .retail-product__media {
      aspect-ratio: 1;
    }
  }

  @media (forced-colors: active) {
    .retail-product__variant[aria-pressed="true"] {
      border-color: Highlight;
      color: Highlight;
    }
  }
}`,
  },
  healthcare: {
    starter: `/* Patient form: fixed columns and color-only validation */
.patient-intake { width: 960px; }
.patient-intake__grid { display: grid; grid-template-columns: 480px 480px; }
.patient-intake__field input,
.patient-intake__field select,
.patient-intake__field textarea { width: 420px; height: 30px; }
.patient-intake [aria-invalid="true"] { border: 1px solid red; }
.patient-intake input:focus { outline: none; }`,
    solution: `@layer patient-form {
  .patient-intake {
    container: patient-intake / inline-size;
    inline-size: min(100% - 2rem, 76rem);
    margin-inline: auto;
    padding-block: clamp(1rem, 3cqi, 2rem);
  }

  .patient-intake__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1rem, 2cqi, 1.5rem);
  }

  .patient-intake__field {
    display: grid;
    align-content: start;
    gap: 0.5rem;
    min-inline-size: 0;
  }

  .patient-intake__field input,
  .patient-intake__field select,
  .patient-intake__field textarea {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 100%;
    min-block-size: max(2.75rem, 44px);
    padding: 0.65rem 0.75rem;
    font: inherit;
  }

  .patient-intake__field textarea {
    min-block-size: 7rem;
    resize: vertical;
  }

  .patient-intake [aria-invalid="true"] {
    border: 2px solid #9a1b24;
    border-inline-start: 0.4rem double #9a1b24;
  }

  .patient-intake :focus-visible {
    outline: 3px solid #075fcc;
    outline-offset: 3px;
  }

  @container patient-intake (max-width: 42rem) {
    .patient-intake__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (forced-colors: active) {
    .patient-intake [aria-invalid="true"] {
      border-color: CanvasText;
      color: CanvasText;
    }

    .patient-intake :focus-visible {
      outline-color: Highlight;
    }
  }
}`,
  },
  banking: {
    starter: `/* Ledger: the table is destructively converted into cards */
.bank-ledger table { width: 100%; }
.bank-ledger tr,
.bank-ledger td,
.bank-ledger th { display: block; }
.bank-ledger td.amount { float: right; }
.bank-ledger th { position: fixed; top: 0; }
@media print { .bank-ledger { display: none; } }`,
    solution: `@layer bank-ledger {
  .bank-ledger,
  .bank-ledger__scroll {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .bank-ledger__scroll {
    overflow: auto;
    overscroll-behavior-inline: contain;
    border: 1px solid #b8c0ca;
  }

  .bank-ledger table {
    inline-size: 100%;
    min-inline-size: 56rem;
    border-collapse: separate;
    border-spacing: 0;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .bank-ledger thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    background: #f1f3f6;
  }

  .bank-ledger th,
  .bank-ledger td {
    padding-block: 0.75rem;
    padding-inline: 1rem;
    text-align: start;
    border-block-end: 1px solid #c8ced6;
  }

  .bank-ledger .amount,
  .bank-ledger .balance {
    text-align: end;
    white-space: nowrap;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .bank-ledger a:focus-visible,
  .bank-ledger button:focus-visible {
    outline: 3px solid #075fcc;
    outline-offset: 2px;
  }

  @media print {
    .bank-ledger__scroll {
      overflow: visible;
      max-inline-size: none;
      border: 0;
    }

    .bank-ledger table {
      min-inline-size: 0;
      font-size: 9pt;
    }

    .bank-ledger thead th {
      position: static;
    }
  }
}`,
  },
  logistics: {
    starter: `/* Dispatch board: viewport-only columns and color-only severity */
.dispatch-board__lanes { display: grid; grid-template-columns: repeat(4, 300px); }
@media (max-width: 900px) { .dispatch-board__lanes { grid-template-columns: 1fr; } }
.dispatch-order { width: 280px; overflow: hidden; }
[data-severity="delayed"] .ops-status { color: red; }
[data-severity="critical"] .ops-status { color: darkred; animation: blink 500ms infinite; }`,
    solution: `@layer dispatch-board {
  .dispatch-board {
    container: dispatch-board / inline-size;
    display: grid;
    gap: 1rem;
    min-inline-size: 0;
  }

  .dispatch-board__lanes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: start;
    gap: 1rem;
    min-inline-size: 0;
  }

  .dispatch-lane,
  .dispatch-order {
    display: grid;
    gap: 0.75rem;
    min-inline-size: 0;
  }

  .dispatch-order {
    padding: 1rem;
    border: 1px solid #8a929c;
    overflow-wrap: anywhere;
  }

  .ops-status {
    display: inline-flex;
    align-items: center;
    max-inline-size: 100%;
    padding: 0.25rem 0.5rem;
    border: 2px solid currentColor;
    border-radius: 0.25rem;
    overflow-wrap: anywhere;
  }

  [data-severity="delayed"] .ops-status {
    border-style: dashed;
    border-inline-start-width: 0.4rem;
  }

  [data-severity="critical"] .ops-status {
    border-style: double;
    border-width: 0.25rem;
    font-weight: 700;
  }

  @container dispatch-board (max-width: 70rem) {
    .dispatch-board__lanes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container dispatch-board (max-width: 38rem) {
    .dispatch-board__lanes {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (forced-colors: active) {
    .ops-status {
      border-color: CanvasText;
      color: CanvasText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dispatch-board *,
    .dispatch-board *::before,
    .dispatch-board *::after {
      animation: none;
      transition: none;
    }
  }
}`,
  },
  newsroom: {
    starter: `/* Newsroom story: fixed measure, brittle floats, screen chrome in print */
.story-reader { width: 1100px; }
.story-reader__body { width: 640px; float: left; }
.story-reader__body h1 { font-size: 48px; white-space: nowrap; }
.story-reader__body img { width: 600px; height: 300px; }
.story-reader__nav,
.story-reader__ad { display: block; }`,
    solution: `@layer newsroom {
  .story-reader {
    container: newsroom-story / inline-size;
    inline-size: min(100% - 2rem, 82rem);
    margin-inline: auto;
  }

  .story-reader__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(1.5rem, 4cqi, 3rem);
  }

  .story-reader__body {
    min-inline-size: 0;
    max-inline-size: 68ch;
    margin-inline: auto;
    font-size: clamp(1.0625rem, 1rem + 0.25vw, 1.25rem);
    line-height: 1.75;
  }

  .story-reader__body h1,
  .story-reader__body h2 {
    text-wrap: balance;
    overflow-wrap: anywhere;
    line-height: 1.15;
  }

  .story-reader__body p {
    hyphens: auto;
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }

  .story-reader__body img,
  .story-reader__body video,
  .story-reader__body iframe {
    display: block;
    max-inline-size: 100%;
  }

  .story-reader__figure {
    margin-inline: 0;
  }

  .story-reader__figure img {
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .story-reader__code,
  .story-reader__table-scroll {
    max-inline-size: 100%;
    overflow: auto;
  }

  @container newsroom-story (min-width: 76rem) {
    .story-reader__layout {
      grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
    }
  }

  @media print {
    .story-reader {
      inline-size: auto;
      max-inline-size: none;
    }

    .story-reader__nav,
    .story-reader__ad,
    .story-reader__controls {
      display: none;
    }

    .story-reader__layout {
      display: block;
    }

    .story-reader a[href^="http"]::after {
      content: " (" attr(href) ")";
      overflow-wrap: anywhere;
    }
  }
}`,
  },
  restaurant: {
    starter: `/* POS menu: hover-only state and a hard-coded tablet canvas */
.restaurant-pos { height: 768px; width: 1024px; overflow: hidden; }
.menu-grid { display: block; }
.menu-item { float: left; width: 110px; height: 42px; }
.menu-item:hover { transform: scale(1.05); background: green; }
.menu-item[aria-pressed="true"] { background: green; }
.menu-item:focus { outline: none; }`,
    solution: `@layer restaurant-pos {
  .restaurant-pos {
    box-sizing: border-box;
    min-block-size: 100svh;
    min-block-size: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 1rem;
    padding-block: 1rem;
    padding-inline-start: max(1rem, env(safe-area-inset-left));
    padding-inline-end: max(1rem, env(safe-area-inset-right));
  }

  .restaurant-pos:dir(rtl) {
    padding-inline-start: max(1rem, env(safe-area-inset-right));
    padding-inline-end: max(1rem, env(safe-area-inset-left));
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    align-content: start;
    gap: 0.75rem;
    min-inline-size: 0;
  }

  .menu-item {
    display: grid;
    align-content: center;
    min-inline-size: 0;
    min-block-size: max(3.25rem, 52px);
    padding: 0.75rem;
    border: 2px solid #5d6570;
    border-radius: 0.5rem;
    background: #fff;
    color: #171a1e;
    text-align: start;
    overflow-wrap: anywhere;
    transition: transform 140ms ease, box-shadow 140ms ease;
  }

  .menu-item[aria-pressed="true"] {
    border: 4px double currentColor;
    box-shadow: inset 0 0 0 2px currentColor;
  }

  .menu-item__selected-marker {
    display: none;
  }

  .menu-item[aria-pressed="true"] .menu-item__selected-marker {
    display: inline;
  }

  .menu-item:focus-visible {
    outline: 3px solid #075fcc;
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .menu-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem #0002;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .menu-item {
      transition: none;
    }

    .menu-item:hover {
      transform: none;
      box-shadow: none;
    }
  }

  @media (forced-colors: active) {
    .menu-item {
      border-color: ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }

    .menu-item[aria-pressed="true"] {
      border-color: Highlight;
      color: Highlight;
    }

    .menu-item:focus-visible {
      outline-color: Highlight;
    }
  }
}`,
  },
  publicService: {
    starter: `/* Permit form: fixed sidebar covers content at high zoom */
.permit-workspace { width: 1200px; }
.permit-layout { display: grid; grid-template-columns: 850px 320px; }
.permit-review { position: fixed; right: 0; top: 100px; width: 300px; }
.permit-form input,
.permit-form select,
.permit-form textarea { width: 500px; }
.permit-form [aria-invalid="true"] { color: red; border: 1px solid red; }
.permit-form :focus { outline: none; }`,
    solution: `@layer public-permit {
  .permit-workspace {
    container: permit-workspace / inline-size;
    inline-size: min(100% - 2rem, 78rem);
    margin-inline: auto;
  }

  .permit-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.42fr);
    align-items: start;
    gap: clamp(1rem, 3cqi, 2.5rem);
  }

  .permit-form,
  .permit-review,
  .permit-form fieldset {
    min-inline-size: 0;
  }

  .permit-form__field {
    display: grid;
    gap: 0.5rem;
    min-inline-size: 0;
    margin-block-end: 1.25rem;
  }

  .permit-form input,
  .permit-form select,
  .permit-form textarea {
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 100%;
    min-block-size: max(2.75rem, 44px);
    padding: 0.65rem;
    font: inherit;
  }

  .permit-form textarea {
    min-block-size: 8rem;
    resize: vertical;
  }

  .permit-form [aria-invalid="true"] {
    border: 2px solid #8f1d27;
    border-inline-start: 0.45rem double #8f1d27;
  }

  .permit-error-summary {
    padding: 1rem;
    border: 2px solid #8f1d27;
    border-inline-start-width: 0.6rem;
  }

  .permit-workspace :focus-visible {
    outline: 3px solid #075fcc;
    outline-offset: 3px;
  }

  @container permit-workspace (max-width: 54rem) {
    .permit-layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (forced-colors: active) {
    .permit-form [aria-invalid="true"],
    .permit-error-summary {
      border-color: CanvasText;
      color: CanvasText;
    }

    .permit-workspace :focus-visible {
      outline-color: Highlight;
    }
  }
}`,
  },
  saasMigration: {
    starter: `/* Vendor admin skin and application overrides compete globally */
@import url("/assets/legacy-admin.css");
html body #admin-root .widget.widget-primary { color: navy !important; }
#admin-root .widget.widget-primary button { background: royalblue !important; }
.u-hidden { display: none !important; }`,
    solution: `/* Keep unavoidable vendor-important escapes in one temporary, highest-priority layer. */
@layer legacy-important, reset, vendor, tokens, components, utilities, app-overrides;
@import url("/assets/legacy-admin.css") layer(vendor);

@layer reset {
  :where(*, *::before, *::after) {
    box-sizing: border-box;
  }
}

@layer tokens {
  :root {
    --admin-ink: #20242a;
    --admin-accent: #164db8;
    --admin-radius: 0.5rem;
  }
}

@layer components {
  .admin-shell {
    color: var(--admin-ink);
    font: 1rem/1.5 system-ui, sans-serif;
  }

  .admin-shell .widget {
    border-radius: var(--admin-radius);
  }

  .admin-shell .widget-primary button {
    min-block-size: 2.75rem;
    border-radius: var(--admin-radius);
  }
}

@layer legacy-important {
  .admin-shell .widget-primary button {
    background: var(--admin-accent) !important;
    color: #fff !important;
  }
}

@layer utilities {
  :where(.u-hidden) {
    display: none;
  }
}

@layer app-overrides {
  .admin-shell .widget-primary button {
    background: var(--admin-accent);
    color: #fff;
  }
}`,
  },
});
