async function runWebNNInference(context, graph, inputBindings, outputDescriptors) {
  if (!context || typeof context.createTensor !== "function" ||
    typeof context.writeTensor !== "function" || typeof context.dispatch !== "function" ||
    typeof context.readTensor !== "function") {
    throw new TypeError("context must implement the WebNN tensor execution methods");
  }
  if (!graph || !inputBindings || !outputDescriptors) {
    throw new TypeError("graph, inputBindings and outputDescriptors are required");
  }

  const ownedTensors = [];
  const inputs = {};
  const outputs = {};
  try {
    for (const [name, binding] of Object.entries(inputBindings)) {
      if (!binding?.descriptor || binding.data == null) throw new TypeError(`input ${name} needs a descriptor and data`);
      const tensor = await context.createTensor({ ...binding.descriptor, readable: false, writable: true });
      ownedTensors.push(tensor);
      inputs[name] = tensor;
      context.writeTensor(tensor, binding.data);
    }
    for (const [name, descriptor] of Object.entries(outputDescriptors)) {
      if (!descriptor || typeof descriptor !== "object") throw new TypeError(`output ${name} needs a descriptor`);
      const tensor = await context.createTensor({ ...descriptor, readable: true, writable: false });
      ownedTensors.push(tensor);
      outputs[name] = tensor;
    }

    context.dispatch(graph, inputs, outputs);
    const namedResults = await Promise.all(
      Object.entries(outputs).map(async ([name, tensor]) => [name, await context.readTensor(tensor)]),
    );
    return Object.fromEntries(namedResults);
  } finally {
    for (const tensor of ownedTensors.reverse()) {
      try {
        tensor.destroy();
      } catch {
        // A lost WebNN context destroys its tensors as part of the loss steps.
      }
    }
  }
}
