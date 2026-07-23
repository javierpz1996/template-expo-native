import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getPackageItemsByIds,
  PACKAGE_DRIVER,
} from "../../data/packageItems";
import { canUseLiquidGlass, GlassView } from "../common/liquidGlass";
import { MapControlButton } from "./MapControlButton";

type MapControlsProps = {
  onDriveOverview?: () => void;
  onDriveFollow3d?: () => void;
  onStartPackage?: () => void;
  onClearRoute?: () => void;
  onOpenShipments?: () => void;
  onOpenChat?: () => void;
  showDriveActions?: boolean;
  showStartPackage?: boolean;
  showClearRoute?: boolean;
  showMyShipments?: boolean;
  showPackageDelivery?: boolean;
  packageProgress?: number;
  packageRemainingSeconds?: number;
  cargoItemIds?: string[];
  driveActionsDisabled?: boolean;
  driveOverviewLabel?: string;
  driveFollow3dLabel?: string;
  isAnimatingMarker?: boolean;
  locationError?: string | null;
};

const isIOS = Platform.OS === "ios";
const useGlass = canUseLiquidGlass();

function getLiveStage(progress: number): 0 | 1 | 2 {
  if (progress < 0.12) {
    return 0;
  }
  if (progress < 0.82) {
    return 1;
  }
  return 2;
}

