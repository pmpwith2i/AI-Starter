import { useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  useClinicalProfile,
  useUpsertClinicalProfile,
} from "@/hooks/clinical-profile/use-clinical-profile";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"] as const;

export function ClinicalProfileSection() {
  const { t } = useLingui();
  const { data: clinicalProfile, isLoading } = useClinicalProfile();
  const upsertClinicalProfile = useUpsertClinicalProfile();
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    height: "",
    weight: "",
    allergies: "",
    bloodType: "",
  });

  const startEditing = () => {
    setForm({
      height: clinicalProfile?.height?.toString() ?? "",
      weight: clinicalProfile?.weight?.toString() ?? "",
      allergies: clinicalProfile?.allergies ?? "",
      bloodType: clinicalProfile?.bloodType ?? "",
    });
    setIsEditing(true);
  };

  const isPending = upsertClinicalProfile.isPending;

  const handleSave = () => {
    const body = {
      ...(form.height && { height: parseFloat(form.height) }),
      ...(form.weight && { weight: parseFloat(form.weight) }),
      ...(form.allergies && { allergies: form.allergies }),
      ...(form.bloodType && { bloodType: form.bloodType }),
    };

    upsertClinicalProfile.mutate(body, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-sm text-muted-foreground">
            <Trans>Caricamento...</Trans>
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Dati sanitari</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Informazioni sulla tua salute</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pd-height">{t`Altezza (cm)`}</Label>
                <Input
                  id="pd-height"
                  type="number"
                  min={0}
                  value={form.height}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, height: e.target.value }))
                  }
                  placeholder="170"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pd-weight">{t`Peso (kg)`}</Label>
                <Input
                  id="pd-weight"
                  type="number"
                  min={0}
                  value={form.weight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="70"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pd-allergies">{t`Allergie`}</Label>
                <Input
                  id="pd-allergies"
                  value={form.allergies}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, allergies: e.target.value }))
                  }
                  placeholder={t`es. glutine, lattosio`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pd-bloodType">{t`Gruppo sanguigno`}</Label>
                <Select
                  value={form.bloodType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, bloodType: v }))
                  }
                >
                  <SelectTrigger id="pd-bloodType">
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
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isPending}>
                <Trans>Salva</Trans>
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <Trans>Annulla</Trans>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Altezza</Trans>
                </span>
                <span className="text-sm">
                  {clinicalProfile?.height
                    ? `${clinicalProfile.height} cm`
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Peso</Trans>
                </span>
                <span className="text-sm">
                  {clinicalProfile?.weight
                    ? `${clinicalProfile.weight} kg`
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Allergie</Trans>
                </span>
                <span className="text-sm">
                  {clinicalProfile?.allergies ?? "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Gruppo sanguigno</Trans>
                </span>
                <span className="text-sm">
                  {clinicalProfile?.bloodType ?? "—"}
                </span>
              </div>
            </div>
            <div>
              <Button variant="outline" onClick={startEditing}>
                <Trans>
                  {clinicalProfile
                    ? "Modifica dati sanitari"
                    : "Aggiungi dati sanitari"}
                </Trans>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
