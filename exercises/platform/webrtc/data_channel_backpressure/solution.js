// Serialize writers and use RTCDataChannel's bufferedamountlow event for backpressure.
const channelTails = new WeakMap();

function payloadBytes(payload) {
  if (typeof payload === "string") return new TextEncoder().encode(payload).byteLength;
  if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) return payload.byteLength;
  throw new TypeError("Payload must be a string, ArrayBuffer, or ArrayBuffer view.");
}

function waitForBufferedBytes(channel, threshold, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", onLow);
      channel.removeEventListener("close", onClose);
      channel.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    const settle = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const namedError = (name, message) => Object.assign(new Error(message), { name });
    const onLow = () => settle();
    const onClose = () => settle(namedError("InvalidStateError", "The data channel closed while waiting to send."));
    const onError = () => settle(namedError("OperationError", "The data channel failed while waiting to send."));
    const onAbort = () => settle(namedError("AbortError", "Sending was cancelled."));

    channel.addEventListener("bufferedamountlow", onLow);
    channel.addEventListener("close", onClose);
    channel.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort, { once: true });

    if (signal?.aborted) onAbort();
    else if (channel.readyState !== "open") onClose();
    else if (channel.bufferedAmount <= threshold) onLow();
  });
}

async function sendOnceBuffered(channel, payload, bytes, options) {
  const { highWaterMark = 1024 * 1024, lowWaterMark = 256 * 1024, signal } = options;
  if (!Number.isSafeInteger(highWaterMark) || highWaterMark < 1) {
    throw new RangeError("High water mark must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(lowWaterMark) || lowWaterMark < 0 || lowWaterMark >= highWaterMark) {
    throw new RangeError("Low water mark must be non-negative and below the high water mark.");
  }
  if (bytes > highWaterMark) throw new RangeError("Payload exceeds the maximum buffered send size.");
  if (signal?.aborted) throw Object.assign(new Error("Sending was cancelled."), { name: "AbortError" });

  while (channel.bufferedAmount + bytes > highWaterMark) {
    if (channel.readyState !== "open") {
      throw Object.assign(new Error("The data channel is not open."), { name: "InvalidStateError" });
    }
    channel.bufferedAmountLowThreshold = Math.min(lowWaterMark, highWaterMark - bytes);
    await waitForBufferedBytes(channel, channel.bufferedAmountLowThreshold, signal);
  }

  if (channel.readyState !== "open") {
    throw Object.assign(new Error("The data channel is not open."), { name: "InvalidStateError" });
  }
  channel.send(payload);
  return { bytesSent: bytes, bufferedAmount: channel.bufferedAmount };
}

export async function sendWithBackpressure(channel, payload, options = {}) {
  if (!channel || typeof channel.send !== "function") throw new TypeError("A data channel is required.");
  const bytes = payloadBytes(payload);
  const previous = channelTails.get(channel) ?? Promise.resolve();
  const operation = previous.catch(() => {}).then(() => sendOnceBuffered(channel, payload, bytes, options));
  channelTails.set(channel, operation);
  try {
    return await operation;
  } finally {
    if (channelTails.get(channel) === operation) channelTails.delete(channel);
  }
}
