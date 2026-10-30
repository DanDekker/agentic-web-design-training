// Resolve simultaneous offers with the WebRTC perfect-negotiation pattern.
export function createPerfectNegotiationController(peerConnection, polite) {
  let makingOffer = false;
  let settingRemoteAnswer = false;

  return {
    async negotiate() {
      try {
        makingOffer = true;
        await peerConnection.setLocalDescription();
        return peerConnection.localDescription;
      } finally {
        makingOffer = false;
      }
    },

    async receiveDescription(description) {
      if (!description || !["offer", "answer"].includes(description.type)) {
        throw new TypeError("A remote offer or answer is required.");
      }

      const offerCollision =
        description.type === "offer" &&
        (makingOffer || (!settingRemoteAnswer && peerConnection.signalingState !== "stable"));
      if (offerCollision && !polite) return { ignored: true, answer: null };

      try {
        settingRemoteAnswer = description.type === "answer";
        if (offerCollision) await peerConnection.setLocalDescription({ type: "rollback" });
        await peerConnection.setRemoteDescription(description);

        if (description.type === "offer") {
          await peerConnection.setLocalDescription();
          return { ignored: false, answer: peerConnection.localDescription };
        }
        return { ignored: false, answer: null };
      } finally {
        settingRemoteAnswer = false;
      }
    },
  };
}
