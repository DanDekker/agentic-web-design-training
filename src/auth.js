import { randomBytes } from "node:crypto";
import { ValidationError } from "./store.js";
import { readJsonStore, writeJsonFile } from "./persistence.js";

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export class AuthStore {
  #file;
  #users = [];
  #sessions = new Map(); // token -> { userId, expiresAt, createdAt, userAgent }
  #queue = Promise.resolve();
  #write;

  constructor(file, { write = writeJsonFile } = {}) {
    this.#file = file;
    this.#write = write;
  }

  async load() {
    const stored = await readJsonStore(this.#file, "auth");
    if (!stored.found) {
      await this.#seedDefaults();
    } else {
      const parsed = stored.value;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
          (parsed.version !== undefined && parsed.version !== 1) || !Array.isArray(parsed.users) ||
          !parsed.users.every((user) => user && typeof user === "object" &&
            typeof user.id === "string" && typeof user.username === "string" && typeof user.passwordHash === "string")) {
        throw new Error("Invalid or unsupported account store format; the data file was left unchanged.");
      }
      this.#users = parsed.users;
    }
    return this;
  }

  async #seedDefaults() {
    const agentHash = await Bun.password.hash("agent-demo-2026", { algorithm: "bcrypt", cost: 4 });
    const ppHash = await Bun.password.hash("curriculum-1m", { algorithm: "bcrypt", cost: 4 });
    const users = [
      {
        id: "usr_agent",
        username: "agent",
        displayName: "Demo Agent",
        passwordHash: agentHash,
        role: "agent",
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_pp",
        username: "pp",
        displayName: "pp (Lead Systems)",
        passwordHash: ppHash,
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ];
    await this.#write(this.#file, JSON.stringify({ version: 1, users }, null, 2));
    this.#users = users;
  }

  listUsers() {
    return this.#users.map(({ passwordHash, ...user }) => ({ ...user }));
  }

  getUserById(id) {
    const user = this.#users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  getUserByUsername(username) {
    if (typeof username !== "string") return null;
    const user = this.#users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    return user ? { ...user } : null;
  }

  async register({ username, password, displayName, role = "user" }) {
    const cleanUser = String(username || "").trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 2 || cleanUser.length > 32) {
      throw new ValidationError("Username must be between 2 and 32 characters.");
    }
    if (!/^[a-z0-9_-]+$/.test(cleanUser)) {
      throw new ValidationError("Username can only contain letters, numbers, hyphens, and underscores.");
    }
    if (this.getUserByUsername(cleanUser)) {
      throw new ValidationError("Username already taken.");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters.");
    }

    const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 4 });
    const user = {
      id: `usr_${randomToken(8)}`,
      username: cleanUser,
      displayName: String(displayName || cleanUser).trim().slice(0, 48),
      passwordHash,
      role: role === "admin" ? "admin" : role === "agent" ? "agent" : "user",
      createdAt: new Date().toISOString(),
    };

    const run = this.#queue.then(async () => {
      if (this.getUserByUsername(cleanUser)) throw new ValidationError("Username already taken.");
      const users = [...this.#users, user];
      await this.#write(this.#file, JSON.stringify({ version: 1, users }, null, 2));
      this.#users = users;
      const { passwordHash: _, ...safe } = user;
      return safe;
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  async verifyCredentials(username, password) {
    const user = this.getUserByUsername(username);
    if (!user) return null;
    const ok = await Bun.password.verify(password, user.passwordHash);
    if (!ok) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  createSession(userId, userAgent = "") {
    const token = randomToken(32);
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    this.#sessions.set(token, {
      token,
      userId,
      userAgent: String(userAgent || "").slice(0, 120),
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    return { token, expiresAt };
  }

  getSession(token) {
    if (!token) return null;
    const session = this.#sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.#sessions.delete(token);
      return null;
    }
    return { ...session };
  }

  revokeSession(token) {
    return this.#sessions.delete(token);
  }

  revokeUserSessions(userId) {
    for (const [token, sess] of this.#sessions.entries()) {
      if (sess.userId === userId) this.#sessions.delete(token);
    }
  }

  authenticateRequest(req) {
    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const session = this.getSession(token);
      if (session) {
        return this.getUserById(session.userId);
      }
    }

    // 2. Cookie: gauntlet-web_session=<token>
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)gauntlet-web_session=([a-f0-9]+)/);
    if (match) {
      const token = match[1];
      const session = this.getSession(token);
      if (session) {
        return this.getUserById(session.userId);
      }
    }

    return null;
  }
}
