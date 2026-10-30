function callWasmWithUtf8(memory, exports, exportName, value, encoder = new TextEncoder()) {
  // TODO: encode UTF-8 bytes, allocate guest memory, refresh the memory buffer
  // after allocation, call the named export, and free the guest allocation.
}
