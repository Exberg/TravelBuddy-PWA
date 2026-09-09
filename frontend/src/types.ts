export type ScreenId = 'where' | 'when' | 'budget' | 'who' | 'map' | 'chat';

export interface Destination {
  id: string;
  name: string;
  location: string;
  country: string;
  imageUrl: string;
}

export interface PlaceItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'sights' | 'cafes' | 'stays';
  rating: number;
  imageUrl: string;
  iconName: string;
  pinLabel: string;
  pinIcon: string;
  pinPosition: {
    top: string;
    left?: string;
    right?: string;
  };
}

export interface TimelineItem {
  time: string;
  title: string;
  desc: string;
  icon: string;
}
