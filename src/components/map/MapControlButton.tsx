import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type {
  MapControlButtonProps,
  MapControlButtonVariant,
} from "../../types";
import { canUseLiquidGlass, GlassView } from "../common/liquidGlass";

const isIOS = Platform.OS === "ios";
const useGlass = canUseLiquidGlass();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const VARIANT_TINT: Record<MapControlButtonVariant, string | undefined> = {
  primary: undefined,
  secondary: "rgba(120, 120, 128, 0.45)",
  success: undefined,
  accent: undefined,
  danger: "rgba(239, 68, 68, 0.55)",
};

const CONTENT_COLOR: Record<MapControlButtonVariant, string> = {
  primary: "#1C1C1E",
  secondary: "#1C1C1E",
  success: "#1C1C1E",
  accent: "#1C1C1E",
  danger: "#B91C1C",
};

const ANDROID_SOLID_BG: Record<MapControlButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#F1F5F9",
  success: "#FFFFFF",
  accent: "#FFFFFF",
  danger: "#FEE2E2",
};

export function MapControlButton({
  label,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: MapControlButtonProps) {
  const contentColor = CONTENT_COLOR[variant];
  const isDanger = variant === "danger";
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = loading ? (
    <ActivityIndicator color={contentColor} />
  ) : (
    <View style={styles.labelRow}>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={contentColor}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
    </View>
  );

  const glassBody = !isIOS ? (
    <View
      style={[
        styles.glass,
        { backgroundColor: ANDROID_SOLID_BG[variant] },
      ]}
    >
      <View style={styles.content}>{content}</View>
    </View>
  ) : useGlass ? (
    <GlassView
      style={styles.glass}
      glassEffectStyle="regular"
      isInteractive
      tintColor={VARIANT_TINT[variant]}
      colorScheme="light"
    >
      <View style={styles.content}>{content}</View>
    </GlassView>
  ) : (
    <BlurView intensity={60} tint="systemUltraThinMaterialLight" style={styles.glass}>
      <View
        style={[
          styles.fallbackTint,
          variant === "secondary" && styles.fallbackTintSecondary,
          isDanger && styles.fallbackTintDanger,
        ]}
      />
      <View style={styles.content}>{content}</View>
    </BlurView>
  );

  return (
    <AnimatedPressable
      className={className}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => {
        if (!disabled && !loading) {
          scale.value = withSpring(0.96, { damping: 16, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
      }}
      style={[styles.wrapper, disabled && styles.disabled, animatedStyle]}
    >
      <View style={[styles.border, isDanger && styles.dangerBorder]}>
        {glassBody}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  disabled: {
    opacity: 0.45,
  },
  border: {
    borderRadius: 24,
    borderWidth: 0.7,
    borderColor: "rgba(56, 56, 56, 0.2)",
    overflow: "hidden",
  },
  dangerBorder: {
    borderColor: "rgba(185, 28, 28, 0.35)",
  },
  glass: {
    borderRadius: 22.5,
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontWeight: "600",
    color: "#1C1C1E",
    fontSize: 15,
  },
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  fallbackTintSecondary: {
    backgroundColor: "rgba(120, 120, 128, 0.35)",
  },
  fallbackTintDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.28)",
  },
});
