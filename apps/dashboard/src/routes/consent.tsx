import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Trans, useLingui } from "@lingui/react/macro";
import { toast } from "sonner";
import { useMemo } from "react";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";

import { useAuth } from "@/hooks/use-auth";
import {
  useConsentStatus,
  useGrantConsents,
} from "@/hooks/consent/use-consent";
import { ConsentForm } from "@/components/consent/consent-form";

export const Route = createFileRoute("/consent")({
  component: ConsentPage,
});

function ConsentPage() {
  const { t } = useLingui();
  const { isAuthenticated, isLoading, emailVerified, logout } = useAuth();
  const navigate = useNavigate();

  const status = useConsentStatus();
  const grant = useGrantConsents();

  // Pre-fill with existing consents (returning user with a policy-version bump).
  const initialState = useMemo(() => {
    if (!status.data) return undefined;
    const pairs: [ConsentPurpose, boolean][] = status.data.consents.map((c) => [
      c.purpose as ConsentPurpose,
      c.granted,
    ]);
    return Object.fromEntries(pairs) as Partial<
      Record<ConsentPurpose, boolean>
    >;
  }, [status.data]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Must verify email first (same ordering as the /app gate).
  if (emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  // Already has every mandatory consent — nothing to do here.
  if (status.data && status.data.mandatoryMissing.length === 0) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-dvh bg-muted/20">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            <Trans>I tuoi consensi</Trans>
          </h1>
          <p className="text-muted-foreground">
            <Trans>
              Prima di usare la piattaforma dobbiamo registrare i tuoi consensi
              al trattamento dei dati. Ogni scelta è tracciata in un registro
              immutabile e può essere modificata in qualsiasi momento.
            </Trans>
          </p>
        </header>

        {status.isLoading ? (
          <p className="text-sm text-muted-foreground">
            <Trans>Caricamento…</Trans>
          </p>
        ) : status.isError || !status.data ? (
          <div className="space-y-3">
            <p className="text-destructive">
              <Trans>
                Impossibile recuperare lo stato dei tuoi consensi. Riprova.
              </Trans>
            </p>
            <button
              type="button"
              onClick={() => void status.refetch()}
              className="text-sm font-medium text-primary hover:underline"
            >
              <Trans>Riprova</Trans>
            </button>
          </div>
        ) : (
          <ConsentForm
            versions={status.data.currentVersions}
            initialState={initialState}
            isSubmitting={grant.isPending}
            onSubmit={async (grants) => {
              await grant.mutateAsync({ grants });
              toast.success(t`Consensi salvati.`);
              navigate({ to: "/app" });
            }}
            onLogout={() => {
              void logout();
              navigate({ to: "/login" });
            }}
          />
        )}
      </div>
    </div>
  );
}
