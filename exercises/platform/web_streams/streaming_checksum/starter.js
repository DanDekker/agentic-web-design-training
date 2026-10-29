// Joins the whole payload to hash it in one pass: memory grows with the stream.
export function checksumStream(chunks) {
  return fnv1a(chunks.join(""));
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

function fnv1a(text) {
  let hash = FNV_OFFSET;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
