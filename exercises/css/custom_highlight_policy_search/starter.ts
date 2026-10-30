// Repeated, unescaped replacements damage inline markup and can inject search text.
export function highlightPolicySearch(article: HTMLElement, query: string): void {
  const pattern = new RegExp(query, "gi");
  article.innerHTML = article.innerHTML.replace(pattern, `<mark>${query}</mark>`);
}
