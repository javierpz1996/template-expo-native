import { useEffect, type ReactNode } from "react";
import { startNetInfoListener, useAppStore } from "./appStore";
import { useThemeStore } from "./themeStore";

export function AppBootstrap({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((state) => state.hydrate);
  const hydrated = useAppStore((state) => state.hydrated);
  const isOnline = useAppStore((state) => state.isOnline);
  const shipments = useAppStore((state) => state.shipments);
  const notifications = useAppStore((state) => state.notifications);
  const chatMessages = useAppStore((state) => state.chatMessages);
  const persistShipments = useAppStore((state) => state.persistShipments);
  const persistNotifications = useAppStore(
    (state) => state.persistNotifications,
  );
  const persistChat = useAppStore((state) => state.persistChat);
  const syncPending = useAppStore((state) => state.syncPending);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);

  useEffect(() => {
    void hydrate();
    void hydrateTheme();
    const unsubscribe = startNetInfoListener();
    return () => {
      unsubscribe?.();
    };
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void persistShipments();
  }, [hydrated, shipments, persistShipments]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void persistNotifications();
  }, [hydrated, notifications, persistNotifications]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void persistChat();
  }, [hydrated, chatMessages, persistChat]);

  useEffect(() => {
    if (isOnline && hydrated) {
      void syncPending();
    }
  }, [isOnline, hydrated, syncPending]);

  return <>{children}</>;
}
