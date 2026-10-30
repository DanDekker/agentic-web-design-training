async function loadWasmResponse(responsePromise, imports, wasmApi = WebAssembly) {
  if (!wasmApi || typeof wasmApi.instantiate !== "function") {
    const error = new Error("WebAssembly instantiation is not supported by this runtime");
    error.name = "NotSupportedError";
    throw error;
  }

  const response = await responsePromise;
  if (!response || response.ok !== true) {
    const status = response?.status ?? "unknown";
    const error = new Error(`WebAssembly request failed with HTTP status ${status}`);
    error.name = "NetworkError";
    throw error;
  }

  const contentType = response.headers?.get?.("content-type") ?? "";
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  if (mediaType === "application/wasm" && typeof wasmApi.instantiateStreaming === "function") {
    return wasmApi.instantiateStreaming(Promise.resolve(response), imports);
  }

  if (typeof response.arrayBuffer !== "function") {
    throw new TypeError("WebAssembly response must provide arrayBuffer()");
  }
  const bytes = await response.arrayBuffer();
  return wasmApi.instantiate(bytes, imports);
}
