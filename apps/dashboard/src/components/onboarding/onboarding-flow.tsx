import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProfile, useCompleteOnboarding } from "@/hooks/profile/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { PersonalInfoStep } from "./steps/personal-info-step";
import { HealthDataStep } from "./steps/health-data-step";
import { AvatarStep } from "./steps/avatar-step";
import { PreferencesStep } from "./steps/preferences-step";
import { CompleteStep } from "./steps/complete-step";
import { Loader } from "../ui/loader";

const TOTAL_STEPS = 5;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const completeOnboarding = useCompleteOnboarding();
  const { setOnboardingCompleted } = useAuth();

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const handleComplete = () => {
    completeOnboarding.mutate(undefined, {
      onSuccess: () => {
        setOnboardingCompleted(true);
        setStep(4);
      },
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            <Trans>Benvenuto su Oncologo.it</Trans>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>Configura il tuo profilo in pochi passi</Trans>
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  <Trans>
                    Passo {step + 1} di {TOTAL_STEPS}
                  </Trans>
                </CardTitle>
                <CardDescription>
                  {step === 0 && <Trans>Informazioni personali</Trans>}
                  {step === 1 && <Trans>Dati sanitari</Trans>}
                  {step === 2 && <Trans>Foto profilo</Trans>}
                  {step === 3 && <Trans>Preferenze</Trans>}
                  {step === 4 && <Trans>Completato</Trans>}
                </CardDescription>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <PersonalInfoStep
                onNext={() => setStep(1)}
                defaultValues={{
                  firstName: profile?.firstName,
                  lastName: profile?.lastName,
                  phone: profile?.phone,
                  dateOfBirth: profile?.dateOfBirth,
                }}
              />
            )}
            {step === 1 && (
              <HealthDataStep
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <AvatarStep
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                currentAvatar={profile?.avatar}
              />
            )}
            {step === 3 && (
              <PreferencesStep
                onNext={handleComplete}
                onBack={() => setStep(2)}
                currentPreferences={
                  profile?.preferences as Record<string, unknown> | null
                }
              />
            )}
            {step === 4 && <CompleteStep />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
