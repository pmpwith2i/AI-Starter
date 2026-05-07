import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../../lib/auth/auth-context";

export default function AuthLayout() {
  const { status, user } = useAuth();

  if (status === "bootstrap") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "authenticated") {
    if (user && !user.emailVerified) {
      return <Redirect href="/verify-email" />;
    }
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
