import { create } from "zustand";
import {
  appendShipmentStatus,
  createShipment,
  markShipmentSynced,
} from "../services/shipments";
import {
  loadChatMessages,
  loadNotifications,
  loadOnboardingDone,
  loadRole,
  loadShipments,
  saveChatMessages,
  saveNotifications,
  saveOnboardingDone,
  saveRole,
  saveShipments,
} from "../services/storage";
import type {
  AppNotification,
  AppRole,
  ChatMessage,
  DeliveryQuote,
  RootScreen,
  Shipment,
  ShipmentPlace,
  ShipmentStatus,
  ShippingSpeed,
} from "../types/shipment";

type NetInfoModule = typeof import("@react-native-community/netinfo");

function getNetInfo(): NetInfoModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-community/netinfo") as NetInfoModule;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

function createNotification(
  titleKey: string,
  bodyKey: string,
  shipmentId?: string,
  bodyParams?: Record<string, string | number>,
): AppNotification {
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    titleKey,
    bodyKey,
    bodyParams,
    createdAt: new Date().toISOString(),
    read: false,
    shipmentId,
  };
}

type CreateDeliveryInput = {
  origin: ShipmentPlace;
  destination: ShipmentPlace;
  itemIds: string[];
  quote: DeliveryQuote;
  speed?: ShippingSpeed;
};

