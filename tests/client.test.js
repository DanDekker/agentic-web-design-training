import { describe, expect, test } from "bun:test";
import { createClient, json, settle } from "./helpers/client-harness.js";

const challenge = (id, title = "Refactor task") => ({
  id, title, boardId: "board_today", done: false, priority: 0,
  refactorData: { difficulty: "advanced", starterCode: "const before = 1;", solutionCode: "const after = 2;" },
});

describe("Client dialogs and keyboard navigation", () => {
  for (const [button, dialog, close] of [
    ["user-pill", "auth-modal", "btn-close-auth"],
    ["btn-oauth-portal", "oauth-modal", "btn-close-oauth"],
    ["btn-benchmark-portal", "benchmark-modal", "btn-close-benchmark"],
    ["btn-chat-portal", "chat-modal", "btn-close-chat"],
    ["btn-shop-portal", "shop-modal", "btn-close-shop"],
    ["btn-traffic-portal", "traffic-modal", "btn-close-traffic"],
    ["btn-design-portal", "design-modal", "btn-close-design"],
  ]) {
    test(`${dialog} opens, closes, and returns focus to its opener`, async () => {
      const app = await createClient();
      expect(app.get(dialog).open).toBe(false);
      await app.click(button);
      expect(app.get(dialog).open).toBe(true);
      await app.click(close);
      expect(app.get(dialog).open).toBe(false);
      expect(app.document.activeElement).toBe(app.get(button));
      await app.click(button);
      await app.key("Escape");
      expect(app.get(dialog).open).toBe(false);
    });
  }

  test("page shortcuts work initially and after a dialog closes", async () => {
    const app = await createClient();
    await app.key("n");
    expect(app.document.activeElement).toBe(app.get("new-task"));
    await app.key("Escape");
    await app.key("/");
    expect(app.document.activeElement).toBe(app.get("search-input"));
    app.document.body.focus();
    await app.key("b");
    expect(app.get("benchmark-modal").open).toBe(true);
    await app.key("Escape");
    await app.key("o");
    expect(app.get("oauth-modal").open).toBe(true);
    await app.key("Escape");
    await app.key("s");
    expect(app.get("shop-modal").open).toBe(true);
    await app.key("Escape");
    await app.key("w");
    expect(app.get("traffic-modal").open).toBe(true);
    await app.key("Escape");
    await app.key("d");
    expect(app.get("design-modal").open).toBe(true);
  });

  test("dialog and browser shortcuts do not act on background tasks", async () => {
    const app = await createClient();
    app.document.body.focus();
    expect((await app.key("n", { ctrlKey: true })).defaultPrevented).not.toBe(true);
    expect(app.document.activeElement).toBe(app.document.body);
    await app.key("j");
    await app.click("btn-oauth-portal");
    await app.key("x");
    await app.key("Delete");
    expect(app.requests.filter((req) => ["PATCH", "DELETE"].includes(req.method))).toEqual([]);
  });

  test("palette handles Shift+Tab and Escape dismisses only the top dialog", async () => {
    const app = await createClient();
    await app.click("btn-oauth-portal");
    await app.key("k", { metaKey: true });
    expect(app.get("palette").open).toBe(true);
    await app.key("Tab");
    expect(app.get("palette-list").children[1].getAttribute("aria-selected")).toBe("true");
    await app.key("Tab", { shiftKey: true });
    expect(app.get("palette-list").children[0].getAttribute("aria-selected")).toBe("true");
    await app.key("Escape");
    expect(app.get("palette").open).toBe(false);
    expect(app.get("oauth-modal").open).toBe(true);
    await app.key("Escape");
    expect(app.get("oauth-modal").open).toBe(false);
  });

  test("palette commands close other dialogs before focusing the page", async () => {
    const app = await createClient();
    await app.click("btn-oauth-portal");
    await app.key("k", { ctrlKey: true });
    await app.key("Enter");
    expect(app.get("palette").open).toBe(false);
    expect(app.get("oauth-modal").open).toBe(false);
    expect(app.document.activeElement).toBe(app.get("new-task"));
  });
});

describe("Refactor inspector", () => {
  test("the visible diff tracks edits, loading a solution, and deleting all code", async () => {
    const task = challenge("challenge-one");
    const app = await createClient({ snapshot: { tasks: [task] } });
    await app.click(app.get("list").querySelector(".refactor-inspect-btn"));
    expect(app.get("refactor-modal").open).toBe(true);
    expect(app.get("refactor-difficulty").getAttribute("level")).toBe("advanced");
    expect(app.get("gauntlet-web-diff-component").getAttribute("original")).toBe(task.refactorData.starterCode);
    await app.input("refactor-submit-code", "const changed = true;");
    expect(app.get("gauntlet-web-diff-component").getAttribute("modified")).toBe("const changed = true;");
    await app.click("btn-load-solution");
    expect(app.get("gauntlet-web-diff-component").getAttribute("modified")).toBe(task.refactorData.solutionCode);
    await app.input("refactor-submit-code", "");
    expect(app.get("gauntlet-web-diff-component").getAttribute("modified")).toBe("");
  });

  test("closing an inspector ignores late verification results for another task", async () => {
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    const app = await createClient({
      snapshot: { tasks: [challenge("one"), challenge("two")] },
      route: ({ path }) => path === "/api/curriculum/evaluate" ? pending : undefined,
    });
    await app.click(app.get("list").children[0].querySelector(".refactor-inspect-btn"));
    const verification = app.click("btn-run-verify");
    await settle();
    expect(app.get("btn-run-verify").disabled).toBe(true);
    await app.key("Escape");
    await app.click(app.get("list").children[1].querySelector(".refactor-inspect-btn"));
    finish(json({ passed: true }));
    await verification;
    expect(app.get("verify-result").hidden).toBe(true);
    expect(app.get("btn-run-verify").disabled).toBe(false);
    expect(app.requests.filter((req) => req.method === "PATCH")).toEqual([]);
  });
});

