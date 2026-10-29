// SharedArrayBuffer plus Atomics: atomic read-modify-write across workers.
export function createSharedCounter(size = 1) {
  const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * size);
  return { sab, view: new Int32Array(sab) };
}

export function bumpCounter(view, by = 1) {
  return Atomics.add(view, 0, by) + by;
}

export function readCounter(view) {
  return Atomics.load(view, 0);
}

export function claimExclusiveSlot(view, expected, next) {
  return Atomics.compareExchange(view, 0, expected, next) === expected;
}
