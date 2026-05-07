import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { buildWsUrl, fetchRealtimeTicket } from "../../lib/realtime/realtime";
import { invalidateByEntity } from "./invalidation-map";

/** Heartbeat interval in ms. */
const PING_INTERVAL = 30_000;
/** How long we wait for a pong before assuming the socket is dead. */
const PONG_TIMEOUT = 5_000;
/** Initial reconnect delay; doubles on each consecutive failure up to MAX. */
const RECONNECT_DELAY = 2_000;
const MAX_RECONNECT_DELAY = 30_000;

type WsServerEvent = {
  type: "event";
  topic: string;
  payload?: unknown;
};

type WsServerMessage =
  | WsServerEvent
  | { type: "pong" }
  | { type: "subscribed"; topic: string }
  | { type: "error"; message: string };

/**
 * Subscribe to one or more realtime topics over a single WS connection.
 *
 * Internals:
 * - Fetches a short-lived ticket via POST /realtime/ticket on each (re)connect
 * - Sends `{type:"subscribe", topic}` for each topic on open
 * - Heartbeats with `{type:"ping"}` every 30s; reconnects on pong timeout
 * - Dispatches `event` messages through `invalidateByEntity` so any TQ key
 *   tagged for that entity refetches automatically
 *
 * The hook is a no-op when `topics` is empty — useful for conditional
 * subscription (e.g. plan-specific topics that depend on a route param).
 */
export function useRealtime(
  topics: string[],
  onEvent?: (event: WsServerEvent) => void,
): void {
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const topicsKey = topics.join(",");

  useEffect(() => {
    if (topics.length === 0) return;

    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let pongTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let disposed = false;

    const clearTimers = () => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      if (pongTimer) {
        clearTimeout(pongTimer);
        pongTimer = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      clearTimers();
      const delay = Math.min(
        RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY,
      );
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(() => {
        if (!disposed) void connect();
      }, delay);
    };

    const startPing = () => {
      pingTimer = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "ping" }));
        pongTimer = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close(4000, "Pong timeout");
          }
        }, PONG_TIMEOUT);
      }, PING_INTERVAL);
    };

    const connect = async () => {
      if (disposed) return;

      const ticket = await fetchRealtimeTicket();
      if (!ticket || disposed) {
        scheduleReconnect();
        return;
      }

      ws = new WebSocket(buildWsUrl(ticket));

      ws.onopen = () => {
        reconnectAttempts = 0;
        for (const topic of topics) {
          ws?.send(JSON.stringify({ type: "subscribe", topic }));
        }
        startPing();
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as WsServerMessage;
          if (msg.type === "pong") {
            if (pongTimer) {
              clearTimeout(pongTimer);
              pongTimer = null;
            }
            return;
          }
          if (msg.type === "event") {
            onEventRef.current?.(msg);
            const [entity] = msg.topic.split(":");
            if (entity) invalidateByEntity(queryClient, entity);
          }
        } catch {
          // ignore malformed message
        }
      };

      ws.onclose = () => {
        clearTimers();
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose fires next, scheduling the reconnect
      };
    };

    void connect();

    return () => {
      disposed = true;
      clearTimers();
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    };
    // topicsKey serves as dependency proxy — see top of hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, queryClient]);
}
