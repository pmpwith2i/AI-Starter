import { useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle } from "lucide-react";
import { useUpdateProfile } from "@/hooks/profile/use-profile";

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
  currentPreferences?: Record<string, unknown> | null;
}

export function PreferencesStep({
  onNext,
  onBack,
  currentPreferences,
}: PreferencesStepProps) {
  const { t } = useLingui();
  const updateProfile = useUpdateProfile();

  const [prefs, setPrefs] = useState({
    emailNotifications:
      (currentPreferences?.emailNotifications as boolean | undefined) ?? true,
    pushNotifications:
      (currentPreferences?.pushNotifications as boolean | undefined) ?? true,
    weeklyReport:
      (currentPreferences?.weeklyReport as boolean | undefined) ?? false,
  });

  const handleSubmit = () => {
    updateProfile.mutate({ preferences: prefs }, { onSuccess: () => onNext() });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Preferenze</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>Personalizza le notifiche e le comunicazioni</Trans>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="pref-email">{t`Notifiche email`}</Label>
            <span className="text-xs text-muted-foreground">
              <Trans>Ricevi aggiornamenti via email</Trans>
            </span>
          </div>
          <Switch
            id="pref-email"
            checked={prefs.emailNotifications}
            onCheckedChange={(v) =>
              setPrefs((p) => ({ ...p, emailNotifications: v }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="pref-push">{t`Notifiche push`}</Label>
            <span className="text-xs text-muted-foreground">
              <Trans>Ricevi notifiche in tempo reale</Trans>
            </span>
          </div>
          <Switch
            id="pref-push"
            checked={prefs.pushNotifications}
            onCheckedChange={(v) =>
              setPrefs((p) => ({ ...p, pushNotifications: v }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="pref-report">{t`Report settimanale`}</Label>
            <span className="text-xs text-muted-foreground">
              <Trans>Ricevi un riepilogo settimanale dei tuoi progressi</Trans>
            </span>
          </div>
          <Switch
            id="pref-report"
            checked={prefs.weeklyReport}
            onCheckedChange={(v) =>
              setPrefs((p) => ({ ...p, weeklyReport: v }))
            }
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Trans>Indietro</Trans>
        </Button>
        <Button onClick={handleSubmit} disabled={updateProfile.isPending}>
          {updateProfile.isPending && <LoaderCircle className="animate-spin" />}
          <Trans>Continua</Trans>
        </Button>
      </div>
    </div>
  );
}
