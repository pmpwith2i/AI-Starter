import type { FastifyBaseLogger } from "fastify";
import fs from "fs";
import pg from "pg";
import type { WebSocket } from "ws";

interface ClientState {
  userId: string;
  topics: Set<string>;
}

interface RealtimePayload {
  topic: string;
  table: string;
  operation: string;
  id: string;
  timestamp: number;
}

export interface RealtimeManagerOptions {
  /** Factory for new pg clients — injected by tests. Defaults to a real
   *  `pg.Client` wired to the given `pgListenUrl`. */
  createPgClient?: () => pg.Client;
  /** Delay helper — injected by tests to collapse backoff waits. */
  sleep?: (ms: number) => Promise<void>;
  /** Base delay (ms) for exponential backoff. Default 1000. */
  baseBackoffMs?: number;
  /** Maximum delay (ms) between reconnect attempts. Default 60_000. */
  maxBackoffMs?: number;
}

const DEFAULT_BASE_BACKOFF_MS = 1_000;
const DEFAULT_MAX_BACKOFF_MS = 60_000;
const DEFAULT_SLEEP = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a dedicated pg.Client that does `LISTEN realtime` and a set of
 * authenticated WebSocket clients. Incoming NOTIFY payloads are broadcast to
 * every WS client subscribed to the payload's topic.
 *
 * Reconnect strategy: if the pg client emits an `error` event (TCP reset,
 * RDS failover, auth flap…), the manager tears it down and opens a fresh
 * client with exponential backoff + jitter, capped at `maxBackoffMs`. A
 * `pg.Client` cannot be reused after `.end()`, so a new instance is created
 * via `createPgClient` on every cycle. Concurrent error events are
 * deduplicated via an `isReconnecting` flag so only one retry loop runs at
 * a time. Listeners on the abandoned client are removed to prevent leaks
 * and late double-handling.
 */
export class RealtimeManager {
  private pgClient: pg.Client;
  private clients = new Map<WebSocket, ClientState>();
  private logger: FastifyBaseLogger;
  private readonly createPgClient: () => pg.Client;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private isReconnecting = false;

  constructor(
    pgListenUrl: string,
    logger: FastifyBaseLogger,
    options: RealtimeManagerOptions = {},
  ) {
    this.logger = logger.child({ component: "realtime" });
    this.createPgClient =
      options.createPgClient ?? (() => defaultCreatePgClient(pgListenUrl));
    this.sleep = options.sleep ?? DEFAULT_SLEEP;
    this.baseBackoffMs = options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;
    this.maxBackoffMs = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.pgClient = this.createPgClient();
  }

  async start(): Promise<void> {
    this.logger.info("Connecting PG LISTEN client...");
    this.attachHandlers(this.pgClient);
    await this.pgClient.connect();
    await this.pgClient.query("LISTEN realtime");
    this.logger.info("Listening on PG channel 'realtime'");
  }

  /** Test-only entry point to run the reconnect loop synchronously-awaitable. */
  async triggerReconnectForTests(): Promise<void> {
    await this.reconnectLoop();
  }

