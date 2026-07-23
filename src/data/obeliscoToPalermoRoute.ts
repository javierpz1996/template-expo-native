import type { Coordinates } from "../types/map";

/**
 * Ruta aproximada Obelisco → Plaza Italia (Palermo) por avenidas:
 * 9 de Julio → Santa Fe → Plaza Italia.
 * Se usa si OSRM no responde.
 */
export const OBELISCO_TO_PALERMO_FALLBACK: Coordinates[] = [
  { latitude: -34.6037, longitude: -58.3816 }, // Obelisco
  { latitude: -34.6018, longitude: -58.3816 }, // 9 de Julio norte
  { latitude: -34.5995, longitude: -58.3818 },
  { latitude: -34.5978, longitude: -58.3825 }, // hacia Santa Fe
  { latitude: -34.5965, longitude: -58.3845 },
  { latitude: -34.5958, longitude: -58.3875 }, // Av. Santa Fe
  { latitude: -34.5952, longitude: -58.391 },
  { latitude: -34.5945, longitude: -58.395 },
  { latitude: -34.5935, longitude: -58.399 },
  { latitude: -34.5922, longitude: -58.4035 },
  { latitude: -34.5908, longitude: -58.408 },
  { latitude: -34.5892, longitude: -58.412 },
  { latitude: -34.5875, longitude: -58.4155 },
  { latitude: -34.5855, longitude: -58.418 },
  { latitude: -34.5835, longitude: -58.42 },
  { latitude: -34.5811, longitude: -58.4213 }, // Plaza Italia / Palermo
];
