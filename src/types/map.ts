import type { ComponentProps } from "react";
import type { Region } from "react-native-maps";
import type { Ionicons } from "@expo/vector-icons";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MapRegion = Region;

export type MapMarker = {
  id: string;
  title: string;
  description?: string;
  about?: string;
  address?: string;
  category?: string;
  photos?: string[];
  /** Si existe, al abrir el detalle se consulta Google Places */
  googlePlaceQuery?: string;
  placeId?: string;
  coordinate: Coordinates;
  icon?: MapControlButtonIcon;
  color?: string;
};

export type GooglePlaceReview = {
  rating?: number;
  text?: string;
  authorName?: string;
  relativeTime?: string;
};

export type GooglePlaceDetails = {
  title: string;
  address?: string;
  about?: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  wheelchairAccessibleEntrance?: boolean;
  isOpenNow?: boolean;
  openingHoursText?: string;
  websiteUri?: string;
  phoneNumber?: string;
  reviews?: GooglePlaceReview[];
};

export type AddressSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText?: string;
  fullText: string;
};

export type PlaceLocationResult = {
  placeId: string;
  title: string;
  address?: string;
  coordinate: Coordinates;
};

export type MapControlButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "accent"
  | "danger";

export type MapControlButtonIcon = ComponentProps<typeof Ionicons>["name"];

export type MapControlButtonProps = {
  label: string;
  onPress: () => void;
  icon?: MapControlButtonIcon;
  variant?: MapControlButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};
