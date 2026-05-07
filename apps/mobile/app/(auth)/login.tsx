import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { TextField } from "../../components/forms/text-field";
import { useAuth } from "../../lib/auth/auth-context";
import { mapAuthError } from "../../lib/auth/error-mapper";
import { isValidEmail } from "../../lib/auth/validation";
import { useGenderedText } from "../../lib/gender/use-gender";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const greeting = useGenderedText("Bentornata.", "Bentornato.");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  const enterOpacity = useSharedValue(0);
  const enterY = useSharedValue(20);

  useEffect(() => {
    enterOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    enterY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [enterOpacity, enterY]);

  const formStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  const submit = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail) || password.length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: trimmedEmail, password });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // (auth)/_layout redirects on auth state change.
    } catch (err) {
      setError(mapAuthError(err));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, submitting, login]);

  const canSubmit =
    isValidEmail(email.trim()) && password.length > 0 && !submitting;

  return (
    <View className="flex-1 bg-[#0d1424]">
      <SafeAreaView edges={["top"]} className="px-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="-ml-2 self-start rounded-full p-2 active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel="Indietro"
        >
          <ChevronLeft size={24} color="#f7fbff" />
        </Pressable>
      </SafeAreaView>

      <KeyboardAwareScrollView
        bottomOffset={88}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={formStyle}>
          <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
            Accedi
          </Text>
          <Text className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
            {greeting}
          </Text>
          <Text className="mt-3 text-base leading-relaxed text-[#f7fbff]/70">
            Inserisci email e password per entrare.
          </Text>

          <View className="mt-10 gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
            placeholder="nome@esempio.it"
          />

          <TextField
            ref={passwordInputRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            placeholder="••••••••"
            trailing={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                className="px-1 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Nascondi password" : "Mostra password"
                }
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={20} color="rgba(247,251,255,0.7)" />
                ) : (
                  <Eye size={20} color="rgba(247,251,255,0.7)" />
                )}
              </Pressable>
            }
          />
        </View>

        {error ? (
          <View className="mt-5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
            <Text className="text-sm text-red-100">{error}</Text>
          </View>
        ) : null}

          <Link href="/forgot-password" asChild>
            <Pressable className="mt-5 self-start active:opacity-70">
              <Text className="text-sm font-medium text-[#f7fbff]/70 underline decoration-white/40">
                Password dimenticata?
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <SafeAreaView edges={["bottom"]} className="bg-[#0d1424] px-6 pb-3 pt-2">
          <Pressable
            disabled={!canSubmit}
            onPress={submit}
            className={
              canSubmit
                ? "mb-4 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
                : "mb-4 rounded-full bg-[#f7fbff]/30 py-4"
            }
            accessibilityRole="button"
            accessibilityLabel="Accedi"
          >
            {submitting ? (
              <ActivityIndicator color="#0d1424" />
            ) : (
              <Text
                className={
                  canSubmit
                    ? "text-center text-base font-semibold text-[#0d1424]"
                    : "text-center text-base font-semibold text-[#f7fbff]/50"
                }
              >
                Accedi
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center gap-1.5">
            <Text className="text-sm text-[#f7fbff]/60">Non hai un account?</Text>
            <Link href="/signup" asChild>
              <Pressable className="active:opacity-70">
                <Text className="text-sm font-semibold text-[#f7fbff]">
                  Registrati
                </Text>
              </Pressable>
            </Link>
          </View>
        </SafeAreaView>
      </KeyboardStickyView>
    </View>
  );
}
