import { OBELISCO_TO_PALERMO_FALLBACK } from "../data/obeliscoToPalermoRoute";
import type { Coordinates } from "../types/map";
import { densifyPath } from "../utils/geo";

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

function decodeOsrmCoordinates(
  coordinates: [number, number][],
): Coordinates[] {
  return coordinates.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));
}

/**
 * Obtiene una ruta real por calles (OSRM público).
 * Si falla, usa la polilínea de respaldo densificada.
 */
export async function fetchDrivingRoute(
  origin: Coordinates,
  destination: Coordinates,
): Promise<Coordinates[]> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = (await response.json()) as OsrmRouteResponse;
    const coords = data.routes?.[0]?.geometry?.coordinates;

    if (data.code !== "Ok" || !coords?.length) {
      throw new Error("OSRM sin geometría");
    }

    return densifyPath(decodeOsrmCoordinates(coords), 20);
  } catch {
    return densifyPath(OBELISCO_TO_PALERMO_FALLBACK, 20);
  }
}
