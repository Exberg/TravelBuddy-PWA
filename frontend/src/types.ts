export type ScreenId = 'where' | 'when' | 'budget' | 'who' | 'map' | 'chat';

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

export interface TimelineItem {
  time: string;
  title: string;
  desc: string;
  icon: string;
}
