/** Tiny SSE hub: one stream per client, a broadcast frame after every mutation. */
const MAX_QUEUED_FRAMES = 64;

export function createHub() {
  const clients = new Set();

  function stream() {
    let heartbeat;
    let entry;
    const cleanup = () => {
      clearInterval(heartbeat);
      if (entry) clients.delete(entry);
    };

    const body = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        entry = {
          send(frame) {
            try {
              // Notifications can be reconciled from current state on reconnect.
              // Drop a stalled subscriber instead of accumulating an unbounded queue.
              if (controller.desiredSize === null || controller.desiredSize <= 0) {
                cleanup();
                controller.error(new Error("Event stream fell behind"));
                return;
              }
              controller.enqueue(encoder.encode(frame));
            } catch {
              cleanup();
            }
          },
        };
        clients.add(entry);
        heartbeat = setInterval(() => entry.send(": ping\n\n"), 20000);
        entry.send(": connected\n\n");
      },
      cancel() {
        cleanup();
      },
    }, { highWaterMark: MAX_QUEUED_FRAMES });

    return new Response(body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  }

  function broadcast(payload) {
    const frame = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) client.send(frame);
  }

  return {
    stream,
    broadcast,
    get size() {
      return clients.size;
    },
  };
}
