// Model the Component Model's unique `own` handle and temporary async borrows.
// resolveTask() is called when a subtask returns or confirms cancellation.
class ComponentResourceLedger {
  constructor(dropResource = () => {}) {
    // TODO: store resources behind generation-checked handles and track each
    // outstanding borrow by its asynchronous task.
  }

  createOwned(value) {}
  borrow(ownerHandle, taskId) {}
  read(handle) {}
  releaseBorrow(borrowHandle) {}
  resolveTask(taskId) {}
  transfer(ownerHandle) {}
  drop(ownerHandle) {}
}
