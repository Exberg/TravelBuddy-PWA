import { TimelineItem } from '../types';

export const SCHEDULE_DAYS: Record<string, TimelineItem[]> = {
  '1': [
    {
      time: '09:00',
      title: 'Mano Plus Workspace',
      desc: 'Fiber WiFi · Quiet Loft',
      icon: 'laptop_mac',
    },
    {
      time: '13:00',
      title: 'Hameediyah Hawker Heritage',
      desc: 'Murtabak & Spiced Chai',
      icon: 'restaurant',
    },
    {
      time: '16:00',
      title: 'Cheong Fatt Tze (Blue Mansion)',
      desc: 'Guided Architectural Walk',
      icon: 'museum',
    },
  ],
  '2': [
    {
      time: '09:30',
      title: 'Narrow Marrow Lab',
      desc: 'Cold Brews · Low Foot-Traffic',
      icon: 'local_cafe',
    },
    {
      time: '13:30',
      title: 'Chulia Street Hawker Stalls',
      desc: 'Char Kway Teow & Wan Tan Mee',
      icon: 'ramen_dining',
    },
    {
      time: '17:00',
      title: 'Clan Jetties Coastal Stroll',
      desc: 'Waterfront Sunset Perspective',
      icon: 'nature_people',
    },
  ],
  '3': [
    {
      time: '09:00',
      title: 'The Space Co-Working',
      desc: 'Ergonomic Pods · Fast LAN',
      icon: 'desktop_mac',
    },
    {
      time: '12:45',
      title: 'Teksen Restaurant',
      desc: 'Traditional Cantonese-Peranakan',
      icon: 'restaurant',
    },
    {
      time: '15:30',
      title: 'Armenian St Street Art Walk',
      desc: 'Artisanal Studio Visits',
      icon: 'palette',
    },
  ],
};
