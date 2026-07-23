const sessions = new Map<string, number>();

export function ensureTrackingStarted(
  shipmentId: string,
  fallbackStartedAt?: number,
): void {
  if (!sessions.has(shipmentId)) {
    sessions.set(shipmentId, fallbackStartedAt ?? Date.now());
  }
}

export function getTrackingProgress(
  shipmentId: string,
  durationMs: number,
): number {
  const startedAt = sessions.get(shipmentId);
  if (!startedAt) {
    return 0;
  }
  return Math.min(1, (Date.now() - startedAt) / durationMs);
}

export function clearTrackingSession(shipmentId: string): void {
  sessions.delete(shipmentId);
}
