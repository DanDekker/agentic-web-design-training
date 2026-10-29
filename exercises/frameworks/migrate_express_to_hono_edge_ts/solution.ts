// Migrated Web-Standard TypeScript Hono / Edge Router with Typed Context Variables
export interface EdgeContext<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  readonly req: Request;
  readonly params: Readonly<Record<string, string>>;
  set<K extends keyof TVariables>(key: K, value: TVariables[K]): void;
  get<K extends keyof TVariables>(key: K): TVariables[K];
  json<T>(data: T, status?: number): Response;
}

type EdgeMiddleware<TVariables extends Record<string, unknown>> = (
  c: EdgeContext<TVariables>,
  next: () => Promise<Response>,
) => Promise<Response>;

type EdgeHandler<TVariables extends Record<string, unknown>> = (
  c: EdgeContext<TVariables>,
) => Promise<Response> | Response;

export class TypedEdgeRouter<TVariables extends Record<string, unknown> = Record<string, unknown>> {
  #middlewares: EdgeMiddleware<TVariables>[] = [];
  #routes: { method: string; pattern: RegExp; keys: string[]; handler: EdgeHandler<TVariables> }[] = [];

  use(mw: EdgeMiddleware<TVariables>): this {
    this.#middlewares.push(mw);
    return this;
  }

  get(pathPattern: string, handler: EdgeHandler<TVariables>): this {
    return this.#addRoute("GET", pathPattern, handler);
  }

  post(pathPattern: string, handler: EdgeHandler<TVariables>): this {
    return this.#addRoute("POST", pathPattern, handler);
  }

  #addRoute(method: string, pathPattern: string, handler: EdgeHandler<TVariables>): this {
    const keys: string[] = [];
    const regexSource =
      "^" +
      pathPattern.replace(/:([A-Za-z0-9_]+)/g, (_m, key) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$";
    this.#routes.push({ method, pattern: new RegExp(regexSource), keys, handler });
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const matched = this.#routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));
    if (!matched) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const matchExec = matched.pattern.exec(url.pathname);
    const params: Record<string, string> = {};
    matched.keys.forEach((k, idx) => {
      params[k] = decodeURIComponent(matchExec?.[idx + 1] ?? "");
    });

    const store = new Map<keyof TVariables, unknown>();
    const ctx: EdgeContext<TVariables> = {
      req,
      params,
      set: (key, value) => {
        store.set(key, value);
      },
      get: (key) => store.get(key) as TVariables[typeof key],
      json: (data, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
    };

    const dispatch = async (index: number): Promise<Response> => {
      if (index < this.#middlewares.length) {
        return await this.#middlewares[index](ctx, () => dispatch(index + 1));
      }
      return await matched.handler(ctx);
    };

    return await dispatch(0);
  }
}
