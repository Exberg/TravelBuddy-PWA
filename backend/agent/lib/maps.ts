// Google Maps Platform helpers shared by the agent's map tools.
//
// These wrap Places API (New), Routes API, and Geocoding API and project the
// (very large) upstream payloads down to compact, model-friendly shapes. The
// agent runs in the app runtime, so GOOGLE_MAPS_API never leaves the server.
//
// Keep the returned objects small: every field here is re-sent to the model on
// every subsequent step of the turn.

export type TravelMode = "WALK" | "DRIVE" | "TRANSIT" | "BICYCLE";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSummary {
  placeId: string;
  name: string;
  address: string;
  primaryType: string | null;
  rating: number | null;
  userRatingCount: number | null;
  /** Google's coarse bucket, e.g. "PRICE_LEVEL_MODERATE". */
  priceLevel: string | null;
  location: LatLng | null;
  googleMapsUri: string | null;
  openNow: boolean | null;
  summary: string | null;
}

export interface PlaceDetail extends PlaceSummary {
  websiteUri: string | null;
  phone: string | null;
  /** Human-readable weekly hours, one entry per day, as Google formats them. */
  openingHours: string[];
  /** Google's own place types; useful for judging halal/vegetarian likelihood. */
  types: string[];
  reviewHighlights: string[];
}

export interface RouteLeg {
  mode: TravelMode;
  durationMinutes: number | null;
  distanceMeters: number | null;
}

export class MapsConfigError extends Error {}
export class MapsRequestError extends Error {}

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API;
  if (!key) {
    throw new MapsConfigError(
      "GOOGLE_MAPS_API is not configured on the server, so map lookups are unavailable.",
    );
  }
  return key;
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.primaryTypeDisplayName",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.location",
  "places.googleMapsUri",
  "places.currentOpeningHours.openNow",
  "places.editorialSummary",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "primaryTypeDisplayName",
  "rating",
  "userRatingCount",
  "priceLevel",
  "location",
  "googleMapsUri",
  "currentOpeningHours",
  "regularOpeningHours.weekdayDescriptions",
  "editorialSummary",
  "websiteUri",
  "nationalPhoneNumber",
  "types",
  "reviews",
].join(",");

// ---------------------------------------------------------------------------
// Upstream response shapes (partial: Google omits fields freely)
// ---------------------------------------------------------------------------

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  editorialSummary?: { text?: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  types?: string[];
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
  }>;
}

interface RawRoutesResponse {
  routes?: Array<{ duration?: string; distanceMeters?: number }>;
}

interface RawGeocodeResponse {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    types?: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Pure mappers (unit tested)
// ---------------------------------------------------------------------------

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullableText(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function mapPlaceSummary(place: RawPlace): PlaceSummary | null {
  if (!place.id) return null;

  const lat = nullableNumber(place.location?.latitude);
  const lng = nullableNumber(place.location?.longitude);

  return {
    placeId: place.id,
    name: place.displayName?.text ?? "Unknown place",
    address:
      place.shortFormattedAddress ?? place.formattedAddress ?? "Unknown address",
    primaryType: nullableText(place.primaryTypeDisplayName?.text),
    rating: nullableNumber(place.rating),
    userRatingCount: nullableNumber(place.userRatingCount),
    priceLevel: nullableText(place.priceLevel),
    location: lat !== null && lng !== null ? { lat, lng } : null,
    googleMapsUri: nullableText(place.googleMapsUri),
    openNow:
      typeof place.currentOpeningHours?.openNow === "boolean"
        ? place.currentOpeningHours.openNow
        : null,
    summary: nullableText(place.editorialSummary?.text),
  };
}

/** Keeps only substantive reviews, trimmed so they can't flood the context. */
export function mapReviewHighlights(place: RawPlace, limit = 3): string[] {
  return (place.reviews ?? [])
    .map((review) => review.text?.text ?? review.originalText?.text ?? "")
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length >= 40)
    .slice(0, limit)
    .map((text) => (text.length > 240 ? `${text.slice(0, 240)}…` : text));
}

export function mapPlaceDetail(place: RawPlace): PlaceDetail | null {
  const summary = mapPlaceSummary(place);
  if (!summary) return null;

  return {
    ...summary,
    websiteUri: nullableText(place.websiteUri),
    phone: nullableText(place.nationalPhoneNumber),
    openingHours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    types: place.types ?? [],
    reviewHighlights: mapReviewHighlights(place),
  };
}

/** Google returns ISO-8601-ish second strings such as "1234s". */
export function parseDurationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(duration.trim());
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds : null;
}

export function mapRoute(
  response: RawRoutesResponse,
  mode: TravelMode,
): RouteLeg | null {
  const route = response.routes?.[0];
  if (!route) return null;

  const seconds = parseDurationSeconds(route.duration);

  return {
    mode,
    durationMinutes: seconds === null ? null : Math.round(seconds / 60),
    distanceMeters: nullableNumber(route.distanceMeters),
  };
}

