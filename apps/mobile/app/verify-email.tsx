import * as Haptics from "expo-haptics";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../lib/auth/auth-context";
import { mapAuthError } from "../lib/auth/error-mapper";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return email;
  const masked = `${local[0]}${"•".repeat(Math.max(local.length - 2, 1))}${local.slice(-1)}`;
  return `${masked}@${domain}`;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { status, user, verifyEmail, resendVerificationCode, logout } =
    useAuth();

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const inputRef = useRef<TextInput>(null);

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

  // Cooldown ticker for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = useCallback(
    async (codeToSubmit: string) => {
      if (codeToSubmit.length !== CODE_LENGTH || submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        const verified = await verifyEmail({ code: codeToSubmit });
        if (verified) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          // user.emailVerified is now true — the screen guard will redirect.
        }
      } catch (err) {
        setError(mapAuthError(err));
        setCode("");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setSubmitting(false);
      }
    },
    [verifyEmail, submitting],
  );

  const handleCodeChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
      setCode(digits);
      setError(null);
      if (digits.length === CODE_LENGTH) {
        void submit(digits);
      }
    },
    [submit],
  );

  const onResend = useCallback(async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendVerificationCode();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(mapAuthError(err));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setResending(false);
    }
  }, [cooldown, resending, resendVerificationCode]);

  const onSwitchAccount = useCallback(async () => {
    await logout();
    router.replace("/welcome");
  }, [logout, router]);

  // Gates
  if (status === "bootstrap") {
    return (
      <View className="flex-1 items-center justify-center bg-[#0d1424]">
        <ActivityIndicator color="#f7fbff" />
      </View>
    );
  }
  if (status === "anonymous") {
    return <Redirect href="/welcome" />;
  }
  if (user?.emailVerified) {
    return <Redirect href="/" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#0d1424]"
    >
      <SafeAreaView edges={["top"]} className="px-6 pt-2">
        <View className="h-10" />
      </SafeAreaView>

      <Animated.View style={formStyle} className="flex-1 px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
          Verifica email
        </Text>
        <Text className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
          Controlla la casella.
        </Text>
        <Text className="mt-3 text-base leading-relaxed text-[#f7fbff]/70">
          {user?.email
            ? `Abbiamo inviato un codice a ${maskEmail(user.email)}.`
            : "Abbiamo inviato un codice alla tua email."}
        </Text>

        <View className="mt-10 items-center">
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row gap-2"
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <CodeCell
                key={i}
                char={code[i]}
                active={code.length === i && !submitting}
              />
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            style={{
              position: "absolute",
              width: "100%",
              height: 60,
              opacity: 0.001,
            }}
          />
        </View>

        {error ? (
          <View className="mt-6 self-center rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
            <Text className="text-sm text-red-100">{error}</Text>
          </View>
        ) : null}

        {submitting ? (
          <View className="mt-6 flex-row items-center justify-center gap-2">
            <ActivityIndicator color="#f7fbff" />
            <Text className="text-sm text-[#f7fbff]/70">
              Verifica in corso…
            </Text>
          </View>
        ) : null}

        <View className="mt-10 items-center">
          <Text className="text-sm text-[#f7fbff]/60">
            Non hai ricevuto il codice?
          </Text>
          <Pressable
            onPress={() => void onResend()}
            disabled={cooldown > 0 || resending}
            className="mt-2 active:opacity-70"
          >
            <Text
              className={
                cooldown > 0 || resending
                  ? "text-sm font-semibold text-[#f7fbff]/30"
                  : "text-sm font-semibold text-[#f7fbff] underline decoration-white/40"
              }
            >
              {cooldown > 0 ? `Reinvia tra ${cooldown}s` : "Reinvia codice"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <SafeAreaView edges={["bottom"]} className="px-6 pb-3">
        <Pressable
          onPress={() => void onSwitchAccount()}
          className="self-center active:opacity-70"
        >
          <Text className="text-sm text-[#f7fbff]/50 underline decoration-white/30">
            Cambia account
          </Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function CodeCell({
  char,
  active,
}: {
  char: string | undefined;
  active: boolean;
}) {
  const filled = !!char;
  let style: string;
  if (filled) {
    style =
      "h-16 w-12 items-center justify-center rounded-2xl border-2 border-[#d8e3f4] bg-[#f7fbff]";
  } else if (active) {
    style =
      "h-16 w-12 items-center justify-center rounded-2xl border-2 border-[#d8e3f4]";
  } else {
    style =
      "h-16 w-12 items-center justify-center rounded-2xl border-2 border-[#d8e3f4]/20";
  }
  return (
    <View className={style}>
      <Text
        className={
          filled
            ? "text-2xl font-bold text-[#0d1424]"
            : "text-2xl font-bold text-[#f7fbff]"
        }
      >
        {char ?? ""}
      </Text>
    </View>
  );
}
