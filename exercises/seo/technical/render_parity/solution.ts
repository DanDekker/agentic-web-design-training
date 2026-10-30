export interface SeoDocumentSignals {
  readonly title: string | null;
  readonly canonicalUrl: string | null;
  readonly robotsDirectives: readonly string[];
  readonly hreflang: readonly { readonly language: string; readonly url: string }[];
  readonly jsonLdEntityIds: readonly string[];
  readonly primaryContentText: string;
}

export interface RenderedSeoPageSnapshot {
  readonly url: string;
  readonly status: number;
  readonly contentType: string;
  readonly robotsAllowed: boolean;
  readonly blockedResources: readonly string[];
  readonly source: SeoDocumentSignals | null;
  readonly rendered: SeoDocumentSignals | null;
  readonly expectedContentMarkers?: readonly string[];
}

export interface RenderedSeoParityInput {
  readonly snapshots: readonly RenderedSeoPageSnapshot[];
}

export interface RenderedSeoPageReport {
  readonly url: string;
  readonly disposition: "AUDITED" | "CRAWL_BLOCKED" | "HTTP_NON_OK" | "NON_HTML";
  readonly findings: readonly string[];
  readonly blockedResources: readonly string[];
  readonly missingRenderedContentMarkers: readonly string[];
  readonly sourceOnlyEntityIds: readonly string[];
  readonly renderedOnlyEntityIds: readonly string[];
}

export interface RenderedSeoParityReport {
  readonly pages: readonly RenderedSeoPageReport[];
  readonly findingCounts: Readonly<Record<string, number>>;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeHttpUrl(value: string, field: string): string {
  const url = new URL(value);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new TypeError(`${field} must be an absolute HTTP(S) URL without credentials`);
  }
  url.hash = "";
  return url.href;
}

function normalizedText(value: string | null, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new TypeError(`${field} must be a string or null`);
  return value.normalize("NFC").trim().replace(/\s+/gu, " ");
}

function normalizedTokens(values: readonly string[], field: string): Set<string> {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
    throw new TypeError(`${field} must be an array of strings`);
  }
  return new Set(values.flatMap((value) => value.toLowerCase().split(/[\s,]+/u)).filter(Boolean));
}

function normalizedIds(values: readonly string[], field: string): Set<string> {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value.trim())) {
    throw new TypeError(`${field} must contain nonempty strings`);
  }
  return new Set(values.map((value) => value.trim().normalize("NFC")));
}

function normalizedHreflang(
  links: readonly { readonly language: string; readonly url: string }[],
  field: string,
): Set<string> {
  if (!Array.isArray(links)) throw new TypeError(`${field} must be an array`);
  const byLanguage = new Map<string, string>();
  for (const link of links) {
    const language = link.language.trim().toLowerCase();
    if (!/^(?:[a-z]{2,3}(?:-[a-z0-9]{2,8})*|x-default)$/i.test(language)) {
      throw new TypeError(`${field} contains invalid hreflang: ${link.language}`);
    }
    if (byLanguage.has(language)) throw new Error(`${field} contains duplicate hreflang language: ${language}`);
    byLanguage.set(language, normalizeHttpUrl(link.url, `${field} URL`));
  }
  return new Set([...byLanguage].map(([language, url]) => `${language}\u0000${url}`));
}

function difference(left: ReadonlySet<string>, right: ReadonlySet<string>): string[] {
  return [...left].filter((value) => !right.has(value)).sort(compare);
}

function normalizedState(state: SeoDocumentSignals, field: string) {
  if (!state || typeof state !== "object") throw new TypeError(`${field} signals are required for an auditable page`);
  if (typeof state.primaryContentText !== "string") throw new TypeError(`${field}.primaryContentText must be a string`);
  return {
    title: normalizedText(state.title, `${field}.title`),
    canonicalUrl: state.canonicalUrl === null ? null : normalizeHttpUrl(state.canonicalUrl, `${field}.canonicalUrl`),
    robotsDirectives: normalizedTokens(state.robotsDirectives, `${field}.robotsDirectives`),
    hreflang: normalizedHreflang(state.hreflang, `${field}.hreflang`),
    jsonLdEntityIds: normalizedIds(state.jsonLdEntityIds, `${field}.jsonLdEntityIds`),
    primaryContentText: state.primaryContentText.normalize("NFC").trim().replace(/\s+/gu, " "),
  };
}

