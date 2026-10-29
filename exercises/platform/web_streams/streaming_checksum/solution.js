// Incremental FNV-1a over bytes: constant memory no matter how long the stream
// runs, and chunk boundaries never change the resulting digest.
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

export function createChecksum() {
  let hash = FNV_OFFSET;
  const encoder = new TextEncoder();

  return {
    update(chunk) {
      const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
      for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, FNV_PRIME) >>> 0;
      }
      return this;
    },
    digest() {
      return hash.toString(16).padStart(8, "0");
    },
  };
}

export function checksumStream(chunks) {
  const checksum = createChecksum();
  for (const chunk of chunks) checksum.update(chunk);
  return checksum.digest();
}
