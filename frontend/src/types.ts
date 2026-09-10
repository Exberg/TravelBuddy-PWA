export type ScreenId =
  | 'home'
  | 'where'
  | 'when'
  | 'budget'
  | 'who'
  | 'map'
  | 'chat'
  | 'groups'
  | 'settings'
  | 'trip-settings';

export interface Destination {
  id: string;
  name: string;
  location: string;
  country: string;
  imageUrl: string;
}

export type PlaceCategory = 'sights' | 'cafes' | 'stays';

export interface PlaceItem {
  id: string;
  title: string;
  subtitle: string;
  category: PlaceCategory;
  rating: number;
  imageUrl: string;
  iconName: string;
  pinLabel: string;
  pinIcon: string;
  lat: number;
  lng: number;
}

export interface PlaceReview {
  author: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface PlaceDetails {
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
  photoUrls: string[];
  reviews: PlaceReview[];
}

// ---------------------------------------------------------------------------
// Structured itinerary
//
// Mirrors the zod schema in backend/agent/lib/itinerary.ts, which is the source
// of truth. The agent publishes an itinerary by calling its `save_itinerary`
// tool; the chat screen reads the tool result and renders these shapes. Keep
// both files in sync when the itinerary contract changes.
// ---------------------------------------------------------------------------

export type StopCategory =
  | 'sight'
  | 'food'
  | 'cafe'
  | 'activity'
  | 'nature'
  | 'shopping'
  | 'nightlife'
  | 'transport'
  | 'stay'
  | 'rest';

export type DaySegment = 'morning' | 'afternoon' | 'evening';

export type HalalStatus =
  | 'certified'
  | 'muslim_friendly'
  | 'pork_free_claimed'
  | 'unverified'
  | 'not_halal';

export type TravelHopMode = 'walk' | 'drive' | 'transit' | 'bicycle' | 'ferry';

export interface TravelHop {
  mode: TravelHopMode;
  durationMinutes: number;
  distanceMeters?: number;
}

export interface ItineraryStop {
  id: string;
  time: string;
  segment: DaySegment;
  title: string;
  description: string;
  category: StopCategory;
  durationMinutes?: number;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUri?: string;
  estimatedCostMyr?: number;
  travelFromPrevious?: TravelHop;
  bookingRequired?: boolean;
  halalStatus?: HalalStatus;
  warning?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  area?: string;
  stops: ItineraryStop[];
}

export interface Itinerary {
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  summary: string;
  estimatedTotalMyr?: number;
  budgetMyr?: number;
  days: ItineraryDay[];
  assumptions?: string[];
}

/** Payload shape of a successful `save_itinerary` tool result. */
export interface SaveItineraryResult {
  status: 'published';
  revision: number;
  updatedAt: string;
  changeNote: string;
  currency: string;
  itinerary: Itinerary;
}

/** A place the traveler explicitly marked as must-visit on the map screen. */
export interface MustVisitPlace {
  id: string;
  title: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
}
