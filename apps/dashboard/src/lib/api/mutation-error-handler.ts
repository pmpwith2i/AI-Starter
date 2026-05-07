import { toast } from "sonner";
import { ApiError } from "@repo/server-sdk";
import { ERROR_MESSAGES } from "@repo/server-sdk/schemas";
import type { ErrorCode } from "@repo/server-sdk/schemas";

const FALLBACK_MESSAGE = "Si è verificato un errore. Riprova più tardi.";

/**
 * Resolves a user-facing error message from an API error.
 * Uses the centralized ERROR_MESSAGES map from the SDK when a known error code is present,
 * otherwise falls back to the server's message or a generic fallback.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.errorCode) {
      const mapped = ERROR_MESSAGES[error.errorCode as ErrorCode];
      if (mapped) return mapped;
    }
    return error.message || FALLBACK_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message || FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
};

/**
 * Global mutation onError handler — shows a Sonner toast with the error message.
 * Use as `onError: handleMutationError` in useMutation options.
 */
export const handleMutationError = (error: unknown): void => {
  toast.error(getErrorMessage(error));
};
