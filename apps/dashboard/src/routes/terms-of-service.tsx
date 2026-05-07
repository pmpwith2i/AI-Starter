import { createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";

import { LegalDocument } from "@/components/legal/legal-document";
import { useTerms } from "@/hooks/consent/use-consent";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const { data, isLoading, isError, refetch } = useTerms();

  return (
    <LegalDocument
      title={<Trans>Termini di servizio</Trans>}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
    />
  );
}
