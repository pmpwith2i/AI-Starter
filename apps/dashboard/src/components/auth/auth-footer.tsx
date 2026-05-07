import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";

/**
 * Transparency footer shown on every auth screen (login, signup,
 * verify-email, reset-password, consent). Surfaces Privacy + Terms +
 * Cookie Policy at the moment the user is asked to trust the platform.
 */
export function AuthFooter() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <Link
        to="/privacy-policy"
        className="hover:text-foreground hover:underline"
      >
        <Trans>Privacy</Trans>
      </Link>
      <span aria-hidden>·</span>
      <Link
        to="/terms-of-service"
        className="hover:text-foreground hover:underline"
      >
        <Trans>Termini</Trans>
      </Link>
    </footer>
  );
}