describe("Live state and rendering", () => {
  test("SSE refreshes visible tasks while preserving the selected board", async () => {
    const app = await createClient({ search: "?board=agentic-refactoring" });
    await app.click(app.get("board-tabs").children[0]);
    app.snapshot.tasks[0].title = "Updated in another tab";
    await app.refresh();
    expect(app.get("board-title").textContent).toBe("Today.");
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Updated in another tab");
  });

  test("live updates preserve an unfinished inline edit", async () => {
    const app = await createClient();
    await app.key("j");
    await app.key("Enter");
    const editor = app.get("list").querySelector(".task-edit");
    editor.value = "Unfinished edit";
    app.snapshot.tasks.push({ id: "remote", boardId: "board_today", title: "Remote task", done: false });
    await app.refresh();
    expect(app.get("list").querySelector(".task-edit")).toBe(editor);
    expect(editor.value).toBe("Unfinished edit");
    await app.key("Escape", {}, editor);
    expect(app.get("list").children).toHaveLength(2);
  });

  test("an edit saved after a live refresh updates the visible task", async () => {
    const app = await createClient();
    await app.key("j");
    await app.key("Enter");
    const editor = app.get("list").querySelector(".task-edit");
    editor.value = "Saved after refresh";
    await app.refresh();
    await app.key("Enter", {}, editor);
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Saved after refresh");
  });

  test("a create response arriving after SSE does not duplicate a task", async () => {
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    const app = await createClient({
      route: ({ method, path }) => method === "POST" && path === "/api/tasks" ? pending : undefined,
    });
    app.get("new-task").value = "Created once";
    await app.get("composer").emit("submit");
    await settle();
    const task = { id: "shared", boardId: "board_today", title: "Created once", done: false };
    app.snapshot.tasks.push(task);
    await app.refresh();
    finish(json(task, 201));
    await settle();
    expect(app.get("list").children).toHaveLength(2);
    expect(app.get("counts").textContent).toBe("0 of 2 done");
  });

  test("an old state response cannot undo a completed local mutation", async () => {
    let finish;
    let stale;
    let defer = false;
    const pending = new Promise((resolve) => { finish = resolve; });
    const app = await createClient({
      route: ({ path, snapshot }) => {
        if (path === "/api/state" && defer) {
          defer = false;
          stale = structuredClone(snapshot);
          return pending;
        }
      },
    });
    defer = true;
    await app.refresh();
    app.get("new-task").value = "Must remain visible";
    await app.get("composer").emit("submit");
    await settle();
    finish(json(stale));
    await settle();
    expect(app.get("list").children).toHaveLength(2);
    expect(app.get("list").children[1].querySelector(".task-title").textContent).toBe("Must remain visible");
  });

  test("out-of-order state responses cannot replace newer state", async () => {
    const pending = [];
    let defer = false;
    const app = await createClient({
      route: ({ path }) => path === "/api/state" && defer
        ? new Promise((resolve) => pending.push(resolve)) : undefined,
    });
    defer = true;
    await app.refresh();
    await app.refresh();
    const base = structuredClone(app.snapshot);
    pending[1](json({ ...base, tasks: [{ ...base.tasks[0], title: "Newest" }] }));
    await settle();
    pending[0](json({ ...base, tasks: [{ ...base.tasks[0], title: "Stale" }] }));
    await settle();
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Newest");
  });

  test("board names and OAuth metadata render as text instead of markup", async () => {
    const payload = "<img src=x onerror=alert(1)>";
    const app = await createClient({ snapshot: {
      boards: [{ id: "board_today", name: payload }],
      oauthClients: [{ name: payload, description: payload, clientId: payload, allowedScopes: [payload] }],
    } });
    expect(app.get("board-tabs").children[0].children[0].textContent).toBe(payload);
    await app.click("btn-oauth-portal");
    expect(app.get("oauth-clients-list").innerHTML).not.toContain("<img");
    expect(app.get("oauth-clients-list").innerHTML).toContain("&lt;img");
  });

  test("report download failures are shown to the user", async () => {
    const app = await createClient({
      route: ({ path }) => path.includes("format=markdown") ? json({ error: "Unavailable" }, 503) : undefined,
    });
    await app.click("btn-download-benchmark-md");
    expect(app.get("toast").textContent).toContain("Failed to download report: Request failed (503)");
  });
});
