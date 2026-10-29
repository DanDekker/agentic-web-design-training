// Streaming newline-delimited JSON decoder: emits each frame as soon as its
// terminating newline arrives, including frames split across chunk boundaries.
export function createJsonFrameDecoder() {
  let pending = "";
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      pending += decoder.decode(chunk, { stream: true });
      let boundary = pending.indexOf("\n");
      while (boundary !== -1) {
        const line = pending.slice(0, boundary).trim();
        pending = pending.slice(boundary + 1);
        if (line) controller.enqueue(JSON.parse(line));
        boundary = pending.indexOf("\n");
      }
    },
    flush(controller) {
      const rest = pending.trim();
      if (rest) controller.enqueue(JSON.parse(rest));
    },
  });
}
