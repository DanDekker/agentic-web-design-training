// Preserve a stream's shared clock while emitting safe, monotonic microsecond timestamps.
export function createMicrosecondTimestampMapper({ timeOriginMs = 0, firstTimestampUs = 0 } = {}) {
  if (!Number.isFinite(timeOriginMs)) throw new RangeError("Time origin must be finite.");
  if (!Number.isSafeInteger(firstTimestampUs) || firstTimestampUs < 0) {
    throw new RangeError("First timestamp must be a non-negative safe integer.");
  }

  let previousUs = firstTimestampUs - 1;
  return {
    toMicroseconds(sourceTimeMs) {
      if (!Number.isFinite(sourceTimeMs)) throw new RangeError("Source time must be finite.");
      const elapsedUs = (sourceTimeMs - timeOriginMs) * 1000;
      if (!Number.isSafeInteger(Math.round(elapsedUs))) {
        throw new RangeError("Timestamp exceeds safe microsecond precision.");
      }
      const timestampUs = Math.max(firstTimestampUs, previousUs + 1, Math.round(elapsedUs));
      if (!Number.isSafeInteger(timestampUs)) throw new RangeError("Timestamp exceeds safe microsecond precision.");
      previousUs = timestampUs;
      return timestampUs;
    },
  };
}
