import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { TextField } from "../../components/forms/text-field";
import { useAuth } from "../../lib/auth/auth-context";
import { mapAuthError } from "../../lib/auth/error-mapper";
import {
  failingPasswordRules,
  isValidCode6,
  isValidEmail,
  isValidPassword,
  PASSWORD_RULE_LABEL,
  type PasswordRule,
} from "../../lib/auth/validation";

const ALL_PASSWORD_RULES: PasswordRule[] = [
  "minLength",
  "uppercase",
  "lowercase",
  "digit",
];

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const codeInputRef = useRef<TextInput>(null);
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

  const failingRules = useMemo(
    () => failingPasswordRules(newPassword),
    [newPassword],
  );

  const canSubmit =
    isValidEmail(email.trim()) &&
    isValidCode6(code) &&
    isValidPassword(newPassword) &&
    !submitting;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });
      setDone(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(mapAuthError(err));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, email, code, newPassword, resetPassword]);

  const showPasswordRules = passwordTouched && failingRules.length > 0;

  if (done) {
    return (
      <View className="flex-1 bg-[#0d1424]">
        <SafeAreaView edges={["top", "bottom"]} className="flex-1 px-6">
          <View className="flex-1 items-center justify-center">
            <Text className="mb-3 text-center text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
              Password aggiornata
            </Text>
            <Text className="text-center text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
              Tutto a posto.
            </Text>
            <Text className="mt-4 max-w-[88%] text-center text-base leading-relaxed text-[#f7fbff]/70">
              Adesso puoi accedere con la nuova password.
            </Text>
          </View>
          <Pressable
            onPress={() => router.replace("/login")}
            className="mb-3 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Vai al login"
          >
            <Text className="text-center text-base font-semibold text-[#0d1424]">
              Vai al login
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

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

      <Animated.ScrollView
        style={formStyle}
        className="flex-1 px-6"
        contentContainerClassName="pb-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-6 text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
          Reimposta password
        </Text>
        <Text className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
          Quasi fatta.
        </Text>
        <Text className="mt-3 text-base leading-relaxed text-[#f7fbff]/70">
          Inserisci il codice che hai ricevuto via email e scegli una nuova
          password.
        </Text>

        <View className="mt-8 gap-4">
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
            onSubmitEditing={() => codeInputRef.current?.focus()}
            blurOnSubmit={false}
            placeholder="nome@esempio.it"
          />

          <TextField
            ref={codeInputRef}
            label="Codice"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
            placeholder="000000"
            hint="6 cifre, valide per 15 minuti."
          />

          <View>
            <TextField
              ref={passwordInputRef}
              label="Nuova password"
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => setPasswordTouched(true)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
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
            {showPasswordRules ? (
              <View className="mt-2 gap-1">
                {ALL_PASSWORD_RULES.map((rule) => {
                  const failed = failingRules.includes(rule);
                  return (
                    <View key={rule} className="flex-row items-center gap-1.5">
                      <View
                        className={
                          failed
                            ? "h-1.5 w-1.5 rounded-full bg-[#f7fbff]/30"
                            : "h-1.5 w-1.5 rounded-full bg-[#7ddac2]"
                        }
                      />
                      <Text
                        className={
                          failed
                            ? "text-xs text-[#f7fbff]/50"
                            : "text-xs text-[#f7fbff]/80"
                        }
                      >
                        {PASSWORD_RULE_LABEL[rule]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        {error ? (
          <View className="mt-5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
            <Text className="text-sm text-red-100">{error}</Text>
          </View>
        ) : null}
      </Animated.ScrollView>

      <SafeAreaView edges={["bottom"]} className="px-6 pb-3">
        <Pressable
          disabled={!canSubmit}
          onPress={submit}
          className={
            canSubmit
              ? "rounded-full bg-[#f7fbff] py-4 active:opacity-90"
              : "rounded-full bg-[#f7fbff]/30 py-4"
          }
          accessibilityRole="button"
          accessibilityLabel="Conferma"
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
              Conferma
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
