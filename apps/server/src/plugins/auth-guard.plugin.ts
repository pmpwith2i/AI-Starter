import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { getAccessTokenFromCookies } from "#src/lib/auth-cookies.js";
import { cache, userTag } from "#src/lib/cache.js";
import { logger } from "#src/logger.js";
import { getPrismaClient } from "@repo/db";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { HttpErrorResponse } from "./error-handler.plugin.js";
import { JWT_AUDIENCE, JWT_ISSUER } from "#src/constants/auth.constants.js";

/**
 * Per-user DB lookup used by the auth guard on every authenticated request.
 * Returns `{ id }` for an active user, throws `HttpErrorResponse` for:
 *   - user missing from the DB entirely (possibly a forged JWT)
 *   - user soft-deleted via `DELETE /account`
 *
 * The cached wrapper below (`lookupActiveUserCached`) is what the guard
 * actually calls — direct invocation is only exposed for tests.
 */
const lookupActiveUser = async (
  userId: string,
): Promise<{ id: string; tokenVersion: number; emailVerified: boolean }> => {
  const row = await getPrismaClient().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      deletedAt: true,
      tokenVersion: true,
      emailVerified: true,
    },
  });

  if (!row || row.deletedAt) {
    logger.warn(
      {
        userId,
        userIdType: typeof userId,
        rowFound: Boolean(row),
        softDeleted: row ? Boolean(row.deletedAt) : null,
      },
      "auth-guard: JWT sub does not map to an active user",
    );
    throw new HttpErrorResponse(
      "User not found (auth-guard)",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }
  return {
    id: row.id,
    tokenVersion: row.tokenVersion,
    emailVerified: row.emailVerified,
  };
};

/**
 * Cached user lookup — the hot path of every authenticated request.
 *
 * Tagged `user:${userId}` so account deletion (and any future user-state
 * mutation) can call `invalidateUserCache(userId)` in `apps/server/src/lib/cache.ts`
 * and drop the stale entry in the same breath as the consent cache.
 *
 * 30 s TTL = rete di sicurezza se un invalidate viene dimenticato — accepted
 * worst-case staleness for a deleted user.
 *
 * `singleFlight: true` deduplicates a stampede of concurrent requests for the
 * same user after a cache miss (e.g. cold start, just after invalidation).
 *
 * `cacheErrors: false` (the default) means a missing-user lookup is NOT
 * cached — if the JWT has a valid `sub` that points to a deleted user, the
 * 401 is paid per request. That's intentional: caching an "unauthorized"
 * would prolong denial of a user that may have just been restored (edge
 * case) and provides zero performance benefit on the happy path.
 */
const lookupActiveUserCached = cache.wrap(lookupActiveUser, {
  namespace: "auth_user",
  ttlMs: 30_000,
  keyFn: (userId) => userId,
  tags: (userId) => [userTag(userId)],
  singleFlight: true,
});

/** Extract JWT from cookie (preferred) or Authorization header. */
function extractToken(request: FastifyRequest): string | undefined {
  const cookieToken = getAccessTokenFromCookies(request.headers.cookie);
  if (cookieToken) return cookieToken;

  const header = request.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user: { id: string; emailVerified: boolean } | null;
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    authenticateOptional: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

async function resolveUser(
  userId: string,
  payloadTokenVersion: number,
  request: FastifyRequest,
): Promise<void> {
  const { id, tokenVersion, emailVerified } =
    await lookupActiveUserCached(userId);
  // Bumped tokenVersion (on password reset or refresh-token reuse) invalidates
  // every outstanding access JWT for this user immediately.
  if (tokenVersion !== payloadTokenVersion) {
    throw new HttpErrorResponse(
      "Token version stale",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }
  request.user = { id, emailVerified };
}

export const authGuardPlugin = fp((fastify, _opts, done) => {
  fastify.decorateRequest("user", null);
  const doAuthentication = async (
    request: FastifyRequest,
    args: {
      isOptional?: boolean;
    },
  ) => {
    const token = extractToken(request);
    if (!token) {
      if (args.isOptional) {
        request.user = null;
        return;
      } else {
        throw new HttpErrorResponse(
          "Missing or invalid authorization",
          401,
          ERROR_CODES.UNAUTHORIZED,
        );
      }
    }

    try {
      const payload = jwt.verify(token, ENVIRONMENT_VARIABLES.JWT_SECRET_KEY, {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as jwt.JwtPayload & { tokenVersion?: unknown };

      if (!payload.sub || typeof payload.tokenVersion !== "number") {
        throw new HttpErrorResponse(
          "Invalid token payload",
          401,
          ERROR_CODES.UNAUTHORIZED,
        );
      }

      await resolveUser(payload.sub, payload.tokenVersion, request);
    } catch (error) {
      if (args.isOptional) {
        request.user = null;
        return;
      }

      if (error instanceof HttpErrorResponse) throw error;
      throw new HttpErrorResponse(
        "Invalid or expired token",
        401,
        ERROR_CODES.UNAUTHORIZED,
      );
    }
  };
  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    await doAuthentication(request, { isOptional: false });
  });

  fastify.decorate("authenticateOptional", async (request: FastifyRequest) => {
    await doAuthentication(request, { isOptional: true });
  });

  done();
});
