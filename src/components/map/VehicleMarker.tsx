import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import type { Coordinates } from "../../types/map";

const isAndroid = Platform.OS === "android";

type VehicleMarkerProps = {
  coordinate: Coordinates;
  heading?: number;
  tracksViewChanges?: boolean;
  title?: string;
  description?: string;
};

export function VehicleMarker({
  coordinate,
  heading = 0,
  tracksViewChanges = true,
  title = "Conduciendo",
  description = "Obelisco → Palermo",
}: VehicleMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading}
      flat
      tracksViewChanges={tracksViewChanges}
      zIndex={10}
    >
      <View style={styles.wrapper} collapsable={false}>
        <View style={[styles.badge, isAndroid && styles.badgeAndroid]}>
          <Ionicons
            name="car"
            size={isAndroid ? 16 : 22}
            color="#1C1C1E"
          />
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ rotate: "-90deg" }],
  },
  badgeAndroid: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});