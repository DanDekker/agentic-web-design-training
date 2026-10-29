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

/**
 * Computes a balanced double-entry ledger journal for a Stripe Connect marketplace
 * charge split and optional partial refund with proportional platform fee clawback.
 */
export function computeMarketplaceLedgerSplit({
  orderId = "ord_01",
  grossChargeMinor,
  stripeFeeMinor = 0,
  platformFeeBps = 1000,
  refundGrossMinor = 0,
} = {}) {
  const gross = Number(grossChargeMinor);
  const fee = Number(stripeFeeMinor);
  const bps = Number(platformFeeBps);
  const refund = Number(refundGrossMinor);

  if (!Number.isSafeInteger(gross) || gross <= 0) {
    throw new Error("grossChargeMinor must be a positive integer.");
  }
  if (!Number.isSafeInteger(fee) || fee < 0 || fee >= gross) {
    throw new Error("Invalid stripeFeeMinor.");
  }
  if (!Number.isSafeInteger(refund) || refund < 0 || refund > gross) {
    throw new Error("Invalid refundGrossMinor.");
  }

  const platformCommissionMinor = Math.round((gross * bps) / 10000);
  const sellerNetMinor = gross - fee - platformCommissionMinor;

  const postings = [
    {
      txId: `tx_charge_${orderId}`,
      kind: "CHARGE_SPLIT",
      lines: [
        { account: "buyer_external", direction: "DEBIT", amountMinor: gross },
        { account: "stripe_processing_fee", direction: "CREDIT", amountMinor: fee },
        { account: "platform_commission", direction: "CREDIT", amountMinor: platformCommissionMinor },
        { account: "seller_escrow_payable", direction: "CREDIT", amountMinor: sellerNetMinor },
      ],
    },
  ];

  let refundPlatformReversalMinor = 0;
  let refundSellerClawbackMinor = 0;

  if (refund > 0) {
    refundPlatformReversalMinor = Math.round((refund * bps) / 10000);
    refundSellerClawbackMinor = refund - refundPlatformReversalMinor;
    postings.push({
      txId: `tx_refund_${orderId}`,
      kind: "PARTIAL_REFUND",
      lines: [
        { account: "platform_commission", direction: "DEBIT", amountMinor: refundPlatformReversalMinor },
        { account: "seller_escrow_payable", direction: "DEBIT", amountMinor: refundSellerClawbackMinor },
        { account: "buyer_external", direction: "CREDIT", amountMinor: refund },
      ],
    });
  }

  const balances = {
    stripe_processing_fee: fee,
    platform_commission: platformCommissionMinor - refundPlatformReversalMinor,
    seller_escrow_payable: sellerNetMinor - refundSellerClawbackMinor,
  };

  return {
    orderId,
    balanced: true,
    postings,
    balances,
  };
}

/**
 * Normalized Web Shop Storefront, Account-to-Checkout & Immutable Order History Engine.
 * Keeps products/variants, customer accounts, guest & authenticated carts, immutable
 * order snapshots, shipments, and hash-chained lifecycle events strictly organized
 * and referentially consistent.
 */
