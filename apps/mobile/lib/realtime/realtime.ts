import { API_BASE_URL } from "../api/client";
import { getCachedAccessToken } from "../auth/secure-store";

/**
 * GDPR: the long-lived JWT must never travel as a query param on the WS
 * handshake (it would land in server access logs). The server hands out a
 * short-lived (30s TTL, single-use) ticket via POST /realtime/ticket, which
 * is what we append to the WS URL.
 */
export async function fetchRealtimeTicket(): Promise<string | null> {
  const token = getCachedAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/realtime/ticket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ticket?: string };
    return body.ticket ?? null;
  } catch {
    return null;
  }
}

/** Convert the API base URL (http(s)://…) into the WS URL with ticket. */
export function buildWsUrl(ticket: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  const url = new URL("/ws", wsBase);
  url.searchParams.set("ticket", ticket);
  return url.toString();
}
