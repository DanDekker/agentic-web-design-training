// Lazily build and cache a WebNN inference session; replace it after context loss.
// createSession() returns { context, graph, ... } and operation(session) performs inference.
function createWebNNSessionRunner(createSession, { maxAttempts = 2 } = {}) {
  // TODO: share in-flight session creation, watch context.lost, ignore stale
  // generation results, and retry only a bounded number of times.
}
