export function auditRenderedSeoParity(input: any) {
  // TODO: compare source-response and rendered-page SEO signals, while keeping
  // blocked or non-HTML routes out of rendered-state conclusions.
  return { pages: [], findingCounts: {} };
}
