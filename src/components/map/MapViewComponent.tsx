import MapView, { PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { Platform, StyleSheet, View } from "react-native";
import {
  ROUTE_BORDER_COLOR,
  ROUTE_BORDER_WIDTH,
  ROUTE_STROKE_COLOR,
  ROUTE_STROKE_WIDTH,
} from "../../constants/map";
import { SOFT_MAP_STYLE } from "../../constants/mapStyles";
import type { DriveMode } from "../../hooks/useRouteDrive";
import type { Coordinates, MapMarker, MapRegion } from "../../types/map";
import { MapMarkerItem } from "./MapMarkerItem";
import { MovingDotMarker } from "./MovingDotMarker";
import { VehicleMarker } from "./VehicleMarker";

type MapViewComponentProps = {
  mapRef: React.RefObject<MapView | null>;
  region: MapRegion;
  markers?: MapMarker[];
  showPlaceMarkers?: boolean;
  hideMarkerLabels?: boolean;
  showsUserLocation?: boolean;
  onRegionChangeComplete?: (region: MapRegion) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  onMapPress?: () => void;
  routePath?: Coordinates[];
  carPosition?: Coordinates;
  heading?: number;
  driveMode?: DriveMode | null;
  isAnimating?: boolean;
};

export function MapViewComponent({
  mapRef,
  region,
  markers = [],
  showPlaceMarkers = true,
  hideMarkerLabels = false,
  showsUserLocation = false,
  onRegionChangeComplete,
  onMarkerPress,
  onMapPress,
  routePath = [],
  carPosition,
  heading = 0,
  driveMode = null,
  isAnimating = false,
}: MapViewComponentProps) {
  const hasRoute = routePath.length > 1;
  const showVehicle = driveMode === "follow3d" || driveMode === "package";
  const isAndroid = Platform.OS === "android";

  return (
    <View style={styles.container}>
      <MapView
        key={showPlaceMarkers ? "map-places-on" : "map-places-off"}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={isAndroid ? undefined : SOFT_MAP_STYLE}
        showsPointsOfInterest={false}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsBuildings={!isAndroid}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={onMapPress}
      >
        {hasRoute ? (
          <>
            <Polyline
              key={`route-border-${ROUTE_BORDER_COLOR}`}
              coordinates={routePath}
              strokeColor={ROUTE_BORDER_COLOR}
              strokeColors={[ROUTE_BORDER_COLOR]}
              strokeWidth={ROUTE_BORDER_WIDTH}
              lineCap="round"
              lineJoin="round"
              geodesic
              zIndex={1}
            />
            <Polyline
              key={`route-main-${ROUTE_STROKE_COLOR}`}
              coordinates={routePath}
              strokeColor={ROUTE_STROKE_COLOR}
              strokeColors={[ROUTE_STROKE_COLOR]}
              strokeWidth={ROUTE_STROKE_WIDTH}
              lineCap="round"
              lineJoin="round"
              geodesic
              zIndex={2}
            />
          </>
        ) : null}

        {showPlaceMarkers
          ? markers.map((marker) => (
              <MapMarkerItem
                key={marker.id}
                marker={marker}
                onPress={onMarkerPress}
                showLabel={!hideMarkerLabels}
              />
            ))
          : null}

        {carPosition && showVehicle ? (
          <VehicleMarker
            coordinate={carPosition}
            heading={heading}
            tracksViewChanges={isAnimating}
          />
        ) : null}

        {carPosition && !showVehicle ? (
          <MovingDotMarker
            coordinate={carPosition}
            tracksViewChanges={isAnimating}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
