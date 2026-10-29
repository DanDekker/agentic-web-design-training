// Universal Fine-Grained Reactive Primitives (Svelte 5 $state/$derived/$effect & Vue 3 ref/computed)
type Subscriber = () => void;

let currentObserver: Subscriber | null = null;

export interface ReactiveState<T> {
  get value(): T;
  set value(next: T);
}

export interface ReadonlyDerived<T> {
  readonly value: T;
}

export function $state<T>(initial: T): ReactiveState<T> {
  let current = initial;
  const deps = new Set<Subscriber>();

  return {
    get value(): T {
      if (currentObserver) deps.add(currentObserver);
      return current;
    },
    set value(next: T) {
      if (Object.is(current, next)) return;
      current = next;
      for (const effect of Array.from(deps)) {
        effect();
      }
    },
  };
}

export function $derived<T>(compute: () => T): ReadonlyDerived<T> {
  let cached!: T;
  let dirty = true;
  const downstream = new Set<Subscriber>();

  const onDependencyChanged = () => {
    if (!dirty) {
      dirty = true;
      for (const sub of Array.from(downstream)) sub();
    }
  };

  return {
    get value(): T {
      if (currentObserver) downstream.add(currentObserver);
      if (dirty) {
        const prev = currentObserver;
        currentObserver = onDependencyChanged;
        try {
          cached = compute();
          dirty = false;
        } finally {
          currentObserver = prev;
        }
      }
      return cached;
    },
  };
}

export function $effect(fn: (onCleanup: (cleanupFn: () => void) => void) => void): () => void {
  let cleanup: (() => void) | null = null;
  let disposed = false;

  const run = () => {
    if (disposed) return;
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    const prev = currentObserver;
    currentObserver = run;
    try {
      fn((cb) => {
        cleanup = cb;
      });
    } finally {
      currentObserver = prev;
    }
  };

  run();

  return () => {
    disposed = true;
    if (cleanup) cleanup();
  };
}

export interface AnalyticsItem {
  readonly id: string;
  readonly title: string;
  readonly score: number;
}

export function createMigratedAnalyticsStore(initialItems: readonly AnalyticsItem[]) {
  const items = $state<readonly AnalyticsItem[]>(initialItems);
  const query = $state<string>("");
  const minScore = $state<number>(0);
  const auditTrail: string[] = [];

  const filtered = $derived(() => {
    const q = query.value.trim().toLowerCase();
    return items.value.filter(
      (item) => item.score >= minScore.value && (q === "" || item.title.toLowerCase().includes(q)),
    );
  });

  const summary = $derived(() => ({
    count: filtered.value.length,
    topScore: filtered.value.reduce((max, i) => Math.max(max, i.score), 0),
  }));

  const stopEffect = $effect((onCleanup) => {
    const currentCount = summary.value.count;
    auditTrail.push(`matched:${currentCount}`);
    onCleanup(() => {
      auditTrail.push(`cleanup:${currentCount}`);
    });
  });

  return { items, query, minScore, filtered, summary, auditTrail, dispose: stopEffect };
}
