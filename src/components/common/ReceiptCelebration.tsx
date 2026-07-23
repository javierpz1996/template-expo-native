import { Ionicons } from "@expo/vector-icons";
import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const CONFETTI_COLORS = ["#16A34A", "#22C55E", "#4ADE80", "#FBBF24", "#86EFAC"];

const CONFETTI_PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: 8 + ((index * 17) % 84),
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: (index % 6) * 70,
  size: 5 + (index % 3) * 2,
  drift: (index % 2 === 0 ? -1 : 1) * (10 + (index % 4) * 5),
  duration: 1100 + (index % 5) * 180,
  square: index % 3 === 0,
}));

function ConfettiParticle({
  left,
  color,
  delay,
  size,
  drift,
  duration,
  square,
}: (typeof CONFETTI_PARTICLES)[number]) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.95,
    transform: [
      { translateY: -8 + progress.value * 100 },
      { translateX: progress.value * drift },
      { rotate: `${progress.value * 280}deg` },
      { scale: 1 - progress.value * 0.35 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: `${left}%`,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: square ? 1 : size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function AnimatedSuccessCheck() {
  const scale = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 11,
      stiffness: 200,
      mass: 0.7,
    });
    ringScale.value = withSequence(
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withTiming(1.55, { duration: 520, easing: Easing.out(Easing.quad) }),
    );
    ringOpacity.value = withSequence(
      withTiming(0.55, { duration: 280 }),
      withTiming(0, { duration: 520 }),
    );
  }, [ringOpacity, ringScale, scale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.checkWrap}>
      <Animated.View style={[styles.checkRing, ringStyle]} />
      <Animated.View style={[styles.heroCheck, checkStyle]}>
        <Ionicons name="checkmark" size={32} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

type ReceiptCelebrationProps = {
  children: ReactNode;
};

export function ReceiptCelebration({ children }: ReceiptCelebrationProps) {
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.confettiLayer}>
        {CONFETTI_PARTICLES.map((particle) => (
          <ConfettiParticle key={particle.id} {...particle} />
        ))}
      </View>
      <AnimatedSuccessCheck />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    overflow: "visible",
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 2,
  },
  particle: {
    position: "absolute",
    top: 24,
  },
  checkWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    width: 72,
    height: 72,
  },
  checkRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#4ADE80",
  },
  heroCheck: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
});
