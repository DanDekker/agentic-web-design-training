import { describe, expect, test } from "bun:test";
import { createClient, json, settle } from "./helpers/client-harness.js";

const challenge = (id, title = "Refactor task") => ({
  id, title, boardId: "board_today", done: false, priority: 0,
  refactorData: { difficulty: "advanced", starterCode: "const before = 1;", solutionCode: "const after = 2;" },
});

describe("Client dialogs and keyboard navigation", () => {
  test("task filters expose one native radio selection and update the list", async () => {
    const app = await createClient({ snapshot: { tasks: [
      { id: "active", title: "Active task", boardId: "board_today", done: false },
      { id: "done", title: "Completed task", boardId: "board_today", done: true },
    ] } });
    expect(app.get("filter-all").getAttribute("type")).toBe("radio");
    expect(app.get("filter-all").getAttribute("name")).toBe("task-filter");
    expect(app.get("filter-all").checked).toBe(true);
    await app.get("filter-done").emit("change");
    expect(app.get("filter-done").checked).toBe(true);
    expect(app.get("filter-all").checked).toBe(false);
    expect(app.get("list").children.map((row) => row.querySelector(".task-title").textContent)).toEqual(["Completed task"]);
    await app.key("1");
    expect(app.get("filter-all").checked).toBe(true);
    expect(app.get("list").children).toHaveLength(2);
  });

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

  test("palette exposes its active option and leaves Tab to the browser", async () => {
    const app = await createClient();
    await app.click("btn-oauth-portal");
    await app.key("k", { metaKey: true });
    expect(app.get("palette").open).toBe(true);
    expect(app.get("palette-input").getAttribute("role")).toBe("combobox");
    expect(app.get("palette-input").getAttribute("aria-expanded")).toBe("true");
    expect(app.get("palette-input").getAttribute("aria-activedescendant")).toBe("palette-option-0");
    await app.key("ArrowDown");
    expect(app.get("palette-list").children[1].getAttribute("aria-selected")).toBe("true");
    expect(app.get("palette-input").getAttribute("aria-activedescendant")).toBe("palette-option-1");
    await app.key("ArrowUp");
    expect(app.get("palette-list").children[0].getAttribute("aria-selected")).toBe("true");
    expect((await app.key("Tab")).defaultPrevented).not.toBe(true);
    expect((await app.key("Tab", { shiftKey: true })).defaultPrevented).not.toBe(true);
    await app.key("Escape");
    expect(app.get("palette").open).toBe(false);
    expect(app.get("palette-input").getAttribute("aria-expanded")).toBe("false");
    expect(app.get("oauth-modal").open).toBe(true);
    await app.key("Escape");
    expect(app.get("oauth-modal").open).toBe(false);
  });

  test("palette reports an empty search and provides a close button", async () => {
    const app = await createClient();
    await app.key("k", { ctrlKey: true });
    await app.input("palette-input", "no matching command");
    expect(app.get("palette-empty").hidden).toBe(false);
    expect(app.get("palette-list").hidden).toBe(true);
    expect(app.get("palette-input").getAttribute("aria-expanded")).toBe("false");
    expect(app.get("palette-input").getAttribute("aria-activedescendant")).toBeNull();
    await app.input("palette-input", "new task");
    expect(app.get("palette-empty").hidden).toBe(true);
    expect(app.get("palette-input").getAttribute("aria-expanded")).toBe("true");
    await app.click("palette-close");
    expect(app.get("palette").open).toBe(false);
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
  test("restores focus to the inspector control after a live rerender", async () => {
    const app = await createClient({ snapshot: { tasks: [challenge("live-inspector")] } });
    const opener = app.get("list").querySelector(".refactor-inspect-btn");
    await app.click(opener);
    app.snapshot.tasks[0].title = "Updated elsewhere";
    await app.refresh();
    expect(opener.isConnected).toBe(false);
    await app.click("btn-close-refactor");
    expect(app.document.activeElement).toBe(app.get("list").querySelector(".refactor-inspect-btn"));
  });

  test("code tabs expose their panels and support keyboard navigation", async () => {
    const app = await createClient({ snapshot: { tasks: [challenge("tabs")] } });
    await app.click(app.get("list").querySelector(".refactor-inspect-btn"));
    const starter = app.get("code-tab-starter");
    const solution = app.get("code-tab-solution");
    const verify = app.get("code-tab-verify");
    expect(starter.getAttribute("aria-controls")).toBe("tab-starter");
    expect(starter.getAttribute("aria-selected")).toBe("true");
    expect(app.get("tab-solution").hidden).toBe(true);
    starter.focus();
    expect((await app.key("ArrowRight", {}, starter)).defaultPrevented).toBe(true);
    expect(app.document.activeElement).toBe(solution);
    expect(solution.getAttribute("aria-selected")).toBe("true");
    expect(solution.getAttribute("tabindex")).toBe("0");
    expect(starter.getAttribute("tabindex")).toBe("-1");
    expect(app.get("tab-starter").hidden).toBe(true);
    expect(app.get("tab-solution").hidden).toBe(false);
    await app.key("End", {}, solution);
    expect(app.document.activeElement).toBe(verify);
    expect(app.get("tab-verify").hidden).toBe(false);
    expect(app.get("refactor-submit-code").getAttribute("aria-label")).toBe("Your solution");
    await app.key("ArrowRight", {}, verify);
    expect(app.document.activeElement).toBe(starter);
  });

  test("announces verification results without relying on color", async () => {
    const app = await createClient({
      snapshot: { tasks: [challenge("checks")] },
      route: ({ path }) => path === "/api/curriculum/evaluate" ? json({
        passed: false, score: 50, telemetry: { durationMs: 1, assertions: { passed: 1, total: 2 } },
        diff: { lineDelta: 0 }, assertionResults: [],
      }) : undefined,
    });
    await app.click(app.get("list").querySelector(".refactor-inspect-btn"));
    await app.click("code-tab-verify");
    await app.click("btn-run-verify");
    expect(app.get("verify-result").hidden).toBe(false);
    expect(app.get("verify-announcement").textContent).toBe("Checks incomplete: 1 of 2 assertions passed.");
  });

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
  test("board selection retains focus and announces the active board", async () => {
    const app = await createClient();
    await app.click(app.get("board-tabs").children[1]);
    let selected = app.get("board-tabs").children[1];
    expect(app.document.activeElement).toBe(selected);
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    expect(app.get("board-tabs").children[0].getAttribute("aria-pressed")).toBe("false");
    await app.refresh();
    selected = app.get("board-tabs").children[1];
    expect(app.document.activeElement).toBe(selected);
  });

  test("task actions keep focus on the updated or next available control", async () => {
    const app = await createClient({
      snapshot: { tasks: [
        { id: "one", title: "One", boardId: "board_today", done: false },
        { id: "two", title: "Two", boardId: "board_today", done: false },
      ] },
      route: ({ method, path, snapshot }) => {
        if (method === "DELETE" && path.startsWith("/api/tasks/")) {
          snapshot.tasks = snapshot.tasks.filter((task) => task.id !== path.split("/").at(-1));
          return new Response(null, { status: 204 });
        }
      },
    });
    await app.click(app.get("list").children[0].querySelector(".check"));
    expect(app.document.activeElement).toBe(app.get("list").children[0].querySelector(".check"));
    expect(app.document.activeElement.getAttribute("aria-pressed")).toBe("true");
    await app.click(app.get("list").children[0].querySelector(".remove"));
    expect(app.document.activeElement).toBe(app.get("list").children[0].querySelector(".check"));
    await app.click(app.get("list").children[0].querySelector(".remove"));
    expect(app.document.activeElement).toBe(app.get("new-task"));
  });

  test("SSE refreshes visible tasks while preserving the selected board", async () => {
    const app = await createClient({ search: "?board=agentic-refactoring" });
    await app.click(app.get("board-tabs").children[0]);
    app.snapshot.tasks[0].title = "Updated in another tab";
    await app.refresh();
    expect(app.get("board-title").textContent).toBe("Today.");
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Updated in another tab");
  });

  test("event stream connection and reconnection reconcile missed state and open chat", async () => {
    let latestSeq = 2;
    const app = await createClient({ route: ({ method, path }) => {
      if (method === "GET" && path.startsWith("/api/chat/messages")) {
        return json({ latestSeq, messages: [{ seq: latestSeq, sender: "pp", recipient: "agent", text: `Message ${latestSeq}` }], typingUsers: [] });
      }
    } });
    app.snapshot.tasks[0].title = "Changed before connection";
    await app.openEvents();
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Changed before connection");

    await app.click("btn-chat-portal");
    app.snapshot.tasks[0].title = "Changed while disconnected";
    latestSeq = 3;
    await app.reconnectEvents();
    expect(app.get("list").querySelector(".task-title").textContent).toBe("Changed while disconnected");
    expect(app.get("chat-stat-seq").textContent).toBe("3");
    expect(app.get("chat-messages-list").innerHTML).toContain("Message 3");
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

  test("benchmark filters and report requests follow the live catalog", async () => {
    const stats = { totalTasks: 9, byCategory: { css: 6, webassembly: 1, "technical-seo": 2 } };
    const app = await createClient({ route: ({ method, path }) => {
      if (path === "/api/curriculum/benchmark") return json(stats);
      if (path.startsWith("/api/curriculum/benchmark?format=markdown")) return json({ error: "Unavailable" }, 503);
      if (method === "POST" && path === "/api/curriculum/benchmark/run-all") {
        return json({ summary: { totalTasks: 2, passedTasks: 2, passRate: "100%", averageScore: 100, averageDurationMs: 1 }, results: [] });
      }
    } });
    expect(app.get("curriculum-count").textContent).toBe("9 exercises");
    const filter = app.get("bench-category-filter");
    expect(filter.children.map((option) => [option.value, option.textContent])).toEqual([
      ["", "All 3 categories (9 exercises)"],
      ["css", "css (6)"],
      ["technical-seo", "technical-seo (2)"],
      ["webassembly", "webassembly (1)"],
    ]);
    await app.click("btn-benchmark-portal");
    filter.value = "technical-seo";
    await filter.emit("change");
    expect(app.get("bench-total-tasks").textContent).toBe("2");
    await app.click("btn-run-full-benchmark");
    expect(app.requests.find((request) => request.path === "/api/curriculum/benchmark/run-all").body).toEqual({ category: "technical-seo" });
    expect(app.get("bench-pass-rate").textContent).toBe("100%");
    await app.click("btn-download-benchmark-md");
    const report = app.requests.find((request) => request.path.includes("format=markdown"));
    expect(new URL(report.path, "http://gauntlet-web.test").searchParams.get("category")).toBe("technical-seo");
    filter.value = "css";
    await filter.emit("change");
    expect(app.get("bench-total-tasks").textContent).toBe("6");
    expect(app.get("bench-pass-rate").textContent).toBe("—");
  });

  test("search and density controls have accessible names", async () => {
    const app = await createClient();
    expect(app.get("search-input").getAttribute("aria-label")).toBe("Search tasks and tags");
    expect(app.get("density-toggle").getAttribute("aria-label")).toBe("Compact density");
  });

  test("benchmark catalog retries after a failed initial request and preserves available selection", async () => {
    let attempts = 0;
    const stats = { totalTasks: 8, byCategory: { css: 5, "technical-seo": 3 } };
    const app = await createClient({ route: ({ path }) => {
      if (path === "/api/curriculum/benchmark") {
        attempts++;
        return attempts === 1 ? json({ error: "Unavailable" }, 503) : json(stats);
      }
    } });
    await app.click("btn-benchmark-portal");
    expect(attempts).toBe(2);
    expect(app.get("curriculum-count").textContent).toBe("8 exercises");
    const filter = app.get("bench-category-filter");
    filter.value = "technical-seo";
    await filter.emit("change");
    await app.click("btn-close-benchmark");
    stats.totalTasks = 10;
    stats.byCategory["technical-seo"] = 5;
    await app.click("btn-benchmark-portal");
    expect(filter.value).toBe("technical-seo");
    expect(app.get("bench-total-tasks").textContent).toBe("5");
  });
});
