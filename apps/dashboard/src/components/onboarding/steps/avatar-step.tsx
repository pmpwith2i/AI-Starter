import { useCallback, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, LoaderCircle } from "lucide-react";
import { useUploadAvatar } from "@/hooks/profile/use-profile";
import { useAuth } from "@/hooks/use-auth";

interface AvatarStepProps {
  onNext: () => void;
  onBack: () => void;
  currentAvatar?: string | null;
}

export function AvatarStep({ onNext, onBack, currentAvatar }: AvatarStepProps) {
  const { t } = useLingui();
  const { firstName, lastName } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const [preview, setPreview] = useState<string | null>(currentAvatar ?? null);

  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n![0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show preview immediately
      const url = URL.createObjectURL(file);
      setPreview(url);

      uploadAvatar.mutate(file, {
        onError: () => {
          setPreview(currentAvatar ?? null);
        },
      });
    },
    [uploadAvatar, currentAvatar],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Foto profilo</Trans>
        </h2>
        <p className="text-sm text-muted-foreground">
          <Trans>
            Aggiungi una foto per rendere il tuo profilo più personale
          </Trans>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="size-28">
            {preview && <AvatarImage src={preview} alt={t`Avatar`} />}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {uploadAvatar.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadAvatar.isPending}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          <Trans>JPEG, PNG, WebP o GIF. Max 5 MB.</Trans>
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Trans>Indietro</Trans>
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            <Trans>Salta</Trans>
          </Button>
          <Button onClick={onNext} disabled={uploadAvatar.isPending}>
            <Trans>Continua</Trans>
          </Button>
        </div>
      </div>
    </div>
  );
}
