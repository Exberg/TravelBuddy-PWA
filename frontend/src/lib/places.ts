import type { PlaceCategory, PlaceDetails, PlaceItem, PlaceReview } from '../types';
import { publicIconName } from './icons';

// Same-origin proxy target resolution, matching EveAssistantProvider's
// VITE_EVE_URL handling: local dev proxies /places to the Eve dev server via
// vite.config.ts, while a separately-deployed frontend can point at the Eve
// deployment's origin directly.
function resolveBaseUrl(): string {
  const configuredHost = import.meta.env.VITE_EVE_URL?.trim();
  return configuredHost ? configuredHost.replace(/\/$/, '') : '';
}

interface PlacesSearchResponsePlace {
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

interface PlacesSearchResponse {
  places: PlacesSearchResponsePlace[];
}

/**
 * Converts a raw Places search API result into the frontend's PlaceItem
 * shape, resolving photoName to a proxied photo URL and deriving the pin
 * label/icon fields the existing MapScreen UI expects.
 */
function toPlaceItem(place: PlacesSearchResponsePlace): PlaceItem {
  return {
    id: place.id,
    title: place.title,
    subtitle: place.subtitle,
    category: place.category,
    rating: place.rating,
    imageUrl: place.photoName ? photoUrl(place.photoName) : '',
    iconName: publicIconName(place.iconName),
    pinLabel: place.title,
    pinIcon: publicIconName(place.iconName),
    lat: place.lat,
    lng: place.lng,
  };
}

function buildSearchUrl(destination: string, category: PlaceCategory): string {
  const params = new URLSearchParams({ destination, category });
  return `${resolveBaseUrl()}/places/search?${params.toString()}`;
}

export async function fetchPlaces(
  destination: string,
  category: PlaceCategory,
): Promise<PlaceItem[]> {
  const response = await fetch(buildSearchUrl(destination, category));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${category} places for ${destination}`);
  }

  const body = (await response.json()) as PlacesSearchResponse;
  return body.places.map(toPlaceItem);
}

export function photoUrl(photoName: string): string {
  const encoded = encodeURIComponent(photoName);
  return `${resolveBaseUrl()}/places/photo/${encoded}`;
}

interface PlaceDetailsResponseReview {
  author: string;
  authorPhotoUri: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

interface PlaceDetailsResponsePlace {
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
  reviews: PlaceDetailsResponseReview[];
}

interface PlaceDetailsResponse {
  place: PlaceDetailsResponsePlace;
}

function toReview(review: PlaceDetailsResponseReview): PlaceReview {
  return {
    author: review.author,
    authorPhotoUrl: review.authorPhotoUri,
    rating: review.rating,
    text: review.text,
    relativeTime: review.relativeTime,
  };
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const response = await fetch(
    `${resolveBaseUrl()}/places/details/${encodeURIComponent(placeId)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch details for ${placeId}`);
  }

  const { place } = (await response.json()) as PlaceDetailsResponse;
  return {
    id: place.id,
    title: place.title,
    address: place.address,
    category: place.category,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    summary: place.summary,
    priceLevel: place.priceLevel,
    websiteUri: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    photoUrls: place.photoNames.map(photoUrl),
    reviews: place.reviews.map(toReview),
  };
}
