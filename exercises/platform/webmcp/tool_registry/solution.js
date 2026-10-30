// WebMCP ModelContext tool registry: spec-accurate name validation, duplicate
// rejection, JSON-serialised input schemas, abort-driven unregistration and
// name-sorted tool discovery.
const TOOL_NAME_PATTERN = /^[A-Za-z0-9_.-]{1,128}$/;

function domError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

export class ToolRegistry {
  #tools = new Map();
  #listeners = new Set();
  #origin;

  constructor(origin = "https://app.example.test") {
    this.#origin = origin;
  }

  registerTool(tool, options = {}) {
    return new Promise((resolve, reject) => {
      const name = tool && tool.name;
      if (typeof name !== "string" || !TOOL_NAME_PATTERN.test(name)) {
        reject(domError("InvalidStateError", `Invalid tool name '${name}'.`));
        return;
      }
      if (typeof tool.description !== "string" || tool.description.length === 0) {
        reject(domError("InvalidStateError", `Tool '${name}' requires a description.`));
        return;
      }
      if (this.#tools.has(name)) {
        reject(domError("InvalidStateError", `Tool '${name}' is already registered.`));
        return;
      }

      let serialisedSchema = "";
      if (tool.inputSchema !== undefined) {
        try {
          serialisedSchema = JSON.stringify(tool.inputSchema);
          if (serialisedSchema === undefined) throw new TypeError("not serialisable");
        } catch {
          reject(new TypeError(`Tool '${name}' has an invalid inputSchema.`));
          return;
        }
      }

      this.#tools.set(name, {
        name,
        title: tool.title ?? null,
        description: tool.description,
        inputSchema: serialisedSchema,
        execute: tool.execute,
        annotations: {
          readOnlyHint: tool.annotations?.readOnlyHint ?? false,
          untrustedContentHint: tool.annotations?.untrustedContentHint ?? false,
          consequentialHint: tool.annotations?.consequentialHint ?? false,
          debugging: tool.annotations?.debugging ?? false,
        },
        exposedOrigins: Array.isArray(options.exposedTo) ? [...options.exposedTo] : [],
      });

      if (options.signal) {
        if (options.signal.aborted) {
          this.#tools.delete(name);
          reject(options.signal.reason || domError("AbortError", "Registration aborted."));
          return;
        }
        options.signal.addEventListener(
          "abort",
          () => {
            this.#tools.delete(name);
            this.#emit("toolchange", name);
          },
          { once: true },
        );
      }

      this.#emit("toolchange", name);
      resolve(undefined);
    });
  }

  unregisterTool(name) {
    if (!this.#tools.has(name)) return false;
    this.#tools.delete(name);
    this.#emit("toolchange", name);
    return true;
  }

  getTools() {
    const tools = Array.from(this.#tools.values()).map((tool) => ({
      name: tool.name,
      title: tool.title ?? "",
      description: tool.description,
      inputSchema: tool.inputSchema === "" ? undefined : JSON.parse(tool.inputSchema),
      annotations: { ...tool.annotations },
      origin: this.#origin,
    }));
    tools.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    return Promise.resolve(tools);
  }

  onToolChange(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit(type, toolName) {
    for (const listener of this.#listeners) listener({ type, toolName });
  }
}
