import Constants from "expo-constants";
import { OBELISCO_COORDINATE } from "../constants/map";
import { getPlacesLanguageCode } from "../i18n";
import type {
  AddressSuggestion,
  GooglePlaceDetails,
  GooglePlaceReview,
  PlaceLocationResult,
} from "../types/map";

const PLACES_BASE_URL = "https://places.googleapis.com/v1";
const BUENOS_AIRES_BIAS_RADIUS_M = 35_000;

type PlacesPhoto = {
  name: string;
};

type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
  relativePublishTimeDescription?: string;
};

type OpeningHours = {
  openNow?: boolean;
  weekdayDescriptions?: string[];
};

type PlaceResource = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  editorialSummary?: { text?: string };
  photos?: PlacesPhoto[];
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  currentOpeningHours?: OpeningHours;
  regularOpeningHours?: OpeningHours;
  reviews?: PlaceReview[];
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type SearchTextResponse = {
  places?: PlaceResource[];
};

type AutocompleteSuggestion = {
  placePrediction?: {
    placeId?: string;
    place?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

type AutocompleteResponse = {
  suggestions?: AutocompleteSuggestion[];
};

function getGoogleMapsApiKey(): string {
  const extraKey = Constants.expoConfig?.extra?.googleMapsApiKey as
    | string
    | undefined;
  const androidKey =
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

  return extraKey ?? androidKey ?? "";
}

function buildPhotoUrl(photoName: string, apiKey: string, maxHeightPx = 800) {
  return `${PLACES_BASE_URL}/${photoName}/media?maxHeightPx=${maxHeightPx}&key=${apiKey}`;
}

function getTodayOpeningHours(descriptions?: string[]): string | undefined {
  if (!descriptions?.length) {
    return undefined;
  }

  const weekday = new Date().getDay(); // 0 domingo
  // Google suele devolver Lunes...Domingo (índice 0 = lunes)
  const googleIndex = weekday === 0 ? 6 : weekday - 1;
  return descriptions[googleIndex] ?? descriptions[0];
}

function mapReviews(reviews?: PlaceReview[]): GooglePlaceReview[] {
  return (reviews ?? []).slice(0, 3).map((review) => ({
    rating: review.rating,
    text: review.text?.text,
    authorName: review.authorAttribution?.displayName,
    relativeTime: review.relativePublishTimeDescription,
  }));
}

function mapPlaceToDetails(
  place: PlaceResource,
  apiKey: string,
): GooglePlaceDetails {
  const photos = (place.photos ?? [])
    .slice(0, 9)
    .map((photo) => buildPhotoUrl(photo.name, apiKey));

  const openingHours =
    place.currentOpeningHours ?? place.regularOpeningHours;

  return {
    title: place.displayName?.text ?? "",
    address: place.formattedAddress,
    about: place.editorialSummary?.text,
    photos,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    googleMapsUri: place.googleMapsUri,
    wheelchairAccessibleEntrance:
      place.accessibilityOptions?.wheelchairAccessibleEntrance,
    isOpenNow: openingHours?.openNow,
    openingHoursText: getTodayOpeningHours(openingHours?.weekdayDescriptions),
    websiteUri: place.websiteUri,
    phoneNumber:
      place.nationalPhoneNumber ?? place.internationalPhoneNumber,
    reviews: mapReviews(place.reviews),
  };
}

function parsePlacesError(status: number, body: string): Error {
  if (
    status === 403 &&
    (body.includes("API_KEY_ANDROID_APP_BLOCKED") ||
      body.includes("Android client application"))
  ) {
    return new Error(
      "Tu API key está restringida solo a Android. En Google Cloud → Credenciales → tu key → Restricciones de aplicación → elegí «Ninguna» (para probar) o creá una key nueva para Places.",
    );
  }

  if (status === 403 && body.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
    return new Error(
      "Tu API key bloquea este origen HTTP. Sacá la restricción de sitios web o agregá una key sin esa restricción.",
    );
  }

  if (status === 403) {
    return new Error(
      "Places API rechazó la key (403). Revisá que Places API (New) esté habilitada y que la key no tenga restricciones que bloqueen fetch.",
    );
  }

  return new Error(`Places error ${status}`);
}

async function fetchPlaceById(
  placeId: string,
  apiKey: string,
): Promise<GooglePlaceDetails> {
  const resourceId = placeId.startsWith("places/")
    ? placeId
    : `places/${placeId}`;

  const response = await fetch(
    `${PLACES_BASE_URL}/${resourceId}?languageCode=${getPlacesLanguageCode()}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "formattedAddress",
          "editorialSummary",
          "photos",
          "rating",
          "userRatingCount",
          "googleMapsUri",
          "accessibilityOptions",
          "currentOpeningHours",
          "regularOpeningHours",
          "websiteUri",
          "nationalPhoneNumber",
          "internationalPhoneNumber",
          "reviews",
        ].join(","),
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw parsePlacesError(response.status, body);
  }

  const place = (await response.json()) as PlaceResource;
  return mapPlaceToDetails(place, apiKey);
}

async function searchPlaceId(
  textQuery: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(`${PLACES_BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: getPlacesLanguageCode(),
      maxResultCount: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw parsePlacesError(response.status, body);
  }

  const data = (await response.json()) as SearchTextResponse;
  const nextPlaceId = data.places?.[0]?.id;

  if (!nextPlaceId) {
    throw new Error("No se encontró el lugar en Google Places");
  }

  return nextPlaceId;
}

/**
 * Obtiene detalles y fotos desde Places API (New).
 * Requiere una API key que permita llamadas HTTP (no solo restricción Android SDK).
 */
export async function fetchGooglePlaceDetails(options: {
  placeId?: string;
  textQuery?: string;
}): Promise<GooglePlaceDetails> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    throw new Error("Falta la API key de Google Maps");
  }

  const placeId =
    options.placeId ??
    (options.textQuery
      ? await searchPlaceId(options.textQuery, apiKey)
      : null);

  if (!placeId) {
    throw new Error("Necesitás placeId o textQuery");
  }

  return fetchPlaceById(placeId, apiKey);
}

/**
 * Sugerencias de direcciones / lugares (Places Autocomplete New).
 * Sesgado a Buenos Aires para resultados más relevantes.
 */
export async function fetchAddressSuggestions(
  input: string,
): Promise<AddressSuggestion[]> {
  const apiKey = getGoogleMapsApiKey();
  const trimmed = input.trim();

  if (!apiKey) {
    throw new Error("Falta la API key de Google Maps");
  }

  if (trimmed.length < 2) {
    return [];
  }

  const response = await fetch(`${PLACES_BASE_URL}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: trimmed,
      languageCode: getPlacesLanguageCode(),
      includedRegionCodes: ["ar"],
      locationBias: {
        circle: {
          center: {
            latitude: OBELISCO_COORDINATE.latitude,
            longitude: OBELISCO_COORDINATE.longitude,
          },
          radius: BUENOS_AIRES_BIAS_RADIUS_M,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw parsePlacesError(response.status, body);
  }

  const data = (await response.json()) as AutocompleteResponse;

  return (data.suggestions ?? [])
    .map((suggestion) => {
      const prediction = suggestion.placePrediction;
      const placeId =
        prediction?.placeId ??
        prediction?.place?.replace(/^places\//, "");

      if (!placeId) {
        return null;
      }

      const primaryText =
        prediction?.structuredFormat?.mainText?.text ??
        prediction?.text?.text ??
        "";
      const secondaryText =
        prediction?.structuredFormat?.secondaryText?.text;
      const fullText = prediction?.text?.text ?? primaryText;

      if (!primaryText) {
        return null;
      }

      return {
        placeId,
        primaryText,
        secondaryText,
        fullText,
      } satisfies AddressSuggestion;
    })
    .filter((item): item is AddressSuggestion => item !== null);
}

/** Coordenadas + nombre básico de un placeId (para centrar el mapa). */
export async function fetchPlaceLocation(
  placeId: string,
): Promise<PlaceLocationResult> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    throw new Error("Falta la API key de Google Maps");
  }

  const resourceId = placeId.startsWith("places/")
    ? placeId
    : `places/${placeId}`;

  const response = await fetch(
    `${PLACES_BASE_URL}/${resourceId}?languageCode=${getPlacesLanguageCode()}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw parsePlacesError(response.status, body);
  }

  const place = (await response.json()) as PlaceResource;
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (latitude == null || longitude == null) {
    throw new Error("El lugar no tiene coordenadas");
  }

  const resolvedId = place.id?.replace(/^places\//, "") ?? placeId;

  return {
    placeId: resolvedId,
    title: place.displayName?.text ?? "Lugar",
    address: place.formattedAddress,
    coordinate: { latitude, longitude },
  };
}
