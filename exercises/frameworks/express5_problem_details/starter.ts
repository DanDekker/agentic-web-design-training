// Express 5 claims API: complete the async route and the ordered error pipeline.
// These small structural types keep the exercise runnable without installing Express.
export interface Express5Request {
  readonly params: Record<string, string>;
  readonly path: string;
  get(name: string): string | undefined;
}

export interface Express5Response {
  readonly headersSent: boolean;
  status(code: number): this;
  type(contentType: string): this;
  json(body: unknown): this;
}

export type Express5Next = (error?: unknown) => void;
export type Express5Route = (
  req: Express5Request,
  res: Express5Response,
) => unknown;
export type Express5Middleware = (
  req: Express5Request,
  res: Express5Response,
  next: Express5Next,
) => unknown;
export type Express5ErrorHandler = (
  error: unknown,
  req: Express5Request,
  res: Express5Response,
  next: Express5Next,
) => unknown;

export interface Express5RouterLike {
  get(path: string, handler: Express5Route): unknown;
}

export interface Express5AppLike {
  use(handler: Express5Route | Express5Middleware | Express5ErrorHandler): unknown;
}

export interface ClaimRepository {
  findById(id: string): Promise<{ id: string; status: string } | null>;
}

export interface SafeLogger {
  error(fields: { error: unknown; requestId?: string }, message: string): void;
}

export class ApiProblem extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;

  constructor(status: number, title: string, detail: string, type = "about:blank") {
    super(detail);
    this.name = "ApiProblem";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
  }
}

export function registerClaimRoutes(
  router: Express5RouterLike,
  repository: ClaimRepository,
): void {
  router.get("/v1/claims/:claimId", async (req, res) => {
    const claim = await repository.findById(req.params.claimId);
    if (!claim) {
      throw new ApiProblem(404, "Claim not found", "No claim exists for this identifier.");
    }
    return res.status(200).json({ claim });
  });
}

export function problemNotFound(
  req: Express5Request,
  res: Express5Response,
  next: Express5Next,
): unknown {
  // TODO: This is ordinary middleware for unmatched routes, not error middleware.
  return next();
}

export function createProblemErrorHandler(logger: SafeLogger): Express5ErrorHandler {
  return (error, req, res, next) => {
    // TODO: Handle sent headers, safe request IDs, ApiProblem, and unknown errors.
    return next(error);
  };
}

export function registerExpress5ProblemPipeline(
  app: Express5AppLike,
  logger: SafeLogger,
): void {
  // TODO: Install the normal 404 handler before the four-argument error handler.
  app.use(createProblemErrorHandler(logger));
  app.use(problemNotFound);
}
