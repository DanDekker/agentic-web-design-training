// ECMA-402 plural, relative-time and date formatting.
//
// CLDR plural rules are per-locale and per-language-family: English has two
// categories, Russian has one/few/many/other and Arabic adds zero and two.
// The same number therefore needs different wording in every language, and
// the plural category is only computable through Intl.PluralRules.
//
// Dates are equally locale- and zone-dependent: the same instant is a
// different calendar day in Tokyo than in UTC, so the parts are taken from
// Intl.DateTimeFormat with an explicit timeZone instead of from toISOString().

export function pluralCategory(count, locale = "en") {
  return new Intl.PluralRules(locale).select(count);
}

export function pluralCategories(locale = "en") {
  return [...new Intl.PluralRules(locale).resolvedOptions().pluralCategories];
}

// Formats a relative offset such as -1 day. With numeric: "auto" the runtime
// may use the idiomatic wording ("yesterday") instead of the numeric one.
export function formatRelative(value, unit, locale = "en", options = {}) {
  const { numeric = "always" } = options;
  return new Intl.RelativeTimeFormat(locale, { numeric }).format(value, unit);
}

// Returns the calendar parts of an instant as seen in the requested time zone.
export function formatDateParts(date, locale = "en-US", timeZone = "UTC") {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const pick = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

// Formats the same instant as a long-form date in the requested zone.
export function formatDate(date, locale = "en-US", timeZone = "UTC") {
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: "full" }).format(date);
}
