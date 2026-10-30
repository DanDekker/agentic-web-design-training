function callWasmWithUtf8(memory, exports, exportName, value, encoder = new TextEncoder()) {
  if (!memory || !memory.buffer || typeof memory.buffer.byteLength !== "number") {
    throw new TypeError("memory must expose a WebAssembly.Memory buffer");
  }
  if (!exports || typeof exports.alloc !== "function" || typeof exports.free !== "function") {
    throw new TypeError("exports must provide alloc() and free() functions");
  }
  if (typeof exportName !== "string" || typeof exports[exportName] !== "function" ||
    exportName === "alloc" || exportName === "free") {
    throw new TypeError("exportName must identify a callable guest function");
  }
  if (typeof value !== "string" || !encoder || typeof encoder.encode !== "function") {
    throw new TypeError("value must be a string and encoder must provide encode()");
  }

  const bytes = encoder.encode(value);
  const pointer = exports.alloc(bytes.byteLength);
  if (!Number.isSafeInteger(pointer) || pointer < 0) {
    throw new RangeError("allocator returned an unsafe guest pointer");
  }

  try {
    const buffer = memory.buffer;
    if (!buffer || typeof buffer.byteLength !== "number" || pointer > buffer.byteLength ||
      bytes.byteLength > buffer.byteLength - pointer) {
      throw new RangeError("allocated guest string is outside WebAssembly memory");
    }
    new Uint8Array(buffer, pointer, bytes.byteLength).set(bytes);
    return exports[exportName](pointer, bytes.byteLength);
  } finally {
    exports.free(pointer);
  }
}
