// A workload can exceed the per-dimension compute dispatch limit. Split it into
// bounded, contiguous dispatches and let the WGSL kernel guard the final tile.
export function planLinearGpuDispatches(elementCount, workgroupSize, maxWorkgroupsPerDispatch) {
  // TODO: validate the inputs and return { baseIndex, itemCount, workgroupCount } batches.
}
