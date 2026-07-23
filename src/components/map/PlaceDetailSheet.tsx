import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getLocaleTag } from "../../i18n";
import { usePlaceDetails } from "../../hooks/usePlaceDetails";
import type { MapMarker } from "../../types/map";

type PlaceDetailSheetProps = {
  place: MapMarker | null;
  visible: boolean;
  onClose: () => void;
};

const PHOTO_GRID_HEIGHT = 200;
const SHEET_HORIZONTAL_PADDING = 40;
const PHOTO_PAGE_WIDTH = Dimensions.get("window").width - SHEET_HORIZONTAL_PADDING;

function formatWebsiteLabel(
  websiteUri: string | undefined,
  emptyLabel: string,
): string {
  if (!websiteUri) {
    return emptyLabel;
  }

  try {
    const hostname = new URL(websiteUri).hostname.replace(/^www\./, "");
    return hostname || websiteUri;
  } catch {
    return websiteUri
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

function chunkPhotos(photos: string[], size = 3): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < photos.length; i += size) {
    pages.push(photos.slice(i, i + size));
  }
  return pages;
}

function PhotoGrid({
  photos,
  width,
}: {
  photos: string[];
  width: number;
}) {
  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <View style={[styles.photoPage, { width }]}>
        <Image
          source={{ uri: photos[0] }}
          style={styles.photoSingle}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (photos.length === 2) {
    return (
      <View style={[styles.photoPage, { width }]}>
        <View style={styles.photoGrid}>
          <Image
            source={{ uri: photos[0] }}
            style={styles.photoMain}
            resizeMode="cover"
          />
          <Image
            source={{ uri: photos[1] }}
            style={styles.photoSideFull}
            resizeMode="cover"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.photoPage, { width }]}>
      <View style={styles.photoGrid}>
        <Image
          source={{ uri: photos[0] }}
          style={styles.photoMain}
          resizeMode="cover"
        />
        <View style={styles.photoSideColumn}>
          <Image
            source={{ uri: photos[1] }}
            style={styles.photoSide}
            resizeMode="cover"
          />
          <Image
            source={{ uri: photos[2] }}
            style={styles.photoSide}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

function PhotoGridCarousel({
  photos,
  extraDotsMargin = false,
}: {
  photos: string[];
  extraDotsMargin?: boolean;
}) {
  const pages = useMemo(() => chunkPhotos(photos, 3), [photos]);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    setActivePage(0);
  }, [photos]);

  if (pages.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextPage = Math.round(offsetX / PHOTO_PAGE_WIDTH);
    setActivePage(nextPage);
  };

  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={PHOTO_PAGE_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {pages.map((pagePhotos, index) => (
          <PhotoGrid
            key={`photo-page-${index}`}
            photos={pagePhotos}
            width={PHOTO_PAGE_WIDTH}
          />
        ))}
      </ScrollView>

      {pages.length > 1 ? (
        <View
          style={[
            styles.dotsRow,
            extraDotsMargin ? styles.dotsRowExtraMargin : null,
          ]}
        >
          {pages.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                index === activePage ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const name =
          rating >= starValue
            ? "star"
            : rating >= starValue - 0.5
              ? "star-half"
              : "star-outline";

        return (
          <Ionicons key={starValue} name={name} size={14} color="#F59E0B" />
        );
      })}
    </View>
  );
}

