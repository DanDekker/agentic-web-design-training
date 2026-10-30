// llms.txt v2 validator.
//
// A conformant file contains, in this order: an optional byte-order mark, an
// H1 with the name of the site (the only required section), an optional
// blockquote summary, optional prose sections, and then zero or more H2
// sections holding file lists. Each file list entry is a Markdown hyperlink
// with an optional ": notes" suffix.
//
// A file placed at a subpath covers the pages under that path, and where more
// than one file applies the most specific one wins.
export function validateLlmsTxt(source) {
  const errors = [];
  const text = String(source ?? "").replace(/^\uFEFF/, "");

  if (text.trim().length === 0) {
    return { valid: false, errors: ["File is empty."] };
  }

  const lines = text.split("\n");
  let index = 0;

  // The H1 must be the first content line.
  while (index < lines.length && lines[index].trim() === "") index += 1;
  if (index >= lines.length || !/^#\s+\S/.test(lines[index])) {
    errors.push("Missing H1 title as the first section.");
  }

  let seenH2 = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^#{3,6}\s/.test(line)) {
      errors.push(`Unexpected heading level in section ${i + 1}.`);
      continue;
    }

    if (/^##\s+/.test(line)) {
      seenH2 = true;
      continue;
    }

    // File list entries are only meaningful under an H2 section.
    if (/^-\s+/.test(line)) {
      if (!seenH2) {
        errors.push(`Link list entry outside of a section at line ${i + 1}.`);
        continue;
      }
      if (!/^-\s+\[[^\]]+\]\([^)]+\)(\s+:\s+.+)?$/.test(line.trim())) {
        errors.push(`Malformed link list entry at line ${i + 1}.`);
      }
    }
  }

  if (!seenH2) errors.push("No H2 sections with file lists were found.");

  return { valid: errors.length === 0, errors };
}

// The most specific llms.txt covers a page: a file at /docs/llms.txt covers
// /docs/page.html, and the deepest matching directory wins.
export function selectLlmsTxt(candidates, pagePath) {
  const covering = (candidates ?? []).filter((candidate) => {
    const base = coveringDirectory(candidate.path);
    return pagePath.startsWith(base);
  });

  if (covering.length === 0) return null;

  covering.sort((a, b) => coveringDirectory(b.path).length - coveringDirectory(a.path).length);
  return covering[0];
}

// An llms.txt file covers the directory it lives in.
function coveringDirectory(filePath) {
  const path = String(filePath || "");
  if (path.endsWith("/")) return path;
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "/" : path.slice(0, slash + 1);
}
