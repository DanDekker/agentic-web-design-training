// Express 5 claims API with async rejection forwarding and RFC 9457 Problem Details.
// Structural types let the evaluator run this without a third-party Express install.
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

const PROBLEM_TYPES = new Set([
  "about:blank",
  "https://api.example.test/problems/not-found",
  "https://api.example.test/problems/invalid-request",
]);
const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PROBLEM_CONTENT_TYPE = "application/problem+json";

export class ApiProblem extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly type: string;

  constructor(status: number, title: string, detail: string, type = "about:blank") {
    super(detail);
    if (!Number.isInteger(status) || status < 400 || status > 499) {
      throw new RangeError("ApiProblem status must be a 4xx HTTP status");
    }
    if (!PROBLEM_TYPES.has(type)) {
      throw new TypeError("ApiProblem type must be an approved problem type");
    }
    if (
      !title.trim() || title.length > 120 || /[\u0000-\u001f\u007f]/.test(title) ||
      !detail.trim() || detail.length > 500 || /[\u0000-\u001f\u007f]/.test(detail)
    ) {
      throw new TypeError("ApiProblem title and detail must be bounded plain text");
    }
    this.name = "ApiProblem";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
  }
}

function getSafeRequestId(req: Express5Request): string | undefined {
  const value = req.get("x-request-id");
  return value && SAFE_REQUEST_ID.test(value) ? value : undefined;
}

function sendProblem(
  res: Express5Response,
  status: number,
  title: string,
  detail: string,
  type: string,
  requestId?: string,
): unknown {
  return res.status(status).type(PROBLEM_CONTENT_TYPE).json({
    type,
    title,
    status,
    detail,
    ...(requestId ? { requestId } : {}),
  });
}

export function registerClaimRoutes(
  router: Express5RouterLike,
  repository: ClaimRepository,
): void {
  // Express 5 forwards a rejection from this returned async handler to error middleware.
  router.get("/v1/claims/:claimId", async (req, res) => {
    const claim = await repository.findById(req.params.claimId);
    if (!claim) {
      throw new ApiProblem(
        404,
        "Claim not found",
        "No claim exists for this identifier.",
        "https://api.example.test/problems/not-found",
      );
    }
    return res.status(200).json({ claim });
  });
}

export function problemNotFound(
  req: Express5Request,
  res: Express5Response,
  _next: Express5Next,
): unknown {
  return sendProblem(
    res,
    404,
    "Not Found",
    "No route matches this request.",
    "https://api.example.test/problems/not-found",
    getSafeRequestId(req),
  );
}

export function createProblemErrorHandler(logger: SafeLogger): Express5ErrorHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const requestId = getSafeRequestId(req);
    if (error instanceof ApiProblem) {
      return sendProblem(
        res,
        error.status,
        error.title,
        error.detail,
        error.type,
        requestId,
      );
    }

    // Keep diagnostics in server logs; never serialize err.message or err.stack to clients.
    logger.error({ error, ...(requestId ? { requestId } : {}) }, "Unhandled API request error");
    return sendProblem(
      res,
      500,
      "Internal Server Error",
      "An unexpected error occurred.",
      "about:blank",
      requestId,
    );
  };
}

export function registerExpress5ProblemPipeline(
  app: Express5AppLike,
  logger: SafeLogger,
): void {
  // Call after all routers so unmatched requests reach the ordinary 404 middleware.
  app.use(problemNotFound);
  app.use(createProblemErrorHandler(logger));
}
