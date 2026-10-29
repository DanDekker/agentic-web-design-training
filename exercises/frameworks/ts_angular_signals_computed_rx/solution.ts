// TypeScript Angular Signal, Memoized Computed & Cancelable switchMap Store
export interface Signal<T> {
  (): T;
}

export interface WritableSignal<T> extends Signal<T> {
  set(value: T): void;
  update(updater: (current: T) => T): void;
  subscribe(listener: (value: T) => void): () => void;
}

let activeConsumer: (() => void) | null = null;

export function signal<T>(initialValue: T): WritableSignal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();
  const listeners = new Set<(val: T) => void>();

  const read = (() => {
    if (activeConsumer) subscribers.add(activeConsumer);
    return value;
  }) as WritableSignal<T>;

  read.set = (nextValue: T) => {
    if (Object.is(value, nextValue)) return;
    value = nextValue;
    for (const sub of Array.from(subscribers)) sub();
    for (const fn of Array.from(listeners)) fn(value);
  };

  read.update = (updater: (current: T) => T) => {
    read.set(updater(value));
  };

  read.subscribe = (listener: (val: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return read;
}

export function computed<T>(derivation: () => T): Signal<T> {
  let cached: T;
  let dirty = true;

  const invalidate = () => {
    dirty = true;
  };

  return () => {
    if (dirty) {
      const prev = activeConsumer;
      activeConsumer = invalidate;
      try {
        cached = derivation();
        dirty = false;
      } finally {
        activeConsumer = prev;
      }
    }
    return cached;
  };
}

export function createSwitchMapLoader<TKey, TResult>(
  source: WritableSignal<TKey>,
  loader: (key: TKey, abortSignal: AbortSignal) => Promise<TResult>,
) {
  const data = signal<TResult | null>(null);
  const loading = signal<boolean>(false);
  let activeController: AbortController | null = null;
  let epoch = 0;

  const trigger = async (key: TKey) => {
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const currentEpoch = ++epoch;
    loading.set(true);

    try {
      const res = await loader(key, controller.signal);
      if (currentEpoch === epoch && !controller.signal.aborted) {
        data.set(res);
        loading.set(false);
      }
    } catch {
      if (currentEpoch === epoch) loading.set(false);
    }
  };

  const unsubscribe = source.subscribe((nextKey) => {
    void trigger(nextKey);
  });

  return { data, loading, trigger, destroy: unsubscribe };
}
