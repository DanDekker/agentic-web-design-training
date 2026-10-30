export function renderProtectedEditDialog(id: string, title: string) {
  // TODO: render a safe native dialog and bind cancellable close requests.
  return `<dialog id="${id}"><h2>${title}</h2></dialog>`;
}

export function bindProtectedEditDialog(options: any) {
  // TODO: prevent close requests while unsaved edits are not approved for discard.
  return { requestDiscard() {}, saveAndClose: async () => false, dispose() {} };
}
