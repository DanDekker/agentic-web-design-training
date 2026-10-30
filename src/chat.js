/**
 * Real-Time Two-User Chat Engine with Telemetry Instrumentation,
 * Protocol Diagnostics, Out-of-Order Resequencing, and Latency Benchmarking.
 */

import { ValidationError } from "./store.js";

export const CHAT_MESSAGE_MAX = 2000;
export const DEFAULT_ROOM_CAPACITY = 500;
export const DEFAULT_TYPING_TTL_MS = 4000;

export function canonicalRoomId(userA, userB) {
  const a = String(userA || "").trim().toLowerCase();
  const b = String(userB || "").trim().toLowerCase();
  if (!a || !b) throw new ValidationError("Two usernames are required to form a chat room.");
  const [first, second] = [a, b].sort();
  return `dm:${first}:${second}`;
}

function computePercentile(sortedValues, percentile) {
  if (!sortedValues.length) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentile / 100) * sortedValues.length) - 1),
  );
  return Math.round(sortedValues[idx] * 1000) / 1000;
}

export class ChatEngine {
  #rooms = new Map(); // roomId -> RoomState
  #maxMessagesPerRoom;
  #typingTtlMs;
  #telemetry = {
    totalMessages: 0,
    duplicatesSuppressed: 0,
    outOfOrderBuffered: 0,
    outOfOrderFlushed: 0,
    typingEvents: 0,
    readReceipts: 0,
    ringBufferEvictions: 0,
    fanoutSamplesMs: [],
  };

  constructor({ maxMessagesPerRoom = DEFAULT_ROOM_CAPACITY, typingTtlMs = DEFAULT_TYPING_TTL_MS } = {}) {
    this.#maxMessagesPerRoom = maxMessagesPerRoom;
    this.#typingTtlMs = typingTtlMs;
    this.#seedDefaultRoom();
  }

  #seedDefaultRoom() {
    const room = this.ensureRoom("agent", "pp");
    this.sendMessage({
      roomId: room.id,
      sender: "pp",
      recipient: "agent",
      text: "Welcome to the gauntlet-web real-time two-user instrumentation channel. Ready for latency & protocol telemetry.",
      clientMsgId: "seed_msg_1",
      nowMs: Date.now() - 2000,
    });
    this.sendMessage({
      roomId: room.id,
      sender: "agent",
      recipient: "pp",
      text: "Telemetry online: sequence monotonicity, idempotency deduplication, and P99 fanout tracking active.",
      clientMsgId: "seed_msg_2",
      nowMs: Date.now() - 1000,
    });
    this.markRead({ roomId: room.id, username: "agent", upToSeq: 2 });
    this.markRead({ roomId: room.id, username: "pp", upToSeq: 2 });
  }

  ensureRoom(userA, userB, customId = null) {
    const a = String(userA || "").trim().toLowerCase();
    const b = String(userB || "").trim().toLowerCase();
    if (!a || !b) throw new ValidationError("Both participant usernames are required.");
    if (a === b) throw new ValidationError("Real-time chat requires two distinct users.");

    const roomId = customId || canonicalRoomId(a, b);
    if (!this.#rooms.has(roomId)) {
      const participants = [a, b].sort();
      this.#rooms.set(roomId, {
        id: roomId,
        participants,
        seq: 0,
        messages: [], // bounded ring buffer (FIFO array capped at #maxMessagesPerRoom)
        clientMsgIndex: new Map(), // clientMsgId -> message
        reorderBuffer: new Map(), // expectedSeq -> rawPayload
        typing: new Map(), // username -> expiresAtMs
        readWatermarks: new Map(participants.map((u) => [u, 0])), // username -> lastReadSeq
        presence: new Map(participants.map((u) => [u, { status: "online", lastSeenAt: Date.now() }])),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return this.#serializeRoom(this.#rooms.get(roomId));
  }

  listRooms(nowMs = Date.now()) {
    const list = [];
    for (const room of this.#rooms.values()) {
      this.#pruneTyping(room, nowMs);
      list.push(this.#serializeRoom(room));
    }
    return list;
  }

  getRoom(roomId, nowMs = Date.now()) {
    const room = this.#rooms.get(roomId);
    if (!room) return null;
    this.#pruneTyping(room, nowMs);
    return this.#serializeRoom(room);
  }

  /**
   * Sends a real-time message between two users with idempotency deduplication,
   * optional causal sequence ordering, and microsecond fanout telemetry.
   */
  sendMessage({
    roomId,
    sender,
    recipient,
    text,
    clientMsgId = null,
    expectedSeq = null,
    replyToSeq = null,
    nowMs = Date.now(),
    onFanout = null,
  }) {
    const t0 = performance.now();
    const cleanSender = String(sender || "").trim().toLowerCase();
    const cleanRecipient = String(recipient || "").trim().toLowerCase();
    const cleanText = typeof text === "string" ? text.trim() : "";

    if (!cleanSender) throw new ValidationError("Message sender is required.");
    if (!cleanText) throw new ValidationError("Message text cannot be empty.");
    if (cleanText.length > CHAT_MESSAGE_MAX) {
      throw new ValidationError(`Keep chat messages under ${CHAT_MESSAGE_MAX} characters.`);
    }

    let room = roomId ? this.#rooms.get(roomId) : null;
    if (!room) {
      const targetRecipient = cleanRecipient || (cleanSender === "agent" ? "pp" : "agent");
      const created = this.ensureRoom(cleanSender, targetRecipient, roomId);
      room = this.#rooms.get(created.id);
    }

    // 1. Idempotency check (suppress duplicate retries on flaky connections)
    if (clientMsgId && room.clientMsgIndex.has(clientMsgId)) {
      this.#telemetry.duplicatesSuppressed++;
      const existing = room.clientMsgIndex.get(clientMsgId);
      this.#recordLatency(performance.now() - t0);
      return { message: { ...existing }, deduplicated: true, buffered: false };
    }

    // 2. Out-of-order causal sequence check (if caller specifies expectedSeq > room.seq + 1)
    if (Number.isInteger(expectedSeq) && expectedSeq > room.seq + 1) {
      this.#telemetry.outOfOrderBuffered++;
      room.reorderBuffer.set(expectedSeq, {
        sender: cleanSender,
        recipient: cleanRecipient || room.participants.find((p) => p !== cleanSender) || "peer",
        text: cleanText,
        clientMsgId,
        replyToSeq,
        nowMs,
      });
      this.#recordLatency(performance.now() - t0);
      return {
        message: null,
        deduplicated: false,
        buffered: true,
        bufferedSeq: expectedSeq,
        waitingForSeq: room.seq + 1,
      };
    }

    const msg = this.#commitMessage(room, {
      sender: cleanSender,
      recipient: cleanRecipient || room.participants.find((p) => p !== cleanSender) || "peer",
      text: cleanText,
      clientMsgId,
      replyToSeq,
      nowMs,
    });

    // Clear sender's active typing indicator upon message send
    room.typing.delete(cleanSender);

    // 3. Flush any contiguous out-of-order buffered messages that are now unblocked
    const flushed = [msg];
    while (room.reorderBuffer.has(room.seq + 1)) {
      const nextPayload = room.reorderBuffer.get(room.seq + 1);
      room.reorderBuffer.delete(room.seq + 1);
      this.#telemetry.outOfOrderFlushed++;
      flushed.push(this.#commitMessage(room, nextPayload));
    }

    if (typeof onFanout === "function") {
      for (const m of flushed) onFanout(m);
    }

    const latencyMs = performance.now() - t0;
    this.#recordLatency(latencyMs);

    return {
      message: { ...msg },
      flushedMessages: flushed.map((m) => ({ ...m })),
      deduplicated: false,
      buffered: false,
      latencyMs: Math.round(latencyMs * 1000) / 1000,
    };
  }

  #commitMessage(room, { sender, recipient, text, clientMsgId, replyToSeq, nowMs }) {
    const seq = ++room.seq;
    const message = {
      id: `msg_${room.id}_${seq}`,
      roomId: room.id,
      seq,
      sender,
      recipient,
      text,
      clientMsgId: clientMsgId || `auto_${seq}`,
      replyToSeq: Number.isInteger(replyToSeq) ? replyToSeq : null,
      createdAt: new Date(nowMs).toISOString(),
      timestampMs: nowMs,
    };

    room.messages.push(message);
    if (clientMsgId) {
      room.clientMsgIndex.set(clientMsgId, message);
    }

    // Ring buffer capacity enforcement
    while (room.messages.length > this.#maxMessagesPerRoom) {
      const evicted = room.messages.shift();
      this.#telemetry.ringBufferEvictions++;
      if (evicted?.clientMsgId) {
        room.clientMsgIndex.delete(evicted.clientMsgId);
      }
    }

    room.readWatermarks.set(sender, Math.max(room.readWatermarks.get(sender) || 0, seq));
    room.presence.set(sender, { status: "online", lastSeenAt: nowMs });
    room.updatedAt = new Date(nowMs).toISOString();
    this.#telemetry.totalMessages++;

    return message;
  }

  getMessages(roomId, { afterSeq = 0, limit = 100, nowMs = Date.now() } = {}) {
    const room = this.#rooms.get(roomId);
    if (!room) throw new ValidationError(`Unknown chat room '${roomId}'.`);
    this.#pruneTyping(room, nowMs);

    const filtered = room.messages
      .filter((m) => m.seq > afterSeq)
      .slice(-Math.max(1, Math.min(limit, this.#maxMessagesPerRoom)))
      .map((m) => ({
        ...m,
        readBy: this.#computeReadBy(room, m.seq),
      }));

    return {
      roomId: room.id,
      participants: [...room.participants],
      latestSeq: room.seq,
      messages: filtered,
      typingUsers: [...room.typing.keys()],
      readWatermarks: Object.fromEntries(room.readWatermarks),
    };
  }

  setTyping({ roomId, username, isTyping = true, nowMs = Date.now() }) {
    const room = this.#rooms.get(roomId);
    if (!room) throw new ValidationError(`Unknown chat room '${roomId}'.`);
    const cleanUser = String(username || "").trim().toLowerCase();
    if (!cleanUser) throw new ValidationError("Username required for typing indicator.");

    this.#pruneTyping(room, nowMs);
    if (isTyping) {
      room.typing.set(cleanUser, nowMs + this.#typingTtlMs);
    } else {
      room.typing.delete(cleanUser);
    }
    room.presence.set(cleanUser, { status: "online", lastSeenAt: nowMs });
    this.#telemetry.typingEvents++;

    return {
      roomId: room.id,
      typingUsers: [...room.typing.keys()],
    };
  }

  markRead({ roomId, username, upToSeq, nowMs = Date.now() }) {
    const room = this.#rooms.get(roomId);
    if (!room) throw new ValidationError(`Unknown chat room '${roomId}'.`);
    const cleanUser = String(username || "").trim().toLowerCase();
    if (!cleanUser) throw new ValidationError("Username required for read receipt.");

    const targetSeq = Number.isInteger(upToSeq) ? Math.min(upToSeq, room.seq) : room.seq;
    const prev = room.readWatermarks.get(cleanUser) || 0;
    const next = Math.max(prev, targetSeq);
    room.readWatermarks.set(cleanUser, next);
    room.presence.set(cleanUser, { status: "online", lastSeenAt: nowMs });
    this.#telemetry.readReceipts++;

    return {
      roomId: room.id,
      username: cleanUser,
      lastReadSeq: next,
      readWatermarks: Object.fromEntries(room.readWatermarks),
    };
  }

  /**
   * Runs deep protocol & state diagnostics across a chat room to verify invariants:
   * - Strictly monotonic sequence numbers without gaps
   * - No expired ghost typing indicators
   * - Read watermarks bounded by [0, room.seq]
   * - Ring buffer capacity compliance
   */
  runDiagnostics(roomId = "dm:agent:pp", nowMs = Date.now()) {
    const room = this.#rooms.get(roomId) || [...this.#rooms.values()][0];
    if (!room) {
      return { healthy: true, roomId: null, checks: [], anomalies: [], telemetry: this.getTelemetry() };
    }

    this.#pruneTyping(room, nowMs);
    const anomalies = [];
    const checks = [];

    // Check 1: Sequence monotonicity & contiguity within retained ring buffer
    let seqMonotonic = true;
    for (let i = 1; i < room.messages.length; i++) {
      if (room.messages[i].seq !== room.messages[i - 1].seq + 1) {
        seqMonotonic = false;
        anomalies.push(`Sequence gap detected between #${room.messages[i - 1].seq} and #${room.messages[i].seq}`);
      }
    }
    checks.push({
      name: "Sequence Monotonicity & Contiguity",
      passed: seqMonotonic,
      detail: `${room.messages.length} retained messages verified (latest seq #${room.seq})`,
    });

    // Check 2: Ring buffer bound
    const withinCapacity = room.messages.length <= this.#maxMessagesPerRoom;
    if (!withinCapacity) {
      anomalies.push(`Room buffer size ${room.messages.length} exceeds cap ${this.#maxMessagesPerRoom}`);
    }
    checks.push({
      name: "Ring Buffer Memory Cap",
      passed: withinCapacity,
      detail: `${room.messages.length}/${this.#maxMessagesPerRoom} slots occupied`,
    });

    // Check 3: Ghost typing indicator leak check
    let ghostTyping = false;
    for (const [u, exp] of room.typing.entries()) {
      if (exp <= nowMs) {
        ghostTyping = true;
        anomalies.push(`Expired typing indicator leaked for user '${u}'`);
      }
    }
    checks.push({
      name: "Ephemeral Typing TTL Hygiene",
      passed: !ghostTyping,
      detail: `${room.typing.size} active typing indicator(s), 0 expired ghosts`,
    });

    // Check 4: Read watermark bounds
    let watermarksValid = true;
    for (const [u, wm] of room.readWatermarks.entries()) {
      if (wm < 0 || wm > room.seq) {
        watermarksValid = false;
        anomalies.push(`Invalid read watermark ${wm} for '${u}' (max seq ${room.seq})`);
      }
    }
    checks.push({
      name: "Read Receipt Watermark Bounds",
      passed: watermarksValid,
      detail: `Watermarks aligned: ${JSON.stringify(Object.fromEntries(room.readWatermarks))}`,
    });

    // Check 5: Stalled reorder buffer check
    const stalledCount = room.reorderBuffer.size;
    if (stalledCount > 0) {
      anomalies.push(`${stalledCount} out-of-order message(s) waiting for seq #${room.seq + 1}`);
    }
    checks.push({
      name: "Out-of-Order Reorder Buffer Queue",
      passed: stalledCount === 0,
      detail: `${stalledCount} stalled packet(s) in holdback queue`,
    });

    return {
      healthy: anomalies.length === 0,
      roomId: room.id,
      participants: [...room.participants],
      latestSeq: room.seq,
      retainedMessages: room.messages.length,
      checks,
      anomalies,
      telemetry: this.getTelemetry(),
      diagnosedAt: new Date(nowMs).toISOString(),
    };
  }

  /**
   * Executes a high-throughput two-user real-time chat benchmark measuring:
   * - End-to-end message fanout throughput (msgs/sec)
   * - P50 / P95 / P99 dispatch latency (ms)
   * - Idempotent duplicate replay suppression accuracy
   * - Out-of-order packet resequencing correctness
   * - Ring buffer memory bounding
   */
  runBenchmark({ messageCount = 200, duplicateRate = 0.1 } = {}) {
    const count = Math.max(10, Math.min(2000, Number(messageCount) || 200));
    const benchEngine = new ChatEngine({ maxMessagesPerRoom: 256, typingTtlMs: 3000 });
    const room = benchEngine.ensureRoom("bench_alice", "bench_bob");
    const roomId = room.id;

    const latenciesMs = [];
    let expectedDuplicates = 0;
    const startTime = performance.now();

    for (let i = 1; i <= count; i++) {
      const sender = i % 2 === 1 ? "bench_alice" : "bench_bob";
      const recipient = sender === "bench_alice" ? "bench_bob" : "bench_alice";
      const clientMsgId = `bench_msg_${i}`;

      if (i % 10 === 0) {
        benchEngine.setTyping({ roomId, username: sender, isTyping: true });
      }

      const t0 = performance.now();
      benchEngine.sendMessage({
        roomId,
        sender,
        recipient,
        text: `Benchmark payload #${i} from ${sender} -> ${recipient}`,
        clientMsgId,
      });
      latenciesMs.push(performance.now() - t0);

      // Inject deterministic duplicate retry
      if (duplicateRate > 0 && i % Math.round(1 / duplicateRate) === 0) {
        expectedDuplicates++;
        benchEngine.sendMessage({
          roomId,
          sender,
          recipient,
          text: `Benchmark payload #${i} from ${sender} -> ${recipient}`,
          clientMsgId,
        });
      }

      if (i % 25 === 0) {
        benchEngine.markRead({ roomId, username: recipient, upToSeq: i });
      }
    }

    // Test out-of-order holdback & flush (send seq N+2 before seq N+1)
    const currentSeq = benchEngine.getRoom(roomId).latestSeq;
    const ooo1 = benchEngine.sendMessage({
      roomId,
      sender: "bench_alice",
      recipient: "bench_bob",
      text: "Out-of-order future packet",
      clientMsgId: "ooo_future",
      expectedSeq: currentSeq + 2,
    });
    const ooo2 = benchEngine.sendMessage({
      roomId,
      sender: "bench_bob",
      recipient: "bench_alice",
      text: "Missing gap-fill packet",
      clientMsgId: "ooo_gapfill",
      expectedSeq: currentSeq + 1,
    });

    const totalDurationMs = Math.max(0.05, Math.round((performance.now() - startTime) * 1000) / 1000);
    const sortedLatencies = [...latenciesMs].sort((a, b) => a - b);
    const diag = benchEngine.runDiagnostics(roomId);
    const telemetry = benchEngine.getTelemetry();

    return {
      suite: "Two-User Real-Time Chat Benchmark",
      roomId,
      messagesDispatched: count + 2,
      duplicatesInjected: expectedDuplicates,
      duplicatesSuppressed: telemetry.duplicatesSuppressed,
      outOfOrderResequenced: Boolean(ooo1.buffered && ooo2.flushedMessages?.length === 2),
      ringBufferCappedAt: diag.retainedMessages,
      diagnosticsHealthy: diag.healthy,
      throughputMsgsPerSec: Math.round(((count + 2) / (totalDurationMs / 1000))),
      latency: {
        p50Ms: computePercentile(sortedLatencies, 50),
        p95Ms: computePercentile(sortedLatencies, 95),
        p99Ms: computePercentile(sortedLatencies, 99),
        totalDurationMs,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  getTelemetry() {
    const sorted = [...this.#telemetry.fanoutSamplesMs].sort((a, b) => a - b);
    return {
      totalMessages: this.#telemetry.totalMessages,
      duplicatesSuppressed: this.#telemetry.duplicatesSuppressed,
      outOfOrderBuffered: this.#telemetry.outOfOrderBuffered,
      outOfOrderFlushed: this.#telemetry.outOfOrderFlushed,
      typingEvents: this.#telemetry.typingEvents,
      readReceipts: this.#telemetry.readReceipts,
      ringBufferEvictions: this.#telemetry.ringBufferEvictions,
      activeRooms: this.#rooms.size,
      latency: {
        samples: sorted.length,
        p50Ms: computePercentile(sorted, 50),
        p95Ms: computePercentile(sorted, 95),
        p99Ms: computePercentile(sorted, 99),
      },
    };
  }

  #recordLatency(ms) {
    this.#telemetry.fanoutSamplesMs.push(ms);
    if (this.#telemetry.fanoutSamplesMs.length > 500) {
      this.#telemetry.fanoutSamplesMs.shift();
    }
  }

  #pruneTyping(room, nowMs) {
    for (const [user, expiresAt] of room.typing.entries()) {
      if (nowMs >= expiresAt) {
        room.typing.delete(user);
      }
    }
  }

  #computeReadBy(room, seq) {
    const readers = [];
    for (const [user, watermark] of room.readWatermarks.entries()) {
      if (watermark >= seq) readers.push(user);
    }
    return readers;
  }

  #serializeRoom(room) {
    const lastMessage = room.messages.at(-1) || null;
    return {
      id: room.id,
      participants: [...room.participants],
      latestSeq: room.seq,
      messageCount: room.messages.length,
      lastMessage: lastMessage ? { ...lastMessage } : null,
      typingUsers: [...room.typing.keys()],
      readWatermarks: Object.fromEntries(room.readWatermarks),
      presence: Object.fromEntries(room.presence),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
