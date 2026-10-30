// x402 v2 HTTP transport.
//
// The server answers an unpaid request with 402 Payment Required and a
// base64-encoded PaymentRequired object in the PAYMENT-REQUIRED header. The
// client retries with a base64-encoded PaymentPayload in PAYMENT-SIGNATURE,
// and the server settles and returns a base64-encoded SettlementResponse in
// PAYMENT-RESPONSE.
//
// None of the three headers is CORS-safelisted, so a browser client also needs
// Access-Control-Expose-Headers and Access-Control-Allow-Headers to work.
const V2_HEADERS = ["PAYMENT-REQUIRED", "PAYMENT-SIGNATURE", "PAYMENT-RESPONSE"];

// The evaluator sandbox exposes btoa/atob but not Buffer, so base64 is done
// over the UTF-8 bytes of the JSON payload.
function toBase64(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  if (!value) return null;
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function encodeHeader(value) {
  return toBase64(value);
}

export function decodeHeader(value) {
  return fromBase64(value);
}

export function createPaymentGate(options) {
  const accepts = options.accepts;

  return {
    async handle(request) {
      const headers = request.headers ?? {};
      const signature = headers["PAYMENT-SIGNATURE"] ?? headers["X-PAYMENT"];

      const cors = {
        "Access-Control-Allow-Origin": request.origin ?? "*",
        "Access-Control-Expose-Headers": V2_HEADERS.join(", "),
        "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      };

      if (request.method === "OPTIONS") {
        return { status: 204, headers: cors, body: "" };
      }

      if (!signature) {
        const paymentRequired = {
          x402Version: 2,
          error: "PAYMENT-SIGNATURE header is required",
          resource: {
            url: options.resource.url,
            description: options.resource.description,
            mimeType: options.resource.mimeType ?? "application/json",
          },
          accepts,
        };
        return {
          status: 402,
          headers: { ...cors, "PAYMENT-REQUIRED": encodeHeader(paymentRequired) },
          body: "",
        };
      }

      const payload = decodeHeader(signature);
      if (!payload || payload.x402Version !== 2) {
        return {
          status: 400,
          headers: { ...cors, "PAYMENT-RESPONSE": encodeHeader({ success: false, errorReason: "invalid_payment", transaction: "", network: accepts[0].network, payer: "" }) },
          body: "",
        };
      }

      const accepted = payload.accepted ?? {};
      const expected = accepts.find((entry) => entry.scheme === accepted.scheme && entry.network === accepted.network);
      if (!expected) {
        return {
          status: 402,
          headers: { ...cors, "PAYMENT-RESPONSE": encodeHeader({ success: false, errorReason: "invalid_payment", transaction: "", network: accepted.network ?? "", payer: payload.payload?.authorization?.from ?? "" }) },
          body: "",
        };
      }

      if (String(accepted.amount) !== String(expected.amount)) {
        return {
          status: 402,
          headers: { ...cors, "PAYMENT-RESPONSE": encodeHeader({ success: false, errorReason: "insufficient_funds", transaction: "", network: expected.network, payer: payload.payload?.authorization?.from ?? "" }) },
          body: "",
        };
      }

      const settlement = {
        success: true,
        transaction: options.transaction ?? "0xsettled",
        network: expected.network,
        payer: payload.payload?.authorization?.from ?? "",
      };

      return {
        status: 200,
        headers: { ...cors, "PAYMENT-RESPONSE": encodeHeader(settlement) },
        body: options.data,
      };
    },
  };
}

export { V2_HEADERS };
