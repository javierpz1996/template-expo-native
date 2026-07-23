import type { Coordinates } from "../types/map";
import type { DeliveryQuote, ShippingSpeed } from "../types/shipment";
import { distanceMeters } from "../utils/geo";

const BASE_FEE = 1200;
const FEE_PER_KM = 450;
const FEE_PER_ITEM = 180;
const EXPRESS_SURCHARGE = 1500;
const AVG_SPEED_KMH = 22;
const EXPRESS_SPEED_KMH = 32;

export function calculateDeliveryQuote(
  origin: Coordinates,
  destination: Coordinates,
  itemCount: number,
  speed: ShippingSpeed = "normal",
): DeliveryQuote {
  const meters = distanceMeters(origin, destination);
  const distanceKm = Math.max(0.5, meters / 1000);
  const distanceFee = Math.round(distanceKm * FEE_PER_KM);
  const itemsFee = Math.max(0, itemCount) * FEE_PER_ITEM;
  const serviceFee = speed === "express" ? EXPRESS_SURCHARGE : 0;
  const speedKmh = speed === "express" ? EXPRESS_SPEED_KMH : AVG_SPEED_KMH;
  const etaMinutes = Math.max(
    speed === "express" ? 5 : 8,
    Math.round((distanceKm / speedKmh) * 60),
  );

  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    etaMinutes,
    baseFee: BASE_FEE,
    distanceFee,
    itemsFee,
    serviceFee,
    speed,
    total: BASE_FEE + distanceFee + itemsFee + serviceFee,
    currency: "ARS",
  };
}

export function formatMoneyARS(amount: number): string {
  return `$${amount.toLocaleString("es-AR")}`;
}
