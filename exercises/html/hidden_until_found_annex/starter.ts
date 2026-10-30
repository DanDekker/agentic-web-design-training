// A support manual hides its long troubleshooting annex with display: none,
// so browser find-in-page and fragment links cannot reveal matching guidance.
export function renderSupportAnnex(spec: any): string {
  return `<section><h2>${spec.title}</h2><button>Show more</button>${spec.body}</section>`;
}

export function bindSupportAnnex(panel: HTMLElement, button: HTMLButtonElement) {
  button.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
}
