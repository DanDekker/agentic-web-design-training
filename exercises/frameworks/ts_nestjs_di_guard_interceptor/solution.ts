// TypeScript NestJS IoC Container, RBAC CanActivate Guard & Around-Advice Interceptor
export type Token<T = unknown> = string | symbol | (new (...args: any[]) => T);

export interface ExecutionContext {
  readonly handlerName: string;
  readonly requiredRoles: readonly string[];
  readonly request: {
    readonly user?: { readonly id: string; readonly roles: readonly string[] };
    readonly body?: Record<string, unknown>;
  };
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface CallHandler<T = unknown> {
  handle(): Promise<T>;
}

export interface NestInterceptor<T = unknown, R = unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Promise<R>;
}

export class NestContainer {
  #providers = new Map<Token, { useFactory: (c: NestContainer) => unknown; singleton?: boolean; instance?: unknown }>();

  register<T>(token: Token<T>, useFactory: (container: NestContainer) => T, singleton = true): this {
    this.#providers.set(token, { useFactory, singleton });
    return this;
  }

  resolve<T>(token: Token<T>): T {
    const entry = this.#providers.get(token);
    if (!entry) throw new Error(`No provider registered for token ${String(token)}`);
    if (entry.singleton) {
      if (entry.instance === undefined) {
        entry.instance = entry.useFactory(this);
      }
      return entry.instance as T;
    }
    return entry.useFactory(this) as T;
  }
}

export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.requiredRoles.length === 0) return true;
    const userRoles = context.request.user?.roles ?? [];
    return context.requiredRoles.some((role) => userRoles.includes(role));
  }
}

export class AuditTelemetryInterceptor<T> implements NestInterceptor<T, { data: T; audit: { handler: string; actorId: string; durationMs: number } }> {
  async intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Promise<{ data: T; audit: { handler: string; actorId: string; durationMs: number } }> {
    const t0 = Date.now();
    const data = await next.handle();
    return {
      data,
      audit: {
        handler: context.handlerName,
        actorId: context.request.user?.id ?? "anonymous",
        durationMs: Math.max(0, Date.now() - t0),
      },
    };
  }
}

export async function executeNestPipeline<T>(
  context: ExecutionContext,
  guards: readonly CanActivate[],
  interceptors: readonly NestInterceptor<any, any>[],
  handler: () => Promise<T>,
) {
  for (const guard of guards) {
    const allowed = await guard.canActivate(context);
    if (!allowed) {
      const err = new Error("Forbidden resource");
      (err as any).statusCode = 403;
      throw err;
    }
  }

  const dispatch = (idx: number): Promise<any> => {
    if (idx >= interceptors.length) return handler();
    return interceptors[idx].intercept(context, {
      handle: () => dispatch(idx + 1),
    });
  };

  return dispatch(0);
}
