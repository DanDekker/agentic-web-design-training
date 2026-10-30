async function loadWasmResponse(responsePromise, imports, wasmApi = WebAssembly) {
  // TODO: reject failed HTTP responses, stream only when the exact wasm MIME
  // type is served, and fall back to byte-based instantiation otherwise.
}
