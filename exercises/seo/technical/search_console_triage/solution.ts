export type SearchDevice = "DESKTOP" | "MOBILE" | "TABLET";

export interface SearchConsolePageRow {
  readonly query: string;
  readonly pageUrl: string;
  readonly country: string;
  readonly device: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly averagePosition: number | null;
}

export interface PositionCtrBaseline {
  readonly country: string;
  readonly device: string;
  readonly minPosition: number;
  readonly maxPosition: number;
  readonly ctr: number;
}

export interface SearchConsoleTriageInput {
  readonly rows: readonly SearchConsolePageRow[];
  readonly baselines: readonly PositionCtrBaseline[];
  readonly minImpressions?: number;
  readonly minCtrGap?: number;
}

export interface SearchConsolePageOpportunity {
  readonly query: string;
  readonly pageUrl: string;
  readonly country: string;
  readonly device: SearchDevice;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr: number | null;
  readonly averagePosition: number | null;
  readonly benchmarkCtr: number | null;
  readonly ctrGap: number | null;
  readonly isCtrOpportunity: boolean;
}

export interface MultiPageQueryReview {
  readonly query: string;
  readonly country: string;
  readonly device: SearchDevice;
  readonly reason: "MULTIPLE_PAGES_FOR_QUERY_COHORT";
  readonly pages: readonly { readonly pageUrl: string; readonly clicks: number; readonly impressions: number }[];
}

export interface SearchConsoleTriageReport {
  readonly pages: readonly SearchConsolePageOpportunity[];
  readonly multiPageQueryReviews: readonly MultiPageQueryReview[];
}

interface MutablePageMetrics {
  query: string;
  pageUrl: string;
  country: string;
  device: SearchDevice;
  clicks: number;
  impressions: number;
  averagePosition: number | null;
}

interface NormalizedBaseline {
  country: string;
  device: SearchDevice;
  minPosition: number;
  maxPosition: number;
  ctr: number;
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function tupleKey(parts: readonly string[]): string {
  return JSON.stringify(parts);
}

function normalizeQuery(query: string): string {
  if (typeof query !== "string") throw new TypeError("query must be a string");
  const normalized = query.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase();
  if (!normalized) throw new TypeError("query must not be empty");
  return normalized;
}

function normalizeCountry(country: string): string {
  if (typeof country !== "string") throw new TypeError("country must be a string");
  const normalized = country.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new TypeError(`country must be a three-letter ISO code: ${country}`);
  return normalized;
}

function normalizeDevice(device: string): SearchDevice {
  if (typeof device !== "string") throw new TypeError("device must be a string");
  const normalized = device.trim().toUpperCase();
  if (normalized !== "DESKTOP" && normalized !== "MOBILE" && normalized !== "TABLET") {
    throw new TypeError(`Unsupported Search Console device: ${device}`);
  }
  return normalized;
}

function normalizePageUrl(pageUrl: string): string {
  if (typeof pageUrl !== "string") throw new TypeError("pageUrl must be a string");
  const url = new URL(pageUrl);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new TypeError("pageUrl must be an absolute HTTP(S) URL without credentials");
  }
  url.hash = "";
  return url.href;
}

