// Migrated Next.js App Router Tagged Cache Store, Parallel RSC Loader & Route Handler Revalidation
export interface TaggedCacheEntry<T = unknown> {
  readonly value: T;
  readonly tags: readonly string[];
  readonly cachedAt: number;
}

export class NextAppRouterCache {
  #store = new Map<string, TaggedCacheEntry<any>>();

  async fetchWithTags<T>(
    cacheKey: string,
    tags: readonly string[],
    loader: () => Promise<T>,
  ): Promise<{ data: T; cacheStatus: "HIT" | "MISS" }> {
    const existing = this.#store.get(cacheKey);
    if (existing) {
      return { data: existing.value as T, cacheStatus: "HIT" };
    }
    const value = await loader();
    this.#store.set(cacheKey, { value, tags: [...tags], cachedAt: Date.now() });
    return { data: value, cacheStatus: "MISS" };
  }

  revalidateTag(tag: string): number {
    let evicted = 0;
    for (const [key, entry] of this.#store.entries()) {
      if (entry.tags.includes(tag)) {
        this.#store.delete(key);
        evicted++;
      }
    }
    return evicted;
  }
}

export async function renderDashboardRSC<TUser, TMetrics>(opts: {
  readonly userId: string;
  readonly cache: NextAppRouterCache;
  readonly loadUser: (id: string) => Promise<TUser>;
  readonly loadMetrics: (id: string) => Promise<TMetrics>;
}) {
  // Parallel initiation eliminates sequential getServerSideProps waterfall
  const [userEnvelope, metricsEnvelope] = await Promise.all([
    opts.cache.fetchWithTags("user:" + opts.userId, ["users", "user:" + opts.userId], () =>
      opts.loadUser(opts.userId),
    ),
    opts.cache.fetchWithTags("metrics:" + opts.userId, ["metrics", "user:" + opts.userId], () =>
      opts.loadMetrics(opts.userId),
    ),
  ]);

  return {
    rscPayload: {
      user: userEnvelope.data,
      suspenseBoundary: {
        id: "metrics-stream",
        status: "resolved" as const,
        data: metricsEnvelope.data,
      },
    },
    telemetry: {
      userCache: userEnvelope.cacheStatus,
      metricsCache: metricsEnvelope.cacheStatus,
    },
  };
}

export async function POST_RevalidateRouteHandler(
  req: Request,
  cache: NextAppRouterCache,
): Promise<Response> {
  const body = (await req.json()) as { tag?: string };
  if (!body?.tag || typeof body.tag !== "string") {
    return new Response(JSON.stringify({ revalidated: false, error: "Missing tag" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const evictedCount = cache.revalidateTag(body.tag);
  return new Response(
    JSON.stringify({ revalidated: true, tag: body.tag, evictedCount }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}
