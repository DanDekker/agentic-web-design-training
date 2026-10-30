// ECMA-402 money formatting.
//
// The locale owns the grouping separator, the decimal separator, the position
// of the currency symbol, the currency display style and the rounding rule.
// Everything below goes through Intl.NumberFormat instead of hand-rolled
// string surgery, so the same code renders "1,234.50" in en-US and
// "1.234,50 €" in de-DE without any per-locale branching.

const CURRENCY_DISPLAYS = new Set(["symbol", "narrowSymbol", "code", "name"]);

const ROUNDING_MODES = new Set([
  "ceil",
  "floor",
  "expand",
  "trunc",
  "halfCeil",
  "halfFloor",
  "halfExpand",
  "halfTrunc",
  "halfEven",
]);

function currencyOptions(options = {}) {
  const {
    locale = "en-US",
    currency = "USD",
    currencyDisplay = "symbol",
    roundingMode = "halfExpand",
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  if (!CURRENCY_DISPLAYS.has(currencyDisplay)) {
    throw new RangeError(`Unsupported currencyDisplay '${currencyDisplay}'`);
  }
  if (!ROUNDING_MODES.has(roundingMode)) {
    throw new RangeError(`Unsupported roundingMode '${roundingMode}'`);
  }

  const settings = { style: "currency", currency, currencyDisplay, roundingMode };
  if (minimumFractionDigits !== undefined) settings.minimumFractionDigits = minimumFractionDigits;
  if (maximumFractionDigits !== undefined) settings.maximumFractionDigits = maximumFractionDigits;
  return { locale, settings };
}

// Formats an amount as currency in the requested locale.
export function formatMoney(amount, options = {}) {
  const { locale, settings } = currencyOptions(options);
  return new Intl.NumberFormat(locale, settings).format(amount);
}

// Describes a formatted amount by asking the formatter for its parts, so the
// grouping separator, the decimal separator and the currency token are the
// ones the locale actually uses.
export function describeMoney(amount, options = {}) {
  const { locale, settings } = currencyOptions(options);
  const parts = new Intl.NumberFormat(locale, settings).formatToParts(amount);
  const join = (type) =>
    parts
      .filter((part) => part.type === type)
      .map((part) => part.value)
      .join("");

  return {
    locale,
    currency: join("currency"),
    integer: join("integer"),
    fraction: join("fraction"),
    group: parts.find((part) => part.type === "group")?.value ?? "",
    decimal: parts.find((part) => part.type === "decimal")?.value ?? "",
    sign: parts.find((part) => part.type === "minusSign")?.value ?? "",
  };
}

// Reads a formatted amount back. The separators are learned from the locale
// itself instead of being hardcoded, so "1.234,50 €" parses back to 1234.5.
export function parseFormattedAmount(text, locale = "en-US") {
  const sample = new Intl.NumberFormat(locale).formatToParts(-1234.5);
  const group = sample.find((part) => part.type === "group")?.value ?? "";
  const decimal = sample.find((part) => part.type === "decimal")?.value ?? ".";

  let cleaned = String(text ?? "").trim();
  if (group) cleaned = cleaned.split(group).join("");
  if (decimal && decimal !== ".") cleaned = cleaned.split(decimal).join(".");
  cleaned = cleaned.replace(/[^0-9.+-]/g, "");

  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

// Negotiates a locale list against the locales the runtime actually supports.
export function resolveLocales(requested = [], available = []) {
  const wanted = Array.isArray(requested) ? requested : [requested];
  const pool = Array.isArray(available) ? available : [available];

  const supported = Intl.NumberFormat.supportedLocalesOf(wanted);
  const resolved = [];
  for (const locale of supported) {
    const match = pool.find(
      (candidate) => String(candidate).toLowerCase() === locale.toLowerCase(),
    );
    if (match && !resolved.includes(match)) resolved.push(match);
  }

  if (resolved.length === 0) {
    const fallback = pool.find((candidate) =>
      Intl.NumberFormat.supportedLocalesOf([candidate]).length > 0,
    );
    if (fallback) resolved.push(fallback);
  }

  return resolved;
}
