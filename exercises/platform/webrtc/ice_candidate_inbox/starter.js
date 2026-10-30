// Trickle ICE candidates may arrive before a remote description or after an ICE restart.
export class RemoteIceCandidateInbox {
  constructor(peerConnection) {
    // TODO: buffer early candidates, deduplicate each generation and reject stale ufrags.
  }
}
