import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ChatEngine, canonicalRoomId } from "../src/chat.js";
import { TaskStore } from "../src/store.js";
import { AuthStore } from "../src/auth.js";
import { OAuthServer } from "../src/oauth.js";
import { createHandler } from "../src/api.js";
import { createHub } from "../src/events.js";

describe("Real-Time Two-User ChatEngine & Instrumentation", () => {
  test("creates canonical two-user room IDs regardless of participant order", () => {
    expect(canonicalRoomId("pp", "agent")).toBe("dm:agent:pp");
    expect(canonicalRoomId("Agent", "PP")).toBe("dm:agent:pp");
  });

  test("delivers messages with monotonic sequence numbers, idempotency deduplication, and read receipts", () => {
    const chat = new ChatEngine();
    const room = chat.ensureRoom("alice", "bob");
    expect(room.id).toBe("dm:alice:bob");

    const m1 = chat.sendMessage({
      roomId: room.id,
      sender: "alice",
      recipient: "bob",
      text: "Hey Bob, testing real-time link",
      clientMsgId: "c_100",
    });
    expect(m1.deduplicated).toBe(false);
    expect(m1.message.seq).toBe(1);

    // Retry with same clientMsgId -> suppressed
    const dup = chat.sendMessage({
      roomId: room.id,
      sender: "alice",
      recipient: "bob",
      text: "Hey Bob, testing real-time link",
      clientMsgId: "c_100",
    });
    expect(dup.deduplicated).toBe(true);
    expect(dup.message.seq).toBe(1);

    const m2 = chat.sendMessage({
      roomId: room.id,
      sender: "bob",
      recipient: "alice",
      text: "Loud and clear, Alice!",
      clientMsgId: "c_101",
    });
    expect(m2.message.seq).toBe(2);

    // Mark read by alice up to seq 2
    const receipt = chat.markRead({ roomId: room.id, username: "alice", upToSeq: 2 });
    expect(receipt.lastReadSeq).toBe(2);

    const history = chat.getMessages(room.id);
    expect(history.messages).toHaveLength(2);
    expect(history.messages[1].readBy).toContain("alice");
    expect(history.messages[1].readBy).toContain("bob");
  });

  test("resequences out-of-order packets and expires ghost typing indicators", () => {
    const chat = new ChatEngine({ typingTtlMs: 500 });
    const room = chat.ensureRoom("alice", "bob");

    chat.setTyping({ roomId: room.id, username: "alice", isTyping: true, nowMs: 1000 });
    expect(chat.getRoom(room.id, 1200).typingUsers).toEqual(["alice"]);
    // After TTL (1000 + 500 = 1500) -> automatically pruned
    expect(chat.getRoom(room.id, 1600).typingUsers).toEqual([]);

    // Send seq 2 before seq 1 -> buffered until seq 1 arrives
    const early = chat.sendMessage({
      roomId: room.id,
      sender: "bob",
      recipient: "alice",
      text: "Message #2 arrived early",
      expectedSeq: 2,
    });
    expect(early.buffered).toBe(true);
    expect(chat.getMessages(room.id).messages).toHaveLength(0);

    const gapFill = chat.sendMessage({
      roomId: room.id,
      sender: "alice",
      recipient: "bob",
      text: "Message #1 arrived second",
      expectedSeq: 1,
    });
    expect(gapFill.flushedMessages).toHaveLength(2);
    expect(gapFill.flushedMessages.map((m) => m.seq)).toEqual([1, 2]);
  });

  test("runs protocol diagnostics and high-throughput two-user benchmark", () => {
    const chat = new ChatEngine();
    const diag = chat.runDiagnostics("dm:agent:pp");
    expect(diag.healthy).toBe(true);
    expect(diag.checks.every((c) => c.passed)).toBe(true);

    const bench = chat.runBenchmark({ messageCount: 80, duplicateRate: 0.1 });
    expect(bench.diagnosticsHealthy).toBe(true);
    expect(bench.outOfOrderResequenced).toBe(true);
    expect(bench.duplicatesSuppressed).toBeGreaterThanOrEqual(8);
    expect(bench.throughputMsgsPerSec).toBeGreaterThan(0);
    expect(typeof bench.latency.p99Ms).toBe("number");
  });

  test("exposes real-time chat REST endpoints for two-user messaging, typing, read receipts, debug & benchmark", async () => {
    const dir = await mkdtemp(join(tmpdir(), "loom-chat-api-"));
    try {
      const taskStore = await new TaskStore(join(dir, "tasks.json")).load();
      const authStore = await new AuthStore(join(dir, "auth.json")).load();
      const oauthServer = await new OAuthServer(join(dir, "oauth.json")).load();
      const handle = createHandler(taskStore, createHub(), authStore, oauthServer);

      const call = (method, path, body) =>
        handle(
          new Request(`http://loom.test${path}`, {
            method,
            headers: body ? { "content-type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          }),
        );

      const roomsRes = await call("GET", "/api/chat/rooms");
      expect(roomsRes.status).toBe(200);
      const { rooms } = await roomsRes.json();
      expect(rooms.some((r) => r.id === "dm:agent:pp")).toBe(true);

      const sendRes = await call("POST", "/api/chat/messages", {
        roomId: "dm:agent:pp",
        sender: "pp",
        recipient: "agent",
        text: "Testing live chat endpoint",
        clientMsgId: "api_msg_1",
      });
      expect(sendRes.status).toBe(201);
      const sent = await sendRes.json();
      expect(sent.message.seq).toBe(3);

      // Duplicate retry returns 200 with deduplicated: true
      const dupRes = await call("POST", "/api/chat/messages", {
        roomId: "dm:agent:pp",
        sender: "pp",
        recipient: "agent",
        text: "Testing live chat endpoint",
        clientMsgId: "api_msg_1",
      });
      expect(dupRes.status).toBe(200);
      expect((await dupRes.json()).deduplicated).toBe(true);

      const typingRes = await call("POST", "/api/chat/typing", {
        roomId: "dm:agent:pp",
        username: "agent",
        isTyping: true,
      });
      expect(typingRes.status).toBe(200);
      expect((await typingRes.json()).typingUsers).toContain("agent");

      const readRes = await call("POST", "/api/chat/read", {
        roomId: "dm:agent:pp",
        username: "agent",
        upToSeq: 3,
      });
      expect(readRes.status).toBe(200);
      expect((await readRes.json()).lastReadSeq).toBe(3);

      const debugRes = await call("GET", "/api/chat/debug?roomId=dm:agent:pp");
      expect(debugRes.status).toBe(200);
      expect((await debugRes.json()).healthy).toBe(true);

      const benchRes = await call("POST", "/api/chat/benchmark", { messageCount: 60 });
      expect(benchRes.status).toBe(200);
      const benchData = await benchRes.json();
      expect(benchData.diagnosticsHealthy).toBe(true);
      expect(benchData.messagesDispatched).toBe(62);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
