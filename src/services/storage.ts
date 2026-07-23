import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppNotification,
  AppRole,
  AdminProfile,
  ChatMessage,
  Shipment,
} from "../types/shipment";

const KEYS = {
  onboarding: "@pointmap/onboardingDone",
  role: "@pointmap/role",
  shipments: "@pointmap/shipments",
  notifications: "@pointmap/notifications",
  chat: "@pointmap/chat",
  adminProfile: "@pointmap/adminProfile",
} as const;

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: "",
  phone: "",
  favoriteAddress: "",
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignorar fallos de persistencia
  }
}

export async function loadOnboardingDone(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.onboarding);
    return value === "1";
  } catch {
    return false;
  }
}

export async function saveOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.onboarding, "1");
  } catch {
    // Ignorar
  }
}

export async function loadRole(): Promise<AppRole | null> {
  try {
    const value = await AsyncStorage.getItem(KEYS.role);
    if (value === "client" || value === "driver" || value === "admin") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveRole(role: AppRole): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.role, role);
  } catch {
    // Ignorar
  }
}

export async function loadShipments(): Promise<Shipment[]> {
  return readJson<Shipment[]>(KEYS.shipments, []);
}

export async function saveShipments(shipments: Shipment[]): Promise<void> {
  await writeJson(KEYS.shipments, shipments);
}

export async function loadNotifications(): Promise<AppNotification[]> {
  return readJson<AppNotification[]>(KEYS.notifications, []);
}

export async function saveNotifications(
  notifications: AppNotification[],
): Promise<void> {
  await writeJson(KEYS.notifications, notifications);
}

export async function loadChatMessages(): Promise<ChatMessage[]> {
  return readJson<ChatMessage[]>(KEYS.chat, []);
}

export async function saveChatMessages(messages: ChatMessage[]): Promise<void> {
  await writeJson(KEYS.chat, messages);
}

export async function loadAdminProfile(): Promise<AdminProfile> {
  return readJson<AdminProfile>(KEYS.adminProfile, DEFAULT_ADMIN_PROFILE);
}

export async function saveAdminProfile(profile: AdminProfile): Promise<void> {
  await writeJson(KEYS.adminProfile, profile);
}
