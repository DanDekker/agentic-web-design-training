// Repair this inventory API so concurrent editors cannot silently overwrite each other.
// In a real application, mount authentication, authorization, and tenant scoping first.
export interface InventoryRequest {
  params: Record<string, string | undefined>;
  body: unknown;
  get(name: string): string | undefined;
}
export interface InventoryResponse {
  status(code: number): this;
  set(name: string, value: string): this;
  json(body: unknown): this;
  end(): this;
}
export type InventoryHandler = (req: InventoryRequest, res: InventoryResponse) => unknown;
export interface InventoryApp {
  get(path: string, handler: InventoryHandler): unknown;
  put(path: string, parser: unknown, handler: InventoryHandler): unknown;
}
export interface InventoryParsers {
  json(options: { limit: number; inflate: boolean; strict: boolean; type: string }): unknown;
}
export interface InventoryItem { sku: string; quantity: number; version: number }
export interface InventoryStore {
  find(sku: string): Promise<InventoryItem | null>;
  // Atomic compare and replace; nonnegative safe-integer versions change for
  // every representation change and are never reused for a given SKU.
  replaceIfMatch(sku: string, match: "*" | number[], quantity: number): Promise<InventoryItem | null>;
}

export function registerInventoryRoutes(app: InventoryApp, express: InventoryParsers, store: InventoryStore): void {
  app.get("/v1/inventory/:sku", async (req, res) => {
    const item = await store.find(req.params.sku || "");
    return res.status(200).json(item);
  });
  app.put("/v1/inventory/:sku", express.json({ type: "application/json", limit: 65536, inflate: false, strict: true }), async (req, res) => {
    // BUG: wildcard is passed unconditionally; stale edits overwrite newer inventory.
    await store.replaceIfMatch(req.params.sku || "", "*", (req.body as { quantity: number }).quantity);
    return res.status(204).end();
  });
}
