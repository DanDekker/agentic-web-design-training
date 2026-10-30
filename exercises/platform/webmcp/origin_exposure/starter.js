// Every tool is visible to every caller, no matter which origin registered it.
export class ToolExposure {
  #tools = new Map();

  constructor(origin) {
    this.origin = origin;
  }

  registerTool(tool) {
    this.#tools.set(tool.name, { ...tool, ownerOrigin: this.origin });
    return Promise.resolve();
  }

  getTools() {
    return Promise.resolve(Array.from(this.#tools.values()));
  }

  async executeTool(name, input) {
    const tool = this.#tools.get(name);
    if (!tool) throw new Error(`Unknown tool '${name}'.`);
    return tool.execute(input, {});
  }
}
