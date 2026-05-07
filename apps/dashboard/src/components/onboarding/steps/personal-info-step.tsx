import { useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { useUpdateProfile } from "@/hooks/profile/use-profile";

interface PersonalInfoStepProps {
  onNext: () => void;
  defaultValues?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
  };
}

export function PersonalInfoStep({
  onNext,
  defaultValues,
}: PersonalInfoStepProps) {
  const { t } = useLingui();
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    phone: defaultValues?.phone ?? "",
    dateOfBirth: defaultValues?.dateOfBirth
      ? defaultValues.dateOfBirth.split("T")[0]
      : "",
  });

  const handleSubmit = () => {
    updateProfile.mutate(
      {
        ...(form.firstName && { firstName: form.firstName }),
        ...(form.lastName && { lastName: form.lastName }),
        ...(form.phone && { phone: form.phone }),
        ...(form.dateOfBirth && {
          dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        }),
      },
      { onSuccess: () => onNext() },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Informazioni personali</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Inserisci i tuoi dati per personalizzare l&apos;esperienza
          </Trans>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-firstName">{t`Nome`}</Label>
          <Input
            id="onb-firstName"
            value={form.firstName}
            onChange={(e) =>
              setForm((p) => ({ ...p, firstName: e.target.value }))
            }
            placeholder={t`Il tuo nome`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-lastName">{t`Cognome`}</Label>
          <Input
            id="onb-lastName"
            value={form.lastName}
            onChange={(e) =>
              setForm((p) => ({ ...p, lastName: e.target.value }))
            }
            placeholder={t`Il tuo cognome`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-phone">{t`Telefono`}</Label>
          <Input
            id="onb-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder={t`Numero di telefono`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onb-dob">{t`Data di nascita`}</Label>
          <Input
            id="onb-dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) =>
              setForm((p) => ({ ...p, dateOfBirth: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit} disabled={updateProfile.isPending}>
          {updateProfile.isPending && <LoaderCircle className="animate-spin" />}
          <Trans>Continua</Trans>
        </Button>
      </div>
    </div>
  );
}
