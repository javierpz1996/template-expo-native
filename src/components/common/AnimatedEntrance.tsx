import { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type AnimatedEntranceProps = {
  children: ReactNode;
  delay?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
};

/** Entrada suave con fade + leve desplazamiento vertical. */
export function AnimatedEntrance({
  children,
  delay = 0,
  offsetY = 14,
  style,
}: AnimatedEntranceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offsetY }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
