import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

let dir;
let handle;

const call = (method, path, body) =>
  handle(
    new Request(`http://guantlet-web.test${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "guantlet-web-design-"));
  const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
  const authStore = await new AuthStore(join(dir, "auth.json")).load();
  const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
  handle = createHandler(taskStore, createHub(), authStore, oauthServer);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("First-Party Proprietary Design System, W3C DTCG 2025.10 & OKLCH/APCA Engine", () => {
  test("exposes design system catalog and custom elements registry via GET /api/design/overview", async () => {
    const res = await call("GET", "/api/design/overview");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.track).toBe("design-systems-web-components");
    expect(data.categories).toEqual(["proprietary-design-systems", "ui-ux-interaction", "web-components"]);
    expect(data.designDirections.some((d) => d.id === "guantlet-web-monochrome-editorial")).toBe(true);
    expect(data.designDirections.some((d) => d.id === "w3c-dtcg-2025-10")).toBe(true);
    expect(data.customElementsRegistry.some((c) => c.tag === "guantlet-web-design-swatch")).toBe(true);
  });

  test("compiles W3C DTCG 2025.10 tokens with $type inheritance and rejects circular aliases via POST /api/design/tokens/compile", async () => {
    const res = await call("POST", "/api/design/tokens/compile", {
      selector: ":root",
    });
    expect(res.status).toBe(200);
    const compiled = await res.json();
    expect(compiled.standard).toBe("W3C DTCG 2025.10");
    expect(compiled.tokenCount).toBe(15);
    expect(compiled.cssText).toContain("--color-semantic-bgSurface: oklch(0.11 0.005 90);");

    // Circular alias rejection
    const badRes = await call("POST", "/api/design/tokens/compile", {
      tokens: {
        color: {
          $type: "color",
          a: { $value: "{color.b}" },
          b: { $value: "{color.a}" },
        },
      },
    });
    expect(badRes.status).toBe(422);
    const bad = await badRes.json();
    expect(bad.error).toContain("CircularTokenAliasError");
  });

  test("evaluates and auto-remediates OKLCH / APCA Lc contrast via POST /api/design/oklch/contrast", async () => {
    const res = await call("POST", "/api/design/oklch/contrast", {
      text: { l: 0.38, c: 0.02, h: 90 },
      surface: { l: 0.11, c: 0.005, h: 90 },
      minApcaLc: 70,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.wasAdjusted).toBe(true);
    expect(data.finalApcaLc).toBeGreaterThanOrEqual(70);
    expect(data.passesBodyCopy).toBe(true);
  });
});
