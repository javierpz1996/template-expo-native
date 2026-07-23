import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import type { MapMarker } from "../../types/map";

const isAndroid = Platform.OS === "android";

type MapMarkerItemProps = {
  marker: MapMarker;
  onPress?: (marker: MapMarker) => void;
  showLabel?: boolean;
};

export function MapMarkerItem({
  marker,
  onPress,
  showLabel = true,
}: MapMarkerItemProps) {
  const color = marker.color ?? "#1C1C1E";
  const icon = marker.icon ?? "location";
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setTracksViewChanges(false), 750);
    return () => clearTimeout(timeout);
  }, [marker.id]);

  return (
    <Marker
      identifier={marker.id}
      coordinate={marker.coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tappable
      stopPropagation
      tracksViewChanges={tracksViewChanges}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.(marker);
      }}
    >
      <View style={styles.container} collapsable={false}>
        <View
          style={[
            styles.bubble,
            isAndroid && styles.bubbleAndroid,
            { backgroundColor: color },
          ]}
        >
          <Ionicons name={icon} size={isAndroid ? 12 : 16} color="#ffffff" />
        </View>
        <View
          style={[
            styles.pointer,
            isAndroid && styles.pointerAndroid,
            { borderTopColor: color },
          ]}
        />
        {showLabel ? (
          <View style={[styles.labelWrap, isAndroid && styles.labelWrapAndroid]}>
            <Text
              style={[styles.label, isAndroid && styles.labelAndroid]}
              numberOfLines={1}
            >
              {marker.title}
            </Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleAndroid: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  pointer: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  pointerAndroid: {
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
  },
  labelWrap: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    maxWidth: 120,
  },
  labelWrapAndroid: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 96,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
  },
  labelAndroid: {
    fontSize: 9,
  },
});
