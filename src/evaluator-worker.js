import { parentPort, workerData } from "node:worker_threads";
import { Evaluator } from "./evaluator-engine.js";

// One worker handles one submission. The parent always terminates it after
// receiving the result or reaching the deadline, including any leftover timers.
// Keep unresolved async evaluations alive until the parent can report a timeout.
parentPort.on("message", () => {});
try {
  const result = await new Evaluator().evaluate(workerData.taskId, workerData.code, workerData.options);
  parentPort.postMessage({ result });
} catch (error) {
  parentPort.postMessage({ error: error instanceof Error ? error.message : String(error) });
}
