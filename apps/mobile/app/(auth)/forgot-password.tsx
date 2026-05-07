import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronLeft, Mail } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
    if (!isValidEmail(trimmedEmail) || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Server always returns 200 (anti-enumeration). We trust this and show
      // the same confirmation regardless of whether the email actually exists.
      await forgotPassword({ email: trimmedEmail });
      setSent(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(mapAuthError(err));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting, forgotPassword]);

  const goToReset = useCallback(() => {
    router.push({
      pathname: "/reset-password",
      params: { email: email.trim() },
    });
  }, [router, email]);

  const canSubmit = isValidEmail(email.trim()) && !submitting;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#0d1424]"
    >
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

      <Animated.View style={formStyle} className="flex-1 px-6 pt-8">
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
          Recupero password
        </Text>
        <Text className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
          {sent ? "Controlla la posta." : "Niente panico."}
        </Text>
        <Text className="mt-3 text-base leading-relaxed text-[#f7fbff]/70">
          {sent
            ? `Se ${email.trim()} è registrata, ti abbiamo inviato un codice a 6 cifre per reimpostare la password.`
            : "Inserisci la tua email e ti mandiamo un codice per reimpostare la password."}
        </Text>

        {sent ? (
          <View className="mt-10 flex-row items-center gap-3 rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/5 px-4 py-4">
            <Mail size={22} color="rgba(247,251,255,0.7)" strokeWidth={1.8} />
            <Text className="flex-1 text-sm leading-relaxed text-[#f7fbff]/75">
              Hai 15 minuti per usare il codice. Se non lo trovi, controlla lo
              spam.
            </Text>
          </View>
        ) : (
          <View className="mt-10">
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={submit}
              autoFocus
              placeholder="nome@esempio.it"
            />
          </View>
        )}

        {error ? (
          <View className="mt-5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
            <Text className="text-sm text-red-100">{error}</Text>
          </View>
        ) : null}
      </Animated.View>

      <SafeAreaView edges={["bottom"]} className="px-6 pb-3">
        {sent ? (
          <Pressable
            onPress={goToReset}
            className="mb-4 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Inserisci codice"
          >
            <Text className="text-center text-base font-semibold text-[#0d1424]">
              Inserisci codice
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={!canSubmit}
            onPress={submit}
            className={
              canSubmit
                ? "mb-4 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
                : "mb-4 rounded-full bg-[#f7fbff]/30 py-4"
            }
            accessibilityRole="button"
            accessibilityLabel="Invia codice"
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
                Invia codice
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => router.replace("/login")}
          className="self-center active:opacity-70"
        >
          <Text className="text-sm text-[#f7fbff]/60">Torna al login</Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
