export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerBg: string;
  toastBg: string;
  toastBody: string;
  overlay: string;
  inputBg: string;
  success: string;
  amberBg: string;
  amberText: string;
};

export const lightColors: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  border: "#E2E8F0",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  primary: "#0F172A",
  primaryText: "#FFFFFF",
  danger: "#991B1B",
  dangerBg: "#FEE2E2",
  toastBg: "#111827",
  toastBody: "#D1D5DB",
  overlay: "rgba(0,0,0,0.45)",
  inputBg: "#F8FAFC",
  success: "#15803D",
  amberBg: "#FEF3C7",
  amberText: "#92400E",
};

export const darkColors: ThemeColors = {
  background: "#0B1220",
  surface: "#111827",
  surfaceMuted: "#1F2937",
  border: "#334155",
  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  primary: "#E2E8F0",
  primaryText: "#0F172A",
  danger: "#FECACA",
  dangerBg: "#7F1D1D",
  toastBg: "#1E293B",
  toastBody: "#CBD5E1",
  overlay: "rgba(0,0,0,0.65)",
  inputBg: "#1F2937",
  success: "#4ADE80",
  amberBg: "#78350F",
  amberText: "#FDE68A",
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}
