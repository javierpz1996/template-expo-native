import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { queryClient } from "../lib/queryClient";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";

export const APP_LANGUAGES = ["es", "en", "pt"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
};

const STORAGE_KEY = "@maps-app/language";

export function isAppLanguage(value: string): value is AppLanguage {
  return APP_LANGUAGES.includes(value as AppLanguage);
}

export function getNextLanguage(current: string): AppLanguage {
  const normalized = current.split("-")[0] ?? "es";
  const index = APP_LANGUAGES.findIndex((lang) => lang === normalized);
  const safeIndex = index >= 0 ? index : 0;
  return APP_LANGUAGES[(safeIndex + 1) % APP_LANGUAGES.length];
}

export function getPlacesLanguageCode(language = i18n.language): string {
  const normalized = language.split("-")[0] ?? "es";
  if (normalized === "pt") {
    return "pt-BR";
  }
  if (normalized === "en") {
    return "en";
  }
  return "es";
}

export function getLocaleTag(language = i18n.language): string {
  const normalized = language.split("-")[0] ?? "es";
  if (normalized === "pt") {
    return "pt-BR";
  }
  if (normalized === "en") {
    return "en-US";
  }
  return "es-AR";
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: "es",
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
    skipOnVariables: false,
  },
});

export async function loadStoredLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isAppLanguage(stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // Mantener español por defecto
  }
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);

  // Evitar mostrar detalles/sugerencias cacheados del idioma anterior
  queryClient.removeQueries({ queryKey: ["place-details"] });
  queryClient.removeQueries({ queryKey: ["address-suggestions"] });

  try {
    await AsyncStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignorar fallo de persistencia
  }
}

export async function cycleAppLanguage(): Promise<AppLanguage> {
  const next = getNextLanguage(i18n.language);
  await setAppLanguage(next);
  return next;
}

export default i18n;
