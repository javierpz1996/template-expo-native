import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MapControls,
  MapViewComponent,
  PackageSendModal,
  PlaceDetailSheet,
  PlacesToggleButton,
  TripStatusCard,
} from "../components/map";
import { AppDrawerMenu } from "../components/common/AppDrawerMenu";
import { NotificationsPanel } from "../components/common/NotificationsPanel";
import {
  DEFAULT_REGION,
  MARKER_ANIMATION_DURATION_MS,
  USER_LOCATION_ZOOM,
} from "../constants/map";
import { useApp } from "../store";
import { useThemeStore } from "../store/themeStore";
import { useMapRegion } from "../hooks/useMapRegion";
import { useRouteDrive, type DriveMode } from "../hooks/useRouteDrive";
import { useUserLocation } from "../hooks/useUserLocation";
import { calculateDeliveryQuote } from "../services/quote";
import { fetchPlaceLocation } from "../services/places";
import {
  clearTrackingSession,
  ensureTrackingStarted,
  getTrackingProgress,
} from "../services/trackingSession";
import type { AddressSuggestion, MapMarker } from "../types/map";
import type { Shipment, ShippingSpeed } from "../types/shipment";
import { createRegionFromCoordinate } from "../utils/mapHelpers";

function shortPlaceName(name: string, maxLength = 22): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function toSearchMarker(
  place: Awaited<ReturnType<typeof fetchPlaceLocation>>,
  prefix: string,
): MapMarker {
  return {
    id: `${prefix}-${place.placeId}`,
    title: place.title,
    address: place.address,
    placeId: place.placeId,
    coordinate: place.coordinate,
    icon: "location",
    color: prefix === "origin" ? "#16A34A" : "#2563EB",
  };
}

function getInTransitStartedAt(shipment: Shipment): number | undefined {
  const event = shipment.history.find((item) => item.status === "in_transit");
  return event ? new Date(event.at).getTime() : undefined;
}

