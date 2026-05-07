import type { FastifyRequest } from "fastify";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import { HttpErrorResponse } from "./error-handler.plugin.js";

/**
 * Defense-in-depth: the dashboard / mobile clients route unverified users to
 * `/verify-email` themselves, but the server should still reject any
 * authenticated request from a user whose email has not been verified.
 *
 * Apply this hook AFTER `fastify.authenticate` in any module that should be
 * locked behind email verification (clinical-profile, chat, nutrition, meal
 * generation, appointments, background tasks, credit operations, etc.).
 *
 * Routes that MUST stay reachable for unverified users:
 *   - /auth/*           (login, signup, verify-email, resend code, refresh)
 *   - /profile/*        (read/update basic profile, complete-onboarding —
 *                        called only after verification anyway)
 *   - /consent/*        (grant/withdraw consent)
 *   - /legal/*          (privacy policy, terms)
 *   - /account/*        (account deletion, export)
 */
export class EmailNotVerifiedError extends HttpErrorResponse {
  constructor() {
    super("Email verification required", 403, ERROR_CODES.EMAIL_NOT_VERIFIED);
  }
}

export const emailVerifiedGuard = async (
  request: FastifyRequest,
): Promise<void> => {
  if (!request.user) {
    throw new HttpErrorResponse(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }
  if (!request.user.emailVerified) {
    throw new EmailNotVerifiedError();
  }
};
