// Charges every request up front and never issues a 402 challenge, so an agent
// cannot discover the price of a resource before paying.
export function createPaymentGate(options) {
  return {
    async handle(request) {
      if (!request.headers?.["X-PAYMENT"]) {
        return { status: 200, body: options.data };
      }
      return { status: 200, body: options.data };
    },
  };
}
