import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import type { Coordinates } from "../../types/map";

const isAndroid = Platform.OS === "android";

type MovingDotMarkerProps = {
  coordinate: Coordinates;
  tracksViewChanges?: boolean;
  title?: string;
  description?: string;
};

export function MovingDotMarker({
  coordinate,
  tracksViewChanges = true,
  title = "En camino",
  description = "Obelisco → Palermo",
}: MovingDotMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={10}
    >
      <View style={[styles.halo, isAndroid && styles.haloAndroid]} collapsable={false}>
        <View style={[styles.dot, isAndroid && styles.dotAndroid]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(28, 28, 30, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  haloAndroid: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1C1C1E",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  dotAndroid: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});