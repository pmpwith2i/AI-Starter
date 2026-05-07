import type { FastifyRequest } from "fastify";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import { HttpErrorResponse } from "./error-handler.plugin.js";
import { getConsentStatusCached } from "#src/routes/consent/consent.service.js";

/**
 * Error thrown when a route requires a consent purpose the user has not
 * granted (or has granted under an outdated policy version).
 */
export class ConsentRequiredError extends HttpErrorResponse {
  readonly missing: ConsentPurpose[];
  constructor(missing: ConsentPurpose[]) {
    super(
      "Consent required for this action",
      403,
      ERROR_CODES.CONSENT_REQUIRED,
    );
    this.missing = missing;
  }
}

/**
 * Fastify preHandler factory. Blocks the request if the authenticated user is
 * missing any of the required consent purposes.
 *
 * Usage:
 *   fastify.post("/chat/stream", {
 *     preHandler: [fastify.authenticate, consentGuard(["health_data_processing"])],
 *     ...
 *   });
 *
 * This is purposefully a plain function (not a Fastify decorator) so it can
 * be unit-tested without a running Fastify instance.
 */
export const consentGuard =
  (required: ConsentPurpose[]) =>
  async (request: FastifyRequest): Promise<void> => {
    if (!request.user) {
      throw new HttpErrorResponse(
        "Authentication required",
        401,
        ERROR_CODES.UNAUTHORIZED,
      );
    }
    const status = await getConsentStatusCached(request.user.id);
    const missing = required.filter((p) => status.mandatoryMissing.includes(p));
    if (missing.length > 0) {
      throw new ConsentRequiredError(missing);
    }
  };
