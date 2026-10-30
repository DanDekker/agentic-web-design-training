function createWebNNSessionRunner(createSession, { maxAttempts = 2 } = {}) {
  if (typeof createSession !== "function") throw new TypeError("createSession must be a function");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new RangeError("maxAttempts must be an integer from 1 through 10");
  }

  let current = null;
  let creating = null;
  let closed = false;
  let nextGeneration = 1;

  function invalidate(record) {
    if (record.lost) return;
    record.lost = true;
    if (current === record) current = null;
    record.resolveLoss();
  }

  function acquire() {
    if (closed) return Promise.reject(new Error("WebNN session runner is closed"));
    if (current && !current.lost) return Promise.resolve(current);
    if (!creating) {
      const pending = Promise.resolve().then(createSession).then((session) => {
        if (closed) throw new Error("WebNN session runner is closed");
        if (!session?.context?.lost || typeof session.context.lost.then !== "function") {
          throw new TypeError("createSession must return a context with its WebNN lost promise");
        }
        const record = { session, generation: nextGeneration++, lost: false, loss: null, resolveLoss: null };
        record.loss = new Promise((resolve) => { record.resolveLoss = resolve; });
        Promise.resolve(session.context.lost).then(() => invalidate(record), () => invalidate(record));
        current = record;
        return record;
      });
      creating = pending;
      pending.then(
        () => { if (creating === pending) creating = null; },
        () => { if (creating === pending) creating = null; },
      );
    }
    return creating;
  }

  async function run(operation) {
    if (typeof operation !== "function") throw new TypeError("operation must be a function");
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const record = await acquire();
      const work = Promise.resolve().then(() => operation(record.session, record.generation)).then(
        (value) => ({ kind: "value", value }),
        (error) => ({ kind: "error", error }),
      );
      const outcome = await Promise.race([
        work,
        record.loss.then(() => ({ kind: "lost" })),
      ]);
      if (outcome.kind === "error" && !record.lost && current === record) throw outcome.error;
      if (outcome.kind === "value" && !record.lost && current === record) return outcome.value;
    }
    const error = new Error("WebNN context was lost during every inference attempt");
    error.name = "InvalidStateError";
    throw error;
  }

  function close() {
    closed = true;
    if (current) invalidate(current);
    return creating ? creating.then(() => {}, () => {}) : Promise.resolve();
  }

  return {
    run,
    close,
    get generation() { return current?.generation ?? 0; },
  };
}
