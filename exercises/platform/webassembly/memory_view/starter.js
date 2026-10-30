// Create safe accessors for exported WebAssembly.Memory.
// WebAssembly.Memory may replace or grow its buffer after this helper is created.
function createMemoryAccessor(memory) {
  // TODO: check every pointer and construct views from the current memory.buffer
  // inside each operation. Return readU32, writeU32 and decodeUtf8 methods.
}
