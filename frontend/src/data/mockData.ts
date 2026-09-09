import { Destination, PlaceItem, TimelineItem } from '../types';

export const DESTINATIONS: Destination[] = [
  {
    id: 'penang',
    name: 'Penang',
    location: 'Penang, Malaysia',
    country: 'Malaysia',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo5etStmsOF37a1JE49f2ijwtSHCvnwLe-e13H1QFI9gjsCQzEPTGIRBRuGFA3kD9eJ4rMV9lEzSt2JYkHEQ-r7ReBYh4T9APqN3TWEwI4C2zX9XGsoq_7z4NzqjHzH2ibo41R8CRiFRSbEcGNZj_vxf7yNxZR_ng3oGePyQYPY-fLn4OgOsdH7z51RnL-OqcOnw3IuEMYpjXjcY3pfnz2iXv7Ov4NovrDMIjqm_5NxzS4cjT7Khqp',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    location: 'Tokyo, Japan',
    country: 'Japan',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYA3TvtSTiWgqGrl1W6lH46v9epS84tqtOMTKiGwtoCy1pUsWrSN-Z0BzRTx5KAFxCKNw8XepmVDuYdSvurAQlKxWUb9NomZwqCfs7MOEgbMwhXbrelYsbEoHTcOsfVmmGx9lPjRhvLS8DXphp9PoWwPTxqD1urgV294BISxTjMt-BFxoNrdeY1NZkYz5TXljB_hYLJz40DK8OEmCuVPFpbsFBYZ32pBC1KXU_qyg49KA9Y4ozI6lR',
  },
  {
    id: 'bali',
    name: 'Bali',
    location: 'Bali, Indonesia',
    country: 'Indonesia',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3l1hUSSlQpjIMmV6_DVsUkVD0IGzajkG08XfSFKvQxYtHWRclGy1wjl7bw9dcbsNv2fCOS8uhhaEhZVsLlH1eKegQpCxZNfrsw0x7ke8gkQgJeAmjNEdzmwsF_RlIpiW65YBhTNSSPyL-2lh29tqf2-ie6LkRczZawb2j2NjzyJzHaBLP7MIX0-ZUG7Xi2bEaTJjZLM3yZXdyoWBTtdmujvRYg1mLdrak-SVqVj0FEKEVLsE6sBqH',
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    location: 'Lisbon, Portugal',
    country: 'Portugal',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtC5ssnC8nV1XuIc_gjC6rriXXVVeL3hF7Z_gp-dLBn2JYLFXYJGhqeGpWGkFCNYmd9C6JPWPzyvVpSpnTngVG_6ZV4EwnX7u56Nfl973j-KDTvYkmsIWZznGztgm_ZQy14J9vAE-SMTUc8FRJwmbyK5DNZAXfntlVuzvJOkxwEi0gq5tUjtPa9HXwpzHWFLxqc7Vryob2xgnX8LeG3LODfFxZN-fpYbVNFcv-FKvq4nWjMaXBBjvi',
  },
];

export const PLACES: PlaceItem[] = [
  {
    id: 'place-1',
    title: 'The Blue Mansion',
    subtitle: 'Heritage Core • 4.8',
    category: 'sights',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpXlX1tXRcnH69Zmjeb8wBswIpf0qia9GVGeJzTjhcalFxvbwZ8BB5MhCa2-ggsUi3ysXnp9xZTYuTJxFVpiSTFGLGC1Hc6mIdVtGb_xkgtAeFMP-PIjxsCHmDLbwYyTEXZmqQYq6ypchNEdOgjFvCwI7p8GsYoBjJjeFdqFbya0JzbRioRDYCcdq667mVs-x9NoNGwPekZyYQ8mdbDJY8j1BGufsP8pev2yx-BFdx10RsPomxsIoF',
    iconName: 'location_on',
    pinLabel: 'Blue Mansion',
    pinIcon: 'museum',
    pinPosition: { top: '28%', left: '34%' },
  },
  {
    id: 'place-2',
    title: 'Heritage Street Walk',
    subtitle: 'Armenian Street • 4.9',
    category: 'sights',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcbI0VM0BlOYFbZ9cT1rgWmfHxHlmFU6r9neU6UKBC_tNeLsSNn6rJaUPhLrSGA7W_uEtldomdp3HIiboJKp5UlzF9H568boP-5yED7E_KO3maPB7S_5xuryDoQ-DI44_v0j2uEOXInvuHKHCTbTGI0xNxlwyrQZQMVD0sSdaxxKYjjafU5fCELACUrkA0VnZg2Qq_VqO4RlFG5Xi0YUWgDW1HjoTUCykqCzvkfJdBXJx96cRirLxN',
    iconName: 'explore',
    pinLabel: 'Heritage Walk',
    pinIcon: 'tour',
    pinPosition: { top: '52%', left: '64%' },
  },
  {
    id: 'place-3',
    title: 'Beachside Roastery',
    subtitle: 'Tanjung Tokong • 4.7',
    category: 'cafes',
    rating: 4.7,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPnFO6nnirZ-Ke36lK80DE5Oz1-qphTWOfOCvyTaekitekzAHcD4Q6NigPHHh8tjk0ACGIkdWA6z-OoQZ8TLOytxqcLmaIrM_Bmwn01RTUtgN9SlmgNuNaZLO4P1J15lSUsEoBfgFScT9XgDGLFcM5WBNtrhCHILq1InJrLNOVxXtZedUX7p7A3ejrEQUyiyO_HAJRbtA8QStKZF2XhLAUOuQYtLjjsZTNRprUfVRxH9lMDR7d80Gp',
    iconName: 'local_cafe',
    pinLabel: 'Beach Roastery',
    pinIcon: 'coffee',
    pinPosition: { top: '72%', left: '30%' },
  },
  {
    id: 'place-4',
    title: 'Penang Hill Tram',
    subtitle: 'Air Itam • 4.6',
    category: 'sights',
    rating: 4.6,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsUXD96NLVWNgLl6XNRV-KsD0qVPmSbLpRNH0L6NgpvYZi8TTfgm9mdhQADDYpj3YapANssjjtHj3khyHgBonRFh9aTkU5x_yT9yLC-UHQT3hF0Qfxa1PDRhpUB28KV1yO3SpfaLAWn1iFx4Qwri_65-JQgYlLPQ-xBcE8DC93__b1U4sL0MYWkLKy2DawfTovG7Riyb3Km_MW6mA3DXZ3R6vuJA9tiDZFaEWhdU_4Rt3i2auf8u77',
    iconName: 'landscape',
    pinLabel: 'Penang Hill',
    pinIcon: 'landscape',
    pinPosition: { top: '36%', right: '22%' },
  },
  {
    id: 'place-5',
    title: 'Seven Terraces Stay',
    subtitle: 'Stewart Lane • 4.9',
    category: 'stays',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYZ04ZA63drjNVdpnvby24lCDBZcQSNVQcl5tRlySrFVZ_Yc-cDoLi0qlPXiF0XEc1RIW7h3ucOueN0BSBbfBTnr7BdbovsT6NDHS7fVrQtPCKPsnQj1-WOP2EB-vp_QskMBXTiPC_crgS1T_b35vegN9J3tU4KPzVx4H54ywhLomWvU-WqfBpBq3vmOhVYyTtcysgxVlKMCdQHM1tTF6HJdJAsCl7_l0fspXt0dAyBc9lQrqWxzv5',
    iconName: 'hotel',
    pinLabel: 'Seven Terraces',
    pinIcon: 'hotel',
    pinPosition: { top: '45%', left: '48%' },
  },
];

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
