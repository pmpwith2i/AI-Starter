import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { VerificationCodeForm } from "@/components/auth/verification-code-form";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { isAuthenticated, isLoading, emailVerified } = useAuth();

  const [step, setStep] = useState<"form" | "verification">("form");
  const [email, setEmail] = useState("");

  if (isLoading) return null;

  // Already logged in and verified — bounce to the app
  if (isAuthenticated && emailVerified) {
    return <Navigate to="/app" />;
  }

  // Already logged in but not verified — show verification step
  if (isAuthenticated && emailVerified === false && step === "form") {
    return <Navigate to="/verify-email" />;
  }

  return (
    <AuthLayout>
      {step === "form" ? (
        <>
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              <Trans>Crea il tuo account</Trans>
            </h2>
            <p className="text-muted-foreground">
              <Trans>Inizia il tuo percorso di benessere</Trans>
            </p>
          </div>

          <SignupForm
            onVerificationNeeded={(userEmail) => {
              setEmail(userEmail);
              setStep("verification");
            }}
          />

          <p className="text-center text-sm text-muted-foreground">
            <Trans>Hai già un account?</Trans>{" "}
            <Link
              to="/login"
              className="font-medium text-foreground hover:underline"
            >
              <Trans>Accedi</Trans>
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              <Trans>Verifica la tua email</Trans>
            </h2>
          </div>

          <VerificationCodeForm
            email={email}
            onVerified={() => {
              window.location.href = "/app";
            }}
          />
        </>
      )}
    </AuthLayout>
  );
}
