import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Chip, PaperProvider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MIN_PACKAGE_ITEMS,
  PACKAGE_CATALOG,
} from "../../data/packageItems";
import { calculateDeliveryQuote, formatMoneyARS } from "../../services/quote";
import { fetchPlaceLocation } from "../../services/places";
import type { AddressSuggestion, MapMarker } from "../../types/map";
import type { ShippingSpeed } from "../../types/shipment";
import { AddressSearchBar } from "./AddressSearchBar";
import { MapControlButton } from "./MapControlButton";

type PackageStep = "addresses" | "items";

type PackageSendModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    origin: MapMarker,
    destination: MapMarker,
    itemIds: string[],
    speed: ShippingSpeed,
  ) => void;
  isSending?: boolean;
};

function toSearchMarker(
  place: Awaited<ReturnType<typeof fetchPlaceLocation>>,
  prefix: "origin" | "destination",
): MapMarker {
  return {
    id: `${prefix}-${place.placeId}`,
    title: place.title,
    address: place.address,
    placeId: place.placeId,
    coordinate: place.coordinate,
    icon: "location",
    color: prefix === "origin" ? "#16A34A" : "#2563EB",
  };
}

export function PackageSendModal({
  visible,
  onClose,
  onConfirm,
  isSending = false,
}: PackageSendModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<PackageStep>("addresses");
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originPlace, setOriginPlace] = useState<MapMarker | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<MapMarker | null>(
    null,
  );
  const [isResolvingOrigin, setIsResolvingOrigin] = useState(false);
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [shippingSpeed, setShippingSpeed] = useState<ShippingSpeed>("normal");

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStep("addresses");
    setOriginQuery("");
    setDestinationQuery("");
    setOriginPlace(null);
    setDestinationPlace(null);
    setIsResolvingOrigin(false);
    setIsResolvingDestination(false);
    setSelectedItemIds([]);
    setShippingSpeed("normal");
  }, [visible]);

  const handleOriginChange = useCallback((text: string) => {
    setOriginQuery(text);
    if (!text.trim()) {
      setOriginPlace(null);
    }
  }, []);

  const handleDestinationChange = useCallback((text: string) => {
    setDestinationQuery(text);
    if (!text.trim()) {
      setDestinationPlace(null);
    }
  }, []);

  const handleSelectOrigin = useCallback(
    async (suggestion: AddressSuggestion) => {
      setIsResolvingOrigin(true);
      try {
        const place = await fetchPlaceLocation(suggestion.placeId);
        const marker = toSearchMarker(place, "origin");
        setOriginQuery(place.title);
        setOriginPlace(marker);
      } catch {
        // Silencioso: el buscador ya muestra errores de autocomplete
      } finally {
        setIsResolvingOrigin(false);
      }
    },
    [],
  );

  const handleSelectDestination = useCallback(
    async (suggestion: AddressSuggestion) => {
      setIsResolvingDestination(true);
      try {
        const place = await fetchPlaceLocation(suggestion.placeId);
        const marker = toSearchMarker(place, "destination");
        setDestinationQuery(place.title);
        setDestinationPlace(marker);
      } catch {
        // Silencioso
      } finally {
        setIsResolvingDestination(false);
      }
    },
    [],
  );

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }, []);

  const canContinueAddresses = Boolean(originPlace && destinationPlace);
  const canSend =
    Boolean(originPlace && destinationPlace) &&
    selectedItemIds.length >= MIN_PACKAGE_ITEMS &&
    !isSending;

  const selectedCountLabel = useMemo(
    () =>
      t("package.selectedCount", {
        count: selectedItemIds.length,
        min: MIN_PACKAGE_ITEMS,
      }),
    [selectedItemIds.length, t],
  );

  const quote = useMemo(() => {
    if (!originPlace || !destinationPlace || selectedItemIds.length === 0) {
      return null;
    }
    return calculateDeliveryQuote(
      originPlace.coordinate,
      destinationPlace.coordinate,
      selectedItemIds.length,
      shippingSpeed,
    );
  }, [destinationPlace, originPlace, selectedItemIds.length, shippingSpeed]);

  const handleContinue = useCallback(() => {
    if (!canContinueAddresses) {
      return;
    }
    setStep("items");
  }, [canContinueAddresses]);

  const handleBack = useCallback(() => {
    setStep("addresses");
  }, []);

  const handleConfirm = useCallback(() => {
    if (!originPlace || !destinationPlace || !canSend) {
      return;
    }
    onConfirm(originPlace, destinationPlace, selectedItemIds, shippingSpeed);
  }, [
    canSend,
    destinationPlace,
    onConfirm,
    originPlace,
    selectedItemIds,
    shippingSpeed,
  ]);

  const title =
    step === "addresses" ? t("package.modalTitle") : t("package.itemsTitle");
  const subtitle =
    step === "addresses"
      ? t("package.modalSubtitle")
      : t("package.itemsSubtitle", { min: MIN_PACKAGE_ITEMS });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* PaperProvider envuelve todo el Modal: Portal.Host necesita flex:1 */}
      <PaperProvider>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetWrap}
          >
            <View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <View style={styles.handle} />

              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  {step === "items" ? (
                    <Pressable
                      onPress={handleBack}
                      hitSlop={10}
                      accessibilityLabel={t("package.back")}
                    >
                      <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
                    </Pressable>
                  ) : null}
                  <Ionicons name="cube" size={20} color="#1C1C1E" />
                  <Text style={styles.title}>{title}</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityLabel={t("common.close")}
                >
                  <Ionicons name="close" size={22} color="#1C1C1E" />
                </Pressable>
              </View>

              <Text style={styles.subtitle}>{subtitle}</Text>

              {step === "addresses" ? (
                <View style={styles.fields}>
                  <AddressSearchBar
                    value={originQuery}
                    onChangeText={handleOriginChange}
                    onSelect={handleSelectOrigin}
                    isResolving={isResolvingOrigin}
                    placeholder={t("search.packageOriginPlaceholder")}
                    label={t("search.from")}
                    icon="radio-button-on"
                    listZIndex={60}
                  />
                  <AddressSearchBar
                    value={destinationQuery}
                    onChangeText={handleDestinationChange}
                    onSelect={handleSelectDestination}
                    isResolving={isResolvingDestination}
                    placeholder={t("search.packageDestinationPlaceholder")}
                    label={t("search.to")}
                    icon="flag"
                    listZIndex={50}
                  />
                </View>
              ) : (
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionLabel}>{t("package.speedTitle")}</Text>
                  <View style={styles.speedRow}>
                    <Pressable
                      style={[
                        styles.speedCard,
                        shippingSpeed === "normal" && styles.speedCardSelected,
                      ]}
                      onPress={() => setShippingSpeed("normal")}
                    >
                      <Text
                        style={[
                          styles.speedTitle,
                          shippingSpeed === "normal" && styles.speedTitleSelected,
                        ]}
                      >
                        {t("package.speedNormal")}
                      </Text>
                      <Text style={styles.speedHint}>
                        {t("package.speedNormalHint")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.speedCard,
                        shippingSpeed === "express" && styles.speedCardSelected,
                      ]}
                      onPress={() => setShippingSpeed("express")}
                    >
                      <Text
                        style={[
                          styles.speedTitle,
                          shippingSpeed === "express" &&
                            styles.speedTitleSelected,
                        ]}
                      >
                        {t("package.speedExpress")}
                      </Text>
                      <Text style={styles.speedHint}>
                        {t("package.speedExpressHint")}
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                    {t("package.itemsTitle")}
                  </Text>
                  <Text style={styles.countLabel}>{selectedCountLabel}</Text>
                  <View style={styles.chipsWrap}>
                    {PACKAGE_CATALOG.map((item) => {
                      const selected = selectedItemIds.includes(item.id);

                      return (
                        <Chip
                          key={item.id}
                          selected={selected}
                          showSelectedCheck
                          onPress={() => toggleItem(item.id)}
                          icon={({ size, color }) => (
                            <Ionicons
                              name={item.icon}
                              size={size}
                              color={color}
                            />
                          )}
                          style={[
                            styles.chip,
                            selected && styles.chipSelected,
                          ]}
                          textStyle={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                          selectedColor="#1C1C1E"
                        >
                          {t(item.nameKey)}
                        </Chip>
                      );
                    })}
                  </View>

                  {quote ? (
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteTitle}>
                        {t("package.quoteTitle")}
                      </Text>
                      <Text style={styles.quoteLine}>
                        {t("package.quoteDistance", {
                          km: quote.distanceKm,
                          minutes: quote.etaMinutes,
                        })}
                      </Text>
                      <Text style={styles.quoteLine}>
                        {t(
                          shippingSpeed === "express"
                            ? "package.speedExpress"
                            : "package.speedNormal",
                        )}
                        {quote.serviceFee > 0
                          ? ` · +${formatMoneyARS(quote.serviceFee)}`
                          : ""}
                      </Text>
                      <Text style={styles.quoteTotal}>
                        {formatMoneyARS(quote.total)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={styles.footer}>
                {step === "addresses" ? (
                  <MapControlButton
                    label={t("package.continue")}
                    icon="arrow-forward"
                    onPress={handleContinue}
                    variant="accent"
                    disabled={!canContinueAddresses}
                  />
                ) : (
                  <MapControlButton
                    label={t("controls.sendPackage")}
                    icon="cube"
                    onPress={handleConfirm}
                    variant="accent"
                    loading={isSending}
                    disabled={!canSend}
                  />
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </PaperProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrap: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  fields: {
    zIndex: 10,
  },
  itemsSection: {
    marginTop: 8,
  },
  sectionLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  sectionLabelSpaced: {
    marginTop: 18,
  },
  speedRow: {
    flexDirection: "row",
    gap: 10,
  },
  speedCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  speedCardSelected: {
    borderColor: "#0F172A",
    backgroundColor: "#E2E8F0",
  },
  speedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  speedTitleSelected: {
    color: "#0F172A",
  },
  speedHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: "#64748B",
  },
  countLabel: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quoteBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    padding: 14,
  },
  quoteTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  quoteLine: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
  },
  quoteTotal: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  chip: {
    backgroundColor: "#F3F4F6",
  },
  chipSelected: {
    backgroundColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  chipTextSelected: {
    color: "#1C1C1E",
  },
  footer: {
    marginTop: 20,
  },
});
