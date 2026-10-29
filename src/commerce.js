/**
 * Agentic Curriculum 1M Tasks — First-Party E-Commerce, Checkout, Stripe & Polar.sh Engine.
 * Provides integer minor-unit cart pricing (Hamilton's Largest Remainder proration),
 * EU VAT B2B Reverse-Charge / US Economic Nexus tax calculation, dual Stripe & Polar.sh
 * Standard Webhooks HMAC-SHA256 verification, and double-entry marketplace ledger splits.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENT_PROVIDERS_CATALOG = Object.freeze([
  {
    id: "stripe",
    name: "Stripe",
    role: "Payment Processor & Connect Infrastructure",
    primitives: [
      "PaymentIntents (automatic & manual capture, 3DS2 requires_action)",
      "Checkout Sessions & Customer Portal",
      "Stripe Billing (Subscriptions, Proration, Smart Retries, Billing Meters)",
      "Stripe Connect (Destination charges, Separate charges & transfers, Double-entry ledger splits)",
    ],
    webhookHeader: "Stripe-Signature",
    webhookFormat: "t=<unix_timestamp>,v1=<hmac_sha256_hex>",
    signedPayloadTemplate: "${t}.${rawBody}",
  },
  {
    id: "polar",
    name: "Polar.sh",
    role: "Merchant of Record (MoR) for Software & AI Monetization",
    primitives: [
      "Global Sales Tax, EU VAT OSS & B2B Reverse-Charge compliance",
      "Digital Benefits & License Key Seat Provisioning (POLAR-*)",
      "Usage-Based Meters & Prepaid Credit Drawdown for AI Tokens / GPU Seconds",
      "Standard Webhooks specification (RFC-draft)",
    ],
    webhookHeader: "webhook-signature",
    webhookFormat: "v1,<hmac_sha256_base64>",
    signedPayloadTemplate: "${webhook-id}.${webhook-timestamp}.${rawBody}",
  },
]);

export const CURRENCY_EXPONENTS = Object.freeze({
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  JPY: 0,
  KRW: 0,
});

const EU_VAT_RATES_BPS = Object.freeze({
  DE: 1900,
  FR: 2000,
  NL: 2100,
  SE: 2500,
  IE: 2300,
});

const US_STATE_RATES_BPS = Object.freeze({
  CA: 725,
  NY: 888,
  TX: 625,
  WA: 650,
});

/**
 * Calculates an integer minor-unit checkout quote with Hamilton's Largest Remainder
 * discount proration and EU VAT Reverse Charge / US Economic Nexus tax calculation.
 */
