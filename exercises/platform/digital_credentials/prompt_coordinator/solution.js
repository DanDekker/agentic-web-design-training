function createDigitalCredentialPromptCoordinator({
  credentials,
  digitalCredentialApi,
  isUserActivated,
}) {
  let inFlight = null;
  let inFlightKey = null;
  let closed = false;

  function buildRequestPlan(operation, protocol, data) {
    if (operation !== "get" && operation !== "create") {
      throw new TypeError("operation must be get or create");
    }
    if (typeof protocol !== "string" || protocol.trim() === "" || !data || typeof data !== "object" || Array.isArray(data)) {
      throw new TypeError("a protocol and JSON request object are required");
    }
    if (!digitalCredentialApi || typeof digitalCredentialApi.userAgentAllowsProtocol !== "function" ||
        !digitalCredentialApi.userAgentAllowsProtocol(protocol)) return null;

    let serialized;
    try { serialized = JSON.stringify(data); }
    catch { throw new TypeError("data must be JSON serializable"); }
    if (typeof serialized !== "string") throw new TypeError("data must be JSON serializable");

    return {
      operation,
      options: { digital: { requests: [{ protocol, data: JSON.parse(serialized) }] } },
    };
  }

  function namedError(name, message) {
    const error = new Error(message);
    error.name = name;
    return error;
  }

  function request({ operation, protocol, data, signal }) {
    if (closed) throw namedError("InvalidStateError", "coordinator is closed");

    const plan = buildRequestPlan(operation, protocol, data);
    if (!plan) return Promise.resolve(null);
    if (typeof isUserActivated !== "function" || !isUserActivated()) {
      throw namedError("NotAllowedError", "request must start from a user activation");
    }
    if (!credentials || typeof credentials[operation] !== "function") {
      throw namedError("NotSupportedError", "credential operation is unavailable");
    }

    const requestData = plan.options.digital.requests[0].data;
    const key = JSON.stringify([operation, protocol, requestData]);
    if (inFlight) {
      if (key === inFlightKey) return inFlight;
      throw namedError("InvalidStateError", "another credential chooser is already open");
    }

    if (signal !== undefined) plan.options.signal = signal;
    let resolveRequest;
    let rejectRequest;
    inFlight = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    inFlightKey = key;
    const sharedPromise = inFlight;
    sharedPromise.then(
      () => {
        if (inFlight === sharedPromise) {
          inFlight = null;
          inFlightKey = null;
        }
      },
      () => {
        if (inFlight === sharedPromise) {
          inFlight = null;
          inFlightKey = null;
        }
      },
    );

    try {
      // Call synchronously so the browser sees the original transient activation.
      Promise.resolve(credentials[operation](plan.options)).then(resolveRequest, rejectRequest);
    } catch (error) {
      rejectRequest(error);
    }
    return sharedPromise;
  }

  return {
    request,
    close() {
      closed = true;
    },
  };
}
