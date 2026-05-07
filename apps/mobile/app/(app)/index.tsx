import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import {
  Apple,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  HeartPulse,
  MessageCircleHeart,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

cssInterop(LinearGradient, { className: "style" });

import { NextAppointmentWidget } from "../../components/appointments/next-appointment-widget";
import { RecommendedCoursesWidget } from "../../components/courses/recommended-courses-widget";
import { NextEventWidget } from "../../components/events/next-event-widget";
import { UpcomingEventsWidget } from "../../components/events/upcoming-events-widget";
import {
  NotificationsPanel,
  type NotificationsPanelHandle,
} from "../../components/notifications/notifications-panel";
import { PlanGenerationBanner } from "../../components/nutrition/plan-generation-banner";
import { TodayWidget } from "../../components/nutrition/today-widget";
import {
  AppBackdrop,
  DateRibbon,
  Display,
  Eyebrow,
  GlassTabBar,
  LiquidGlassSurface,
  MOBILE_COLORS,
  MotionPressable,
  SectionHeader,
} from "../../components/ui/mobile-chrome";
import { appointmentKeys } from "../../hooks/appointments/appointment.keys";
import { useBalance } from "../../hooks/credits/use-credits";
import { creditsKeys } from "../../hooks/credits/credits.keys";
import { coursesKeys } from "../../hooks/courses/courses.keys";
import { eventsKeys } from "../../hooks/events/events.keys";
import { useUnreadCount } from "../../hooks/notifications/use-notifications";
import { notificationsKeys } from "../../hooks/notifications/notifications.keys";
import { nutritionKeys } from "../../hooks/nutrition/nutrition.keys";
import { shoppingListKeys } from "../../hooks/nutrition/shopping-list.keys";
import { useScreenRefresh } from "../../hooks/realtime/use-screen-refresh";
import { tasksKeys } from "../../hooks/tasks/tasks.keys";
import { useAuth } from "../../lib/auth/auth-context";
import { useGenderedText } from "../../lib/gender/use-gender";

type QuickAction = {
  title: string;
  label: string;
  href?: string;
  icon: typeof Apple;
  color: string;
  bg: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Specialisti",
    label: "Trova un professionista e prenota",
    href: "/healthcare",
    icon: Stethoscope,
    color: MOBILE_COLORS.primary,
    bg: "bg-[#7c95ff]/14",
  },
  {
    title: "Eventi",
    label: "Workshop e incontri dal vivo",
    href: "/events",
    icon: CalendarDays,
    color: MOBILE_COLORS.events,
    bg: "bg-[#8fc7e8]/12",
  },
  {
    title: "Corsi",
    label: "Percorsi guidati on-demand",
    href: "/courses",
    icon: BookOpen,
    color: MOBILE_COLORS.courses,
    bg: "bg-[#f0d8b9]/12",
  },
  {
    title: "Onciro",
    label: "Assistente clinico, in arrivo",
    icon: MessageCircleHeart,
    color: MOBILE_COLORS.support,
    bg: "bg-[#aabaff]/12",
  },
];

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5 || h >= 22) return "Buonanotte";
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function formatRelativeReset(iso: string): string {
  const reset = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.ceil((reset - now) / (1000 * 60 * 60 * 24)));
  if (days === 0) return "rinnovo oggi";
  if (days === 1) return "rinnovo domani";
  return `rinnovo fra ${days} giorni`;
}

