import type { FastifyPluginAsync } from "fastify";
import type WebSocket from "ws";
import websocket from "@fastify/websocket";
import jwt from "jsonwebtoken";
import fp from "fastify-plugin";
import { getPrismaClient } from "@repo/db";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { getAccessTokenFromCookies } from "#src/lib/auth-cookies.js";
import { RealtimeManager } from "./realtime-manager.js";
import { consumeTicket } from "#src/services/realtime-ticket.js";
import { JWT_AUDIENCE, JWT_ISSUER } from "#src/constants/auth.constants.js";

declare module "fastify" {
  interface FastifyInstance {
    realtime: RealtimeManager;
  }
}

interface WsClientMessage {
  type: "subscribe" | "unsubscribe" | "ping";
  topic?: string;
}

function isValidClientMessage(data: unknown): data is WsClientMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  if (msg.type === "ping") return true;

  return (
    (msg.type === "subscribe" || msg.type === "unsubscribe") &&
    typeof msg.topic === "string" &&
    msg.topic.length > 0 &&
    msg.topic.length <= 200
  );
}

const realtimePluginImpl: FastifyPluginAsync = async (fastify) => {
  const pgListenUrl =
    ENVIRONMENT_VARIABLES.PG_LISTEN_URL || ENVIRONMENT_VARIABLES.DATABASE_URL;
  const manager = new RealtimeManager(pgListenUrl, fastify.log);
  await manager.start();

  fastify.decorate("realtime", manager);
  await fastify.register(websocket);
  fastify.get("/realtime-health", async () => {
    const isHealthy = await manager.checkHealth();
    return isHealthy ? { status: "ok" } : { status: "error" };
  });

  fastify.get("/ws", { websocket: true }, async (socket, request) => {
    const url = new URL(
      request.url,
      `http://${request.headers.host ?? "localhost"}`,
    );

    // Prefer a one-time ticket (?ticket=…) issued via POST /realtime/ticket.
    // Fall back to the auth cookie for cookie-mode clients. The long-lived
    // JWT is no longer accepted as a query param (would land in access logs).
    let userId: string | null = null;
    // tokenVersion claim from the cookie path (null on ticket path — the
    // ticket-issuing route already enforced auth at HTTP time).
    let cookieTokenVersion: number | null = null;

    const ticket = url.searchParams.get("ticket");
    if (ticket) {
      userId = consumeTicket(ticket);
      if (!userId) {
        socket.close(4001, "Invalid or expired ticket");
        return;
      }
    } else {
      const cookieToken = getAccessTokenFromCookies(request.headers.cookie);
      if (!cookieToken) {
        socket.close(4001, "Missing ticket or cookie");
        return;
      }
      try {
        const payload = jwt.verify(
          cookieToken,
          ENVIRONMENT_VARIABLES.JWT_SECRET_KEY,
          {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
          },
        ) as jwt.JwtPayload;
        if (!payload.sub) {
          socket.close(4001, "Invalid token payload");
          return;
        }
        userId = payload.sub;
        cookieTokenVersion =
          typeof payload.tokenVersion === "number"
            ? payload.tokenVersion
            : null;
        if (cookieTokenVersion === null) {
          // The HTTP guard rejects tokens missing this claim; mirror that.
          socket.close(4001, "Invalid token payload");
          return;
        }
      } catch {
        socket.close(4001, "Invalid or expired token");
        return;
      }
    }

    // Belt-and-braces: the user might have been soft-deleted (account
    // deletion) or had every session invalidated (tokenVersion bump on
    // password reset / refresh-reuse) between ticket issuance / cookie
    // mint and now. The HTTP auth guard does these checks on every
    // request; the WS handshake skipped them entirely until this fix.
    const prisma = getPrismaClient();
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true, tokenVersion: true },
    });
    if (!dbUser || dbUser.deletedAt) {
      socket.close(4001, "User not found");
      return;
    }
    if (
      cookieTokenVersion !== null &&
      dbUser.tokenVersion !== cookieTokenVersion
    ) {
      socket.close(4001, "Session invalidated");
      return;
    }

    manager.addClient(socket, userId);

    socket.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg: unknown = JSON.parse(raw.toString());
        if (!isValidClientMessage(msg)) return;

        if (msg.type === "ping") {
          socket.send(JSON.stringify({ type: "pong" }));
        } else if (msg.type === "subscribe" && msg.topic) {
          void manager.subscribe(socket, msg.topic);
        } else if (msg.type === "unsubscribe" && msg.topic) {
          manager.unsubscribe(socket, msg.topic);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on("close", () => manager.removeClient(socket));
  });

  fastify.addHook("onClose", async () => {
    await manager.close();
  });
};

export const realtimePlugin = fp(realtimePluginImpl, {
  name: "realtime",
});
