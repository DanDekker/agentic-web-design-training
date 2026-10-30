// Native exclusive disclosure groups for a step-by-step support flow.
export interface NamedDisclosureItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly open?: boolean;
}

export interface NamedDisclosureGroupSpec {
  readonly groupId: string;
  readonly title: string;
  readonly items: readonly NamedDisclosureItem[];
}

function escapeDisclosureText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeDisclosureId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}

export function renderNamedDisclosureGroup(spec: NamedDisclosureGroupSpec): string {
  if (!spec || !isSafeDisclosureId(spec.groupId)) {
    throw new Error("groupId must be a safe, unique HTML identifier");
  }
  if (typeof spec.title !== "string" || spec.title.trim().length === 0 || !Array.isArray(spec.items) || spec.items.length === 0) {
    throw new Error("A disclosure group needs a title and at least one item");
  }

  const itemIds = new Set<string>();
  let initiallyOpenCount = 0;

  for (const item of spec.items) {
    if (!item || !isSafeDisclosureId(item.id)) {
      throw new Error("Each disclosure item needs a safe identifier");
    }
    if (itemIds.has(item.id)) {
      throw new Error(`Duplicate disclosure item id '${item.id}'`);
    }
    itemIds.add(item.id);
    if (typeof item.question !== "string" || typeof item.answer !== "string") {
      throw new Error("Disclosure questions and answers must be plain text");
    }
    if (item.question.trim().length === 0 || item.answer.trim().length === 0) {
      throw new Error("Disclosure questions and answers must not be empty");
    }
    if (item.open !== undefined && typeof item.open !== "boolean") {
      throw new Error("The open state must be boolean when provided");
    }
    if (item.open === true) initiallyOpenCount += 1;
  }

  if (initiallyOpenCount > 1) {
    throw new Error("Only one item in a named details group may start open");
  }

  const groupName = `${spec.groupId}-disclosures`;
  const rows = spec.items.map((item) => {
    const openAttribute = item.open === true ? " open" : "";
    return [
      `  <details id="${spec.groupId}--item-${item.id}" name="${groupName}"${openAttribute}>`,
      `    <summary>${escapeDisclosureText(item.question)}</summary>`,
      `    <div class="support-flow__answer"><p>${escapeDisclosureText(item.answer)}</p></div>`,
      `  </details>`,
    ].join("\n");
  });

  return [
    `<section class="support-flow" aria-labelledby="${spec.groupId}--heading">`,
    `  <h2 id="${spec.groupId}--heading">${escapeDisclosureText(spec.title)}</h2>`,
    ...rows,
    `</section>`,
  ].join("\n");
}
