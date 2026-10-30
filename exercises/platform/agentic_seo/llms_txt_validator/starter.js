// Accepts any file as a valid llms.txt: no H1 check, no section ordering and
// no link-list syntax validation.
export function validateLlmsTxt(source) {
  return { valid: true, errors: [] };
}
