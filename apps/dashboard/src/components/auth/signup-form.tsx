import { useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@repo/server-sdk";
import { ERROR_CODES } from "@repo/server-sdk/schemas";

interface SignupFormProps {
  onVerificationNeeded: (email: string) => void;
}

export function SignupForm({ onVerificationNeeded }: SignupFormProps) {
  const { t } = useLingui();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !termsAccepted) return;

    setIsSubmitting(true);
    try {
      await signup({
        email,
        password,
        firstName,
        lastName,
        termsAccepted: true,
      });
      onVerificationNeeded(email);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errorCode === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
          toast.error(t`Esiste già un account con questa email.`);
        } else {
          toast.error(err.message ?? t`Si è verificato un errore. Riprova.`);
        }
      } else {
        toast.error(t`Si è verificato un errore. Riprova.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            <Trans>Nome</Trans>
          </Label>
          <Input
            id="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t`Mario`}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            <Trans>Cognome</Trans>
          </Label>
          <Input
            id="lastName"
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t`Rossi`}
            disabled={isSubmitting}
          />
        </div>
      </div>

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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          <Trans>Password</Trans>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={isVisible ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible((v) => !v)}
            className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent"
            aria-label={isVisible ? t`Nascondi password` : t`Mostra password`}
            tabIndex={-1}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <Trans>
            Minimo 6 caratteri, con almeno una maiuscola, una minuscola e un
            numero.
          </Trans>
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
        <Checkbox
          id="terms-accepted"
          checked={termsAccepted}
          onCheckedChange={(v) => setTermsAccepted(v === true)}
          aria-describedby="terms-accepted-desc"
        />
        <Label
          htmlFor="terms-accepted"
          id="terms-accepted-desc"
          className="text-sm font-normal leading-snug text-muted-foreground"
        >
          <Trans>
            Accetto i{" "}
            <Link
              to="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Termini di Servizio
            </Link>{" "}
            e l&apos;
            <Link
              to="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Informativa sulla Privacy
            </Link>
            .
          </Trans>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !termsAccepted}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            <Trans>Registrazione in corso...</Trans>
          </>
        ) : (
          <Trans>Crea account</Trans>
        )}
      </Button>
    </form>
  );
}
