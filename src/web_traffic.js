/**
 * First-Party Web Cookies (RFC 6265bis, CHIPS, W3C DBSC), Client Storage Data &
 * HTTP Traffic Engineering (RFC 9111 Cache, IETF RateLimit, W3C traceparent, RFC 9218 Priority) Engine.
 */

import { createHmac, randomBytes } from "node:crypto";

export const RFC6265BIS_MAX_AGE_SECONDS = 400 * 86_400; // 34,560,000s (400 days)
export const MAX_COOKIE_WIRE_BYTES = 4096;

export const WEB_COOKIES_DATA_TRAFFIC_CATALOG = Object.freeze({
  cookieStandards: [
    {
      id: "rfc6265bis",
      name: "RFC 6265bis Cookie Prefixes & Lifetime Limits",
      invariants: [
        "__Host- requires Secure, Path=/, and no Domain attribute",
        "__Secure- requires Secure attribute",
        "SameSite=None requires Secure attribute",
        "Max-Age / Expires capped at 400 days (34,560,000 seconds)",
      ],
    },
    {
      id: "chips-partitioned",
      name: "CHIPS (Cookies Having Independent Partitioned State)",
      invariants: [
        "Partitioned attribute requires Secure and Path=/",
        "Isolates third-party embedded cookies by (top-level site, frame origin) double-key",
      ],
    },
    {
      id: "w3c-dbsc",
      name: "W3C Device Bound Session Credentials (DBSC)",
      invariants: [
        "Binds short-lived __Host-dbsc_sid cookies to TPM / Secure Enclave hardware keys",
        "Challenges refresh requests with Sec-Session-Challenge and verifies Sec-Session-Response PoP",
        "Revokes compromised sessions with Clear-Site-Data: \"cookies\", \"storage\"",
      ],
    },
  ],
  clientStorageEngines: [
    {
      id: "indexeddb",
      name: "IndexedDB Transactional Object Stores",
      bestFor: "Structured datasets, compound index range cursors, versioned schema migrations",
    },
    {
      id: "opfs",
      name: "Origin Private File System (OPFS)",
      bestFor: "High-throughput binary files, SQLite WASM VFS, synchronous worker file access",
    },
    {
      id: "cache-storage",
      name: "Service Worker CacheStorage API",
      bestFor: "Request/Response asset caching, offline navigation fallbacks, Stale-While-Revalidate",
    },
    {
      id: "broadcast-weblocks",
      name: "BroadcastChannel + Web Locks API",
      bestFor: "Multi-tab state synchronization, single-leader election, Lamport clock ordering",
    },
  ],
  httpTrafficSpecs: [
    {
      id: "rfc9111-http-caching",
      name: "RFC 9111 HTTP Caching & RFC 5861 stale-while-revalidate",
      headers: ["Cache-Control", "ETag", "If-None-Match", "Vary", "Age"],
    },
    {
      id: "ietf-ratelimit",
      name: "IETF RateLimit Header Fields for HTTP",
      headers: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset", "RateLimit-Policy", "Retry-After"],
    },
    {
      id: "w3c-trace-context-server-timing",
      name: "W3C Trace Context (traceparent) & Server-Timing",
      headers: ["traceparent", "tracestate", "Server-Timing", "Priority"],
    },
  ],
});

/**
 * Audits and serializes an RFC 6265bis / CHIPS / DBSC Set-Cookie configuration.
 */
