// Spawns a fresh worker per task: no concurrency cap, no reuse, no cleanup.
export function runTasks(tasks) {
  return Promise.all(
    tasks.map((task) => {
      const worker = new Worker("./worker.js");
      return worker.run(task);
    }),
  );
}
