import { extname, join, normalize, sep } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

/** Serves files from `root`, refusing anything that escapes it. */
export function createStatic(root) {
  return async function serve(pathname) {
    let rel;
    try {
      rel = decodeURIComponent(pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    if (rel.endsWith("/")) rel += "index.html";
    if (rel === "" || rel === "/") rel = "/index.html";
    if (rel.includes("\0")) return new Response("Bad request", { status: 400 });

    const target = normalize(join(root, rel));
    if (target !== root && !target.startsWith(root + sep)) {
      return new Response("Forbidden", { status: 403 });
    }

    const file = Bun.file(target);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });

    return new Response(file, {
      headers: {
        "content-type": TYPES[extname(target).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  };
}
