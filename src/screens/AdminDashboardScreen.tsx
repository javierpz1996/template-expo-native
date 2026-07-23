import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBadge } from "../components/common/StatusBadge";
import { DEFAULT_REGION } from "../constants/map";
import { useApp } from "../store";
import { formatMoneyARS } from "../services/quote";
import { loadAdminProfile, saveAdminProfile } from "../services/storage";
import type { AdminProfile } from "../types/shipment";

const EMPTY_PROFILE: AdminProfile = {
  name: "",
  phone: "",
  favoriteAddress: "",
};

export function AdminDashboardScreen() {
  const { t } = useTranslation();
  const { shipments, selectRole, setScreen, isOnline } = useApp();
  const [profile, setProfile] = useState<AdminProfile>(EMPTY_PROFILE);
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    void loadAdminProfile().then(setProfile);
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayShipments = shipments.filter(
      (item) => new Date(item.createdAt).toDateString() === today,
    );
    const inTransit = shipments.filter((item) => item.status === "in_transit");
    const delivered = shipments.filter((item) => item.status === "delivered");
    const revenue = delivered.reduce((sum, item) => sum + item.quote.total, 0);
    const pendingSync = shipments.filter((item) => !item.synced).length;

    return {
      today: todayShipments.length,
      inTransit: inTransit.length,
      delivered: delivered.length,
      revenue,
      pendingSync,
      activeVehicles: inTransit.slice(0, 5),
    };
  }, [shipments]);

  const handleSaveProfile = async () => {
    await saveAdminProfile(profile);
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 2000);
  };

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
        <Text style={styles.title}>{t("admin.title")}</Text>
      </View>

      {!isOnline ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{t("common.offlineBanner")}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, styles.sectionFirst]}>
          {t("admin.profileTitle")}
        </Text>
        <View style={styles.profileCard}>
          <Text style={styles.inputLabel}>{t("admin.profileName")}</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
            placeholder={t("admin.profileNamePlaceholder")}
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>{t("admin.profilePhone")}</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(phone) =>
              setProfile((current) => ({ ...current, phone }))
            }
            placeholder={t("admin.profilePhonePlaceholder")}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>{t("admin.profileAddress")}</Text>
          <TextInput
            style={styles.input}
            value={profile.favoriteAddress}
            onChangeText={(favoriteAddress) =>
              setProfile((current) => ({ ...current, favoriteAddress }))
            }
            placeholder={t("admin.profileAddressPlaceholder")}
            placeholderTextColor="#94A3B8"
          />

          <Pressable style={styles.saveBtn} onPress={() => void handleSaveProfile()}>
            <Text style={styles.saveBtnLabel}>{t("admin.profileSave")}</Text>
          </Pressable>
          {savedHint ? (
            <Text style={styles.savedHint}>{t("admin.profileSaved")}</Text>
          ) : null}
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.today}</Text>
            <Text style={styles.metricLabel}>{t("admin.today")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.inTransit}</Text>
            <Text style={styles.metricLabel}>{t("admin.inTransit")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.delivered}</Text>
            <Text style={styles.metricLabel}>{t("admin.delivered")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {formatMoneyARS(metrics.revenue)}
            </Text>
            <Text style={styles.metricLabel}>{t("admin.revenue")}</Text>
          </View>
        </View>

        {metrics.pendingSync > 0 ? (
          <Text style={styles.syncNote}>
            {t("admin.pendingSync", { count: metrics.pendingSync })}
          </Text>
        ) : null}

        <Text style={styles.section}>{t("admin.liveMap")}</Text>
        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={DEFAULT_REGION}>
            {metrics.activeVehicles.map((item) => (
              <Marker
                key={item.id}
                coordinate={item.origin.coordinate}
                title={t(item.driverNameKey)}
                description={`${item.origin.title} → ${item.destination.title}`}
              />
            ))}
          </MapView>
        </View>

        <Text style={styles.section}>{t("admin.recent")}</Text>
        {shipments.slice(0, 8).map((item) => (
          <Pressable
            key={item.id}
            style={styles.row}
            onPress={() => setScreen("shipment-detail", item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.origin.title} → {item.destination.title}
              </Text>
              <Text style={styles.rowMeta}>
                {formatMoneyARS(item.quote.total)}
                {" · "}
                {t(
                  item.speed === "express" || item.quote?.speed === "express"
                    ? "package.speedExpress"
                    : "package.speedNormal",
                )}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </Pressable>
        ))}
      </ScrollView>
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
  banner: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 10,
  },
  bannerText: { color: "#92400E", fontWeight: "600", fontSize: 13 },
  content: { padding: 20, paddingBottom: 40 },
  sectionFirst: { marginTop: 0 },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 8,
  },
  inputLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  saveBtn: {
    marginTop: 14,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  savedHint: {
    marginTop: 8,
    textAlign: "center",
    color: "#15803D",
    fontWeight: "600",
    fontSize: 13,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  metricValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  metricLabel: { marginTop: 4, fontSize: 12, color: "#64748B" },
  syncNote: {
    marginTop: 12,
    color: "#B45309",
    fontWeight: "600",
    fontSize: 13,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  mapWrap: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: { flex: 1 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  rowMeta: { marginTop: 4, fontSize: 12, color: "#64748B" },
});
