async function instantiateWasmPlugin(module, capabilities, wasmApi = WebAssembly) {
  // TODO: inspect imports, copy only explicitly granted capabilities requested
  // by the module, and reject missing grants before instantiating it.
}
