// Respect VideoEncoder's queue, frame ownership, keyframe cadence, and final flush.
function waitForEncoderSlot(encoder, limit, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      encoder.removeEventListener("dequeue", onDequeue);
      signal?.removeEventListener("abort", onAbort);
    };
    const settle = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const fail = (name, message) => Object.assign(new Error(message), { name });
    const onAbort = () => settle(fail("AbortError", "Encoding was cancelled."));
    const onDequeue = () => {
      if (encoder.state !== "configured") {
        settle(fail("InvalidStateError", "The video encoder is no longer configured."));
      } else if (encoder.encodeQueueSize < limit) {
        settle();
      }
    };

    encoder.addEventListener("dequeue", onDequeue);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
    else onDequeue();
  });
}

export async function encodeVideoFrames(encoder, frames, options = {}) {
  const { maxQueueSize = 4, keyFrameInterval = 60, signal } = options;
  if (!Array.isArray(frames) || !encoder || typeof encoder.encode !== "function") {
    throw new TypeError("An encoder and a frame array are required.");
  }
  if (!Number.isSafeInteger(maxQueueSize) || maxQueueSize < 1) {
    throw new RangeError("Maximum queue size must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(keyFrameInterval) || keyFrameInterval < 1) {
    throw new RangeError("Keyframe interval must be a positive safe integer.");
  }

  let submittedFrames = 0;
  let requestedKeyFrames = 0;
  let index = 0;
  try {
    for (; index < frames.length; index++) {
      const frame = frames[index];
      try {
        if (signal?.aborted) throw Object.assign(new Error("Encoding was cancelled."), { name: "AbortError" });
        if (encoder.state !== "configured") {
          throw Object.assign(new Error("The video encoder is not configured."), { name: "InvalidStateError" });
        }
        await waitForEncoderSlot(encoder, maxQueueSize, signal);
        if (encoder.state !== "configured") {
          throw Object.assign(new Error("The video encoder is no longer configured."), { name: "InvalidStateError" });
        }
        const keyFrame = submittedFrames % keyFrameInterval === 0;
        encoder.encode(frame, { keyFrame });
        submittedFrames++;
        if (keyFrame) requestedKeyFrames++;
      } finally {
        frame.close();
      }
    }
    await encoder.flush();
    return { submittedFrames, requestedKeyFrames };
  } catch (error) {
    for (let remaining = index + 1; remaining < frames.length; remaining++) frames[remaining]?.close();
    throw error;
  }
}