export function auditRenderedSeoParity(input: RenderedSeoParityInput): RenderedSeoParityReport {
  if (!Array.isArray(input.snapshots)) throw new TypeError("snapshots must be an array");
  const seenUrls = new Set<string>();
  const pages = input.snapshots.map((snapshot): RenderedSeoPageReport => {
    const url = normalizeHttpUrl(snapshot.url, "snapshot URL");
    if (seenUrls.has(url)) throw new Error(`Duplicate page snapshot: ${url}`);
    seenUrls.add(url);
    if (!Number.isInteger(snapshot.status) || snapshot.status < 100 || snapshot.status > 599) {
      throw new RangeError(`Invalid HTTP status for ${url}`);
    }
    if (typeof snapshot.robotsAllowed !== "boolean") throw new TypeError(`robotsAllowed must be boolean for ${url}`);

    const findings = new Set<string>();
    const empty = { blockedResources: [] as string[], missingRenderedContentMarkers: [] as string[], sourceOnlyEntityIds: [] as string[], renderedOnlyEntityIds: [] as string[] };
    if (!snapshot.robotsAllowed) {
      findings.add("RENDER_STATE_UNOBSERVABLE_WHILE_CRAWL_BLOCKED");
      return { url, disposition: "CRAWL_BLOCKED", findings: [...findings], ...empty };
    }
    if (snapshot.status !== 200) {
      findings.add("HTTP_STATUS_NOT_200");
      return { url, disposition: "HTTP_NON_OK", findings: [...findings], ...empty };
    }
    if (typeof snapshot.contentType !== "string") throw new TypeError(`contentType must be a string for ${url}`);
    const contentType = snapshot.contentType.trim().toLowerCase().split(";", 1)[0];
    if (contentType !== "text/html" && contentType !== "application/xhtml+xml") {
      findings.add("NON_HTML_RESOURCE");
      return { url, disposition: "NON_HTML", findings: [...findings], ...empty };
    }
    if (!Array.isArray(snapshot.blockedResources) || snapshot.blockedResources.some((resource) => typeof resource !== "string")) {
      throw new TypeError(`blockedResources must be an array of strings for ${url}`);
    }
    if (!Array.isArray(snapshot.expectedContentMarkers) && snapshot.expectedContentMarkers !== undefined) {
      throw new TypeError(`expectedContentMarkers must be an array for ${url}`);
    }
    const source = normalizedState(snapshot.source!, "source");
    const rendered = normalizedState(snapshot.rendered!, "rendered");
    const expectedMarkers = snapshot.expectedContentMarkers ?? [];
    if (expectedMarkers.some((marker) => typeof marker !== "string" || !marker.trim())) {
      throw new TypeError(`expectedContentMarkers must contain nonempty strings for ${url}`);
    }
    const blockedResources = [...new Set(snapshot.blockedResources.map((resource) => resource.trim()).filter(Boolean))].sort(compare);
    if (blockedResources.length > 0) findings.add("RENDER_DEPENDENCIES_BLOCKED_OR_UNAVAILABLE");

    if (!rendered.title) findings.add("TITLE_MISSING_AFTER_RENDER");
    else if (source.title !== rendered.title) findings.add("TITLE_CHANGED_DURING_RENDER");
    if (!rendered.canonicalUrl) findings.add("CANONICAL_MISSING_AFTER_RENDER");
    if (source.canonicalUrl !== rendered.canonicalUrl) findings.add("CANONICAL_CHANGED_DURING_RENDER");
    if (rendered.canonicalUrl !== null && rendered.canonicalUrl !== url) findings.add("RENDERED_CANONICAL_DIFFERS_FROM_REQUESTED_URL");

    const sourceNoindex = source.robotsDirectives.has("noindex");
    const renderedNoindex = rendered.robotsDirectives.has("noindex");
    if (difference(source.robotsDirectives, rendered.robotsDirectives).length > 0 ||
        difference(rendered.robotsDirectives, source.robotsDirectives).length > 0) {
      findings.add("ROBOTS_DIRECTIVE_SET_CHANGED_DURING_RENDER");
    }
    if (!sourceNoindex && renderedNoindex) findings.add("NOINDEX_ADDED_DURING_RENDER");
    if (sourceNoindex && !renderedNoindex) findings.add("NOINDEX_REMOVED_DURING_RENDER");

    if (difference(source.hreflang, rendered.hreflang).length > 0 || difference(rendered.hreflang, source.hreflang).length > 0) {
      findings.add("HREFLANG_SET_CHANGED_DURING_RENDER");
    }
    const sourceOnlyEntityIds = difference(source.jsonLdEntityIds, rendered.jsonLdEntityIds);
    const renderedOnlyEntityIds = difference(rendered.jsonLdEntityIds, source.jsonLdEntityIds);
    if (sourceOnlyEntityIds.length > 0 || renderedOnlyEntityIds.length > 0) findings.add("JSONLD_ENTITY_IDS_CHANGED_DURING_RENDER");

    if (!rendered.primaryContentText) findings.add("PRIMARY_CONTENT_MISSING_AFTER_RENDER");
    if (!source.primaryContentText && rendered.primaryContentText) findings.add("PRIMARY_CONTENT_ONLY_IN_RENDERED_OUTPUT");
    const missingRenderedContentMarkers = [...new Set(expectedMarkers
      .map((marker) => marker.normalize("NFC").trim().replace(/\s+/gu, " "))
      .filter((marker) => !rendered.primaryContentText.includes(marker)))]
      .sort(compare);
    if (missingRenderedContentMarkers.length > 0) findings.add("EXPECTED_CONTENT_MARKER_MISSING_AFTER_RENDER");

    return {
      url,
      disposition: "AUDITED",
      findings: [...findings].sort(compare),
      blockedResources,
      missingRenderedContentMarkers,
      sourceOnlyEntityIds,
      renderedOnlyEntityIds,
    };
  }).sort((a, b) => compare(a.url, b.url));

  const findingCounts: Record<string, number> = {};
  for (const page of pages) {
    for (const finding of page.findings) findingCounts[finding] = (findingCounts[finding] ?? 0) + 1;
  }
  const sortedFindingCounts = Object.fromEntries(Object.entries(findingCounts).sort(([left], [right]) => compare(left, right)));
  return { pages, findingCounts: sortedFindingCounts };
}
