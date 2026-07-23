import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAddressSuggestions } from "../../hooks/useAddressSuggestions";
import type { AddressSuggestion } from "../../types/map";

type AddressSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  label?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  isResolving?: boolean;
  /** Más alto = lista de sugerencias por encima de otros inputs */
  listZIndex?: number;
};

const INPUT_HEIGHT = 44;

export function AddressSearchBar({
  value,
  onChangeText,
  onSelect,
  placeholder,
  label,
  icon = "search",
  isResolving = false,
  listZIndex = 40,
}: AddressSearchBarProps) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const { data, isFetching, isError, error, isWaitingDebounce } =
    useAddressSuggestions(value);

  const suggestions = data ?? [];
  const showList =
    isFocused &&
    value.trim().length >= 2 &&
    (suggestions.length > 0 || isFetching || isWaitingDebounce || isError);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChangeText(suggestion.primaryText);
    setIsFocused(false);
    Keyboard.dismiss();
    onSelect(suggestion);
  };

  const handleClear = () => {
    onChangeText("");
  };

  const showTrailingLoader = isFetching || isResolving || isWaitingDebounce;
  const resolvedPlaceholder = placeholder ?? t("search.placeholder");

  return (
    <View className="relative mt-3" style={{ zIndex: listZIndex }}>
      {label ? (
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </Text>
      ) : null}

      <View style={styles.inputRow}>
        <View style={styles.leadingIcon}>
          <Ionicons name={icon} size={18} color="#64748B" />
        </View>

        <TextInput
          style={styles.input}
          placeholder={resolvedPlaceholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 180);
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="never"
          underlineColorAndroid="transparent"
          numberOfLines={1}
        />

        <View style={styles.trailingSlot}>
          {showTrailingLoader ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : value.length > 0 ? (
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              accessibilityLabel={t("common.clearSearch")}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showList ? (
        <View
          className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          style={{
            elevation: 12,
            zIndex: listZIndex + 10,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {isError ? (
            <Text className="px-3 py-3 text-sm text-red-500">
              {error instanceof Error
                ? error.message
                : t("search.suggestionsError")}
            </Text>
          ) : suggestions.length === 0 && (isFetching || isWaitingDebounce) ? (
            <Text className="px-3 py-3 text-sm text-slate-400">
              {t("common.searching")}
            </Text>
          ) : suggestions.length === 0 ? (
            <Text className="px-3 py-3 text-sm text-slate-400">
              {t("common.noResults")}
            </Text>
          ) : (
            suggestions.map((item, index) => (
              <Pressable
                key={item.placeId}
                onPress={() => handleSelect(item)}
                className={`flex-row items-start px-3 py-3 active:bg-slate-50 ${
                  index < suggestions.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#64748B"
                  style={{ marginTop: 2 }}
                />
                <View className="ml-2 flex-1">
                  <Text className="text-sm font-medium text-slate-900">
                    {item.primaryText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      className="mt-0.5 text-xs text-slate-500"
                      numberOfLines={2}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    height: INPUT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },
  leadingIcon: {
    width: 22,
    height: INPUT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  trailingSlot: {
    width: 22,
    height: INPUT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: INPUT_HEIGHT,
    marginHorizontal: 8,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    fontSize: 16,
    color: "#0F172A",
    ...Platform.select({
      android: {
        textAlignVertical: "center",
        includeFontPadding: false,
      },
      ios: {
        paddingTop: 0,
        paddingBottom: 0,
      },
      default: {},
    }),
  },
});
