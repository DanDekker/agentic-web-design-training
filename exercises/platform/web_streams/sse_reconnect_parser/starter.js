// Parses each network chunk in isolation: frames split across chunks are lost
// and nothing tracks the last event id for resumption.
export function readSse(chunk) {
  return chunk
    .split("\n\n")
    .map((raw) => {
      const line = raw.split("\n").find((entry) => entry.startsWith("data: "));
      return line ? { data: line.slice(6) } : null;
    })
    .filter(Boolean);
}
