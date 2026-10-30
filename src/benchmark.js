/**
 * Web development curriculum benchmark suite.
 * Computes aggregate evaluation metrics, agent test coverage, and benchmark reports across all curriculum tasks.
 */

import { REFACTORING_CURRICULUM_TASKS, CURRICULUM_TRACKS } from "./curriculum.js";
import { Evaluator } from "./evaluator.js";

// Entity escapes keep punctuation literal inside GFM table cells, including pipes.
function markdownCell(value) {
  return String(value ?? "")
    .replace(/\r\n?|\n/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\|`*_~\[\]!:]/g, (character) => `&#${character.charCodeAt(0)};`);
}

export class BenchmarkSuite {
  #evaluator = new Evaluator();

  /**
   * Generates benchmark metadata and catalog statistics.
   */
  getCatalogStats() {
    const total = REFACTORING_CURRICULUM_TASKS.length;
    const byDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };
    const byCategory = {};
    const byTrack = {};

    for (const t of REFACTORING_CURRICULUM_TASKS) {
      if (byDifficulty[t.difficulty] !== undefined) byDifficulty[t.difficulty]++;
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      if (t.track) byTrack[t.track] = (byTrack[t.track] || 0) + 1;
    }

    return {
      totalTasks: total,
      byDifficulty,
      byCategory,
      byTrack,
      categories: Object.keys(byCategory),
      tracks: Object.keys(CURRICULUM_TRACKS),
      catalogVersion: "2.1.0",
      curriculumName: "Agentic Curriculum Benchmark",
    };
  }

  /**
   * Runs automated verification benchmark against all curriculum tasks using reference solutions.
   */
  async runFullBenchmark({ category = null, signal } = {}) {
    if (signal?.aborted) throw new DOMException("Evaluation canceled.", "AbortError");
    const startTime = performance.now();
    const targetTasks = category
      ? REFACTORING_CURRICULUM_TASKS.filter((t) => t.category === category)
      : REFACTORING_CURRICULUM_TASKS;

    // Independent reference runs share the evaluator's bounded worker pool.
    // Keep catalog order in the report even when workers finish out of order.
    const taskResults = new Array(targetTasks.length);
    let nextIndex = 0;
    let failure;
    const runNext = async () => {
      while (!failure && nextIndex < targetTasks.length) {
        const index = nextIndex++;
        const task = targetTasks[index];
        try {
          const evalResult = await this.#evaluator.evaluate(task.id, task.solutionCode, {}, { signal });
          taskResults[index] = {
            taskId: task.id,
            title: task.title,
            difficulty: task.difficulty,
            category: task.category,
            passed: evalResult.passed,
            score: evalResult.score,
            durationMs: evalResult.telemetry.durationMs,
            lineDelta: evalResult.diff.lineDelta,
          };
        } catch (error) {
          failure ??= error;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, targetTasks.length) }, runNext));
    if (failure) throw failure;

    const totalDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const count = taskResults.length || 1;
    const passedCount = taskResults.filter((t) => t.passed).length;
    const avgDuration =
      Math.round((taskResults.reduce((acc, t) => acc + t.durationMs, 0) / count) * 100) / 100;
    const avgScore = Math.round(taskResults.reduce((acc, t) => acc + t.score, 0) / count);

    const byCategory = {};
    for (const r of taskResults) {
      if (!byCategory[r.category]) {
        byCategory[r.category] = { total: 0, passed: 0 };
      }
      byCategory[r.category].total++;
      if (r.passed) byCategory[r.category].passed++;
    }

    return {
      suite: "Agentic Curriculum Benchmark",
      timestamp: new Date().toISOString(),
      summary: {
        totalTasks: taskResults.length,
        passedTasks: passedCount,
        failedTasks: taskResults.length - passedCount,
        passRate: `${Math.round((passedCount / count) * 100)}%`,
        averageScore: avgScore,
        averageDurationMs: avgDuration,
        totalDurationMs,
        byCategory,
      },
      results: taskResults,
    };
  }

  /**
   * Formats benchmark results into a clean markdown document.
   */
  formatMarkdown(benchmark) {
    const { summary, results } = benchmark;
    const lines = [
      `# gauntlet-web Benchmark Report`,
      ``,
      `*Generated at: ${markdownCell(benchmark.timestamp)}*`,
      ``,
      `## Summary`,
      `- **Total Tasks:** ${markdownCell(summary.totalTasks)}`,
      `- **Pass Rate:** ${markdownCell(summary.passRate)} (${markdownCell(summary.passedTasks)}/${markdownCell(summary.totalTasks)})`,
      `- **Average Score:** ${markdownCell(summary.averageScore)}%`,
      `- **Avg Execution Time:** ${markdownCell(summary.averageDurationMs)}ms`,
      `- **Total Benchmark Duration:** ${markdownCell(summary.totalDurationMs)}ms`,
      ``,
      `## Category Breakdown`,
      `| Category | Passed | Total | Pass Rate |`,
      `| :--- | :--- | :--- | :--- |`,
      ...Object.entries(summary.byCategory || {}).map(
        ([cat, stat]) =>
          `| ${markdownCell(cat)} | ${markdownCell(stat.passed)} | ${markdownCell(stat.total)} | ${Math.round((stat.passed / (stat.total || 1)) * 100)}% |`,
      ),
      ``,
      `## Task Results`,
      `| Task Title | Category | Difficulty | Score | Time | Status |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ];

    for (const r of results) {
      const statusIcon = r.passed ? "PASSED" : "FAILED";
      lines.push(
        `| ${markdownCell(r.title)} | ${markdownCell(r.category)} | ${markdownCell(r.difficulty)} | ${markdownCell(r.score)}% | ${markdownCell(r.durationMs)}ms | **${statusIcon}** |`,
      );
    }

    return lines.join("\n");
  }
}
