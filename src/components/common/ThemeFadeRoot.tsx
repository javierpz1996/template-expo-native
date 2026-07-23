import { useEffect, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  registerThemeFadeHandler,
  useThemeStore,
} from "../../store/themeStore";
import type { ThemeMode } from "../../theme/colors";

type ThemeFadeRootProps = {
  children: ReactNode;
};

export function ThemeFadeRoot({ children }: ThemeFadeRootProps) {
  const opacity = useSharedValue(1);
  const setMode = useThemeStore((state) => state.setMode);
  const setAnimatingTheme = useThemeStore((state) => state.setAnimatingTheme);
  const colors = useThemeStore((state) => state.colors);

  useEffect(() => {
    const fadeIn = () => {
      opacity.value = withTiming(
        1,
        {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setAnimatingTheme)(false);
          }
        },
      );
    };

    const applyThemeAndFadeIn = (nextMode: ThemeMode) => {
      void setMode(nextMode).finally(() => {
        fadeIn();
      });
    };

    const runFadeToggle = (nextMode: ThemeMode) => {
      setAnimatingTheme(true);
      opacity.value = withTiming(
        0,
        {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (!finished) {
            runOnJS(setAnimatingTheme)(false);
            return;
          }
          runOnJS(applyThemeAndFadeIn)(nextMode);
        },
      );
    };

    registerThemeFadeHandler(runFadeToggle);
    return () => registerThemeFadeHandler(null);
  }, [opacity, setAnimatingTheme, setMode]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.root,
        animatedStyle,
        { backgroundColor: colors.background },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
