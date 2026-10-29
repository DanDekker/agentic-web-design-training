import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore, TITLE_MAX, ValidationError } from "../src/store.js";

let dir;
let file;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "guantlet-web-store-"));
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
