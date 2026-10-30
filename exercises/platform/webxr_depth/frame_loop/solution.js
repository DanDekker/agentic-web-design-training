function startXRDepthFrameLoop({ session, referenceSpace, binding, onFrame, onError = () => {} }) {
  if (!session || typeof session.requestAnimationFrame !== "function" || typeof session.addEventListener !== "function") {
    throw new TypeError("an active XRSession is required");
  }
  if (typeof onFrame !== "function" || !binding || typeof binding.getDepthInformation !== "function") {
    throw new TypeError("binding and onFrame are required");
  }

  let active = true;
  let frameRequestId = null;

  function stop() {
    if (!active) return;
    active = false;
    if (frameRequestId !== null) session.cancelAnimationFrame?.(frameRequestId);
    frameRequestId = null;
    session.removeEventListener?.("end", onSessionEnd);
  }

  function fail(error) {
    stop();
    try { onError(error); } catch { /* Preserve the original rendering error. */ }
  }

  function onSessionEnd() {
    stop();
  }

  function tick(time, frame) {
    if (!active) return;
    try {
      frameRequestId = session.requestAnimationFrame(tick);
      const pose = frame.getViewerPose(referenceSpace);
      if (!pose) return;
      const depthByView = pose.views.map((view) => binding.getDepthInformation(view) || null);
      const result = onFrame({ time, frame, pose, depthByView });
      if (result && typeof result.then === "function") {
        throw new TypeError("onFrame must be synchronous to avoid stale XR frame queues");
      }
    } catch (error) {
      fail(error);
    }
  }

  session.addEventListener("end", onSessionEnd, { once: true });
  frameRequestId = session.requestAnimationFrame(tick);
  return { stop };
}
