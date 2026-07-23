import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ShipmentStatus } from "../../types/shipment";

const STATUS_COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  assigned: { bg: "#DBEAFE", text: "#1E40AF" },
  in_transit: { bg: "#E0E7FF", text: "#3730A3" },
  delivered: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const { t } = useTranslation();
  const colors = STATUS_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {t(`shipment.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
