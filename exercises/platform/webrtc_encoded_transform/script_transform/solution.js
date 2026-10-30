function attachRtcScriptTransform(endpoint, worker, options = {}, ScriptTransformConstructor) {
  if (!endpoint || !("transform" in endpoint)) {
    throw new TypeError("endpoint must expose an RTCRtp transform slot");
  }
  if (typeof ScriptTransformConstructor !== "function") {
    const error = new Error("RTCRtpScriptTransform is unavailable");
    error.name = "NotSupportedError";
    throw error;
  }
  if (!worker || !options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("worker and a serializable options object are required");
  }

  const transform = new ScriptTransformConstructor(worker, options);
  endpoint.transform = transform;
  return transform;
}
