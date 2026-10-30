export interface SitemapAlternate {
  readonly language: string;
  readonly url: string;
}

export interface LocalizedSitemapPage {
  readonly clusterId: string;
  readonly canonicalUrl: string;
  readonly lastModified?: string;
  readonly alternates: readonly SitemapAlternate[];
}

export interface LocalizedSitemapInput {
  readonly sitemapBaseUrl: string;
  readonly pages: readonly LocalizedSitemapPage[];
  readonly maxUrlsPerFile?: number;
  readonly maxBytesPerFile?: number;
}

export interface SitemapFile {
  readonly url: string;
  readonly xml: string;
  readonly entryCount: number;
  readonly byteLength: number;
}

export interface LocalizedSitemapPackage {
  readonly indexXml: string;
  readonly files: readonly SitemapFile[];
}

const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const MAX_URLS_PER_FILE = 50_000;
const MAX_BYTES_PER_FILE = 50_000_000;

interface PreparedPage {
  readonly clusterId: string;
  readonly canonicalUrl: string;
  readonly lastModified?: string;
  readonly alternates: readonly SitemapAlternate[];
}

function absoluteHttpsUrl(value: string, label: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.hash) {
    throw new TypeError(`${label} must be an absolute HTTPS URL without credentials or a fragment`);
  }
  return url.href;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeLastModified(value?: string): string | undefined {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw new TypeError("lastModified must be a date or a timezone-qualified ISO timestamp");
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new TypeError(`Invalid lastModified timestamp: ${value}`);
  return new Date(timestamp).toISOString();
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function renderUrlEntry(page: PreparedPage): string {
  const lines = ["<url>", `  <loc>${xmlEscape(page.canonicalUrl)}</loc>`];
  if (page.lastModified) lines.push(`  <lastmod>${xmlEscape(page.lastModified)}</lastmod>`);
  for (const alternate of page.alternates) {
    lines.push(
      `  <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.language)}" href="${xmlEscape(alternate.url)}" />`,
    );
  }
  lines.push("</url>", "");
  return lines.join("\n");
}

function validateClusters(pages: readonly PreparedPage[]): void {
  const clusters = new Map<string, PreparedPage[]>();
  for (const page of pages) {
    const cluster = clusters.get(page.clusterId) ?? [];
    cluster.push(page);
    clusters.set(page.clusterId, cluster);
  }

  for (const [clusterId, cluster] of clusters) {
    const expectedUrls = new Set(cluster.map((page) => page.canonicalUrl));
    if (expectedUrls.size !== cluster.length) throw new Error(`Duplicate URL in hreflang cluster '${clusterId}'`);

    for (const page of cluster) {
      const alternatesByLanguage = new Map(page.alternates.map((alternate) => [alternate.language, alternate.url]));
      const selfAlternate = page.alternates.find((alternate) => alternate.url === page.canonicalUrl);
      if (!selfAlternate) throw new Error(`Cluster '${clusterId}' is missing its self hreflang link`);
      if (page.alternates.length !== cluster.length || alternatesByLanguage.size !== cluster.length) {
        throw new Error(`Cluster '${clusterId}' must list each locale URL exactly once`);
      }

      const listedUrls = new Set(page.alternates.map((alternate) => alternate.url));
      if (listedUrls.size !== expectedUrls.size || [...expectedUrls].some((url) => !listedUrls.has(url))) {
        throw new Error(`Cluster '${clusterId}' has an incomplete or foreign hreflang target`);
      }

      for (const targetUrl of expectedUrls) {
        const target = cluster.find((candidate) => candidate.canonicalUrl === targetUrl)!;
        const targetLanguage = target.alternates.find((alternate) => alternate.url === target.canonicalUrl)!.language;
        if (!page.alternates.some((alternate) => alternate.url === targetUrl && alternate.language === targetLanguage)) {
          throw new Error(`Cluster '${clusterId}' has a mismatched hreflang locale for ${targetUrl}`);
        }
        if (!target.alternates.some((alternate) => alternate.url === page.canonicalUrl && alternate.language === selfAlternate.language)) {
          throw new Error(`Cluster '${clusterId}' has a non-reciprocal hreflang link`);
        }
      }
    }
  }
}

export function compileLocalizedSitemapPackage(input: LocalizedSitemapInput): LocalizedSitemapPackage {
  if (input.pages.length === 0) throw new RangeError("At least one canonical page is required");
  const maxUrlsPerFile = Math.min(MAX_URLS_PER_FILE, Math.floor(input.maxUrlsPerFile ?? MAX_URLS_PER_FILE));
  const maxBytesPerFile = Math.min(MAX_BYTES_PER_FILE, Math.floor(input.maxBytesPerFile ?? MAX_BYTES_PER_FILE));
  if (!Number.isFinite(maxUrlsPerFile) || maxUrlsPerFile < 1) throw new RangeError("maxUrlsPerFile must be positive");
  if (!Number.isFinite(maxBytesPerFile) || maxBytesPerFile < 1) throw new RangeError("maxBytesPerFile must be positive");

  const sitemapBaseUrl = absoluteHttpsUrl(input.sitemapBaseUrl, "sitemapBaseUrl").replace(/\/$/, "");
  const canonicalUrls = new Set<string>();
  const preparedPages: PreparedPage[] = input.pages.map((page) => {
    const canonicalUrl = absoluteHttpsUrl(page.canonicalUrl, "canonicalUrl");
    if (canonicalUrls.has(canonicalUrl)) throw new Error(`Duplicate canonical URL: ${canonicalUrl}`);
    canonicalUrls.add(canonicalUrl);
    if (!page.clusterId.trim()) throw new TypeError("clusterId must not be empty");

    const alternates = page.alternates.map((alternate) => {
      const language = alternate.language.trim().toLowerCase();
      if (!/^(?:[a-z]{2,3}(?:-[a-z0-9]{2,8})*|x-default)$/i.test(language)) {
        throw new TypeError(`Invalid hreflang language: ${alternate.language}`);
      }
      return { language, url: absoluteHttpsUrl(alternate.url, "hreflang URL") };
    });
    if (new Set(alternates.map((alternate) => alternate.language)).size !== alternates.length) {
      throw new Error(`Duplicate hreflang language in cluster '${page.clusterId}'`);
    }

    return {
      clusterId: page.clusterId.trim(),
      canonicalUrl,
      lastModified: normalizeLastModified(page.lastModified),
      alternates: alternates.sort((a, b) => a.language.localeCompare(b.language)),
    };
  });
  validateClusters(preparedPages);

  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}">\n`;
  const footer = "</urlset>\n";
  const headerBytes = byteLength(header);
  const footerBytes = byteLength(footer);
  if (headerBytes + footerBytes > maxBytesPerFile) throw new RangeError("maxBytesPerFile is too small for a sitemap document");

  const files: SitemapFile[] = [];
  let currentEntries: string[] = [];
  let currentEntryCount = 0;
  let currentBytes = headerBytes + footerBytes;

  const flush = () => {
    if (currentEntryCount === 0) return;
    const xml = header + currentEntries.join("") + footer;
    const index = files.length + 1;
    const url = `${sitemapBaseUrl}/sitemap-${String(index).padStart(4, "0")}.xml`;
    files.push({ url, xml, entryCount: currentEntryCount, byteLength: byteLength(xml) });
    currentEntries = [];
    currentEntryCount = 0;
    currentBytes = headerBytes + footerBytes;
  };

  for (const page of preparedPages) {
    const entry = renderUrlEntry(page);
    const entryBytes = byteLength(entry);
    if (currentEntryCount > 0 && (currentEntryCount >= maxUrlsPerFile || currentBytes + entryBytes > maxBytesPerFile)) {
      flush();
    }
    if (currentBytes + entryBytes > maxBytesPerFile) {
      throw new RangeError(`One sitemap URL entry exceeds the ${maxBytesPerFile}-byte file limit`);
    }
    currentEntries.push(entry);
    currentEntryCount += 1;
    currentBytes += entryBytes;
  }
  flush();

  if (files.length > MAX_URLS_PER_FILE) throw new RangeError("Sitemap index exceeds 50,000 sitemap entries");
  const indexLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sitemapindex xmlns="${SITEMAP_NAMESPACE}">`,
    ...files.flatMap((file) => ["  <sitemap>", `    <loc>${xmlEscape(file.url)}</loc>`, "  </sitemap>"]),
    "</sitemapindex>",
    "",
  ];
  const indexXml = indexLines.join("\n");
  if (byteLength(indexXml) > MAX_BYTES_PER_FILE) throw new RangeError("Sitemap index exceeds the 50,000,000-byte limit");

  return { indexXml, files };
}
