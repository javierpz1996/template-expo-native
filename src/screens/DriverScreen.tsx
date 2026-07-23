import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedEntrance } from "../components/common/AnimatedEntrance";
import { StatusBadge } from "../components/common/StatusBadge";
import { useApp } from "../store";
import { formatMoneyARS } from "../services/quote";

export function DriverScreen() {
  const { t } = useTranslation();
  const { shipments, updateShipmentStatus, setScreen, selectRole } = useApp();

  const active = shipments.filter(
    (item) =>
      item.status === "assigned" ||
      item.status === "in_transit" ||
      item.status === "pending",
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => void selectRole("client")}
          hitSlop={8}
          accessibilityLabel={t("driver.backHome")}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.title}>{t("driver.title")}</Text>
      </View>
      <Text style={styles.subtitle}>{t("driver.subtitle")}</Text>

      <FlatList
        data={active}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("driver.empty")}</Text>
        }
        renderItem={({ item, index }) => (
          <AnimatedEntrance delay={Math.min(index, 8) * 55} offsetY={16}>
            <View style={styles.card}>
              <StatusBadge status={item.status} />
              <Text style={styles.route}>
                {item.origin.title} → {item.destination.title}
              </Text>
              <Text style={styles.meta}>
                {formatMoneyARS(item.quote.total)} · {item.quote.distanceKm} km
              </Text>

              <View style={styles.actions}>
                {item.status === "pending" || item.status === "assigned" ? (
                  <Pressable
                    style={styles.primary}
                    onPress={() =>
                      void updateShipmentStatus(
                        item.id,
                        "in_transit",
                        "shipment.history.inTransit",
                      )
                    }
                  >
                    <Text style={styles.primaryLabel}>{t("driver.start")}</Text>
                  </Pressable>
                ) : null}

                {item.status === "in_transit" ? (
                  <Pressable
                    style={styles.primary}
                    onPress={() =>
                      void updateShipmentStatus(
                        item.id,
                        "delivered",
                        "shipment.history.delivered",
                      )
                    }
                  >
                    <Text style={styles.primaryLabel}>
                      {t("driver.complete")}
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("chat", item.id)}
                >
                  <Text style={styles.secondaryLabel}>{t("shipment.chat")}</Text>
                </Pressable>
              </View>
            </View>
          </AnimatedEntrance>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: {
    paddingHorizontal: 20,
    marginTop: 6,
    color: "#64748B",
    fontSize: 14,
  },
  list: { padding: 20, gap: 12 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 8,
  },
  route: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 13, color: "#64748B" },
  actions: { marginTop: 8, gap: 8 },
  primary: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryLabel: { color: "#fff", fontWeight: "700" },
  secondary: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryLabel: { color: "#0F172A", fontWeight: "600" },
});
