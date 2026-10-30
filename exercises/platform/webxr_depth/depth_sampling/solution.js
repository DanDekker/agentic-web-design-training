function readXrDepthSample(depthInformation, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    throw new RangeError("normalized view coordinates must be between zero and one");
  }
  if (!depthInformation) return null;
  if (typeof depthInformation.getDepthInMeters !== "function") {
    const error = new Error("CPU depth sampling is unavailable for this information object");
    error.name = "NotSupportedError";
    throw error;
  }
  const depthMeters = depthInformation.getDepthInMeters(x, y);
  if (!Number.isFinite(depthMeters) || depthMeters <= 0) return null;
  return depthMeters;
}
