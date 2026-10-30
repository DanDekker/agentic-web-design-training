// Handle incoming offer/answer descriptions when both peers may negotiate at once.
export function createPerfectNegotiationController(peerConnection, polite) {
  // TODO: detect offer collisions and use rollback on the polite peer.
}
