import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import type MapView from "react-native-maps";
import { MARKER_ANIMATION_DURATION_MS } from "../constants/map";
import i18n from "../i18n";
import { fetchDrivingRoute } from "../services/routing";
import type { Coordinates } from "../types/map";
import {
  buildRouteSamples,
  sampleRouteAtDistance,
  type RouteSample,
} from "../utils/geo";

type MapRef = React.RefObject<MapView | null>;

export type DriveMode = "overview" | "follow3d" | "package";

const FRAME_MS = 50;

function showArrivedAlert(mode: DriveMode) {
  // El cierre de paquete lo maneja el toast + boleta (sin Alert duplicado).
  if (mode === "package") {
    return;
  }

  Alert.alert(i18n.t("trip.arrivedTitle"), i18n.t("trip.arrivedMessage"));
}

export function useRouteDrive(
  origin: Coordinates | null,
  destination: Coordinates | null,
  onArrived?: (mode: DriveMode) => void,
) {
  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;
  const [routePath, setRoutePath] = useState<Coordinates[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [heading, setHeading] = useState(0);
  const [progress, setProgress] = useState(0);
  const [driveMode, setDriveMode] = useState<DriveMode | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const samplesRef = useRef<RouteSample[]>([]);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnimatingRef = useRef(false);

  const stopAnimation = useCallback(() => {
    if (frameRef.current) {
      clearInterval(frameRef.current);
      frameRef.current = null;
    }
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setDriveMode(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!origin || !destination) {
      stopAnimation();
      samplesRef.current = [];
      setRoutePath([]);
      setPosition(null);
      setHeading(0);
      setProgress(0);
      setIsLoadingRoute(false);
      setRouteError(null);
      return;
    }

    (async () => {
      setIsLoadingRoute(true);
      setRouteError(null);

      try {
        const path = await fetchDrivingRoute(origin, destination);
        if (cancelled) {
          return;
        }

        samplesRef.current = buildRouteSamples(path);
        setRoutePath(path);
        setPosition(path[0] ?? origin);
        setHeading(samplesRef.current[0]?.heading ?? 0);
      } catch {
        if (!cancelled) {
          setRouteError(i18n.t("errors.routeFailed"));
          setRoutePath([]);
          setPosition(null);
          samplesRef.current = [];
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoute(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopAnimation();
    };
  }, [destination, origin, stopAnimation]);

  const driveAlongRoute = useCallback(
    (
      mapRef: MapRef,
      mode: DriveMode,
      durationMs = MARKER_ANIMATION_DURATION_MS,
      startProgress = 0,
    ) => {
      const samples = samplesRef.current;
      const path = samples.map((sample) => sample.coordinate);

      if (isAnimatingRef.current || samples.length < 2) {
        return;
      }

      stopAnimation();

      const totalDistance = samples[samples.length - 1].distanceFromStart;
      const clampedStart = Math.min(1, Math.max(0, startProgress));

      if (clampedStart >= 1) {
        const end = sampleRouteAtDistance(samples, totalDistance);
        setPosition(end.coordinate);
        setHeading(end.heading);
        setProgress(1);
        setDriveMode(mode);
        onArrivedRef.current?.(mode);
        return;
      }

      const start = sampleRouteAtDistance(
        samples,
        totalDistance * clampedStart,
      );

      isAnimatingRef.current = true;
      setPosition(start.coordinate);
      setHeading(start.heading);
      setProgress(clampedStart);
      setDriveMode(mode);
      setIsAnimating(true);

      if (mode === "overview" || mode === "package") {
        mapRef.current?.fitToCoordinates(path, {
          edgePadding: { top: 120, right: 40, bottom: 200, left: 40 },
          animated: true,
        });

        const driveStart = Date.now() - clampedStart * durationMs;

        frameRef.current = setInterval(() => {
          const elapsed = Date.now() - driveStart;
          const nextProgress = Math.min(1, elapsed / durationMs);
          const sample = sampleRouteAtDistance(
            samples,
            totalDistance * nextProgress,
          );

          setPosition(sample.coordinate);
          setHeading(sample.heading);
          setProgress(nextProgress);

          if (nextProgress >= 1) {
            stopAnimation();
            showArrivedAlert(mode);
            onArrivedRef.current?.(mode);
            mapRef.current?.animateToRegion(
              {
                latitude: sample.coordinate.latitude,
                longitude: sample.coordinate.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              800,
            );
          }
        }, FRAME_MS);

        return;
      }

      mapRef.current?.animateCamera(
        {
          center: start.coordinate,
          heading: start.heading,
          pitch: 50,
          zoom: 17,
        },
        { duration: 600 },
      );

      setTimeout(() => {
        if (!isAnimatingRef.current) {
          return;
        }

        const driveStart = Date.now() - clampedStart * durationMs;

        frameRef.current = setInterval(() => {
          const elapsed = Date.now() - driveStart;
          const nextProgress = Math.min(1, elapsed / durationMs);
          const sample = sampleRouteAtDistance(
            samples,
            totalDistance * nextProgress,
          );

          setPosition(sample.coordinate);
          setHeading(sample.heading);
          setProgress(nextProgress);

          mapRef.current?.setCamera({
            center: sample.coordinate,
            heading: sample.heading,
            pitch: 50,
            zoom: 17,
          });

          if (nextProgress >= 1) {
            stopAnimation();
            showArrivedAlert(mode);
            onArrivedRef.current?.(mode);
            mapRef.current?.animateCamera(
              {
                center: sample.coordinate,
                heading: sample.heading,
                pitch: 0,
                zoom: 14,
              },
              { duration: 900 },
            );
          }
        }, FRAME_MS);
      }, 650);
    },
    [stopAnimation],
  );

  const driveOverview = useCallback(
    (mapRef: MapRef) => {
      driveAlongRoute(mapRef, "overview", MARKER_ANIMATION_DURATION_MS);
    },
    [driveAlongRoute],
  );

  const driveFollow3d = useCallback(
    (mapRef: MapRef) => {
      driveAlongRoute(mapRef, "follow3d", MARKER_ANIMATION_DURATION_MS);
    },
    [driveAlongRoute],
  );

  const sendPackage = useCallback(
    (mapRef: MapRef, startProgress = 0) => {
      driveAlongRoute(
        mapRef,
        "package",
        MARKER_ANIMATION_DURATION_MS,
        startProgress,
      );
    },
    [driveAlongRoute],
  );

  return {
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
  };
}
