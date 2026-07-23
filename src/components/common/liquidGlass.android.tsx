import { View, type ViewProps } from "react-native";

/** Android: sin glass nativo (evita crash en APK). */
export function canUseLiquidGlass(): boolean {
  return false;
}

export function GlassView(props: ViewProps) {
  return <View {...props} />;
}
