/**
 * Board + task persistence: an ordered, in-memory model backed by one JSON file.
 * Changes are serialized within this store and become visible after an atomic
 * temporary-file replacement. Supports single-list legacy calls and multi-board
 * rich refactoring task workflows; it does not lock out other server processes.
 */
import { randomUUID } from "node:crypto";
import { REFACTORING_CURRICULUM_TASKS } from "./curriculum.js";
import { readJsonStore, writeJsonFile } from "./persistence.js";

export const TITLE_MAX = 300;
export const NOTES_MAX = 4000;
export const BOARD_NAME_MAX = 60;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const clone = (value) => structuredClone(value);
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
  #write;
  #seedOnCreate;

  constructor(file, { write = writeJsonFile, seedCurriculumOnCreate = false } = {}) {
    this.#file = file;
    this.#write = write;
    this.#seedOnCreate = seedCurriculumOnCreate;
  }

  async load() {
    const stored = await readJsonStore(this.#file, "store");
    if (stored.found) this.#hydrate(stored.value);
    else await this.#seedFresh();
    return this;
  }

  async #seedFresh() {
    const today = makeBoard("Today", "board_today");
    const refactorBoard = makeBoard("Agentic Refactoring", "board_refactor_curriculum");
    const state = { boards: [today, refactorBoard], tasks: [] };
    if (this.#seedOnCreate) this.#populateCurriculum(state);
    await this.#write(this.#file, JSON.stringify({ version: 1, ...state }, null, 2));
    this.#boards = state.boards;
    this.#tasks = state.tasks;
  }

  #hydrate(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        (parsed.version !== undefined && parsed.version !== 1) || !Array.isArray(parsed.tasks) ||
        (parsed.boards !== undefined && !Array.isArray(parsed.boards))) {
      throw new Error("Invalid or unsupported task store format; the data file was left unchanged.");
    }
    const boards = parsed.boards ?? [];
    const rawTasks = parsed.tasks;
    if (!boards.every(isBoard) || !rawTasks.every(isTask) ||
        new Set(boards.map((board) => board.id)).size !== boards.length ||
        new Set(rawTasks.map((task) => task.id)).size !== rawTasks.length) {
      throw new Error("Invalid or duplicate task store records; the data file was left unchanged.");
    }

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
      boardId,
      title: squeeze(task.title),
      notes: typeof task.notes === "string" ? task.notes : "",
      priority: Number.isInteger(task.priority) ? task.priority : 0,
      due: typeof task.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? task.due : null,
      done: Boolean(task.done),
      category: typeof task.category === "string" ? task.category : "task",
      tags: Array.isArray(task.tags) ? clone(task.tags) : [],
      refactorData: task.refactorData && typeof task.refactorData === "object" ? clone(task.refactorData) : null,
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

  #uniqueSlug(boards, base, exceptId = null) {
    const taken = new Set(boards.filter((b) => b.id !== exceptId).map((b) => b.slug));
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
    if (id != null && (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id))) {
      throw new ValidationError("Board ID must contain only letters, numbers, hyphens, and underscores.");
    }
    return this.#transaction((state) => {
      if (id && state.boards.some((b) => b.id === id)) {
        throw new ValidationError("That board already exists.");
      }
      const board = makeBoard(cleanName, id ?? randomUUID());
      board.slug = this.#uniqueSlug(state.boards, board.slug);
      state.boards.push(board);
      return { value: board };
    });
  }

  async renameBoard(id, name) {
    return this.#transaction((state) => {
      const board = state.boards.find((b) => b.id === id);
      if (!board) return { value: null, changed: false };
      const cleanName = squeeze(name);
      if (!cleanName) throw new ValidationError("A board needs a name.");
      if (cleanName.length > BOARD_NAME_MAX) {
        throw new ValidationError(`Keep the board name under ${BOARD_NAME_MAX} characters.`);
      }
      board.name = cleanName;
      board.slug = this.#uniqueSlug(state.boards, slugify(cleanName), board.id);
      return { value: board };
    });
  }

  async deleteBoard(id) {
    return this.#transaction((state) => {
      const index = state.boards.findIndex((b) => b.id === id);
      if (index === -1) return { value: null, changed: false };
      if (state.boards.length === 1) throw new ValidationError("Keep at least one board.");
      const [board] = state.boards.splice(index, 1);
      const removedTasks = state.tasks.filter((task) => task.boardId === id);
      state.tasks = state.tasks.filter((task) => task.boardId !== id);
      return { value: { board, removedTasks } };
    });
  }

  /* ── tasks ─────────────────────────────────────────────── */

  #insert(tasks, task) {
    let last = -1;
    tasks.forEach((existing, index) => {
      if (existing.boardId === task.boardId) last = index;
    });
    if (last === -1) {
      tasks.push(task);
    } else {
      tasks.splice(last + 1, 0, task);
    }
  }

  #makeTask(input, state) {
    // Supports add(title: string) and add(taskObject)
    let title, boardId, notes, priority, due, category, tags, refactorData;
    if (typeof input === "string") {
      title = input;
      boardId = state.boards[0]?.id;
    } else if (input && typeof input === "object") {
      title = input.title;
      boardId = input.boardId || state.boards[0]?.id;
      notes = input.notes;
      priority = input.priority;
      due = input.due;
      category = input.category;
      tags = input.tags;
      refactorData = input.refactorData;
    } else {
      throw new ValidationError("A task needs a title.");
    }

    const board = state.boards.find((b) => b.id === boardId);
    if (!board) throw new ValidationError("Unknown board.");
    const id = input?.id || randomUUID();
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id)) {
      throw new ValidationError("Task ID must contain only letters, numbers, hyphens, and underscores.");
    }
    if (state.tasks.some((existing) => existing.id === id)) {
      throw new ValidationError("That task already exists.");
    }
    const now = new Date().toISOString();
    return {
      id,
      boardId: board.id,
      title: cleanTitle(title),
      notes: cleanNotes(notes),
      priority: cleanPriority(priority ?? 0),
      due: cleanDue(due ?? null),
      done: Boolean(input?.done),
      category: typeof category === "string" ? category : "task",
      tags: Array.isArray(tags) ? clone(tags) : [],
      refactorData: refactorData && typeof refactorData === "object" ? clone(refactorData) : null,
      createdAt: now,
      updatedAt: now,
      doneAt: input?.done ? now : null,
    };
  }

  async add(input) {
    const captured = clone(input);
    return this.#transaction((state) => {
      const task = this.#makeTask(captured, state);
      this.#insert(state.tasks, task);
      return { value: task };
    });
  }

  async addTask(input) {
    return this.add(input);
  }

  async update(id, patch = {}) {
    const captured = clone(patch);
    return this.#transaction((state) => {
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index === -1) return { value: null, changed: false };
      if (!captured || typeof captured !== "object" || Array.isArray(captured)) {
        throw new ValidationError("Task updates must be an object.");
      }
      const task = state.tasks[index];
      if (captured.title !== undefined) task.title = cleanTitle(captured.title);
      if (captured.notes !== undefined) task.notes = cleanNotes(captured.notes);
      if (captured.priority !== undefined) task.priority = cleanPriority(captured.priority);
      if (captured.due !== undefined) task.due = cleanDue(captured.due);
      if (captured.category !== undefined) task.category = String(captured.category);
      if (Array.isArray(captured.tags)) task.tags = captured.tags;
      if (captured.refactorData !== undefined) task.refactorData = captured.refactorData;

      if (captured.done !== undefined) {
        const done = Boolean(captured.done);
        if (done !== task.done) {
          task.done = done;
          task.doneAt = done ? new Date().toISOString() : null;
        }
      }

      if (captured.boardId !== undefined && captured.boardId !== task.boardId) {
        const board = state.boards.find((b) => b.id === captured.boardId);
        if (!board) throw new ValidationError("Unknown board.");
        state.tasks.splice(index, 1);
        task.boardId = board.id;
        this.#insert(state.tasks, task);
      }
      task.updatedAt = new Date().toISOString();
      return { value: task };
    });
  }

  async updateTask(id, patch = {}) {
    return this.update(id, patch);
  }

  async remove(id) {
    return this.#transaction((state) => {
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index === -1) return { value: false, changed: false };
      state.tasks.splice(index, 1);
      return { value: true };
    });
  }

  async removeTask(id) {
    return this.#transaction((state) => {
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index === -1) return { value: null, changed: false };
      const [task] = state.tasks.splice(index, 1);
      return { value: task };
    });
  }

  async restoreTasks(tasks) {
    if (!Array.isArray(tasks)) throw new ValidationError("restore needs an array of tasks.");
    const captured = clone(tasks);
    return this.#transaction((state) => {
      const restored = [];
      for (const raw of captured) {
        if (!isTask(raw)) continue;
        if (state.tasks.some((t) => t.id === raw.id)) continue;
        const board = state.boards.find((b) => b.id === raw.boardId) || state.boards[0];
        const task = this.#normalize(raw, board.id);
        this.#insert(state.tasks, task);
        restored.push(task);
      }
      return { value: restored, changed: restored.length > 0 };
    });
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

    const captured = clone(ids);
    return this.#transaction((state) => {
      if (boardId) {
        const board = state.boards.find((b) => b.id === boardId);
        if (!board) throw new ValidationError("Unknown board.");

        const inBoard = state.tasks.filter((task) => task.boardId === board.id);
        const remaining = new Map(inBoard.map((task) => [task.id, task]));
        const ordered = [];
        for (const id of captured) {
          const task = remaining.get(id);
          if (task) {
            ordered.push(task);
            remaining.delete(id);
          }
        }
        for (const task of remaining.values()) ordered.push(task);

        const rebuilt = [];
        for (const b of state.boards) {
          if (b.id === board.id) rebuilt.push(...ordered);
          else rebuilt.push(...state.tasks.filter((task) => task.boardId === b.id));
        }
        state.tasks = rebuilt;
      } else {
        const remaining = new Map(state.tasks.map((task) => [task.id, task]));
        const next = [];
        for (const id of captured) {
          const task = remaining.get(id);
          if (task) {
            next.push(task);
            remaining.delete(id);
          }
        }
        for (const task of remaining.values()) next.push(task);
        state.tasks = next;
      }
      return { value: state.tasks };
    });
  }

  async clearCompleted(boardId = undefined) {
    return this.#transaction((state) => {
      const before = state.tasks.length;
      state.tasks = state.tasks.filter(
        (task) => !task.done || (boardId !== undefined && task.boardId !== boardId),
      );
      const removed = before - state.tasks.length;
      return { value: removed, changed: removed > 0 };
    });
  }

  /**
   * Seed Agentic Curriculum Refactoring Tasks into the "Agentic Refactoring" board.
   */
  #populateCurriculum(state) {
    let board = state.boards.find((b) => b.id === "board_refactor_curriculum");
    const boardCreated = !board;
    if (!board) {
      board = makeBoard("Agentic Refactoring", "board_refactor_curriculum");
      board.slug = this.#uniqueSlug(state.boards, board.slug);
      state.boards.push(board);
    }

    const existing = new Set(state.tasks.map((task) => task.id));
    const created = [];
    for (const item of REFACTORING_CURRICULUM_TASKS) {
      if (existing.has(item.id)) continue;
      const task = this.#makeTask({
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
      }, state);
      this.#insert(state.tasks, task);
      existing.add(task.id);
      created.push(task);
    }
    return { value: created, changed: boardCreated || created.length > 0 };
  }

  async seedCurriculumTasks() {
    return this.#transaction((state) => this.#populateCurriculum(state));
  }

  /* ── persistence ───────────────────────────────────────── */

  #transaction(change) {
    const run = this.#queue.then(async () => {
      const state = clone({ boards: this.#boards, tasks: this.#tasks });
      const { value, changed = true } = change(state);
      if (changed) {
        const payload = JSON.stringify({ version: 1, ...state }, null, 2);
        await this.#write(this.#file, payload);
        this.#boards = state.boards;
        this.#tasks = state.tasks;
      }
      return clone(value);
    });
    this.#queue = run.catch(() => {});
    return run;
  }
}
