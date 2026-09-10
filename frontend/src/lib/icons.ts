// Public SVG icon registry. Keeping API-provided names behind this allowlist
// prevents a failed font load from exposing icon names as visible text.
export const PUBLIC_ICON_NAMES = [
  'auto_awesome',
  'cancel',
  'check',
  'directions_boat',
  'directions_bus',
  'directions_car',
  'directions_transit',
  'directions_walk',
  'hotel',
  'landscape',
  'layers',
  'location_on',
  'local_cafe',
  'museum',
  'near_me',
  'nightlife',
  'place',
  'restaurant',
  'search',
  'shopping_bag',
  'travel_explore',
] as const;

export type PublicIconName = (typeof PUBLIC_ICON_NAMES)[number];

const PUBLIC_ICON_SET = new Set<string>(PUBLIC_ICON_NAMES);

export function publicIconName(name: string | null | undefined): PublicIconName {
  return PUBLIC_ICON_SET.has(name ?? '')
    ? (name as PublicIconName)
    : 'place';
}

export function publicIconHref(name: string | null | undefined): string {
  return `/icons/material-symbols.svg#${publicIconName(name)}`;
}
