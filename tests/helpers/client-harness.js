import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";

// A small DOM/event fixture for running the actual client against its actual HTML.
// Native dialog visibility deliberately depends on `open`, independently of `hidden`.
class Element {
  children = [];
  attributes = new Map();
  listeners = new Map();
  dataset = {};
  style = {};
  className = "";
  textContent = "";
  innerHTML = "";
  value = "";
  hidden = false;
  disabled = false;
  open = false;

  constructor(document, tagName) {
    this.document = document;
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (name) => this.classList.toggle(name, true),
      remove: (name) => this.classList.toggle(name, false),
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        const add = enabled ?? !names.has(name);
        if (add) names.add(name);
        else names.delete(name);
        this.className = [...names].join(" ");
        return add;
      },
    };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "id") this.id = String(value);
    if (name === "class") this.className = String(value);
    if (name === "value") this.value = String(value);
    if (name === "hidden") this.hidden = true;
    if (name === "disabled") this.disabled = true;
    if (name.startsWith("data-")) {
      this.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  async emit(type, event = {}) {
    event.target ??= this;
    event.preventDefault ??= () => { event.defaultPrevented = true; };
    event.stopPropagation ??= () => { event.cancelBubble = true; };
    await Promise.all((this.listeners.get(type) ?? []).map((handler) => handler(event)));
    return event;
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = nodes;
  }

  matches(selector) {
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    if (selector.startsWith(".")) {
      return selector.slice(1).split(".").every((name) => this.className.split(/\s+/).includes(name));
    }
    if (selector.startsWith("[")) return this.attributes.has(selector.slice(1, -1));
    return this.tagName === selector.toUpperCase();
  }

  querySelectorAll(selector) {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
    ]);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  focus() { this.document.activeElement = this; }
  blur() { this.document.activeElement = this.document.body; }
  setSelectionRange() {}
  scrollIntoView() {}

  showModal() {
    if (this.tagName !== "DIALOG") throw new Error("Only dialogs support showModal().");
    if (this.open) return;
    this.opener = this.document.activeElement;
    this.open = true;
    this.document.dialogs.push(this);
    this.focus();
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.document.dialogs = this.document.dialogs.filter((dialog) => dialog !== this);
    this.opener?.focus();
    queueMicrotask(() => this.emit("close"));
  }
}

export const settle = () => new Promise((resolve) => setImmediate(resolve));
export const json = (data, status = 200) => Response.json(data, { status });

export async function createClient({ search = "", route, snapshot: supplied = {} } = {}) {
  const document = new Element(null, "document");
  document.document = document;
  document.dialogs = [];
  document.createElement = (tagName) => new Element(document, tagName);
  const html = await readFile(new URL("../../public/index.html", import.meta.url), "utf8");
  await new HTMLRewriter().on("*", {
    element(node) {
      const element = document.createElement(node.tagName);
      for (const [name, value] of node.attributes) element.setAttribute(name, value);
      document.append(element);
    },
  }).transform(new Response(html)).text();
  document.body = document.querySelector("body");
  document.documentElement = document.querySelector("html");
  document.activeElement = document.body;

  const snapshot = {
    boards: [
      { id: "board_today", name: "Today", slug: "today" },
      { id: "board_refactor_curriculum", name: "Agentic Refactoring", slug: "agentic-refactoring" },
    ],
    tasks: [{ id: "task-one", title: "First task", boardId: "board_today", done: false, priority: 0 }],
    user: null,
    oauthClients: [],
    ...supplied,
  };
  const requests = [];
  let eventSource;
  let nextTask = 1;
  const context = createContext({
    document, window: { location: { search } }, URL, URLSearchParams, Blob, Intl,
    localStorage: { setItem() {} }, navigator: { clipboard: { writeText: async () => {} } },
    queueMicrotask, requestAnimationFrame: (callback) => callback(),
    setTimeout: () => 1, clearTimeout() {}, confirm: () => false, prompt: () => null,
    EventSource: class {
      constructor() { eventSource = this; }
      close() {}
    },
    fetch: async (path, init = {}) => {
      const method = init.method ?? "GET";
      const body = init.body ? JSON.parse(init.body) : undefined;
      requests.push({ method, path, body });
      const overridden = await route?.({ method, path, body, snapshot });
      if (overridden !== undefined) return overridden;
      if (path === "/api/state") return json(snapshot);
      if (path === "/api/tasks" && method === "GET") return json({ tasks: snapshot.tasks });
      if (path === "/api/tasks" && method === "POST") {
        const task = { id: `created-${nextTask++}`, done: false, ...body };
        snapshot.tasks.push(task);
        return json(task, 201);
      }
      if (path.startsWith("/api/tasks/") && method === "PATCH") {
        const task = snapshot.tasks.find((task) => task.id === path.split("/").at(-1));
        Object.assign(task, body);
        return json(task);
      }
      if (path === "/api/curriculum/benchmark") return json({ totalTasks: 36, byCategory: { css: 27, webassembly: 9 } });
      if (path.startsWith("/api/chat/messages") && method === "GET") {
        return json({
          roomId: "dm:agent:pp",
          latestSeq: 2,
          messages: [
            { seq: 1, sender: "pp", recipient: "agent", text: "Hello agent", readBy: ["pp", "agent"] },
            { seq: 2, sender: "agent", recipient: "pp", text: "Hello pp", readBy: ["pp", "agent"] },
          ],
          typingUsers: [],
        });
      }
      if (path.startsWith("/api/chat/") && method === "POST") {
        return json({ ok: true, diagnosticsHealthy: true, throughputMsgsPerSec: 25000, latency: { p99Ms: 0.05 }, duplicatesSuppressed: 15 });
      }
      if (path.startsWith("/api/chat/debug") && method === "GET") {
        return json({ healthy: true, latestSeq: 2, telemetry: { duplicatesSuppressed: 0, latency: { p99Ms: 0.02 } } });
      }
      throw new Error(`Unhandled fixture request: ${method} ${path}`);
    },
  });
  const source = await readFile(new URL("../../public/app.js", import.meta.url), "utf8");
  runInContext(source, context, { filename: "public/app.js" });
  await settle();

  const get = (id) => document.querySelector(`#${id}`);
  return {
    document, get, snapshot, requests,
    async click(element) {
      const target = typeof element === "string" ? get(element) : element;
      if (target.disabled) return;
      target.focus();
      await target.emit("click");
      await settle();
    },
    async key(key, properties = {}, target = document.activeElement) {
      const event = { key, ...properties, target };
      await target.emit("keydown", event);
      if (target !== document && !event.cancelBubble) await document.emit("keydown", event);
      if (key === "Escape" && !event.defaultPrevented) {
        const dialog = document.dialogs.at(-1);
        if (dialog && !(await dialog.emit("cancel")).defaultPrevented) dialog.close();
      }
      await settle();
      return event;
    },
    async input(id, value) {
      get(id).value = value;
      await get(id).emit("input");
      await settle();
    },
    async refresh() {
      eventSource.onmessage({ data: JSON.stringify({ type: "state" }) });
      await settle();
    },
  };
}