function fnv1aHex(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function normalizeAddressKey(addr = {}) {
  const clean = (v) =>
    String(v || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return [
    clean(addr.countryCode || "US"),
    clean(addr.postalCode),
    clean(addr.stateOrProvince),
    clean(addr.city),
    clean(addr.line1),
  ].join("|");
}

export class WebShopStore {
  #products = new Map(); // sku -> { sku, productId, title, attributes, unitPriceMinor, availableStock, maxPerOrder, isDigital }
  #accounts = new Map(); // accountId -> { accountId, email, displayName, savedAddresses, orderIds, orderCount, lifetimeSpendMinor, createdAt }
  #carts = new Map(); // cartId -> { cartId, ownerType: 'guest'|'account', accountId, status, convertedOrderId, items: Map<sku, item>, updatedAt }
  #orders = new Map(); // orderId -> frozen order snapshot + mutable fulfillment/RMA metadata
  #checkoutIdempotency = new Map(); // idempotencyKey -> orderId
  #invoiceSeq = 0;
  #accountSeq = 0;

  constructor() {
    this.#seedDefaultCatalog();
  }

  #seedDefaultCatalog() {
    const defaultVariants = [
      {
        sku: "GUANTLET_WEB-KB-OBS-TKL",
        productId: "prod_guantlet-web_keyboard",
        title: "guantlet-web Monochrome Mechanical Keyboard (Obsidian · TKL)",
        attributes: { color: "obsidian", layout: "TKL" },
        unitPriceMinor: 18900,
        availableStock: 12,
        maxPerOrder: 4,
        isDigital: false,
      },
      {
        sku: "GUANTLET_WEB-KB-SLV-FULL",
        productId: "prod_guantlet-web_keyboard",
        title: "guantlet-web Monochrome Mechanical Keyboard (Silver · Full)",
        attributes: { color: "silver", layout: "FULL" },
        unitPriceMinor: 19900,
        availableStock: 6,
        maxPerOrder: 4,
        isDigital: false,
      },
      {
        sku: "GUANTLET_WEB-DOCK-TB5",
        productId: "prod_guantlet-web_dock",
        title: "guantlet-web Thunderbolt 5 Workstation Dock",
        attributes: { finish: "anodized-black", ports: "16-port" },
        unitPriceMinor: 29900,
        availableStock: 8,
        maxPerOrder: 3,
        isDigital: false,
      },
      {
        sku: "POLAR-PRO-SEAT-1Y",
        productId: "prod_polar_license",
        title: "guantlet-web Agentic Pro License (Polar.sh MoR · 1 Year)",
        attributes: { tier: "pro", seats: "2-machines" },
        unitPriceMinor: 9900,
        availableStock: 999,
        maxPerOrder: 10,
        isDigital: true,
      },
    ];

    for (const v of defaultVariants) {
      this.#products.set(v.sku, { ...v });
    }

    // Seed a default guest cart so UI/tests can inspect immediately
    this.ensureCart("cart_guest_default", null);
  }

  ensureCart(cartId, accountId = null) {
    const cleanId = String(cartId || "cart_guest_default").trim();
    if (!this.#carts.has(cleanId)) {
      this.#carts.set(cleanId, {
        cartId: cleanId,
        ownerType: accountId ? "account" : "guest",
        accountId: accountId || null,
        status: "ACTIVE",
        convertedOrderId: null,
        items: new Map(),
        quantityAdjustments: [],
        updatedAt: new Date().toISOString(),
      });
    }
    return this.#carts.get(cleanId);
  }

  upsertCartItem({ cartId = "cart_guest_default", sku, quantity }) {
    const cart = this.ensureCart(cartId);
    if (cart.status !== "ACTIVE") {
      throw new Error(`Cart '${cartId}' is already converted to order '${cart.convertedOrderId}'.`);
    }
    const product = this.#products.get(sku);
    if (!product) throw new Error(`Unknown product SKU '${sku}'.`);

    const qty = Number(quantity);
    if (!Number.isSafeInteger(qty)) throw new Error("Quantity must be an integer.");

    if (qty <= 0) {
      cart.items.delete(sku);
    } else {
      const cap = Math.min(product.availableStock, product.maxPerOrder);
      if (cap <= 0) throw new Error(`SKU '${sku}' is out of stock.`);
      const clampedQty = Math.min(qty, cap);
      cart.items.set(sku, {
        sku: product.sku,
        title: product.title,
        quantity: clampedQty,
        unitPriceAtAddMinor: product.unitPriceMinor,
        maxPerOrder: product.maxPerOrder,
      });
    }

    cart.updatedAt = new Date().toISOString();
    return this.serializeCart(cart.cartId);
  }

  /**
   * Creates or updates a customer account, deduplicates their shipping address book,
   * and merges any anonymous guestCartId into the customer's authenticated account cart.
   */
  createOrMergeCustomerAccount({
    accountId,
    email,
    displayName,
    guestCartId = null,
    shippingAddress = null,
  }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("A valid email address is required to create a shop account.");
    }

    let account = Array.from(this.#accounts.values()).find(
      (a) => a.accountId === accountId || a.email === cleanEmail,
    );

    if (!account) {
      const id = accountId || `cust_${++this.#accountSeq}_${fnv1aHex(cleanEmail).slice(0, 6)}`;
      account = {
        accountId: id,
        email: cleanEmail,
        displayName: String(displayName || cleanEmail.split("@")[0]).trim(),
        savedAddresses: [],
        orderIds: [],
        orderCount: 0,
        lifetimeSpendMinor: 0,
        accountCartId: `cart_acct_${id}`,
        createdAt: new Date().toISOString(),
      };
      this.#accounts.set(id, account);
    } else if (displayName) {
      account.displayName = String(displayName).trim();
    }

    // Deduplicate shipping address by canonical postal fingerprint
    if (shippingAddress && shippingAddress.line1 && shippingAddress.postalCode) {
      const fp = normalizeAddressKey(shippingAddress);
      if (!account.savedAddresses.some((a) => a.fingerprint === fp)) {
        account.savedAddresses.push({
          recipientName: String(shippingAddress.recipientName || account.displayName).trim(),
          line1: String(shippingAddress.line1).trim(),
          city: String(shippingAddress.city || "").trim(),
          stateOrProvince: String(shippingAddress.stateOrProvince || "").trim().toUpperCase(),
          postalCode: String(shippingAddress.postalCode).trim().toUpperCase(),
          countryCode: String(shippingAddress.countryCode || "US").trim().toUpperCase(),
          fingerprint: fp,
        });
      }
    }

    const accountCart = this.ensureCart(account.accountCartId, account.accountId);
    const adjustments = [];

    if (guestCartId && this.#carts.has(guestCartId) && guestCartId !== accountCart.cartId) {
      const guestCart = this.#carts.get(guestCartId);
      if (guestCart.status === "ACTIVE") {
        for (const [sku, guestLine] of guestCart.items.entries()) {
          const product = this.#products.get(sku);
          if (!product) continue;
          const existingLine = accountCart.items.get(sku);
          const requestedTotal = (existingLine?.quantity ?? 0) + guestLine.quantity;
          const effectiveCap = Math.min(product.availableStock, product.maxPerOrder);
          const clampedTo = Math.min(requestedTotal, effectiveCap);

          if (clampedTo < requestedTotal) {
            adjustments.push({
              sku,
              requestedTotal,
              clampedTo,
              reason: product.availableStock <= product.maxPerOrder ? "STOCK_LIMIT" : "MAX_PER_ORDER_LIMIT",
            });
          }

          if (clampedTo > 0) {
            accountCart.items.set(sku, {
              sku: product.sku,
              title: product.title,
              quantity: clampedTo,
              unitPriceAtAddMinor: existingLine?.unitPriceAtAddMinor ?? guestLine.unitPriceAtAddMinor,
              maxPerOrder: product.maxPerOrder,
            });
          }
        }
        guestCart.items.clear();
        guestCart.status = "MERGED_INTO_ACCOUNT";
      }
    }

    accountCart.quantityAdjustments = adjustments;
    accountCart.updatedAt = new Date().toISOString();

    return {
      account: { ...account, savedAddresses: [...account.savedAddresses], orderIds: [...account.orderIds] },
      cart: this.serializeCart(accountCart.cartId),
      quantityAdjustments: adjustments,
    };
  }

  /**
   * Atomically promotes a cart to an immutable Order Snapshot with sequential invoice number,
   * stock deduction, EU VAT / US Nexus tax calculation, customer lifetimeSpendMinor rollup,
   * and hash-chained lifecycle audit events.
   */
  promoteCheckoutToOrder({
    checkoutIdempotencyKey,
    accountId,
    cartId,
    paymentProvider = "stripe",
    promoCode = null,
    buyerCountry = "US",
    buyerState = "CA",
    buyerVatId = "",
    shippingAddress = null,
  }) {
    if (!checkoutIdempotencyKey || String(checkoutIdempotencyKey).trim().length < 4) {
      throw new Error("checkoutIdempotencyKey is required for atomic order promotion.");
    }

    const idemKey = String(checkoutIdempotencyKey).trim();
    if (this.#checkoutIdempotency.has(idemKey)) {
      const existingOrderId = this.#checkoutIdempotency.get(idemKey);
      return {
        order: this.getOrder(existingOrderId),
        idempotentReplay: true,
      };
    }

    const account = this.#accounts.get(accountId);
    if (!account) {
      throw new Error(`ForeignKeyConstraintError: Unknown customer accountId '${accountId}'.`);
    }

    const targetCartId = cartId || account.accountCartId;
    const cart = this.#carts.get(targetCartId);
    if (!cart) throw new Error(`Unknown cart '${targetCartId}'.`);
    if (cart.status === "CONVERTED_TO_ORDER" && cart.convertedOrderId) {
      return {
        order: this.getOrder(cart.convertedOrderId),
        idempotentReplay: true,
      };
    }

    const rawItems = Array.from(cart.items.values());
    if (rawItems.length === 0) {
      throw new Error("Cannot complete checkout with an empty cart.");
    }

    // 1. Pre-validate stock across all SKUs before mutating anything
    for (const item of rawItems) {
      const product = this.#products.get(item.sku);
      if (!product || product.availableStock < item.quantity) {
        throw new Error(
          `InsufficientStockError: SKU '${item.sku}' requested ${item.quantity}, available ${product?.availableStock ?? 0}.`,
        );
      }
    }

    // 2. Compute integer minor-unit pricing, Hamilton Largest-Remainder discount proration & tax
    const discounts = [];
    if (promoCode === "GUANTLET_WEB10") {
      discounts.push({ code: "GUANTLET_WEB10", kind: "PERCENT_BPS", value: 1000 });
    } else if (promoCode === "SAVE1500") {
      discounts.push({ code: "SAVE1500", kind: "FIXED_CART", value: 1500 });
    }

    const quote = calculateCheckoutQuote({
      currency: "USD",
      items: rawItems.map((i) => {
        const liveProduct = this.#products.get(i.sku);
        return {
          sku: i.sku,
          name: liveProduct.title,
          unitAmountMinor: liveProduct.unitPriceMinor,
          quantity: i.quantity,
        };
      }),
      discounts,
      buyerCountry,
      buyerState,
      buyerVatId,
    });

    // 3. Deduct physical stock atomically
    for (const item of rawItems) {
      const product = this.#products.get(item.sku);
      product.availableStock -= item.quantity;
    }

    // 4. Freeze immutable order line snapshots so future catalog edits never corrupt order history
    const frozenLines = Object.freeze(
      quote.lineItems.map((line, idx) => {
        const product = this.#products.get(line.sku);
        const lineTaxMinor = Math.round((line.netMinor * quote.tax.taxRateBps) / 10000);
        return Object.freeze({
          lineId: `line_${idx + 1}_${line.sku}`,
          sku: line.sku,
          snapshotTitle: String(product.title),
          isDigital: Boolean(product.isDigital),
          quantity: line.quantity,
          deliveredQty: product.isDigital ? line.quantity : 0,
          returnedQty: 0,
          snapshotUnitPriceMinor: line.unitAmountMinor,
          snapshotDiscountMinor: line.discountMinor,
          snapshotNetMinor: line.netMinor,
          snapshotTaxMinor: lineTaxMinor,
          snapshotLineTotalMinor: line.netMinor + lineTaxMinor,
        });
      }),
    );

    const seq = ++this.#invoiceSeq;
    const orderId = `ord_2026_${String(seq).padStart(4, "0")}`;
    const invoiceNumber = `INV-2026-${String(seq).padStart(5, "0")}`;
    const snapshotHash = `snap_${fnv1aHex(
      `${orderId}|${invoiceNumber}|${quote.grandTotalMinor}|${frozenLines
        .map((l) => `${l.sku}:${l.snapshotTitle}:${l.quantity}:${l.snapshotUnitPriceMinor}:${l.snapshotDiscountMinor}`)
        .join(";")}`,
    )}`;

    const nowIso = new Date().toISOString();
    const lifecycleEvents = [];
    const appendEvent = (type, amountMinor = 0, note = "") => {
      const evSeq = lifecycleEvents.length + 1;
      const prevHash = evSeq === 1 ? "GENESIS" : lifecycleEvents[evSeq - 2].eventHash;
      const eventHash = `ev_${fnv1aHex(`${evSeq}|${type}|${amountMinor}|${prevHash}`)}`;
      lifecycleEvents.push(
        Object.freeze({
          seq: evSeq,
          type,
          amountMinor,
          note,
          timestampIso: nowIso,
          prevHash,
          eventHash,
        }),
      );
    };

    appendEvent("ACCOUNT_VERIFIED", 0, `Account ${account.email}`);
    appendEvent("CHECKOUT_AUTHORIZED", quote.grandTotalMinor, `${paymentProvider.toUpperCase()} authorized`);
    appendEvent("ORDER_CAPTURED", quote.grandTotalMinor, `Invoice ${invoiceNumber} issued`);

    const resolvedAddress = shippingAddress ||
      account.savedAddresses[0] || {
        recipientName: account.displayName,
        line1: "100 Monochrome Way",
        city: "San Francisco",
        stateOrProvince: buyerState || "CA",
        postalCode: "94107",
        countryCode: buyerCountry || "US",
      };

    const orderRecord = {
      orderId,
      invoiceNumber,
      accountId: account.accountId,
      customerEmail: account.email,
      paymentProvider,
      paymentReference:
        paymentProvider === "polar" ? `polar_ord_${seq}_${snapshotHash.slice(5, 11)}` : `pi_live_${seq}_${snapshotHash.slice(5, 11)}`,
      currency: quote.currency,
      status: frozenLines.every((l) => l.isDigital) ? "FULFILLED" : "PAID_PROCESSING",
      subtotalMinor: quote.subtotalMinor,
      totalDiscountMinor: quote.totalDiscountMinor,
      totalTaxMinor: quote.tax.taxAmountMinor,
      taxRegime: quote.tax.taxRegime,
      reverseCharge: quote.tax.reverseCharge,
      grandTotalMinor: quote.grandTotalMinor,
      refundedMinor: 0,
      netRetainedMinor: quote.grandTotalMinor,
      shippingAddress: Object.freeze({ ...resolvedAddress }),
      lines: frozenLines,
      shipments: frozenLines.some((l) => l.isDigital)
        ? [
            {
              shipmentId: `ship_digital_${seq}`,
              carrier: "POLAR_INSTANT_ENTITLEMENT",
              trackingNumber: `POLAR-KEY-${seq}00`,
              status: "DELIVERED",
              deliveredAtIso: nowIso,
            },
          ]
        : [],
      lifecycleEvents,
      snapshotHash,
      createdAt: nowIso,
    };

    this.#orders.set(orderId, orderRecord);
    this.#checkoutIdempotency.set(idemKey, orderId);

    // 5. Update cart and customer lifetime spend atomically
    cart.status = "CONVERTED_TO_ORDER";
    cart.convertedOrderId = orderId;
    cart.items.clear();

    // Provision a fresh active cart for future shopping by this account
    account.accountCartId = `cart_acct_${account.accountId}_${seq + 1}`;
    this.ensureCart(account.accountCartId, account.accountId);

    account.orderIds.unshift(orderId);
    account.orderCount += 1;
    account.lifetimeSpendMinor += quote.grandTotalMinor;

    return {
      order: this.getOrder(orderId),
      idempotentReplay: false,
    };
  }

  /**
   * Advances an order through fulfillment (SHIP_ORDER -> DELIVER_ORDER) or RMA return/refund
   * while keeping line-item quantities, customer lifetime spend, and hash-chained events consistent.
   */
  transitionOrderLifecycle({ orderId, action, refundLineSku = null, refundQty = 1 }) {
    const order = this.#orders.get(orderId);
    if (!order) throw new Error(`Unknown order '${orderId}'.`);

    const nowIso = new Date().toISOString();
    const appendEvent = (type, amountMinor = 0, note = "") => {
      const evSeq = order.lifecycleEvents.length + 1;
      const prevHash = order.lifecycleEvents[evSeq - 2].eventHash;
      const eventHash = `ev_${fnv1aHex(`${evSeq}|${type}|${amountMinor}|${prevHash}`)}`;
      order.lifecycleEvents.push(
        Object.freeze({
          seq: evSeq,
          type,
          amountMinor,
          note,
          timestampIso: nowIso,
          prevHash,
          eventHash,
        }),
      );
    };

    if (action === "SHIP_AND_DELIVER") {
      order.lines = Object.freeze(
        order.lines.map((l) =>
          Object.freeze({
            ...l,
            deliveredQty: l.quantity,
          }),
        ),
      );
      order.status = "FULFILLED";
      order.shipments.push({
        shipmentId: `ship_${order.orderId}_${order.shipments.length + 1}`,
        carrier: "UPS_NEXT_DAY",
        trackingNumber: `1Z999AA1012345678${order.shipments.length + 1}`,
        status: "DELIVERED",
        deliveredAtIso: nowIso,
      });
      appendEvent("SHIPMENT_DELIVERED", 0, "All physical packages delivered");
    } else if (action === "RMA_REFUND_LINE") {
      const targetLine = order.lines.find((l) => (refundLineSku ? l.sku === refundLineSku : !l.isDigital));
      if (!targetLine) throw new Error("No matching physical line item found for RMA return.");
      if (targetLine.isDigital) throw new Error("Digital license keys are non-returnable via physical RMA.");
      const remainingReturnable = targetLine.deliveredQty - targetLine.returnedQty;
      if (remainingReturnable < refundQty) {
        throw new Error(`Cannot return ${refundQty} unit(s); only ${remainingReturnable} delivered unit(s) eligible.`);
      }

      const unitRefundMinor = Math.round(targetLine.snapshotLineTotalMinor / targetLine.quantity);
      const refundAmountMinor = unitRefundMinor * refundQty;

      order.lines = Object.freeze(
        order.lines.map((l) =>
          l.sku === targetLine.sku
            ? Object.freeze({ ...l, returnedQty: l.returnedQty + refundQty })
            : l,
        ),
      );
      order.refundedMinor += refundAmountMinor;
      order.netRetainedMinor = order.grandTotalMinor - order.refundedMinor;
      order.status = order.netRetainedMinor === 0 ? "REFUNDED" : "PARTIALLY_REFUNDED";

      // Restock returned physical units and adjust customer lifetime net spend
      const product = this.#products.get(targetLine.sku);
      if (product) product.availableStock += refundQty;
      const account = this.#accounts.get(order.accountId);
      if (account) account.lifetimeSpendMinor = Math.max(0, account.lifetimeSpendMinor - refundAmountMinor);

      appendEvent("RMA_RETURN_APPROVED", refundAmountMinor, `RMA approved for ${refundQty}x ${targetLine.sku}`);
      appendEvent("ORDER_REFUNDED", refundAmountMinor, `Refunded ${refundAmountMinor} minor units`);
    } else {
      throw new Error(`Unsupported lifecycle action '${action}'.`);
    }

    return this.getOrder(orderId);
  }

  /**
   * Mutates a live catalog product's price or title (used to verify that historical
   * order snapshots remain 100% isolated and unchanged).
   */
  mutateCatalogProduct({ sku, newTitle, newUnitPriceMinor }) {
    const product = this.#products.get(sku);
    if (!product) throw new Error(`Unknown product SKU '${sku}'.`);
    if (newTitle !== undefined) product.title = String(newTitle).trim();
    if (newUnitPriceMinor !== undefined) {
      if (!Number.isSafeInteger(newUnitPriceMinor) || newUnitPriceMinor <= 0) {
        throw new Error("newUnitPriceMinor must be a positive integer.");
      }
      product.unitPriceMinor = newUnitPriceMinor;
    }
    return { ...product };
  }

  serializeCart(cartId) {
    const cart = this.#carts.get(cartId);
    if (!cart) return null;
    const items = [];
    const priceDriftNotices = [];
    let subtotalMinor = 0;

    for (const item of cart.items.values()) {
      const liveProduct = this.#products.get(item.sku);
      const livePrice = liveProduct ? liveProduct.unitPriceMinor : item.unitPriceAtAddMinor;
      const lineTotalMinor = livePrice * item.quantity;
      subtotalMinor += lineTotalMinor;

      if (livePrice !== item.unitPriceAtAddMinor) {
        priceDriftNotices.push({
          sku: item.sku,
          title: item.title,
          unitPriceAtAddMinor: item.unitPriceAtAddMinor,
          liveUnitPriceMinor: livePrice,
          deltaMinor: livePrice - item.unitPriceAtAddMinor,
        });
      }

      items.push({
        ...item,
        liveUnitPriceMinor: livePrice,
        lineTotalMinor,
        availableStock: liveProduct?.availableStock ?? 0,
      });
    }

    return {
      cartId: cart.cartId,
      ownerType: cart.ownerType,
      accountId: cart.accountId,
      status: cart.status,
      convertedOrderId: cart.convertedOrderId,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotalMinor,
      items,
      priceDriftNotices,
      quantityAdjustments: cart.quantityAdjustments || [],
      updatedAt: cart.updatedAt,
    };
  }

  getOrder(orderId) {
    const order = this.#orders.get(orderId);
    if (!order) return null;
    const expectedSnap = `snap_${fnv1aHex(
      `${order.orderId}|${order.invoiceNumber}|${order.grandTotalMinor}|${order.lines
        .map((l) => `${l.sku}:${l.snapshotTitle}:${l.quantity}:${l.snapshotUnitPriceMinor}:${l.snapshotDiscountMinor}`)
        .join(";")}`,
    )}`;
    return {
      ...order,
      snapshotIntegrityValid: expectedSnap === order.snapshotHash,
    };
  }

  verifyDataIntegrity() {
    const violations = [];
    for (const order of this.#orders.values()) {
      if (!this.#accounts.has(order.accountId)) {
        violations.push(`Orphan order '${order.orderId}' references missing account '${order.accountId}'`);
      }
      const checked = this.getOrder(order.orderId);
      if (!checked.snapshotIntegrityValid) {
        violations.push(`Order '${order.orderId}' failed immutable snapshot hash verification`);
      }
      if (order.grandTotalMinor - order.refundedMinor !== order.netRetainedMinor) {
        violations.push(`Order '${order.orderId}' netRetainedMinor mismatch`);
      }
    }

    for (const account of this.#accounts.values()) {
      const accountOrders = account.orderIds.map((id) => this.#orders.get(id)).filter(Boolean);
      const expectedNetSpend = accountOrders.reduce((s, o) => s + o.netRetainedMinor, 0);
      if (account.lifetimeSpendMinor !== expectedNetSpend) {
        violations.push(`Account '${account.accountId}' lifetimeSpendMinor drift`);
      }
    }

    return {
      healthy: violations.length === 0,
      totalProducts: this.#products.size,
      totalAccounts: this.#accounts.size,
      totalOrders: this.#orders.size,
      violations,
    };
  }

  getState() {
    return {
      products: Array.from(this.#products.values()).map((p) => ({ ...p })),
      accounts: Array.from(this.#accounts.values()).map((a) => ({
        ...a,
        savedAddresses: [...a.savedAddresses],
        orderIds: [...a.orderIds],
      })),
      carts: Array.from(this.#carts.keys()).map((id) => this.serializeCart(id)),
      orders: Array.from(this.#orders.keys()).map((id) => this.getOrder(id)),
      integrity: this.verifyDataIntegrity(),
    };
  }
}
