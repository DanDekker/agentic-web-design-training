// React Hook with Manual Dependency Arrays & Stale Closure Bugs
export function useLegacyAnalyticsFilter(initialItems: any[]) {
  // In React, forgetting [minScore, query] in dependency arrays causes stale reads
  let items = initialItems;
  let query = "";
  let minScore = 0;
  let effectLog: string[] = [];

  function setQuery(q: string) {
    query = q;
    // Manual imperative sync required
  }
  return { items, query, minScore, setQuery, effectLog };
}
