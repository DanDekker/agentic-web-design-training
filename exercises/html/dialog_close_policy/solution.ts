export interface DialogCloseEventPort {
  preventDefault(): void;
}

export interface DialogEventTargetPort {
  addEventListener(type: "cancel", listener: (event: DialogCloseEventPort) => void): void;
  addEventListener(type: "close", listener: () => void): void;
  removeEventListener(type: "cancel", listener: (event: DialogCloseEventPort) => void): void;
  removeEventListener(type: "close", listener: () => void): void;
}

export interface DialogControlPort {
  addEventListener(type: "click", listener: () => void): void;
  removeEventListener(type: "click", listener: () => void): void;
}

export interface ProtectedDialogPort extends DialogEventTargetPort {
  readonly returnValue: string;
  requestClose(returnValue?: string): void;
  close(returnValue?: string): void;
}

export interface ProtectedEditDialogOptions {
  readonly dialog: ProtectedDialogPort;
  readonly discardButton: DialogControlPort;
  readonly saveButton: DialogControlPort;
  readonly isDirty: () => boolean;
  readonly confirmDiscard: () => boolean;
  readonly persist: () => boolean | Promise<boolean>;
  readonly onClose?: (returnValue: string) => void;
  readonly onSaveError?: (error: unknown) => void;
}

export interface ProtectedEditDialogBinding {
  requestDiscard(): void;
  saveAndClose(): Promise<boolean>;
  dispose(): void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderProtectedEditDialog(id: string, title: string): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) throw new TypeError("id must be a safe HTML identifier");
  const safeId = escapeHtml(id);
  const safeTitle = escapeHtml(title);
  return [
    `<dialog id="${safeId}" closedby="closerequest" aria-labelledby="${safeId}-title">`,
    `  <form id="${safeId}-form">`,
    `    <h2 id="${safeId}-title">${safeTitle}</h2>`,
    `    <label for="${safeId}-notes">Review notes</label>`,
    `    <textarea id="${safeId}-notes" name="notes"></textarea>`,
    `    <div class="review-dialog__actions">`,
    `      <button type="button" data-dialog-action="discard">Discard edits</button>`,
    `      <button type="button" data-dialog-action="save">Save review</button>`,
    `    </div>`,
    `  </form>`,
    `</dialog>`,
  ].join("\n");
}

export function bindProtectedEditDialog(options: ProtectedEditDialogOptions): ProtectedEditDialogBinding {
  const { dialog, discardButton, saveButton, isDirty, confirmDiscard, persist, onClose, onSaveError } = options;
  if (typeof dialog.requestClose !== "function" || typeof dialog.close !== "function") {
    throw new TypeError("dialog must implement requestClose() and close()");
  }
  if (typeof isDirty !== "function" || typeof confirmDiscard !== "function" || typeof persist !== "function") {
    throw new TypeError("dialog close policy callbacks must be functions");
  }

  let disposed = false;
  let saving = false;
  const onCancel = (event: DialogCloseEventPort) => {
    if (isDirty() && !confirmDiscard()) event.preventDefault();
  };
  const onDialogClose = () => onClose?.(dialog.returnValue);
  const onDiscardClick = () => dialog.requestClose("discard");
  const onSaveClick = () => { void saveAndClose(); };

  const saveAndClose = async (): Promise<boolean> => {
    if (saving) return false;
    saving = true;
    try {
      const committed = await persist();
      if (!committed) return false;
      // close() bypasses cancel; use it only after the persistence callback succeeds.
      dialog.close("saved");
      return true;
    } catch (error) {
      onSaveError?.(error);
      return false;
    } finally {
      saving = false;
    }
  };

  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", onDialogClose);
  discardButton.addEventListener("click", onDiscardClick);
  saveButton.addEventListener("click", onSaveClick);

  return {
    requestDiscard: onDiscardClick,
    saveAndClose,
    dispose() {
      if (disposed) return;
      disposed = true;
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onDialogClose);
      discardButton.removeEventListener("click", onDiscardClick);
      saveButton.removeEventListener("click", onSaveClick);
    },
  };
}
