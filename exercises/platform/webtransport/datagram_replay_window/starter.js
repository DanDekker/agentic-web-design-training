// Track a 32-bit sequence number carried inside each unreliable datagram.
// accept(sequence) should return true once for each fresh packet in the window.
class DatagramReplayWindow {
  constructor(windowSize = 32) {
    // TODO: validate a 1..32 bit replay window and initialize its generation.
  }

  accept(sequence) {
    // TODO: allow nearby reordering, reject duplicates/stale values, and handle wrap.
  }

  get highestSequence() {
    // TODO: expose the newest accepted uint32 value, or null before the first packet.
  }
}
