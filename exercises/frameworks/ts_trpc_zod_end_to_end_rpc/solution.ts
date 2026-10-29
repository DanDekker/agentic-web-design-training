// End-to-End Type-Safe tRPC Procedure Builder with Context-Narrowing Middleware & Schema Parser
export type TRPCErrorCode = "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR";

export class TRPCError extends Error {
  readonly code: TRPCErrorCode;
  constructor(opts: { code: TRPCErrorCode; message: string }) {
    super(opts.message);
    this.name = "TRPCError";
    this.code = opts.code;
  }
}

export interface SchemaValidator<T> {
  parse(raw: unknown): T;
}

type MiddlewareFn<TContextIn, TContextOut> = (opts: {
  ctx: TContextIn;
  next: <TNewCtx>(nextOpts?: { ctx: TNewCtx }) => Promise<TNewCtx>;
}) => Promise<TContextOut>;

export class ProcedureBuilder<TContext, TInput = undefined> {
  #middlewares: MiddlewareFn<any, any>[];
  #inputSchema?: SchemaValidator<TInput>;

  constructor(middlewares: MiddlewareFn<any, any>[] = [], inputSchema?: SchemaValidator<TInput>) {
    this.#middlewares = middlewares;
    this.#inputSchema = inputSchema;
  }

  use<TNewContext>(fn: MiddlewareFn<TContext, TNewContext>): ProcedureBuilder<TNewContext, TInput> {
    return new ProcedureBuilder<TNewContext, TInput>([...this.#middlewares, fn], this.#inputSchema);
  }

  input<TNewInput>(schema: SchemaValidator<TNewInput>): ProcedureBuilder<TContext, TNewInput> {
    return new ProcedureBuilder<TContext, TNewInput>(this.#middlewares, schema);
  }

  mutation<TOutput>(resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput) {
    return this.#buildProcedure("mutation", resolver);
  }

  query<TOutput>(resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput) {
    return this.#buildProcedure("query", resolver);
  }

  #buildProcedure<TOutput>(
    type: "query" | "mutation",
    resolver: (opts: { ctx: TContext; input: TInput }) => Promise<TOutput> | TOutput,
  ) {
    const middlewares = this.#middlewares;
    const schema = this.#inputSchema;

    return {
      _type: type,
      async call(rawCtx: unknown, rawInput?: unknown): Promise<TOutput> {
        let currentCtx: any = rawCtx;
        for (const mw of middlewares) {
          currentCtx = await mw({
            ctx: currentCtx,
            next: async (nextOpts) => (nextOpts && "ctx" in nextOpts ? nextOpts.ctx : currentCtx),
          });
        }

        let parsedInput: any = rawInput;
        if (schema) {
          try {
            parsedInput = schema.parse(rawInput);
          } catch (err) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: err instanceof Error ? err.message : "Input validation failed",
            });
          }
        }

        return await resolver({ ctx: currentCtx as TContext, input: parsedInput as TInput });
      },
    };
  }
}

export function createTRPCRouter<TProcedures extends Record<string, { call: (ctx: any, input?: any) => Promise<any> }>>(
  procedures: TProcedures,
) {
  return {
    procedures,
    createCaller(ctx: unknown): {
      [K in keyof TProcedures]: (input?: unknown) => ReturnType<TProcedures[K]["call"]>;
    } {
      const caller: Record<string, (input?: unknown) => Promise< unknown >> = {};
      for (const [key, proc] of Object.entries(procedures)) {
        caller[key] = (input?: unknown) => proc.call(ctx, input);
      }
      return caller as any;
    },
  };
}
