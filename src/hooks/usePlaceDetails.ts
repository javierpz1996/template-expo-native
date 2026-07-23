import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchGooglePlaceDetails } from "../services/places";
import type { MapMarker } from "../types/map";

type UsePlaceDetailsOptions = {
  place: MapMarker | null;
  enabled?: boolean;
};

export function usePlaceDetails({
  place,
  enabled = true,
}: UsePlaceDetailsOptions) {
  const { i18n } = useTranslation();
  const placeKey = place?.placeId ?? place?.googlePlaceQuery ?? place?.id;
  const language = (i18n.resolvedLanguage ?? i18n.language).split("-")[0];
  const shouldFetch = Boolean(
    enabled && place && (place.placeId || place.googlePlaceQuery),
  );

  return useQuery({
    queryKey: ["place-details", placeKey, language],
    queryFn: () =>
      fetchGooglePlaceDetails({
        placeId: place?.placeId,
        textQuery: place?.googlePlaceQuery,
      }),
    enabled: shouldFetch,
    staleTime: 0,
  });
}
