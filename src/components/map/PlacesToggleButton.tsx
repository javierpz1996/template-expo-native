import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LANGUAGE_LABELS, type AppLanguage } from "../../i18n";
import { canUseLiquidGlass, GlassView } from "../common/liquidGlass";
import { LanguagePickerModal } from "./LanguagePickerModal";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PlacesToggleButtonProps = {
  onCenterUser: () => void;
  isLoadingLocation?: boolean;
};

const useGlass = canUseLiquidGlass();

function GlassIconButton({
  onPress,
  accessibilityLabel,
  loading = false,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  loading?: boolean;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const body = useGlass ? (
    <GlassView
      style={styles.glass}
      glassEffectStyle="regular"
      isInteractive
      colorScheme="light"
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color="#1C1C1E" /> : children}
      </View>
    </GlassView>
  ) : Platform.OS === "android" ? (
    <View style={[styles.glass, styles.androidSolid]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color="#1C1C1E" /> : children}
      </View>
    </View>
  ) : (
    <BlurView
      intensity={60}
      tint="systemUltraThinMaterialLight"
      style={styles.glass}
    >
      <View style={styles.fallbackTint} />
      <View style={styles.content}>
        {loading ? <ActivityIndicator color="#1C1C1E" /> : children}
      </View>
    </BlurView>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={loading}
      onPressIn={() => {
        if (!loading) {
          scale.value = withSpring(0.92, { damping: 16, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
      }}
      style={[styles.wrapper, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.border}>{body}</View>
    </AnimatedPressable>
  );
}

export function PlacesToggleButton({
  onCenterUser,
  isLoadingLocation = false,
}: PlacesToggleButtonProps) {
  const { t, i18n } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const languageCode = (i18n.language.split("-")[0] ?? "es") as AppLanguage;
  const languageLabel = LANGUAGE_LABELS[languageCode] ?? "ES";

  return (
    <>
      <View pointerEvents="box-none" style={styles.overlay}>
        <View pointerEvents="box-none" style={styles.topBar}>
          <GlassIconButton
            onPress={onCenterUser}
            accessibilityLabel={t("common.myLocation")}
            loading={isLoadingLocation}
          >
            <Ionicons name="compass" size={22} color="#1C1C1E" />
          </GlassIconButton>

          <GlassIconButton
            onPress={() => setLanguageModalVisible(true)}
            accessibilityLabel={t("common.changeLanguage")}
          >
            <View style={styles.languageContent}>
              <Ionicons name="globe-outline" size={18} color="#1C1C1E" />
              <Text style={styles.languageLabel}>{languageLabel}</Text>
            </View>
          </GlassIconButton>
        </View>
      </View>

      <LanguagePickerModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  topBar: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
  },
  wrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 30,
  },
  border: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(58, 58, 60, 0.2)",
    overflow: "hidden",
  },
  glass: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  androidSolid: {
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  languageContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  languageLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: 0.4,
  },
  fallbackTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
});
