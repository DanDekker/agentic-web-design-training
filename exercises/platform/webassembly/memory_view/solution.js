function createMemoryAccessor(memory) {
  if (!memory || !memory.buffer || typeof memory.buffer.byteLength !== "number") {
    throw new TypeError("memory must expose a WebAssembly.Memory buffer");
  }

  function checkedRange(offset, length) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 0) {
      throw new RangeError("memory offset and length must be non-negative safe integers");
    }
    const buffer = memory.buffer;
    if (offset > buffer.byteLength || length > buffer.byteLength - offset) {
      throw new RangeError("memory access is out of bounds");
    }
    return { buffer, offset };
  }

  return {
    readU32(offset) {
      const range = checkedRange(offset, 4);
      return new DataView(range.buffer).getUint32(range.offset, true);
    },
    writeU32(offset, value) {
      if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
        throw new RangeError("value must be an unsigned 32-bit integer");
      }
      const range = checkedRange(offset, 4);
      new DataView(range.buffer).setUint32(range.offset, value, true);
    },
    decodeUtf8(offset, length) {
      const range = checkedRange(offset, length);
      const bytes = new Uint8Array(range.buffer, range.offset, length);
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    },
  };
}
