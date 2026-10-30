export type UnwantedFacetStrategy = "canonical" | "robots-disallow" | "noindex";

export interface FacetedNavigationInput {
  readonly baseUrl: string;
  readonly url: string;
  readonly facetValues: Readonly<Record<string, readonly string[]>>;
  readonly indexableCombinations?: readonly Readonly<Record<string, readonly string[]>>[];
  readonly unwantedFacetStrategy: UnwantedFacetStrategy;
  readonly resultCount: number;
  readonly ignoredParameters?: readonly string[];
}

export interface FacetedNavigationDecision {
  readonly decision: "index" | "canonicalize" | "robots-disallow" | "noindex" | "not-found" | "review";
  readonly httpStatus: 200 | 404 | null;
  readonly requestedUrl: string;
  readonly normalizedUrl: string | null;
  readonly canonicalUrl: string | null;
  readonly crawlAllowed: boolean | null;
  readonly robotsMeta: "index,follow" | "noindex,follow" | null;
  readonly includeInSitemap: boolean;
  readonly nofollowFacetLinks: boolean;
  readonly robotsDisallowParameters: readonly string[];
  readonly potentialUrlCount: number;
  readonly reason: string;
}

const DEFAULT_IGNORED_PARAMETERS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "sort", "order", "view",
] as const;

const MAX_URL_STATES = Number.MAX_SAFE_INTEGER;

function estimateUrlStates(facetValues: Readonly<Record<string, readonly string[]>>): number {
  // Count every possible value subset as an upper bound, then saturate safely.
  let total = 1;
  for (const values of Object.values(facetValues)) {
    if (values.length >= 53) return MAX_URL_STATES;
    const statesForFacet = 2 ** values.length;
    if (total > MAX_URL_STATES / statesForFacet) return MAX_URL_STATES;
    total *= statesForFacet;
  }
  return total;
}

