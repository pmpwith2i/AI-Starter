import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  Activity as ActivityIcon,
  Apple,
  Bell,
  CalendarDays,
  ChevronLeft,
  Compass,
  HeartPulse,
  Minus,
  MountainSnow,
  Plus,
  Ruler,
  ScanFace,
  ShieldAlert,
  Sparkles,
  Target,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { sdk } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/auth-context";

// ---------------------------------------------------------------------------
// Types & state
// ---------------------------------------------------------------------------

type Sex = "f" | "m" | "other";
type ClinicalStatus =
  | "in_treatment"
  | "follow_up"
  | "remission"
  | "prevention"
  | "prefer_not_to_say";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
type DietPreference = "omnivore" | "pescetarian" | "vegetarian" | "vegan";
type BreakfastPreference = "sweet" | "savory";
type Goal =
  | "nutrition"
  | "specialists"
  | "courses"
  | "tracking"
  | "community";
type PermissionDecision = "granted" | "skipped";

type OnboardingState = {
  goals: Goal[];
  clinicalStatus: ClinicalStatus | null;
  sex: Sex | null;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel | null;
  diet: DietPreference | null;
  breakfast: BreakfastPreference | null;
  allergies: string[];
  noAllergies: boolean;
  notifications: PermissionDecision | null;
  biometric: PermissionDecision | null;
};

const INITIAL_STATE: OnboardingState = {
  goals: [],
  clinicalStatus: null,
  sex: null,
  age: 35,
  heightCm: 165,
  weightKg: 65,
  activity: null,
  diet: null,
  breakfast: null,
  allergies: [],
  noAllergies: false,
  notifications: null,
  biometric: null,
};

// ---------------------------------------------------------------------------
// Step indices and palette
// ---------------------------------------------------------------------------

const STEP = {
  GREETING: 0,
  GOALS: 1,
  CLINICAL: 2,
  SEX: 3,
  AGE: 4,
  BODY: 5,
  WOW_1: 6,
  ACTIVITY: 7,
  DIET: 8,
  ALLERGIES: 9,
  WOW_2: 10,
  NOTIFICATIONS: 11,
  FACE_ID: 12,
  DONE: 13,
} as const;

const STEP_COLORS = [
  "#0d1424", // 0 greeting
  "#101a2b", // 1 goals
  "#17243a", // 2 clinical
  "#14324a", // 3 sex
  "#182f62", // 4 age
  "#123752", // 5 body
  "#443820", // 6 wow1
  "#3b3426", // 7 activity
  "#422b2b", // 8 diet
  "#2b3040", // 9 allergies
  "#2b2548", // 10 wow2
  "#182f62", // 11 notifications
  "#191f45", // 12 face id
  "#251d44", // 13 done
] as const;

const TOTAL_STEPS = STEP_COLORS.length;
const WOW_STEPS = new Set<number>([STEP.WOW_1, STEP.WOW_2]);
const PERMISSION_STEPS = new Set<number>([STEP.NOTIFICATIONS, STEP.FACE_ID]);

// ---------------------------------------------------------------------------
// Server <-> wizard mapping
// ---------------------------------------------------------------------------

type ClinicalProfileResponse = Awaited<ReturnType<typeof sdk.clinicalProfile.get>>;
type ClinicalProfileInput = Parameters<typeof sdk.clinicalProfile.upsert>[0];

/** Map server clinical profile → onboarding state for hydration. */
function profileToOnboardingState(
  p: ClinicalProfileResponse,
): Partial<OnboardingState> {
  const allergiesString = p.allergies;
  const allergies =
    typeof allergiesString === "string" && allergiesString.length > 0
      ? allergiesString
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const noAllergies = allergiesString === "";
  return {
    sex: (p.sex as Sex | null) ?? null,
    age: p.age ?? INITIAL_STATE.age,
    heightCm: p.height ?? INITIAL_STATE.heightCm,
    weightKg: p.weight ?? INITIAL_STATE.weightKg,
    activity: (p.activityLevel as ActivityLevel | null) ?? null,
    diet: (p.dietPreference as DietPreference | null) ?? null,
    breakfast: (p.breakfastPreference as BreakfastPreference | null) ?? null,
    allergies,
    noAllergies,
    goals: (p.goals as Goal[] | null) ?? [],
    clinicalStatus: (p.clinicalStatus as ClinicalStatus | null) ?? null,
  };
}

