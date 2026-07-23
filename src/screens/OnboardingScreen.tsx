import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedEntrance } from "../components/common/AnimatedEntrance";

const SLIDES = [
  {
    icon: "cube-outline" as const,
    titleKey: "onboarding.slide1Title",
    bodyKey: "onboarding.slide1Body",
  },
  {
    icon: "navigate-outline" as const,
    titleKey: "onboarding.slide2Title",
    bodyKey: "onboarding.slide2Body",
  },
  {
    icon: "business-outline" as const,
    titleKey: "onboarding.slide3Title",
    bodyKey: "onboarding.slide3Body",
  },
];

type OnboardingScreenProps = {
  onContinue: () => void;
};

export function OnboardingScreen({ onContinue }: OnboardingScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <AnimatedEntrance delay={40} offsetY={10}>
        <View style={styles.brandRow}>
          <Ionicons name="pin" size={28} color="#0F172A" />
          <Text style={styles.brand}>RouteBox</Text>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={100}>
        <Text style={styles.headline}>{t("onboarding.headline")}</Text>
        <Text style={styles.subheadline}>{t("onboarding.subheadline")}</Text>
      </AnimatedEntrance>

      <View style={styles.slides}>
        {SLIDES.map((slide, index) => (
          <AnimatedEntrance
            key={slide.titleKey}
            delay={160 + index * 90}
            offsetY={16}
          >
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={slide.icon} size={22} color="#0F172A" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{t(slide.titleKey)}</Text>
                <Text style={styles.cardBody}>{t(slide.bodyKey)}</Text>
              </View>
            </View>
          </AnimatedEntrance>
        ))}
      </View>

      <AnimatedEntrance delay={460} offsetY={10}>
        <Pressable style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaLabel}>{t("onboarding.cta")}</Text>
        </Pressable>
      </AnimatedEntrance>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#0F172A",
  },
  headline: {
    marginTop: 28,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#0F172A",
  },
  subheadline: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: "#64748B",
  },
  slides: {
    marginTop: 28,
    gap: 12,
    flex: 1,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  cta: {
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
