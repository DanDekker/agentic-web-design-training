import { expect, test } from "bun:test";
import { EvaluationBusyError, EvaluationPool } from "../src/evaluation-pool.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test("evaluation pool bounds concurrency, queues FIFO, and releases slots after errors", async () => {
  const pool = new EvaluationPool({ concurrency: 2, maxWaiting: 2, maxWaitMs: 1000 });
  const first = deferred();
  const second = deferred();
  const starts = [];
  const a = pool.run(async () => { starts.push("a"); return first.promise; });
  const b = pool.run(async () => { starts.push("b"); return second.promise; });
  const c = pool.run(async () => { starts.push("c"); throw new Error("job failed"); });
  const cError = c.catch((error) => error.message);
  const d = pool.run(async () => { starts.push("d"); return "after failure"; });
  await expect(pool.run(() => {})).rejects.toBeInstanceOf(EvaluationBusyError);
  await Promise.resolve();
  expect(starts).toEqual(["a", "b"]);
  first.resolve("done");
  expect(await a).toBe("done");
  expect(await cError).toBe("job failed");
  expect(await d).toBe("after failure");
  expect(starts).toEqual(["a", "b", "c", "d"]);
  expect(await pool.run(() => "recovered")).toBe("recovered");
  second.resolve();
  await b;
});

test("an expired queue entry is removed without consuming a later slot", async () => {
  const pool = new EvaluationPool({ concurrency: 1, maxWaiting: 1, maxWaitMs: 25 });
  const gate = deferred();
  const running = pool.run(() => gate.promise);
  await expect(pool.run(() => "never started")).rejects.toBeInstanceOf(EvaluationBusyError);
  const retry = pool.run(() => "available");
  gate.resolve();
  await running;
  expect(await retry).toBe("available");
});

test("canceling a queued evaluation removes it and preserves the next waiter's place", async () => {
  const pool = new EvaluationPool({ concurrency: 1, maxWaiting: 2, maxWaitMs: 1000 });
  const gate = deferred();
  const running = pool.run(() => gate.promise);
  const controller = new AbortController();
  let canceledJobStarted = false;
  const canceled = pool.run(() => { canceledJobStarted = true; }, { signal: controller.signal });
  const canceledError = canceled.catch((error) => error);
  const next = pool.run(() => "next");
  controller.abort();
  expect((await canceledError).name).toBe("AbortError");
  gate.resolve();
  await running;
  expect(await next).toBe("next");
  expect(canceledJobStarted).toBe(false);
  await expect(pool.run(() => "never", { signal: controller.signal })).rejects.toHaveProperty("name", "AbortError");
  expect(await pool.run(() => "still available")).toBe("still available");
});
