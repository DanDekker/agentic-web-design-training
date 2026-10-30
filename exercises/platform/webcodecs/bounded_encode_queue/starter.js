// Encode frames without allowing VideoEncoder's control queue to grow without bound.
export async function encodeVideoFrames(encoder, frames, options = {}) {
  // TODO: wait for dequeue events, close frame ownership, schedule keyframes, and flush.
}
