import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { WsServerMessage } from "@repo/server-sdk/schemas";
import {
  isLoggedIn,
  getAccessToken,
  API_BASE_URL,
  AUTH_STRATEGY,
} from "@/lib/api/client";
import { invalidateByEntity } from "./invalidation-map";

/** Interval between pings (ms) */
const PING_INTERVAL = 30_000;
/** How long to wait for a pong before considering connection dead (ms) */
const PONG_TIMEOUT = 5_000;
/** Delay before attempting reconnect (ms) */
const RECONNECT_DELAY = 2_000;
/** Max reconnect delay with exponential backoff (ms) */
const MAX_RECONNECT_DELAY = 30_000;

/**
 * GDPR: fetch a short-lived one-time ticket via POST /realtime/ticket and
 * append it as `?ticket=…` to the WS URL. The long-lived JWT is never passed
 * on the handshake URL (it would leak into server access logs).
 */
async function fetchRealtimeTicket(): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    if (AUTH_STRATEGY === "bearer") {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/realtime/ticket`, {
      method: "POST",
      credentials: AUTH_STRATEGY === "cookie" ? "include" : "omit",
      headers,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ticket?: string };
    return body.ticket ?? null;
  } catch {
    return null;
  }
}

function buildWsUrl(ticket: string): string {
  const url = new URL(import.meta.env.VITE_WS_BASE_URL);
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

/**
 * Subscribe to realtime topics via WebSocket.
 * Sends periodic pings and automatically reconnects + resubscribes on failure.
 *
 * @param topics - List of topic strings to subscribe to
 * @param onEvent - Optional callback for custom handling of incoming events
 */
export function useRealtime(
  topics: string[],
  onEvent?: (event: Extract<WsServerMessage, { type: "event" }>) => void,
): void {
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Stable key for dependency array
  const topicsKey = topics.join(",");

  useEffect(() => {
    if (!isLoggedIn() || topics.length === 0) return;

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
      reconnectAttempts++;

      reconnectTimer = setTimeout(() => {
        if (!disposed) void connect();
      }, delay);
    };

    const startPing = () => {
      pingTimer = setInterval(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({ type: "ping" }));

        // Start pong timeout — if no pong arrives, force reconnect
        pongTimer = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close(4000, "Pong timeout");
          }
        }, PONG_TIMEOUT);
      }, PING_INTERVAL);
    };

    const connect = async () => {
      if (disposed) return;

      if (!isLoggedIn()) return;

      const ticket = await fetchRealtimeTicket();
      if (!ticket || disposed) {
        // No ticket available (server unreachable or auth missing) — retry.
        if (!disposed) scheduleReconnect();
        return;
      }
      const wsUrl = buildWsUrl(ticket);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectAttempts = 0;

        // Subscribe to all topics
        for (const topic of topics) {
          ws!.send(JSON.stringify({ type: "subscribe", topic }));
        }

        startPing();
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as WsServerMessage;

          if (msg.type === "pong") {
            // Clear the pong timeout — connection is alive
            if (pongTimer) {
              clearTimeout(pongTimer);
              pongTimer = null;
            }
            return;
          }

          if (msg.type === "event") {
            onEventRef.current?.(msg);
            const [entity] = msg.topic.split(":");
            invalidateByEntity(queryClient, entity);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        clearTimers();
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after onerror, triggering reconnect
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey, queryClient]);
}
