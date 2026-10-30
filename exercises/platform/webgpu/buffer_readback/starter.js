// Copy GPU-only results into a MAP_READ staging buffer, then release it reliably.
export async function readGpuBufferBytes(device, sourceBuffer, byteLength, usage) {
  // TODO: align the GPU copy, return only requested bytes, and clean up on every path.
}
