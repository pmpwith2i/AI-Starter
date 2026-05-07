import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import * as Haptics from "expo-haptics";
import { cssInterop } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

cssInterop(LinearGradient, { className: "style" });

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  gradient: readonly [string, string, string];
};

const SLIDES: readonly Slide[] = [
  {
    eyebrow: "Nutrizione",
    title: "Il tuo piano,\nogni settimana.",
    description:
      "Pasti generati su misura per gusti, condizioni cliniche e obiettivi.",
    gradient: ["#0d1424", "#13243b", "#7c95ff"] as const,
  },
  {
    eyebrow: "Specialisti",
    title: "Sempre\na portata.",
    description:
      "Oncologi, nutrizionisti, psicologi. Una conversazione lontana.",
    gradient: ["#101a2b", "#182f62", "#7c95ff"] as const,
  },
  {
    eyebrow: "Percorsi",
    title: "Cresci,\ngiorno per giorno.",
    description:
      "Corsi, eventi e percorsi guidati per il tuo benessere fisico ed emotivo.",
    gradient: ["#17243a", "#14324a", "#8fc7e8"] as const,
  },
];

export default function WelcomeScreen() {
  const scrollX = useSharedValue(0);
  const enterOpacity = useSharedValue(0);
  const [pageIndex, setPageIndex] = useState(0);
  const lastHapticPage = useRef(0);

  useEffect(() => {
    enterOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [enterOpacity]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (next !== lastHapticPage.current) {
        lastHapticPage.current = next;
        setPageIndex(next);
        void Haptics.selectionAsync();
      }
    },
    [],
  );

  const fadeStyle = useAnimatedStyle(() => ({ opacity: enterOpacity.value }));

  return (
    <View className="flex-1 bg-black">
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>
        <AnimatedScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {SLIDES.map((slide, index) => (
            <SlideView
              key={slide.title}
              slide={slide}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </AnimatedScrollView>

        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 top-0"
        >
          <SafeAreaView edges={["top"]} className="px-6 pt-2">
            <Text className="text-base font-semibold tracking-wide text-[#f7fbff]">
              Oncologo
            </Text>
          </SafeAreaView>
        </View>

        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 bottom-0"
        >
          <SafeAreaView edges={["bottom"]} className="px-6 pb-3">
            <View className="mb-7 flex-row items-center justify-center gap-2">
              {SLIDES.map((_, index) => (
                <Dot
                  key={index}
                  index={index}
                  scrollX={scrollX}
                  isActive={pageIndex === index}
                />
              ))}
            </View>

            <Link href="/login" asChild>
              <Pressable className="mb-3 rounded-full bg-[#f7fbff] py-4 active:opacity-90">
                <Text className="text-center text-base font-semibold text-[#0d1424]">
                  Accedi
                </Text>
              </Pressable>
            </Link>

            <Link href="/signup" asChild>
              <Pressable className="rounded-full border border-[#d8e3f4]/40 py-4 active:opacity-80">
                <Text className="text-center text-base font-semibold text-[#f7fbff]">
                  Registrati
                </Text>
              </Pressable>
            </Link>
          </SafeAreaView>
        </View>
      </Animated.View>
    </View>
  );
}

type SlideViewProps = {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
};

function SlideView({ slide, index, scrollX }: SlideViewProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const titleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], opacity };
  });

  const eyebrowStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [SCREEN_WIDTH * 0.5, 0, -SCREEN_WIDTH * 0.5],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], opacity };
  });

  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1">
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView edges={["top", "bottom"]} className="flex-1 px-6">
        <View className="flex-1 justify-end pb-56">
          <Animated.View style={eyebrowStyle}>
            <Text className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[#f7fbff]/70">
              {slide.eyebrow}
            </Text>
          </Animated.View>
          <Animated.View style={titleStyle}>
            <Text className="text-5xl font-bold leading-[1.05] tracking-tight text-[#f7fbff]">
              {slide.title}
            </Text>
            <Text className="mt-5 max-w-[88%] text-base leading-relaxed text-[#f7fbff]/80">
              {slide.description}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

type DotProps = {
  index: number;
  scrollX: SharedValue<number>;
  isActive: boolean;
};

function Dot({ index, scrollX }: DotProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];
  const style = useAnimatedStyle(() => {
    const w = interpolate(
      scrollX.value,
      inputRange,
      [8, 28, 8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    );
    return { width: w, opacity };
  });
  return <Animated.View style={style} className="h-2 rounded-full bg-[#f7fbff]" />;
}
