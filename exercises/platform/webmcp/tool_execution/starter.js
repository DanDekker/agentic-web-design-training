// Runs a registered tool and hands back whatever it returns. No error taxonomy,
// no cancellation and no result serialisation.
export class ToolExecutor {
  #tools = new Map();

  registerTool(tool) {
    this.#tools.set(tool.name, tool);
    return Promise.resolve();
  }

  getTools() {
    return Promise.resolve(Array.from(this.#tools.values()));
  }

  async executeTool(name, inputObject) {
    const tool = this.#tools.get(name);
    if (!tool) throw new Error(`Unknown tool '${name}'.`);
    return tool.execute(inputObject, {});
  }
}
