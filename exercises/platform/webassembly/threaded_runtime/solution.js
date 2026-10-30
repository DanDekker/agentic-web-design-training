function createWasmThreadPlan(options = {}) {
  const {
    crossOriginIsolated = globalThis.crossOriginIsolated,
    SharedArrayBufferCtor = globalThis.SharedArrayBuffer,
    hardwareConcurrency = globalThis.navigator?.hardwareConcurrency ?? 1,
    maxWorkers = 8,
    initialPages = 1,
    maximumPages = 64,
    Memory = WebAssembly.Memory,
  } = options;

  const singleThreaded = (reason) => ({ mode: "single-threaded", workerCount: 1, sharedMemory: null, reason });
  if (crossOriginIsolated !== true) return singleThreaded("cross-origin-isolation-required");
  if (typeof SharedArrayBufferCtor !== "function" || typeof Memory !== "function") {
    return singleThreaded("shared-memory-api-unavailable");
  }
  if (!Number.isSafeInteger(hardwareConcurrency) || hardwareConcurrency < 2) {
    return singleThreaded("insufficient-worker-capacity");
  }
  if (!Number.isSafeInteger(maxWorkers) || maxWorkers < 1 ||
    !Number.isSafeInteger(initialPages) || initialPages < 0 ||
    !Number.isSafeInteger(maximumPages) || maximumPages < 1 || initialPages > maximumPages || maximumPages > 65536) {
    throw new RangeError("worker and shared memory limits are invalid");
  }

  const workerCount = Math.max(1, Math.min(maxWorkers, hardwareConcurrency - 1));
  try {
    const sharedMemory = new Memory({ initial: initialPages, maximum: maximumPages, shared: true });
    if (!(sharedMemory.buffer instanceof SharedArrayBufferCtor)) {
      return singleThreaded("shared-memory-construction-failed");
    }
    return { mode: "threaded", workerCount, sharedMemory, reason: null };
  } catch {
    return singleThreaded("shared-memory-construction-failed");
  }
}
