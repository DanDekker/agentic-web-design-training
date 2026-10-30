export interface SearchRobotsMeta {
  readonly name: string;
  readonly content: string;
}

export interface IndexabilitySignalsInput {
  readonly url: string;
  readonly status: number;
  readonly robotsAllowed: boolean;
  readonly contentType: string;
  readonly inSitemap: boolean;
  readonly metaRobots?: readonly SearchRobotsMeta[];
  readonly xRobotsTags?: readonly string[];
  readonly canonicalUrl?: string | null;
  readonly redirectUrl?: string | null;
}

export type IndexabilityDisposition =
  | "CRAWL_BLOCKED"
  | "REDIRECT"
  | "NOT_MODIFIED"
  | "HTTP_ERROR"
  | "NOINDEX"
  | "NO_RESTRICTIVE_DIRECTIVE";

export interface IndexabilityReport {
  readonly url: string;
  readonly status: number;
  readonly disposition: IndexabilityDisposition;
  readonly rulesObserved: boolean;
  readonly directives: readonly string[];
  readonly canonicalHintUrl: string | null;
  readonly redirectTarget: string | null;
  readonly findings: readonly string[];
}

function tokenizeRobotsContent(value: string): string[] {
  return value
    .toLowerCase()
    .split(",")
    .map((token) => token.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function applicableHeaderTokens(headers: readonly string[] = []): string[] {
  const tokens: string[] = [];
  for (const header of headers) {
    let value = header.trim().replace(/^x-robots-tag\s*:\s*/i, "");
    const userAgent = value.match(/^([a-z][a-z0-9_-]*)\s*:\s*(.*)$/i);
    if (userAgent && /(?:bot|robots)/i.test(userAgent[1])) {
      const name = userAgent[1].toLowerCase();
      if (name !== "googlebot" && name !== "robots") continue;
      value = userAgent[2];
    }
    tokens.push(...tokenizeRobotsContent(value));
  }
  return tokens;
}

function collectGooglebotDirectives(input: IndexabilitySignalsInput): string[] {
  const isHtml = input.contentType.split(";")[0]?.trim().toLowerCase() === "text/html";
  const metaTokens = isHtml
    ? (input.metaRobots ?? [])
        .filter((meta) => ["robots", "googlebot"].includes(meta.name.trim().toLowerCase()))
        .flatMap((meta) => tokenizeRobotsContent(meta.content))
    : [];
  return [...new Set([...metaTokens, ...applicableHeaderTokens(input.xRobotsTags)])].sort();
}

function normalizeUrl(value: string, base?: string): string {
  const url = base ? new URL(value, base) : new URL(value);
  url.hash = "";
  return url.href;
}

export function reconcileGooglebotIndexability(input: IndexabilitySignalsInput): IndexabilityReport {
  if (!Number.isInteger(input.status) || input.status < 100 || input.status > 599) {
    throw new RangeError("status must be an integer HTTP status between 100 and 599");
  }

  const requestUrl = normalizeUrl(input.url);
  const findings: string[] = [];
  const configuredDirectives = collectGooglebotDirectives(input);
  const hasConfiguredNoindex = configuredDirectives.some((rule) => rule === "noindex" || rule === "none");

  let canonicalHintUrl: string | null = null;
  if (input.canonicalUrl) canonicalHintUrl = normalizeUrl(input.canonicalUrl, requestUrl);

  if (!input.robotsAllowed) {
    findings.push("ROBOTS_BLOCKED_CRAWL");
    if (hasConfiguredNoindex) findings.push("NOINDEX_NOT_OBSERVABLE_WHILE_CRAWL_BLOCKED");
    if (input.inSitemap) findings.push("SITEMAP_CONTAINS_CRAWL_BLOCKED_URL");
    return {
      url: requestUrl,
      status: input.status,
      disposition: "CRAWL_BLOCKED",
      rulesObserved: false,
      directives: [],
      canonicalHintUrl: null,
      redirectTarget: null,
      findings,
    };
  }

  if (input.status === 304) {
    return {
      url: requestUrl,
      status: input.status,
      disposition: "NOT_MODIFIED",
      rulesObserved: false,
      directives: [],
      canonicalHintUrl: null,
      redirectTarget: null,
      findings: ["CACHED_RESPONSE_HAS_NO_NEW_REPRESENTATION"],
    };
  }

  if (input.status >= 300 && input.status < 400) {
    const redirectTarget = input.redirectUrl ? normalizeUrl(input.redirectUrl, requestUrl) : null;
    findings.push(redirectTarget ? "REDIRECT_TO_TARGET" : "REDIRECT_TARGET_MISSING");
    if (input.inSitemap) findings.push("SITEMAP_CONTAINS_REDIRECT_URL");
    return {
      url: requestUrl,
      status: input.status,
      disposition: "REDIRECT",
      rulesObserved: false,
      directives: [],
      canonicalHintUrl: null,
      redirectTarget,
      findings,
    };
  }

  if (input.status < 200 || input.status >= 400) {
    if (input.inSitemap) findings.push("SITEMAP_CONTAINS_HTTP_ERROR");
    return {
      url: requestUrl,
      status: input.status,
      disposition: "HTTP_ERROR",
      rulesObserved: false,
      directives: [],
      canonicalHintUrl: null,
      redirectTarget: null,
      findings: ["HTTP_RESPONSE_IS_NOT_A_SUCCESSFUL_PAGE", ...findings],
    };
  }

  const directives = configuredDirectives;
  const noindex = directives.some((rule) => rule === "noindex" || rule === "none");
  const disposition: IndexabilityDisposition = noindex ? "NOINDEX" : "NO_RESTRICTIVE_DIRECTIVE";
  if (noindex) findings.push("SEARCH_ENGINE_NOINDEX_RULE");

  if (canonicalHintUrl && canonicalHintUrl !== requestUrl) {
    findings.push("CANONICAL_HINT_POINTS_TO_OTHER_URL");
    if (input.inSitemap) findings.push("SITEMAP_ENTRY_IS_NOT_THE_CANONICAL_URL");
  }
  if (noindex && canonicalHintUrl) findings.push("CANONICAL_AND_NOINDEX_SIGNALS_NEED_REVIEW");
  if (input.inSitemap && noindex) findings.push("SITEMAP_CONTAINS_NOINDEX_URL");
  if (input.inSitemap && !noindex) findings.push("SITEMAP_URL_HAS_NO_NOINDEX_RULE");

  return {
    url: requestUrl,
    status: input.status,
    disposition,
    rulesObserved: true,
    directives,
    canonicalHintUrl,
    redirectTarget: null,
    findings,
  };
}
