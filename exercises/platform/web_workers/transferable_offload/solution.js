// Chunk the workload, hand ownership of each slice to a worker, merge partials.
export function planTransferableChunks(values, workerCount) {
  const chunkSize = Math.ceil(values.length / workerCount);
  const chunks = [];
  for (let offset = 0; offset < values.length; offset += chunkSize) {
    const slice = values.slice(offset, offset + chunkSize);
    chunks.push({
      offset,
      length: slice.length,
      buffer: slice.buffer,
      transfer: [slice.buffer],
    });
  }
  return chunks;
}

export function dispatchChunks(worker, chunks) {
  for (const chunk of chunks) {
    worker.postMessage(
      { offset: chunk.offset, length: chunk.length, buffer: chunk.buffer },
      chunk.transfer,
    );
  }
  return chunks.length;
}

export function mergeChunkSums(partialSums) {
  return partialSums.reduce((total, value) => total + value, 0);
}