export function calculateCheckoutQuote({
  currency = "USD",
  items = [],
  discounts = [],
  buyerCountry = "US",
  buyerState = "",
  buyerVatId = "",
  merchantHomeCountry = "DE",
  usStateNexus = { CA: { trailingRevenueMinor: 15_000_000, trailingTransactions: 250 } },
} = {}) {
  const upperCurrency = String(currency || "USD").toUpperCase();
  const exponent = CURRENCY_EXPONENTS[upperCurrency] ?? 2;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Checkout quote requires at least one cart item.");
  }

  const grossLines = items.map((item) => {
    const unitAmountMinor = Number(item.unitAmountMinor);
    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(unitAmountMinor) || unitAmountMinor < 0) {
      throw new Error(`Invalid unitAmountMinor for SKU '${item.sku}'`);
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for SKU '${item.sku}'`);
    }
    return {
      sku: String(item.sku),
      name: String(item.name || item.sku),
      unitAmountMinor,
      quantity,
      grossMinor: unitAmountMinor * quantity,
    };
  });

  const subtotalMinor = grossLines.reduce((acc, l) => acc + l.grossMinor, 0);

  let runningNet = subtotalMinor;
  const sortedPromos = [...(Array.isArray(discounts) ? discounts : [])].sort((a, b) =>
    a.kind === b.kind ? String(a.code).localeCompare(String(b.code)) : a.kind === "PERCENT_BPS" ? -1 : 1,
  );

  for (const promo of sortedPromos) {
    if (promo.kind === "PERCENT_BPS") {
      const cut = Math.floor((runningNet * Number(promo.value || 0)) / 10000);
      runningNet = Math.max(0, runningNet - cut);
    } else if (promo.kind === "FIXED_CART") {
      runningNet = Math.max(0, runningNet - Number(promo.value || 0));
    }
  }

  const totalDiscountMinor = subtotalMinor - runningNet;

  // Hamilton's Largest Remainder proration across line items
  let proratedLines;
  if (subtotalMinor === 0 || totalDiscountMinor === 0) {
    proratedLines = grossLines.map((l) => ({
      ...l,
      discountMinor: 0,
      netMinor: l.grossMinor,
    }));
  } else {
    const quotas = grossLines.map((l, idx) => {
      const numerator = totalDiscountMinor * l.grossMinor;
      return {
        idx,
        floorShare: Math.floor(numerator / subtotalMinor),
        remainder: numerator % subtotalMinor,
      };
    });
    let rem = totalDiscountMinor - quotas.reduce((acc, q) => acc + q.floorShare, 0);
    quotas.sort((a, b) => (b.remainder !== a.remainder ? b.remainder - a.remainder : a.idx - b.idx));
    for (let i = 0; i < rem; i++) quotas[i].floorShare += 1;
    quotas.sort((a, b) => a.idx - b.idx);

    proratedLines = grossLines.map((l, idx) => {
      const discountMinor = quotas[idx].floorShare;
      return {
        ...l,
        discountMinor,
        netMinor: l.grossMinor - discountMinor,
      };
    });
  }

  const netSubtotalMinor = subtotalMinor - totalDiscountMinor;

  // Global Tax & EU VAT / US Nexus evaluation
  const country = String(buyerCountry || "US").toUpperCase();
  const state = String(buyerState || "").toUpperCase();
  const home = String(merchantHomeCountry || "DE").toUpperCase();
  const normalizedVat = String(buyerVatId || "").replace(/\s+/g, "").toUpperCase();
  const validVatFormat =
    normalizedVat.startsWith(country) && /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(normalizedVat);

  let taxRateBps = 0;
  let taxRegime = "EXEMPT_EXPORT";
  let reverseCharge = false;
  let invoiceNotice = null;

  if (country in EU_VAT_RATES_BPS && home in EU_VAT_RATES_BPS) {
    if (country !== home && validVatFormat) {
      taxRateBps = 0;
      taxRegime = "EU_B2B_REVERSE_CHARGE";
      reverseCharge = true;
      invoiceNotice = "Reverse charge — VAT exempt under Article 196 Council Directive 2006/112/EC";
    } else if (country === home) {
      taxRateBps = EU_VAT_RATES_BPS[country];
      taxRegime = "EU_DOMESTIC_VAT";
    } else {
      taxRateBps = EU_VAT_RATES_BPS[country];
      taxRegime = "EU_B2C_OSS_VAT";
    }
  } else if (country === "US" && state in US_STATE_RATES_BPS) {
    const exposure = usStateNexus?.[state] || { trailingRevenueMinor: 0, trailingTransactions: 0 };
    if (exposure.trailingRevenueMinor >= 10_000_000 || exposure.trailingTransactions >= 200) {
      taxRateBps = US_STATE_RATES_BPS[state];
      taxRegime = "US_STATE_NEXUS";
    }
  }

  const taxAmountMinor = Math.round((netSubtotalMinor * taxRateBps) / 10000);
  const grandTotalMinor = netSubtotalMinor + taxAmountMinor;

  return {
    currency: upperCurrency,
    exponent,
    subtotalMinor,
    totalDiscountMinor,
    netSubtotalMinor,
    tax: {
      taxAmountMinor,
      taxRateBps,
      taxRegime,
      reverseCharge,
      invoiceNotice,
    },
    grandTotalMinor,
    lineItems: proratedLines,
  };
}

/**
 * Signs or verifies Stripe (t=...,v1=...) and Polar.sh Standard Webhooks (v1,...) payloads
 * using Node/Bun native crypto HMAC-SHA256 and timingSafeEqual.
 */
export function signCommerceWebhook({
  provider = "stripe",
  secret,
  rawBody,
  timestampSec = Math.floor(Date.now() / 1000),
  webhookId = "msg_polar_01",
}) {
  if (provider === "stripe") {
    const payload = `${timestampSec}.${rawBody}`;
    const hex = createHmac("sha256", secret).update(payload).digest("hex");
    return {
      headers: {
        "stripe-signature": `t=${timestampSec},v1=${hex}`,
      },
      signature: hex,
    };
  }

  // Polar.sh Standard Webhooks
  const payload = `${webhookId}.${timestampSec}.${rawBody}`;
  const b64 = createHmac("sha256", secret).update(payload).digest("base64");
  return {
    headers: {
      "webhook-id": webhookId,
      "webhook-timestamp": String(timestampSec),
      "webhook-signature": `v1,${b64}`,
    },
    signature: b64,
  };
}

export function verifyCommerceWebhook({
  provider = "stripe",
  secret,
  rawBody,
  headers = {},
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
}) {
  const normalizedHeaders = {};
  for (const [k, v] of Object.entries(headers || {})) {
    normalizedHeaders[k.toLowerCase()] = String(v);
  }

  let timestampSec = NaN;
  let providedSig = "";
  let expectedSig = "";

  if (provider === "stripe") {
    const header = normalizedHeaders["stripe-signature"] || "";
    const parts = Object.fromEntries(
      header.split(",").map((kv) => {
        const [k, v] = kv.trim().split("=");
        return [k, v || ""];
      }),
    );
    timestampSec = Number(parts.t);
    providedSig = parts.v1 || "";
    expectedSig = createHmac("sha256", secret)
      .update(`${timestampSec}.${rawBody}`)
      .digest("hex");
  } else if (provider === "polar") {
    const msgId = normalizedHeaders["webhook-id"] || "";
    timestampSec = Number(normalizedHeaders["webhook-timestamp"]);
    const rawSig = normalizedHeaders["webhook-signature"] || "";
    providedSig = rawSig.startsWith("v1,") ? rawSig.slice(3) : rawSig;
    expectedSig = createHmac("sha256", secret)
      .update(`${msgId}.${timestampSec}.${rawBody}`)
      .digest("base64");
  } else {
    return { valid: false, provider, reason: "UNSUPPORTED_PROVIDER" };
  }

  if (!Number.isFinite(timestampSec) || !providedSig) {
    return { valid: false, provider, reason: "MALFORMED_SIGNATURE_HEADERS" };
  }

  if (Math.abs(nowSec - timestampSec) > toleranceSec) {
    return { valid: false, provider, reason: "TIMESTAMP_OUTSIDE_TOLERANCE_WINDOW" };
  }

  const bufA = Buffer.from(expectedSig, "utf8");
  const bufB = Buffer.from(providedSig, "utf8");
  if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
    return { valid: false, provider, reason: "INVALID_HMAC_SIGNATURE" };
  }

  return {
    valid: true,
    provider,
    timestampSec,
  };
}
