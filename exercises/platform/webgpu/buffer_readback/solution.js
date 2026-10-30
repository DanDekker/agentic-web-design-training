// Read GPU results back without mapping a STORAGE buffer or leaking staging buffers.
export async function readGpuBufferBytes(device, sourceBuffer, byteLength, usage) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
    throw new RangeError("Byte length must be a non-negative safe integer.");
  }
  if (byteLength === 0) return new Uint8Array(0);

  const copySize = Math.ceil(byteLength / 4) * 4;
  if (!Number.isSafeInteger(copySize) || !Number.isSafeInteger(sourceBuffer?.size) || copySize > sourceBuffer.size) {
    throw new RangeError("The aligned readback must fit inside the source GPU buffer.");
  }

  const staging = device.createBuffer({
    size: copySize,
    usage: usage.COPY_DST | usage.MAP_READ,
  });
  let mapped = false;

  try {
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(sourceBuffer, 0, staging, 0, copySize);
    device.queue.submit([encoder.finish()]);
    await staging.mapAsync(usage.MAP_READ);
    mapped = true;
    return new Uint8Array(staging.getMappedRange(), 0, byteLength).slice();
  } finally {
    try {
      if (mapped) staging.unmap();
    } finally {
      staging.destroy();
    }
  }
}
