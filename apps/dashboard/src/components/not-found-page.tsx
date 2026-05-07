import { Trans } from "@lingui/react/macro";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotFoundPageProps {
  /**
   * Italian label for the missing resource — drives the title.
   * When omitted (the global 404 case), the title is "Pagina non trovata".
   */
  resourceLabel?: string;
  /**
   * Optional descriptive paragraph. Defaults to a generic "page moved/missing"
   * message that fits the global 404 case.
   */
  description?: React.ReactNode;
  /**
   * Where the back button should land. Defaults to `/app` (dashboard home).
   * Detail routes pass their list page (e.g. `/app/courses`).
   */
  backTo?: LinkProps;
  /**
   * Italian label shown inside the back button. Defaults to "Torna alla home".
   */
  backLabel?: React.ReactNode;
}

/**
 * Reusable not-found page for the dashboard. Wired into the TanStack Router
 * config as `defaultNotFoundComponent` (no props → global 404), and also
 * used by individual detail routes that throw `notFound()` from their
 * loader (props → resource-specific 404).
 *
 * Triggered any time:
 *
 * 1. The browser navigates to a path that does not match any route.
 * 2. A loader calls `throw notFound()` (e.g. when `ensureQueryData` lands
 *    on a 404 ApiError because the resource id no longer exists).
 *
 * Visually it sits inside the standard PageLayout used by every other
 * dashboard page, so the breadcrumbs / sidebar / chrome stay intact and
 * the user keeps their navigational context.
 */
export function NotFoundPage({
  resourceLabel,
  description,
  backTo,
  backLabel,
}: NotFoundPageProps = {}) {
  const isResourceSpecific = !!resourceLabel;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Compass className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isResourceSpecific ? (
            <Trans>{resourceLabel} non trovato</Trans>
          ) : (
            <Trans>Pagina non trovata</Trans>
          )}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {description ?? (
            <Trans>
              La pagina che stai cercando non esiste o è stata spostata.
              Controlla l&apos;indirizzo o torna alla home della dashboard.
            </Trans>
          )}
        </p>
      </div>
      <Button asChild>
        <Link {...(backTo ?? { to: "/app" })}>
          <Home className="size-4" />
          {backLabel ?? <Trans>Torna alla home</Trans>}
        </Link>
      </Button>
    </div>
  );
}
