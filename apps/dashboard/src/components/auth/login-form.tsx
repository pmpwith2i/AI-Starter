import { useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@repo/server-sdk";

const formatLockoutDuration = (seconds: number): string => {
  if (seconds <= 60) return `${seconds} secondi`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minuto" : "minuti"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${hours === 1 ? "ora" : "ore"}`;
};

const buildLoginErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    if (err.errorCode === "ACCOUNT_LOCKED") {
      const retryAfter = (
        err.details as { retryAfterSeconds?: number } | undefined
      )?.retryAfterSeconds;
      if (typeof retryAfter === "number" && retryAfter > 0) {
        const duration = formatLockoutDuration(retryAfter);
        return `Account temporaneamente bloccato dopo troppi tentativi falliti. Riprova tra ${duration} o richiedi un reset della password.`;
      }
      return `Account temporaneamente bloccato. Riprova più tardi o richiedi un reset della password.`;
    }
    if (err.statusCode === 401) {
      return `Email o password non valide`;
    }
  }
  return `Si è verificato un errore. Riprova.`;
};

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { onboardingCompleted, emailVerified } = await login({
        email,
        password,
      });

      // Unverified email — redirect to verification
      if (!emailVerified) {
        await navigate({ to: "/verify-email" });
        return;
      }

      // Same-origin internal redirect honors the deep link the user came from.
      if (redirectTo && redirectTo.startsWith("/")) {
        window.location.href = redirectTo;
        return;
      }

      if (!onboardingCompleted) {
        await navigate({ to: "/app/onboarding" });
      } else {
        await navigate({ to: "/app" });
      }
    } catch (err) {
      const message = buildLoginErrorMessage(err);
      toast.error(t`${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            autoComplete="current-password"
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
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            <Trans>Accesso in corso...</Trans>
          </>
        ) : (
          <Trans>Accedi</Trans>
        )}
      </Button>
    </form>
  );
}
