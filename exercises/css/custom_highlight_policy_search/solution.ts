// Range-based policy search highlights without rewriting article nodes.
export interface PolicySearchControlsSpec {
  readonly instanceId: string;
  readonly articleId: string;
}

export interface PolicySearchMatch {
  readonly start: number;
  readonly end: number;
}

export interface PolicySearchMatches {
  readonly matches: readonly PolicySearchMatch[];
  readonly truncated: boolean;
}

export interface PolicySearchController {
  refresh(): void;
  dispose(): void;
}

interface SearchHighlightRegistry {
  has(name: string): boolean;
  set(name: string, highlight: unknown): unknown;
  delete(name: string): boolean;
}

interface SearchHighlightRuntime {
  readonly CSS?: {
    readonly highlights?: SearchHighlightRegistry;
    supports?: (conditionText: string) => boolean;
  };
  readonly Highlight?: new (...ranges: Range[]) => { priority: number };
}

interface IndexedTextSegment {
  readonly node: Text;
  readonly start: number;
  readonly end: number;
}

const MAX_QUERY_LENGTH = 256;
const MAX_HIGHLIGHT_RANGES = 500;
const TEXT_BOUNDARY = "\u0000";
const EXCLUDED_CONTENT = "script, style, template, noscript, input, select, textarea, button, [hidden], [inert], [aria-hidden=\"true\"], [data-search-exclude], [contenteditable]";
const BLOCK_CONTENT = "address, article, aside, blockquote, dd, div, dl, dt, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, li, main, nav, ol, p, pre, section, table, tbody, td, tfoot, th, thead, tr, ul, br, hr";

function escapePolicySearchText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafePolicySearchId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value);
}

function getPolicyHighlightName(instanceId: string): string {
  return `policy-search-match--${instanceId}`;
}

function escapePolicySearchRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildGraphemeBoundaries(text: string): Set<number> {
  const boundaries = new Set<number>([0, text.length]);
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    for (const segment of segmenter.segment(text)) {
      boundaries.add(segment.index);
      boundaries.add(segment.index + segment.segment.length);
    }
    return boundaries;
  }

  for (let offset = 0; offset < text.length; ) {
    const codePoint = text.codePointAt(offset) ?? 0;
    offset += codePoint > 0xffff ? 2 : 1;
    boundaries.add(offset);
  }
  return boundaries;
}

export function findPolicySearchMatches(text: string, query: string): PolicySearchMatches {
  const literal = query.trim();
  if (literal.length === 0 || literal.includes(TEXT_BOUNDARY)) {
    return { matches: [], truncated: false };
  }
  if (literal.length > MAX_QUERY_LENGTH) {
    throw new RangeError(`Search terms must be ${MAX_QUERY_LENGTH} characters or fewer`);
  }

  const pattern = new RegExp(escapePolicySearchRegExp(literal), "giu");
  const graphemeBoundaries = buildGraphemeBoundaries(text);
  const matches: PolicySearchMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const end = match.index + match[0].length;
    if (!graphemeBoundaries.has(match.index) || !graphemeBoundaries.has(end)) continue;
    if (matches.length === MAX_HIGHLIGHT_RANGES) {
      return { matches, truncated: true };
    }
    matches.push({ start: match.index, end });
  }
  return { matches, truncated: false };
}

function buildPolicyTextIndex(root: HTMLElement): { readonly text: string; readonly segments: readonly IndexedTextSegment[] } {
  let text = "";
  const segments: IndexedTextSegment[] = [];

  const appendBoundary = () => {
    if (text.length > 0 && !text.endsWith(TEXT_BOUNDARY)) text += TEXT_BOUNDARY;
  };

  const visit = (node: Node): void => {
    if (node.nodeType === 3) {
      const textNode = node as Text;
      const value = textNode.data;
      if (value.length === 0) return;
      const start = text.length;
      text += value;
      segments.push({ node: textNode, start, end: text.length });
      return;
    }
    if (node.nodeType !== 1) return;

    const element = node as HTMLElement;
    if (element.matches(EXCLUDED_CONTENT)) return;
    const isBoundary = element !== root && element.matches(BLOCK_CONTENT);
    if (isBoundary) appendBoundary();
    for (const child of Array.from(element.childNodes)) visit(child);
    if (isBoundary) appendBoundary();
  };

  if (!root.closest(EXCLUDED_CONTENT)) visit(root);
  return { text, segments };
}

function findStartSegment(segments: readonly IndexedTextSegment[], offset: number): IndexedTextSegment | null {
  return segments.find((segment) => offset >= segment.start && offset < segment.end) ?? null;
}

function findEndSegment(segments: readonly IndexedTextSegment[], offset: number): IndexedTextSegment | null {
  return segments.find((segment) => offset > segment.start && offset <= segment.end) ?? null;
}

