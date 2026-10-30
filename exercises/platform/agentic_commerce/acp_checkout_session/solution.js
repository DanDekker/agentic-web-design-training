// Agentic Checkout Specification (ACS) session lifecycle.
//
// A merchant hosts five HTTPS endpoints and stays the system of record:
//   POST /checkout_sessions              -> 201
//   POST /checkout_sessions/{id}         -> 200
//   GET  /checkout_sessions/{id}         -> 200 | 404
//   POST /checkout_sessions/{id}/complete-> 200
//   POST /checkout_sessions/{id}/cancel  -> 200 | 405
//
// All monetary amounts are integers in minor units, and replaying an
// Idempotency-Key with different parameters must be rejected.
const SESSION_STATUSES = ["not_ready_for_payment", "ready_for_payment", "completed", "canceled", "in_progress"];

export class CheckoutService {
  #sessions = new Map();
  #idempotency = new Map();
  #counter = 0;

  createSession(request, options = {}) {
    const items = request.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      throw httpError(400, "invalid_request", "invalid", "At least one item is required.");
    }
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw httpError(400, "invalid_request", "invalid", "$.line_items[0].quantity");
      }
    }

    const key = options.idempotencyKey;
    if (key) {
      const fingerprint = JSON.stringify({ items, buyer: request.buyer ?? null });
      const existing = this.#idempotency.get(key);
      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          throw httpError(409, "invalid_request", "idempotency_conflict", "Same Idempotency-Key used with different parameters");
        }
        return existing.session;
      }
    }

    this.#counter += 1;
    const id = `checkout_session_${this.#counter}`;
    const currency = request.currency ?? "usd";

    const lineItems = items.map((item, index) => {
      const base = Math.round(item.unitAmount * item.quantity);
      const tax = Math.round(base * 0.1);
      return {
        id: `line_item_${index + 1}`,
        item: { id: item.id, quantity: item.quantity },
        base_amount: base,
        discount: 0,
        subtotal: base,
        tax,
        total: base + tax,
      };
    });

    const itemsTotal = lineItems.reduce((sum, line) => sum + line.base_amount, 0);
    const taxTotal = lineItems.reduce((sum, line) => sum + line.tax, 0);
    const fulfillment = 100;
    const grandTotal = itemsTotal + taxTotal + fulfillment;

    const session = {
      id,
      payment_provider: { provider: "stripe", supported_payment_methods: ["card"] },
      status: "ready_for_payment",
      currency,
      line_items: lineItems,
      fulfillment_options: [
        {
          type: "shipping",
          id: "fulfillment_option_1",
          title: "Standard",
          subtitle: "Arrives in 4-5 days",
          subtotal: fulfillment,
          tax: 0,
          total: fulfillment,
        },
      ],
      fulfillment_option_id: "fulfillment_option_1",
      totals: [
        { type: "items_base_amount", display_text: "Items total", amount: itemsTotal },
        { type: "subtotal", display_text: "Subtotal", amount: itemsTotal },
        { type: "tax", display_text: "Tax", amount: taxTotal },
        { type: "fulfillment", display_text: "Shipping", amount: fulfillment },
        { type: "total", display_text: "Total", amount: grandTotal },
      ],
      messages: [],
      links: [{ rel: "self", href: `/checkout_sessions/${id}` }],
      order: null,
    };

    this.#sessions.set(id, session);
    if (key) {
      this.#idempotency.set(key, { fingerprint: JSON.stringify({ items, buyer: request.buyer ?? null }), session });
    }
    return session;
  }

  getSession(id) {
    const session = this.#sessions.get(id);
    if (!session) throw httpError(404, "invalid_request", "not_found", "Unknown checkout session.");
    return session;
  }

  updateSession(id, changes) {
    const session = this.getSession(id);
    if (session.status === "completed" || session.status === "canceled") {
      throw httpError(409, "invalid_request", "invalid", "Session is no longer updatable.");
    }
    if (Array.isArray(changes.items)) {
      const merged = this.createSession({ items: changes.items, currency: session.currency });
      session.line_items = merged.line_items;
      session.totals = merged.totals;
    }
    if (changes.fulfillment_address) session.fulfillment_address = changes.fulfillment_address;
    if (changes.fulfillment_option_id) {
      const match = session.fulfillment_options.find((option) => option.id === changes.fulfillment_option_id);
      if (!match) {
        throw httpError(400, "invalid_request", "invalid", "$.fulfillment_option_id");
      }
      session.fulfillment_option_id = match.id;
    }
    return session;
  }

  completeSession(id, payload = {}) {
    const session = this.getSession(id);
    if (session.status === "completed") {
      throw httpError(409, "invalid_request", "invalid", "Session is already completed.");
    }
    if (session.status === "canceled") {
      throw httpError(409, "invalid_request", "invalid", "Session is canceled.");
    }
    if (!payload.payment_data) {
      throw httpError(400, "invalid_request", "invalid", "$.payment_data");
    }
    session.status = "completed";
    session.order = {
      id: `order_${session.id.replace("checkout_session_", "")}`,
      checkout_session_id: session.id,
      permalink_url: `/orders/${session.id.replace("checkout_session_", "")}`,
    };
    return session;
  }

  cancelSession(id) {
    const session = this.getSession(id);
    if (session.status === "completed" || session.status === "canceled") {
      throw httpError(405, "invalid_request", "invalid", "Session cannot be canceled.");
    }
    session.status = "canceled";
    return session;
  }
}

function httpError(status, type, code, message) {
  const error = new Error(message);
  error.status = status;
  error.type = type;
  error.code = code;
  return error;
}

export { SESSION_STATUSES };
