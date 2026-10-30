import { describe, expect, test } from "bun:test";
import express from "express";
import { registerClaimRoutes, registerExpress5ProblemPipeline } from "../exercises/frameworks/express5_problem_details/solution.ts";
import { registerTenantClaimRoutes } from "../exercises/frameworks/express5_tenant_claims/solution.ts";
import { registerPaymentWebhook } from "../exercises/frameworks/express5_payment_webhook/solution.ts";
import { registerInventoryRoutes } from "../exercises/frameworks/express5_inventory_preconditions/solution.ts";

async function withServer(app, run) {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

describe("Express 5 reference integration", () => {
  test("forwards rejected route promises into the ordered problem response pipeline", async () => {
    const app = express();
    const logged = [];
    registerClaimRoutes(app, {
      async findById(id) {
        if (id === "broken") throw new Error("private database details");
        return id === "claim1" ? { id, status: "open" } : null;
      },
    });
    registerExpress5ProblemPipeline(app, { error(fields) { logged.push(fields); } });
    await withServer(app, async (base) => {
      const found = await fetch(`${base}/v1/claims/claim1`);
      expect(found.status).toBe(200);
      expect(await found.json()).toEqual({ claim: { id: "claim1", status: "open" } });
      const missing = await fetch(`${base}/v1/claims/missing`, { headers: { "x-request-id": "request-1" } });
      expect(missing.status).toBe(404);
      expect(missing.headers.get("content-type")).toContain("application/problem+json");
      expect((await missing.json()).requestId).toBe("request-1");
      const broken = await fetch(`${base}/v1/claims/broken`);
      expect(broken.status).toBe(500);
      expect(await broken.text()).not.toContain("private database details");
      expect(logged).toHaveLength(1);
      const unknown = await fetch(`${base}/unknown`);
      expect(unknown.status).toBe(404);
      expect((await unknown.json()).detail).toBe("No route matches this request.");
    });
  });

  test("merges nested organization parameters and checks membership before querying", async () => {
    const app = express();
    const lookups = [];
    registerTenantClaimRoutes(app, express, {
      async authenticate(req) { return req.get("authorization") === "Bearer valid" ? { id: "agent1" } : null; },
      async canReadClaims(id, org) { return id === "agent1" && org === "org1"; },
      async findClaim(org, id) { lookups.push([org, id]); return id === "claim1" ? { id, status: "open" } : null; },
    });
    await withServer(app, async (base) => {
      const path = "/v1/organizations/org1/claims/claim1";
      expect((await fetch(base + path)).status).toBe(401);
      const headers = { authorization: "Bearer valid" };
      const denied = await fetch(`${base}/v1/organizations/org2/claims/claim1`, { headers });
      expect(denied.status).toBe(404);
      expect(lookups).toEqual([]);
      const allowed = await fetch(base + path, { headers });
      expect(allowed.status).toBe(200);
      expect(await allowed.json()).toEqual({ claim: { id: "claim1", status: "open" } });
      expect(lookups).toEqual([["org1", "claim1"]]);
    });
  });

  test("verifies raw webhook bytes before general JSON parsing and enforces parser bounds", async () => {
    const app = express();
    const seen = [];
    const queued = [];
    registerPaymentWebhook(app, express, {
      async verify(raw, signature) {
        seen.push({ raw: [...raw], signature });
        return signature === "valid" ? { id: "evt_1", type: "payment_intent.succeeded", data: {} } : null;
      },
      async recordAndEnqueue(event) { if (!queued.includes(event.id)) queued.push(event.id); },
    });
    app.post("/ordinary", (req, res) => res.json(req.body));
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: "Request rejected" }));
    await withServer(app, async (base) => {
      const signedBytes = '{ "amount": 42 }';
      const send = (headers, body) => fetch(`${base}/webhooks/payments`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
      expect((await send({ "stripe-signature": "valid" }, signedBytes)).status).toBe(204);
      expect((await send({ "stripe-signature": "valid" }, signedBytes)).status).toBe(204);
      expect(seen[0]).toEqual({ raw: [...new TextEncoder().encode(signedBytes)], signature: "valid" });
      expect(queued).toEqual(["evt_1"]);
      expect((await send({}, signedBytes)).status).toBe(400);
      expect((await send({ "stripe-signature": "valid" }, "x".repeat(65537))).status).toBe(413);
      expect((await send({ "stripe-signature": "valid", "content-encoding": "gzip" }, signedBytes)).status).toBe(415);
      const ordinary = await fetch(`${base}/ordinary`, { method: "POST", headers: { "content-type": "application/json" }, body: '{"value":7}' });
      expect(await ordinary.json()).toEqual({ value: 7 });
    });
  });

  test("uses strong conditional requests and atomic updates for inventory", async () => {
    const app = express();
    let item = { sku: "item1", quantity: 9, version: 1 };
    registerInventoryRoutes(app, express, {
      async find(sku) { return sku === item.sku ? { ...item } : null; },
      async replaceIfMatch(sku, match, quantity) {
        if (sku !== item.sku || (match !== "*" && !match.includes(item.version))) return null;
        item = { sku, quantity, version: item.version + 1 };
        return { ...item };
      },
    });
    app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: "Request rejected" }));
    await withServer(app, async (base) => {
      const url = `${base}/v1/inventory/item1`;
      const get = await fetch(url);
      expect(get.status).toBe(200);
      expect(get.headers.get("etag")).toBe('"v1"');
      expect(await get.json()).toEqual({ sku: "item1", quantity: 9 });
      const put = (tag, body = '{"quantity":4}', extra = {}) => fetch(url, {
        method: "PUT", headers: { "content-type": "application/json", ...(tag === undefined ? {} : { "if-match": tag }), ...extra }, body,
      });
      const missing = await put(undefined);
      expect(missing.status).toBe(428);
      expect(missing.headers.get("cache-control")).toBe("no-store");
      expect((await put('W/"v1"')).status).toBe(412);
      expect((await put('"v1" "v2"')).status).toBe(400);
      expect((await put('*,"v1"')).status).toBe(400);
      expect((await put(Array(33).fill('"v1"').join(","))).status).toBe(400);
      expect((await put('"v1"', '{"quantity":-1}')).status).toBe(400);
      const race = await Promise.all([put('"v1"'), put('"v1"', '{"quantity":5}')]);
      expect(race.map((response) => response.status).sort()).toEqual([204, 412]);
      expect(race.find((response) => response.status === 204).headers.get("etag")).toBeNull();
      expect((await put(', , "opaque,tag", W/"v2", , "v2",')).status).toBe(204);
      expect((await put("*")).status).toBe(204);
      expect((await put('"v3"')).status).toBe(412);
      expect((await put("*", "x".repeat(65537))).status).toBe(413);
      expect((await put("*", '{"quantity":4}', { "content-encoding": "gzip" })).status).toBe(415);
      expect((await fetch(`${base}/v1/inventory/missing`, { method: "PUT", headers: { "content-type": "application/json", "if-match": "*" }, body: '{"quantity":4}' })).status).toBe(412);
    });
  });
});
