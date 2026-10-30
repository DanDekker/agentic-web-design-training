// Conditional inventory writes using Express 5 and an atomic storage operation.
// Authentication, authorization, and tenant scoping belong in the host application.
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
  // Compare and replace atomically. Versions are nonnegative safe integers,
  // never reused for a SKU, even after deletion/recreation. Advance on every
  // representation change, including changes to the stable JSON serialization.
  replaceIfMatch(sku: string, match: "*" | number[], quantity: number): Promise<InventoryItem | null>;
}

const SKU = /^[A-Za-z0-9_-]{1,64}$/;
const TAG = /^(W\/)?"([\x21\x23-\x7e\x80-\xff]*)"/;

// Parse an HTTP entity-tag list without splitting commas inside quoted tags.
// Null means malformed or over the local resource limits; weak and unrelated
// valid tags cannot match this application's strong version validators.
function parseIfMatch(value: string): "*" | number[] | null {
  if (value.length > 1024) return null;
  let i = 0;
  let count = 0;
  const versions: number[] = [];
  const skipWhitespace = () => { while (value[i] === " " || value[i] === "\t") i++; };
  skipWhitespace();
  if (value[i] === "*") {
    i++;
    skipWhitespace();
    return i === value.length ? "*" : null;
  }
  while (i < value.length) {
    skipWhitespace();
    if (i === value.length) break;
    // HTTP list syntax allows a reasonable number of empty list elements.
    if (value[i] === ",") { i++; continue; }
    const tag = TAG.exec(value.slice(i));
    if (!tag || ++count > 32) return null;
    if (!tag[1] && /^v(?:0|[1-9][0-9]*)$/.test(tag[2])) {
      const version = Number(tag[2].slice(1));
      if (Number.isSafeInteger(version)) versions.push(version);
    }
    i += tag[0].length;
    skipWhitespace();
    if (i < value.length && value[i++] !== ",") return null;
  }
  return count ? versions : null;
}

export function registerInventoryRoutes(app: InventoryApp, express: InventoryParsers, store: InventoryStore): void {
  app.get("/v1/inventory/:sku", async (req, res) => {
    const sku = req.params.sku;
    if (!sku || !SKU.test(sku)) return res.status(404).json({ error: "Not found" });
    const item = await store.find(sku);
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.status(200).set("Cache-Control", "private, no-store").set("ETag", `"v${item.version}"`)
      .json({ sku: item.sku, quantity: item.quantity });
  });

  app.put("/v1/inventory/:sku", express.json({ type: "application/json", limit: 65536, inflate: false, strict: true }), async (req, res) => {
    const sku = req.params.sku;
    if (!sku || !SKU.test(sku)) return res.status(404).json({ error: "Not found" });
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !Object.hasOwn(body, "quantity") ||
      !Number.isInteger((body as { quantity: unknown }).quantity) ||
      (body as { quantity: number }).quantity < 0 || (body as { quantity: number }).quantity > 1000000) {
      return res.status(400).json({ error: "Invalid inventory quantity" });
    }
    const raw = req.get("if-match");
    if (raw === undefined) return res.status(428).set("Cache-Control", "no-store").json({ error: "If-Match required" });
    const match = parseIfMatch(raw);
    if (match === null) return res.status(400).json({ error: "Invalid If-Match" });
    if (Array.isArray(match) && match.length === 0) return res.status(412).json({ error: "Precondition failed" });
    const updated = await store.replaceIfMatch(sku, match, (body as { quantity: number }).quantity);
    if (!updated) return res.status(412).json({ error: "Precondition failed" });
    // The PUT request body is not identical to the representation: do not
    // return a validator here. The client can GET the updated representation.
    return res.status(204).end();
  });
}
