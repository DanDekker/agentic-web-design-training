function createDigitalCredentialPromptCoordinator({
  credentials,
  digitalCredentialApi,
  isUserActivated,
}) {
  let inFlight = null;
  let inFlightKey = null;
  let closed = false;

  function namedError(name, message) {
    const error = new Error(message);
    error.name = name;
    return error;
  }

  function request({ operation, protocol, data, signal }) {
    if (closed) throw namedError("InvalidStateError", "coordinator is closed");

    const plan = buildDigitalCredentialRequest(operation, protocol, data, digitalCredentialApi);
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
