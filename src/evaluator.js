import { Worker } from "node:worker_threads";
import { Evaluator as EvaluationEngine, prepareEvaluation } from "./evaluator-engine.js";
import { evaluationPool } from "./evaluation-pool.js";

export { EvaluationBusyError } from "./evaluation-pool.js";

const DEFAULT_TIMEOUT_MS = 5000;

/** Run submitted code in a disposable worker so a failed run cannot linger. */
export class Evaluator {
  #engine = new EvaluationEngine();
  #timeoutMs;

  constructor({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
      throw new RangeError("Evaluation timeout must be between 1 and 30000 milliseconds.");
    }
    this.#timeoutMs = timeoutMs;
  }

  verifyCriteria(taskId, code) {
    return this.#engine.verifyCriteria(taskId, code);
  }

  async evaluate(taskId, code, options = {}) {
    const { trimmedCode } = prepareEvaluation(taskId, code);
    return evaluationPool.run(() => this.#evaluateInWorker(taskId, trimmedCode, options));
  }

  async #evaluateInWorker(taskId, trimmedCode, options) {
    const started = performance.now();
    let worker;
    let timer;
    try {
      worker = new Worker(new URL("./evaluator-worker.js", import.meta.url), {
        workerData: { taskId, code: trimmedCode, options },
      });
      const outcome = await new Promise((resolve) => {
        worker.once("message", (message) => resolve({ kind: "message", message }));
        worker.once("error", (error) => resolve({ kind: "error", reason: error.message }));
        worker.once("exit", (code) => resolve({ kind: "error", reason: `Evaluation worker exited before returning a result (code ${code}).` }));
        timer = setTimeout(() => resolve({ kind: "error", reason: `Evaluation timed out after ${this.#timeoutMs} ms.` }), this.#timeoutMs);
      });
      if (outcome.kind === "message" && outcome.message?.result) return outcome.message.result;
      const reason = outcome.kind === "message" ? outcome.message?.error || "Evaluation worker returned no result." : outcome.reason;
      return this.#engine.failedEvaluation(taskId, trimmedCode, reason, started);
    } catch (error) {
      return this.#engine.failedEvaluation(taskId, trimmedCode, error instanceof Error ? error.message : String(error), started);
    } finally {
      clearTimeout(timer);
      if (worker) await worker.terminate();
    }
  }
}
