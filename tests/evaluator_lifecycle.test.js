import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { Evaluator } from "../src/evaluator.js";
import { REFACTORING_CURRICULUM_TASKS } from "../src/curriculum.js";

const task = REFACTORING_CURRICULUM_TASKS.find((item) => item.id === "task_refactor_async_pipeline");

test("an unfinished async solution times out with a normal failed result", async () => {
  const evaluator = new Evaluator({ timeoutMs: 500 });
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

test("an async infinite loop is terminated and a later evaluation still runs", async () => {
  // A child process keeps the test runner safe if evaluation ever regresses to
  // running an uninterruptible async loop on the main event loop again.
  const root = fileURLToPath(new URL("..", import.meta.url));
  const script = `
    import { Evaluator } from './src/evaluator.js';
    import { REFACTORING_CURRICULUM_TASKS } from './src/curriculum.js';
    const evaluator = new Evaluator({ timeoutMs: 500 });
    const task = REFACTORING_CURRICULUM_TASKS.find(item => item.id === 'task_refactor_async_pipeline');
    const stalled = await evaluator.evaluate(task.id, 'async function processUserData() { await Promise.resolve(); while (true) {} }');
    const next = await evaluator.evaluate(task.id, task.solutionCode);
    console.log(JSON.stringify({ failed: !stalled.passed, timedOut: stalled.assertionResults.some(a => a.detail.includes('timed out')), recovered: next.passed }));
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
    expect(JSON.parse(await new Response(child.stdout).text())).toEqual({ failed: true, timedOut: true, recovered: true });
  } finally {
    clearTimeout(timer);
    child.kill();
    await child.exited;
  }
}, 10000);
