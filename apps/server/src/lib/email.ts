import { createHash } from "node:crypto";
import {
  createEmailClient,
  buildVerificationEmail,
  buildPasswordResetEmail,
} from "@repo/email";
import type { EmailClient } from "@repo/email";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { logger } from "#src/logger.js";

/** Hash an email to a short identifier for logs (GDPR: never log PII). */
const hashForLog = (email: string): string =>
  createHash("sha256").update(email).digest("hex").slice(0, 12);

let emailClient: EmailClient | null = null;

const getResendClient = (): EmailClient => {
  if (!emailClient) {
    emailClient = createEmailClient(ENVIRONMENT_VARIABLES.RESEND_API_KEY);
  }
  return emailClient;
};

export const getEmailClient = () => {
  const client = getResendClient();
  const from = ENVIRONMENT_VARIABLES.EMAIL_FROM;

  return {
    sendVerificationEmail: (to: string, firstName: string, code: string) => {
      const { subject, html } = buildVerificationEmail(firstName, code);
      client.sendEmail({ from, to, subject, html }).catch((err: unknown) => {
        logger.error(
          { err, toHash: hashForLog(to) },
          "Failed to send verification email",
        );
      });
    },

    sendPasswordResetEmail: (to: string, firstName: string, code: string) => {
      const { subject, html } = buildPasswordResetEmail(firstName, code);
      client.sendEmail({ from, to, subject, html }).catch((err: unknown) => {
        logger.error(
          { err, toHash: hashForLog(to) },
          "Failed to send password reset email",
        );
      });
    },
  };
};
