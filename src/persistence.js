import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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

/** Replace a JSON file atomically, removing the temporary file after a failed write. */
export async function writeJsonFile(file, contents) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = join(dirname(file), `.gauntlet-${process.pid}-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}
