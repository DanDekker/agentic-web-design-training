// Read-modify-write on a plain object: workers interleave and lose increments.
export function createCounter() {
  return { value: 0 };
}

export function bumpCounter(counter, by = 1) {
  const next = counter.value + by;
  counter.value = next;
  return next;
}
