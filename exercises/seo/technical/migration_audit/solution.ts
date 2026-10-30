export type MigrationRedirectStatus = 301 | 302 | 307 | 308;

export interface MigrationRedirectRule {
  readonly sourceUrl: string;
  readonly destinationUrl: string;
  readonly status: MigrationRedirectStatus;
}

export interface MigrationDestinationSnapshot {
  readonly url: string;
  readonly status: number;
  readonly canonicalUrl: string | null;
  readonly robotsAllowed: boolean;
  readonly noindex: boolean;
}

export interface SeoMigrationAuditInput {
  readonly redirects: readonly MigrationRedirectRule[];
  readonly destinationSnapshots: readonly MigrationDestinationSnapshot[];
  readonly newSitemapUrls: readonly string[];
  readonly internalLinks: readonly string[];
  readonly allowedDestinationOrigins: readonly string[];
  readonly maxRecommendedHops?: number;
}

export interface SeoMigrationRedirectAudit {
  readonly sourceUrl: string;
  readonly immediateDestinationUrl: string;
  readonly recommendedDestinationUrl: string | null;
  readonly status: MigrationRedirectStatus;
  readonly chain: readonly string[];
  readonly hopCount: number;
  readonly findings: readonly string[];
}

export interface SeoMigrationAuditReport {
  readonly redirects: readonly SeoMigrationRedirectAudit[];
  readonly legacySitemapUrls: readonly string[];
  readonly internalRedirectLinks: readonly string[];
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeUrl(value: string, field: string): string {
  if (typeof value !== "string") throw new TypeError(`${field} must be a URL string`);
  const url = new URL(value);
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new TypeError(`${field} must be an absolute HTTP(S) URL without credentials`);
  }
  url.hash = "";
  return url.href;
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new TypeError("allowed destination origins must be HTTP(S) origins without credentials");
  }
  if (url.pathname !== "/" || url.search || url.hash) throw new TypeError("allowed destination entries must contain only an origin");
  return url.origin;
}

export function auditSeoMigration(input: SeoMigrationAuditInput): SeoMigrationAuditReport {
  if (!Array.isArray(input.redirects) || !Array.isArray(input.destinationSnapshots) ||
      !Array.isArray(input.newSitemapUrls) || !Array.isArray(input.internalLinks) ||
      !Array.isArray(input.allowedDestinationOrigins)) {
    throw new TypeError("migration collections must be arrays");
  }
  const maxRecommendedHops = input.maxRecommendedHops ?? 3;
  if (!Number.isSafeInteger(maxRecommendedHops) || maxRecommendedHops < 1) {
    throw new RangeError("maxRecommendedHops must be a positive safe integer");
  }

  const rules = new Map<string, { destinationUrl: string; status: MigrationRedirectStatus }>();
  for (const rule of input.redirects) {
    const sourceUrl = normalizeUrl(rule.sourceUrl, "sourceUrl");
    const destinationUrl = normalizeUrl(rule.destinationUrl, "destinationUrl");
    if (![301, 302, 307, 308].includes(rule.status)) throw new RangeError("redirect status must be 301, 302, 307, or 308");
    if (rules.has(sourceUrl)) throw new Error(`Duplicate redirect source: ${sourceUrl}`);
    rules.set(sourceUrl, { destinationUrl, status: rule.status });
  }

  const snapshots = new Map<string, MigrationDestinationSnapshot>();
  for (const snapshot of input.destinationSnapshots) {
    const url = normalizeUrl(snapshot.url, "destination snapshot URL");
    if (!Number.isInteger(snapshot.status) || snapshot.status < 100 || snapshot.status > 599) {
      throw new RangeError(`Invalid HTTP status for destination snapshot ${url}`);
    }
    if (typeof snapshot.robotsAllowed !== "boolean" || typeof snapshot.noindex !== "boolean") {
      throw new TypeError(`Destination snapshot for ${url} needs explicit robotsAllowed and noindex values`);
    }
    const canonicalUrl = snapshot.canonicalUrl === null ? null : normalizeUrl(snapshot.canonicalUrl, "canonicalUrl");
    if (snapshots.has(url)) throw new Error(`Duplicate destination snapshot: ${url}`);
    snapshots.set(url, { ...snapshot, url, canonicalUrl });
  }

  const sitemapUrls = new Set(input.newSitemapUrls.map((url) => normalizeUrl(url, "new sitemap URL")));
  const internalLinks = new Set(input.internalLinks.map((url) => normalizeUrl(url, "internal link URL")));
  const allowedOrigins = new Set(input.allowedDestinationOrigins.map(normalizeOrigin));
  const legacySitemapUrls = [...rules.keys()].filter((url) => sitemapUrls.has(url)).sort(compare);
  const internalRedirectLinks = [...rules.keys()].filter((url) => internalLinks.has(url)).sort(compare);

  const redirects = [...rules.entries()].sort(([left], [right]) => compare(left, right)).map(([sourceUrl, rule]): SeoMigrationRedirectAudit => {
    const findings = new Set<string>();
    if (rule.status === 302 || rule.status === 307) findings.add("TEMPORARY_REDIRECT_IN_PERMANENT_SITE_MIGRATION");
    if (sitemapUrls.has(sourceUrl)) findings.add("LEGACY_SOURCE_IN_NEW_SITEMAP");
    if (internalLinks.has(sourceUrl)) findings.add("INTERNAL_LINK_POINTS_TO_REDIRECT");

    const chain = [sourceUrl];
    const seen = new Set([sourceUrl]);
    let current = sourceUrl;
    let loopDetected = false;
    while (rules.has(current)) {
      const next = rules.get(current)!.destinationUrl;
      chain.push(next);
      if (seen.has(next)) {
        loopDetected = true;
        findings.add("REDIRECT_LOOP");
        break;
      }
      seen.add(next);
      current = next;
    }

    const hopCount = chain.length - 1;
    const recommendedDestinationUrl = loopDetected ? null : current;
    if (!loopDetected && hopCount > 1) {
      findings.add(hopCount > maxRecommendedHops ? "REDIRECT_CHAIN_EXCEEDS_RECOMMENDED_HOPS" : "REDIRECT_CHAIN_SHOULD_BE_COLLAPSED");
    }

    if (recommendedDestinationUrl) {
      const destination = new URL(recommendedDestinationUrl);
      if (!allowedOrigins.has(destination.origin)) findings.add("DESTINATION_ORIGIN_NOT_ALLOWLISTED");
      const snapshot = snapshots.get(recommendedDestinationUrl);
      if (!snapshot) {
        findings.add("FINAL_TARGET_NOT_AUDITED");
      } else {
        if (snapshot.status !== 200) findings.add("FINAL_TARGET_NOT_200");
        if (snapshot.canonicalUrl !== recommendedDestinationUrl) findings.add("FINAL_TARGET_NOT_SELF_CANONICAL");
        if (!snapshot.robotsAllowed) findings.add("FINAL_TARGET_CRAWL_BLOCKED");
        if (snapshot.noindex) findings.add("FINAL_TARGET_NOINDEX");
        if (!sitemapUrls.has(recommendedDestinationUrl)) findings.add("FINAL_URL_MISSING_FROM_NEW_SITEMAP");
      }
    }

    return {
      sourceUrl,
      immediateDestinationUrl: rule.destinationUrl,
      recommendedDestinationUrl,
      status: rule.status,
      chain,
      hopCount,
      findings: [...findings].sort(compare),
    };
  });

  return { redirects, legacySitemapUrls, internalRedirectLinks };
}
