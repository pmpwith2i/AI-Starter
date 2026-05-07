import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useClinicalProfile,
  useUpsertClinicalProfile,
} from "@/hooks/clinical-profile/use-clinical-profile";

import { Trans, useLingui } from "@lingui/react/macro";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

interface HealthDataStepProps {
  onNext: () => void;
  onBack: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"] as const;

export function HealthDataStep({ onNext, onBack }: HealthDataStepProps) {
  const { t } = useLingui();
  const { data: clinicalProfile } = useClinicalProfile();
  const upsertClinicalProfile = useUpsertClinicalProfile();

  const [form, setForm] = useState(() => ({
    height: clinicalProfile?.height?.toString() ?? "",
    weight: clinicalProfile?.weight?.toString() ?? "",
    allergies: clinicalProfile?.allergies ?? "",
    bloodType: clinicalProfile?.bloodType ?? "",
  }));

  // React-endorsed "adjusting state during render" pattern using state (not ref)
  // to track the last synced patient data identity.
  const [syncedDataId, setSyncedDataId] = useState<string | undefined>(
    clinicalProfile?.id,
  );
  if (clinicalProfile && clinicalProfile.id !== syncedDataId) {
    setSyncedDataId(clinicalProfile.id);
    setForm({
      height: clinicalProfile.height?.toString() ?? "",
      weight: clinicalProfile.weight?.toString() ?? "",
      allergies: clinicalProfile.allergies ?? "",
      bloodType: clinicalProfile.bloodType ?? "",
    });
  }

  const isPending = upsertClinicalProfile.isPending;

  const handleSubmit = () => {
    const body = {
      ...(form.height && { height: parseFloat(form.height) }),
      ...(form.weight && { weight: parseFloat(form.weight) }),
      ...(form.allergies && { allergies: form.allergies }),
      ...(form.bloodType && { bloodType: form.bloodType }),
    };

    if (clinicalProfile?.id) {
      upsertClinicalProfile.mutate(body, { onSuccess: () => onNext() });
    } else {
      upsertClinicalProfile.mutate(body, { onSuccess: () => onNext() });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Dati sanitari</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Questi dati ci aiutano a personalizzare i tuoi piani nutrizionali
          </Trans>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-height">{t`Altezza (cm)`}</Label>
          <Input
            id="onb-height"
            type="number"
            min={0}
            value={form.height}
            onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
            placeholder="170"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-weight">{t`Peso (kg)`}</Label>
          <Input
            id="onb-weight"
            type="number"
            min={0}
            value={form.weight}
            onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
            placeholder="70"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-allergies">{t`Allergie`}</Label>
          <Input
            id="onb-allergies"
            value={form.allergies}
            onChange={(e) =>
              setForm((p) => ({ ...p, allergies: e.target.value }))
            }
            placeholder={t`es. glutine, lattosio`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-bloodType">{t`Gruppo sanguigno`}</Label>
          <Select
            value={form.bloodType}
            onValueChange={(v) => setForm((p) => ({ ...p, bloodType: v }))}
          >
            <SelectTrigger id="onb-bloodType">
              <SelectValue placeholder={t`Seleziona`} />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt}>
                  {bt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Trans>Indietro</Trans>
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <LoaderCircle className="animate-spin" />}
          <Trans>Continua</Trans>
        </Button>
      </div>
    </div>
  );
}
