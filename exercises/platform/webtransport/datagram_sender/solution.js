function createDatagramSender(transport, { maxAgeMs = 100, sendGroup = null, sendOrder = 0 } = {}) {
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    throw new RangeError("maxAgeMs must be a finite non-negative number");
  }
  const datagrams = transport?.datagrams;
  if (!datagrams || typeof datagrams.createWritable !== "function") {
    throw new TypeError("transport must expose WebTransport datagrams");
  }
  datagrams.outgoingMaxAge = maxAgeMs;
  const writer = datagrams.createWritable({ sendGroup, sendOrder }).getWriter();
  let closed = false;
  let closing = false;
  let closePromise;
  let sendTail = Promise.resolve();

  function toBytes(value) {
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    throw new TypeError("datagram payload must be an ArrayBuffer or an ArrayBuffer view");
  }

  return {
    send(value) {
      if (closing || closed) return Promise.reject(new TypeError("datagram sender is closed"));
      const bytes = toBytes(value);
      const operation = sendTail.then(async () => {
        if (closed) throw new TypeError("datagram sender is closed");
        if (bytes.byteLength > datagrams.maxDatagramSize) return false;
        await writer.ready;
        await writer.write(bytes);
        return true;
      });
      sendTail = operation.catch(() => {});
      return operation;
    },
    close() {
      if (closePromise) return closePromise;
      closing = true;
      closePromise = sendTail
        .then(() => writer.close())
        .finally(() => {
          closed = true;
          writer.releaseLock();
        });
      return closePromise;
    },
  };
}
