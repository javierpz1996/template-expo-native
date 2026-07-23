import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { DriveMode } from "../../hooks/useRouteDrive";
import { canUseLiquidGlass, GlassView } from "../common/liquidGlass";

type TripStatusCardProps = {
  visible: boolean;
  mode: DriveMode | null;
  progress: number;
  remainingSeconds: number;
};

const useGlass = canUseLiquidGlass();

export function TripStatusCard({
  visible,
  mode,
  progress,
  remainingSeconds,
}: TripStatusCardProps) {
  const { t } = useTranslation();

  if (!visible || !mode || mode === "package") {
    return null;
  }

  const isDriving = mode === "follow3d";
  const title = isDriving ? t("trip.driving") : t("trip.onTheWay");
  const icon = isDriving ? "car" : "walk";
  const progressPercent = Math.round(progress * 100);
  const etaLabel =
    remainingSeconds <= 0
      ? t("trip.arriving")
      : t("trip.secondsLeft", { count: remainingSeconds });

  const body = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={18} color="#1C1C1E" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.eta}>{etaLabel}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${progressPercent}%` }]}
        />
      </View>

      <Text style={styles.progressLabel}>
        {t("trip.progress", { percent: progressPercent })}
      </Text>
    </View>
  );

  if (useGlass) {
    return (
      <View style={styles.wrapper} pointerEvents="none">
        <GlassView
          style={styles.glass}
          glassEffectStyle="regular"
          colorScheme="light"
        >
          {body}
        </GlassView>
      </View>
    );
  }

  if (Platform.OS === "android") {
    return (
      <View style={styles.wrapper} pointerEvents="none">
        <View style={[styles.glass, styles.androidSolid]}>{body}</View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <BlurView
        intensity={60}
        tint="systemUltraThinMaterialLight"
        style={styles.glass}
      >
        <View style={styles.fallbackTint} />
        {body}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  glass: {
    borderRadius: 20,
    overflow: "hidden",
  },
  androidSolid: {
    backgroundColor: "#FFFFFF",
  },
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  eta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(28, 28, 30, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#1C1C1E",
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
});
