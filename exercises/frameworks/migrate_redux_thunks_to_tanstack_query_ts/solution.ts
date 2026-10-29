// TypeScript TanStack Query Client Engine with In-Flight Deduplication, StaleTime & Optimistic Rollback
export type QueryKey = readonly unknown[];

interface CacheEntry<TData = unknown> {
  data: TData;
  updatedAt: number;
  invalidated: boolean;
}

export function hashQueryKey(queryKey: QueryKey): string {
  return JSON.stringify(queryKey, (_key, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.keys(val)
          .sort()
          .reduce<Record<string, unknown>>((acc, k) => {
            acc[k] = (val as Record<string, unknown>)[k];
            return acc;
          }, {})
      : val,
  );
}

export class TypedQueryClient {
  #cache = new Map<string, CacheEntry<any>>();
  #inFlight = new Map<string, Promise<any>>();

  getQueryData<TData>(queryKey: QueryKey): TData | undefined {
    return this.#cache.get(hashQueryKey(queryKey))?.data as TData | undefined;
  }

  setQueryData<TData>(queryKey: QueryKey, updater: TData | ((old: TData | undefined) => TData), nowMs = Date.now()): TData {
    const keyHash = hashQueryKey(queryKey);
    const prev = this.#cache.get(keyHash)?.data as TData | undefined;
    const next = typeof updater === "function" ? (updater as (old: TData | undefined) => TData)(prev) : updater;
    this.#cache.set(keyHash, { data: next, updatedAt: nowMs, invalidated: false });
    return next;
  }

  async fetchQuery<TData>(opts: {
    readonly queryKey: QueryKey;
    readonly queryFn: () => Promise<TData>;
    readonly staleTimeMs?: number;
    readonly nowMs?: number;
  }): Promise<TData> {
    const keyHash = hashQueryKey(opts.queryKey);
    const now = opts.nowMs ?? Date.now();
    const staleTime = opts.staleTimeMs ?? 0;

    const cached = this.#cache.get(keyHash);
    if (cached && !cached.invalidated && now - cached.updatedAt <= staleTime) {
      return cached.data as TData;
    }

    const existingPromise = this.#inFlight.get(keyHash);
    if (existingPromise) {
      return existingPromise as Promise<TData>;
    }

    const request = opts
      .queryFn()
      .then((data) => {
        this.#cache.set(keyHash, { data, updatedAt: Date.now(), invalidated: false });
        this.#inFlight.delete(keyHash);
        return data;
      })
      .catch((err) => {
        this.#inFlight.delete(keyHash);
        throw err;
      });

    this.#inFlight.set(keyHash, request);
    return request;
  }

  invalidateQueries(prefixKey: QueryKey): number {
    let count = 0;
    const prefixJson = JSON.stringify(prefixKey).slice(0, -1); // match array prefix
    for (const [k, entry] of this.#cache.entries()) {
      if (k.startsWith(prefixJson)) {
        entry.invalidated = true;
        count++;
      }
    }
    return count;
  }

  async executeOptimisticMutation<TData, TVariables, TResult>(opts: {
    readonly queryKey: QueryKey;
    readonly variables: TVariables;
    readonly optimisticUpdater: (old: TData | undefined, vars: TVariables) => TData;
    readonly mutationFn: (vars: TVariables) => Promise<TResult>;
  }): Promise<TResult> {
    const snapshot = this.getQueryData<TData>(opts.queryKey);
    this.setQueryData<TData>(opts.queryKey, (old) => opts.optimisticUpdater(old, opts.variables));
    try {
      const result = await opts.mutationFn(opts.variables);
      this.invalidateQueries(opts.queryKey);
      return result;
    } catch (err) {
      if (snapshot !== undefined) {
        this.setQueryData<TData>(opts.queryKey, snapshot);
      }
      throw err;
    }
  }
}
