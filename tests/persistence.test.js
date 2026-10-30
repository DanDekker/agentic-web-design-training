import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";

let dir;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "gauntlet-web-persistence-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const stores = [
  { name: "tasks", Store: TaskStore, key: "tasks" },
  { name: "accounts", Store: AuthStore, key: "users" },
  { name: "oauth", Store: OAuthServer, key: "clients" },
];

describe("JSON store recovery", () => {
  for (const { name, Store, key } of stores) {
    test(`${name} preserves corrupt bytes before creating a fresh store`, async () => {
      const file = join(dir, `${name}.json`);
      const damaged = "{ incomplete json";
      await writeFile(file, damaged);
      await new Store(file).load();
      const backups = (await readdir(dir)).filter((entry) => entry.startsWith(`${name}.json.corrupt-`));
      expect(backups).toHaveLength(1);
      expect(await readFile(join(dir, backups[0]), "utf8")).toBe(damaged);
      expect(Array.isArray(JSON.parse(await readFile(file, "utf8"))[key])).toBe(true);
    });

    test(`${name} leaves the original file intact if quarantine fails`, async () => {
      // The original name fits common filesystems, but the quarantine suffix exceeds their name limit.
      const file = join(dir, "x".repeat(230));
      const damaged = "{ incomplete json";
      await writeFile(file, damaged);
      await expect(new Store(file).load()).rejects.toThrow();
      expect(await readFile(file, "utf8")).toBe(damaged);
    });

    test(`${name} does not replace unreadable or unsupported data`, async () => {
      const directory = join(dir, "not-a-file");
      await mkdir(directory);
      await expect(new Store(directory).load()).rejects.toThrow();
      expect((await stat(directory)).isDirectory()).toBe(true);

      const file = join(dir, `${name}.json`);
      const unsupported = JSON.stringify({ version: 99, [key]: [] });
      await writeFile(file, unsupported);
      await expect(new Store(file).load()).rejects.toThrow("unsupported");
      expect(await readFile(file, "utf8")).toBe(unsupported);
    });
  }

  test("existing empty account and client stores remain empty", async () => {
    const accounts = join(dir, "auth.json");
    const clients = join(dir, "oauth.json");
    const accountData = JSON.stringify({ version: 1, users: [] });
    const clientData = JSON.stringify({ version: 1, clients: [] });
    await writeFile(accounts, accountData);
    await writeFile(clients, clientData);
    expect((await new AuthStore(accounts).load()).listUsers()).toEqual([]);
    expect((await new OAuthServer(clients).load()).listClients()).toEqual([]);
    expect(await readFile(accounts, "utf8")).toBe(accountData);
    expect(await readFile(clients, "utf8")).toBe(clientData);
  });

  test("duplicate stored task IDs fail without rewriting the file", async () => {
    const file = join(dir, "duplicates.json");
    const duplicate = JSON.stringify({ tasks: [{ id: "same", title: "One" }, { id: "same", title: "Two" }] });
    await writeFile(file, duplicate);
    await expect(new TaskStore(file).load()).rejects.toThrow("duplicate");
    expect(await readFile(file, "utf8")).toBe(duplicate);
  });

  test("atomic writes support a long valid data filename", async () => {
    const file = join(dir, "s".repeat(230));
    const store = await new TaskStore(file).load();
    await store.add("Persisted");
    expect((await new TaskStore(file).load()).list()[0].title).toBe("Persisted");
  });
});
