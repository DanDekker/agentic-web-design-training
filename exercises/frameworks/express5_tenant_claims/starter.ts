// Claims are currently fetched by ID alone, so one organization can see another's data.
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
export interface TenantExpress { Router(options: { mergeParams: boolean }): TenantRouter }
export interface TenantApp { use(path: string, router: TenantRouter): unknown }
export interface Principal { id: string }
export interface TenantServices {
  authenticate(req: TenantRequest): Promise<Principal | null>;
  canReadClaims(principalId: string, orgId: string): Promise<boolean>;
  findClaim(orgId: string, claimId: string): Promise<{ id: string; status: string } | null>;
}

export function registerTenantClaimRoutes(app: TenantApp, express: TenantExpress, services: TenantServices): void {
  const router = express.Router({ mergeParams: false });
  router.get("/claims/:claimId", async (req, res) => {
    const claim = await services.findClaim("", req.params.claimId || "");
    return res.status(200).json({ claim });
  });
  app.use("/v1/organizations/:orgId", router);
}
