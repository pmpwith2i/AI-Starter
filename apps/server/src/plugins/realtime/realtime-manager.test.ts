import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { FastifyBaseLogger } from "fastify";

// RealtimeManager imports @repo/db transitively via isAuthorized — mock with
// a minimal shape so the module loads without Prisma.
mock.module("@repo/db", {
  namedExports: {
    getPrismaClient: () => ({
      chatConversation: { findFirst: async () => null },
      courseEnrollment: { findFirst: async () => null },
    }),
  },
});

const { RealtimeManager } = await import("./realtime-manager.js");

// ── Fake pg.Client — extends EventEmitter so the manager can attach its
// error/notification handlers just like on a real `pg.Client`. ─────────────

interface FakeClientOptions {
  /** When set, `connect()` throws this on resolve. */
  failConnectWith?: Error;
}

class FakePgClient extends EventEmitter {
  public readonly id: number;
  public connectMock: ReturnType<typeof mock.fn>;
  public queryMock: ReturnType<typeof mock.fn>;
  public endMock: ReturnType<typeof mock.fn>;

  constructor(id: number, options: FakeClientOptions = {}) {
    super();
    this.id = id;
    this.connectMock = mock.fn(async () => {
      if (options.failConnectWith) throw options.failConnectWith;
    });
    this.queryMock = mock.fn(async () => ({ rows: [] }));
    this.endMock = mock.fn(async () => {});
  }

  connect() {
    return this.connectMock();
  }
  query(sql: string) {
    return this.queryMock(sql);
  }
  end() {
    return this.endMock();
  }
}

const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  // Fastify logger's child returns a logger — for tests we recycle the same
  // no-op surface, that's enough for every call-site in realtime-manager.
  child() {
    return silentLogger;
  },
} as unknown as FastifyBaseLogger;

// Build a manager with an injected client factory and injected sleep. Returns
// both the manager and a view on the queue of fake clients + recorded sleeps.
const buildManager = (opts: {
  clientFactoryPlan: FakeClientOptions[];
  /** When set the factory starts throwing after this many clients, simulating
   *  a fatal construction error. */
  clientFactoryFatalAfter?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
}) => {
  const clients: FakePgClient[] = [];
  let idx = 0;
  const createPgClient = () => {
    if (
      opts.clientFactoryFatalAfter !== undefined &&
      idx >= opts.clientFactoryFatalAfter
    ) {
      throw new Error("Unexpected client factory call");
    }
    const planItem = opts.clientFactoryPlan[idx] ?? {};
    const c = new FakePgClient(idx++, planItem);
    clients.push(c);
    // FakePgClient implements the narrow surface used by RealtimeManager
    // (connect, query, end, on/off/removeAllListeners via EventEmitter).
    // Cast so we don't have to stub the full pg.Client shape.
    return c as unknown as import("pg").Client;
  };

  const sleeps: number[] = [];
  const sleep = async (ms: number) => {
    sleeps.push(ms);
  };

  const manager = new RealtimeManager("postgres://test", silentLogger, {
    createPgClient,
    sleep,
    baseBackoffMs: opts.baseBackoffMs ?? 100,
    maxBackoffMs: opts.maxBackoffMs ?? 1_000,
  });

  return { manager, clients, sleeps };
};

// Give queued microtasks + the reconnect loop a chance to settle.
const flushMicrotasks = async () => {
  for (let i = 0; i < 50; i++) {
    await Promise.resolve();
  }
};

// ─── Tests ────────────────────────────────────────────────────────────────

