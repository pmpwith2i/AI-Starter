import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  ActivitySquare,
  Bell,
  CheckCheck,
  ChefHat,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react-native";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useNotifications } from "../../hooks/notifications/use-notifications";
import { useRunningTasks } from "../../hooks/tasks/use-tasks";
import {
  describeProgress,
  isNutritionProgress,
  progressRatio,
} from "../../lib/nutrition/task-progress";

export type NotificationsPanelHandle = {
  open: () => void;
  close: () => void;
};

const TASK_LABEL: Record<string, { label: string; subtitle: string; icon: LucideIcon }> = {
  nutrition_plan_generation: {
    label: "Generazione piano nutrizionale",
    subtitle: "Sto cucinando il tuo piano…",
    icon: Sparkles,
  },
  meal_regeneration: {
    label: "Rigenerazione pasto",
    subtitle: "Sto rigenerando un pasto del tuo piano…",
    icon: ChefHat,
  },
};

function describeTask(type: string) {
  return (
    TASK_LABEL[type] ?? {
      label: "Elaborazione AI",
      subtitle: "In corso…",
      icon: ActivitySquare,
    }
  );
}

function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.round(diff / 60_000);
  if (min < 1) return "ora";
  if (min < 60) return `${min}m fa`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.round(h / 24);
  return `${d}g fa`;
}

export const NotificationsPanel = forwardRef<NotificationsPanelHandle>(
  function NotificationsPanel(_, ref) {
    const router = useRouter();
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["75%"], []);

    const { data: tasksData, isPending: tasksPending } = useRunningTasks();
    const { data: notifsData, isPending: notifsPending } = useNotifications({
      page: 1,
      limit: 15,
      unreadOnly: false,
    });

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.snapToIndex(0),
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      ),
      [],
    );

    const tasks = tasksData?.data ?? [];
    const notifs = notifsData?.data ?? [];

    const handleTaskTap = useCallback(
      (refEntityId: string | null, type: string) => {
        sheetRef.current?.close();
        if (
          refEntityId &&
          (type === "nutrition_plan_generation" || type === "meal_regeneration")
        ) {
          router.push({
            pathname: "/nutrition/[planId]",
            params: { planId: refEntityId },
          });
        }
      },
      [router],
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#101a2b" }}
        handleIndicatorStyle={{
          backgroundColor: "rgba(216,227,244,0.34)",
          width: 36,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Bell size={18} color="rgba(247,251,255,0.85)" strokeWidth={2.2} />
              <Text className="text-lg font-bold tracking-tight text-[#f7fbff]">
                Notifiche
              </Text>
            </View>
            <Pressable
              onPress={() => sheetRef.current?.close()}
              className="rounded-full bg-[#f7fbff]/10 p-2 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Chiudi"
              hitSlop={6}
            >
              <X size={16} color="rgba(247,251,255,0.85)" strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* In corso */}
          <Text className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/55">
            In corso
          </Text>
          {tasksPending && tasks.length === 0 ? (
            <SkeletonRow />
          ) : tasks.length === 0 ? (
            <View className="rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/[0.04] p-4">
              <Text className="text-sm text-[#f7fbff]/55">
                Nessuna elaborazione in corso.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onPress={() =>
                    handleTaskTap(task.refEntityId ?? null, task.type)
                  }
                />
              ))}
            </View>
          )}

          {/* Recenti */}
          <Text className="mb-3 mt-7 text-xs font-semibold uppercase tracking-[2px] text-[#f7fbff]/55">
            Recenti
          </Text>
          {notifsPending && notifs.length === 0 ? (
            <SkeletonRow />
          ) : notifs.length === 0 ? (
            <View className="rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/[0.04] p-4">
              <Text className="text-sm text-[#f7fbff]/55">
                Nessuna notifica recente.
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {notifs.map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

function TaskRow({
  task,
  onPress,
}: {
  task: NonNullable<ReturnType<typeof useRunningTasks>["data"]>["data"][number];
  onPress: () => void;
}) {
  const meta = describeTask(task.type);
  const Icon = meta.icon;

  // Plan-generation tasks expose structured progress; meal regen does not.
  const progress = isNutritionProgress(task.progress) ? task.progress : null;
  const ratio = progressRatio(progress);
  const subtitle = progress ? describeProgress(progress) : meta.subtitle;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-[#7ddac2]/30 bg-[#7ddac2]/10 p-4 active:opacity-90"
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#7ddac2]/18">
          <Icon size={18} color="#7ddac2" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-sm font-semibold text-[#f7fbff]">
              {meta.label}
            </Text>
            {progress ? (
              <Text className="text-[11px] font-semibold text-[#cdf6e8]">
                {progress.completedDays}/{progress.totalDays}
              </Text>
            ) : null}
          </View>
          <Text
            className="mt-0.5 text-xs text-[#f7fbff]/65"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <ActivityIndicator color="#7ddac2" size="small" />
      </View>
      {progress ? (
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f7fbff]/10">
          <View
            className="h-1.5 rounded-full bg-[#7ddac2]"
            style={{ width: `${Math.max(4, ratio * 100)}%` }}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

function NotificationRow({
  notification,
}: {
  notification: NonNullable<
    ReturnType<typeof useNotifications>["data"]
  >["data"][number];
}) {
  const isReady = notification.type === "nutrition_plan_ready";
  const isMealRegen = notification.type === "meal_regenerated";
  const isFailed =
    notification.type === "nutrition_plan_failed" ||
    notification.type === "meal_regeneration_failed";

  let Icon: LucideIcon = Bell;
  let iconColor = "rgba(247,251,255,0.7)";
  let iconBg = "bg-[#f7fbff]/10";
  if (isReady) {
    Icon = Sparkles;
    iconColor = "#7ddac2";
    iconBg = "bg-[#7ddac2]/18";
  } else if (isMealRegen) {
    Icon = ChefHat;
    iconColor = "#8fc7e8";
    iconBg = "bg-[#8fc7e8]/18";
  } else if (isFailed) {
    Icon = ActivitySquare;
    iconColor = "#ec8f64";
    iconBg = "bg-[#ec8f64]/18";
  }

  return (
    <View
      className={
        notification.read
          ? "flex-row items-start gap-3 rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/[0.04] p-4"
          : "flex-row items-start gap-3 rounded-2xl border border-[#d8e3f4]/20 bg-[#f7fbff]/[0.08] p-4"
      }
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}
      >
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          {!notification.read ? (
            <View className="h-2 w-2 rounded-full bg-[#7c95ff]" />
          ) : null}
          <Text className="flex-1 text-sm font-semibold text-[#f7fbff]">
            {notification.title}
          </Text>
        </View>
        {notification.body ? (
          <Text className="mt-1 text-xs leading-relaxed text-[#f7fbff]/65">
            {notification.body}
          </Text>
        ) : null}
        <Text className="mt-1.5 text-[10px] font-medium text-[#f7fbff]/40">
          {relativeTime(notification.createdAt)}
        </Text>
      </View>
      {notification.read ? (
        <CheckCheck size={14} color="rgba(247,251,255,0.4)" strokeWidth={2.2} />
      ) : null}
    </View>
  );
}

function SkeletonRow() {
  return (
    <View className="rounded-2xl border border-[#d8e3f4]/15 bg-[#f7fbff]/[0.04] p-4">
      <View className="h-4 w-2/3 rounded-md bg-[#f7fbff]/10" />
      <View className="mt-2 h-3 w-1/2 rounded-md bg-[#f7fbff]/[0.05]" />
    </View>
  );
}