export function auditAndSerializeWebCookie({
  name = "__Host-gauntlet-web_session",
  value = "sess_live_token",
  path = "/",
  domain = "",
  maxAgeSec = 604800,
  secure = true,
  httpOnly = true,
  sameSite = "Lax",
  partitioned = false,
  signingSecret = "",
  kid = "k_2026_01",
} = {}) {
  const cleanName = String(name || "").trim();
  if (!cleanName || !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(cleanName)) {
    throw new Error("Cookie name must contain valid RFC 6265 token characters.");
  }

  const violations = [];
  const warnings = [];
  const isHostPrefix = cleanName.startsWith("__Host-");
  const isSecurePrefix = cleanName.startsWith("__Secure-");

  if (isHostPrefix) {
    if (!secure) violations.push("__Host- prefix requires Secure=true");
    if (domain) violations.push("__Host- prefix forbids Domain attribute");
    if (path !== "/") violations.push("__Host- prefix requires Path=/");
  }

  if (isSecurePrefix && !secure) {
    violations.push("__Secure- prefix requires Secure=true");
  }

  if (sameSite === "None" && !secure) {
    violations.push("SameSite=None requires Secure=true");
  }

  if (partitioned) {
    if (!secure) violations.push("CHIPS Partitioned attribute requires Secure=true");
    if (path !== "/") violations.push("CHIPS Partitioned attribute requires Path=/");
  }

  let effectiveMaxAge = Number(maxAgeSec);
  if (!Number.isFinite(effectiveMaxAge) || effectiveMaxAge < 0) {
    effectiveMaxAge = 0;
  } else {
    effectiveMaxAge = Math.floor(effectiveMaxAge);
    if (effectiveMaxAge > RFC6265BIS_MAX_AGE_SECONDS) {
      effectiveMaxAge = RFC6265BIS_MAX_AGE_SECONDS;
      warnings.push("Max-Age clamped to RFC 6265bis 400-day limit (34,560,000s)");
    }
  }

  let wireValue = encodeURIComponent(String(value ?? ""));
  if (signingSecret) {
    const mac = createHmac("sha256", String(signingSecret))
      .update(`${cleanName}|${kid}|${wireValue}`)
      .digest("base64url");
    wireValue = `v1.${kid}.${wireValue}.${mac}`;
  }

  const parts = [`${cleanName}=${wireValue}`];
  if (domain) parts.push(`Domain=${String(domain).trim().toLowerCase()}`);
  parts.push(`Path=${path}`);
  parts.push(`Max-Age=${effectiveMaxAge}`);
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  parts.push(`SameSite=${sameSite}`);
  if (partitioned) parts.push("Partitioned");

  const header = parts.join("; ");
  const byteLength = Buffer.byteLength(header, "utf8");
  if (byteLength > MAX_COOKIE_WIRE_BYTES) {
    violations.push(`Set-Cookie exceeds 4096-byte browser limit (${byteLength} bytes)`);
  }

  const score = Math.max(
    0,
    100 -
      violations.length * 35 -
      (!httpOnly ? 10 : 0) -
      (!secure ? 20 : 0) -
      (!isHostPrefix && !isSecurePrefix ? 5 : 0),
  );

  return {
    valid: violations.length === 0,
    score,
    cookieName: cleanName,
    byteLength,
    clampedMaxAgeSec: effectiveMaxAge,
    isHostPrefix,
    isSecurePrefix,
    partitioned: Boolean(partitioned),
    signedWithKid: signingSecret ? kid : null,
    setCookieHeader: header,
    violations,
    warnings,
  };
}

/**
 * Simulates an end-to-end HTTP traffic pipeline:
 * - W3C traceparent validation & child span propagation
 * - RFC 9218 Priority parsing & scheduling
 * - Token-Bucket Rate Limiting with IETF RateLimit-* headers
 * - RFC 9111 HTTP Cache lookup (Vary, ETag If-None-Match 304, stale-while-revalidate)
 * - Server-Timing telemetry compilation
 */
