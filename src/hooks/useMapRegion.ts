import { useCallback, useState } from "react";
import type { MapRegion } from "../types/map";
import { DEFAULT_REGION } from "../constants/map";

export function useMapRegion(initialRegion: MapRegion = DEFAULT_REGION) {
  const [region, setRegion] = useState<MapRegion>(initialRegion);

  const resetRegion = useCallback(() => {
    setRegion(initialRegion);
  }, [initialRegion]);

  return {
    region,
    setRegion,
    resetRegion,
  };
}
