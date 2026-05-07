import { ApiError } from "@repo/server-sdk";

/**
 * Unified mapper from SDK `ApiError` (or unknown) to a user-facing Italian
 * message for every auth flow (login, signup, verify, forgot, reset).
 *
 * Returning a single string keeps the call sites simple — render in an
 * inline alert above the submit button. For more granular UI (e.g. inline
 * field errors) the caller can branch on `err.errorCode` directly.
 */
export function mapAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.errorCode) {
      // Common
      case "VALIDATION_ERROR":
        return "Dati non validi. Controlla i campi.";
      case "RATE_LIMITED":
        return "Troppe richieste. Riprova tra qualche minuto.";

      // Login
      case "INVALID_CREDENTIALS":
        return "Email o password errati.";
      case "ACCOUNT_LOCKED": {
        const retry = err.details?.retryAfterSeconds;
        if (typeof retry === "number") {
          const mins = Math.ceil(retry / 60);
          const unit = mins === 1 ? "minuto" : "minuti";
          return `Account bloccato. Riprova tra ${mins} ${unit}.`;
        }
        return "Account temporaneamente bloccato. Riprova più tardi.";
      }

      // Signup
      case "EMAIL_ALREADY_EXISTS":
        return "Esiste già un account con questa email. Prova ad accedere.";

      // Verify email
      case "VERIFICATION_CODE_EXPIRED":
        return "Codice scaduto. Richiedi un nuovo codice.";
      case "VERIFICATION_CODE_INVALID":
        return "Codice non valido. Riprova.";
      case "VERIFICATION_CODE_INVALIDATED":
        return "Troppi tentativi. Richiedi un nuovo codice.";
      case "ALREADY_VERIFIED":
        return "Email già verificata.";

      // Password reset
      case "RESET_CODE_EXPIRED":
        return "Codice scaduto. Richiedi un nuovo codice.";
      case "RESET_CODE_INVALID":
        return "Codice non valido. Riprova.";
      case "RESET_CODE_INVALIDATED":
        return "Troppi tentativi. Richiedi un nuovo codice.";

      default:
        return err.message || "Errore inaspettato. Riprova.";
    }
  }
  return "Connessione assente. Controlla la rete e riprova.";
}
