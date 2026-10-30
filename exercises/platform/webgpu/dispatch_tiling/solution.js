// Plan bounded one-dimensional dispatches for a grid-stride or base-index WGSL kernel.
export function planLinearGpuDispatches(elementCount, workgroupSize, maxWorkgroupsPerDispatch) {
  for (const [name, value] of Object.entries({ elementCount, workgroupSize, maxWorkgroupsPerDispatch })) {
    if (!Number.isSafeInteger(value) || value < (name === "elementCount" ? 0 : 1)) {
      throw new RangeError(`${name} must be a safe non-negative or positive integer.`);
    }
  }

  const maxItemsPerDispatch = workgroupSize * maxWorkgroupsPerDispatch;
  if (!Number.isSafeInteger(maxItemsPerDispatch)) {
    throw new RangeError("Maximum dispatch size exceeds safe integer precision.");
  }

  const batches = [];
  for (let baseIndex = 0; baseIndex < elementCount; baseIndex += maxItemsPerDispatch) {
    const itemCount = Math.min(maxItemsPerDispatch, elementCount - baseIndex);
    batches.push({
      baseIndex,
      itemCount,
      workgroupCount: Math.ceil(itemCount / workgroupSize),
    });
  }
  return batches;
}
