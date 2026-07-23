import { PACKAGE_DRIVER } from "../data/packageItems";
import type {
  DeliveryQuote,
  Shipment,
  ShipmentPlace,
  ShipmentStatus,
  ShipmentStatusEvent,
  ShippingSpeed,
} from "../types/shipment";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createShipment(input: {
  origin: ShipmentPlace;
  destination: ShipmentPlace;
  itemIds: string[];
  quote: DeliveryQuote;
  speed?: ShippingSpeed;
  offlineCreated?: boolean;
}): Shipment {
  const createdAt = nowIso();
  const initial: ShipmentStatusEvent = {
    status: "pending",
    at: createdAt,
    noteKey: "shipment.history.pending",
  };

  return {
    id: createId("shp"),
    createdAt,
    updatedAt: createdAt,
    status: "pending",
    origin: input.origin,
    destination: input.destination,
    itemIds: input.itemIds,
    speed: input.speed ?? input.quote.speed ?? "normal",
    quote: input.quote,
    history: [initial],
    driverNameKey: PACKAGE_DRIVER.nameKey,
    driverVehicleKey: PACKAGE_DRIVER.vehicleKey,
    driverRating: PACKAGE_DRIVER.rating,
    synced: !input.offlineCreated,
    offlineCreated: Boolean(input.offlineCreated),
  };
}

export function appendShipmentStatus(
  shipment: Shipment,
  status: ShipmentStatus,
  noteKey?: string,
): Shipment {
  const at = nowIso();
  return {
    ...shipment,
    status,
    updatedAt: at,
    history: [
      ...shipment.history,
      {
        status,
        at,
        noteKey,
      },
    ],
  };
}

export function markShipmentSynced(shipment: Shipment): Shipment {
  return {
    ...shipment,
    synced: true,
    offlineCreated: false,
    updatedAt: nowIso(),
  };
}
