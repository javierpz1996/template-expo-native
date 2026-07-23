import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppRole } from "../../types/shipment";
import { useThemeStore } from "../../store/themeStore";
import { AnimatedEntrance } from "./AnimatedEntrance";

const DRAWER_WIDTH = 240;

type IconName = ComponentProps<typeof Ionicons>["name"];

type AppDrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSelectRole: (role: AppRole) => void;
  onOpenShipments?: () => void;
};

const MENU_ITEMS: {
  role?: AppRole;
  action?: "shipments";
  icon: IconName;
  titleKey: string;
}[] = [
  { action: "shipments", icon: "cube-outline", titleKey: "menu.shipmentsTitle" },
  { role: "driver", icon: "car-outline", titleKey: "menu.driverTitle" },
  { role: "admin", icon: "grid-outline", titleKey: "menu.adminTitle" },
];

export function AppDrawerMenu({
  visible,
  onClose,
  onSelectRole,
  onOpenShipments,
}: AppDrawerMenuProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((state) => state.colors);
  const [rendered, setRendered] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      progress.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setRendered)(false);
        }
      },
    );
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45,
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * -DRAWER_WIDTH }],
  }));

  if (!rendered) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          drawerStyle,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.surface,
          },
        ]}
      >
        <AnimatedEntrance delay={40} offsetY={8}>
          <Text style={[styles.brand, { color: colors.text }]}>RouteBox</Text>
        </AnimatedEntrance>

        <View style={styles.list}>
          {MENU_ITEMS.map((item, index) => (
            <AnimatedEntrance
              key={`${item.titleKey}-${visible}`}
              delay={80 + index * 70}
              offsetY={10}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: colors.surfaceMuted },
                ]}
                onPress={() => {
                  onClose();
                  if (item.action === "shipments") {
                    onOpenShipments?.();
                    return;
                  }
                  if (item.role) {
                    onSelectRole(item.role);
                  }
                }}
              >
                <View style={styles.itemRow}>
                  <Ionicons name={item.icon} size={20} color={colors.text} />
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {t(item.titleKey)}
                  </Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color={colors.text}
                  />
                </View>
              </Pressable>
            </AnimatedEntrance>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    elevation: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  list: {
    gap: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTitle: {
    marginLeft: 10,
    marginRight: 6,
    fontSize: 16,
    fontWeight: "600",
  },
});
