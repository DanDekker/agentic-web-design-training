function pipeEncodedFrames(transformer, transformFrame, { signal } = {}) {
  if (!transformer || !transformer.readable || !transformer.writable || typeof transformFrame !== "function") {
    throw new TypeError("a script transformer and frame callback are required");
  }

  const frameTransform = new TransformStream({
    transform(frame, controller) {
      const output = transformFrame(frame);
      if (output && typeof output.then === "function") {
        throw new TypeError("encoded-frame work must be synchronous to avoid unbounded latency");
      }
      if (output === null || output === undefined) return;
      if (output !== frame) throw new TypeError("encoded transforms must preserve frame ownership");
      controller.enqueue(frame);
    },
  });
  const readable = transformer.readable.pipeThrough(frameTransform);
  return readable.pipeTo(transformer.writable, signal ? { signal } : undefined);
}
