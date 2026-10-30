/** Route API requests and static files, keeping event streams open between heartbeats. */
export function createRequestHandler({ handleApi, serveStatic }) {
  return async function fetch(req, server) {
    const { pathname, searchParams } = new URL(req.url);
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/oauth/") ||
      pathname.startsWith("/.well-known/")
    ) {
      if (pathname === "/api/events" && req.method === "GET") server.timeout(req, 0);
      if ((pathname === "/api/curriculum/benchmark/run-all" && req.method === "POST") ||
          (pathname === "/api/curriculum/benchmark" && req.method === "GET" &&
            (searchParams.get("run") === "true" || searchParams.get("format") === "markdown"))) {
        server.timeout(req, 120);
      }
      return handleApi(req);
    }
    return serveStatic(pathname);
  };
}
