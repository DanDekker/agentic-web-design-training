/** Limit disposable evaluation workers and fail promptly when the queue is full. */
export class EvaluationBusyError extends Error {
  constructor() {
    super("The evaluator is busy. Please retry shortly.");
    this.name = "EvaluationBusyError";
  }
}

export function evaluationAbortError() {
  return new DOMException("Evaluation canceled.", "AbortError");
}

export class EvaluationPool {
  #active = 0;
  #waiting = [];
  #concurrency;
  #maxWaiting;
  #maxWaitMs;

  constructor({ concurrency = 4, maxWaiting = 32, maxWaitMs = 3000 } = {}) {
    if (!Number.isInteger(concurrency) || concurrency < 1 || !Number.isInteger(maxWaiting) || maxWaiting < 0 ||
        !Number.isInteger(maxWaitMs) || maxWaitMs < 1) {
      throw new RangeError("Evaluation pool limits must be nonnegative integers, with positive concurrency and wait time.");
    }
    this.#concurrency = concurrency;
    this.#maxWaiting = maxWaiting;
    this.#maxWaitMs = maxWaitMs;
  }

  #cleanup(waiter) {
    clearTimeout(waiter.timer);
    waiter.signal?.removeEventListener("abort", waiter.onAbort);
  }

  #acquire(signal) {
    if (signal?.aborted) return Promise.reject(evaluationAbortError());
    if (this.#active < this.#concurrency) {
      this.#active++;
      return Promise.resolve();
    }
    if (this.#waiting.length >= this.#maxWaiting) return Promise.reject(new EvaluationBusyError());
    return new Promise((resolve, reject) => {
      const waiter = { resolve, timer: null, signal, onAbort: null };
      const remove = (error) => {
        const index = this.#waiting.indexOf(waiter);
        if (index >= 0) {
          this.#waiting.splice(index, 1);
          this.#cleanup(waiter);
          reject(error);
        }
      };
      waiter.onAbort = () => remove(evaluationAbortError());
      this.#waiting.push(waiter);
      waiter.timer = setTimeout(() => remove(new EvaluationBusyError()), this.#maxWaitMs);
      signal?.addEventListener("abort", waiter.onAbort, { once: true });
      if (signal?.aborted) waiter.onAbort();
    });
  }

  #release() {
    const waiter = this.#waiting.shift();
    if (waiter) {
      this.#cleanup(waiter);
      waiter.resolve(); // Transfer the slot directly; the active count is unchanged.
    } else {
      this.#active--;
    }
  }

  async run(job, { signal } = {}) {
    await this.#acquire(signal);
    try {
      if (signal?.aborted) throw evaluationAbortError();
      return await job();
    } finally {
      this.#release();
    }
  }
}

// Shared across Evaluator instances, including benchmark and individual requests.
export const evaluationPool = new EvaluationPool();
