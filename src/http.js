/** Route API requests and static files, keeping event streams open between heartbeats. */
export function createRequestHandler({ handleApi, serveStatic, hub }) {
  return async function fetch(req, server) {
    const { pathname } = new URL(req.url);
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/oauth/") ||
      pathname.startsWith("/.well-known/")
    ) {
      if (pathname === "/api/events" && req.method === "GET") server.timeout(req, 0);
      const res = await handleApi(req);
      if (!["GET", "HEAD"].includes(req.method) && res.status < 400) {
        hub.broadcast({ type: "state", at: Date.now() });
      }
      return res;
    }
    return serveStatic(pathname);
  };
}
