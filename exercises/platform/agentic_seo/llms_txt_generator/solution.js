// llms.txt v2 generator: an H1 title, an optional blockquote summary, optional
// detail prose, then H2 sections holding Markdown link lists. Also emits the
// standard link relations so an agent can discover the Markdown variant of a
// page (rel="alternate"; type="text/markdown") and the llms.txt that covers it
// (rel="describedby").
export function buildLlmsTxt(site) {
  const lines = [];

  lines.push(`# ${site.title}`);

  if (site.summary) {
    lines.push("");
    lines.push(`> ${site.summary}`);
  }

  if (site.details) {
    lines.push("");
    lines.push(site.details);
  }

  for (const section of site.sections ?? []) {
    lines.push("");
    lines.push(`## ${section.name}`);
    lines.push("");
    for (const link of section.links ?? []) {
      lines.push(link.notes ? `- [ ${link.title} ](${link.url}) : ${link.notes}` : `- [ ${link.title} ](${link.url})`);
    }
  }

  const optional = site.optional ?? [];
  if (optional.length > 0) {
    lines.push("");
    lines.push("## Optional");
    lines.push("");
    for (const link of optional) {
      lines.push(`- [ ${link.title} ](${link.url})`);
    }
  }

  return `${lines.join("\n")}\n`;
}

// v2 allows two Markdown URL forms: the extension replaced (page.md) or the
// extension appended (page.html.md). Extension-less paths get index.md.
export function markdownVariantUrl(url) {
  if (url.endsWith("/")) return `${url}index.md`;
  if (/\.[a-z0-9]+$/i.test(url)) {
    return url.replace(/\.html$/i, ".md").replace(/\.(?!md$)[a-z0-9]+$/i, ".md");
  }
  return `${url}.md`;
}

// The Link header form works for non-HTML resources and needs no page markup.
export function buildLinkHeader(pageUrl, llmsTxtUrl) {
  const relations = [
    `<${markdownVariantUrl(pageUrl)}>; rel="alternate"; type="text/markdown"`,
    `<${llmsTxtUrl}>; rel="describedby"`,
  ];
  return `Link: ${relations.join(", ")}`;
}
