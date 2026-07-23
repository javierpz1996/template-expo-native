import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getThemeColors,
  type ThemeColors,
  type ThemeMode,
} from "../theme/colors";

const THEME_KEY = "@routebox/themeMode";

type ThemeFadeHandler = (nextMode: ThemeMode) => void;

let fadeHandler: ThemeFadeHandler | null = null;

export function registerThemeFadeHandler(handler: ThemeFadeHandler | null) {
  fadeHandler = handler;
}

type ThemeState = {
  mode: ThemeMode;
  colors: ThemeColors;
  hydrated: boolean;
  isAnimatingTheme: boolean;
  hydrateTheme: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAnimatingTheme: (value: boolean) => void;
  toggleMode: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  colors: getThemeColors("light"),
  hydrated: false,
  isAnimatingTheme: false,

  hydrateTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const mode: ThemeMode = stored === "dark" ? "dark" : "light";
      set({ mode, colors: getThemeColors(mode), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setMode: async (mode) => {
    set({ mode, colors: getThemeColors(mode) });
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {
      // Ignorar
    }
  },

  setAnimatingTheme: (value) => set({ isAnimatingTheme: value }),

  toggleMode: () => {
    if (get().isAnimatingTheme) {
      return;
    }
    const next: ThemeMode = get().mode === "dark" ? "light" : "dark";
    if (fadeHandler) {
      fadeHandler(next);
      return;
    }
    void get().setMode(next);
  },
}));
