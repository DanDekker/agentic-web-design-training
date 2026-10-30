// RTCDataChannel.send() buffers data; respect a high-water mark before sending.
export async function sendWithBackpressure(channel, payload, options = {}) {
  // TODO: account for UTF-8 bytes, wait for bufferedamountlow, and serialize senders.
}
