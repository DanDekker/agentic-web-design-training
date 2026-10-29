// Legacy Express.js Mutating req/res Callback Router
export function setupLegacyExpressRoutes(app: any) {
  app.use((req: any, res: any, next: any) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "Missing key" });
    req.tenantId = "tenant_" + apiKey;
    next();
  });

  app.get("/v1/orgs/:orgId/members", (req: any, res: any) => {
    res.status(200).json({
      tenantId: req.tenantId,
      orgId: req.params.orgId,
      runtime: "express-legacy"
    });
  });
}
