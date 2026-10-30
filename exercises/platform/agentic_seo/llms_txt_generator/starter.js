// Emits llms.txt as a flat JSON dump with no Markdown structure and no
// rel=alternate / rel=describedby link relations.
export function buildLlmsTxt(site) {
  return JSON.stringify({ site }, null, 2);
}