export function renderPolicySearchControls(spec: PolicySearchControlsSpec): { readonly html: string; readonly css: string } {
  if (!spec || !isSafePolicySearchId(spec.instanceId) || !isSafePolicySearchId(spec.articleId)) {
    throw new Error("Search component and article IDs must be safe, unique HTML identifiers");
  }

  const inputId = `${spec.instanceId}--query`;
  const statusId = `${spec.instanceId}--status`;
  const highlightName = getPolicyHighlightName(spec.instanceId);
  const escapedInputId = escapePolicySearchText(inputId);
  const escapedStatusId = escapePolicySearchText(statusId);
  const escapedArticleId = escapePolicySearchText(spec.articleId);
  const html = [
    `<search class="policy-search" aria-label="Search this policy">`,
    `  <label class="policy-search__label" for="${escapedInputId}">Search policy text</label>`,
    `  <input id="${escapedInputId}" class="policy-search__input" type="search" autocomplete="off" aria-controls="${escapedArticleId}" />`,
    `  <p id="${escapedStatusId}" class="policy-search__status" role="status" aria-live="polite" aria-atomic="true">Enter a term to search this policy.</p>`,
    `</search>`,
  ].join("\n");
  const css = [
    ".policy-search {",
    "  display: grid;",
    "  gap: 0.5rem;",
    "  max-inline-size: 38rem;",
    "}",
    ".policy-search__input {",
    "  inline-size: 100%;",
    "  min-block-size: max(2.75rem, 44px);",
    "  font: inherit;",
    "}",
    ".policy-search__input:focus-visible {",
    "  outline: 3px solid Highlight;",
    "  outline-offset: 3px;",
    "}",
    ".policy-search__status {",
    "  min-block-size: 1.5em;",
    "}",
    `@supports selector(::highlight(${highlightName})) {`,
    `  :root::highlight(${highlightName}) {`,
    "    background-color: #ffe08a;",
    "    color: #241900;",
    "  }",
    "  @media (forced-colors: active) {",
    `    :root::highlight(${highlightName}) {`,
    "      background-color: Highlight;",
    "      color: HighlightText;",
    "    }",
    "  }",
    "}",
  ].join("\n");

  return { html, css };
}

export function attachPolicySearchHighlights(
  article: HTMLElement,
  input: HTMLInputElement,
  status: HTMLElement,
  instanceId: string,
): PolicySearchController {
  if (!isSafePolicySearchId(instanceId)) {
    throw new Error("instanceId must be a safe CSS and HTML identifier");
  }
  const document = article.ownerDocument;
  if (input.ownerDocument !== document || status.ownerDocument !== document) {
    throw new Error("Search controls and policy article must belong to the same document");
  }

  const runtime = document.defaultView as unknown as SearchHighlightRuntime | null;
  const registry = runtime?.CSS?.highlights;
  const HighlightConstructor = runtime?.Highlight;
  const highlightName = getPolicyHighlightName(instanceId);
  const selectorSupported = runtime?.CSS?.supports?.(`selector(::highlight(${highlightName}))`) === true;
  const canHighlight = Boolean(registry && HighlightConstructor && selectorSupported);
  if (canHighlight && registry?.has(highlightName)) {
    throw new Error(`A policy search highlight named '${highlightName}' is already registered`);
  }

  let registered = false;
  let disposed = false;
  const clearHighlight = () => {
    if (registered) registry?.delete(highlightName);
    registered = false;
  };
  const update = () => {
    if (disposed) return;
    const query = input.value.trim();
    if (query.length === 0) {
      clearHighlight();
      status.textContent = "Enter a term to search this policy.";
      return;
    }
    if (query.length > MAX_QUERY_LENGTH) {
      clearHighlight();
      status.textContent = `Use a search term of ${MAX_QUERY_LENGTH} characters or fewer.`;
      return;
    }

    const indexed = buildPolicyTextIndex(article);
    const { matches, truncated } = findPolicySearchMatches(indexed.text, query);
    if (!canHighlight || !registry || !HighlightConstructor) {
      const count = matches.length === 0 ? "No" : `${matches.length}${truncated ? "+" : ""}`;
      status.textContent = `${count} matching passages. Visual highlighting is unavailable in this browser.`;
      return;
    }

    const ranges: Range[] = [];
    for (const match of matches) {
      const start = findStartSegment(indexed.segments, match.start);
      const end = findEndSegment(indexed.segments, match.end);
      if (!start || !end) continue;
      const range = document.createRange();
      range.setStart(start.node, match.start - start.start);
      range.setEnd(end.node, match.end - end.start);
      ranges.push(range);
    }

    if (ranges.length === 0) {
      clearHighlight();
      status.textContent = "No matching passages.";
      return;
    }

    const highlight = new HighlightConstructor(...ranges);
    highlight.priority = 0;
    registry.set(highlightName, highlight);
    registered = true;
    status.textContent = truncated
      ? `More than ${ranges.length} matching passages found; highlighting the first ${ranges.length}.`
      : `Found ${ranges.length} matching ${ranges.length === 1 ? "passage" : "passages"}.`;
  };
  const onInput = () => update();

  input.addEventListener("input", onInput);
  update();

  return {
    refresh: update,
    dispose() {
      if (disposed) return;
      disposed = true;
      input.removeEventListener("input", onInput);
      clearHighlight();
      status.textContent = "";
    },
  };
}
