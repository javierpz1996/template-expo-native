import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAppStore, useThemeStore } from "../../store";
import { formatI18nTemplate } from "../../utils/formatI18nTemplate";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NotificationToast() {
  const { t } = useTranslation();
  const toast = useAppStore((state) => state.toast);
  const dismissToast = useAppStore((state) => state.dismissToast);
  const setScreen = useAppStore((state) => state.setScreen);
  const colors = useThemeStore((state) => state.colors);
  const progress = useSharedValue(0);

  const isDelivered = toast?.titleKey === "notifications.deliveredTitle";

  useEffect(() => {
    if (!toast) {
      progress.value = withTiming(0, { duration: 180 });
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => dismissToast(), isDelivered ? 5200 : 4200);
    return () => clearTimeout(timer);
  }, [toast, dismissToast, progress, isDelivered]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -18 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  if (!toast) {
    return null;
  }

  const body = formatI18nTemplate(t(toast.bodyKey), toast.bodyParams ?? null);

  return (
    <AnimatedPressable
      style={[
        styles.toast,
        animatedStyle,
        {
          backgroundColor: isDelivered ? "#14532D" : colors.toastBg,
          borderColor: isDelivered ? "#22C55E" : "transparent",
          borderWidth: isDelivered ? 1 : 0,
        },
      ]}
      onPress={() => {
        if (toast.shipmentId) {
          setScreen("shipment-detail", toast.shipmentId);
        }
        dismissToast();
      }}
    >
      <View style={styles.row}>
        {isDelivered ? (
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={22} color="#4ADE80" />
          </View>
        ) : null}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{t(toast.titleKey)}</Text>
          <Text
            style={[
              styles.body,
              { color: isDelivered ? "#BBF7D0" : colors.toastBody },
            ]}
          >
            {body}
          </Text>
          {isDelivered ? (
            <Text style={styles.cta}>{t("receipt.toastCta")}</Text>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 100,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#86EFAC",
  },
});
