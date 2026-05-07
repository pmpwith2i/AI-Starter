import { useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import { MANDATORY_CONSENT_PURPOSES } from "@repo/server-sdk/schemas";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { canSubmitConsentForm } from "@/lib/consent/can-submit-consent-form";
import { buildConsentGrants } from "@/lib/consent/build-consent-grants";
import type {
  ConsentFormState,
  ConsentPolicyVersions,
} from "@/lib/consent/types";

interface ConsentFormProps {
  /** Current versions returned by /consent/status */
  versions: ConsentPolicyVersions;
  /** Pre-filled state for returning users (e.g. version bump scenario) */
  initialState?: Partial<ConsentFormState>;
  /** Submit handler — receives the grants array ready for POST /consent/grant */
  onSubmit: (
    grants: ReturnType<typeof buildConsentGrants>,
  ) => Promise<void> | void;
  isSubmitting: boolean;
  onLogout?: () => void;
}

const EMPTY: ConsentFormState = {
  terms_of_service: false,
  privacy_policy: false,
  health_data_processing: false,
  ai_data_processing: false,
  marketing_communications: false,
  third_party_stripe: false,
};

export function ConsentForm({
  versions,
  initialState,
  onSubmit,
  isSubmitting,
  onLogout,
}: ConsentFormProps) {
  const { t } = useLingui();
  const [state, setState] = useState<ConsentFormState>({
    ...EMPTY,
    ...initialState,
  });

  const canSubmit = useMemo(
    () => canSubmitConsentForm(state, MANDATORY_CONSENT_PURPOSES),
    [state],
  );

  const toggle = (purpose: ConsentPurpose) => (value: boolean) => {
    setState((prev) => ({ ...prev, [purpose]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    try {
      await onSubmit(buildConsentGrants(state, versions));
    } catch {
      toast.error(t`Si è verificato un errore. Riprova.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          <Trans>Consensi obbligatori</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Per utilizzare la piattaforma è necessario accettare i documenti qui
            sotto. Ogni consenso è separato e può essere verificato sulla
            relativa pagina.
          </Trans>
        </p>

        <ConsentRow
          purpose="terms_of_service"
          checked={state.terms_of_service}
          onChange={toggle("terms_of_service")}
          title={<Trans>Termini di servizio</Trans>}
          description={
            <Trans>
              I accept {`{{PROJECT_NAME}}`}&apos;s terms of service governing
              use of the platform and its services.
            </Trans>
          }
          docLink={{
            to: "/terms-of-service",
            label: <Trans>Leggi i termini</Trans>,
          }}
        />

        <ConsentRow
          purpose="privacy_policy"
          checked={state.privacy_policy}
          onChange={toggle("privacy_policy")}
          title={<Trans>Informativa sulla privacy</Trans>}
          description={
            <Trans>
              Ho letto l&apos;informativa sulla privacy e acconsento al
              trattamento dei miei dati personali come descritto.
            </Trans>
          }
          docLink={{
            to: "/privacy-policy",
            label: <Trans>Leggi l&apos;informativa</Trans>,
          }}
        />

        <ConsentRow
          purpose="health_data_processing"
          checked={state.health_data_processing}
          onChange={toggle("health_data_processing")}
          title={<Trans>Trattamento dei dati sanitari</Trans>}
          description={
            <Trans>
              I explicitly consent to the processing of my health data (special
              categories under GDPR Art. 9) for the provision of
              {` {{PROJECT_NAME}} `} services.
            </Trans>
          }
        />
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-semibold">
          <Trans>Consensi facoltativi</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Puoi attivarli o disattivarli ora e in qualsiasi momento dalle
            impostazioni dell&apos;account.
          </Trans>
        </p>

        <ConsentRow
          purpose="ai_data_processing"
          checked={state.ai_data_processing}
          onChange={toggle("ai_data_processing")}
          title={<Trans>Elaborazione AI</Trans>}
          description={
            <Trans>
              Acconsento all&apos;invio dei miei dati sanitari pseudonimizzati a
              fornitori di intelligenza artificiale (OpenRouter) per le
              funzionalità di chat e generazione di piani nutrizionali.
            </Trans>
          }
          optional
        />

        <ConsentRow
          purpose="marketing_communications"
          checked={state.marketing_communications}
          onChange={toggle("marketing_communications")}
          title={<Trans>Comunicazioni marketing</Trans>}
          description={
            <Trans>
              Acconsento a ricevere newsletter, aggiornamenti su eventi e
              contenuti promozionali via email.
            </Trans>
          }
          optional
        />

        <ConsentRow
          purpose="third_party_stripe"
          checked={state.third_party_stripe}
          onChange={toggle("third_party_stripe")}
          title={<Trans>Pagamenti tramite Stripe</Trans>}
          description={
            <Trans>
              Acconsento alla condivisione dei dati di pagamento necessari con
              Stripe (processore di pagamento) per l&apos;acquisto di corsi ed
              eventi a pagamento.
            </Trans>
          }
          optional
        />
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        {onLogout ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onLogout}
            disabled={isSubmitting}
          >
            <LogOut className="size-4" />
            <Trans>Esci</Trans>
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="sm:min-w-48"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <Trans>Salvataggio…</Trans>
            </>
          ) : (
            <Trans>Continua</Trans>
          )}
        </Button>
      </div>
    </form>
  );
}

interface ConsentRowProps {
  purpose: ConsentPurpose;
  checked: boolean;
  onChange: (value: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  docLink?: { to: string; label: React.ReactNode };
  optional?: boolean;
}

function ConsentRow({
  purpose,
  checked,
  onChange,
  title,
  description,
  docLink,
  optional,
}: ConsentRowProps) {
  const id = `consent-${purpose}`;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        aria-describedby={`${id}-desc`}
      />
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="flex items-center gap-2 font-medium">
          {title}
          {optional ? (
            <span className="text-xs font-normal text-muted-foreground">
              <Trans>(facoltativo)</Trans>
            </span>
          ) : null}
        </Label>
        <p id={`${id}-desc`} className="text-sm text-muted-foreground">
          {description}
        </p>
        {docLink ? (
          <Link
            to={docLink.to}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {docLink.label}
            <ExternalLink className="size-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
