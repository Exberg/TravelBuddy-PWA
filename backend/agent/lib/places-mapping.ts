// Pure mapping helpers between Google Places API (New) Text Search responses
// and the PlaceItem shape the frontend renders. No network calls in here so
// this stays unit-testable.

export type PlaceCategory = "sights" | "cafes" | "stays";

export interface NormalizedPlace {
  id: string;
  title: string;
  subtitle: string;
  category: PlaceCategory;
  rating: number;
  photoName: string | null;
  iconName: string;
  lat: number;
  lng: number;
}

// Google Places API (New) Text Search response shapes (fields we ask for via
// the field mask). Left loose/partial because Google can omit any of these.
export interface GooglePlacePhoto {
  name?: string;
}

export interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  rating?: number;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  photos?: GooglePlacePhoto[];
}

export interface GoogleTextSearchResponse {
  places?: GooglePlace[];
}

// Additional fields returned by the Place Details (New) endpoint, on top of
// the search fields above. Kept partial/loose because Google may omit any.
export interface GooglePlaceReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
    uri?: string;
  };
}

export interface GooglePlaceDetails extends GooglePlace {
  userRatingCount?: number;
  editorialSummary?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  priceLevel?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
}

export interface NormalizedReview {
  author: string;
  authorPhotoUri: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface NormalizedPlaceDetails {
  id: string;
  title: string;
  address: string;
  category?: string;
  rating: number;
  userRatingCount: number;
  summary: string | null;
  priceLevel: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  photoNames: string[];
  reviews: NormalizedReview[];
}

const CATEGORY_QUERY_TEXT: Record<PlaceCategory, (destination: string) => string> = {
  sights: (destination) => `top attractions in ${destination}`,
  cafes: (destination) => `cafes in ${destination}`,
  stays: (destination) => `places to stay in ${destination}`,
};

export function buildTextSearchQuery(
  destination: string,
  category: PlaceCategory,
): string {
  return CATEGORY_QUERY_TEXT[category](destination);
}

// Maps a Google place `types` array to a Material Symbols icon name used by
// the existing pin bubble / place-card UI.
const TYPE_ICON_MAP: Array<{ types: readonly string[]; icon: string }> = [
  { types: ["cafe", "coffee_shop"], icon: "local_cafe" },
  { types: ["lodging", "hotel"], icon: "hotel" },
  { types: ["museum"], icon: "museum" },
  { types: ["park", "national_park"], icon: "landscape" },
  { types: ["tourist_attraction", "point_of_interest"], icon: "tour" },
];

const CATEGORY_DEFAULT_ICON: Record<PlaceCategory, string> = {
  sights: "location_on",
  cafes: "local_cafe",
  stays: "hotel",
};

function resolveIcon(category: PlaceCategory, types: string[] | undefined): string {
  if (types) {
    for (const entry of TYPE_ICON_MAP) {
      if (types.some((type) => entry.types.includes(type))) {
        return entry.icon;
      }
    }
  }
  return CATEGORY_DEFAULT_ICON[category];
}

function resolveSubtitle(place: GooglePlace, rating: number): string {
  const area = place.shortFormattedAddress ?? place.formattedAddress ?? "";
  const ratingText = rating > 0 ? rating.toFixed(1) : "New";
  return area ? `${area} • ${ratingText}` : ratingText;
}

/**
 * Validates and decodes a URL-encoded Google photo resource name
 * (e.g. "places/<id>/photos/<photo-id>"), rejecting anything that doesn't
 * look like a Google Places photo resource path.
 */
export function decodePhotoName(encodedName: string | undefined): string | null {
  if (!encodedName) return null;
  const photoName = decodeURIComponent(encodedName);
  if (!photoName.startsWith("places/") || photoName.includes("..")) return null;
  return photoName;
}

/**
 * Builds the Google Places Photo media URL for a validated photo resource
 * name. Does not validate `photoName`; call {@link decodePhotoName} first.
 */
export function buildPhotoMediaUrl(
  photoName: string,
  apiKey: string,
  maxWidthPx = 800,
): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
}

/**
 * Converts one Google Places API (New) Text Search response into normalized
 * places for a given category. Skips places missing an id or coordinates,
 * since those can't be rendered as pins.
 */
export function mapTextSearchResponse(
  response: GoogleTextSearchResponse,
  category: PlaceCategory,
): NormalizedPlace[] {
  const places = response.places ?? [];
  const results: NormalizedPlace[] = [];

  for (const place of places) {
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (!place.id || lat === undefined || lng === undefined) continue;

    const rating = typeof place.rating === "number" ? place.rating : 0;
    const photoName = place.photos?.[0]?.name ?? null;

    results.push({
      id: place.id,
      title: place.displayName?.text ?? "Unknown place",
      subtitle: resolveSubtitle(place, rating),
      category,
      rating,
      photoName,
      iconName: resolveIcon(category, place.types),
      lat,
      lng,
    });
  }

  return results;
}

function mapReview(review: GooglePlaceReview): NormalizedReview {
  return {
    author: review.authorAttribution?.displayName ?? "Google user",
    authorPhotoUri: review.authorAttribution?.photoUri ?? null,
    rating: typeof review.rating === "number" ? review.rating : 0,
    text: review.text?.text ?? review.originalText?.text ?? "",
    relativeTime: review.relativePublishTimeDescription ?? "",
  };
}

/**
 * Converts a Google Place Details (New) response into the normalized detail
 * shape the frontend's place detail view renders. Photo resource names are
 * returned as-is so the frontend can proxy them through /places/photo.
 */
export function mapPlaceDetails(
  place: GooglePlaceDetails,
): NormalizedPlaceDetails {
  const rating = typeof place.rating === "number" ? place.rating : 0;
  const photoNames = (place.photos ?? [])
    .map((photo) => photo.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
  const reviews = (place.reviews ?? [])
    .map(mapReview)
    .filter((review) => review.text.length > 0);

  return {
    id: place.id ?? "",
    title: place.displayName?.text ?? "Unknown place",
    address: place.shortFormattedAddress ?? place.formattedAddress ?? "",
    category: place.primaryTypeDisplayName?.text,
    rating,
    userRatingCount:
      typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
    summary: place.editorialSummary?.text ?? null,
    priceLevel: place.priceLevel ?? null,
    websiteUri: place.websiteUri ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    photoNames,
    reviews,
  };
}
