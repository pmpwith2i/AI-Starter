import { Redirect, Stack, useSegments } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { useRealtime } from "../../hooks/realtime/use-realtime";
import { useAuth } from "../../lib/auth/auth-context";

export default function AppLayout() {
  const { status, user } = useAuth();
  const segments = useSegments();
  const isOnboardingRoute = (segments as string[]).includes("onboarding");

  // Global realtime subscriptions — every authenticated route gets these.
  // Per-screen topics (e.g. course:enrollment scoped to the player) are
  // layered on top via additional useRealtime() calls inside the screen.
  //
  // User-scoped:  notification, task, credits, nutrition, purchase, appointment
  // Public:       event, bundle, speaker  (admin can publish/edit anything,
  //               we want the catalog to stay live)
  const globalTopics = useMemo(
    () =>
      user
        ? [
            `notification:user:${user.userId}`,
            `task:user:${user.userId}`,
            `credits:user:${user.userId}`,
            `nutrition:user:${user.userId}`,
            `purchase:user:${user.userId}`,
            `appointment:user:${user.userId}`,
            `event:public:all`,
            `bundle:public:all`,
            `speaker:public:all`,
          ]
        : [],
    [user],
  );
  useRealtime(globalTopics);

  if (status === "bootstrap") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "anonymous") {
    return <Redirect href="/welcome" />;
  }

  // Defense-in-depth: server already gates protected endpoints with
  // emailVerifiedGuard, but routing the user away keeps UX clean.
  if (user && !user.emailVerified) {
    return <Redirect href="/verify-email" />;
  }

  // Force onboarding for users that haven't completed it yet — except when
  // they're already on the onboarding screen (otherwise we'd loop). Verified
  // users that revisit /onboarding from settings still pass through this
  // layout, but the `isOnboardingRoute` exception keeps them on the wizard.
  if (user && !user.onboardingCompleted && !isOnboardingRoute) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    />
  );
}
