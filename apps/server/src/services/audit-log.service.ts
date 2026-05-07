import type { FastifyInstance } from "fastify";
import { getPrismaClient } from "@repo/db";
import type { AuditAction, AuditActorType } from "@repo/db";
import type { Prisma } from "@repo/db";
import { hashIp } from "@repo/crypto";
import { logger } from "#src/logger.js";
import type { AuditRouteConfig } from "./audit-builder.js";

export interface AuditEntry {
  actorId: string;
  actorType: AuditActorType;
  targetId: string;
  targetModel: string;
  action: AuditAction;
  fields?: string[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Insert an audit log entry. Fire-and-forget (never throws) — logs an error
 * if the insert fails but does not interrupt the request flow.
 *
 * IMPORTANT: This function records field NAMES accessed, never values.
 */
export const createAuditEntry = (entry: AuditEntry): void => {
  const prisma = getPrismaClient();
  prisma.auditLog
    .create({
      data: {
        actorId: entry.actorId,
        actorType: entry.actorType,
        targetId: entry.targetId,
        targetModel: entry.targetModel,
        action: entry.action,
        fields: entry.fields ?? [],
        reason: entry.reason,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      } as Prisma.AuditLogUncheckedCreateInput,
    })
    .catch((err) => {
      logger.error({ err, entry }, "Failed to write audit log");
    });
};

/**
 * Fastify hook that auto-logs requests whose routes declare `config.audit`.
 * Build the config via the `audit()` helper in audit-builder.ts.
 *
 * When the route declares `actorType: "system"` (e.g. for /internal/* bridge
 * endpoints), the log is still written even when `request.user` is absent.
 */
declare module "fastify" {
  interface FastifyContextConfig {
    audit?: AuditRouteConfig;
  }
}

const SYSTEM_ACTOR_ID = "system:bridge";
const ADMIN_ACTOR_ID = "admin:x-admin-secret";

export const registerAuditHook = (fastify: FastifyInstance): void => {
  fastify.addHook("onResponse", async (request, reply) => {
    const config = request.routeOptions.config?.audit;
    if (!config) return;
    if (reply.statusCode >= 400) return;

    const actorType = (config.actorType ?? "user") as AuditActorType;
    const actorIsUser = actorType === "user";

    if (actorIsUser && !request.user) return;

    const actorId =
      request.user?.id ??
      (actorType === "admin" ? ADMIN_ACTOR_ID : SYSTEM_ACTOR_ID);
    const targetId =
      (request.params as { id?: string } | undefined)?.id ?? actorId;

    createAuditEntry({
      actorId,
      actorType,
      targetId,
      targetModel: config.entity,
      action: config.action,
      fields: config.fields,
      reason: actorIsUser
        ? undefined
        : `${actorType}:${request.routeOptions.url}`,
      ipAddress: hashIp(request.ip) ?? undefined,
      userAgent: request.headers["user-agent"],
    });
  });
};
