import { useEffect, useRef } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { VerificationCodeForm } from "@/components/auth/verification-code-form";
import { Button } from "@/components/ui/button";
import { sdk } from "@/lib/api/client";
import { maskEmail } from "@/lib/auth/mask-email";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const {
    isAuthenticated,
    isLoading,
    email,
    emailVerified,
    logout,
    setEmailVerified,
  } = useAuth();
  const navigate = useNavigate();
  const didSendRef = useRef(false);

  // Auto-send verification code on mount
  useEffect(() => {
    if (didSendRef.current || !isAuthenticated || emailVerified !== false)
      return;
    didSendRef.current = true;
    sdk.auth.resendVerificationCode().catch(() => {
      // Silently ignore — user can manually resend
    });
  }, [isAuthenticated, emailVerified]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Already verified — go to app
  if (emailVerified) {
    return <Navigate to="/app" replace />;
  }

  const maskedEmail = email ? maskEmail(email) : "";

  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          <Trans>Verifica la tua email</Trans>
        </h2>
        <p className="text-muted-foreground">
          <Trans>
            Per continuare, inserisci il codice che ti abbiamo inviato.
          </Trans>
        </p>
      </div>

      <VerificationCodeForm
        email={maskedEmail}
        onVerified={() => {
          setEmailVerified(true);
          navigate({ to: "/app" });
        }}
      />

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="mr-2 size-4" />
          <Trans>Esci</Trans>
        </Button>
      </div>
    </AuthLayout>
  );
}
