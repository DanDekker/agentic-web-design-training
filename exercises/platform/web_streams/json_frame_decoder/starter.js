// Buffers the entire stream before parsing: memory grows with the payload and
// nothing is emitted until the socket closes.
export async function decodeFrames(stream) {
  let text = "";
  for await (const chunk of stream) text += chunk;
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
