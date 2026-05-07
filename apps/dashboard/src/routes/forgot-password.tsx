import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trans, useLingui } from "@lingui/react/macro";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sdk } from "@/lib/api/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useLingui();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sdk.auth.forgotPassword({ email });
      toast.success(
        t`Se l'indirizzo è associato a un account, riceverai un codice via email.`,
      );
      // GDPR: keep the email out of URL history / referrer / screenshots.
      // sessionStorage is per-tab and cleared on close.
      try {
        window.sessionStorage.setItem("pwr:email", email);
      } catch {
        /* private mode */
      }
      navigate({ to: "/reset-password" });
    } catch {
      toast.error(t`Si è verificato un errore. Riprova.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          <Trans>Password dimenticata</Trans>
        </h2>
        <p className="text-muted-foreground">
          <Trans>
            Inserisci la tua email e ti invieremo un codice per reimpostare la
            password.
          </Trans>
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">
            <Trans>Email</Trans>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t`nome@esempio.it`}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              <Trans>Invio in corso...</Trans>
            </>
          ) : (
            <Trans>Invia codice</Trans>
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
