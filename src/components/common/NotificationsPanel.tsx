import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../store";
import { useThemeStore } from "../../store/themeStore";
import { formatI18nTemplate } from "../../utils/formatI18nTemplate";

type NotificationsPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationsPanel({
  visible,
  onClose,
}: NotificationsPanelProps) {
  const { t, i18n } = useTranslation();
  const { notifications, markNotificationsRead, setScreen } = useApp();
  const colors = useThemeStore((state) => state.colors);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        void markNotificationsRead();
      }}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("notifications.panelTitle")}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                {t("notifications.empty")}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                  !item.read && {
                    backgroundColor:
                      colors.background === "#0B1220" ? "#1E3A5F" : "#EEF2FF",
                  },
                ]}
                onPress={() => {
                  onClose();
                  if (item.shipmentId) {
                    setScreen("shipment-detail", item.shipmentId);
                  }
                }}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {t(item.titleKey)}
                </Text>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                  {formatI18nTemplate(t(item.bodyKey), item.bodyParams ?? null)}
                </Text>
                <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                  {new Date(item.createdAt).toLocaleString(i18n.language)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  list: {
    paddingBottom: 12,
    gap: 10,
  },
  empty: {
    textAlign: "center",
    marginTop: 28,
    marginBottom: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTime: {
    marginTop: 8,
    fontSize: 11,
  },
});
