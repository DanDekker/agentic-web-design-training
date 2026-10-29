// Stateful SSE frame parser: buffers partial frames, tolerates comment lines,
// and tracks lastEventId/retry so a reconnect can resume with Last-Event-ID.
export function createSseParser() {
  let buffer = "";
  let lastEventId = null;
  let retryMs = null;

  return {
    push(chunk) {
      buffer += chunk;
      const events = [];
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = parseFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (frame) {
          if (frame.id !== null) lastEventId = frame.id;
          if (frame.retry !== null) retryMs = frame.retry;
          events.push(frame);
        }
        boundary = buffer.indexOf("\n\n");
      }
      return events;
    },
    get lastEventId() {
      return lastEventId;
    },
    get retryMs() {
      return retryMs;
    },
  };
}

function parseFrame(raw) {
  const frame = { event: "message", data: "", id: null, retry: null };
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") frame.data += (frame.data ? "\n" : "") + value;
    else if (field === "event") frame.event = value;
    else if (field === "id") frame.id = value;
    else if (field === "retry") frame.retry = Number(value);
  }
  const empty =
    frame.data === "" && frame.event === "message" && frame.id === null && frame.retry === null;
  return empty ? null : frame;
}
