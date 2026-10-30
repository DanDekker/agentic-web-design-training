// Execute a compiled MLGraph using newly allocated named MLTensors.
// inputBindings: { name: { descriptor, data } }, outputDescriptors: { name: descriptor }
async function runWebNNInference(context, graph, inputBindings, outputDescriptors) {
  // TODO: allocate tensors with least-privilege readable/writable permissions,
  // write inputs, dispatch once, await readTensor, and destroy owned tensors.
}