/** Map onboarding state → PUT /clinical-profile body. */
function onboardingStateToProfileInput(
  s: OnboardingState,
): ClinicalProfileInput {
  let allergies: string | null = null;
  if (s.noAllergies) {
    allergies = "";
  } else if (s.allergies.length > 0) {
    allergies = s.allergies.join(", ");
  }
  return {
    sex: s.sex,
    age: s.age,
    height: s.heightCm,
    weight: s.weightKg,
    activityLevel: s.activity,
    breakfastPreference: s.breakfast,
    isVegan: s.diet === "vegan",
    isVegetarian: s.diet === "vegetarian" || s.diet === "vegan",
    dietPreference: s.diet,
    allergies,
    goals: s.goals.length > 0 ? s.goals : null,
    clinicalStatus: s.clinicalStatus,
  };
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, markOnboardingComplete } = useAuth();

  const [step, setStep] = useState<number>(STEP.GREETING);
  const [data, setData] = useState<OnboardingState>(INITIAL_STATE);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Hydrate from existing clinical profile so the wizard shows current values
  // when the user re-runs it from settings. Failures (404, auth, offline) are
  // silent — the wizard simply starts from INITIAL_STATE.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await sdk.clinicalProfile.get();
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          ...profileToOnboardingState(profile),
        }));
      } catch {
        // no existing profile — keep INITIAL_STATE
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const colorProgress = useSharedValue(0);
  const progress = useSharedValue(1 / TOTAL_STEPS);

  useEffect(() => {
    colorProgress.value = withTiming(step, {
      duration: 700,
      easing: Easing.inOut(Easing.cubic),
    });
    progress.value = withTiming((step + 1) / TOTAL_STEPS, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [step, colorProgress, progress]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorProgress.value,
      STEP_COLORS.map((_, i) => i),
      [...STEP_COLORS],
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const goNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  // Back skips wow transitions (otherwise auto-advance creates a loop)
  const goPrev = useCallback(() => {
    setStep((s) => {
      let target = s - 1;
      while (target >= 0 && WOW_STEPS.has(target)) target -= 1;
      return Math.max(0, target);
    });
  }, []);

  const update = useCallback(<K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const finish = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const snapshot = dataRef.current;

    // Step 1 — fetch the policy version so the consent grant carries the
    // correct value (server's `versionForPurpose` checks it for mandatory
    // purposes). Falls back to a safe default if the call fails.
    let policyVersion = "1.0.0";
    try {
      const status = await sdk.consent.getStatus();
      policyVersion = status.currentVersions.privacyPolicy;
    } catch {
      // keep default
    }

    // Step 2 — grant the consents disclosed on the greeting screen. Without
    // `health_data_processing` the clinical-profile + nutrition endpoints
    // would 403 with CONSENT_REQUIRED and the wizard would loop.
    try {
      await sdk.consent.grant({
        grants: [
          {
            purpose: "health_data_processing",
            granted: true,
            policyVersion,
          },
          {
            purpose: "ai_data_processing",
            granted: true,
            policyVersion,
          },
        ],
      });
    } catch {
      // idempotent on the server — if it fails, the next step will surface it
    }

    // Step 3 — persist clinical data and user preferences. Each is wrapped
    // independently so a single failure doesn't block the others (and most
    // importantly doesn't block completeOnboarding).
    try {
      await sdk.clinicalProfile.upsert(onboardingStateToProfileInput(snapshot));
    } catch {
      // best-effort — log surface to come in a later iteration
    }

    try {
      await sdk.profile.update({
        preferences: {
          notificationsOptIn: snapshot.notifications,
          biometricOptIn: snapshot.biometric,
        },
      });
    } catch {
      // best-effort
    }

    // Step 4 — flip onboardingCompleted server-side. This is the gate the
    // (app)/_layout reads on every navigation; if it stays false the user
    // bounces back to /onboarding on the next render.
    try {
      await sdk.profile.completeOnboarding();
    } catch {
      // best-effort: we still mark locally so the current session is unblocked
    }

    // Local mark — ensures the in-memory user reflects the new state without
    // waiting for a profile refetch.
    markOnboardingComplete();

    router.replace("/");
  }, [router, markOnboardingComplete]);

  // Auto-advance for transitions and final step
  useEffect(() => {
    if (WOW_STEPS.has(step)) {
      const t = setTimeout(goNext, 2000);
      return () => clearTimeout(t);
    }
    if (step === STEP.DONE) {
      const t = setTimeout(finish, 2800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step, goNext, finish]);

  const canContinue = useMemo(() => {
    switch (step) {
      case STEP.GREETING:
        return true;
      case STEP.GOALS:
        return data.goals.length > 0;
      case STEP.CLINICAL:
        return data.clinicalStatus !== null;
      case STEP.SEX:
        return data.sex !== null;
      case STEP.AGE:
        return data.age >= 16 && data.age <= 100;
      case STEP.BODY:
        return data.heightCm >= 100 && data.weightKg >= 30;
      case STEP.ACTIVITY:
        return data.activity !== null;
      case STEP.DIET:
        return data.diet !== null && data.breakfast !== null;
      case STEP.ALLERGIES:
        return true; // optional
      default:
        return false;
    }
  }, [step, data]);

  const isWow = WOW_STEPS.has(step);
  const isPermission = PERMISSION_STEPS.has(step);
  const isDone = step === STEP.DONE;
  const showBack = step > STEP.GREETING && !isWow && !isDone;
  const showContinue = !isWow && !isPermission && !isDone;

  return (
    <Animated.View style={[{ flex: 1 }, bgStyle]}>
      <AmbientBackground />

      <SafeAreaView edges={["top"]} className="px-6 pt-2">
        <View className="flex-row items-center gap-3">
          {showBack ? (
            <Pressable
              onPress={goPrev}
              className="-ml-2 rounded-full p-2 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Indietro"
            >
              <ChevronLeft size={24} color="#f7fbff" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <View className="h-1 flex-1 overflow-hidden rounded-full bg-[#f7fbff]/15">
            <Animated.View
              style={progressStyle}
              className="h-1 rounded-full bg-[#f7fbff]"
            />
          </View>
          <Text className="ml-2 text-xs font-semibold text-[#f7fbff]/60">
            {step + 1}/{TOTAL_STEPS}
          </Text>
        </View>
      </SafeAreaView>

      <View className="flex-1 px-6 pb-2">
        <StepContent step={step}>
          {step === STEP.GREETING ? (
            <StepGreeting name={user?.firstName ?? null} />
          ) : null}
          {step === STEP.GOALS ? (
            <StepGoals
              value={data.goals}
              onToggle={(g) =>
                update(
                  "goals",
                  data.goals.includes(g)
                    ? data.goals.filter((x) => x !== g)
                    : [...data.goals, g],
                )
              }
            />
          ) : null}
          {step === STEP.CLINICAL ? (
            <StepClinical
              value={data.clinicalStatus}
              onChange={(v) => update("clinicalStatus", v)}
            />
          ) : null}
          {step === STEP.SEX ? (
            <StepSex value={data.sex} onChange={(v) => update("sex", v)} />
          ) : null}
          {step === STEP.AGE ? (
            <StepAge value={data.age} onChange={(v) => update("age", v)} />
          ) : null}
          {step === STEP.BODY ? (
            <StepBody
              heightCm={data.heightCm}
              weightKg={data.weightKg}
              onHeightChange={(v) => update("heightCm", v)}
              onWeightChange={(v) => update("weightKg", v)}
            />
          ) : null}
          {step === STEP.WOW_1 ? (
            <StepWow
              icon={Compass}
              title="Sei a metà del cammino."
              subtitle="Stiamo costruendo il quadro. Avanti così."
            />
          ) : null}
          {step === STEP.ACTIVITY ? (
            <StepActivity
              value={data.activity}
              onChange={(v) => update("activity", v)}
            />
          ) : null}
          {step === STEP.DIET ? (
            <StepDiet
              diet={data.diet}
              breakfast={data.breakfast}
              onDietChange={(v) => update("diet", v)}
              onBreakfastChange={(v) => update("breakfast", v)}
            />
          ) : null}
          {step === STEP.ALLERGIES ? (
            <StepAllergies
              value={data.allergies}
              noAllergies={data.noAllergies}
              onToggle={(a) => {
                if (data.noAllergies) update("noAllergies", false);
                update(
                  "allergies",
                  data.allergies.includes(a)
                    ? data.allergies.filter((x) => x !== a)
                    : [...data.allergies, a],
                );
              }}
              onToggleNone={() => {
                const next = !data.noAllergies;
                update("noAllergies", next);
                if (next) update("allergies", []);
              }}
            />
          ) : null}
          {step === STEP.WOW_2 ? (
            <StepWow
              icon={MountainSnow}
              title="Quasi in vetta."
              subtitle="Solo le ultime due cose. Ti renderanno la vita più facile."
            />
          ) : null}
          {step === STEP.NOTIFICATIONS ? (
            <StepNotifications
              onResolve={(decision) => {
                update("notifications", decision);
                goNext();
              }}
            />
          ) : null}
          {step === STEP.FACE_ID ? (
            <StepFaceId
              onResolve={(decision) => {
                update("biometric", decision);
                goNext();
              }}
            />
          ) : null}
          {step === STEP.DONE ? <StepDone /> : null}
        </StepContent>
      </View>

      {showContinue ? (
        <SafeAreaView edges={["bottom"]} className="px-6 pb-3">
          <Pressable
            disabled={!canContinue}
            onPress={goNext}
            className={
              canContinue
                ? "rounded-full bg-[#f7fbff] py-4 active:opacity-90"
                : "rounded-full bg-[#f7fbff]/25 py-4"
            }
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? "Iniziamo" : "Continua"}
          >
            <Text
              className={
                canContinue
                  ? "text-center text-base font-semibold text-[#0d1424]"
                  : "text-center text-base font-semibold text-[#f7fbff]/50"
              }
            >
              {step === STEP.GREETING ? "Iniziamo" : "Continua"}
            </Text>
          </Pressable>
        </SafeAreaView>
      ) : null}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Ambient background — slowly drifting blurred-light blobs
// ---------------------------------------------------------------------------

function AmbientBackground() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <FloatingBlob size={420} top={-100} left={-120} duration={9000} />
      <FloatingBlob
        size={520}
        bottom={-180}
        right={-140}
        duration={11000}
        reverse
      />
    </View>
  );
}

type FloatingBlobProps = {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  duration: number;
  reverse?: boolean;
};

function FloatingBlob({
  size,
  top,
  bottom,
  left,
  right,
  duration,
  reverse = false,
}: FloatingBlobProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = withRepeat(
      withTiming(reverse ? -32 : 32, {
        duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    ty.value = withRepeat(
      withTiming(reverse ? 26 : -26, {
        duration: duration * 1.25,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [duration, reverse, tx, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(247,251,255,0.06)",
          top,
          bottom,
          left,
          right,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// StepContent — slide-in + fade per step change
// ---------------------------------------------------------------------------

function StepContent({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) {
  const tx = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    tx.value = 36;
    op.value = 0;
    tx.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    op.value = withTiming(1, { duration: 500 });
  }, [step, tx, op]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style]} key={step}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

function StepHeader({
  Icon,
  eyebrow,
  title,
  subtitle,
}: {
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <Icon size={14} color="rgba(247,251,255,0.7)" strokeWidth={2.5} />
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/70">
          {eyebrow}
        </Text>
      </View>
      <Text className="text-4xl font-bold leading-[1.1] tracking-tight text-[#f7fbff]">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-4 text-base leading-relaxed text-[#f7fbff]/70">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function PillOption({
  label,
  selected,
  onPress,
  description,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        selected
          ? "mb-3 rounded-2xl border-2 border-[#d8e3f4] bg-[#f7fbff] px-5 py-4 active:opacity-90"
          : "mb-3 rounded-2xl border-2 border-[#d8e3f4]/30 px-5 py-4 active:opacity-80"
      }
    >
      <Text
        className={
          selected
            ? "text-lg font-semibold text-[#0d1424]"
            : "text-lg font-semibold text-[#f7fbff]"
        }
      >
        {label}
      </Text>
      {description ? (
        <Text
          className={
            selected
              ? "mt-0.5 text-sm text-[#0d1424]/60"
              : "mt-0.5 text-sm text-[#f7fbff]/60"
          }
        >
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  let style: string;
  if (disabled) {
    style = "rounded-full border border-[#d8e3f4]/15 bg-[#f7fbff]/5 px-4 py-2.5";
  } else if (selected) {
    style = "rounded-full bg-[#f7fbff] px-4 py-2.5 active:opacity-90";
  } else {
    style = "rounded-full border border-[#d8e3f4]/30 px-4 py-2.5 active:opacity-80";
  }
  let textStyle: string;
  if (disabled) {
    textStyle = "text-sm font-semibold text-[#f7fbff]/30";
  } else if (selected) {
    textStyle = "text-sm font-semibold text-[#0d1424]";
  } else {
    textStyle = "text-sm font-semibold text-[#f7fbff]";
  }
  return (
    <Pressable onPress={disabled ? undefined : onPress} className={style}>
      <Text className={textStyle}>{label}</Text>
    </Pressable>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const dec = () => {
    if (value - step >= min) {
      onChange(value - step);
      void Haptics.selectionAsync();
    }
  };
  const inc = () => {
    if (value + step <= max) {
      onChange(value + step);
      void Haptics.selectionAsync();
    }
  };
  return (
    <View className="flex-row items-center justify-center gap-8">
      <Pressable
        onPress={dec}
        className="h-14 w-14 items-center justify-center rounded-full border border-[#d8e3f4]/30 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Diminuisci"
      >
        <Minus size={28} color="#f7fbff" strokeWidth={2.5} />
      </Pressable>
      <View className="min-w-[140px] items-center">
        <Text className="text-7xl font-bold text-[#f7fbff]">{value}</Text>
        <Text className="mt-1 text-sm uppercase tracking-[2px] text-[#f7fbff]/60">
          {unit}
        </Text>
      </View>
      <Pressable
        onPress={inc}
        className="h-14 w-14 items-center justify-center rounded-full border border-[#d8e3f4]/30 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Aumenta"
      >
        <Plus size={28} color="#f7fbff" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepGreeting({ name }: { name: string | null }) {
  return (
    <View className="flex-1 justify-end pb-10">
      <View className="mb-3 flex-row items-center gap-2">
        <Sparkles size={14} color="rgba(247,251,255,0.7)" strokeWidth={2.5} />
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/70">
          Benvenuta
        </Text>
      </View>
      <Text className="text-5xl font-bold leading-[1.05] tracking-tight text-[#f7fbff]">
        Ciao{name ? `, ${name}` : ""}.
      </Text>
      <Text className="mt-5 max-w-[92%] text-lg leading-relaxed text-[#f7fbff]/80">
        Iniziamo a conoscerci. Pochi minuti per costruire un&apos;esperienza
        pensata davvero su misura per te.
      </Text>

      <View className="mt-9 rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/5 p-4">
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
          Cosa accetti continuando
        </Text>
        <ConsentBullet>
          Trattamento dei tuoi dati sanitari per personalizzare piani e
          contenuti.
        </ConsentBullet>
        <ConsentBullet>
          Uso di intelligenza artificiale per consigliarti pasti, percorsi e
          assistenza nella chat.
        </ConsentBullet>
        <Text className="mt-3 text-xs leading-relaxed text-[#f7fbff]/55">
          Modificabili in qualsiasi momento dalle impostazioni del profilo.
        </Text>
      </View>
    </View>
  );
}

function ConsentBullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mt-3 flex-row items-start gap-2.5">
      <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#7ddac2]" />
      <Text className="flex-1 text-sm leading-relaxed text-[#f7fbff]/80">
        {children}
      </Text>
    </View>
  );
}

function StepGoals({
  value,
  onToggle,
}: {
  value: Goal[];
  onToggle: (g: Goal) => void;
}) {
  const options: { value: Goal; label: string }[] = [
    { value: "nutrition", label: "Piani nutrizionali" },
    { value: "specialists", label: "Visite con specialisti" },
    { value: "courses", label: "Corsi e percorsi" },
    { value: "tracking", label: "Monitoraggio salute" },
    { value: "community", label: "Confronto con altri" },
  ];
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="justify-end pb-3 grow"
      showsVerticalScrollIndicator={false}
    >
      <View className="grow" />
      <StepHeader
        Icon={Target}
        eyebrow="Obiettivi"
        title="Cosa ti porta qui?"
        subtitle="Scegli uno o più ambiti che ti interessano. Calibreremo i contenuti su questo."
      />
      <View className="mt-8 flex-row flex-wrap gap-2">
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={value.includes(opt.value)}
            onPress={() => {
              onToggle(opt.value);
              void Haptics.selectionAsync();
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function StepClinical({
  value,
  onChange,
}: {
  value: ClinicalStatus | null;
  onChange: (v: ClinicalStatus) => void;
}) {
  const options: {
    value: ClinicalStatus;
    label: string;
    description: string;
  }[] = [
    {
      value: "in_treatment",
      label: "In trattamento",
      description: "Sto seguendo terapie o cure attive",
    },
    {
      value: "follow_up",
      label: "Follow-up",
      description: "Controlli periodici post-trattamento",
    },
    {
      value: "remission",
      label: "In remissione",
      description: "Trattamenti conclusi, monitoraggio leggero",
    },
    {
      value: "prevention",
      label: "Prevenzione",
      description: "Familiarità o focus sul benessere",
    },
    {
      value: "prefer_not_to_say",
      label: "Preferisco non dire",
      description: "Salta questa informazione",
    },
  ];
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-3 grow"
      showsVerticalScrollIndicator={false}
    >
      <View className="pt-4">
        <StepHeader
          Icon={HeartPulse}
          eyebrow="Stato clinico"
          title="Da dove partiamo?"
          subtitle="È solo per orientarci. Puoi cambiarlo in qualunque momento dal profilo."
        />
      </View>
      <View className="mt-6">
        {options.map((opt) => (
          <PillOption
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={value === opt.value}
            onPress={() => {
              onChange(opt.value);
              void Haptics.selectionAsync();
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function StepSex({
  value,
  onChange,
}: {
  value: Sex | null;
  onChange: (v: Sex) => void;
}) {
  const options: { value: Sex; label: string }[] = [
    { value: "f", label: "Femmina" },
    { value: "m", label: "Maschio" },
    { value: "other", label: "Altro" },
  ];
  return (
    <View className="flex-1 justify-end pb-3">
      <StepHeader
        Icon={User}
        eyebrow="Sesso biologico"
        title="Come ti rappresenti?"
        subtitle="Ci aiuta a calibrare i piani nutrizionali sulle tue esigenze fisiologiche."
      />
      <View className="mt-8">
        {options.map((opt) => (
          <PillOption
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onPress={() => {
              onChange(opt.value);
              void Haptics.selectionAsync();
            }}
          />
        ))}
      </View>
    </View>
  );
}

function StepAge({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-1">
      <View className="pt-4">
        <StepHeader
          Icon={CalendarDays}
          eyebrow="Età"
          title="Quanti anni hai?"
          subtitle="Età anagrafica — usata per il calcolo del fabbisogno energetico."
        />
      </View>
      <View className="flex-1 items-center justify-center">
        <Stepper
          value={value}
          min={16}
          max={100}
          unit="anni"
          onChange={onChange}
        />
      </View>
    </View>
  );
}

function StepBody({
  heightCm,
  weightKg,
  onHeightChange,
  onWeightChange,
}: {
  heightCm: number;
  weightKg: number;
  onHeightChange: (v: number) => void;
  onWeightChange: (v: number) => void;
}) {
  return (
    <View className="flex-1">
      <View className="pt-4">
        <StepHeader
          Icon={Ruler}
          eyebrow="Misure"
          title="Le tue misure."
          subtitle="Indispensabili per personalizzare le porzioni e gli obiettivi del piano."
        />
      </View>
      <View className="mt-10 gap-10">
        <View>
          <Text className="mb-4 text-center text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
            Altezza
          </Text>
          <Stepper
            value={heightCm}
            min={120}
            max={220}
            unit="cm"
            onChange={onHeightChange}
          />
        </View>
        <View>
          <Text className="mb-4 text-center text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
            Peso
          </Text>
          <Stepper
            value={weightKg}
            min={30}
            max={200}
            unit="kg"
            onChange={onWeightChange}
          />
        </View>
      </View>
    </View>
  );
}

function StepActivity({
  value,
  onChange,
}: {
  value: ActivityLevel | null;
  onChange: (v: ActivityLevel) => void;
}) {
  const options: {
    value: ActivityLevel;
    label: string;
    description: string;
    intensity: number;
  }[] = [
    {
      value: "sedentary",
      label: "Sedentaria",
      description: "Lavoro al PC, poco movimento",
      intensity: 1,
    },
    {
      value: "light",
      label: "Leggera",
      description: "Camminate quotidiane",
      intensity: 2,
    },
    {
      value: "moderate",
      label: "Moderata",
      description: "Sport 2-3 volte a settimana",
      intensity: 3,
    },
    {
      value: "active",
      label: "Alta",
      description: "Sport intenso 4-5 volte a settimana",
      intensity: 4,
    },
    {
      value: "very_active",
      label: "Molto alta",
      description: "Atleta o lavoro fisico",
      intensity: 5,
    },
  ];
  return (
    <View className="flex-1">
      <View className="pt-4">
        <StepHeader
          Icon={ActivityIcon}
          eyebrow="Stile di vita"
          title="Il tuo motore quotidiano."
        />
      </View>
      <ScrollView
        className="mt-6 flex-1"
        contentContainerClassName="pb-2"
        showsVerticalScrollIndicator={false}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                void Haptics.selectionAsync();
              }}
              className={
                selected
                  ? "mb-3 rounded-2xl border-2 border-[#d8e3f4] bg-[#f7fbff] px-5 py-4 active:opacity-90"
                  : "mb-3 rounded-2xl border-2 border-[#d8e3f4]/25 px-5 py-4 active:opacity-80"
              }
            >
              <View className="mb-2 flex-row gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const filled = i <= opt.intensity;
                  if (selected) {
                    return (
                      <View
                        key={i}
                        className={
                          filled
                            ? "h-1.5 w-6 rounded-full bg-black"
                            : "h-1.5 w-6 rounded-full bg-black/15"
                        }
                      />
                    );
                  }
                  return (
                    <View
                      key={i}
                      className={
                        filled
                          ? "h-1.5 w-6 rounded-full bg-[#f7fbff]"
                          : "h-1.5 w-6 rounded-full bg-[#f7fbff]/15"
                      }
                    />
                  );
                })}
              </View>
              <Text
                className={
                  selected
                    ? "text-lg font-semibold text-[#0d1424]"
                    : "text-lg font-semibold text-[#f7fbff]"
                }
              >
                {opt.label}
              </Text>
              <Text
                className={
                  selected ? "text-sm text-[#0d1424]/60" : "text-sm text-[#f7fbff]/60"
                }
              >
                {opt.description}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StepDiet({
  diet,
  breakfast,
  onDietChange,
  onBreakfastChange,
}: {
  diet: DietPreference | null;
  breakfast: BreakfastPreference | null;
  onDietChange: (v: DietPreference) => void;
  onBreakfastChange: (v: BreakfastPreference) => void;
}) {
  const dietOptions: { value: DietPreference; label: string }[] = [
    { value: "omnivore", label: "Onnivora" },
    { value: "pescetarian", label: "Pescetariana" },
    { value: "vegetarian", label: "Vegetariana" },
    { value: "vegan", label: "Vegana" },
  ];
  const breakfastOptions: { value: BreakfastPreference; label: string }[] = [
    { value: "sweet", label: "Dolce" },
    { value: "savory", label: "Salata" },
  ];
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-3"
      showsVerticalScrollIndicator={false}
    >
      <View className="pt-4">
        <StepHeader
          Icon={Apple}
          eyebrow="Alimentazione"
          title="A tavola."
          subtitle="Scegli lo stile alimentare e il tipo di colazione che preferisci."
        />
      </View>
      <Text className="mb-3 mt-7 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
        Stile alimentare
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {dietOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={diet === opt.value}
            onPress={() => {
              onDietChange(opt.value);
              void Haptics.selectionAsync();
            }}
          />
        ))}
      </View>
      <Text className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/60">
        Colazione
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {breakfastOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={breakfast === opt.value}
            onPress={() => {
              onBreakfastChange(opt.value);
              void Haptics.selectionAsync();
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const ALLERGY_OPTIONS = [
  "Latte",
  "Glutine",
  "Uova",
  "Frutta a guscio",
  "Arachidi",
  "Pesce",
  "Crostacei",
  "Soia",
  "Sedano",
  "Senape",
  "Sesamo",
  "Solfiti",
  "Lupini",
  "Molluschi",
] as const;

function StepAllergies({
  value,
  noAllergies,
  onToggle,
  onToggleNone,
}: {
  value: string[];
  noAllergies: boolean;
  onToggle: (a: string) => void;
  onToggleNone: () => void;
}) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-3"
      showsVerticalScrollIndicator={false}
    >
      <View className="pt-4">
        <StepHeader
          Icon={ShieldAlert}
          eyebrow="Allergie e intolleranze"
          title="Hai restrizioni?"
          subtitle="Le useremo per filtrare automaticamente piani e ricette suggeriti."
        />
      </View>
      <View className="mt-7">
        <Pressable
          onPress={() => {
            onToggleNone();
            void Haptics.selectionAsync();
          }}
          className={
            noAllergies
              ? "mb-5 self-start rounded-full bg-[#f7fbff] px-5 py-2.5 active:opacity-90"
              : "mb-5 self-start rounded-full border border-[#d8e3f4]/40 px-5 py-2.5 active:opacity-80"
          }
        >
          <Text
            className={
              noAllergies
                ? "text-sm font-semibold text-[#0d1424]"
                : "text-sm font-semibold text-[#f7fbff]"
            }
          >
            Nessuna allergia
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={value.includes(a)}
              disabled={noAllergies}
              onPress={() => {
                onToggle(a);
                void Haptics.selectionAsync();
              }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Wow moment — celebratory transition that auto-advances
// ---------------------------------------------------------------------------

function StepWow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-15);
  const textOp = useSharedValue(0);
  const textTy = useSharedValue(14);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 9, stiffness: 110 });
    rotate.value = withSpring(0, { damping: 9, stiffness: 110 });
    textOp.value = withDelay(280, withTiming(1, { duration: 450 }));
    textTy.value = withDelay(
      280,
      withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
  }, [scale, rotate, textOp, textTy]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOp.value,
    transform: [{ translateY: textTy.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center">
      <Animated.View
        style={[
          iconStyle,
          {
            shadowColor: "#f7fbff",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
          },
        ]}
        className="mb-10 h-24 w-24 items-center justify-center rounded-full bg-[#f7fbff]/15"
      >
        <Icon size={44} color="#f7fbff" strokeWidth={2} />
      </Animated.View>
      <Animated.View style={textStyle} className="items-center px-4">
        <Text className="mb-3 text-center text-3xl font-bold tracking-tight text-[#f7fbff]">
          {title}
        </Text>
        <Text className="text-center text-base leading-relaxed text-[#f7fbff]/70">
          {subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Permission steps
// ---------------------------------------------------------------------------

function StepNotifications({
  onResolve,
}: {
  onResolve: (decision: PermissionDecision) => void;
}) {
  const [busy, setBusy] = useState(false);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    wiggle.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [wiggle]);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(wiggle.value - 0.5) * 8}deg` }],
  }));

  const requestPermission = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
    } catch {
      // best-effort: even if it fails, advance
    } finally {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onResolve("granted");
    }
  }, [busy, onResolve]);

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={bellStyle}
          className="mb-10 h-24 w-24 items-center justify-center rounded-3xl bg-[#f7fbff]/15"
        >
          <Bell size={48} color="#f7fbff" strokeWidth={1.8} />
        </Animated.View>
        <Text className="mb-3 px-4 text-center text-3xl font-bold tracking-tight text-[#f7fbff]">
          Resta sempre informata.
        </Text>
        <Text className="max-w-[88%] text-center text-base leading-relaxed text-[#f7fbff]/75">
          Promemoria appuntamenti, nuovi piani e gli eventi a cui sei iscritta.
          {"\n"}Niente spam, ti diamo la nostra parola.
        </Text>
      </View>
      <SafeAreaView edges={["bottom"]} className="pb-1">
        <Pressable
          onPress={requestPermission}
          disabled={busy}
          className={
            busy
              ? "mb-3 rounded-full bg-[#f7fbff]/70 py-4"
              : "mb-3 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
          }
        >
          <Text className="text-center text-base font-semibold text-[#0d1424]">
            Abilita notifiche
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onResolve("skipped")}
          className="rounded-full border border-[#d8e3f4]/40 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-semibold text-[#f7fbff]">
            Più tardi
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function StepFaceId({
  onResolve,
}: {
  onResolve: (decision: PermissionDecision) => void;
}) {
  const [busy, setBusy] = useState(false);
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.06 }],
    opacity: 0.85 + breath.value * 0.15,
  }));

  const setupBiometric = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;

      if (hasHardware && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Conferma con Face ID",
          cancelLabel: "Annulla",
          fallbackLabel: "Usa codice",
          disableDeviceFallback: false,
        });
        if (result.success) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          onResolve("granted");
          return;
        }
      }
    } catch {
      // ignore — fall through to skipped
    } finally {
      setBusy(false);
    }
    onResolve("skipped");
  }, [busy, onResolve]);

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={[
            faceStyle,
            {
              shadowColor: "#a5b4fc",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 30,
            },
          ]}
          className="mb-10 h-24 w-24 items-center justify-center rounded-3xl bg-[#f7fbff]/15"
        >
          <ScanFace size={48} color="#f7fbff" strokeWidth={1.8} />
        </Animated.View>
        <Text className="mb-3 px-4 text-center text-3xl font-bold tracking-tight text-[#f7fbff]">
          Accesso rapido.
        </Text>
        <Text className="max-w-[88%] text-center text-base leading-relaxed text-[#f7fbff]/75">
          Sblocca l&apos;app con Face ID o Touch ID.{"\n"}Funziona solo su questo
          dispositivo.
        </Text>
      </View>
      <SafeAreaView edges={["bottom"]} className="pb-1">
        <Pressable
          onPress={setupBiometric}
          disabled={busy}
          className={
            busy
              ? "mb-3 rounded-full bg-[#f7fbff]/70 py-4"
              : "mb-3 rounded-full bg-[#f7fbff] py-4 active:opacity-90"
          }
        >
          <Text className="text-center text-base font-semibold text-[#0d1424]">
            Configura Face ID
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onResolve("skipped")}
          className="rounded-full border border-[#d8e3f4]/40 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-semibold text-[#f7fbff]">
            Più tardi
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Done — auto-redirects to home
// ---------------------------------------------------------------------------

const DONE_PHRASES = [
  "Configurando il tuo profilo…",
  "Personalizzando i contenuti…",
  "Quasi pronto…",
  "Ultimo tocco…",
];

function StepDone() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phraseOpacity = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  useEffect(() => {
    const advance = (next: number) => setPhraseIdx(next);
    const interval = setInterval(() => {
      phraseOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (!finished) return;
        const next = (phraseIdx + 1) % DONE_PHRASES.length;
        runOnJS(advance)(next);
        phraseOpacity.value = withTiming(1, { duration: 250 });
      });
    }, 900);
    return () => clearInterval(interval);
  }, [phraseIdx, phraseOpacity]);

  const phraseStyle = useAnimatedStyle(() => ({
    opacity: phraseOpacity.value,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.18 }],
    opacity: 1 - pulse.value * 0.3,
  }));

  return (
    <View className="flex-1 items-center justify-center">
      <Animated.View
        style={[
          pulseStyle,
          {
            shadowColor: "#fde68a",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 32,
          },
        ]}
        className="mb-12 h-32 w-32 items-center justify-center rounded-full bg-[#f7fbff]"
      >
        <Sparkles size={56} color="#0d1424" strokeWidth={2} />
      </Animated.View>
      <Text className="mb-3 text-3xl font-bold tracking-tight text-[#f7fbff]">
        Ci siamo quasi
      </Text>
      <Animated.View style={phraseStyle}>
        <Text className="text-base text-[#f7fbff]/70">{DONE_PHRASES[phraseIdx]}</Text>
      </Animated.View>
    </View>
  );
}
