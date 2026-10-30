import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { Evaluator } from "../src/evaluator.js";
import { REFACTORING_CURRICULUM_TASKS } from "../src/curriculum.js";

const task = REFACTORING_CURRICULUM_TASKS.find((item) => item.id === "task_refactor_async_pipeline");

test("an unfinished async solution times out with a normal failed result", async () => {
  const evaluator = new Evaluator({ timeoutMs: 1000 });
  const result = await evaluator.evaluate(task.id, "async function processUserData() { return new Promise(() => {}); }");
  expect(result.passed).toBe(false);
  expect(result.taskId).toBe(task.id);
  expect(result.score).toBeLessThan(100);
  expect(result.assertionResults.find((entry) => entry.name === "Sandbox Execution").detail).toContain("timed out");
  expect(result.diff).toHaveProperty("lineDelta");
  expect((await evaluator.evaluate(task.id, task.solutionCode)).passed).toBe(true);
}, 10000);

test("a submission cannot accidentally change the server's built-in prototypes", async () => {
  const evaluator = new Evaluator();
  const code = `Array.prototype.__gauntletProbe = true;\n${task.solutionCode}`;
  try {
    const result = await evaluator.evaluate(task.id, code);
    expect(result.passed).toBe(true);
    expect(Array.prototype.__gauntletProbe).toBeUndefined();
  } finally {
    delete Array.prototype.__gauntletProbe;
  }
});

test("canceling a running evaluation stops its worker and frees capacity", async () => {
  const evaluator = new Evaluator();
  const controller = new AbortController();
  const run = evaluator.evaluate(task.id, "async function processUserData() { return new Promise(() => {}); }", {}, { signal: controller.signal });
  await Bun.sleep(100);
  controller.abort();
  await expect(run).rejects.toHaveProperty("name", "AbortError");
  expect((await evaluator.evaluate(task.id, task.solutionCode)).passed).toBe(true);
}, 10000);

test("runaway loops, worker exits, and leftover timers do not affect later runs", async () => {
  // A child process keeps the test runner safe if evaluation ever regresses to
  // running an uninterruptible async loop on the main event loop again.
  const root = fileURLToPath(new URL("..", import.meta.url));
  const script = `
    import { Evaluator } from './src/evaluator.js';
    import { REFACTORING_CURRICULUM_TASKS } from './src/curriculum.js';
    const evaluator = new Evaluator({ timeoutMs: 1000 });
    const task = REFACTORING_CURRICULUM_TASKS.find(item => item.id === 'task_refactor_async_pipeline');
    const stalled = await evaluator.evaluate(task.id, 'async function processUserData() { await Promise.resolve(); while (true) {} }');
    const exited = await evaluator.evaluate(task.id, 'setTimeout.constructor("return process")().exit(7); async function processUserData() {}');
    const next = await evaluator.evaluate(task.id, task.solutionCode);
    const timerCode = task.solutionCode + '\\nsetTimeout(() => setTimeout.constructor("return process")().stdout.write("leaked timer"), 200);';
    const timer = await evaluator.evaluate(task.id, timerCode);
    await Bun.sleep(350);
    console.log(JSON.stringify({ failed: !stalled.passed, timedOut: stalled.assertionResults.some(a => a.detail.includes('timed out')), exited: exited.assertionResults.some(a => a.detail.includes('code 7')), recovered: next.passed, timer: timer.passed }));
  `;
  const child = Bun.spawn([process.execPath, "-e", script], { cwd: root, stdout: "pipe", stderr: "pipe" });
  let timer;
  try {
    const exitCode = await Promise.race([
      child.exited,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Evaluator child did not stop")), 8000); }),
    ]);
    const stderr = await new Response(child.stderr).text();
    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
    expect(JSON.parse(await new Response(child.stdout).text())).toEqual({ failed: true, timedOut: true, exited: true, recovered: true, timer: true });
  } finally {
    clearTimeout(timer);
    child.kill();
    await child.exited;
  }
}, 10000);
