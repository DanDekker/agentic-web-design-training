// Serialize inference runs that share one set of writable input/output MLTensors.
// Shared tensors cannot be written or read by overlapping dispatches safely.
function createWebNNInferenceQueue(context, graph, inputTensors, outputTensors) {
  // TODO: snapshot inputs at call time, queue write -> dispatch -> awaited reads,
  // and stop accepting work while allowing already accepted runs to drain.
}
