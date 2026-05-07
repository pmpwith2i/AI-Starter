import {
  GlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import {
  Apple,
  BookOpen,
  CalendarDays,
  Home,
  type LucideIcon,
  UserRound,
} from "lucide-react-native";
import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "../../lib/utils";

cssInterop(LinearGradient, { className: "style" });
cssInterop(GlassView, { className: "style" });

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HAS_LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable();

// ──────────────────────────────────────────────────────────────────────────
// TOKENS — atmospheric, onboarding-aligned
// ──────────────────────────────────────────────────────────────────────────
//
// La direzione: la stessa atmosfera dell'onboarding (full-bleed gradient
// "alba"), ma applicata in app — quindi card senza bordo netto, glass reale,
// hue di dominio whispered.
export const MOBILE_COLORS = {
  page: "#0e1727",
  pageDeep: "#0b1322",
  surface: "#152138",
  surfaceRaised: "#1d2b44",
  ink: "#f4f7fb",
  inkSoft: "rgba(244,247,251,0.78)",
  muted: "rgba(244,247,251,0.62)",
  quiet: "rgba(244,247,251,0.42)",
  hush: "rgba(244,247,251,0.26)",
  line: "rgba(244,247,251,0.07)",
  glass: "rgba(244,247,251,0.05)",
  glassStrong: "rgba(244,247,251,0.085)",
  primary: "#7c95ff",
  primarySoft: "#c9d5ff",
  cream: "#f0d8b9",
  warm: "#f1d9b1",
  clay: "#ec8f64",
  // Domain whispers
  care: "#7c95ff",
  nutrition: "#7ddac2",
  events: "#8fc7e8",
  courses: "#f0d8b9",
  support: "#aabaff",
} as const;

// Display font — iOS New York (transitional serif), Charter / serif fallback.
export const DISPLAY_FONT: TextStyle = Platform.select({
  ios: { fontFamily: "New York" },
  android: { fontFamily: "serif" },
  default: { fontFamily: "Georgia" },
}) as TextStyle;

type SurfaceTone = "default" | "strong" | "nutrition" | "events" | "courses" | "warm";

// Surface palette — layered LinearGradient stile onboarding.
// Ogni tone ha base scura + accent di hue + gradient flow.
type ToneSpec = {
  /** Solid base behind the gradient */
  base: string;
  /** 3-stop gradient that flows across the card */
  gradient: readonly [string, string, string];
  /** Optional border tint to define the edge */
  border: string;
};

const TONE_SPEC: Record<SurfaceTone, ToneSpec> = {
  default: {
    base: "#101a2c",
    gradient: [
      "rgba(124,149,255,0.06)",
      "rgba(244,247,251,0.012)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(244,247,251,0.06)",
  },
  strong: {
    base: "#142036",
    gradient: [
      "rgba(124,149,255,0.10)",
      "rgba(244,247,251,0.02)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(244,247,251,0.085)",
  },
  nutrition: {
    base: "#0f2030",
    gradient: [
      "rgba(125,218,194,0.14)",
      "rgba(125,218,194,0.025)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(125,218,194,0.18)",
  },
  events: {
    base: "#11202f",
    gradient: [
      "rgba(143,199,232,0.13)",
      "rgba(143,199,232,0.02)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(143,199,232,0.18)",
  },
  courses: {
    base: "#1a2030",
    gradient: [
      "rgba(240,216,185,0.13)",
      "rgba(240,216,185,0.02)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(240,216,185,0.18)",
  },
  warm: {
    base: "#1c2235",
    gradient: [
      "rgba(240,216,185,0.16)",
      "rgba(240,216,185,0.04)",
      "rgba(11,19,34,0)",
    ] as const,
    border: "rgba(240,216,185,0.22)",
  },
};

// ──────────────────────────────────────────────────────────────────────────
// BACKDROP — atmospheric flow alla onboarding
// ──────────────────────────────────────────────────────────────────────────
/**
 * Static "alba" wash behind every main page.
 *
 * MUST stay static. An earlier version layered two full-screen
 * `AnimatedLinearGradient` blooms with infinite `withRepeat` opacity +
 * translateY animations on top of the base gradient. That forced the GPU to
 * recomposite the entire screen on every frame, which compounded with any
 * `FlatList` / `ScrollView` underneath and produced visible scroll jank on
 * every "main" page (events, courses, nutrition, profile, home).
 *
 * The detail screens (`[eventId]`, `[courseId]`, `[planId]`, `[bundleId]`) do
 * not use AppBackdrop at all and were always smooth — that contrast was the
 * smoking gun. Gating the loops with `useFocusEffect` was not enough because
 * the focused screen is exactly where the user feels the jank.
 *
 * DO NOT add `withRepeat`, `useAnimatedStyle`, or any other reanimated
 * animation to a full-screen layer in this component. If you want subtle
 * motion, do it in a small contained element (a pulse, a shimmer on a card),
 * NOT on something that covers the viewport.
 *
 * See `apps/mobile/README.md > Performance — anti-patterns` for the rule.
 */
export function AppBackdrop({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-[#070d1a]">
      <LinearGradient
        pointerEvents="none"
        colors={["#0c1729", "#091223", "#06101e"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SURFACE — Liquid Glass su iOS 26+, fallback gradient morbido altrove
// ──────────────────────────────────────────────────────────────────────────
export function LiquidGlassSurface({
  children,
  className,
  tone = "default",
  radius = 24,
  interactive = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  tone?: SurfaceTone;
  radius?: number;
  interactive?: boolean;
  style?: ViewStyle;
}) {
  const shadow: ViewStyle = {
    shadowColor: "#020611",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: interactive ? 0.32 : 0.22,
    shadowRadius: interactive ? 28 : 20,
  };

  const spec = TONE_SPEC[tone];
  return (
    <View
      className={cn("overflow-hidden", className)}
      style={[
        {
          borderRadius: radius,
          backgroundColor: spec.base,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: spec.border,
        },
        shadow,
        style,
      ]}
    >
      {/* Diagonal gradient flow — onboarding-style */}
      <LinearGradient
        pointerEvents="none"
        colors={spec.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top-light hairline per definizione del bordo superiore */}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0 h-px bg-[#f4f7fb]/12"
      />
      {children}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TILE — inset surface (metric cells, info pairs, action rows) che
// armonizza col parent invece di "boxarsi" con bordo netto.
// ──────────────────────────────────────────────────────────────────────────
export function Tile({
  children,
  className,
  radius = 18,
  flow = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  /** show subtle top-left gradient flow (default true) */
  flow?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={cn("overflow-hidden", className)}
      style={[
        {
          borderRadius: radius,
          backgroundColor: "rgba(244,247,251,0.045)",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(244,247,251,0.10)",
        },
        style,
      ]}
    >
      {flow ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(244,247,251,0.06)",
            "rgba(244,247,251,0.012)",
            "rgba(244,247,251,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0 h-px bg-[#f4f7fb]/10"
      />
      {children}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PRESSABLE MOTION
// ──────────────────────────────────────────────────────────────────────────
export function MotionPressable({
  children,
  className,
  style,
  scaleTo = 0.972,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps & {
  children: ReactNode;
  className?: string;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      className={className}
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 360 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 360 });
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ──────────────────────────────────────────────────────────────────────────
export function Eyebrow({
  children,
  className,
  tint = "muted",
}: {
  children: ReactNode;
  className?: string;
  tint?: "muted" | "warm" | "primary" | "ink";
}) {
  const color =
    tint === "warm"
      ? "text-[#f0d8b9]/85"
      : tint === "primary"
        ? "text-[#c9d5ff]"
        : tint === "ink"
          ? "text-[#f4f7fb]/85"
          : "text-[#f4f7fb]/55";
  return (
    <Text
      className={cn("text-[10.5px] font-semibold uppercase", color, className)}
      style={{ letterSpacing: 2.2 }}
    >
      {children}
    </Text>
  );
}

export function Display({
  children,
  className,
  size = "xl",
  italic = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  size?: "lg" | "xl" | "2xl" | "3xl";
  italic?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const sizes: Record<string, string> = {
    lg: "text-[28px] leading-[34px]",
    xl: "text-[36px] leading-[40px]",
    "2xl": "text-[44px] leading-[46px]",
    "3xl": "text-[60px] leading-[58px]",
  };
  return (
    <Text
      className={cn(sizes[size], "text-[#f4f7fb]", className)}
      style={[
        DISPLAY_FONT,
        { fontWeight: "500", letterSpacing: -0.6 },
        italic ? { fontStyle: "italic" } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// DATE RIBBON — replaces brand-pill on every screen.
// ──────────────────────────────────────────────────────────────────────────
const DAY_NAME = new Intl.DateTimeFormat("it-IT", { weekday: "long" });
const DAY_FULL = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
});

export function DateRibbon({
  trailing,
  greeting,
}: {
  trailing?: ReactNode;
  greeting?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const weekday = DAY_NAME.format(today);
  const date = DAY_FULL.format(today);

  return (
    <View className="flex-row items-center gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        <View className="h-1.5 w-1.5 rounded-full bg-[#f0d8b9]" />
        <Text
          className="text-[11px] font-medium uppercase text-[#f4f7fb]/60"
          style={{ letterSpacing: 1.6 }}
          numberOfLines={1}
        >
          {weekday} · {date}
        </Text>
      </View>
      {greeting ? (
        <Text className="text-[11px] font-medium text-[#f4f7fb]/55">
          {greeting}
        </Text>
      ) : null}
      {trailing}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// PAGE HEADER — editorial: eyebrow + serif title
// ──────────────────────────────────────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  serif = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  serif?: boolean;
}) {
  return (
    <View className="flex-row items-end gap-4">
      <View className="min-w-0 flex-1">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {serif ? (
          <Display size="2xl" className="mt-2 pr-1">
            {title}
          </Display>
        ) : (
          <Text
            className="mt-2 text-[34px] font-bold leading-[38px] text-[#f4f7fb]"
            style={{ letterSpacing: -0.4 }}
          >
            {title}
          </Text>
        )}
        {subtitle ? (
          <Text className="mt-3 text-[14.5px] leading-[22px] text-[#f4f7fb]/65">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ──────────────────────────────────────────────────────────────────────────
export function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon?: LucideIcon;
  label: string;
  action?: ReactNode;
}) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        {Icon ? (
          <Icon size={13} color="rgba(244,247,251,0.5)" strokeWidth={2.2} />
        ) : null}
        <Eyebrow>{label}</Eyebrow>
      </View>
      {action}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MEAL STRIP — la "firma" del prodotto
// ──────────────────────────────────────────────────────────────────────────
type MealStripStep = {
  key: string;
  time?: string;
  state: "past" | "current" | "future";
  hue?: string;
};

export function MealStrip({
  steps,
  align = "flex-start",
}: {
  steps: MealStripStep[];
  align?: "flex-start" | "space-between";
}) {
  const pulse = useSharedValue(0);
  const hasCurrentStep = steps.some((step) => step.state === "current");
  useEffect(() => {
    if (!hasCurrentStep) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse, hasCurrentStep]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + pulse.value * 0.4,
    transform: [{ scale: 0.9 + pulse.value * 0.15 }],
  }));

  return (
    <View>
      <View className="absolute inset-x-2 top-[7px] h-px bg-[#f4f7fb]/15" />
      <View
        className="flex-row items-center"
        style={{
          justifyContent: align === "space-between" ? "space-between" : "flex-start",
          gap: align === "space-between" ? 0 : 18,
        }}
      >
        {steps.map((step) => {
          const hue = step.hue ?? MOBILE_COLORS.cream;
          return (
            <View key={step.key} className="items-center">
              {step.state === "current" ? (
                <View className="h-[15px] w-[15px] items-center justify-center">
                  <Animated.View
                    style={[
                      pulseStyle,
                      {
                        position: "absolute",
                        width: 15,
                        height: 15,
                        borderRadius: 7.5,
                        backgroundColor: hue,
                        opacity: 0.32,
                      },
                    ]}
                  />
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: hue,
                    }}
                  />
                </View>
              ) : step.state === "past" ? (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: "rgba(244,247,251,0.85)",
                    marginVertical: 4,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    borderWidth: 1.2,
                    borderColor: "rgba(244,247,251,0.32)",
                    marginVertical: 4,
                  }}
                />
              )}
              {step.time ? (
                <Text
                  className={cn(
                    "mt-2 text-[10px] font-medium",
                    step.state === "current"
                      ? "text-[#f4f7fb]"
                      : step.state === "past"
                        ? "text-[#f4f7fb]/55"
                        : "text-[#f4f7fb]/35",
                  )}
                  style={{ letterSpacing: 0.4 }}
                >
                  {step.time}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TAB BAR — Liquid Glass capsule
// ──────────────────────────────────────────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Oggi",
    href: "/",
    icon: Home,
    match: (pathname) => pathname === "/" || pathname === "/index",
  },
  {
    label: "Nutrizione",
    href: "/nutrition",
    icon: Apple,
    match: (pathname) => pathname.startsWith("/nutrition"),
  },
  {
    label: "Eventi",
    href: "/events",
    icon: CalendarDays,
    match: (pathname) => pathname.startsWith("/events"),
  },
  {
    label: "Corsi",
    href: "/courses",
    icon: BookOpen,
    match: (pathname) => pathname.startsWith("/courses"),
  },
  {
    label: "Profilo",
    href: "/profile",
    icon: UserRound,
    match: (pathname) => pathname.startsWith("/profile"),
  },
];

export function GlassTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const renderItems = (
    <View className="flex-row items-center justify-between px-1.5 py-2">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <MotionPressable
            key={item.href}
            onPress={() => router.replace(item.href as never)}
            className={cn(
              "min-h-[48px] flex-1 items-center justify-center rounded-2xl px-1 py-2 active:opacity-80",
              active ? "bg-[#f4f7fb]/[0.10]" : "",
            )}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
          >
            <Icon
              size={19}
              color={active ? MOBILE_COLORS.ink : "rgba(244,247,251,0.5)"}
              strokeWidth={active ? 2.4 : 2}
            />
            <Text
              className={cn(
                "mt-1 text-[10.5px] font-semibold",
                active ? "text-[#f4f7fb]" : "text-[#f4f7fb]/50",
              )}
              style={{ letterSpacing: 0.2 }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </MotionPressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={["bottom"]}
      className="absolute inset-x-0 bottom-0 px-5 pb-2"
    >
      {HAS_LIQUID_GLASS ? (
        <View
          className="overflow-hidden rounded-[30px]"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.42,
            shadowRadius: 26,
          }}
        >
          {/* `isInteractive` was triggering a touch-displacement recompute on
             every frame of any scroll happening under the bar. Costly on iOS
             with a long FlatList scrolling beneath. Touch feedback is already
             handled by the `MotionPressable` items inside, so we don't need it. */}
          <GlassView
            glassEffectStyle="regular"
            colorScheme="dark"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 30 }]}
          />
          {/* extra dark scrim per leggibilità tab labels */}
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-[#0a1120]/40"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-0 top-0 h-px bg-[#f4f7fb]/18"
          />
          {renderItems}
        </View>
      ) : (
        <View
          className="overflow-hidden rounded-[30px]"
          style={{
            backgroundColor: "rgba(11,19,34,0.92)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.42,
            shadowRadius: 26,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(247,251,255,0.07)",
              "rgba(247,251,255,0.012)",
              "rgba(247,251,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            className="absolute inset-0"
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-0 top-0 h-px bg-[#f4f7fb]/14"
          />
          {renderItems}
        </View>
      )}
    </SafeAreaView>
  );
}
