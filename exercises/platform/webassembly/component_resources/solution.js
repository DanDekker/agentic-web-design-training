class ComponentResourceLedger {
  #slots = new Map();
  #generations = new Map();
  #freeIds = [];
  #nextId = 1;
  #handles = new WeakMap();
  #tasks = new Map();
  #dropResource;

  constructor(dropResource = () => {}) {
    if (typeof dropResource !== "function") throw new TypeError("dropResource must be a function");
    this.#dropResource = dropResource;
  }

  #invalid(message) {
    const error = new Error(message);
    error.name = "InvalidStateError";
    return error;
  }

  #newHandle(resource, kind, taskId = null) {
    const handle = Object.freeze({ id: resource.id, generation: resource.generation, kind });
    const record = { resource, kind, taskId, active: true, handle };
    this.#handles.set(handle, record);
    return record;
  }

  #record(handle, expectedKind) {
    const record = handle && this.#handles.get(handle);
    if (!record || !record.active || record.kind !== expectedKind ||
      this.#slots.get(record.resource.id) !== record.resource ||
      record.resource.generation !== handle.generation || record.resource.dropped) {
      throw this.#invalid("resource handle is stale or has the wrong ownership type");
    }
    if (expectedKind === "own" && record.resource.owner !== handle) {
      throw this.#invalid("resource ownership has moved to another handle");
    }
    return record;
  }

  createOwned(value) {
    const id = this.#freeIds.pop() ?? this.#nextId++;
    const generation = (this.#generations.get(id) ?? 0) + 1;
    this.#generations.set(id, generation);
    const resource = { id, generation, value, owner: null, borrows: 0, dropped: false };
    this.#slots.set(id, resource);
    const owner = this.#newHandle(resource, "own").handle;
    resource.owner = owner;
    return owner;
  }

  borrow(ownerHandle, taskId) {
    const owner = this.#record(ownerHandle, "own");
    if ((typeof taskId !== "string" && typeof taskId !== "number") || String(taskId).length === 0) {
      throw new TypeError("taskId must be a non-empty string or number");
    }
    const key = String(taskId);
    const borrow = this.#newHandle(owner.resource, "borrow", key);
    owner.resource.borrows++;
    if (!this.#tasks.has(key)) this.#tasks.set(key, new Set());
    this.#tasks.get(key).add(borrow);
    return borrow.handle;
  }

  read(handle) {
    const record = this.#handles.get(handle);
    if (!record || !record.active || this.#slots.get(record.resource.id) !== record.resource || record.resource.dropped) {
      throw this.#invalid("resource handle is stale");
    }
    if (record.kind === "own" && record.resource.owner !== handle) {
      throw this.#invalid("resource ownership has moved to another handle");
    }
    return record.resource.value;
  }

  releaseBorrow(borrowHandle) {
    const borrow = this.#record(borrowHandle, "borrow");
    borrow.active = false;
    borrow.resource.borrows--;
    const taskBorrows = this.#tasks.get(borrow.taskId);
    taskBorrows?.delete(borrow);
    if (taskBorrows?.size === 0) this.#tasks.delete(borrow.taskId);
  }

  resolveTask(taskId) {
    const key = String(taskId);
    const borrows = this.#tasks.get(key);
    if (!borrows) return 0;
    let released = 0;
    for (const borrow of borrows) {
      if (!borrow.active) continue;
      borrow.active = false;
      borrow.resource.borrows--;
      released++;
    }
    this.#tasks.delete(key);
    return released;
  }

  transfer(ownerHandle) {
    const owner = this.#record(ownerHandle, "own");
    if (owner.resource.borrows !== 0) throw this.#invalid("cannot transfer a resource while it is lent to an async task");
    owner.active = false;
    const nextOwner = this.#newHandle(owner.resource, "own").handle;
    owner.resource.owner = nextOwner;
    return nextOwner;
  }

  drop(ownerHandle) {
    const owner = this.#record(ownerHandle, "own");
    if (owner.resource.borrows !== 0) throw this.#invalid("cannot drop a resource while it is lent to an async task");
    const resource = owner.resource;
    owner.active = false;
    resource.dropped = true;
    resource.owner = null;
    this.#slots.delete(resource.id);
    this.#freeIds.push(resource.id);
    this.#dropResource(resource.value);
  }
}