type AppState = {
  ready: boolean;
  hydrated: boolean;
  isOnline: boolean;
  role: AppRole | null;
  screen: RootScreen;
  selectedShipmentId: string | null;
  chatReturnScreen: RootScreen | null;
  shipments: Shipment[];
  notifications: AppNotification[];
  chatMessages: ChatMessage[];
  toast: AppNotification | null;
  shouldOpenPackageModal: boolean;

  hydrate: () => Promise<void>;
  setIsOnline: (value: boolean) => void;
  setScreen: (screen: RootScreen, shipmentId?: string | null) => void;
  openNewPackageFlow: () => void;
  consumeOpenPackageModal: () => void;
  completeOnboarding: () => Promise<void>;
  selectRole: (role: AppRole) => Promise<void>;
  switchRole: () => void;
  createDelivery: (input: CreateDeliveryInput) => Promise<Shipment>;
  updateShipmentStatus: (
    shipmentId: string,
    status: ShipmentStatus,
    noteKey?: string,
    notify?: boolean,
  ) => Promise<void>;
  cancelShipment: (shipmentId: string) => Promise<void>;
  repeatShipment: (shipmentId: string) => Shipment | null;
  getShipment: (shipmentId: string) => Shipment | undefined;
  sendChatMessage: (
    shipmentId: string,
    text: string,
    sender?: "client" | "driver",
  ) => Promise<void>;
  getChatForShipment: (shipmentId: string) => ChatMessage[];
  markNotificationsRead: () => Promise<void>;
  dismissToast: () => void;
  syncPending: () => Promise<void>;
  persistShipments: () => Promise<void>;
  persistNotifications: () => Promise<void>;
  persistChat: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  ready: true,
  hydrated: false,
  isOnline: true,
  role: null,
  screen: "onboarding",
  selectedShipmentId: null,
  chatReturnScreen: null,
  shipments: [],
  notifications: [],
  chatMessages: [],
  toast: null,
  shouldOpenPackageModal: false,

  hydrate: async () => {
    try {
      const [
        onboardingDone,
        storedRole,
        storedShipments,
        storedNotifications,
        storedChat,
      ] = await withTimeout(
        Promise.all([
          loadOnboardingDone(),
          loadRole(),
          loadShipments(),
          loadNotifications(),
          loadChatMessages(),
        ]),
        2500,
        [false, null, [], [], []] as const,
      );

      const current = get().shipments;
      let nextShipments = storedShipments;
      if (current.length > 0) {
        const byId = new Map(
          storedShipments.map((shipment) => [shipment.id, shipment]),
        );
        for (const shipment of current) {
          byId.set(shipment.id, shipment);
        }
        nextShipments = Array.from(byId.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }

      let screen: RootScreen = "onboarding";
      const role: AppRole = storedRole ?? "client";

      if (!onboardingDone) {
        screen = "onboarding";
      } else if (role === "driver") {
        screen = "driver";
      } else if (role === "admin") {
        screen = "admin";
      } else {
        screen = "client-map";
      }

      if (onboardingDone && !storedRole) {
        void saveRole("client");
      }

      set({
        shipments: nextShipments,
        notifications: storedNotifications,
        chatMessages: storedChat,
        role: onboardingDone ? role : storedRole,
        screen,
        hydrated: true,
        ready: true,
      });
    } catch {
      set({ screen: "onboarding", hydrated: true, ready: true });
    }
  },

  setIsOnline: (value) => set({ isOnline: value }),

  setScreen: (screen, shipmentId = null) => {
    const currentScreen = get().screen;
    if (screen === "chat") {
      set({
        screen,
        selectedShipmentId: shipmentId,
        chatReturnScreen: currentScreen,
      });
      return;
    }
    set({ screen, selectedShipmentId: shipmentId });
  },

  openNewPackageFlow: () =>
    set({
      shouldOpenPackageModal: true,
      selectedShipmentId: null,
      screen: "client-map",
    }),

  consumeOpenPackageModal: () => set({ shouldOpenPackageModal: false }),

  completeOnboarding: async () => {
    await saveOnboardingDone();
    await saveRole("client");
    set({ role: "client", screen: "client-map" });
  },

  selectRole: async (nextRole) => {
    await saveRole(nextRole);
    set({
      role: nextRole,
      screen:
        nextRole === "client"
          ? "client-map"
          : nextRole === "driver"
            ? "driver"
            : "admin",
    });
  },

  switchRole: () => {
    void get().selectRole("client");
  },
  createDelivery: async (input) => {
    const offlineCreated = !get().isOnline;
    let next = createShipment({
      ...input,
      speed: input.speed ?? input.quote.speed ?? "normal",
      offlineCreated,
    });

    if (!offlineCreated) {
      next = appendShipmentStatus(
        next,
        "assigned",
        "shipment.history.assigned",
      );
    }

    set((state) => ({ shipments: [next, ...state.shipments] }));

    const push = (notification: AppNotification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 40),
        toast: notification,
      }));
    };

    push(
      createNotification(
        offlineCreated
          ? "notifications.offlineTitle"
          : "notifications.createdTitle",
        offlineCreated
          ? "notifications.offlineBody"
          : "notifications.createdBody",
        next.id,
        { destination: next.destination.title },
      ),
    );

    if (!offlineCreated) {
      push(
        createNotification(
          "notifications.assignedTitle",
          "notifications.assignedBody",
          next.id,
        ),
      );
    }

    return next;
  },

  updateShipmentStatus: async (
    shipmentId,
    status,
    noteKey,
    notify = true,
  ) => {
    set((state) => ({
      shipments: state.shipments.map((item) =>
        item.id === shipmentId
          ? appendShipmentStatus(item, status, noteKey)
          : item,
      ),
    }));

    if (!notify) {
      return;
    }

    const push = (notification: AppNotification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 40),
        toast: notification,
      }));
    };

    if (status === "in_transit") {
      push(
        createNotification(
          "notifications.inTransitTitle",
          "notifications.inTransitBody",
          shipmentId,
        ),
      );
    }

    if (status === "delivered") {
      push(
        createNotification(
          "notifications.deliveredTitle",
          "notifications.deliveredBody",
          shipmentId,
        ),
      );
    }
  },

  cancelShipment: async (shipmentId) => {
    await get().updateShipmentStatus(
      shipmentId,
      "cancelled",
      "shipment.history.cancelled",
      false,
    );
    const notification = createNotification(
      "notifications.cancelledTitle",
      "notifications.cancelledBody",
      shipmentId,
    );
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 40),
      toast: notification,
    }));
  },

  getShipment: (shipmentId) =>
    get().shipments.find((item) => item.id === shipmentId),

  repeatShipment: (shipmentId) => get().getShipment(shipmentId) ?? null,

  sendChatMessage: async (shipmentId, text, sender = "client") => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      shipmentId,
      sender,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ chatMessages: [...state.chatMessages, message] }));

    if (sender === "client") {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-auto`,
          shipmentId,
          sender: "driver",
          text: "¡Recibido! Voy en camino y te aviso al llegar.",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, reply],
        }));
      }, 1200);
    }
  },

  getChatForShipment: (shipmentId) =>
    get().chatMessages.filter((message) => message.shipmentId === shipmentId),

  markNotificationsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    }));
  },

  dismissToast: () => set({ toast: null }),

  syncPending: async () => {
    if (!get().isOnline) {
      return;
    }
    set((state) => ({
      shipments: state.shipments.map((shipment) =>
        shipment.synced ? shipment : markShipmentSynced(shipment),
      ),
    }));
  },

  persistShipments: async () => {
    if (!get().hydrated) {
      return;
    }
    await saveShipments(get().shipments);
  },

  persistNotifications: async () => {
    if (!get().hydrated) {
      return;
    }
    await saveNotifications(get().notifications);
  },

  persistChat: async () => {
    if (!get().hydrated) {
      return;
    }
    await saveChatMessages(get().chatMessages);
  },
}));

export function useUnreadCount() {
  return useAppStore(
    (state) => state.notifications.filter((item) => !item.read).length,
  );
}

/** Compatibilidad con el antiguo useApp (selector amplio). */
export function useApp() {
  const state = useAppStore();
  const unreadCount = state.notifications.filter((item) => !item.read).length;
  return { ...state, unreadCount };
}

export function startNetInfoListener() {
  const netInfo = getNetInfo();
  return netInfo?.default.addEventListener((state) => {
    const connected = state.isConnected !== false;
    const reachable = state.isInternetReachable;
    useAppStore
      .getState()
      .setIsOnline(connected && reachable !== false);
  });
}
