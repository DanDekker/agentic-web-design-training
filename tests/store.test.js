import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore, TITLE_MAX, ValidationError } from "../src/store.js";

let dir;
let file;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gauntlet-web-store-"));
  file = join(dir, "tasks.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("TaskStore", () => {
  test("starts empty and adds a task", async () => {
    const store = await new TaskStore(file).load();
    expect(store.list()).toEqual([]);

    const task = await store.add("  write   the thing  ");
    expect(task.title).toBe("write the thing");
    expect(task.done).toBe(false);
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(store.list()).toHaveLength(1);
  });

  test("rejects empty and oversized titles", async () => {
    const store = await new TaskStore(file).load();
    await expect(store.add("   ")).rejects.toBeInstanceOf(ValidationError);
    await expect(store.add(42)).rejects.toBeInstanceOf(ValidationError);
    await expect(store.add("x".repeat(TITLE_MAX + 1))).rejects.toBeInstanceOf(ValidationError);
    expect(store.list()).toHaveLength(0);
  });

  test("rejects duplicate task IDs and unknown destination boards", async () => {
    const store = await new TaskStore(file).load();
    await store.add({ id: "task-one", title: "First" });
    await expect(store.add({ id: "task-one", title: "Duplicate" })).rejects.toBeInstanceOf(ValidationError);
    await expect(store.add({ title: "Orphan", boardId: "missing" })).rejects.toBeInstanceOf(ValidationError);
    expect(store.list().map((task) => task.title)).toEqual(["First"]);
  });

  test("keeps rejected updates from changing or later persisting partial edits", async () => {
    const store = await new TaskStore(file).load();
    const task = await store.add("Original");
    await expect(store.update(task.id, { title: "Changed", priority: 9 })).rejects.toBeInstanceOf(ValidationError);
    await expect(store.update(task.id, { title: "Moved", boardId: "missing" })).rejects.toBeInstanceOf(ValidationError);
    expect(store.get(task.id).title).toBe("Original");
    await store.add("Another task");
    expect((await new TaskStore(file).load()).get(task.id).title).toBe("Original");
  });

  test("isolates nested input and returned values from the stored task", async () => {
    const store = await new TaskStore(file).load();
    const input = { title: "Exercise", tags: ["css"], refactorData: { criteria: ["Keep the baseline"] } };
    const created = await store.add(input);
    input.tags.push("input mutation");
    input.refactorData.criteria.push("input mutation");
    created.tags.push("return mutation");
    created.refactorData.criteria.push("return mutation");
    const snapshot = store.state();
    snapshot.tasks[0].refactorData.criteria.push("snapshot mutation");
    expect(store.get(created.id).tags).toEqual(["css"]);
    expect(store.get(created.id).refactorData.criteria).toEqual(["Keep the baseline"]);
    expect((await new TaskStore(file).load()).get(created.id).refactorData.criteria).toEqual(["Keep the baseline"]);
  });

  test("reattaches tasks with missing boards during load and restore", async () => {
    await Bun.write(file, JSON.stringify({
      version: 1,
      boards: [{ id: "board-one", name: "One", slug: "one" }],
      tasks: [{ id: "orphan", title: "Preserve me", boardId: "deleted-board" }],
    }));
    const store = await new TaskStore(file).load();
    expect(store.get("orphan").boardId).toBe("board-one");
    const restored = await store.restoreTasks([{ id: "restored", title: "Also preserve me", boardId: "missing" }]);
    expect(restored[0].boardId).toBe("board-one");
    await store.reorder("board-one", ["restored", "orphan"]);
    expect((await new TaskStore(file).load()).tasksIn("board-one").map((task) => task.id)).toEqual(["restored", "orphan"]);
  });

  test("toggles completion and stamps doneAt", async () => {
    const store = await new TaskStore(file).load();
    const { id } = await store.add("a");

    const done = await store.update(id, { done: true });
    expect(done.done).toBe(true);
    expect(typeof done.doneAt).toBe("string");

    const undone = await store.update(id, { done: false });
    expect(undone.done).toBe(false);
    expect(undone.doneAt).toBeNull();
  });

  test("returns null for unknown ids", async () => {
    const store = await new TaskStore(file).load();
    expect(await store.update("nope", { done: true })).toBeNull();
    expect(await store.remove("nope")).toBe(false);
  });

  test("persists across reloads", async () => {
    const first = await new TaskStore(file).load();
    await first.add("one");
    const second = await first.add("two");
    await first.update(second.id, { done: true });

    const reloaded = await new TaskStore(file).load();
    expect(reloaded.list().map((t) => [t.title, t.done])).toEqual([
      ["one", false],
      ["two", true],
    ]);

    const raw = JSON.parse(await readFile(file, "utf8"));
    expect(raw.version).toBe(1);
  });

  test("reorders, keeping tasks the client did not mention", async () => {
    const store = await new TaskStore(file).load();
    const a = await store.add("a");
    const b = await store.add("b");
    const c = await store.add("c");

    const next = await store.reorder([c.id, "ghost", a.id]);
    expect(next.map((t) => t.title)).toEqual(["c", "a", "b"]);
    expect(store.list().map((t) => t.title)).toEqual(["c", "a", "b"]);

    await expect(store.reorder("nope")).rejects.toBeInstanceOf(ValidationError);
  });

  test("clears only completed tasks", async () => {
    const store = await new TaskStore(file).load();
    const a = await store.add("a");
    await store.add("b");
    await store.update(a.id, { done: true });

    expect(await store.clearCompleted()).toBe(1);
    expect(store.list().map((t) => t.title)).toEqual(["b"]);
    expect(await store.clearCompleted()).toBe(0);
  });

  test("quarantines a corrupt data file instead of crashing", async () => {
    await Bun.write(file, "{ not json");
    const store = await new TaskStore(file).load();
    expect(store.list()).toEqual([]);
    await store.add("fresh start");
    expect(store.list()).toHaveLength(1);
  });
});
