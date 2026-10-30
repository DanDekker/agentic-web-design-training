// Native hidden="until-found" support annex with a visible server-rendered fallback.
export interface FindableAnnexSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface FindableAnnexSpec {
  readonly id: string;
  readonly title: string;
  readonly sections: readonly FindableAnnexSection[];
}

function escapeAnnexText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeAnnexId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value);
}

export function renderFindableAnnex(spec: FindableAnnexSpec): { readonly html: string; readonly css: string } {
  if (!spec || !isSafeAnnexId(spec.id)) {
    throw new Error("The annex needs a safe HTML identifier");
  }
  if (typeof spec.title !== "string" || spec.title.trim().length === 0 || !Array.isArray(spec.sections) || spec.sections.length === 0) {
    throw new Error("The annex needs a title and at least one section");
  }

  const sectionIds = new Set<string>();
  for (const section of spec.sections) {
    if (!section || !isSafeAnnexId(section.id) || sectionIds.has(section.id)) {
      throw new Error("Each annex section needs a unique safe identifier");
    }
    sectionIds.add(section.id);
    if (typeof section.heading !== "string" || section.heading.trim().length === 0 || !Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
      throw new Error("Each annex section needs a heading and at least one paragraph");
    }
    for (const paragraph of section.paragraphs) {
      if (typeof paragraph !== "string" || paragraph.trim().length === 0) {
        throw new Error("Annex paragraphs must be non-empty plain text");
      }
    }
  }

  const sectionMarkup = spec.sections.map((section) => {
    const sectionId = `${spec.id}--section--${section.id}`;
    const headingId = `${spec.id}--section-heading--${section.id}`;
    const paragraphs = section.paragraphs
      .map((paragraph) => `      <p>${escapeAnnexText(paragraph)}</p>`)
      .join("\n");
    return [
      `    <article id="${sectionId}" class="support-annex__section" aria-labelledby="${headingId}">`,
      `      <h3 id="${headingId}">${escapeAnnexText(section.heading)}</h3>`,
      paragraphs,
      `    </article>`,
    ].join("\n");
  });
  const sectionLinks = spec.sections
    .map((section) => `    <li><a href="#${spec.id}--section--${section.id}">${escapeAnnexText(section.heading)}</a></li>`)
    .join("\n");

  const html = [
    `<nav class="support-annex__contents" aria-label="Support manual contents">`,
    `  <ul>`,
    `    <li><a href="#${spec.id}">Read ${escapeAnnexText(spec.title)}</a></li>`,
    sectionLinks,
    `  </ul>`,
    `</nav>`,
    `<button class="support-annex__toggle" type="button" aria-controls="${spec.id}" aria-expanded="true" hidden>Collapse annex</button>`,
    `<section id="${spec.id}" class="support-annex" aria-labelledby="${spec.id}--heading">`,
    `  <h2 id="${spec.id}--heading">${escapeAnnexText(spec.title)}</h2>`,
    ...sectionMarkup,
    `</section>`,
  ].join("\n");

  const css = [
    ".support-annex {",
    "  contain: layout;",
    "  scroll-margin-block-start: var(--site-header-size, 4rem);",
    "}",
    ".support-annex__contents,",
    ".support-annex__section {",
    "  max-inline-size: 72ch;",
    "}",
    ".support-annex__toggle {",
    "  min-block-size: max(2.75rem, 44px);",
    "  padding-inline: 1rem;",
    "}",
    ".support-annex__toggle:focus-visible {",
    "  outline: 3px solid currentColor;",
    "  outline-offset: 3px;",
    "}",
  ].join("\n");

  return { html, css };
}

export function bindFindableAnnex(panel: HTMLElement, toggle: HTMLButtonElement): () => void {
  const document = panel.ownerDocument;
  const setToggleState = (expanded: boolean) => {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "Collapse annex" : "Expand annex";
  };
  const restoreVisibleFallback = () => {
    panel.removeAttribute("hidden");
    toggle.hidden = true;
    setToggleState(true);
  };

  const probe = document.createElement("div");
  probe.setAttribute("hidden", "until-found");
  const supportsHiddenUntilFound =
    (probe as unknown as { hidden: boolean | "until-found" }).hidden === "until-found";
  if (!supportsHiddenUntilFound) {
    restoreVisibleFallback();
    return restoreVisibleFallback;
  }

  const fragmentTargetsAnnex = () => {
    const hash = document.defaultView?.location.hash ?? "";
    if (!hash.startsWith("#")) return false;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return false;
    }
    const target = document.getElementById(id);
    return target !== null && (target === panel || panel.contains(target));
  };

  toggle.hidden = false;
  if (fragmentTargetsAnnex()) {
    panel.removeAttribute("hidden");
    setToggleState(true);
  } else {
    panel.setAttribute("hidden", "until-found");
    setToggleState(false);
  }

  const onToggle = () => {
    const expanded = toggle.getAttribute("aria-expanded") !== "true";
    if (expanded) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "until-found");
    }
    setToggleState(expanded);
  };
  const onBeforeMatch = () => {
    // The browser removes hidden after beforematch and then scrolls to the match.
    setToggleState(true);
  };

  toggle.addEventListener("click", onToggle);
  panel.addEventListener("beforematch", onBeforeMatch);

  return () => {
    toggle.removeEventListener("click", onToggle);
    panel.removeEventListener("beforematch", onBeforeMatch);
    restoreVisibleFallback();
  };
}
