export function auditFacetedNavigation(input: any) {
  // TODO: normalize safe URLs, keep curated facets indexable, and choose a
  // crawl policy for uncurated combinations without mixing robots and canonicals.
  return { decision: "review", canonicalUrl: null, includeInSitemap: false };
}
