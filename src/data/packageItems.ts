import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type PackageItemIcon = ComponentProps<typeof Ionicons>["name"];

export type PackageCatalogItem = {
  id: string;
  nameKey: string;
  icon: PackageItemIcon;
};

/** Catálogo de ítems disponibles para un envío. */
export const PACKAGE_CATALOG: PackageCatalogItem[] = [
  { id: "docs", nameKey: "package.items.docs", icon: "document-text-outline" },
  { id: "clothes", nameKey: "package.items.clothes", icon: "shirt-outline" },
  {
    id: "electronics",
    nameKey: "package.items.electronics",
    icon: "phone-portrait-outline",
  },
  { id: "books", nameKey: "package.items.books", icon: "book-outline" },
  { id: "food", nameKey: "package.items.food", icon: "fast-food-outline" },
  { id: "medicine", nameKey: "package.items.medicine", icon: "medkit-outline" },
  { id: "toys", nameKey: "package.items.toys", icon: "game-controller-outline" },
  { id: "tools", nameKey: "package.items.tools", icon: "hammer-outline" },
];

export const MIN_PACKAGE_ITEMS = 4;

/** Chofer asignado al envío (demo). */
export const PACKAGE_DRIVER = {
  nameKey: "package.driverName",
  vehicleKey: "package.driverVehicle",
  rating: 4.9,
} as const;

export function getPackageItemsByIds(itemIds: string[]): PackageCatalogItem[] {
  return itemIds
    .map((id) => PACKAGE_CATALOG.find((item) => item.id === id))
    .filter((item): item is PackageCatalogItem => Boolean(item));
}
