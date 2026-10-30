export async function runChunkedPriorityWork(input: any) {
  // TODO: split work into bounded batches, prioritize and cancel scheduler
  // tasks, and retain a yielding fallback for browsers without scheduler.
  return { results: [], completedCount: 0, chunksProcessed: 0, yieldedCount: 0, canceled: false };
}