function PackageDeliveryPanel({
  progress,
  remainingSeconds,
  cargoItemIds,
  onOpenChat,
}: {
  progress: number;
  remainingSeconds: number;
  cargoItemIds: string[];
  onOpenChat?: () => void;
}) {
  const { t } = useTranslation();
  const progressPercent = Math.round(progress * 100);
  const stage = getLiveStage(progress);
  const stageLabel =
    stage === 0
      ? t("trip.stagePickedUp")
      : stage === 1
        ? t("trip.stageOnRoute")
        : t("trip.stageNearby");
  const etaLabel =
    remainingSeconds <= 0
      ? t("trip.arriving")
      : t("trip.secondsLeft", { count: remainingSeconds });
  const cargoItems = getPackageItemsByIds(cargoItemIds);
  const stages = [
    t("trip.stagePickedUp"),
    t("trip.stageOnRoute"),
    t("trip.stageNearby"),
  ] as const;

  const body = (
    <View style={styles.deliveryContent}>
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryTitleRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>{t("trip.live")}</Text>
          </View>
          <Text style={styles.deliveryTitle}>{stageLabel}</Text>
        </View>
        <Text style={styles.deliveryEta}>{etaLabel}</Text>
      </View>

      <View style={styles.stagesRow}>
        {stages.map((label, index) => {
          const done = index <= stage;
          const active = index === stage;
          return (
            <View key={label} style={styles.stageItem}>
              <View
                style={[
                  styles.stageDot,
                  done && styles.stageDotDone,
                  active && styles.stageDotActive,
                ]}
              />
              <Text
                style={[
                  styles.stageLabel,
                  done && styles.stageLabelDone,
                  active && styles.stageLabelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {index < stages.length - 1 ? (
                <View
                  style={[
                    styles.stageConnector,
                    index < stage && styles.stageConnectorDone,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.driverBlock}>
        <View style={styles.driverAvatar}>
          <Ionicons name="car" size={18} color="#ffffff" />
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{t(PACKAGE_DRIVER.nameKey)}</Text>
          <Text style={styles.driverMeta}>
            {t(PACKAGE_DRIVER.vehicleKey)} · ★ {PACKAGE_DRIVER.rating}
          </Text>
        </View>
      </View>

      {cargoItems.length > 0 ? (
        <View style={styles.cargoBlock}>
          <Text style={styles.cargoTitle}>{t("trip.carryingItems")}</Text>
          <View style={styles.cargoList}>
            {cargoItems.map((item) => (
              <View key={item.id} style={styles.cargoChip}>
                <Ionicons name={item.icon} size={14} color="#1C1C1E" />
                <Text style={styles.cargoChipLabel}>{t(item.nameKey)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {t("trip.progress", { percent: progressPercent })}
      </Text>

      {onOpenChat ? (
        <Pressable style={styles.chatBtn} onPress={onOpenChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
          <Text style={styles.chatBtnLabel}>{t("shipment.chat")}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!isIOS) {
    return (
      <View style={styles.deliveryCard}>
        <View style={[styles.deliveryGlass, styles.deliverySolidAndroid]}>
          {body}
        </View>
      </View>
    );
  }

  if (useGlass) {
    return (
      <View style={styles.deliveryCard}>
        <GlassView
          style={styles.deliveryGlass}
          glassEffectStyle="regular"
          colorScheme="light"
        >
          {body}
        </GlassView>
      </View>
    );
  }

  return (
    <View style={styles.deliveryCard}>
      <BlurView
        intensity={60}
        tint="systemUltraThinMaterialLight"
        style={styles.deliveryGlass}
      >
        <View style={styles.deliveryFallbackTint} />
        {body}
      </BlurView>
    </View>
  );
}

export function MapControls({
  onDriveOverview,
  onDriveFollow3d,
  onStartPackage,
  onClearRoute,
  onOpenShipments,
  onOpenChat,
  showDriveActions = false,
  showStartPackage = false,
  showClearRoute = false,
  showMyShipments = false,
  showPackageDelivery = false,
  packageProgress = 0,
  packageRemainingSeconds = 0,
  cargoItemIds = [],
  driveActionsDisabled = false,
  driveOverviewLabel,
  driveFollow3dLabel,
  isAnimatingMarker = false,
  locationError,
}: MapControlsProps) {
  const { t } = useTranslation();

  if (
    !showDriveActions &&
    !showStartPackage &&
    !showClearRoute &&
    !showMyShipments &&
    !showPackageDelivery &&
    !locationError
  ) {
    return null;
  }

  return (
    <SafeAreaView className="absolute bottom-6 left-4 right-4" edges={["bottom"]}>
      {locationError ? (
        <View className="mb-3 rounded-xl bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-700">{locationError}</Text>
        </View>
      ) : null}

      {showPackageDelivery ? (
        <PackageDeliveryPanel
          progress={packageProgress}
          remainingSeconds={packageRemainingSeconds}
          cargoItemIds={cargoItemIds}
          onOpenChat={onOpenChat}
        />
      ) : null}

      {showClearRoute && onClearRoute ? (
        <MapControlButton
          label={t("controls.clearRoute")}
          icon="close-outline"
          onPress={onClearRoute}
          variant="danger"
          className="mb-3"
        />
      ) : null}

      {showMyShipments && onOpenShipments ? (
        <MapControlButton
          label={t("shipment.myShipments")}
          icon="list-outline"
          onPress={onOpenShipments}
          variant="secondary"
          className="mb-3"
        />
      ) : null}

      {showStartPackage && onStartPackage ? (
        <MapControlButton
          label={t("controls.startPackage")}
          icon="cube-outline"
          onPress={onStartPackage}
          variant="primary"
          className="mb-3"
        />
      ) : null}

      {showDriveActions && onDriveOverview ? (
        <MapControlButton
          label={driveOverviewLabel ?? t("controls.driveOverview")}
          icon="walk"
          onPress={onDriveOverview}
          variant="success"
          loading={isAnimatingMarker && !driveActionsDisabled}
          disabled={driveActionsDisabled}
        />
      ) : null}

      {showDriveActions && onDriveFollow3d ? (
        <MapControlButton
          label={driveFollow3dLabel ?? t("controls.driveFollow", { destination: "" })}
          icon="car"
          onPress={onDriveFollow3d}
          variant="accent"
          loading={isAnimatingMarker && !driveActionsDisabled}
          disabled={driveActionsDisabled}
          className="mt-3"
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deliveryCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 4,
  },
  deliveryGlass: {
    borderRadius: 20,
    overflow: "hidden",
  },
  deliverySolidAndroid: {
    backgroundColor: "#FFFFFF",
  },
  deliveryFallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  deliveryContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deliveryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(22, 163, 74, 0.14)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#15803D",
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    flexShrink: 1,
  },
  deliveryEta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  stagesRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stageItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(28, 28, 30, 0.18)",
  },
  stageDotDone: {
    backgroundColor: "#16A34A",
  },
  stageDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#15803D",
  },
  stageLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
  },
  stageLabelDone: {
    color: "#6B7280",
  },
  stageLabelActive: {
    color: "#15803D",
    fontWeight: "700",
  },
  stageConnector: {
    position: "absolute",
    top: 4,
    left: "55%",
    right: "-45%",
    height: 2,
    backgroundColor: "rgba(28, 28, 30, 0.12)",
  },
  stageConnectorDone: {
    backgroundColor: "#86EFAC",
  },
  driverBlock: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  driverMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  cargoBlock: {
    marginTop: 12,
  },
  cargoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  cargoList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cargoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(28, 28, 30, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cargoChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1C1E",
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
  chatBtn: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#1C1C1E",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chatBtnLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
