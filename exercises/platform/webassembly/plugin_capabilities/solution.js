async function instantiateWasmPlugin(module, capabilities, wasmApi = WebAssembly) {
  if (!wasmApi?.Module || typeof wasmApi.Module.imports !== "function" ||
    typeof wasmApi.instantiate !== "function") {
    const error = new Error("WebAssembly module inspection and instantiation are required");
    error.name = "NotSupportedError";
    throw error;
  }
  if (!capabilities || typeof capabilities !== "object") {
    throw new TypeError("capabilities must be an explicit namespace map");
  }

  const requestedImports = wasmApi.Module.imports(module);
  const importObject = Object.create(null);
  for (const descriptor of requestedImports) {
    if (!descriptor || typeof descriptor.module !== "string" || typeof descriptor.name !== "string") {
      throw new TypeError("WebAssembly import metadata is malformed");
    }
    const namespace = capabilities[descriptor.module];
    if (!namespace || typeof namespace !== "object" || !Object.hasOwn(namespace, descriptor.name)) {
      const error = new Error(`WebAssembly plugin requested an ungranted import: ${descriptor.module}.${descriptor.name}`);
      error.name = "NotAllowedError";
      throw error;
    }
    if (!Object.hasOwn(importObject, descriptor.module)) {
      importObject[descriptor.module] = Object.create(null);
    }
    importObject[descriptor.module][descriptor.name] = namespace[descriptor.name];
  }

  return wasmApi.instantiate(module, importObject);
}
