import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchAddressSuggestions } from "../services/places";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useAddressSuggestions(query: string) {
  const { i18n } = useTranslation();
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: ["address-suggestions", debouncedQuery, i18n.language],
    queryFn: () => fetchAddressSuggestions(debouncedQuery),
    enabled,
    staleTime: 60_000,
  });

  return {
    ...result,
    debouncedQuery,
    isWaitingDebounce:
      query.trim() !== debouncedQuery &&
      query.trim().length >= MIN_QUERY_LENGTH,
  };
}
