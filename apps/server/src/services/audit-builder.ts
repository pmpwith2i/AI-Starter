import type { AuditAction, AuditActorType } from "@repo/db";

export interface AuditRouteConfig {
  entity: string;
  action: AuditAction;
  fields?: string[];
  /** Optional override when the caller is not the authenticated user (e.g. internal bridge). */
  actorType?: AuditActorType;
}

export interface AuditBuildResult {
  audit: AuditRouteConfig;
}

/**
 * Typed helper for setting `config.audit` on a route. Ensures every sensitive
 * endpoint gets a consistent shape — lint / codemod can grep for calls to
 * `audit(...)` when auditing coverage.
 */
export const audit = (
  entity: string,
  action: AuditAction,
  fields?: string[],
  options?: { actorType?: AuditActorType },
): AuditBuildResult => ({
  audit: {
    entity,
    action,
    ...(fields ? { fields } : {}),
    ...(options?.actorType ? { actorType: options.actorType } : {}),
  },
});
