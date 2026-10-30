// Buffer trickle ICE until a remote description exists and fence off stale ICE restarts.
function candidateKey(candidate) {
  if (candidate === null) return "<global-end-of-candidates>";
  return JSON.stringify([
    candidate.candidate ?? "",
    candidate.sdpMid ?? null,
    candidate.sdpMLineIndex ?? null,
    candidate.usernameFragment ?? null,
  ]);
}

function descriptionUfrags(description) {
  const ufrags = new Set();
  for (const line of String(description?.sdp ?? "").split(/\r?\n/)) {
    if (line.startsWith("a=ice-ufrag:")) ufrags.add(line.slice("a=ice-ufrag:".length));
  }
  return ufrags;
}

export class RemoteIceCandidateInbox {
  #peerConnection;
  #pending = [];
  #seen = new Set();
  #ufrags = new Set();
  #generation = "";
  #hasRemoteDescription = false;
  #closed = false;

  constructor(peerConnection) {
    if (!peerConnection || typeof peerConnection.addIceCandidate !== "function") {
      throw new TypeError("A peer connection with addIceCandidate() is required.");
    }
    this.#peerConnection = peerConnection;
  }

  async receive(candidate) {
    if (this.#closed) return false;
    const key = `${this.#generation}\0${candidateKey(candidate)}`;
    if (this.#seen.has(key)) return false;
    this.#seen.add(key);

    if (!this.#hasRemoteDescription) {
      this.#pending.push(candidate);
      return false;
    }
    return this.#apply(candidate);
  }

  async setRemoteDescription(description) {
    if (this.#closed) throw new Error("The ICE inbox is closed.");
    await this.#peerConnection.setRemoteDescription(description);

    const ufrags = descriptionUfrags(description);
    const generation = [...ufrags].sort().join("\0") || `sdp:${description?.sdp ?? description?.type ?? ""}`;
    if (generation !== this.#generation) this.#seen.clear();
    this.#generation = generation;
    this.#ufrags = ufrags;
    this.#hasRemoteDescription = true;

    const pending = this.#pending.splice(0);
    for (const candidate of pending) {
      this.#seen.add(`${this.#generation}\0${candidateKey(candidate)}`);
    }
    let applied = 0;
    for (const candidate of pending) {
      if (await this.#apply(candidate)) applied++;
    }
    return applied;
  }

  async #apply(candidate) {
    const usernameFragment = candidate?.usernameFragment;
    if (usernameFragment && this.#ufrags.size > 0 && !this.#ufrags.has(usernameFragment)) return false;
    await this.#peerConnection.addIceCandidate(candidate);
    return true;
  }

  close() {
    this.#closed = true;
    this.#pending.length = 0;
    this.#seen.clear();
  }
}
