import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useConsentStatus } from "@/hooks/consent/use-consent";
import { useRealtime } from "@/hooks/realtime/use-realtime";
import { useAuth } from "@/hooks/use-auth";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useNavigate,
  useMatchRoute,
} from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

export const Route = createFileRoute("/app")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const {
    isAuthenticated,
    isLoading,
    userId,
    onboardingCompleted,
    emailVerified,
  } = useAuth();
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const isOnboardingRoute = matchRoute({ to: "/app/onboarding", fuzzy: true });

  const consentStatus = useConsentStatus({
    enabled: isAuthenticated && !isLoading,
  });

  // Subscribe to global per-user realtime topics. Add a topic per domain
  // as you scaffold features (the corresponding entity must be in
  // `invalidationMap.ENTITY_KEY_MAP`).
  const globalTopics = useMemo(
    () =>
      userId
        ? [`notifications:user:${userId}`]
        : [],
    [userId],
  );
  useRealtime(globalTopics);

  const loginRedirectSearch = useMemo(() => {
    const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    return { redirect };
  }, []);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    void navigate({
      to: "/login",
      search: loginRedirectSearch,
      replace: true,
    });
  }, [isLoading, isAuthenticated, loginRedirectSearch, navigate]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  if (emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  if (consentStatus.isLoading) return null;
  if (consentStatus.data && consentStatus.data.mandatoryMissing.length > 0) {
    return <Navigate to="/consent" replace />;
  }

  if (!onboardingCompleted && !isOnboardingRoute) {
    return <Navigate to="/app/onboarding" />;
  }

  if (isOnboardingRoute) {
    return <Outlet />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
