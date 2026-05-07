// Realtime topic + WebSocket message types.
//
// Topics are simple strings on the wire, but we expose typed builders for
// each one so callers can build them safely from a userId without typos.
// Add a new builder whenever a new realtime topic is introduced server-side.

/** User-scoped topic emitted when a Notification row changes. */
export type NotificationTopic = `notifications:user:${string}`;
export const notificationTopic = (userId: string): NotificationTopic =>
  `notifications:user:${userId}`;

/** Client → Server messages */
export type WsClientMessage =
  | { type: "subscribe"; topic: string }
  | { type: "unsubscribe"; topic: string }
  | { type: "ping" };

/** Server → Client messages */
export type WsServerMessage =
  | { type: "subscribed"; topic: string }
  | { type: "unsubscribed"; topic: string }
  | { type: "error"; message: string }
  | { type: "pong" }
  | {
      type: "event";
      topic: string;
      table: string;
      operation: string;
      id: string;
      timestamp: number;
    };
