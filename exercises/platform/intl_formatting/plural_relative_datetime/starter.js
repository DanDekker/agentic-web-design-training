// English-only pluralisation and naive relative dates. The plural rule is
// hardcoded for a single language, and the date parts are read from the UTC
// ISO string, so the requested time zone is ignored entirely.
export function pluralCategory(count, locale = "en") {
  return count === 1 ? "one" : "other";
}

export function pluralCategories(locale = "en") {
  return ["one", "other"];
}

export function formatRelative(value, unit, locale = "en", options = {}) {
  return value < 0 ? `${Math.abs(value)} ${unit}s ago` : `in ${value} ${unit}s`;
}

export function formatDateParts(date, locale = "en-US", timeZone = "UTC") {
  const iso = new Date(date).toISOString();
  return {
    year: iso.slice(0, 4),
    month: iso.slice(5, 7),
    day: iso.slice(8, 10),
  };
}
