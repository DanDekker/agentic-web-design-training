async function decodeLengthPrefixedStream(readable, { onFrame, maxFrameBytes = 1 << 20 } = {}) {
  if (!readable || typeof readable.getReader !== "function") {
    throw new TypeError("readable must be a ReadableStream");
  }
  if (typeof onFrame !== "function") throw new TypeError("onFrame must be a function");
  if (!Number.isSafeInteger(maxFrameBytes) || maxFrameBytes < 0 || maxFrameBytes > 0xffffffff) {
    throw new RangeError("maxFrameBytes must fit an unsigned 32-bit length");
  }

  const reader = readable.getReader();
  let pending = new Uint8Array(0);
  let frameCount = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array
        ? value
        : new Uint8Array(value.buffer ?? value, value.byteOffset ?? 0, value.byteLength ?? value.length);
      const combined = new Uint8Array(pending.byteLength + chunk.byteLength);
      combined.set(pending);
      combined.set(chunk, pending.byteLength);
      pending = combined;

      let offset = 0;
      while (pending.byteLength - offset >= 4) {
        const length = new DataView(pending.buffer, pending.byteOffset + offset, 4).getUint32(0, false);
        if (length > maxFrameBytes) throw new RangeError("frame exceeds maxFrameBytes");
        const frameEnd = offset + 4 + length;
        if (frameEnd > pending.byteLength) break;
        await onFrame(pending.slice(offset + 4, frameEnd));
        frameCount++;
        offset = frameEnd;
      }
      if (offset > 0) pending = pending.slice(offset);
    }

    if (pending.byteLength !== 0) {
      throw new SyntaxError("stream ended in the middle of a length-prefixed frame");
    }
    return frameCount;
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
