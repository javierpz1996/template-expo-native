import "./global.css";
import "./src/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationToast } from "./src/components/common/NotificationToast";
import { ThemeFadeRoot } from "./src/components/common/ThemeFadeRoot";
import { loadStoredLanguage } from "./src/i18n";
import { queryClient } from "./src/lib/queryClient";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DriverScreen } from "./src/screens/DriverScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ShipmentDetailScreen } from "./src/screens/ShipmentDetailScreen";
import { ShipmentsScreen } from "./src/screens/ShipmentsScreen";
import { AppBootstrap, useAppStore, useThemeStore } from "./src/store";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message ?? "Error inesperado",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.boot}>
          <Text style={styles.errorTitle}>Algo falló al iniciar</Text>
          <Text style={styles.errorBody}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigator() {
  const hydrated = useAppStore((state) => state.hydrated);
  const screen = useAppStore((state) => state.screen);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const mode = useThemeStore((state) => state.mode);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  let content = null;

  switch (screen) {
    case "onboarding":
      content = (
        <OnboardingScreen onContinue={() => void completeOnboarding()} />
      );
      break;
    case "shipments":
      content = <ShipmentsScreen />;
      break;
    case "shipment-detail":
      content = <ShipmentDetailScreen />;
      break;
    case "chat":
      content = <ChatScreen />;
      break;
    case "driver":
      content = <DriverScreen />;
      break;
    case "admin":
      content = <AdminDashboardScreen />;
      break;
    case "client-map":
    default:
      content = <MapScreen />;
      break;
  }

  return (
    <ThemeFadeRoot>
      <View style={styles.root}>
        {content}
        <NotificationToast />
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
      </View>
    </ThemeFadeRoot>
  );
}

export default function App() {
  useEffect(() => {
    void loadStoredLanguage();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider>
            <AppBootstrap>
              <RootNavigator />
            </AppBootstrap>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  errorBody: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
});
