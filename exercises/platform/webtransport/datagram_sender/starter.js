// Create a bounded WebTransport datagram sender.
// Keep the requested lifetime on the datagram stream, apply writer backpressure,
// and refuse packets larger than the current negotiated maximum.
function createDatagramSender(transport, { maxAgeMs = 100, sendGroup = null, sendOrder = 0 } = {}) {
  // TODO: validate options and the transport API, configure datagram expiry,
  // acquire a writer, and return { send(bytes), close() }.
}