export function PlaceDetailSheet({
  place,
  visible,
  onClose,
}: PlaceDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    data: googleDetails,
    isLoading: isLoadingGoogle,
    error,
  } = usePlaceDetails({
    place,
    enabled: visible,
  });

  const googleError =
    error instanceof Error
      ? error.message
      : error
        ? t("place.googleError")
        : null;

  const usesGoogle = Boolean(place?.placeId || place?.googlePlaceQuery);
  const title = googleDetails?.title || place?.title || "";
  // Si viene de Google, no mezclar about local (queda en el idioma anterior)
  const about = usesGoogle
    ? googleDetails?.about
    : googleDetails?.about || place?.about;
  const address = googleDetails?.address || place?.address;
  const photos =
    googleDetails?.photos?.length && googleDetails.photos.length > 0
      ? googleDetails.photos
      : (place?.photos ?? []);
  const rating = googleDetails?.rating;
  const userRatingCount = googleDetails?.userRatingCount;
  const wheelchairAccessible =
    googleDetails?.wheelchairAccessibleEntrance === true;
  const isOpenNow = googleDetails?.isOpenNow;
  const openingHoursText = googleDetails?.openingHoursText;
  const websiteUri = googleDetails?.websiteUri;
  const websiteLabel = formatWebsiteLabel(websiteUri, t("place.noWebsite"));
  const phoneNumber = googleDetails?.phoneNumber;
  const reviews = googleDetails?.reviews ?? [];

  return (
    <Modal
      visible={visible && place !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        {place ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                <View style={styles.headerInfo}>
                  <Text style={styles.title}>{title}</Text>

                  {typeof rating === "number" ? (
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                      <StarRating rating={rating} />
                      {userRatingCount ? (
                        <Text style={styles.reviewsCount}>
                          {t("place.reviews", {
                            count: userRatingCount.toLocaleString(
                              getLocaleTag(i18n.language),
                            ),
                          })}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {place.category || wheelchairAccessible ? (
                    <View style={styles.categoryRow}>
                      {place.category ? (
                        <Text style={styles.category}>{place.category}</Text>
                      ) : null}
                      {place.category && wheelchairAccessible ? (
                        <Text style={styles.categorySeparator}>-</Text>
                      ) : null}
                      {wheelchairAccessible ? (
                        <View style={styles.accessibleBadge}>
                          <Ionicons
                            name="accessibility"
                            size={14}
                            color="#2563eb"
                          />
                          <Text style={styles.accessibleText}>
                            {t("place.accessible")}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#1C1C1E" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {isLoadingGoogle ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#1C1C1E" />
                </View>
              ) : null}

              {googleError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{googleError}</Text>
                </View>
              ) : null}

              {photos.length > 0 ? (
                <PhotoGridCarousel
                  photos={photos}
                  extraDotsMargin={!about}
                />
              ) : null}

              {about ? (
                <View style={styles.aboutSection}>
                  <View style={styles.separator} />
                  <Text style={styles.about}>{about}</Text>
                </View>
              ) : null}

              {address ||
              typeof isOpenNow === "boolean" ||
              openingHoursText ||
              phoneNumber ||
              !isLoadingGoogle ? (
                <View>
                  <View style={styles.separator} />
                  <View style={styles.infoList}>
                    {address ? (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#1C1C1E"
                        />
                        <Text style={styles.infoText}>{address}</Text>
                      </View>
                    ) : null}

                    {typeof isOpenNow === "boolean" || openingHoursText ? (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color="#1C1C1E"
                        />
                        <View style={styles.infoTextWrap}>
                          {typeof isOpenNow === "boolean" ? (
                            <Text
                              style={[
                                styles.infoText,
                                isOpenNow ? styles.openText : styles.closedText,
                              ]}
                            >
                              {isOpenNow
                                ? t("place.openNow")
                                : t("place.closedNow")}
                            </Text>
                          ) : null}
                          {openingHoursText ? (
                            <Text style={styles.infoSubText}>
                              {openingHoursText}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : null}

                    {websiteUri ? (
                      <Pressable
                        style={styles.infoRow}
                        onPress={() => {
                          void Linking.openURL(websiteUri);
                        }}
                      >
                        <Ionicons
                          name="globe-outline"
                          size={18}
                          color="#1C1C1E"
                        />
                        <Text style={[styles.infoText, styles.linkText]}>
                          {websiteLabel}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="globe-outline"
                          size={18}
                          color="#9ca3af"
                        />
                        <Text style={[styles.infoText, styles.mutedText]}>
                          {websiteLabel}
                        </Text>
                      </View>
                    )}

                    {phoneNumber ? (
                      <Pressable
                        style={styles.infoRow}
                        onPress={() => {
                          void Linking.openURL(`tel:${phoneNumber}`);
                        }}
                      >
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color="#1C1C1E"
                        />
                        <Text style={[styles.infoText, styles.linkText]}>
                          {phoneNumber}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.separator} />
                </View>
              ) : about ? (
                <View style={styles.separator} />
              ) : null}

              {reviews.length > 0 ? (
                <View style={styles.reviewsSection}>
                  <Text style={styles.reviewsTitle}>
                    {t("place.reviewsTitle")}
                  </Text>
                  {reviews.map((review, index) => (
                    <View
                      key={`${review.authorName ?? "review"}-${index}`}
                      style={styles.reviewCard}
                    >
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewAuthor}>
                          {review.authorName ?? t("place.googleUser")}
                        </Text>
                        {typeof review.rating === "number" ? (
                          <View style={styles.reviewRating}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.reviewRatingText}>
                              {review.rating.toFixed(1)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {review.relativeTime ? (
                        <Text style={styles.reviewTime}>{review.relativeTime}</Text>
                      ) : null}
                      {review.text ? (
                        <Text style={styles.reviewText} numberOfLines={4}>
                          {review.text}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {usesGoogle && !isLoadingGoogle && !googleError ? (
                <Text style={styles.attribution}>
                  {t("place.attribution")}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  headerInfo: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  reviewsCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  category: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  categorySeparator: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  accessibleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accessibleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorBox: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#B91C1C",
  },
  photoGrid: {
    flex: 1,
    height: PHOTO_GRID_HEIGHT,
    flexDirection: "row",
    gap: 8,
  },
  photoPage: {
    height: PHOTO_GRID_HEIGHT,
  },
  carouselWrap: {
    gap: 10,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dotsRowExtraMargin: {
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1C1C1E",
  },
  photoSingle: {
    width: "100%",
    height: PHOTO_GRID_HEIGHT,
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
  },
  photoMain: {
    flex: 2,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
  },
  photoSideColumn: {
    flex: 1,
    gap: 8,
  },
  photoSide: {
    flex: 1,
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
  },
  photoSideFull: {
    flex: 1,
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
  },
  aboutSection: {
    marginTop: 14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#c4c8ce",
  },
  about: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
  infoList: {
    marginTop: 16,
    marginBottom: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#1C1C1E",
  },
  infoSubText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
  },
  openText: {
    color: "#15803d",
    fontWeight: "600",
  },
  closedText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  mutedText: {
    color: "#9ca3af",
    fontWeight: "500",
  },
  reviewsSection: {
    marginTop: 20,
    gap: 12,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  reviewCard: {
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    padding: 12,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewAuthor: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  reviewTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  reviewText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#4b5563",
  },
  attribution: {
    marginTop: 14,
    fontSize: 11,
    color: "#9ca3af",
  },
});
