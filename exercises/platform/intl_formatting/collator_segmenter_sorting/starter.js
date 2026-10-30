// Sorts strings by code unit and splits text by whitespace or by code point,
// which is wrong for natural sort order, for locales with a different
// collation, and for scripts whose characters are not one code point each.
export function compareText(a, b, locale = "en", options = {}) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function sortText(items, locale = "en", options = {}) {
  return [...items].sort();
}

export function splitWords(text, locale = "en") {
  return String(text)
    .split(/\s+/)
    .filter(Boolean);
}

export function splitGraphemes(text, locale = "en") {
  return Array.from(String(text));
}