// ---------------------------------------------------------------------------
// Network calls
// ---------------------------------------------------------------------------

async function requestJson<T>(
  url: string,
  init: RequestInit,
  label: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new MapsRequestError(`Could not reach the Google ${label} API.`);
  }

  if (!response.ok) {
    // Google's error bodies can contain the API key in echoed request URLs, so
    // surface only the status to the model.
    throw new MapsRequestError(
      `Google ${label} API returned ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

export interface SearchPlacesOptions {
  query: string;
  /** Biases (not restricts) results toward this point. */
  near?: LatLng;
  radiusMeters?: number;
  minRating?: number;
  openNow?: boolean;
  maxResults?: number;
}

export async function searchPlaces(
  options: SearchPlacesOptions,
): Promise<PlaceSummary[]> {
  const maxResults = Math.min(Math.max(options.maxResults ?? 8, 1), 20);

  const body: Record<string, unknown> = {
    textQuery: options.query,
    maxResultCount: maxResults,
    languageCode: "en",
  };

  if (options.near) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.near.lat,
          longitude: options.near.lng,
        },
        // Places caps the bias radius at 50km.
        radius: Math.min(Math.max(options.radiusMeters ?? 5_000, 1), 50_000),
      },
    };
  }
  if (typeof options.minRating === "number") body.minRating = options.minRating;
  if (options.openNow === true) body.openNow = true;

  const payload = await requestJson<{ places?: RawPlace[] }>(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey(),
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    },
    "Places",
  );

  return (payload.places ?? [])
    .map(mapPlaceSummary)
    .filter((place): place is PlaceSummary => place !== null);
}

export async function fetchPlaceDetail(placeId: string): Promise<PlaceDetail> {
  // Place ids look like "ChIJ..."; reject separators before interpolating.
  const id = placeId.trim();
  if (!id || id.includes("/") || id.includes("..")) {
    throw new MapsRequestError(`"${placeId}" is not a valid Google place id.`);
  }

  const payload = await requestJson<RawPlace>(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey(),
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      },
    },
    "Place Details",
  );

  const detail = mapPlaceDetail(payload);
  if (!detail) {
    throw new MapsRequestError(`No place details available for "${placeId}".`);
  }
  return detail;
}

/** A route endpoint: a Google place id, coordinates, or a free-text address. */
export type Waypoint =
  | { placeId: string }
  | { location: LatLng }
  | { address: string };

function toRoutesWaypoint(waypoint: Waypoint): Record<string, unknown> {
  if ("placeId" in waypoint) return { placeId: waypoint.placeId };
  if ("location" in waypoint) {
    return {
      location: {
        latLng: {
          latitude: waypoint.location.lat,
          longitude: waypoint.location.lng,
        },
      },
    };
  }
  return { address: waypoint.address };
}

export async function computeRoute(
  origin: Waypoint,
  destination: Waypoint,
  mode: TravelMode,
): Promise<RouteLeg> {
  const body: Record<string, unknown> = {
    origin: toRoutesWaypoint(origin),
    destination: toRoutesWaypoint(destination),
    travelMode: mode,
    languageCode: "en",
    units: "METRIC",
  };

  // Traffic-aware routing is only valid for driving; Routes rejects it on the
  // other modes.
  if (mode === "DRIVE") body.routingPreference = "TRAFFIC_AWARE";

  const payload = await requestJson<RawRoutesResponse>(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey(),
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify(body),
    },
    "Routes",
  );

  const leg = mapRoute(payload, mode);
  if (!leg) {
    throw new MapsRequestError(
      `Google Routes found no ${mode.toLowerCase()} route between those points.`,
    );
  }
  return leg;
}

export interface GeocodeResult {
  formattedAddress: string;
  placeId: string | null;
  location: LatLng;
  types: string[];
}

export async function geocode(query: string): Promise<GeocodeResult> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey());

  const payload = await requestJson<RawGeocodeResponse>(
    url.toString(),
    {},
    "Geocoding",
  );

  const result = payload.results?.[0];
  const lat = nullableNumber(result?.geometry?.location?.lat);
  const lng = nullableNumber(result?.geometry?.location?.lng);

  if (!result || lat === null || lng === null) {
    throw new MapsRequestError(`Google could not locate "${query}".`);
  }

  return {
    formattedAddress: result.formatted_address ?? query,
    placeId: nullableText(result.place_id),
    location: { lat, lng },
    types: result.types ?? [],
  };
}

/** Turns a thrown maps error into a message that is safe to show the model. */
export function describeMapsError(error: unknown): string {
  if (error instanceof MapsConfigError || error instanceof MapsRequestError) {
    return error.message;
  }
  return "The map lookup failed for an unexpected reason.";
}