// Domains rendered on the home screen — pull-to-refresh invalidates these.
// Module-scoped so the array reference stays stable across renders.
const HOME_DOMAINS = [
  notificationsKeys.all,
  creditsKeys.all,
  nutritionKeys.all,
  shoppingListKeys.all,
  tasksKeys.all,
  eventsKeys.all,
  coursesKeys.all,
  appointmentKeys.all,
] as const;

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const panelRef = useRef<NotificationsPanelHandle>(null);
  const fallbackName = useGenderedText("Benvenuta", "Benvenuto");
  const firstName = user?.firstName ?? fallbackName;
  const { refreshing, onRefresh } = useScreenRefresh(HOME_DOMAINS);

  return (
    <AppBackdrop>
      <StatusBar style="light" />

      <SafeAreaView edges={["top"]} className="px-5 pt-1">
        <DateRibbon
          trailing={<BellBadge onPress={() => panelRef.current?.open()} />}
        />
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-36 pt-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(247,251,255,0.72)"
          />
        }
      >
        {/* HERO ─ editorial greeting */}
        <View>
          <Eyebrow tint="warm">{timeOfDayGreeting()}</Eyebrow>
          <Display size="3xl" className="mt-3 pr-2">
            {firstName}
            <Text style={{ color: "#f0d8b9" }}>.</Text>
          </Display>
          <Text className="mt-4 text-[14.5px] leading-[22px] text-[#f4f7fb]/65">
            Il tuo spazio quotidiano per pasti, appuntamenti e percorsi di
            supporto.
          </Text>
        </View>

        {/* Credits ticket — own row, no shift on hero */}
        <CreditsTicket />


        <PlanGenerationBanner />

        <TodayWidget />

        <NextAppointmentWidget />

        <NextEventWidget />

        <View className="mt-9">
          <SectionHeader icon={Sparkles} label="Esplora" />
          <View className="gap-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionRow key={action.title} action={action} />
            ))}
          </View>
        </View>

        <UpcomingEventsWidget />

        <RecommendedCoursesWidget />

        <View className="mt-10">
          <SectionHeader icon={HeartPulse} label="Sessione" />
          <LiquidGlassSurface radius={24} className="px-4 py-4">
            <Pressable
              onPress={() => void logout()}
              className="flex-row items-center justify-between rounded-2xl px-1 py-1 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Esci"
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-semibold text-[#f4f7fb]">
                  Sessione attiva
                </Text>
                <Text className="mt-1 text-[12px] leading-[18px] text-[#f4f7fb]/50">
                  Esci solo se vuoi cambiare account su questo dispositivo.
                </Text>
              </View>
              <Text className="text-[13px] font-semibold text-[#f4f7fb]/70">
                Esci
              </Text>
            </Pressable>
          </LiquidGlassSurface>
        </View>
      </ScrollView>

      <GlassTabBar />
      <NotificationsPanel ref={panelRef} />
    </AppBackdrop>
  );
}

