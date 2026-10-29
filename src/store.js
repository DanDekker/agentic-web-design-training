/**
 * Board + task persistence: an ordered, in-memory model backed by one JSON file.
 * Writes are serialised and atomic (tmp file + rename), so a crash never leaves a
 * half-written data file behind. Supports single-list legacy calls and multi-board
 * rich refactoring task workflows.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";

export const TITLE_MAX = 300;
export const NOTES_MAX = 4000;
export const BOARD_NAME_MAX = 60;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const clone = (value) => ({ ...value });
const squeeze = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

function slugify(name) {
  const slug = squeeze(name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "board";
}

function makeBoard(name, id = randomUUID()) {
  return { id, name: squeeze(name), slug: slugify(name), createdAt: new Date().toISOString() };
}

function isBoard(value) {
  return value && typeof value === "object" && typeof value.id === "string" && typeof value.name === "string";
}

function isTask(value) {
  return value && typeof value === "object" && typeof value.id === "string" && typeof value.title === "string";
}

function cleanTitle(value) {
  if (typeof value !== "string") throw new ValidationError("A task needs a title.");
  const title = squeeze(value);
  if (!title) throw new ValidationError("A task needs a title.");
  if (title.length > TITLE_MAX) throw new ValidationError(`Keep the title under ${TITLE_MAX} characters.`);
  return title;
}

function cleanNotes(value) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") throw new ValidationError("Notes must be text.");
  if (value.length > NOTES_MAX) throw new ValidationError(`Keep notes under ${NOTES_MAX} characters.`);
  return value;
}

function cleanPriority(value) {
  const priority = Number(value);
  if (!Number.isInteger(priority) || priority < 0 || priority > 2) {
    throw new ValidationError("Priority must be 0 (none), 1 (low) or 2 (high).");
  }
  return priority;
}

function cleanDue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError("Due date must look like YYYY-MM-DD.");
  }
  return value;
}

export class TaskStore {
  #file;
  #boards = [];
  #tasks = [];
  #queue = Promise.resolve();

  constructor(file) {
    this.#file = file;
  }

  async load() {
    try {
      const raw = await readFile(this.#file, "utf8");
      this.#hydrate(JSON.parse(raw));
    } catch (err) {
      if (err.code === "ENOENT") {
        await this.#seedFresh();
      } else if (err instanceof SyntaxError) {
        // Never lose data silently: quarantine the unreadable file and start clean.
        const aside = `${this.#file}.corrupt-${Date.now()}`;
        await rename(this.#file, aside).catch(() => {});
        console.warn(`[store] unreadable data file moved to ${aside}`);
        await this.#seedFresh();
      } else {
        throw err;
      }
    }
    return this;
  }

  async #seedFresh() {
    const today = makeBoard("Today", "board_today");
    const refactorBoard = makeBoard("Agentic Refactoring", "board_refactor_curriculum");
    this.#boards = [today, refactorBoard];
    this.#tasks = [];
    await this.#persist();
  }

  #hydrate(parsed) {
    const boards = Array.isArray(parsed?.boards) ? parsed.boards.filter(isBoard) : [];
    const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks.filter(isTask) : [];

    if (boards.length === 0) {
      // v1 migration: a single flat list becomes the first board.
      const board = makeBoard("Today", "board_today");
      this.#boards = [board];
      this.#tasks = rawTasks.map((task) => this.#normalize(task, board.id));
      return;
    }

    this.#boards = boards.map((board) => ({ ...board }));
    const known = new Set(this.#boards.map((board) => board.id));
    const fallbackBoardId = this.#boards[0]?.id || "board_today";
    this.#tasks = rawTasks.map((task) =>
      this.#normalize(task, known.has(task.boardId) ? task.boardId : fallbackBoardId),
    );
  }

  #normalize(task, boardId) {
    const now = new Date().toISOString();
    return {
      id: task.id || randomUUID(),
      boardId: task.boardId || boardId,
      title: squeeze(task.title),
      notes: typeof task.notes === "string" ? task.notes : "",
      priority: Number.isInteger(task.priority) ? task.priority : 0,
      due: typeof task.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? task.due : null,
      done: Boolean(task.done),
      category: typeof task.category === "string" ? task.category : "task",
      tags: Array.isArray(task.tags) ? task.tags : [],
      refactorData: task.refactorData && typeof task.refactorData === "object" ? task.refactorData : null,
      createdAt: task.createdAt ?? now,
      updatedAt: task.updatedAt ?? task.createdAt ?? now,
      doneAt: task.doneAt ?? null,
    };
  }

  /* ── reads ─────────────────────────────────────────────── */

  state() {
    return { boards: this.#boards.map(clone), tasks: this.#tasks.map(clone) };
  }

  list() {
    return this.#tasks.map(clone);
  }

  listTasks() {
    return this.list();
  }

  listBoards() {
    return this.#boards.map(clone);
  }

  tasksIn(boardId) {
    return this.#tasks.filter((task) => task.boardId === boardId).map(clone);
  }

  board(id) {
    const board = this.#boards.find((b) => b.id === id);
    return board ? clone(board) : null;
  }

  get(id) {
    const task = this.#tasks.find((t) => t.id === id);
    return task ? clone(task) : null;
  }

  /* ── boards ────────────────────────────────────────────── */

  #uniqueSlug(base, exceptId = null) {
    const taken = new Set(this.#boards.filter((b) => b.id !== exceptId).map((b) => b.slug));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  }

  async addBoard(name, id = undefined) {
    const cleanName = squeeze(name);
    if (!cleanName) throw new ValidationError("A board needs a name.");
    if (cleanName.length > BOARD_NAME_MAX) {
      throw new ValidationError(`Keep the board name under ${BOARD_NAME_MAX} characters.`);
    }
    if (id && this.#boards.some((b) => b.id === id)) {
      throw new ValidationError("That board already exists.");
    }

    const board = makeBoard(cleanName, id ?? randomUUID());
    board.slug = this.#uniqueSlug(board.slug);
    this.#boards.push(board);
    await this.#persist();
    return clone(board);
  }

  async renameBoard(id, name) {
    const board = this.#boards.find((b) => b.id === id);
    if (!board) return null;
    const cleanName = squeeze(name);
    if (!cleanName) throw new ValidationError("A board needs a name.");
    if (cleanName.length > BOARD_NAME_MAX) {
      throw new ValidationError(`Keep the board name under ${BOARD_NAME_MAX} characters.`);
    }

    board.name = cleanName;
    board.slug = this.#uniqueSlug(slugify(cleanName), board.id);
    await this.#persist();
    return clone(board);
  }

  async deleteBoard(id) {
    const index = this.#boards.findIndex((b) => b.id === id);
    if (index === -1) return null;
    if (this.#boards.length === 1) throw new ValidationError("Keep at least one board.");

    const [board] = this.#boards.splice(index, 1);
    const removedTasks = this.#tasks.filter((task) => task.boardId === id);
    this.#tasks = this.#tasks.filter((task) => task.boardId !== id);
    await this.#persist();
    return { board: clone(board), removedTasks: removedTasks.map(clone) };
  }

  /* ── tasks ─────────────────────────────────────────────── */

  #insert(task) {
    let last = -1;
    this.#tasks.forEach((existing, index) => {
      if (existing.boardId === task.boardId) last = index;
    });
    if (last === -1) {
      this.#tasks.push(task);
    } else {
      this.#tasks.splice(last + 1, 0, task);
    }
  }

  async add(input) {
    // Supports add(title: string) and add(taskObject)
    let title, boardId, notes, priority, due, category, tags, refactorData;
    if (typeof input === "string") {
      title = input;
      boardId = this.#boards[0]?.id;
    } else if (input && typeof input === "object") {
      title = input.title;
      boardId = input.boardId || this.#boards[0]?.id;
      notes = input.notes;
      priority = input.priority;
      due = input.due;
      category = input.category;
      tags = input.tags;
      refactorData = input.refactorData;
    } else {
      throw new ValidationError("A task needs a title.");
    }

    const board = this.#boards.find((b) => b.id === boardId) ?? this.#boards[0];
    const now = new Date().toISOString();
    const task = {
      id: input?.id || randomUUID(),
      boardId: board?.id || "board_today",
      title: cleanTitle(title),
      notes: cleanNotes(notes),
      priority: cleanPriority(priority ?? 0),
      due: cleanDue(due ?? null),
      done: Boolean(input?.done),
      category: typeof category === "string" ? category : "task",
      tags: Array.isArray(tags) ? tags : [],
      refactorData: refactorData && typeof refactorData === "object" ? refactorData : null,
      createdAt: now,
      updatedAt: now,
      doneAt: null,
    };

    this.#insert(task);
    await this.#persist();
    return clone(task);
  }

  async addTask(input) {
    return this.add(input);
  }

  async update(id, patch = {}) {
    const task = this.#tasks.find((t) => t.id === id);
    if (!task) return null;

    if (patch.title !== undefined) task.title = cleanTitle(patch.title);
    if (patch.notes !== undefined) task.notes = cleanNotes(patch.notes);
    if (patch.priority !== undefined) task.priority = cleanPriority(patch.priority);
    if (patch.due !== undefined) task.due = cleanDue(patch.due);
    if (patch.category !== undefined) task.category = String(patch.category);
    if (Array.isArray(patch.tags)) task.tags = patch.tags;
    if (patch.refactorData !== undefined) task.refactorData = patch.refactorData;

    if (patch.done !== undefined) {
      const done = Boolean(patch.done);
      if (done !== task.done) {
        task.done = done;
        task.doneAt = done ? new Date().toISOString() : null;
      }
    }

    if (patch.boardId !== undefined && patch.boardId !== task.boardId) {
      const board = this.#boards.find((b) => b.id === patch.boardId);
      if (!board) throw new ValidationError("Unknown board.");
      this.#tasks.splice(this.#tasks.indexOf(task), 1);
      task.boardId = board.id;
      this.#insert(task);
    }

    task.updatedAt = new Date().toISOString();
    await this.#persist();
    return clone(task);
  }

  async updateTask(id, patch = {}) {
    return this.update(id, patch);
  }

  async remove(id) {
    const index = this.#tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.#tasks.splice(index, 1);
    await this.#persist();
    return true;
  }

  async removeTask(id) {
    const index = this.#tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [task] = this.#tasks.splice(index, 1);
    await this.#persist();
    return clone(task);
  }

  async restoreTasks(tasks) {
    if (!Array.isArray(tasks)) throw new ValidationError("restore needs an array of tasks.");
    const restored = [];
    for (const raw of tasks) {
      if (!isTask(raw)) continue;
      if (this.#tasks.some((t) => t.id === raw.id)) continue;
      const board = this.#boards.find((b) => b.id === raw.boardId) || this.#boards[0];
      const task = this.#normalize(raw, board.id);
      this.#insert(task);
      restored.push(clone(task));
    }
    await this.#persist();
    return restored;
  }

  /**
   * Reorder tasks. Supports:
   * reorder(ids: string[]) -> legacy global reorder
   * reorder(boardId: string, ids: string[]) -> board-specific reorder
   */
  async reorder(arg1, arg2) {
    let boardId = null;
    let ids = null;

    if (Array.isArray(arg1)) {
      ids = arg1;
    } else if (typeof arg1 === "string" && Array.isArray(arg2)) {
      boardId = arg1;
      ids = arg2;
    } else {
      throw new ValidationError("reorder needs an array of ids.");
    }

    if (!Array.isArray(ids)) throw new ValidationError("reorder needs an array of ids.");

    if (boardId) {
      const board = this.#boards.find((b) => b.id === boardId);
      if (!board) throw new ValidationError("Unknown board.");

      const inBoard = this.#tasks.filter((task) => task.boardId === board.id);
      const remaining = new Map(inBoard.map((task) => [task.id, task]));
      const ordered = [];
      for (const id of ids) {
        const task = remaining.get(id);
        if (task) {
          ordered.push(task);
          remaining.delete(id);
        }
      }
      for (const task of remaining.values()) ordered.push(task);

      const rebuilt = [];
      for (const b of this.#boards) {
        if (b.id === board.id) rebuilt.push(...ordered);
        else rebuilt.push(...this.#tasks.filter((task) => task.boardId === b.id));
      }
      this.#tasks = rebuilt;
    } else {
      // Global list reorder (backward compatible)
      const remaining = new Map(this.#tasks.map((t) => [t.id, t]));
      const next = [];
      for (const id of ids) {
        const task = remaining.get(id);
        if (task) {
          next.push(task);
          remaining.delete(id);
        }
      }
      for (const task of remaining.values()) next.push(task);
      this.#tasks = next;
    }

    await this.#persist();
    return this.list();
  }

  async clearCompleted(boardId = undefined) {
    const before = this.#tasks.length;
    this.#tasks = this.#tasks.filter(
      (task) => !task.done || (boardId !== undefined && task.boardId !== boardId),
    );
    const removed = before - this.#tasks.length;
    if (removed > 0) await this.#persist();
    return removed;
  }

  /**
   * Seed Agentic Curriculum Refactoring Tasks into the "Agentic Refactoring" board.
   */
  async seedCurriculumTasks() {
    let board = this.#boards.find((b) => b.id === "board_refactor_curriculum");
    if (!board) {
      board = await this.addBoard("Agentic Refactoring", "board_refactor_curriculum");
    }

    const created = [];
    for (const item of REFACTORING_CURRICULUM_TASKS) {
      const existing = this.#tasks.find((t) => t.id === item.id);
      if (!existing) {
        const task = await this.add({
          id: item.id,
          boardId: board.id,
          title: item.title,
          category: item.category,
          tags: item.tags,
          priority: item.difficulty === "advanced" ? 2 : item.difficulty === "intermediate" ? 1 : 0,
          notes: `${item.instructions}\n\n[Refactoring Criteria]\n${item.criteria.map((c) => `- ${c}`).join("\n")}`,
          refactorData: {
            difficulty: item.difficulty,
            track: item.track,
            order: item.order,
            instructions: item.instructions,
            starterCode: item.starterCode,
            solutionCode: item.solutionCode,
            criteria: item.criteria,
          },
        });
        created.push(task);
      }
    }
    return created;
  }

  /* ── persistence ───────────────────────────────────────── */

  #persist() {
    const payload = JSON.stringify({ version: 1, boards: this.#boards, tasks: this.#tasks }, null, 2);
    const run = this.#queue.catch(() => {}).then(async () => {
      await mkdir(dirname(this.#file), { recursive: true });
      const tmp = `${this.#file}.${process.pid}.tmp`;
      await writeFile(tmp, payload, "utf8");
      await rename(tmp, this.#file);
    });
    this.#queue = run.catch(() => {});
    return run;
  }
}
