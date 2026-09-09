// Presentation helpers for the structured itinerary the agent publishes, plus
// the runtime guard that decides whether a `save_itinerary` tool result is
// safe to render.

import type {
  DaySegment,
  HalalStatus,
  Itinerary,
  ItineraryStop,
  SaveItineraryResult,
  StopCategory,
  TravelHopMode,
} from '../types';

// Icons live here rather than in the itinerary contract: asking the model for
// Material Symbol names invites invented glyphs that render as empty boxes.
const CATEGORY_ICONS: Record<StopCategory, string> = {
  sight: 'museum',
  food: 'restaurant',
  cafe: 'local_cafe',
  activity: 'directions_walk',
  nature: 'landscape',
  shopping: 'shopping_bag',
  nightlife: 'nightlife',
  transport: 'directions_bus',
  stay: 'hotel',
  rest: 'bedtime',
};

const HOP_ICONS: Record<TravelHopMode, string> = {
  walk: 'directions_walk',
  drive: 'directions_car',
  transit: 'directions_transit',
  bicycle: 'directions_bike',
  ferry: 'directions_boat',
};

const SEGMENT_LABELS: Record<DaySegment, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const HALAL_LABELS: Record<HalalStatus, string> = {
  certified: 'Halal certified',
  muslim_friendly: 'Muslim friendly',
  pork_free_claimed: 'Pork free (claimed)',
  unverified: 'Halal unverified',
  not_halal: 'Not halal',
};

export function stopIcon(stop: ItineraryStop): string {
  return CATEGORY_ICONS[stop.category] ?? 'place';
}

export function hopIcon(mode: TravelHopMode): string {
  return HOP_ICONS[mode] ?? 'directions_walk';
}

export function segmentLabel(segment: DaySegment): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

export function halalLabel(status: HalalStatus): string {
  return HALAL_LABELS[status] ?? status;
}

export function formatMyr(amount: number): string {
  return `RM ${Math.round(amount).toLocaleString('en-MY')}`;
}

export function formatHop(
  mode: TravelHopMode,
  durationMinutes: number,
): string {
  return `${durationMinutes} min ${mode}`;
}

/**
 * Tool results arrive as unknown JSON over the Eve stream, so validate the
 * fields the timeline actually indexes into before rendering. A malformed
 * result is dropped rather than crashing the chat screen.
 */
export function parseSaveItineraryResult(
  result: unknown,
): SaveItineraryResult | null {
  if (typeof result !== 'object' || result === null) return null;

  const candidate = result as Partial<SaveItineraryResult>;
  const itinerary = candidate.itinerary;

  if (
    candidate.status !== 'published' ||
    typeof itinerary !== 'object' ||
    itinerary === null ||
    typeof itinerary.title !== 'string' ||
    typeof itinerary.destination !== 'string' ||
    !Array.isArray(itinerary.days) ||
    itinerary.days.length === 0
  ) {
    return null;
  }

  const daysAreWellFormed = itinerary.days.every(
    (day) =>
      typeof day === 'object' &&
      day !== null &&
      typeof day.day === 'number' &&
      Array.isArray(day.stops) &&
      day.stops.every(
        (stop) =>
          typeof stop === 'object' &&
          stop !== null &&
          typeof stop.id === 'string' &&
          typeof stop.time === 'string' &&
          typeof stop.title === 'string',
      ),
  );

  if (!daysAreWellFormed) return null;

  return {
    status: 'published',
    revision: typeof candidate.revision === 'number' ? candidate.revision : 0,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    changeNote:
      typeof candidate.changeNote === 'string' ? candidate.changeNote : '',
    currency: typeof candidate.currency === 'string' ? candidate.currency : 'MYR',
    itinerary: itinerary as Itinerary,
  };
}

export function countStops(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => total + day.stops.length, 0);
}

export function dayCostMyr(
  stops: readonly ItineraryStop[],
): number | null {
  let total = 0;
  let sawCost = false;

  for (const stop of stops) {
    if (typeof stop.estimatedCostMyr === 'number') {
      sawCost = true;
      total += stop.estimatedCostMyr;
    }
  }

  return sawCost ? total : null;
}