function BellBadge({ onPress }: { onPress: () => void }) {
  const { data } = useUnreadCount();
  const count = data?.unreadCount ?? 0;
  const label = count > 99 ? "99+" : String(count);

  return (
    <Pressable
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-full border border-[#d8e3f4]/14 bg-[#f4f7fb]/[0.05] active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `Notifiche, ${count} non lette` : "Notifiche"
      }
    >
      <Bell size={17} color={MOBILE_COLORS.ink} strokeWidth={1.9} />
      {count > 0 ? (
        <View className="absolute right-1.5 top-1.5 h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#ec8f64] px-1">
          <Text className="text-[8.5px] font-bold leading-none text-[#0b1322]">
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Editorial credits ticket — full-width row sotto l'hero. Mostra:
 *   ✺ I TUOI CREDITI · 487 · barra periodo · rinnovo fra 26 giorni
 * Tap → vai alla schermata Crediti.
 */
function CreditsTicket() {
  const { data: balance, isPending, isError } = useBalance();

  if (isPending) {
    return (
      <View className="mt-6 h-[78px] overflow-hidden rounded-[22px] border border-[#f0d8b9]/10 bg-[#1a2030]" />
    );
  }
  if (isError || !balance) return null;

  const { period, total, unlimited, plan } = balance;
  const limit = period.limit ?? 0;
  const used = period.used ?? 0;
  const pct = unlimited
    ? 1
    : limit > 0
      ? Math.max(0.04, Math.min(1, (limit - used) / limit))
      : 0;

  return (
    <Pressable
      className="mt-6 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${total ?? 0} crediti disponibili`}
    >
      <View
        className="overflow-hidden rounded-[22px]"
        style={{
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(240,216,185,0.30)",
          backgroundColor: "#1c2235",
          shadowColor: "#0a1120",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.32,
          shadowRadius: 22,
        }}
      >
        {/* Aurora wash interno: cream sx → trasparente dx */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(240,216,185,0.20)",
            "rgba(240,216,185,0.05)",
            "rgba(11,19,34,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Edge top-light per definizione */}
        <View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 h-px bg-[#f0d8b9]/24"
        />

        <View className="flex-row items-center gap-3.5 px-4 py-3.5">
          {/* Spark medallion */}
          <View className="relative h-12 w-12 items-center justify-center rounded-2xl">
            <View
              pointerEvents="none"
              className="absolute inset-0 rounded-2xl"
              style={{ backgroundColor: "rgba(240,216,185,0.13)" }}
            />
            <View
              pointerEvents="none"
              className="absolute inset-0 rounded-2xl"
              style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(240,216,185,0.42)",
              }}
            />
            <Zap
              size={20}
              color="#f0d8b9"
              fill="#f0d8b9"
              strokeWidth={1.6}
            />
          </View>

          {/* Body */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Eyebrow tint="warm">Crediti</Eyebrow>
              {plan?.code ? (
                <>
                  <View className="h-1 w-1 rounded-full bg-[#f0d8b9]/40" />
                  <Text
                    className="text-[9.5px] font-semibold uppercase text-[#f4f7fb]/40"
                    style={{ letterSpacing: 1.2 }}
                  >
                    Piano {plan.code}
                  </Text>
                </>
              ) : null}
            </View>
            <View className="mt-0.5 flex-row items-baseline gap-1.5">
              <Display size="lg">{unlimited ? "∞" : (total ?? 0)}</Display>
              <Text className="text-[12px] font-medium text-[#f4f7fb]/55">
                {unlimited
                  ? "illimitati"
                  : (total ?? 0) === 1
                    ? "credito"
                    : "crediti"}
              </Text>
            </View>
            {/* Period progress bar */}
            {!unlimited && limit > 0 ? (
              <View className="mt-2.5 flex-row items-center gap-2">
                <View className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#f4f7fb]/10">
                  <LinearGradient
                    colors={["#f0d8b9", "#e7c397"] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 3,
                      width: `${pct * 100}%`,
                      borderRadius: 999,
                    }}
                  />
                </View>
                <Text
                  className="text-[9.5px] font-medium uppercase text-[#f4f7fb]/45"
                  style={{ letterSpacing: 1.1 }}
                  numberOfLines={1}
                >
                  {formatRelativeReset(period.resetsAt)}
                </Text>
              </View>
            ) : (
              <Text
                className="mt-1 text-[9.5px] font-medium uppercase text-[#f4f7fb]/45"
                style={{ letterSpacing: 1.1 }}
              >
                {formatRelativeReset(period.resetsAt)}
              </Text>
            )}
          </View>

          {/* Trailing arrow */}
          <View className="h-9 w-9 items-center justify-center rounded-full bg-[#f4f7fb]/[0.06]">
            <ArrowUpRight
              size={14}
              color="rgba(244,247,251,0.65)"
              strokeWidth={2.2}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function QuickActionRow({ action }: { action: QuickAction }) {
  const router = useRouter();
  const Icon = action.icon;
  const enabled = Boolean(action.href);

  return (
    <MotionPressable
      onPress={enabled ? () => router.push(action.href as never) : undefined}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={enabled ? action.title : `${action.title}, in arrivo`}
    >
      <LiquidGlassSurface radius={22} className="px-4 py-4">
        <View className="flex-row items-center gap-4">
          <View
            className={`h-11 w-11 items-center justify-center rounded-2xl ${action.bg}`}
          >
            <Icon size={20} color={action.color} strokeWidth={2.1} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-semibold text-[#f4f7fb]">
              {action.title}
            </Text>
            <Text
              className="mt-0.5 text-[12.5px] leading-[18px] text-[#f4f7fb]/55"
              numberOfLines={1}
            >
              {action.label}
            </Text>
          </View>
          {enabled ? (
            <ChevronRight
              size={15}
              color="rgba(244,247,251,0.4)"
              strokeWidth={2}
            />
          ) : (
            <Text
              className="text-[10px] font-semibold uppercase text-[#f4f7fb]/35"
              style={{ letterSpacing: 1.4 }}
            >
              In arrivo
            </Text>
          )}
        </View>
      </LiquidGlassSurface>
    </MotionPressable>
  );
}
