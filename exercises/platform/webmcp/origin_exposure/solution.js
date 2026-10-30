// WebMCP cross-origin tool exposure: a tool is visible to its owning origin and
// to any origin listed in `exposedTo`. A caller that may not see a tool receives
// NotFoundError, so the registry never leaks which tools a site has registered.
function domError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

export class ToolExposure {
  #origin;
  #tools = new Map();

  constructor(origin) {
    this.#origin = origin;
  }

  registerTool(tool, options = {}) {
    if (this.#tools.has(tool.name)) {
      return Promise.reject(
        domError("InvalidStateError", `Tool '${tool.name}' is already registered.`),
      );
    }
    const exposedOrigins = Array.isArray(options.exposedTo) ? [...options.exposedTo] : [];
    this.#tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      execute: tool.execute,
      ownerOrigin: this.#origin,
      exposedOrigins,
    });
    return Promise.resolve();
  }

  #isExposed(tool, accessingOrigin) {
    if (tool.ownerOrigin === accessingOrigin) return true;
    return tool.exposedOrigins.includes(accessingOrigin);
  }

  getTools(accessingOrigin, options = {}) {
    const fromOrigins = Array.isArray(options.fromOrigins) ? options.fromOrigins : [];
    const visible = [];

    for (const tool of this.#tools.values()) {
      const inScope =
        tool.ownerOrigin === accessingOrigin || fromOrigins.includes(tool.ownerOrigin);
      if (!inScope) continue;
      if (!this.#isExposed(tool, accessingOrigin)) continue;
      visible.push({ name: tool.name, description: tool.description });
    }

    visible.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    return Promise.resolve(visible);
  }

  async executeTool(accessingOrigin, name, inputObject) {
    const tool = this.#tools.get(name);
    if (!tool) throw domError("NotFoundError", `Tool '${name}' is not registered.`);
    // A cross-origin caller must not be able to probe for private tools, so an
    // invisible tool is reported exactly like a missing one.
    if (!this.#isExposed(tool, accessingOrigin)) {
      throw domError("NotFoundError", `Tool '${name}' is not registered.`);
    }
    return tool.execute(inputObject, {});
  }
}
