// AP2 (Agent Payments Protocol) mandate verification.
//
// A closed Checkout Mandate binds a merchant-signed Checkout JWT to the mandate
// with a cryptographic hash, so the Merchant can prove the checkout it approved
// is the checkout it was sent. The hash is base64url-encoded and, unless the
// SD-JWT declares another algorithm, is a SHA-256 digest of the checkout_jwt
// field value.
//
// Each mandate type identifies its schema with a vct claim whose value carries
// a numeric version suffix (mandate.checkout.1, mandate.checkout.open.1). The
// exact string, including the suffix, must match.
export const CHECKOUT_VCT = "mandate.checkout.1";
export const OPEN_CHECKOUT_VCT = "mandate.checkout.open.1";

export function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function computeCheckoutHash(checkoutJwt) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checkoutJwt));
  return base64UrlEncode(new Uint8Array(digest));
}

// Verifies a closed Checkout Mandate against the open mandate that authorised
// it. Returns { valid, errors }.
export async function verifyCheckoutMandate(mandate, options = {}) {
  const errors = [];
  const { openMandate = null, now = Date.now(), clockSkewSeconds = 60 } = options;

  if (!mandate || typeof mandate !== "object") {
    return { valid: false, errors: ["Mandate is not an object."] };
  }

  // 1. Versioned type claim.
  if (mandate.vct !== CHECKOUT_VCT) {
    errors.push(`Unexpected vct '${mandate.vct}'.`);
  }

  // 2. Required claims.
  for (const claim of ["checkout_jwt", "checkout_hash"]) {
    if (typeof mandate[claim] !== "string" || mandate[claim].length === 0) {
      errors.push(`Missing '${claim}' claim.`);
    }
  }

  // 3. Expiry.
  if (typeof mandate.exp === "number" && mandate.exp * 1000 + clockSkewSeconds * 1000 < now) {
    errors.push("Mandate has expired.");
  }

  // 4. The checkout hash must bind this mandate to this checkout JWT.
  if (typeof mandate.checkout_jwt === "string" && typeof mandate.checkout_hash === "string") {
    const recomputed = await computeCheckoutHash(mandate.checkout_jwt);
    if (recomputed !== mandate.checkout_hash) {
      errors.push("checkout_hash does not match checkout_jwt.");
    }
  }

  // 5. The open mandate's constraints must be satisfied by the closed one.
  if (openMandate) {
    if (openMandate.vct !== OPEN_CHECKOUT_VCT) {
      errors.push(`Unexpected open vct '${openMandate.vct}'.`);
    }
    for (const constraint of openMandate.constraints ?? []) {
      if (constraint.type === "checkout.allowed_merchants") {
        const revealed = constraint.allowed ?? [];
        const merchant = mandate.merchant;
        const permitted = revealed.some(
          (entry) => entry?.website && merchant?.website === entry.website,
        );
        if (!permitted) {
          errors.push("Merchant is not present in the revealed allowed merchants.");
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
