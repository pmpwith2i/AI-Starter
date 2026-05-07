import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sdk } from "@/lib/api/client";
import { ApiError } from "@repo/server-sdk";

interface VerificationCodeFormProps {
  email: string;
  onVerified: () => void;
}

export function VerificationCodeForm({
  email,
  onVerified,
}: VerificationCodeFormProps) {
  const { t } = useLingui();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || code.length !== 6) return;

    setIsSubmitting(true);
    try {
      await sdk.auth.verifyEmail({ code });
      onVerified();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t`Si è verificato un errore. Riprova.`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      const result = await sdk.auth.resendVerificationCode();
      if (result.sent) {
        toast.success(t`Nuovo codice inviato alla tua email.`);
      } else {
        toast.info(result.message);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t`Si è verificato un errore. Riprova.`;
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <p className="text-center text-sm text-muted-foreground">
        <Trans>Abbiamo inviato un codice di verifica a</Trans>{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="verification-code">
          <Trans>Codice di verifica</Trans>
        </Label>
        <Input
          id="verification-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
          }}
          placeholder="000000"
          className="text-center text-lg tracking-[0.5em]"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || code.length !== 6}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            <Trans>Verifica in corso...</Trans>
          </>
        ) : (
          <Trans>Verifica</Trans>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Trans>Non hai ricevuto il codice?</Trans>{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="font-medium text-foreground hover:underline disabled:opacity-50"
        >
          {isResending ? (
            <Trans>Invio in corso...</Trans>
          ) : (
            <Trans>Reinvia codice</Trans>
          )}
        </button>
      </p>
    </form>
  );
}
