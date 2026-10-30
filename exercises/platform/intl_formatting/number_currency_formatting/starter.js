// Naive money formatting: hardcodes the "$" symbol, always groups with commas
// and always uses a dot for the decimal separator, so it is wrong for every
// locale except en-US. It also cannot read a formatted amount back, because
// stripping the non-numeric characters mangles any locale that groups or
// punctuates differently from English.
export function formatMoney(amount, options = {}) {
  const sign = amount < 0 ? "-" : "";
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${grouped}.${fraction}`;
}

// Structural description of a formatted amount, hand-rolled for en-US only.
export function describeMoney(amount, options = {}) {
  const fixed = Math.abs(amount).toFixed(2);
  const [integer, fraction] = fixed.split(".");
  return {
    locale: options.locale || "en-US",
    currency: "$",
    integer,
    fraction,
    group: ",",
    decimal: ".",
    sign: amount < 0 ? "-" : "",
  };
}

// Reads a formatted amount back by deleting everything that is not a digit.
export function parseFormattedAmount(text, locale = "en-US") {
  const cleaned = String(text || "").replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

// Resolves the requested locales by intersecting them with the available ones.
export function resolveLocales(requested = [], available = []) {
  return requested.filter((locale) => available.includes(locale));
}
