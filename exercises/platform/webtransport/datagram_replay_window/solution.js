class DatagramReplayWindow {
  #windowSize;
  #highest = null;
  #bitmap = 0;

  constructor(windowSize = 32) {
    if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > 32) {
      throw new RangeError("windowSize must be an integer from 1 through 32");
    }
    this.#windowSize = windowSize;
  }

  accept(sequence) {
    if (!Number.isInteger(sequence) || sequence < 0 || sequence > 0xffffffff) {
      throw new RangeError("sequence must be an unsigned 32-bit integer");
    }
    if (this.#highest === null) {
      this.#highest = sequence;
      this.#bitmap = 1;
      return true;
    }

    const ahead = (sequence - this.#highest) >>> 0;
    if (ahead === 0) return false;
    if (ahead < 0x80000000) {
      this.#bitmap = ahead >= this.#windowSize
        ? 1
        : ((this.#bitmap << ahead) | 1) >>> 0;
      this.#highest = sequence;
      return true;
    }

    const behind = (this.#highest - sequence) >>> 0;
    if (behind >= this.#windowSize) return false;
    const bit = 1 << behind;
    if ((this.#bitmap & bit) !== 0) return false;
    this.#bitmap = (this.#bitmap | bit) >>> 0;
    return true;
  }

  get highestSequence() {
    return this.#highest;
  }
}