export function MapScreen() {
  const { t } = useTranslation();
  const {
    createDelivery,
    updateShipmentStatus,
    setScreen,
    selectRole,
    isOnline,
    unreadCount,
    shouldOpenPackageModal,
    consumeOpenPackageModal,
    shipments,
    getShipment,
  } = useApp();
  const colors = useThemeStore((state) => state.colors);
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const mapRef = useRef<MapView>(null);
  const activeShipmentIdRef = useRef<string | null>(null);
  const activeDestinationRef = useRef<string>("");
  const resumeAttemptedRef = useRef<string | null>(null);
  const { region, setRegion } = useMapRegion(DEFAULT_REGION);
  const { location, isLoading, error, requestLocation } = useUserLocation();
  const [selectedPlace, setSelectedPlace] = useState<MapMarker | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationPlace, setDestinationPlace] = useState<MapMarker | null>(
    null,
  );
  const [originQuery, setOriginQuery] = useState("");
  const [originPlace, setOriginPlace] = useState<MapMarker | null>(null);
  const [showOriginInput, setShowOriginInput] = useState(false);
  const [packageMode, setPackageMode] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [pendingPackageSend, setPendingPackageSend] = useState(false);
  const [packageItemIds, setPackageItemIds] = useState<string[]>([]);
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [isResolvingOrigin, setIsResolvingOrigin] = useState(false);

  const canBuildRoute = Boolean(originPlace && destinationPlace);
  const routeOrigin = originPlace?.coordinate ?? null;
  const routeDestination = destinationPlace?.coordinate ?? null;

  const handlePackageArrived = useCallback(
    (driveModeArrived: DriveMode) => {
      if (driveModeArrived !== "package" || !activeShipmentIdRef.current) {
        return;
      }

      const shipmentId = activeShipmentIdRef.current;
      const current = getShipment(shipmentId);
      if (current?.status === "delivered") {
        setScreen("shipment-detail", shipmentId);
        return;
      }

      void updateShipmentStatus(
        shipmentId,
        "delivered",
        "shipment.history.delivered",
        true,
      ).then(() => {
        setScreen("shipment-detail", shipmentId);
      });
    },
    [getShipment, setScreen, updateShipmentStatus],
  );

  const {
    routePath,
    position,
    heading,
    progress,
    driveMode,
    isAnimating,
    isLoadingRoute,
    routeError,
    driveOverview,
    driveFollow3d,
    sendPackage,
  } = useRouteDrive(routeOrigin, routeDestination, handlePackageArrived);

  const destinationLabel = shortPlaceName(
    destinationPlace?.title ?? t("common.theDestination"),
  );

  const mapMarkers = useMemo(() => {
    const extras: MapMarker[] = [];

    if (destinationPlace) {
      extras.push(destinationPlace);
    }

    if (
      originPlace &&
      originPlace.placeId !== destinationPlace?.placeId
    ) {
      extras.push(originPlace);
    }

    return extras;
  }, [destinationPlace, originPlace]);

  const handleCenterUser = useCallback(async () => {
    const coordinates = location ?? (await requestLocation());

    if (!coordinates) {
      return;
    }

    const nextRegion = createRegionFromCoordinate(
      coordinates,
      USER_LOCATION_ZOOM,
    );
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 800);
  }, [location, requestLocation, setRegion]);

  const handleDriveOverview = useCallback(() => {
    driveOverview(mapRef);
  }, [driveOverview]);

  const handleDriveFollow3d = useCallback(() => {
    driveFollow3d(mapRef);
  }, [driveFollow3d]);

  const ignoreMapPressRef = useRef(false);

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    ignoreMapPressRef.current = true;
    setSelectedPlace(marker);
    setTimeout(() => {
      ignoreMapPressRef.current = false;
    }, 400);
  }, []);

  const handleClosePlaceDetail = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleMapPress = useCallback(() => {
    if (ignoreMapPressRef.current) {
      return;
    }
    setSelectedPlace(null);
  }, []);

  const focusOnCoordinate = useCallback(
    (coordinate: MapMarker["coordinate"]) => {
      const nextRegion = createRegionFromCoordinate(
        coordinate,
        USER_LOCATION_ZOOM,
      );
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 800);
    },
    [setRegion],
  );

  const handleDestinationChange = useCallback((text: string) => {
    setDestinationQuery(text);
    if (!text.trim()) {
      setDestinationPlace(null);
      setShowOriginInput(false);
      setOriginQuery("");
      setOriginPlace(null);
    }
  }, []);

  const handleOriginChange = useCallback((text: string) => {
    setOriginQuery(text);
    if (!text.trim()) {
      setOriginPlace(null);
    }
  }, []);

  const handleSelectDestination = useCallback(
    async (suggestion: AddressSuggestion) => {
      setIsResolvingDestination(true);
      try {
        const place = await fetchPlaceLocation(suggestion.placeId);
        const marker = toSearchMarker(place, "destination");

        setDestinationQuery(place.title);
        setDestinationPlace(marker);
        setSelectedPlace(marker);
        focusOnCoordinate(place.coordinate);
      } catch {
        // Silencioso: el buscador ya muestra errores de autocomplete
      } finally {
        setIsResolvingDestination(false);
      }
    },
    [focusOnCoordinate],
  );

  const handleSelectOrigin = useCallback(
    async (suggestion: AddressSuggestion) => {
      setIsResolvingOrigin(true);
      try {
        const place = await fetchPlaceLocation(suggestion.placeId);
        const marker = toSearchMarker(place, "origin");

        setOriginQuery(place.title);
        setOriginPlace(marker);
        focusOnCoordinate(place.coordinate);
      } catch {
        // Silencioso
      } finally {
        setIsResolvingOrigin(false);
      }
    },
    [focusOnCoordinate],
  );

  const handleStartPackage = useCallback(() => {
    setSelectedPlace(null);
    setPackageModalVisible(true);
  }, []);

  const handleClosePackageModal = useCallback(() => {
    if (pendingPackageSend || isAnimating) {
      return;
    }
    setPackageModalVisible(false);
  }, [isAnimating, pendingPackageSend]);

  useEffect(() => {
    if (!shouldOpenPackageModal) {
      return;
    }
    setPackageModalVisible(true);
    consumeOpenPackageModal();
  }, [shouldOpenPackageModal, consumeOpenPackageModal]);

  const handleConfirmPackage = useCallback(
    async (
      origin: MapMarker,
      destination: MapMarker,
      itemIds: string[],
      speed: ShippingSpeed,
    ) => {
      const quote = calculateDeliveryQuote(
        origin.coordinate,
        destination.coordinate,
        itemIds.length,
        speed,
      );

      const shipment = await createDelivery({
        origin: {
          title: origin.title,
          address: origin.address,
          placeId: origin.placeId,
          coordinate: origin.coordinate,
        },
        destination: {
          title: destination.title,
          address: destination.address,
          placeId: destination.placeId,
          coordinate: destination.coordinate,
        },
        itemIds,
        speed,
        quote,
      });

      activeShipmentIdRef.current = shipment.id;
      activeDestinationRef.current = destination.title || destination.address || "";
      setPackageMode(true);
      setShowOriginInput(false);
      setOriginPlace(origin);
      setDestinationPlace(destination);
      setOriginQuery(origin.title);
      setDestinationQuery(destination.title);
      setPackageItemIds(itemIds);
      setSelectedPlace(null);
      setPackageModalVisible(false);
      setPendingPackageSend(true);
      focusOnCoordinate(destination.coordinate);
    },
    [createDelivery, focusOnCoordinate],
  );

  useEffect(() => {
    if (!pendingPackageSend) {
      return;
    }

    if (routeError) {
      setPendingPackageSend(false);
      return;
    }

    if (isLoadingRoute || !canBuildRoute || routePath.length < 2) {
      return;
    }

    setPendingPackageSend(false);
    if (activeShipmentIdRef.current) {
      const current = getShipment(activeShipmentIdRef.current);
      if (current && current.status !== "in_transit") {
        void updateShipmentStatus(
          activeShipmentIdRef.current,
          "in_transit",
          "shipment.history.inTransit",
        );
      }
      if (current) {
        ensureTrackingStarted(
          activeShipmentIdRef.current,
          getInTransitStartedAt(current),
        );
      }
    }
    const shipmentId = activeShipmentIdRef.current;
    const startProgress = shipmentId
      ? getTrackingProgress(shipmentId, MARKER_ANIMATION_DURATION_MS)
      : 0;
    sendPackage(mapRef, startProgress);
  }, [
    canBuildRoute,
    getShipment,
    isLoadingRoute,
    pendingPackageSend,
    routeError,
    routePath.length,
    sendPackage,
    updateShipmentStatus,
  ]);

  const handleClearRouteData = useCallback(() => {
    setDestinationQuery("");
    setDestinationPlace(null);
    setOriginQuery("");
    setOriginPlace(null);
    setShowOriginInput(false);
    setPackageMode(false);
    setPackageModalVisible(false);
    setPendingPackageSend(false);
    setPackageItemIds([]);
    setSelectedPlace(null);
    // Evita reabrir el mismo tracking al limpiar la ruta.
    if (activeShipmentIdRef.current) {
      clearTrackingSession(activeShipmentIdRef.current);
      resumeAttemptedRef.current = activeShipmentIdRef.current;
    }
    activeShipmentIdRef.current = null;
    activeDestinationRef.current = "";
  }, []);

  // Reanuda tracking en vivo si hay un envío "en camino" (p. ej. iniciado desde chofer).
  useEffect(() => {
    if (packageMode || pendingPackageSend || isAnimating || packageModalVisible) {
      return;
    }

    const liveShipment = shipments.find((item) => item.status === "in_transit");
    if (!liveShipment) {
      return;
    }
    if (resumeAttemptedRef.current === liveShipment.id) {
      return;
    }

    resumeAttemptedRef.current = liveShipment.id;
    activeShipmentIdRef.current = liveShipment.id;
    activeDestinationRef.current =
      liveShipment.destination.title || liveShipment.destination.address || "";
    ensureTrackingStarted(
      liveShipment.id,
      getInTransitStartedAt(liveShipment),
    );

    const originMarker: MapMarker = {
      id: `live-origin-${liveShipment.id}`,
      title: liveShipment.origin.title,
      address: liveShipment.origin.address,
      placeId: liveShipment.origin.placeId,
      coordinate: liveShipment.origin.coordinate,
      icon: "location",
      color: "#16A34A",
    };
    const destinationMarker: MapMarker = {
      id: `live-dest-${liveShipment.id}`,
      title: liveShipment.destination.title,
      address: liveShipment.destination.address,
      placeId: liveShipment.destination.placeId,
      coordinate: liveShipment.destination.coordinate,
      icon: "location",
      color: "#2563EB",
    };

    setPackageMode(true);
    setShowOriginInput(false);
    setOriginPlace(originMarker);
    setDestinationPlace(destinationMarker);
    setOriginQuery(liveShipment.origin.title);
    setDestinationQuery(liveShipment.destination.title);
    setPackageItemIds(liveShipment.itemIds);
    setPendingPackageSend(true);
  }, [
    isAnimating,
    packageModalVisible,
    packageMode,
    pendingPackageSend,
    shipments,
  ]);

  // Si el chofer marca entregado mientras el cliente mira el mapa, cerramos el tracking.
  useEffect(() => {
    const shipmentId = activeShipmentIdRef.current;
    if (!shipmentId || !packageMode) {
      return;
    }

    const shipment = shipments.find((item) => item.id === shipmentId);
    if (!shipment) {
      return;
    }

    if (shipment.status === "delivered") {
      handleClearRouteData();
      return;
    }

    if (shipment.status === "cancelled") {
      handleClearRouteData();
    }
  }, [handleClearRouteData, packageMode, shipments]);

  const statusError = error ?? (canBuildRoute ? routeError : null);
  const remainingSeconds = Math.max(
    0,
    Math.ceil(((1 - progress) * MARKER_ANIMATION_DURATION_MS) / 1000),
  );

  const hasRouteMarkers = destinationPlace !== null || originPlace !== null;
  const hasRouteInputData =
    destinationQuery.trim().length > 0 || originQuery.trim().length > 0;
  const isPackageInTransit =
    packageMode &&
    (isAnimating || pendingPackageSend || (canBuildRoute && isLoadingRoute));
  const showStartPackage =
    !packageMode &&
    !showOriginInput &&
    !hasRouteInputData &&
    !packageModalVisible;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView
        edges={["top"]}
        className="px-4 pb-3 pt-2"
        style={{
          zIndex: 30,
          elevation: 30,
          backgroundColor: colors.surface,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => setMenuVisible(true)}
              hitSlop={8}
              accessibilityLabel={t("menu.open")}
            >
              <Ionicons name="menu" size={26} color={colors.text} />
            </Pressable>
            <Text
              className="ml-3 text-2xl font-bold"
              style={{ fontStyle: "italic", color: colors.text }}
            >
              RouteBox
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {!isOnline ? (
              <Text style={{ color: colors.amberText, fontSize: 12, fontWeight: "600" }}>
                {t("common.offlineShort")}
              </Text>
            ) : null}
            <Pressable
              onPress={() => toggleMode()}
              hitSlop={8}
              accessibilityLabel={t("common.toggleTheme")}
            >
              <Ionicons
                name={mode === "dark" ? "sunny-outline" : "moon-outline"}
                size={22}
                color={colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() => setNotificationsVisible(true)}
              hitSlop={8}
              accessibilityLabel={t("notifications.panelTitle")}
            >
              <View>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.text}
                />
                {unreadCount > 0 ? (
                  <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View className="flex-1" style={{ zIndex: 0 }}>
        <MapViewComponent
          mapRef={mapRef}
          region={region}
          markers={mapMarkers}
          showPlaceMarkers={hasRouteMarkers}
          hideMarkerLabels={
            Platform.OS === "android" && isPackageInTransit
          }
          showsUserLocation={Boolean(location)}
          onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
          onMarkerPress={hasRouteMarkers ? handleMarkerPress : undefined}
          onMapPress={handleMapPress}
          routePath={routePath}
          carPosition={position ?? undefined}
          heading={heading}
          driveMode={driveMode}
          isAnimating={isAnimating}
        />
        <TripStatusCard
          visible={isAnimating && driveMode !== "package"}
          mode={driveMode}
          progress={progress}
          remainingSeconds={remainingSeconds}
        />
        <MapControls
          onDriveOverview={handleDriveOverview}
          onDriveFollow3d={handleDriveFollow3d}
          onStartPackage={handleStartPackage}
          onClearRoute={handleClearRouteData}
          onOpenShipments={() => setScreen("shipments")}
          onOpenChat={() => {
            if (activeShipmentIdRef.current) {
              setScreen("chat", activeShipmentIdRef.current);
            }
          }}
          showDriveActions={originQuery.trim().length > 0 && !packageMode}
          showStartPackage={showStartPackage}
          showMyShipments={!isPackageInTransit}
          showPackageDelivery={isPackageInTransit}
          packageProgress={progress}
          packageRemainingSeconds={remainingSeconds}
          cargoItemIds={packageItemIds}
          showClearRoute={
            (hasRouteInputData || packageMode) && !isPackageInTransit
          }
          driveActionsDisabled={!canBuildRoute}
          driveOverviewLabel={t("controls.driveOverview")}
          driveFollow3dLabel={t("controls.driveFollow", {
            destination: destinationLabel,
          })}
          isAnimatingMarker={
            isAnimating ||
            pendingPackageSend ||
            (canBuildRoute && isLoadingRoute)
          }
          locationError={isPackageInTransit ? null : statusError}
        />
        <PlacesToggleButton
          onCenterUser={handleCenterUser}
          isLoadingLocation={isLoading}
        />
        <PlaceDetailSheet
          place={selectedPlace}
          visible={selectedPlace !== null}
          onClose={handleClosePlaceDetail}
        />
        <PackageSendModal
          visible={packageModalVisible}
          onClose={handleClosePackageModal}
          onConfirm={handleConfirmPackage}
          isSending={pendingPackageSend || (packageMode && isLoadingRoute)}
        />
        <NotificationsPanel
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
        />
      </View>

      <AppDrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectRole={(role) => void selectRole(role)}
        onOpenShipments={() => setScreen("shipments")}
      />
    </View>
  );
}
