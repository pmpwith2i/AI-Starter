import { createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";

import { LegalDocument } from "@/components/legal/legal-document";
import { usePrivacyPolicy } from "@/hooks/consent/use-consent";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { data, isLoading, isError, refetch } = usePrivacyPolicy();

  return (
    <LegalDocument
      title={<Trans>Informativa sulla privacy</Trans>}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
    />
  );
}
