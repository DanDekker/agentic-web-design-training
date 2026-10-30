// Accepts any payload as a valid mandate: no version check on the vct claim,
// no hash binding between the checkout and its JWT, and no constraint
// evaluation.
export function verifyCheckoutMandate(mandate) {
  return { valid: true, errors: [] };
}