function validateCount(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${field} must be a nonnegative safe integer`);
}

function normalizeBaselines(baselines: readonly PositionCtrBaseline[]): NormalizedBaseline[] {
  const normalized = baselines.map((baseline) => {
    const minPosition = baseline.minPosition;
    const maxPosition = baseline.maxPosition;
    if (!Number.isFinite(minPosition) || minPosition < 1 || !Number.isFinite(maxPosition) || maxPosition < minPosition) {
      throw new RangeError("CTR baseline position bands must be finite, positive, and ordered");
    }
    if (!Number.isFinite(baseline.ctr) || baseline.ctr < 0 || baseline.ctr > 1) {
      throw new RangeError("CTR baseline ctr must be between zero and one");
    }
    return {
      country: normalizeCountry(baseline.country),
      device: normalizeDevice(baseline.device),
      minPosition,
      maxPosition,
      ctr: baseline.ctr,
    };
  }).sort((a, b) => compareStrings(a.country, b.country) || compareStrings(a.device, b.device) || a.minPosition - b.minPosition);

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (previous.country === current.country && previous.device === current.device && current.minPosition <= previous.maxPosition) {
      throw new Error(`Overlapping CTR baseline bands for ${current.country}/${current.device}`);
    }
  }
  return normalized;
}

function findBaseline(
  baselines: readonly NormalizedBaseline[],
  country: string,
  device: SearchDevice,
  averagePosition: number | null,
): number | null {
  if (averagePosition === null) return null;
  const match = baselines.find((baseline) =>
    baseline.country === country && baseline.device === device &&
    averagePosition >= baseline.minPosition && averagePosition <= baseline.maxPosition,
  );
  return match?.ctr ?? null;
}

export function analyzeSearchConsolePages(input: SearchConsoleTriageInput): SearchConsoleTriageReport {
  if (!Array.isArray(input.rows) || !Array.isArray(input.baselines)) {
    throw new TypeError("rows and baselines must be arrays");
  }
  const minImpressions = input.minImpressions ?? 100;
  const minCtrGap = input.minCtrGap ?? 0.03;
  if (!Number.isSafeInteger(minImpressions) || minImpressions < 1) {
    throw new RangeError("minImpressions must be a positive safe integer");
  }
  if (!Number.isFinite(minCtrGap) || minCtrGap < 0 || minCtrGap > 1) {
    throw new RangeError("minCtrGap must be between zero and one");
  }

  const baselines = normalizeBaselines(input.baselines);
  const pageMetrics = new Map<string, MutablePageMetrics>();
  for (const row of input.rows) {
    const query = normalizeQuery(row.query);
    const pageUrl = normalizePageUrl(row.pageUrl);
    const country = normalizeCountry(row.country);
    const device = normalizeDevice(row.device);
    validateCount(row.clicks, "clicks");
    validateCount(row.impressions, "impressions");
    if (row.clicks > row.impressions) throw new RangeError("clicks cannot exceed impressions");
    if (row.averagePosition !== null && (!Number.isFinite(row.averagePosition) || row.averagePosition < 1)) {
      throw new RangeError("averagePosition must be null or a finite value of at least one");
    }
    if (row.impressions > 0 && row.averagePosition === null) {
      throw new RangeError("averagePosition is required when impressions are positive");
    }

    const key = tupleKey([query, pageUrl, country, device]);
    const existing = pageMetrics.get(key);
    if (!existing) {
      pageMetrics.set(key, {
        query,
        pageUrl,
        country,
        device,
        clicks: row.clicks,
        impressions: row.impressions,
        averagePosition: row.impressions > 0 ? row.averagePosition : null,
      });
      continue;
    }

    const nextImpressions = existing.impressions + row.impressions;
    if (!Number.isSafeInteger(nextImpressions)) throw new RangeError("aggregated impressions exceed the safe integer range");
    const nextClicks = existing.clicks + row.clicks;
    if (!Number.isSafeInteger(nextClicks)) throw new RangeError("aggregated clicks exceed the safe integer range");
    if (row.impressions > 0) {
      const oldWeight = existing.impressions;
      existing.averagePosition = oldWeight === 0
        ? row.averagePosition
        : existing.averagePosition! + (row.averagePosition! - existing.averagePosition!) * (row.impressions / nextImpressions);
    }
    existing.clicks = nextClicks;
    existing.impressions = nextImpressions;
  }

  const pages = [...pageMetrics.values()].map((metric): SearchConsolePageOpportunity => {
    const ctr = metric.impressions === 0 ? null : metric.clicks / metric.impressions;
    const benchmarkCtr = findBaseline(baselines, metric.country, metric.device, metric.averagePosition);
    const ctrGap = ctr === null || benchmarkCtr === null ? null : benchmarkCtr - ctr;
    return {
      ...metric,
      ctr,
      benchmarkCtr,
      ctrGap,
      isCtrOpportunity: benchmarkCtr !== null && ctrGap !== null && metric.impressions >= minImpressions && ctrGap >= minCtrGap,
    };
  }).sort((a, b) =>
    compareStrings(a.query, b.query) || compareStrings(a.country, b.country) ||
    compareStrings(a.device, b.device) || compareStrings(a.pageUrl, b.pageUrl),
  );

  const queryPages = new Map<string, SearchConsolePageOpportunity[]>();
  for (const page of pages) {
    const key = tupleKey([page.query, page.country, page.device]);
    const group = queryPages.get(key) ?? [];
    group.push(page);
    queryPages.set(key, group);
  }
  const multiPageQueryReviews = [...queryPages.values()]
    .filter((group) => new Set(group.map((page) => page.pageUrl)).size > 1)
    .map((group): MultiPageQueryReview => ({
      query: group[0].query,
      country: group[0].country,
      device: group[0].device,
      reason: "MULTIPLE_PAGES_FOR_QUERY_COHORT",
      pages: group.map(({ pageUrl, clicks, impressions }) => ({ pageUrl, clicks, impressions })),
    }))
    .sort((a, b) => compareStrings(a.query, b.query) || compareStrings(a.country, b.country) || compareStrings(a.device, b.device));

  return { pages, multiPageQueryReviews };
}
