// A scripted disclosure widget manually closes and opens rows with click handlers.
export function renderSupportFlow(spec: any): string {
  return `<section><h2>${spec.title}</h2>${spec.items
    .map((item: any) => `<div onclick="toggleRow(this)">${item.question}<p>${item.answer}</p></div>`)
    .join("")}</section>`;
}