  private attachHandlers(client: pg.Client): void {
    client.on("error", (err) => {
      this.logger.error({ err }, "PG LISTEN client error");
      void this.reconnectLoop();
    });
    client.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        const payload = JSON.parse(msg.payload) as RealtimePayload;
        this.broadcast(payload.topic, payload);
      } catch (err) {
        this.logger.error({ err }, "Failed to parse PG notification payload");
      }
    });
  }

  private async reconnectLoop(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    let attempt = 0;
    try {
      while (true) {
        attempt++;
        const capped = Math.min(
          this.baseBackoffMs * 2 ** (attempt - 1),
          this.maxBackoffMs,
        );
        const jitter = Math.floor(Math.random() * (capped / 2));
        const delayMs = capped + jitter;

        this.logger.warn(
          { attempt, delayMs },
          "Scheduling PG LISTEN reconnect",
        );
        await this.sleep(delayMs);

        try {
          await this.closeClientQuietly(this.pgClient);
          this.pgClient = this.createPgClient();
          this.attachHandlers(this.pgClient);
          await this.pgClient.connect();
          await this.pgClient.query("LISTEN realtime");
          this.logger.info({ attempt }, "PG LISTEN reconnected");
          return;
        } catch (err) {
          this.logger.warn(
            { err, attempt },
            "PG LISTEN reconnect attempt failed",
          );
          // loop and try again with the next backoff
        }
      }
    } finally {
      this.isReconnecting = false;
    }
  }

  private async closeClientQuietly(client: pg.Client): Promise<void> {
    try {
      client.removeAllListeners("error");
      client.removeAllListeners("notification");
      await client.end();
    } catch (err) {
      this.logger.debug({ err }, "Error while closing PG client");
    }
  }

  addClient(ws: WebSocket, userId: string): void {
    this.clients.set(ws, { userId, topics: new Set() });
    this.logger.debug({ userId }, "WebSocket client connected");
  }

  removeClient(ws: WebSocket): void {
    const state = this.clients.get(ws);
    if (state) {
      this.logger.debug(
        { userId: state.userId },
        "WebSocket client disconnected",
      );
      this.clients.delete(ws);
    }
  }

  async subscribe(ws: WebSocket, topic: string): Promise<void> {
    const state = this.clients.get(ws);
    if (!state) return;

    const authorized = await this.isAuthorized(state.userId, topic);
    if (!authorized) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Not authorized for topic: ${topic}`,
        }),
      );
      return;
    }

    state.topics.add(topic);
    ws.send(JSON.stringify({ type: "subscribed", topic }));
    this.logger.debug({ userId: state.userId, topic }, "Client subscribed");
  }

  unsubscribe(ws: WebSocket, topic: string): void {
    const state = this.clients.get(ws);
    if (!state) return;

    state.topics.delete(topic);
    ws.send(JSON.stringify({ type: "unsubscribed", topic }));
    this.logger.debug({ userId: state.userId, topic }, "Client unsubscribed");
  }

  private async isAuthorized(userId: string, topic: string): Promise<boolean> {
    // Strict shape: every authorized topic is exactly `entity:scope:id`.
    // A malformed topic is rejected outright.
    //
    // Starter scope:
    //   - `<entity>:user:<userId>` — user owns it
    //   - `<entity>:public:all`    — public broadcast
    // Add new scope cases as you scaffold realtime-aware domains
    // (e.g. `chat:conversation:<id>` requires a DB ownership check).
    const parts = topic.split(":");
    if (parts.length !== 3) return false;
    const scope = parts[1]!;
    const id = parts[2]!;
    if (!id) return false;

    if (scope === "user") return userId === id;
    if (scope === "public") return true;

    return false;
  }

  private broadcast(topic: string, payload: RealtimePayload): void {
    const message = JSON.stringify({
      type: "event" as const,
      topic: payload.topic,
      table: payload.table,
      operation: payload.operation,
      id: payload.id,
      timestamp: payload.timestamp,
    });

    let sent = 0;
    for (const [ws, state] of this.clients) {
      if (state.topics.has(topic) && ws.readyState === ws.OPEN) {
        ws.send(message);
        sent++;
      }
    }

    if (sent > 0) {
      this.logger.debug({ topic, sent }, "Broadcast realtime event");
    }
  }

  async close(): Promise<void> {
    for (const [ws] of this.clients) {
      ws.close(1001, "Server shutting down");
    }
    this.clients.clear();
    await this.closeClientQuietly(this.pgClient);
    this.logger.info("Realtime manager closed");
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.pgClient.query("SELECT 1");
      return true;
    } catch (err) {
      this.logger.error({ err }, "Realtime health check failed");
      return false;
    }
  }
}

function defaultCreatePgClient(pgListenUrl: string): pg.Client {
  const hasCA = fs.existsSync("/certs/global-bundle.pem");
  return new pg.Client({
    connectionString: pgListenUrl,
    connectionTimeoutMillis: 10_000,
    ...(hasCA && {
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("/certs/global-bundle.pem", "utf-8"),
      },
    }),
  });
}
