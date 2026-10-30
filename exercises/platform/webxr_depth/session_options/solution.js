function buildDepthAwareXRSessionOptions({
  required = false,
  usagePreference = ["cpu-optimized", "gpu-optimized"],
  dataFormatPreference = ["luminance-alpha", "float32", "unsigned-short"],
  depthTypeRequest = ["smooth", "raw"],
  matchDepthView = true,
} = {}) {
  const allowedUsages = new Set(["cpu-optimized", "gpu-optimized"]);
  const allowedFormats = new Set(["luminance-alpha", "float32", "unsigned-short"]);
  const allowedTypes = new Set(["raw", "smooth"]);
  if (!Array.isArray(usagePreference) || usagePreference.length === 0 || usagePreference.some((value) => !allowedUsages.has(value))) {
    throw new TypeError("usagePreference must contain supported depth usages");
  }
  if (!Array.isArray(dataFormatPreference) || dataFormatPreference.length === 0 || dataFormatPreference.some((value) => !allowedFormats.has(value))) {
    throw new TypeError("dataFormatPreference must contain supported formats");
  }
  if (!Array.isArray(depthTypeRequest) || depthTypeRequest.some((value) => !allowedTypes.has(value))) {
    throw new TypeError("depthTypeRequest must contain supported depth types");
  }
  if (typeof required !== "boolean" || typeof matchDepthView !== "boolean") {
    throw new TypeError("required and matchDepthView must be booleans");
  }

  return {
    [required ? "requiredFeatures" : "optionalFeatures"]: ["depth-sensing"],
    depthSensing: {
      usagePreference: [...usagePreference],
      dataFormatPreference: [...dataFormatPreference],
      depthTypeRequest: [...depthTypeRequest],
      matchDepthView,
    },
  };
}

async function requestDepthAwareXRSession(xr, mode, options = {}) {
  if (!xr || typeof xr.requestSession !== "function") {
    throw new TypeError("WebXR requestSession is unavailable");
  }
  const sessionOptions = buildDepthAwareXRSessionOptions(options);
  return xr.requestSession(mode, sessionOptions);
}
