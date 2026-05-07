import { Text, View } from "react-native";
import { useAuth } from "../../lib/auth/auth-context";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const firstName = user?.firstName;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 12 }}>
        Welcome{firstName ? `, ${firstName}` : ""}
      </Text>
      <Text style={{ fontSize: 16, color: "#71717a", marginBottom: 24 }}>
        This is the {`{{PROJECT_NAME}}`} mobile starter screen. Add your domain
        screens via Expo Router.
      </Text>
      <Text
        accessibilityRole="button"
        onPress={() => void logout()}
        style={{
          fontSize: 14,
          color: "#3b82f6",
          marginTop: 24,
        }}
      >
        Sign out
      </Text>
    </View>
  );
}
