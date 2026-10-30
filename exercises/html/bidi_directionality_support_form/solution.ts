// International claims intake using HTML directionality and logical CSS.
export type SupportUiDirection = "ltr" | "rtl";

export interface SupportIntakeSpec {
  /** Unique and safe for the rendered document. */
  readonly id: string;
  /** Direction of the localized interface, supplied by the application locale. */
  readonly uiDirection: SupportUiDirection;
  readonly contactName: string;
  readonly incidentReference: string;
  readonly incidentNotes: string;
}

function escapeBidiText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeSupportId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
}

export function renderBidiSafeSupportForm(spec: SupportIntakeSpec): { html: string; css: string } {
  if (!spec || !isSafeSupportId(spec.id)) {
    throw new Error("id must be a unique safe identifier for this document");
  }
  if (spec.uiDirection !== "ltr" && spec.uiDirection !== "rtl") {
    throw new Error("uiDirection must be ltr or rtl");
  }
  if ([spec.contactName, spec.incidentReference, spec.incidentNotes].some((value) => typeof value !== "string")) {
    throw new Error("User-provided support text must be strings");
  }

  const html = [
    `<section class="support-intake" dir="${spec.uiDirection}" aria-labelledby="${spec.id}--title">`,
    `  <h2 id="${spec.id}--title">Claim intake · <bdi dir="auto">${escapeBidiText(spec.incidentReference)}</bdi></h2>`,
    `  <form class="support-intake__form" action="/claims" method="post">`,
    `    <div class="support-intake__fields">`,
    `      <div class="support-intake__field">`,
    `        <label for="${spec.id}--contact">Contact name</label>`,
    `        <input id="${spec.id}--contact" type="text" name="contactName" autocomplete="name" dir="auto" dirname="contactName.dir" value="${escapeBidiText(spec.contactName)}" required />`,
    `      </div>`,
    `      <div class="support-intake__field">`,
    `        <label for="${spec.id}--notes">Incident description</label>`,
    `        <textarea id="${spec.id}--notes" name="incidentNotes" dir="auto" dirname="incidentNotes.dir" rows="5" required>${escapeBidiText(spec.incidentNotes)}</textarea>`,
    `      </div>`,
    `    </div>`,
    `    <p class="support-intake__next">Continue in the selected flow <span class="support-intake__direction-arrow" aria-hidden="true">→</span></p>`,
    `    <button type="submit">Submit incident</button>`,
    `  </form>`,
    `</section>`,
  ].join("\n");

  const css = `.support-intake {
  container: support-intake / inline-size;
  max-inline-size: 50rem;
  color: CanvasText;
}

.support-intake__form {
  display: grid;
  gap: 1rem;
}

.support-intake__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.support-intake__field {
  display: grid;
  gap: 0.35rem;
  min-inline-size: 0;
}

@container support-intake (min-width: 40rem) {
  .support-intake__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .support-intake__field:last-child {
    grid-column: 1 / -1;
  }
}

.support-intake__field input,
.support-intake__field textarea {
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: 2.75rem;
  padding-inline: 0.75rem;
  font: inherit;
  text-align: start;
}

.support-intake__field textarea {
  resize: vertical;
}

.support-intake__next {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-block: 0.5rem;
}

.support-intake__direction-arrow {
  display: inline-block;
}

.support-intake:dir(rtl) .support-intake__direction-arrow {
  rotate: 180deg;
}

.support-intake :focus-visible {
  outline: 3px solid Highlight;
  outline-offset: 3px;
}

@media (forced-colors: active) {
  .support-intake__field input,
  .support-intake__field textarea {
    border-color: CanvasText;
  }
}`;

  return { html, css };
}
