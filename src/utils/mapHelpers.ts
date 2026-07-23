import type { Coordinates, MapRegion } from "../types/map";

export function createRegionFromCoordinate(
  coordinate: Coordinates,
  deltas: Pick<MapRegion, "latitudeDelta" | "longitudeDelta"> = {
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
): MapRegion {
  return {
    ...coordinate,
    ...deltas,
  };
}
