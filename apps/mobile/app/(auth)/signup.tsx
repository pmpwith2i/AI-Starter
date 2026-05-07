import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { Check, ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  failingPasswordRules,
  isValidEmail,
  isValidName,
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

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
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
    () => failingPasswordRules(password),
    [password],
  );

  const canSubmit =
    isValidName(firstName) &&
    isValidName(lastName) &&
    isValidEmail(email.trim()) &&
    isValidPassword(password) &&
    termsAccepted &&
    !submitting;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        termsAccepted: true,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // After signup, AuthContext fires "authenticated" with emailVerified=false.
      // (auth)/_layout redirects to /verify-email automatically.
    } catch (err) {
      setError(mapAuthError(err));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, email, password, firstName, lastName, signup]);

  const showPasswordRules = passwordTouched && failingRules.length > 0;

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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={formStyle}>
        <Text className="mt-6 text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/60">
          Crea il tuo account
        </Text>
        <Text className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
          Iniziamo da qui.
        </Text>
        <Text className="mt-3 text-base leading-relaxed text-[#f7fbff]/70">
          Pochi secondi e sei dentro.
        </Text>

        <View className="mt-8 gap-4">
          <View className="flex-row gap-3">
            <TextField
              containerStyle={{ flex: 1 }}
              label="Nome"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => lastNameInputRef.current?.focus()}
              blurOnSubmit={false}
              placeholder="Maria"
              maxLength={50}
            />
            <TextField
              ref={lastNameInputRef}
              containerStyle={{ flex: 1 }}
              label="Cognome"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              blurOnSubmit={false}
              placeholder="Rossi"
              maxLength={50}
            />
          </View>

          <TextField
            ref={emailInputRef}
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

          <View>
            <TextField
              ref={passwordInputRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
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

        <Pressable
          onPress={() => setTermsAccepted((v) => !v)}
          className="mt-6 flex-row items-start gap-3 active:opacity-80"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
          accessibilityLabel="Accetto i Termini di servizio e la Privacy policy"
        >
          <View
            className={
              termsAccepted
                ? "mt-1 h-5 w-5 items-center justify-center rounded-md border-2 border-[#d8e3f4] bg-[#f7fbff]"
                : "mt-1 h-5 w-5 items-center justify-center rounded-md border-2 border-[#d8e3f4]/40"
            }
          >
            {termsAccepted ? (
              <Check size={14} color="#0d1424" strokeWidth={3} />
            ) : null}
          </View>
          <Text className="flex-1 text-sm leading-relaxed text-[#f7fbff]/75">
            Ho letto e accetto i{" "}
            <Text className="font-semibold text-[#f7fbff] underline decoration-white/40">
              Termini di servizio
            </Text>{" "}
            e la{" "}
            <Text className="font-semibold text-[#f7fbff] underline decoration-white/40">
              Privacy policy
            </Text>
            .
          </Text>
        </Pressable>

        {error ? (
          <View className="mt-5 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3">
            <Text className="text-sm text-red-100">{error}</Text>
          </View>
        ) : null}
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
            accessibilityLabel="Crea account"
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
                Crea account
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center gap-1.5">
            <Text className="text-sm text-[#f7fbff]/60">Hai già un account?</Text>
            <Link href="/login" asChild>
              <Pressable className="active:opacity-70">
                <Text className="text-sm font-semibold text-[#f7fbff]">Accedi</Text>
              </Pressable>
            </Link>
          </View>
        </SafeAreaView>
      </KeyboardStickyView>
    </View>
  );
}
