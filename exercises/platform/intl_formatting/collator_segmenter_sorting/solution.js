// Locale-aware collation and text segmentation.
//
// A collator is not a code point comparison: ICU collation puts Swedish "ä"
// after "z" while German puts it next to "a", and the numeric option makes
// "item2" sort before "item10" instead of after it.
//
// Segmentation follows UAX #29. Grapheme clusters keep a whole emoji ZWJ
// sequence together, and word segmentation knows where words actually start
// and end in scripts that do not separate them with spaces.

export function compareText(a, b, locale = "en", options = {}) {
  const {
    numeric = false,
    sensitivity = "variant",
    caseFirst = "false",
    ignorePunctuation = false,
  } = options;

  return new Intl.Collator(locale, {
    numeric,
    sensitivity,
    caseFirst,
    ignorePunctuation,
  }).compare(a, b);
}

export function sortText(items, locale = "en", options = {}) {
  return [...items].sort((a, b) => compareText(a, b, locale, options));
}

// Splits text into word-like segments, dropping whitespace and punctuation.
export function splitWords(text, locale = "en") {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  return Array.from(segmenter.segment(String(text)))
    .filter((segment) => segment.isWordLike)
    .map((segment) => segment.segment);
}

// Splits text into user-perceived characters (grapheme clusters).
export function splitGraphemes(text, locale = "en") {
  const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
  return Array.from(segmenter.segment(String(text))).map((segment) => segment.segment);
}
