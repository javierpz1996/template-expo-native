import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import i18n from "../i18n";
import type { Coordinates } from "../types/map";

type UseUserLocationResult = {
  location: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<Coordinates | null>;
};

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError(i18n.t("errors.locationPermission"));
        return null;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates: Coordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setLocation(coordinates);
      return coordinates;
    } catch {
      setError(i18n.t("errors.locationFailed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
  };
}
