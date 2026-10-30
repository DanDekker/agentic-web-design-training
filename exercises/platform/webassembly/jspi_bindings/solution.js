function createJspiBindings(imports, exports, wasmApi = WebAssembly) {
  if (!wasmApi || typeof wasmApi.Suspending !== "function" || typeof wasmApi.promising !== "function") {
    const error = new Error("WebAssembly JSPI is not supported by this runtime");
    error.name = "NotSupportedError";
    throw error;
  }
  if (!imports || typeof imports !== "object" || !exports || typeof exports !== "object") {
    throw new TypeError("imports and exports must be objects");
  }

  const wrappedImports = {};
  for (const [moduleName, namespace] of Object.entries(imports)) {
    if (!namespace || typeof namespace !== "object") {
      throw new TypeError(`import namespace ${moduleName} must be an object`);
    }
    wrappedImports[moduleName] = {};
    for (const [name, value] of Object.entries(namespace)) {
      wrappedImports[moduleName][name] = typeof value === "function"
        ? new wasmApi.Suspending(value)
        : value;
    }
  }

  const wrappedExports = {};
  for (const [name, value] of Object.entries(exports)) {
    wrappedExports[name] = typeof value === "function" ? wasmApi.promising(value) : value;
  }
  return { imports: wrappedImports, exports: wrappedExports };
}
