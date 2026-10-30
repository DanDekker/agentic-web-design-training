import { randomUUID } from "node:crypto";
import { readFile, rename } from "node:fs/promises";

/** Read a JSON store, preserving malformed bytes before allowing a fresh store. */
export async function readJsonStore(file, label) {
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return { found: false };
    throw error;
  }

  try {
    return { found: true, value: JSON.parse(raw) };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const backup = `${file}.corrupt-${Date.now()}-${randomUUID()}`;
    // If the move fails, do not create a new file over the unreadable data.
    await rename(file, backup);
    console.warn(`[${label}] unreadable data file moved to ${backup}`);
    return { found: false };
  }
}
