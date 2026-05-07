import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trans, useLingui } from "@lingui/react/macro";
import { ArrowLeft, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sdk } from "@/lib/api/client";
import { ApiError } from "@repo/server-sdk";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useLingui();
  const navigate = useNavigate();

  // GDPR: the email lives in sessionStorage set by /forgot-password — not in
  // the URL. Read once on mount so back/forward navigation still works.
  const [stashedEmail, setStashedEmail] = useState<string | null>(null);
  useEffect(() => {
    try {
      setStashedEmail(window.sessionStorage.getItem("pwr:email"));
    } catch {
      setStashedEmail(null);
    }
  }, []);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isValid =
    code.length === 6 && newPassword.length >= 6 && passwordsMatch;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !isValid || !stashedEmail) return;

    setIsSubmitting(true);
    try {
      await sdk.auth.resetPassword({
        email: stashedEmail,
        code,
        newPassword,
      });
      try {
        window.sessionStorage.removeItem("pwr:email");
      } catch {
        /* ignore */
      }
      toast.success(t`Password aggiornata con successo.`);
      navigate({ to: "/login" });
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

  if (!stashedEmail) {
    return (
      <AuthLayout>
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Trans>Reimposta password</Trans>
          </h2>
          <p className="text-muted-foreground">
            <Trans>
              Richiedi prima un codice dalla pagina password dimenticata.
            </Trans>
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <Trans>Password dimenticata</Trans>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          <Trans>Reimposta password</Trans>
        </h2>
        <p className="text-muted-foreground">
          <Trans>
            Inserisci il codice ricevuto via email e la tua nuova password.
          </Trans>
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="reset-code">
            <Trans>Codice di verifica</Trans>
          </Label>
          <Input
            id="reset-code"
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

        <div className="space-y-2">
          <Label htmlFor="new-password">
            <Trans>Nuova password</Trans>
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsPasswordVisible((v) => !v)}
              className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent"
              aria-label={
                isPasswordVisible ? t`Nascondi password` : t`Mostra password`
              }
              tabIndex={-1}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <Trans>
              Minimo 6 caratteri, con almeno una maiuscola, una minuscola e un
              numero.
            </Trans>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">
            <Trans>Conferma password</Trans>
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={isConfirmVisible ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsConfirmVisible((v) => !v)}
              className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent"
              aria-label={
                isConfirmVisible ? t`Nascondi password` : t`Mostra password`
              }
              tabIndex={-1}
            >
              {isConfirmVisible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-destructive">
              <Trans>Le password non corrispondono.</Trans>
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              <Trans>Aggiornamento in corso...</Trans>
            </>
          ) : (
            <Trans>Aggiorna password</Trans>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          <Trans>Torna al login</Trans>
        </Link>
      </p>
    </AuthLayout>
  );
}
