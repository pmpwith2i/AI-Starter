import { createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { ProfileForm } from "@/components/profile/profile-form";
import { ClinicalProfileSection } from "@/components/profile/clinical-profile-section";
import { ConsentManagementSection } from "@/components/profile/consent-management-section";

export const Route = createFileRoute("/app/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          <Trans>Profilo</Trans>
        </h1>
        <p className="text-sm text-muted-foreground">
          <Trans>Gestisci le tue informazioni personali</Trans>
        </p>
      </div>
      <ProfileForm />
      <ClinicalProfileSection />
      <ConsentManagementSection />
    </div>
  );
}
