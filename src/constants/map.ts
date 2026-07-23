import type { Coordinates, MapRegion } from "../types/map";

export const DEFAULT_REGION: MapRegion = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const USER_LOCATION_ZOOM: Pick<MapRegion, "latitudeDelta" | "longitudeDelta"> =
  {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

/** Obelisco de Buenos Aires */
export const OBELISCO_COORDINATE: Coordinates = {
  latitude: -34.6037,
  longitude: -58.3816,
};

/** Plaza Italia / Palermo */
export const PALERMO_COORDINATE: Coordinates = {
  latitude: -34.5811,
  longitude: -58.4213,
};

/** Duración del recorrido Obelisco → Palermo (~20 s, ritmo de auto). */
export const MARKER_ANIMATION_DURATION_MS = 20000;

export const FOLLOW_CAMERA_ZOOM: Pick<MapRegion, "latitudeDelta" | "longitudeDelta"> =
  {
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

/** Ruta: borde blanco + trazo principal verde soft */
export const ROUTE_STROKE_COLOR = "#66A86A";
export const ROUTE_STROKE_WIDTH = 6;
export const ROUTE_BORDER_COLOR = "#E8F5E9";
export const ROUTE_BORDER_WIDTH = 10;