export function auditFacetedNavigation(input: FacetedNavigationInput): FacetedNavigationDecision {
  if (!input || typeof input !== "object") throw new TypeError("input must be an object");
  if (typeof input.baseUrl !== "string" || typeof input.url !== "string") {
    throw new TypeError("baseUrl and url must be strings");
  }
  if (!Number.isSafeInteger(input.resultCount) || input.resultCount < 0) {
    throw new RangeError("resultCount must be a non-negative safe integer");
  }
  if (!["canonical", "robots-disallow", "noindex"].includes(input.unwantedFacetStrategy)) {
    throw new TypeError(`Unsupported unwanted facet strategy: ${input.unwantedFacetStrategy}`);
  }
  if (!input.facetValues || typeof input.facetValues !== "object" || Array.isArray(input.facetValues)) {
    throw new TypeError("facetValues must be a record of allowed values");
  }

  const base = new URL(input.baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) {
    throw new TypeError("baseUrl must be a clean absolute HTTPS category URL");
  }
  const facetNames = Object.keys(input.facetValues);
  const allowedValues = new Map<string, readonly string[]>();
  for (const name of facetNames) {
    const values = input.facetValues[name];
    if (!/^[a-z][a-z0-9_-]*$/.test(name) || !Array.isArray(values) || values.length === 0) {
      throw new TypeError(`Invalid facet definition: ${name}`);
    }
    if (values.some((value) => typeof value !== "string" || value.length === 0) || new Set(values).size !== values.length) {
      throw new TypeError(`Facet values must be unique non-empty strings: ${name}`);
    }
    allowedValues.set(name, values);
  }

  const ignoredParameters = input.ignoredParameters ?? DEFAULT_IGNORED_PARAMETERS;
  if (!Array.isArray(ignoredParameters) || ignoredParameters.some((name) => typeof name !== "string" || name.length === 0)) {
    throw new TypeError("ignoredParameters must be non-empty strings");
  }
  const ignored = new Set(ignoredParameters.map((name) => name.toLowerCase()));
  if (facetNames.some((name) => ignored.has(name.toLowerCase()))) {
    throw new TypeError("A parameter cannot be both an indexable facet and ignored");
  }

  const potentialUrlCount = estimateUrlStates(input.facetValues);
  const requested = new URL(input.url, base);
  const requestedUrl = requested.href;
  const emptyDecision = (
    decision: FacetedNavigationDecision["decision"],
    reason: string,
    httpStatus: FacetedNavigationDecision["httpStatus"] = null,
  ): FacetedNavigationDecision => ({
    decision,
    httpStatus,
    requestedUrl,
    normalizedUrl: null,
    canonicalUrl: null,
    crawlAllowed: null,
    robotsMeta: null,
    includeInSitemap: false,
    nofollowFacetLinks: false,
    robotsDisallowParameters: [],
    potentialUrlCount,
    reason,
  });

  if (requested.origin !== base.origin || requested.pathname !== base.pathname || requested.username || requested.password) {
    return emptyDecision("review", "URL is outside the configured category route");
  }
  if (input.resultCount === 0) {
    return emptyDecision("not-found", "Empty or invalid combinations return 404 at the requested URL", 404);
  }

  const selected = new Map<string, string[]>();
  for (const [name, value] of requested.searchParams) {
    if (ignored.has(name.toLowerCase())) continue;
    const values = allowedValues.get(name);
    if (!values) return emptyDecision("review", `Unclassified query parameter requires policy review: ${name}`);
    if (!values.includes(value)) {
      return emptyDecision("not-found", `Unsupported value for facet ${name} returns 404 at the requested URL`, 404);
    }
    const current = selected.get(name) ?? [];
    if (current.includes(value)) {
      return emptyDecision("not-found", `Duplicate value for facet ${name} returns 404 at the requested URL`, 404);
    }
    current.push(value);
    selected.set(name, current);
  }

  const normalized = new URL(base.pathname, base.origin);
  const orderedSelection = new Map<string, string[]>();
  for (const name of facetNames) {
    const chosen = selected.get(name);
    if (!chosen) continue;
    const order = allowedValues.get(name)!;
    const sorted = order.filter((value) => chosen.includes(value));
    orderedSelection.set(name, sorted);
    for (const value of sorted) normalized.searchParams.append(name, value);
  }
  const normalizedUrl = normalized.href;
  const facetKey = (selection: ReadonlyMap<string, readonly string[]>): string => JSON.stringify(
    facetNames.filter((name) => selection.has(name)).map((name) => [name, selection.get(name)]),
  );

  const indexableKeys = new Set<string>();
  for (const combination of input.indexableCombinations ?? []) {
    if (!combination || typeof combination !== "object" || Array.isArray(combination)) {
      throw new TypeError("indexableCombinations entries must be facet records");
    }
    const candidate = new Map<string, string[]>();
    for (const [name, chosen] of Object.entries(combination)) {
      const values = allowedValues.get(name);
      if (!values || !Array.isArray(chosen) || chosen.length === 0 || chosen.some((value) => !values.includes(value))) {
        throw new TypeError(`Invalid curated facet combination: ${name}`);
      }
      if (new Set(chosen).size !== chosen.length) throw new TypeError(`Duplicate curated facet value: ${name}`);
      candidate.set(name, values.filter((value) => chosen.includes(value)));
    }
    indexableKeys.add(facetKey(candidate));
  }

  const isCurated = orderedSelection.size === 0 || indexableKeys.has(facetKey(orderedSelection));
  if (isCurated) {
    return {
      decision: "index",
      httpStatus: 200,
      requestedUrl,
      normalizedUrl,
      canonicalUrl: normalizedUrl,
      crawlAllowed: true,
      robotsMeta: "index,follow",
      includeInSitemap: true,
      nofollowFacetLinks: false,
      robotsDisallowParameters: [],
      potentialUrlCount,
      reason: orderedSelection.size === 0 ? "base-category-page" : "curated-indexable-facet-landing-page",
    };
  }

  if (input.unwantedFacetStrategy === "canonical") {
    return {
      decision: "canonicalize",
      httpStatus: 200,
      requestedUrl,
      normalizedUrl,
      canonicalUrl: base.href,
      crawlAllowed: true,
      robotsMeta: "index,follow",
      includeInSitemap: false,
      nofollowFacetLinks: false,
      robotsDisallowParameters: [],
      potentialUrlCount,
      reason: "Uncurated facets share the base category canonical; this is a hint, not a directive",
    };
  }

  if (input.unwantedFacetStrategy === "robots-disallow") {
    return {
      decision: "robots-disallow",
      httpStatus: 200,
      requestedUrl,
      normalizedUrl,
      canonicalUrl: null,
      crawlAllowed: false,
      robotsMeta: null,
      includeInSitemap: false,
      nofollowFacetLinks: true,
      robotsDisallowParameters: [...orderedSelection.keys()],
      potentialUrlCount,
      reason: "Apply crawl blocking to unwanted facet parameters; a blocked page cannot expose a noindex rule",
    };
  }

  return {
    decision: "noindex",
    httpStatus: 200,
    requestedUrl,
    normalizedUrl,
    canonicalUrl: null,
    crawlAllowed: true,
    robotsMeta: "noindex,follow",
    includeInSitemap: false,
    nofollowFacetLinks: false,
    robotsDisallowParameters: [],
    potentialUrlCount,
    reason: "Keep the page crawlable so the crawler can observe noindex; do not also block it in robots.txt",
  };
}
