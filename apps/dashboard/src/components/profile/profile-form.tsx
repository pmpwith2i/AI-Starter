import { useCallback, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, LoaderCircle } from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "@/hooks/profile/use-profile";

export function ProfileForm() {
  const { t } = useLingui();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
  });

  const startEditing = () => {
    setFormData({
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
      dateOfBirth: profile?.dateOfBirth
        ? profile.dateOfBirth.split("T")[0]
        : "",
    });
    setIsEditing(true);
  };

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || null
    : null;

  const handleSave = () => {
    updateProfile.mutate(
      {
        ...(formData.firstName && { firstName: formData.firstName }),
        ...(formData.lastName && { lastName: formData.lastName }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.dateOfBirth && {
          dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        }),
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadAvatar.mutate(file);
      }
    },
    [uploadAvatar],
  );

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

  if (!profile) return null;

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : profile.email[0].toUpperCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16">
              {profile.avatar && (
                <AvatarImage src={profile.avatar} alt={t`Avatar`} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-avatar-upload"
              className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {uploadAvatar.isPending ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : (
                <Camera className="size-3" />
              )}
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleAvatarChange}
                disabled={uploadAvatar.isPending}
              />
            </label>
          </div>
          <div>
            <CardTitle>{fullName ?? profile.email}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">{t`Nome`}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder={t`Il tuo nome`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">{t`Cognome`}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder={t`Il tuo cognome`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{t`Telefono`}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder={t`Numero di telefono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dob">{t`Data di nascita`}</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
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
                  <Trans>Nome</Trans>
                </span>
                <span className="text-sm">{fullName ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Email</Trans>
                </span>
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Telefono</Trans>
                </span>
                <span className="text-sm">{profile.phone ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  <Trans>Data di nascita</Trans>
                </span>
                <span className="text-sm">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("it-IT")
                    : "—"}
                </span>
              </div>
            </div>
            <div>
              <Button variant="outline" onClick={startEditing}>
                <Trans>Modifica profilo</Trans>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
