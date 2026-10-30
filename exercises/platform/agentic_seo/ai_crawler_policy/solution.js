// 2026 AI crawler policy: classify each crawler by purpose, then emit a
// robots.txt that separates training crawlers from search indexers and
// user-triggered fetchers, plus a Content-Signal usage declaration.
//
// Three independent signals travel in the directive:
//   search   - may the page be indexed for search results
//   ai-input - may the page be used as live input to an AI answer
//   ai-train - may the page be used as training data
const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "meta-externalagent",
  "MistralAI-Training",
  "CCBot",
  "AI2Bot",
  "Amazonbot",
];

const SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "Googlebot"];

const USER_TRIGGERED_CRAWLERS = ["ChatGPT-User", "Claude-User", "Perplexity-User"];

export function classifyCrawler(userAgent) {
  const token = String(userAgent || "").trim();
  if (!token) return "unknown";
  if (TRAINING_CRAWLERS.includes(token)) return "training";
  if (SEARCH_CRAWLERS.includes(token)) return "search";
  if (USER_TRIGGERED_CRAWLERS.includes(token)) return "user-triggered";
  return "unknown";
}

export function buildAiRobotsTxt(policy = {}) {
  const {
    allowTraining = false,
    allowSearch = true,
    allowAiInput = true,
    disallowPaths = [],
  } = policy;

  const lines = [];

  const group = (crawlers, allow) => {
    if (crawlers.length === 0) return;
    for (const crawler of crawlers) lines.push(`User-agent: ${crawler}`);
    if (allow) lines.push("Allow: /");
    else lines.push("Disallow: /");
    lines.push("");
  };

  group(TRAINING_CRAWLERS, allowTraining);
  group(SEARCH_CRAWLERS, allowSearch);
  group(USER_TRIGGERED_CRAWLERS, allowAiInput);

  lines.push("User-agent: *");
  lines.push("Allow: /");
  for (const path of disallowPaths) lines.push(`Disallow: ${path}`);
  lines.push("");

  const signals = [
    `search=${allowSearch ? "yes" : "no"}`,
    `ai-input=${allowAiInput ? "yes" : "no"}`,
    `ai-train=${allowTraining ? "yes" : "no"}`,
  ];
  lines.push(`Content-Signal: ${signals.join(", ")}`);

  return `${lines.join("\n")}\n`;
}

// RFC 9309: the most specific match wins, measured in octets of the path
// prefix; when an allow and a disallow rule are equivalent, allow wins.
export function isPathAllowed(robotsTxt, userAgent, path) {
  const groups = parseRobotsGroups(robotsTxt);
  const product = String(userAgent || "").trim();
  const token = product.toLowerCase();

  // RFC 9309: groups that name the product token are combined with each other.
  // The "*" group is only a fallback for crawlers with no matching group, so it
  // must not be merged in and override a specific group's rules.
  const specific = groups.filter((group) =>
    group.agents.some((agent) => agent !== "*" && token.includes(agent.toLowerCase())),
  );
  const applicable = specific.length > 0 ? specific : groups.filter((group) => group.agents.includes("*"));

  if (applicable.length === 0) return true;

  const rules = applicable.flatMap((group) => group.rules);
  let best = null;

  for (const rule of rules) {
    if (!matchesPath(rule.pattern, path)) continue;
    if (!best || rule.pattern.length > best.pattern.length) best = rule;
    else if (rule.pattern.length === best.pattern.length && rule.allow && !best.allow) best = rule;
  }

  if (!best) return true;
  return best.allow;
}

function parseRobotsGroups(robotsTxt) {
  const groups = [];
  let current = null;

  for (const rawLine of String(robotsTxt || "").split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value);
      continue;
    }

    if (!current) continue;
    if (field === "allow" || field === "disallow") {
      current.rules.push({ allow: field === "allow", pattern: value });
    }
  }

  return groups;
}

function matchesPath(pattern, path) {
  if (pattern === "") return false;
  const anchoredEnd = pattern.endsWith("$");
  const body = anchoredEnd ? pattern.slice(0, -1) : pattern;

  const regex = new RegExp(
    `^${body
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*")}${anchoredEnd ? "$" : ""}`,
  );

  return regex.test(path);
}
