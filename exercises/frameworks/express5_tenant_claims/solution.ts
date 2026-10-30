// A nested Express 5 router for a multi-tenant claims portal.
// These structural interfaces let the exercise run without installing Express.
export interface TenantRequest {
  params: Record<string, string | undefined>;
  get(name: string): string | undefined;
}
export interface TenantResponse {
  locals: { principal?: Principal };
  status(code: number): this;
  json(body: unknown): this;
}
export type TenantNext = (error?: unknown) => void;
export type TenantHandler = (req: TenantRequest, res: TenantResponse, next: TenantNext) => unknown;
export interface TenantRouter {
  get(path: string, ...handlers: TenantHandler[]): unknown;
}
export interface TenantExpress {
  Router(options: { mergeParams: boolean }): TenantRouter;
}
export interface TenantApp {
  use(path: string, router: TenantRouter): unknown;
}
export interface Principal { id: string }
export interface TenantServices {
  // Authenticates the request; null means no valid credentials. Unexpected failures reject.
  authenticate(req: TenantRequest): Promise<Principal | null>;
  canReadClaims(principalId: string, orgId: string): Promise<boolean>;
  // The backing query must constrain BOTH organization and claim ID.
  findClaim(orgId: string, claimId: string): Promise<{ id: string; status: string } | null>;
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export function registerTenantClaimRoutes(app: TenantApp, express: TenantExpress, services: TenantServices): void {
  const router = express.Router({ mergeParams: true });
  const authenticate: TenantHandler = async (req, res, next) => {
    const principal = await services.authenticate(req);
    if (!principal) return res.status(401).json({ error: "Unauthorized" });
    res.locals.principal = principal;
    return next();
  };

  router.get("/claims/:claimId", authenticate, async (req, res) => {
    const { orgId, claimId } = req.params;
    // Use the same response for missing membership and missing records.
    if (!orgId || !claimId || !ID.test(orgId) || !ID.test(claimId)) {
      return res.status(404).json({ error: "Not found" });
    }
    const principal = res.locals.principal;
    if (!principal || !(await services.canReadClaims(principal.id, orgId))) {
      return res.status(404).json({ error: "Not found" });
    }
    const claim = await services.findClaim(orgId, claimId);
    if (!claim) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ claim });
  });
  app.use("/v1/organizations/:orgId", router);
}
