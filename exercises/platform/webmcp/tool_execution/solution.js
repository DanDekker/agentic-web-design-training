// WebMCP executeTool: JSON round-trips the input, hands the tool an AbortSignal,
// stringifies the result, and maps every failure onto a platform-defined
// DOMException name (NotFoundError, DataError, OperationError, AbortError).
function domError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

function toJsonObject(inputObject, toolName) {
  let serialised;
  try {
    serialised = JSON.stringify(inputObject ?? {});
  } catch {
    throw domError("DataError", `Tool '${toolName}' received input that is not JSON-serialisable.`);
  }
  if (serialised === undefined) {
    throw domError("DataError", `Tool '${toolName}' received input that is not JSON-serialisable.`);
  }
  let parsed;
  try {
    parsed = JSON.parse(serialised);
  } catch {
    throw domError("DataError", `Tool '${toolName}' received malformed input.`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw domError("DataError", `Tool '${toolName}' input must be a JSON object.`);
  }
  return parsed;
}

export class ToolExecutor {
  #tools = new Map();
  #listeners = new Set();

  registerTool(tool) {
    if (this.#tools.has(tool.name)) {
      return Promise.reject(
        domError("InvalidStateError", `Tool '${tool.name}' is already registered.`),
      );
    }
    this.#tools.set(tool.name, tool);
    return Promise.resolve();
  }

  getTools() {
    return Promise.resolve(
      Array.from(this.#tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        annotations: { ...(tool.annotations ?? {}) },
      })),
    );
  }

  async executeTool(name, inputObject, options = {}) {
    const tool = this.#tools.get(name);
    if (!tool) throw domError("NotFoundError", `Tool '${name}' is not registered.`);

    const input = toJsonObject(inputObject, name);

    const controller = new AbortController();
    const externalSignal = options.signal;
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason);
      else externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason), { once: true });
    }

    this.#emit("toolactivated", { toolName: name });

    try {
      const value = await tool.execute(input, { signal: controller.signal });

      if (controller.signal.aborted) {
        this.#emit("toolcancel", { toolName: name });
        throw domError("AbortError", `Tool '${name}' was cancelled.`);
      }

      let result;
      try {
        result = JSON.stringify(value);
      } catch {
        throw domError(
          "OperationError",
          `Tool '${name}' returned a result that is not JSON-serialisable.`,
        );
      }
      if (result === undefined) {
        throw domError(
          "OperationError",
          `Tool '${name}' returned a result that is not JSON-serialisable.`,
        );
      }
      return result;
    } catch (error) {
      if (error && (error.name === "OperationError" || error.name === "AbortError")) throw error;
      if (controller.signal.aborted) {
        this.#emit("toolcancel", { toolName: name });
        throw domError("AbortError", `Tool '${name}' was cancelled.`);
      }
      throw domError("OperationError", `Tool '${name}' rejected: ${error?.message ?? error}`);
    }
  }

  on(type, handler) {
    this.#listeners.add({ type, handler });
    return () => {
      for (const entry of this.#listeners) {
        if (entry.type === type && entry.handler === handler) this.#listeners.delete(entry);
      }
    };
  }

  #emit(type, detail) {
    for (const entry of this.#listeners) {
      if (entry.type === type) entry.handler({ type, ...detail });
    }
  }
}
