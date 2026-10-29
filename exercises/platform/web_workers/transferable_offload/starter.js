// Every dispatch clones the whole Float64 payload into the worker.
export function dispatchReduction(worker, values, workerCount) {
  const chunkSize = Math.ceil(values.length / workerCount);
  for (let offset = 0; offset < values.length; offset += chunkSize) {
    // Structured clone copies the buffer: the main thread keeps a second copy.
    worker.postMessage({ offset, length: chunkSize, buffer: values.buffer });
  }
}

export function mergeChunkSums(partialSums) {
  return partialSums.reduce((total, value) => total + value, 0);
}
