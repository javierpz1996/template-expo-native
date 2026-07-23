import type { Coordinates } from "./map";

export type AppRole = "client" | "driver" | "admin";

export type ShipmentStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type ShipmentStatusEvent = {
  status: ShipmentStatus;
  at: string;
  noteKey?: string;
};

export type ShipmentPlace = {
  title: string;
  address?: string;
  placeId?: string;
  coordinate: Coordinates;
};

export type ShippingSpeed = "normal" | "express";

export type DeliveryQuote = {
  distanceKm: number;
  etaMinutes: number;
  baseFee: number;
  distanceFee: number;
  itemsFee: number;
  serviceFee: number;
  speed: ShippingSpeed;
  total: number;
  currency: "ARS";
};

export type Shipment = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ShipmentStatus;
  origin: ShipmentPlace;
  destination: ShipmentPlace;
  itemIds: string[];
  speed: ShippingSpeed;
  quote: DeliveryQuote;
  history: ShipmentStatusEvent[];
  driverNameKey: string;
  driverVehicleKey: string;
  driverRating: number;
  synced: boolean;
  offlineCreated?: boolean;
};

export type AdminProfile = {
  name: string;
  phone: string;
  favoriteAddress: string;
};

export type AppNotification = {
  id: string;
  titleKey: string;
  bodyKey: string;
  bodyParams?: Record<string, string | number>;
  createdAt: string;
  read: boolean;
  shipmentId?: string;
};

export type ChatMessage = {
  id: string;
  shipmentId: string;
  sender: "client" | "driver";
  text: string;
  createdAt: string;
};

export type RootScreen =
  | "onboarding"
  | "client-map"
  | "shipments"
  | "shipment-detail"
  | "chat"
  | "driver"
  | "admin";
