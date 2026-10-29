// Bounded worker pool: fixed concurrency, queued work, graceful drain.
export class WorkerPool {
  #size;
  #spawn;
  #idle = [];
  #queue = [];
  #active = 0;
  #closed = false;
  #terminated = 0;

  constructor(size, spawn) {
    this.#size = size;
    this.#spawn = spawn;
    for (let index = 0; index < size; index += 1) this.#idle.push(spawn());
  }

  submit(task) {
    if (this.#closed) return Promise.reject(new Error("WorkerPool is closed."));
    return new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject });
      this.#drainQueue();
    });
  }

  #drainQueue() {
    while (this.#active < this.#size && this.#queue.length > 0) {
      const job = this.#queue.shift();
      const worker = this.#idle.pop();
      this.#active += 1;
      Promise.resolve()
        .then(() => worker.run(job.task))
        .then(job.resolve, job.reject)
        .finally(() => {
          this.#active -= 1;
          this.#idle.push(worker);
          this.#drainQueue();
        });
    }
  }

  async close() {
    this.#closed = true;
    while (this.#active > 0 || this.#queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    for (const worker of this.#idle) {
      worker.terminate();
      this.#terminated += 1;
    }
    this.#idle = [];
    return { terminated: this.#terminated };
  }
}
