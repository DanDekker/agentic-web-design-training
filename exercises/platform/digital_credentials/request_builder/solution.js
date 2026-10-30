function buildDigitalCredentialRequest(operation, protocol, data, digitalCredentialApi) {
  if (operation !== "get" && operation !== "create") {
    throw new TypeError("operation must be get or create");
  }
  if (typeof protocol !== "string" || protocol.trim() === "") {
    throw new TypeError("protocol must be a non-empty string");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("data must be a JSON object");
  }
  if (!digitalCredentialApi || typeof digitalCredentialApi.userAgentAllowsProtocol !== "function") {
    return null;
  }
  if (!digitalCredentialApi.userAgentAllowsProtocol(protocol)) return null;

  let serialized;
  try {
    serialized = JSON.stringify(data);
  } catch {
    throw new TypeError("data must be JSON serializable");
  }
  if (typeof serialized !== "string") throw new TypeError("data must be JSON serializable");

  const requestData = JSON.parse(serialized);
  return {
    operation,
    options: {
      digital: {
        requests: [{ protocol, data: requestData }],
      },
    },
  };
}
