/**
 * Agentic Curriculum 1M Tasks — Benchmark Suite.
 * Computes aggregate evaluation metrics, agent test coverage, and benchmark reports across all curriculum tasks.
 */

import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";
import { Evaluator } from "./evaluator.js";

export class BenchmarkSuite {
  #evaluator = new Evaluator();

  /**
   * Generates benchmark metadata and catalog statistics.
   */
  getCatalogStats() {
    const total = REFACTORING_CURRICULUM_TASKS.length;
    const byDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };
    const byCategory = {};

    for (const t of REFACTORING_CURRICULUM_TASKS) {
      if (byDifficulty[t.difficulty] !== undefined) byDifficulty[t.difficulty]++;
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    }

    return {
      totalTasks: total,
      byDifficulty,
      byCategory,
      catalogVersion: "1.2.0",
      curriculumName: "Agentic Curriculum Benchmark",
    };
  }

  /**
   * Runs automated verification benchmark against all curriculum tasks using reference solutions.
   */
  async runFullBenchmark() {
    const startTime = performance.now();
    const taskResults = [];

    for (const task of REFACTORING_CURRICULUM_TASKS) {
      const solution = task.solutionCode;
      const evalResult = await this.#evaluator.evaluate(task.id, solution);
      taskResults.push({
        taskId: task.id,
        title: task.title,
        difficulty: task.difficulty,
        category: task.category,
        passed: evalResult.passed,
        score: evalResult.score,
        durationMs: evalResult.telemetry.durationMs,
        lineDelta: evalResult.diff.lineDelta,
      });
    }

    const totalDurationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const passedCount = taskResults.filter((t) => t.passed).length;
    const avgDuration =
      Math.round((taskResults.reduce((acc, t) => acc + t.durationMs, 0) / taskResults.length) * 100) / 100;
    const avgScore = Math.round(taskResults.reduce((acc, t) => acc + t.score, 0) / taskResults.length);

    return {
      suite: "Agentic Curriculum Benchmark",
      timestamp: new Date().toISOString(),
      summary: {
        totalTasks: taskResults.length,
        passedTasks: passedCount,
        failedTasks: taskResults.length - passedCount,
        passRate: `${Math.round((passedCount / taskResults.length) * 100)}%`,
        averageScore: avgScore,
        averageDurationMs: avgDuration,
        totalDurationMs,
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
      `# Agentic 1M Benchmark Report`,
      ``,
      `*Generated at: ${benchmark.timestamp}*`,
      ``,
      `## Summary`,
      `- **Total Tasks:** ${summary.totalTasks}`,
      `- **Pass Rate:** ${summary.passRate} (${summary.passedTasks}/${summary.totalTasks})`,
      `- **Average Score:** ${summary.averageScore}%`,
      `- **Avg Execution Time:** ${summary.averageDurationMs}ms`,
      `- **Total Benchmark Duration:** ${summary.totalDurationMs}ms`,
      ``,
      `## Task Results`,
      `| Task Title | Category | Difficulty | Score | Time | Status |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ];

    for (const r of results) {
      const statusIcon = r.passed ? "PASSED" : "FAILED";
      lines.push(
        `| ${r.title} | \`${r.category}\` | ${r.difficulty} | ${r.score}% | ${r.durationMs}ms | **${statusIcon}** |`,
      );
    }

    return lines.join("\n");
  }
}
