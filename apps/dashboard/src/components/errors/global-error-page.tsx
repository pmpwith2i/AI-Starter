import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorPageProps {
  /** The thrown error — supplied automatically by TanStack Router. */
  error: Error;
  /**
   * Resets the error boundary so the route remounts and the loader runs
   * again. Supplied automatically by TanStack Router for `errorComponent`.
   */
  reset?: () => void;
}

/**
 * Default fallback for any unhandled error that bubbles up from a
 * route loader or component. Wired into the router as
 * `defaultErrorComponent` so it covers every route by default — a route
 * can still override with its own `errorComponent` if it needs custom
 * recovery logic.
 *
 * Distinct from `NotFoundPage`: 404s are caught by `defaultNotFoundComponent`
 * via `throw notFound()`. This page is for 5xx, network failures,
 * unexpected exceptions, and the like.
 */
export function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  const { t } = useLingui();

  // Surface the underlying error to the browser console so devs and
  // support staff can grab the stack trace from a screenshot.
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.error("[GlobalErrorPage]", error);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <Trans>Si è verificato un errore</Trans>
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          <Trans>
            Qualcosa è andato storto durante il caricamento della pagina.
            Riprova oppure torna alla home.
          </Trans>
        </p>
        {error.message && (
          <p className="max-w-md text-xs text-muted-foreground/70 font-mono">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {reset && (
          <Button
            onClick={() => reset()}
            variant="default"
            aria-label={t`Riprova a caricare la pagina`}
          >
            <RefreshCw className="size-4" />
            <Trans>Riprova</Trans>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/app">
            <Home className="size-4" />
            <Trans>Torna alla home</Trans>
          </Link>
        </Button>
      </div>
    </div>
  );
}
