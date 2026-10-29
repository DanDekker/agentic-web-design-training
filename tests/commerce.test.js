import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";
import {
  PAYMENT_PROVIDERS_CATALOG,
  calculateCheckoutQuote,
  signCommerceWebhook,
  verifyCommerceWebhook,
} from "../src/commerce.js";

let dir;
let handle;

const call = (method, path, body) =>
  handle(
    new Request(`http://loom.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "loom-commerce-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("First-Party E-Commerce, Checkout, Stripe & Polar.sh Engine", () => {
  test("exposes payment providers catalog (Stripe & Polar.sh) and currency exponents via /api/commerce/catalog", async () => {
    const res = await call("GET", "/api/commerce/catalog");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.providers.map((p) => p.id)).toEqual(["stripe", "polar"]);
    expect(data.currencies.USD).toBe(2);
    expect(data.currencies.JPY).toBe(0);
    expect(PAYMENT_PROVIDERS_CATALOG.length).toBe(2);
  });

  test("calculates integer minor-unit cart quotes with Hamilton Largest-Remainder proration and EU VAT Reverse Charge", async () => {
    // 3 equal $10.00 (1000c) items with a $1.00 (100c) FIXED_CART promo -> 34c + 33c + 33c = 100c
    // Cross-border EU B2B from DE merchant to FR buyer with valid FR VAT ID -> 0% Reverse Charge
    const res = await call("POST", "/api/commerce/checkout/quote", {
      currency: "EUR",
      items: [
        { sku: "PRO-SEAT-1", unitAmountMinor: 1000, quantity: 1 },
        { sku: "PRO-SEAT-2", unitAmountMinor: 1000, quantity: 1 },
        { sku: "PRO-SEAT-3", unitAmountMinor: 1000, quantity: 1 },
      ],
      discounts: [{ code: "EUR100", kind: "FIXED_CART", value: 100 }],
      buyerCountry: "FR",
      buyerVatId: "FR12345678901",
      merchantHomeCountry: "DE",
    });

    expect(res.status).toBe(200);
    const quote = await res.json();
    expect(quote.subtotalMinor).toBe(3000);
    expect(quote.totalDiscountMinor).toBe(100);
    expect(quote.netSubtotalMinor).toBe(2900);
    expect(quote.lineItems.map((l) => l.discountMinor)).toEqual([34, 33, 33]);
    expect(quote.tax.reverseCharge).toBe(true);
    expect(quote.tax.taxRegime).toBe("EU_B2B_REVERSE_CHARGE");
    expect(quote.tax.taxAmountMinor).toBe(0);
    expect(quote.grandTotalMinor).toBe(2900);

    // US California economic nexus tax test
    const usQuote = calculateCheckoutQuote({
      currency: "USD",
      items: [{ sku: "CLOUD-100", unitAmountMinor: 10000, quantity: 1 }],
      buyerCountry: "US",
      buyerState: "CA",
    });
    expect(usQuote.tax.taxRegime).toBe("US_STATE_NEXUS");
    expect(usQuote.tax.taxAmountMinor).toBe(725);
    expect(usQuote.grandTotalMinor).toBe(10725);
  });

  test("signs and verifies both Stripe (Stripe-Signature t=,v1=) and Polar.sh Standard Webhooks (webhook-signature v1,)", async () => {
    const secret = "whsec_test_stripe_polar_2026";
    const rawBody = JSON.stringify({ id: "evt_live_01", type: "checkout.session.completed" });
    const nowSec = 1793253600;

    // 1. Stripe webhook signature verification
    const stripeSigned = signCommerceWebhook({
      provider: "stripe",
      secret,
      rawBody,
      timestampSec: nowSec - 15,
    });
    const stripeRes = await call("POST", "/api/commerce/webhooks/verify", {
      provider: "stripe",
      secret,
      rawBody,
      headers: stripeSigned.headers,
      nowSec,
    });
    expect(stripeRes.status).toBe(200);
    const stripeVerified = await stripeRes.json();
    expect(stripeVerified.valid).toBe(true);
    expect(stripeVerified.provider).toBe("stripe");

    // 2. Polar.sh Standard Webhooks verification
    const polarSigned = signCommerceWebhook({
      provider: "polar",
      secret,
      rawBody,
      timestampSec: nowSec - 10,
      webhookId: "msg_polar_991",
    });
    const polarVerified = verifyCommerceWebhook({
      provider: "polar",
      secret,
      rawBody,
      headers: polarSigned.headers,
      nowSec,
    });
    expect(polarVerified.valid).toBe(true);
    expect(polarVerified.provider).toBe("polar");

    // 3. Rejects expired replay timestamp (>300s) and tampered body
    const replayExpired = verifyCommerceWebhook({
      provider: "stripe",
      secret,
      rawBody,
      headers: stripeSigned.headers,
      nowSec: nowSec + 500,
    });
    expect(replayExpired.valid).toBe(false);
    expect(replayExpired.reason).toBe("TIMESTAMP_OUTSIDE_TOLERANCE_WINDOW");

    const tampered = verifyCommerceWebhook({
      provider: "polar",
      secret,
      rawBody: `${rawBody} `,
      headers: polarSigned.headers,
      nowSec,
    });
    expect(tampered.valid).toBe(false);
    expect(tampered.reason).toBe("INVALID_HMAC_SIGNATURE");
  });
});
