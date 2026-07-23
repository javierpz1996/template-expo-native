import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedEntrance } from "../components/common/AnimatedEntrance";
import { StatusBadge } from "../components/common/StatusBadge";
import { useApp } from "../store";
import { formatMoneyARS } from "../services/quote";
import type { Shipment } from "../types/shipment";

export function ShipmentsScreen() {
  const { t } = useTranslation();
  const {
    shipments,
    setScreen,
    markNotificationsRead,
    unreadCount,
    isOnline,
  } = useApp();

  const renderItem = ({
    item,
    index,
  }: {
    item: Shipment;
    index: number;
  }) => (
    <AnimatedEntrance delay={Math.min(index, 8) * 55} offsetY={16}>
      <Pressable
        style={styles.card}
        onPress={() => setScreen("shipment-detail", item.id)}
      >
        <View style={styles.cardTop}>
          <StatusBadge status={item.status} />
          <Text style={styles.price}>{formatMoneyARS(item.quote.total)}</Text>
        </View>
        <Text style={styles.route} numberOfLines={1}>
          {item.origin.title} → {item.destination.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.itemIds.length} {t("shipment.itemsShort")} ·{" "}
            {item.quote.distanceKm} km
          </Text>
          {!item.synced ? (
            <Text style={styles.offline}>{t("shipment.pendingSync")}</Text>
          ) : null}
        </View>
      </Pressable>
    </AnimatedEntrance>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backButton}
            onPress={() => setScreen("client-map")}
            hitSlop={8}
            accessibilityLabel={t("driver.backHome")}
          >
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>{t("shipment.myShipments")}</Text>
        </View>
        <Pressable
          onPress={() => void markNotificationsRead()}
          hitSlop={10}
        >
          <View>
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
            {unreadCount > 0 ? <View style={styles.dot} /> : null}
          </View>
        </Pressable>
      </View>

      {!isOnline ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{t("common.offlineBanner")}</Text>
        </View>
      ) : null}

      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("shipment.empty")}</Text>
        }
        renderItem={({ item, index }) => renderItem({ item, index })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 10,
  },
  bannerText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  route: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: "#64748B",
  },
  offline: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
});
