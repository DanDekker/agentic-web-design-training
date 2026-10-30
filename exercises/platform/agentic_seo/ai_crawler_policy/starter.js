// Treats every crawler identically and emits no usage preferences, so a site
// cannot distinguish training crawlers from search indexers.
export function buildAiRobotsTxt(policy) {
  return ["User-agent: *", "Allow: /"].join("\n");
}

export function classifyCrawler() {
  return "unknown";
}
