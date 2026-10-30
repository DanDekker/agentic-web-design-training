export type BrowserTaskPriority = "user-blocking" | "user-visible" | "background";

export interface BrowserTaskSignalPort {
  readonly aborted: boolean;
  readonly priority?: BrowserTaskPriority;
}

export interface BrowserSchedulerPort {
  postTask<T>(
    callback: () => T | Promise<T>,
    options?: { readonly priority?: BrowserTaskPriority; readonly signal?: BrowserTaskSignalPort },
  ): Promise<T>;
  yield?: () => Promise<void>;
}

export interface ChunkedPriorityWorkInput<T, R> {
  readonly items: readonly T[];
  readonly processItem: (item: T, index: number) => R;
  readonly batchSize?: number;
  readonly priority?: BrowserTaskPriority;
  /** Accepts an AbortSignal or a dynamic-priority TaskSignal from TaskController. */
  readonly signal?: BrowserTaskSignalPort;
  readonly scheduler?: BrowserSchedulerPort | null;
}

export interface ChunkedPriorityWorkReport<R> {
  readonly results: readonly R[];
  readonly completedCount: number;
  readonly chunksProcessed: number;
  readonly yieldedCount: number;
  readonly canceled: boolean;
  readonly schedulingMode: "prioritized-yield" | "prioritized-chunks" | "timer-fallback";
}

const TASK_PRIORITIES: readonly BrowserTaskPriority[] = ["user-blocking", "user-visible", "background"];

function taskOptions(priority: BrowserTaskPriority, signal?: BrowserTaskSignalPort) {
  if (signal?.priority !== undefined && !TASK_PRIORITIES.includes(signal.priority)) {
    throw new TypeError(`Unsupported TaskSignal priority: ${signal.priority}`);
  }
  // Omitting an explicit priority lets a TaskSignal's TaskController change it later.
  if (signal?.priority !== undefined) return { signal };
  return signal ? { priority, signal } : { priority };
}

export async function runChunkedPriorityWork<T, R>(input: ChunkedPriorityWorkInput<T, R>): Promise<ChunkedPriorityWorkReport<R>> {
  if (!Array.isArray(input.items)) throw new TypeError("items must be an array");
  if (typeof input.processItem !== "function") throw new TypeError("processItem must be a function");
  const batchSize = input.batchSize ?? 32;
  const priority = input.priority ?? "user-visible";
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new RangeError("batchSize must be a positive safe integer");
  if (!TASK_PRIORITIES.includes(priority)) throw new TypeError(`Unsupported task priority: ${priority}`);
  if (input.signal && typeof input.signal.aborted !== "boolean") throw new TypeError("signal.aborted must be boolean");

  const hasInjectedScheduler = Object.prototype.hasOwnProperty.call(input, "scheduler");
  const globalScheduler = (globalThis as typeof globalThis & { scheduler?: BrowserSchedulerPort }).scheduler;
  const scheduler = hasInjectedScheduler ? input.scheduler ?? undefined : globalScheduler;
  if (scheduler && typeof scheduler.postTask !== "function") throw new TypeError("scheduler.postTask must be a function");
  if (scheduler?.yield !== undefined && typeof scheduler.yield !== "function") throw new TypeError("scheduler.yield must be a function when present");

  const results: R[] = [];
  let nextIndex = 0;
  let chunksProcessed = 0;
  let yieldedCount = 0;
  let canceled = Boolean(input.signal?.aborted);
  const processBatch = (): void => {
    const endIndex = Math.min(input.items.length, nextIndex + batchSize);
    const firstIndex = nextIndex;
    while (nextIndex < endIndex && !input.signal?.aborted) {
      results.push(input.processItem(input.items[nextIndex], nextIndex));
      nextIndex += 1;
    }
    if (nextIndex > firstIndex) chunksProcessed += 1;
    if (input.signal?.aborted) canceled = true;
  };

  if (scheduler?.yield) {
    try {
      await scheduler.postTask(async () => {
        while (nextIndex < input.items.length && !input.signal?.aborted) {
          processBatch();
          if (nextIndex < input.items.length && !input.signal?.aborted) {
            await scheduler.yield!();
            yieldedCount += 1;
          }
        }
      }, taskOptions(priority, input.signal));
    } catch (error) {
      if (!input.signal?.aborted) throw error;
      canceled = true;
    }
  } else if (scheduler) {
    while (nextIndex < input.items.length && !input.signal?.aborted) {
      try {
        await scheduler.postTask(processBatch, taskOptions(priority, input.signal));
      } catch (error) {
        if (!input.signal?.aborted) throw error;
        canceled = true;
        break;
      }
    }
  } else {
    while (nextIndex < input.items.length && !input.signal?.aborted) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (input.signal?.aborted) {
        canceled = true;
        break;
      }
      processBatch();
    }
  }

  if (input.signal?.aborted) canceled = true;
  const schedulingMode = scheduler?.yield
    ? "prioritized-yield"
    : scheduler
      ? "prioritized-chunks"
      : "timer-fallback";
  return {
    results,
    completedCount: results.length,
    chunksProcessed,
    yieldedCount,
    canceled,
    schedulingMode,
  };
}
