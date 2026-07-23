import { Platform, View, type ViewProps } from "react-native";
import {
  GlassView as ExpoGlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

export function canUseLiquidGlass(): boolean {
  return (
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable()
  );
}

export function GlassView(props: ViewProps & Record<string, unknown>) {
  if (!canUseLiquidGlass()) {
    return <View {...props} />;
  }
  return <ExpoGlassView {...props} />;
}
