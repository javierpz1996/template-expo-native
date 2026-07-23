import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  APP_LANGUAGES,
  LANGUAGE_LABELS,
  setAppLanguage,
  type AppLanguage,
} from "../../i18n";

type LanguagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

const LANGUAGE_NAME_KEYS: Record<AppLanguage, string> = {
  es: "common.languageEs",
  en: "common.languageEn",
  pt: "common.languagePt",
};

export function LanguagePickerModal({
  visible,
  onClose,
}: LanguagePickerModalProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.language.split("-")[0] ?? "es") as AppLanguage;

  const handleSelect = (language: AppLanguage) => {
    void setAppLanguage(language);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="globe-outline" size={20} color="#1C1C1E" />
              <Text style={styles.title}>{t("common.selectLanguage")}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel={t("common.close")}
            >
              <Ionicons name="close" size={22} color="#1C1C1E" />
            </Pressable>
          </View>

          <View style={styles.options}>
            {APP_LANGUAGES.map((language) => {
              const selected = language === currentLanguage;

              return (
                <Pressable
                  key={language}
                  onPress={() => handleSelect(language)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.codeBadge,
                        selected && styles.codeBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.codeText,
                          selected && styles.codeTextSelected,
                        ]}
                      >
                        {LANGUAGE_LABELS[language]}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}
                    >
                      {t(LANGUAGE_NAME_KEYS[language])}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#1C1C1E"
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionSelected: {
    borderColor: "#1C1C1E",
    backgroundColor: "#F3F4F6",
  },
  optionPressed: {
    opacity: 0.88,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeBadge: {
    minWidth: 40,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
  },
  codeBadgeSelected: {
    backgroundColor: "#1C1C1E",
  },
  codeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  codeTextSelected: {
    color: "#ffffff",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  optionLabelSelected: {
    color: "#1C1C1E",
  },
});
