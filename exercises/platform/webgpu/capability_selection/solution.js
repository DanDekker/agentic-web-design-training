// Build a portable device request without accidentally enabling unsupported capabilities.
function notSupported(message) {
  const error = new Error(message);
  error.name = "NotSupportedError";
  return error;
}

function readPositiveLimit(name, value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

export function planGpuDeviceRequest(adapter, requirements = {}) {
  const availableFeatures = adapter.features;
  const availableLimits = adapter.limits;
  const requiredFeatures = requirements.requiredFeatures ?? [];
  const optionalFeatureGroups = requirements.optionalFeatureGroups ?? [];
  const requiredLimits = requirements.requiredLimits ?? {};
  const optionalLimits = requirements.optionalLimits ?? {};

  const selected = new Set();
  for (const feature of requiredFeatures) {
    if (typeof feature !== "string" || !availableFeatures?.has(feature)) {
      throw notSupported(`Required GPU feature '${feature}' is unavailable.`);
    }
    selected.add(feature);
  }

  for (const group of optionalFeatureGroups) {
    if (!Array.isArray(group)) throw new TypeError("Optional feature groups must be arrays.");
    if (group.every((feature) => availableFeatures?.has(feature))) {
      for (const feature of group) selected.add(feature);
    }
  }

  const requestedLimits = {};
  for (const [name, value] of Object.entries(requiredLimits)) {
    readPositiveLimit(name, value);
    if (!Number.isSafeInteger(availableLimits?.[name]) || value > availableLimits[name]) {
      throw notSupported(`Required GPU limit '${name}' is unavailable.`);
    }
    requestedLimits[name] = value;
  }

  for (const [name, value] of Object.entries(optionalLimits)) {
    readPositiveLimit(name, value);
    const available = availableLimits?.[name];
    if (Number.isSafeInteger(available) && available > 0) {
      requestedLimits[name] = Math.min(value, available);
    }
  }

  return {
    requiredFeatures: [...selected].sort(),
    requiredLimits: requestedLimits,
  };
}
