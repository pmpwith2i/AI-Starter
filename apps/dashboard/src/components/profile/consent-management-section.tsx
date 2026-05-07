import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import { MANDATORY_CONSENT_PURPOSES } from "@repo/server-sdk/schemas";

import {
  useConsentStatus,
  useGrantConsents,
  useWithdrawConsent,
} from "@/hooks/consent/use-consent";
import { buildConsentGrants } from "@/lib/consent/build-consent-grants";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Settings surface for the 6 consent purposes.
 *
 * - Mandatory purposes (terms, privacy, health) are shown read-only with a
 *   pointer to account deletion for revocation.
 * - Optional purposes get a toggle that fires grant or withdraw.
 */
export function ConsentManagementSection() {
  const { t } = useLingui();
  const status = useConsentStatus();
  const grant = useGrantConsents();
  const withdraw = useWithdrawConsent();

  const mandatory = new Set<ConsentPurpose>(MANDATORY_CONSENT_PURPOSES);

  const consentByPurpose = new Map(
    (status.data?.consents ?? []).map(
      (c) => [c.purpose as ConsentPurpose, c] as const,
    ),
  );

  const isBusy = grant.isPending || withdraw.isPending;

  const toggleOptional = async (purpose: ConsentPurpose, next: boolean) => {
    if (!status.data) return;
    try {
      if (next) {
        const grants = buildConsentGrants(
          {
            terms_of_service: false,
            privacy_policy: false,
            health_data_processing: false,
            ai_data_processing: false,
            marketing_communications: false,
            third_party_stripe: false,
            [purpose]: true,
          },
          status.data.currentVersions,
        ).filter((g) => g.purpose === purpose);
        await grant.mutateAsync({ grants });
        toast.success(t`Consenso aggiornato.`);
      } else {
        await withdraw.mutateAsync({ purpose });
        toast.success(t`Consenso revocato.`);
      }
    } catch {
      toast.error(t`Si è verificato un errore. Riprova.`);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Privacy e consensi</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Gestisci i consensi al trattamento dei tuoi dati. Puoi modificare i
            consensi facoltativi in qualsiasi momento.
          </Trans>
        </p>
      </div>

      {status.isLoading ? (
        <p className="text-sm text-muted-foreground">
          <Trans>Caricamento…</Trans>
        </p>
      ) : status.isError || !status.data ? (
        <p className="text-sm text-destructive">
          <Trans>Impossibile caricare i consensi.</Trans>
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {(
            [
              {
                purpose: "terms_of_service" as const,
                title: <Trans>Termini di servizio</Trans>,
              },
              {
                purpose: "privacy_policy" as const,
                title: <Trans>Informativa sulla privacy</Trans>,
              },
              {
                purpose: "health_data_processing" as const,
                title: <Trans>Trattamento dei dati sanitari</Trans>,
              },
              {
                purpose: "ai_data_processing" as const,
                title: <Trans>Elaborazione AI</Trans>,
              },
              {
                purpose: "marketing_communications" as const,
                title: <Trans>Comunicazioni marketing</Trans>,
              },
              {
                purpose: "third_party_stripe" as const,
                title: <Trans>Pagamenti tramite Stripe</Trans>,
              },
            ] satisfies { purpose: ConsentPurpose; title: React.ReactNode }[]
          ).map(({ purpose, title }) => {
            const record = consentByPurpose.get(purpose);
            const granted = record?.granted === true;
            const isMandatory = mandatory.has(purpose);
            return (
              <div
                key={purpose}
                className="flex items-start justify-between gap-4 border-t border-border pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex-1 space-y-1">
                  <Label className="font-medium">{title}</Label>
                  <p className="text-xs text-muted-foreground">
                    {granted ? (
                      <>
                        <Trans>Concesso il</Trans>{" "}
                        {record?.grantedAt
                          ? new Date(record.grantedAt).toLocaleDateString(
                              "it-IT",
                            )
                          : "—"}{" "}
                        · <Trans>versione</Trans> {record?.policyVersion ?? "—"}
                      </>
                    ) : (
                      <Trans>Non concesso</Trans>
                    )}
                  </p>
                  {isMandatory ? (
                    <p className="text-xs text-muted-foreground">
                      <Trans>
                        Per revocare questo consenso è necessario eliminare
                        l&apos;account.
                      </Trans>{" "}
                      <Link
                        to="/app/profile"
                        className="font-medium text-primary hover:underline"
                      >
                        <Trans>Vai alle impostazioni account</Trans>
                      </Link>
                    </p>
                  ) : null}
                </div>
                {isMandatory ? (
                  <span className="text-xs text-muted-foreground">
                    <Trans>Obbligatorio</Trans>
                  </span>
                ) : (
                  <Switch
                    aria-label={t`Attiva o disattiva questo consenso`}
                    checked={granted}
                    disabled={isBusy}
                    onCheckedChange={(v) => void toggleOptional(purpose, v)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
