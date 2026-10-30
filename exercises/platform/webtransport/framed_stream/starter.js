// Decode uint32-big-endian-length-prefixed messages from a reliable
// WebTransportReceiveStream. Stream read boundaries do not equal message boundaries.
async function decodeLengthPrefixedStream(readable, { onFrame, maxFrameBytes = 1 << 20 } = {}) {
  // TODO: decode across arbitrary chunks, enforce the frame limit before waiting
  // for its body, await onFrame for backpressure, and reject a truncated EOF.
}
