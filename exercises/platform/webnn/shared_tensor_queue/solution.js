function createWebNNInferenceQueue(context, graph, inputTensors, outputTensors) {
  if (!context || typeof context.writeTensor !== "function" ||
    typeof context.dispatch !== "function" || typeof context.readTensor !== "function" || !graph) {
    throw new TypeError("a graph and WebNN execution context are required");
  }
  if (!inputTensors || !outputTensors || Object.keys(inputTensors).length === 0 || Object.keys(outputTensors).length === 0) {
    throw new TypeError("named input and output tensors are required");
  }

  const inputNames = Object.keys(inputTensors);
  let tail = Promise.resolve();
  let accepting = true;
  let disposePromise;

  function snapshot(source) {
    if (source instanceof ArrayBuffer ||
      (typeof SharedArrayBuffer !== "undefined" && source instanceof SharedArrayBuffer)) {
      return source.slice(0);
    }
    if (ArrayBuffer.isView(source)) {
      const copy = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
      return source instanceof DataView ? new DataView(copy) : new source.constructor(source);
    }
    throw new TypeError("WebNN input must be an ArrayBuffer or an ArrayBuffer view");
  }

  function run(inputData) {
    if (!accepting) return Promise.reject(new Error("WebNN inference queue is closing"));
    if (!inputData || typeof inputData !== "object" ||
      inputNames.some((name) => !Object.hasOwn(inputData, name)) ||
      Object.keys(inputData).some((name) => !Object.hasOwn(inputTensors, name))) {
      return Promise.reject(new TypeError("inputData must provide exactly the named input tensors"));
    }
    const copiedInputs = Object.fromEntries(inputNames.map((name) => [name, snapshot(inputData[name])]));
    const operation = tail.then(async () => {
      for (const name of inputNames) context.writeTensor(inputTensors[name], copiedInputs[name]);
      context.dispatch(graph, inputTensors, outputTensors);
      const results = await Promise.all(
        Object.entries(outputTensors).map(async ([name, tensor]) => [name, await context.readTensor(tensor)]),
      );
      return Object.fromEntries(results);
    });
    tail = operation.catch(() => {});
    return operation;
  }

  function dispose() {
    if (!disposePromise) {
      accepting = false;
      disposePromise = tail;
    }
    return disposePromise;
  }

  return { run, dispose };
}
