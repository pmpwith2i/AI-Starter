import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
});

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { redirect } = Route.useSearch();

  const shouldRedirectExternal =
    isAuthenticated && !!redirect && redirect.startsWith("/");

  useEffect(() => {
    if (shouldRedirectExternal) {
      window.location.href = redirect!;
    }
  }, [shouldRedirectExternal, redirect]);

  if (isLoading || shouldRedirectExternal) return null;

  // Already logged in — bounce to the app (or to the deep link they came from).
  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }

  return (
    <AuthLayout>
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          <Trans>Bentornato</Trans>
        </h2>
        <p className="text-muted-foreground">
          <Trans>Accedi al tuo account per continuare</Trans>
        </p>
      </div>

      <LoginForm redirectTo={redirect} />

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          <Trans>Non hai ancora un account?</Trans>{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground hover:underline"
          >
            <Trans>Registrati</Trans>
          </Link>
        </p>
        <p>
          <Link
            to="/forgot-password"
            className="font-medium text-foreground hover:underline"
          >
            <Trans>Password dimenticata?</Trans>
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
