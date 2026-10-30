// Naive tool registry: accepts any name, allows duplicates, returns tools in
// insertion order and never unregisters when the caller's signal aborts.
export class ToolRegistry {
  #tools = new Map();

  registerTool(tool) {
    this.#tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations || {},
    });
    return Promise.resolve();
  }

  getTools() {
    return Promise.resolve(Array.from(this.#tools.values()));
  }

  unregisterTool(name) {
    this.#tools.delete(name);
  }
}