describe("RealtimeManager", () => {
  describe("initial connect", () => {
    it("connects a pg client and issues LISTEN realtime", async () => {
      const { manager, clients } = buildManager({ clientFactoryPlan: [{}] });
      await manager.start();

      assert.equal(clients.length, 1);
      assert.equal(clients[0]!.connectMock.mock.callCount(), 1);
      assert.equal(clients[0]!.queryMock.mock.callCount(), 1);
      assert.equal(
        clients[0]!.queryMock.mock.calls[0]!.arguments[0],
        "LISTEN realtime",
      );

      await manager.close();
    });

    it("forwards notification payloads to the broadcast handler", async () => {
      const { manager, clients } = buildManager({ clientFactoryPlan: [{}] });
      await manager.start();

      // No client subscribed — broadcast is silent but must not crash on
      // malformed payloads.
      clients[0]!.emit("notification", { payload: "{not json" });
      clients[0]!.emit("notification", {
        payload: JSON.stringify({
          topic: "public:all",
          table: "x",
          operation: "INSERT",
          id: "1",
          timestamp: 0,
        }),
      });

      await manager.close();
    });
  });

  describe("reconnect", () => {
    it("creates a NEW pg client on reconnect (does not reuse the closed one)", async () => {
      const { manager, clients } = buildManager({
        clientFactoryPlan: [{}, {}],
      });
      await manager.start();
      assert.equal(clients.length, 1);

      clients[0]!.emit("error", new Error("boom"));
      await flushMicrotasks();

      assert.equal(clients.length, 2, "a new pg client should be created");
      assert.equal(
        clients[0]!.endMock.mock.callCount(),
        1,
        "old client closed",
      );
      assert.equal(
        clients[1]!.connectMock.mock.callCount(),
        1,
        "new client connected",
      );

      await manager.close();
    });

    it("re-issues LISTEN realtime on the new client", async () => {
      const { manager, clients } = buildManager({
        clientFactoryPlan: [{}, {}],
      });
      await manager.start();
      clients[0]!.emit("error", new Error("boom"));
      await flushMicrotasks();

      assert.equal(clients[1]!.queryMock.mock.callCount(), 1);
      assert.equal(
        clients[1]!.queryMock.mock.calls[0]!.arguments[0],
        "LISTEN realtime",
      );

      await manager.close();
    });

    it("applies exponential backoff between retry attempts", async () => {
      // First reconnect attempt fails twice, then succeeds on the 3rd.
      const { manager, sleeps } = buildManager({
        clientFactoryPlan: [
          {},
          { failConnectWith: new Error("nope1") },
          { failConnectWith: new Error("nope2") },
          {},
        ],
        baseBackoffMs: 100,
        maxBackoffMs: 10_000,
      });
      await manager.start();

      await manager.triggerReconnectForTests();
      await flushMicrotasks();

      // Expected sleeps (base * 2^n): 100, 200, 400
      assert.equal(sleeps.length, 3);
      assert.ok(sleeps[0]! >= 100 && sleeps[0]! < 200);
      assert.ok(sleeps[1]! >= 200 && sleeps[1]! < 400);
      assert.ok(sleeps[2]! >= 400 && sleeps[2]! < 800);

      await manager.close();
    });

    it("caps the backoff at maxBackoffMs", async () => {
      const { manager, sleeps } = buildManager({
        clientFactoryPlan: [
          {},
          ...Array(10).fill({ failConnectWith: new Error("nope") }),
          {},
        ],
        baseBackoffMs: 100,
        maxBackoffMs: 500,
      });
      await manager.start();

      await manager.triggerReconnectForTests();
      await flushMicrotasks();

      // After a few attempts the backoff must saturate at maxBackoffMs + jitter
      // (jitter ≤ cap / 2 = 250). Allow up to 750 to account for jitter.
      const tail = sleeps.slice(-3);
      for (const ms of tail) {
        assert.ok(ms <= 750, `expected ≤750, got ${ms}`);
      }

      await manager.close();
    });

    it("deduplicates concurrent error events (no parallel reconnect loops)", async () => {
      const { manager, clients } = buildManager({
        clientFactoryPlan: [{}, {}, {}],
      });
      await manager.start();

      // Fire two error events in quick succession on the old client.
      clients[0]!.emit("error", new Error("boom 1"));
      clients[0]!.emit("error", new Error("boom 2"));
      await flushMicrotasks();

      // Only ONE reconnect cycle must have spun up a new client.
      assert.equal(clients.length, 2, "second error must be de-duped");

      await manager.close();
    });

    it("resets the backoff attempt counter after a successful reconnect", async () => {
      const { manager, clients, sleeps } = buildManager({
        clientFactoryPlan: [
          {},
          { failConnectWith: new Error("flap1") },
          {},
          // Second reconnect cycle — counter must have been reset so this
          // fails-then-succeeds pair starts at baseBackoffMs, not 4× base.
          { failConnectWith: new Error("flap2") },
          {},
        ],
        baseBackoffMs: 100,
        maxBackoffMs: 10_000,
      });
      await manager.start();

      await manager.triggerReconnectForTests();
      await flushMicrotasks();
      // After first cycle: sleeps = [100, 200]
      assert.equal(sleeps.length, 2);

      // Wait for the successful reconnect to have finished before triggering
      // the next cycle.
      assert.equal(clients.length, 3);

      await manager.triggerReconnectForTests();
      await flushMicrotasks();

      // After second cycle the added sleep should again start at base (100).
      const added = sleeps.slice(2);
      assert.equal(added.length, 2);
      assert.ok(
        added[0]! < 200,
        `expected counter reset to base, got ${added[0]}`,
      );

      await manager.close();
    });

    it("removes listeners from the old client before closing it", async () => {
      const { manager, clients } = buildManager({
        clientFactoryPlan: [{}, {}],
      });
      await manager.start();

      // The old client must have at least one 'error' listener attached by
      // the manager.
      assert.ok(clients[0]!.listenerCount("error") >= 1);

      clients[0]!.emit("error", new Error("boom"));
      await flushMicrotasks();

      // After reconnect, the old client must have no listeners left (to
      // prevent leaks and double-handling of late errors).
      assert.equal(clients[0]!.listenerCount("error"), 0);
      assert.equal(clients[0]!.listenerCount("notification"), 0);

      await manager.close();
    });
  });
});
