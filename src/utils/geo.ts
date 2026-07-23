import type { Coordinates } from "../types/map";

const EARTH_RADIUS_M = 6371000;

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

/** Distancia en metros entre dos coordenadas (Haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Rumbo en grados (0–360) desde `from` hacia `to`. */
export function bearingDegrees(from: Coordinates, to: Coordinates): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function interpolateCoordinates(
  a: Coordinates,
  b: Coordinates,
  t: number,
): Coordinates {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

export type RouteSample = {
  coordinate: Coordinates;
  heading: number;
  distanceFromStart: number;
};

/** Precalcula distancias acumuladas a lo largo de la polilínea. */
export function buildRouteSamples(path: Coordinates[]): RouteSample[] {
  if (path.length === 0) {
    return [];
  }

  const samples: RouteSample[] = [
    {
      coordinate: path[0],
      heading: path.length > 1 ? bearingDegrees(path[0], path[1]) : 0,
      distanceFromStart: 0,
    },
  ];

  let accumulated = 0;

  for (let i = 1; i < path.length; i += 1) {
    accumulated += distanceMeters(path[i - 1], path[i]);
    samples.push({
      coordinate: path[i],
      heading: bearingDegrees(path[i - 1], path[i]),
      distanceFromStart: accumulated,
    });
  }

  return samples;
}

/** Posición y rumbo a una distancia dada a lo largo de la ruta. */
export function sampleRouteAtDistance(
  samples: RouteSample[],
  distance: number,
): { coordinate: Coordinates; heading: number } {
  if (samples.length === 0) {
    return { coordinate: { latitude: 0, longitude: 0 }, heading: 0 };
  }

  if (samples.length === 1 || distance <= 0) {
    return {
      coordinate: samples[0].coordinate,
      heading: samples[0].heading,
    };
  }

  const total = samples[samples.length - 1].distanceFromStart;

  if (distance >= total) {
    const last = samples[samples.length - 1];
    return { coordinate: last.coordinate, heading: last.heading };
  }

  let i = 1;
  while (i < samples.length && samples[i].distanceFromStart < distance) {
    i += 1;
  }

  const prev = samples[i - 1];
  const next = samples[i];
  const segment = next.distanceFromStart - prev.distanceFromStart;
  const t = segment === 0 ? 0 : (distance - prev.distanceFromStart) / segment;

  return {
    coordinate: interpolateCoordinates(prev.coordinate, next.coordinate, t),
    heading: next.heading,
  };
}

/** Inserta puntos intermedios para una animación más suave. */
export function densifyPath(
  path: Coordinates[],
  maxStepMeters = 25,
): Coordinates[] {
  if (path.length < 2) {
    return path;
  }

  const result: Coordinates[] = [path[0]];

  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1];
    const to = path[i];
    const segmentLength = distanceMeters(from, to);
    const steps = Math.max(1, Math.ceil(segmentLength / maxStepMeters));

    for (let step = 1; step <= steps; step += 1) {
      result.push(interpolateCoordinates(from, to, step / steps));
    }
  }

  return result;
}
