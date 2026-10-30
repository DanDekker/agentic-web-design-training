// JavaScript Promise Integration (JSPI) is a WebAssembly proposal and is not
// available in every runtime. Keep the API injectable so callers can feature-test.
function createJspiBindings(imports, exports, wasmApi = WebAssembly) {
  // TODO: wrap imported JS functions with WebAssembly.Suspending and exported
  // Wasm functions with WebAssembly.promising without mutating either input.
}
