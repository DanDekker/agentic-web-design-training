// A checkout session with no lifecycle: no status machine, no integer minor
// units, no idempotency and no cancel guard.
export function createCheckoutSession(request) {
  return { id: "sess_1", items: request.items, total: 0 };
}

export function completeSession(session) {
  session.status = "completed";
  return session;
}
