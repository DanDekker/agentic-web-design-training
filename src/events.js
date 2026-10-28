/** Tiny SSE hub: one stream per client, a broadcast frame after every mutation. */
export function createHub() {
  const clients = new Set();

  function stream() {
    let heartbeat;
    let entry;

    const body = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        entry = {
          send(frame) {
            try {
              controller.enqueue(encoder.encode(frame));
            } catch {
              clients.delete(entry);
            }
          },
        };
        clients.add(entry);
        entry.send(": connected\n\n");
        heartbeat = setInterval(() => entry.send(": ping\n\n"), 20000);
      },
      cancel() {
        clearInterval(heartbeat);
        if (entry) clients.delete(entry);
      },
    });

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