export function simulateHttpTrafficPipeline({
  url = "/api/curriculum/tasks",
  requestHeaders = {},
  cacheEntry = {
    etag: '"gauntlet-web_v2_106tasks"',
    storedAtSec: 1000,
    maxAgeSec: 60,
    staleWhileRevalidateSec: 120,
    vary: "Accept-Encoding, Accept-Language",
    varyValues: { "accept-encoding": "br", "accept-language": "en-us" },
  },
  nowSec = 1040,
  rateLimit = {
    capacity: 60,
    remaining: 54,
    resetSec: 12,
    routeCost: 1,
  },
} = {}) {
  const normHeaders = {};
  for (const [k, v] of Object.entries(requestHeaders || {})) {
    normHeaders[k.toLowerCase()] = String(v);
  }

  // 1. W3C traceparent propagation
  const incomingTrace = normHeaders["traceparent"] || "";
  const traceMatch = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/.exec(incomingTrace.trim());
  const traceId =
    traceMatch && !/^0+$/.test(traceMatch[1])
      ? traceMatch[1]
      : randomBytes(16).toString("hex");
  const parentSpanId =
    traceMatch && !/^0+$/.test(traceMatch[2]) ? traceMatch[2] : null;
  const childSpanId = randomBytes(8).toString("hex");
  const traceFlags = traceMatch ? traceMatch[3] : "01";
  const outboundTraceparent = `00-${traceId}-${childSpanId}-${traceFlags}`;

  // 2. RFC 9218 Priority header parsing
  const rawPriority = normHeaders["priority"] || "u=3";
  let urgency = 3;
  let incremental = false;
  for (const part of rawPriority.split(",").map((p) => p.trim())) {
    if (part === "i" || part === "i=?1") incremental = true;
    else if (part.startsWith("u=")) {
      const u = Number(part.slice(2));
      if (Number.isInteger(u) && u >= 0 && u <= 7) urgency = u;
    }
  }

  // 3. RFC 9111 Cache + Vary + ETag evaluation
  const varyFields = (cacheEntry.vary || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const varyMatched = varyFields.every(
    (field) =>
      (normHeaders[field] || "").trim().toLowerCase() ===
      (cacheEntry.varyValues?.[field] || "").trim().toLowerCase(),
  );

  const ageSec = Math.max(0, nowSec - (cacheEntry.storedAtSec ?? nowSec));
  const ifNoneMatch = normHeaders["if-none-match"];
  let cacheStatus = "MISS";
  let httpStatus = 200;
  let backgroundRevalidate = false;

  if (varyMatched) {
    if (ageSec <= cacheEntry.maxAgeSec) {
      if (ifNoneMatch && (ifNoneMatch === cacheEntry.etag || ifNoneMatch === `W/${cacheEntry.etag}`)) {
        cacheStatus = "REVALIDATED_304";
        httpStatus = 304;
      } else {
        cacheStatus = "HIT_FRESH";
        httpStatus = 200;
      }
    } else if (ageSec <= cacheEntry.maxAgeSec + cacheEntry.staleWhileRevalidateSec) {
      cacheStatus = "HIT_STALE_WHILE_REVALIDATE";
      httpStatus = 200;
      backgroundRevalidate = true;
    }
  }

  // 4. IETF RateLimit headers
  const cost = Math.max(1, rateLimit.routeCost ?? 1);
  const allowed = (rateLimit.remaining ?? 60) >= cost;
  const remainingAfter = allowed ? Math.max(0, (rateLimit.remaining ?? 60) - cost) : 0;
  if (!allowed) httpStatus = 429;

  const serverTiming = `edge_cache;desc="${cacheStatus}";dur=0.8, origin;dur=${cacheStatus === "MISS" ? 14.2 : 0.1}`;

  const responseHeaders = {
    "cache-control": `public, max-age=${cacheEntry.maxAgeSec}, stale-while-revalidate=${cacheEntry.staleWhileRevalidateSec}`,
    etag: cacheEntry.etag,
    vary: cacheEntry.vary,
    age: String(ageSec),
    "ratelimit-limit": String(rateLimit.capacity ?? 60),
    "ratelimit-remaining": String(remainingAfter),
    "ratelimit-reset": String(rateLimit.resetSec ?? 12),
    "ratelimit-policy": `${rateLimit.capacity ?? 60};w=60`,
    traceparent: outboundTraceparent,
    "server-timing": serverTiming,
  };

  if (!allowed) {
    responseHeaders["retry-after"] = String(rateLimit.resetSec ?? 12);
  }

  return {
    url,
    httpStatus,
    cacheStatus,
    ageSec,
    varyMatched,
    backgroundRevalidate,
    priority: { urgency, incremental },
    trace: {
      validIncoming: Boolean(parentSpanId),
      traceId,
      parentSpanId,
      childSpanId,
      outboundTraceparent,
    },
    rateLimit: {
      allowed,
      remaining: remainingAfter,
      cost,
    },
    responseHeaders,
  };
}
