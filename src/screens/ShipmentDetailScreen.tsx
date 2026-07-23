import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedEntrance } from "../components/common/AnimatedEntrance";
import { ReceiptCelebration } from "../components/common/ReceiptCelebration";
import { StatusBadge } from "../components/common/StatusBadge";
import { getPackageItemsByIds } from "../data/packageItems";
import { formatMoneyARS } from "../services/quote";
import { useApp, useThemeStore } from "../store";
import type { Shipment } from "../types/shipment";

function receiptCode(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `RB-${tail || "00000000"}`;
}

function deliveredAt(shipment: Shipment): string | null {
  const event = [...shipment.history]
    .reverse()
    .find((item) => item.status === "delivered");
  return event?.at ?? null;
}

function FeeRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  const colors = useThemeStore((state) => state.colors);
  return (
    <View style={styles.feeRow}>
      <Text
        style={[
          styles.feeLabel,
          { color: muted ? colors.textMuted : colors.textSecondary },
          bold && styles.feeBold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.feeValue,
          { color: colors.text },
          bold && styles.feeBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function ShipmentDetailScreen() {
  const { t, i18n } = useTranslation();
  const {
    selectedShipmentId,
    getShipment,
    setScreen,
    cancelShipment,
    openNewPackageFlow,
  } = useApp();
  const colors = useThemeStore((state) => state.colors);

  const shipment = selectedShipmentId
    ? getShipment(selectedShipmentId)
    : undefined;

  if (!shipment) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => setScreen("shipments")} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          {t("shipment.notFound")}
        </Text>
      </SafeAreaView>
    );
  }

  const items = getPackageItemsByIds(shipment.itemIds);
  const canCancel =
    shipment.status === "pending" || shipment.status === "assigned";
  const isReceipt = shipment.status === "delivered";
  const code = receiptCode(shipment.id);
  const deliveredDate = deliveredAt(shipment);
  const localeDate = deliveredDate
    ? new Date(deliveredDate).toLocaleString(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date(shipment.updatedAt).toLocaleString(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setScreen(isReceipt ? "client-map" : "shipments")}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>
          {isReceipt ? t("receipt.title") : t("shipment.detailTitle")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isReceipt ? (
          <AnimatedEntrance delay={40}>
            <View
              style={[
                styles.hero,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ReceiptCelebration>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  {t("receipt.heroTitle")}
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                  {t("receipt.heroSubtitle", {
                    destination: shipment.destination.title,
                  })}
                </Text>
                <View
                  style={[
                    styles.codePill,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <Text style={[styles.codeLabel, { color: colors.textMuted }]}>
                    {t("receipt.code")}
                  </Text>
                  <Text style={[styles.codeValue, { color: colors.text }]}>
                    {code}
                  </Text>
                </View>
                <Text style={[styles.deliveredAt, { color: colors.textSecondary }]}>
                  {t("receipt.deliveredAt", { date: localeDate })}
                </Text>
              </ReceiptCelebration>
            </View>
          </AnimatedEntrance>
        ) : (
          <AnimatedEntrance delay={40}>
            <StatusBadge status={shipment.status} />
          </AnimatedEntrance>
        )}

        <AnimatedEntrance delay={90}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("shipment.route")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: "#16A34A" }]} />
              <View style={styles.routeTextWrap}>
                <Text style={[styles.routeHint, { color: colors.textMuted }]}>
                  {t("search.from")}
                </Text>
                <Text style={[styles.routeLine, { color: colors.text }]}>
                  {shipment.origin.title}
                </Text>
              </View>
            </View>
            <View
              style={[styles.routeDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: "#2563EB" }]} />
              <View style={styles.routeTextWrap}>
                <Text style={[styles.routeHint, { color: colors.textMuted }]}>
                  {t("search.to")}
                </Text>
                <Text style={[styles.routeLine, { color: colors.text }]}>
                  {shipment.destination.title}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={140}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {isReceipt ? t("receipt.breakdown") : t("shipment.quote")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.quoteLine, { color: colors.textSecondary }]}>
              {t(
                shipment.speed === "express" ||
                  shipment.quote?.speed === "express"
                  ? "package.speedExpress"
                  : "package.speedNormal",
              )}
              {" · "}
              {shipment.quote.distanceKm} km · {shipment.quote.etaMinutes} min
            </Text>

            {isReceipt ? (
              <View style={styles.feeBlock}>
                <FeeRow
                  label={t("receipt.baseFee")}
                  value={formatMoneyARS(shipment.quote.baseFee)}
                  muted
                />
                <FeeRow
                  label={t("receipt.distanceFee")}
                  value={formatMoneyARS(shipment.quote.distanceFee)}
                  muted
                />
                <FeeRow
                  label={t("receipt.itemsFee")}
                  value={formatMoneyARS(shipment.quote.itemsFee)}
                  muted
                />
                {shipment.quote.serviceFee > 0 ? (
                  <FeeRow
                    label={t("receipt.serviceFee")}
                    value={formatMoneyARS(shipment.quote.serviceFee)}
                    muted
                  />
                ) : null}
                <View
                  style={[
                    styles.feeDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <FeeRow
                  label={t("receipt.total")}
                  value={formatMoneyARS(shipment.quote.total)}
                  bold
                />
              </View>
            ) : (
              <Text style={[styles.total, { color: colors.text }]}>
                {formatMoneyARS(shipment.quote.total)}
              </Text>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={190}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("trip.carryingItems")}
          </Text>
          <View style={styles.chips}>
            {items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Ionicons name={item.icon} size={14} color={colors.text} />
                <Text style={[styles.chipLabel, { color: colors.text }]}>
                  {t(item.nameKey)}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={240}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("shipment.driver")}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.routeLine, { color: colors.text }]}>
              {t(shipment.driverNameKey)}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {t(shipment.driverVehicleKey)} · ★ {shipment.driverRating}
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={290}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {t("shipment.timeline")}
          </Text>
          {shipment.history.map((event, index) => (
            <View key={`${event.at}-${index}`} style={styles.historyRow}>
              <View
                style={[
                  styles.historyDot,
                  {
                    backgroundColor:
                      event.status === "delivered"
                        ? colors.success
                        : colors.text,
                  },
                ]}
              />
              <View style={styles.historyText}>
                <Text style={[styles.historyStatus, { color: colors.text }]}>
                  {t(`shipment.status.${event.status}`)}
                </Text>
                <Text style={[styles.historyAt, { color: colors.textMuted }]}>
                  {new Date(event.at).toLocaleString(i18n.language)}
                </Text>
              </View>
            </View>
          ))}
        </AnimatedEntrance>

        <AnimatedEntrance delay={340}>
          {!isReceipt ? (
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setScreen("chat", shipment.id)}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={colors.primaryText}
              />
              <Text
                style={[styles.primaryBtnLabel, { color: colors.primaryText }]}
              >
                {t("shipment.chat")}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              isReceipt ? styles.primaryBtn : styles.secondaryBtn,
              isReceipt
                ? { backgroundColor: colors.primary }
                : { borderColor: colors.border },
            ]}
            onPress={openNewPackageFlow}
          >
            <Text
              style={[
                isReceipt ? styles.primaryBtnLabel : styles.secondaryBtnLabel,
                { color: isReceipt ? colors.primaryText : colors.text },
              ]}
            >
              {t("shipment.repeatHint")}
            </Text>
          </Pressable>

          {isReceipt ? (
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => setScreen("shipments")}
            >
              <Text style={[styles.secondaryBtnLabel, { color: colors.text }]}>
                {t("receipt.seeAll")}
              </Text>
            </Pressable>
          ) : null}

          {canCancel ? (
            <Pressable
              style={[styles.dangerBtn, { backgroundColor: colors.dangerBg }]}
              onPress={() => void cancelShipment(shipment.id)}
            >
              <Text style={[styles.dangerBtnLabel, { color: colors.danger }]}>
                {t("shipment.cancel")}
              </Text>
            </Pressable>
          ) : null}
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 40 },
  back: { padding: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 40, gap: 4 },
  empty: { marginTop: 40, textAlign: "center" },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    overflow: "visible",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  codePill: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 160,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  deliveredAt: {
    marginTop: 12,
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  routeRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  routeTextWrap: { flex: 1 },
  routeHint: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  routeDivider: {
    height: 1,
    marginVertical: 12,
    marginLeft: 22,
  },
  routeLine: { fontSize: 15, fontWeight: "600" },
  quoteLine: { fontSize: 14 },
  feeBlock: { marginTop: 12, gap: 8 },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: { fontSize: 13 },
  feeValue: { fontSize: 13, fontWeight: "600" },
  feeBold: { fontSize: 16, fontWeight: "800" },
  feeDivider: { height: 1, marginVertical: 4 },
  total: { marginTop: 8, fontSize: 24, fontWeight: "800" },
  meta: { fontSize: 13, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: { fontSize: 12, fontWeight: "600" },
  historyRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  historyText: { flex: 1 },
  historyStatus: { fontSize: 14, fontWeight: "700" },
  historyAt: { fontSize: 12, marginTop: 2 },
  primaryBtn: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnLabel: { fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnLabel: { fontWeight: "600" },
  dangerBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerBtnLabel: { fontWeight: "700" },
});
