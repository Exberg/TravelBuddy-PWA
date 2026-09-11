import type { Itinerary, ItineraryStop } from "./itinerary";

export type ItineraryValidationSeverity = "error" | "warning";

export type ItineraryValidationCode =
  | "duplicate_place"
  | "duplicate_day_number"
  | "non_sequential_day_number"
  | "duplicate_date"
  | "empty_day"
  | "overpacked_day"
  | "stops_out_of_order"
  | "stops_overlap"
  | "segment_time_mismatch"
  | "first_stop_has_travel"
  | "partial_coordinates"
  | "missing_place_identity"
  | "estimated_total_mismatch"
  | "budget_exceeded";

export interface ItineraryValidationIssue {
  severity: ItineraryValidationSeverity;
  code: ItineraryValidationCode;
  message: string;
  day?: number;
  stopIds?: string[];
}

const REPEATABLE_CATEGORIES = new Set<ItineraryStop["category"]>([
  "stay",
  "transport",
  "rest",
]);

const VENUE_CATEGORIES = new Set<ItineraryStop["category"]>([
  "sight",
  "food",
  "cafe",
  "activity",
  "nature",
  "shopping",
  "nightlife",
]);

// The planning contract targets three to six usable stops in a full day.
const OVERPACKED_STOP_COUNT = 7;
const OVERPACKED_MINUTES = 12 * 60;

function minutesSinceMidnight(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function segmentMatchesTime(
  segment: ItineraryStop["segment"],
  minutes: number,
): boolean {
  // Treat after-midnight stops as evening because the itinerary contract has
  // no separate night segment.
  if (segment === "morning") return minutes >= 4 * 60 && minutes < 12 * 60;
  if (segment === "afternoon") return minutes >= 12 * 60 && minutes < 17 * 60;
  return minutes >= 17 * 60 || minutes < 4 * 60;
}

function hasPlaceIdentity(stop: ItineraryStop): boolean {
  return Boolean(
    stop.placeId?.trim() ||
      stop.googleMapsUri?.trim() ||
      (typeof stop.lat === "number" && typeof stop.lng === "number"),
  );
}

function roundedStopCost(itinerary: Itinerary): number | null {
  let total = 0;
  let sawCost = false;

  for (const day of itinerary.days) {
    for (const stop of day.stops) {
      if (typeof stop.estimatedCostMyr === "number") {
        sawCost = true;
        total += stop.estimatedCostMyr;
      }
    }
  }

  return sawCost ? Math.round(total) : null;
}

/**
 * Performs deterministic, side-effect-free checks before an itinerary is
 * reviewed or published. The checks intentionally avoid guessing travel time,
 * opening hours, or costs that the itinerary does not provide.
 */
export function validateItinerary(
  itinerary: Itinerary,
): ItineraryValidationIssue[] {
  const issues: ItineraryValidationIssue[] = [];
  const dayNumbers = new Map<number, number>();
  const dates = new Map<string, number[]>();
  const places = new Map<
    string,
    Array<{ day: number; stop: ItineraryStop }>
  >();

  for (const [dayIndex, day] of itinerary.days.entries()) {
    dayNumbers.set(day.day, (dayNumbers.get(day.day) ?? 0) + 1);
    if (day.date) {
      const matchingDays = dates.get(day.date) ?? [];
      matchingDays.push(day.day);
      dates.set(day.date, matchingDays);
    }

    if (day.day !== dayIndex + 1) {
      issues.push({
        severity: "error",
        code: "non_sequential_day_number",
        message: `Day at position ${dayIndex + 1} is numbered ${day.day}; days must be numbered sequentially from 1.`,
        day: day.day,
      });
    }

    if (day.stops.length === 0) {
      issues.push({
        severity: "error",
        code: "empty_day",
        message: `Day ${day.day} has no stops.`,
        day: day.day,
      });
      continue;
    }

    const plannedMinutes = day.stops.reduce(
      (total, stop) =>
        total +
        (stop.durationMinutes ?? 0) +
        (stop.travelFromPrevious?.durationMinutes ?? 0),
      0,
    );
    if (
      day.stops.length >= OVERPACKED_STOP_COUNT ||
      plannedMinutes > OVERPACKED_MINUTES
    ) {
      issues.push({
        severity: "warning",
        code: "overpacked_day",
        message: `Day ${day.day} may be overpacked (${day.stops.length} stops, ${plannedMinutes} scheduled minutes).`,
        day: day.day,
        stopIds: day.stops.map((stop) => stop.id),
      });
    }

    let prior: { stop: ItineraryStop; start: number } | null = null;
    for (const [stopIndex, stop] of day.stops.entries()) {
      const start = minutesSinceMidnight(stop.time);

      if (stopIndex === 0 && stop.travelFromPrevious) {
        issues.push({
          severity: "warning",
          code: "first_stop_has_travel",
          message: `The first stop on day ${day.day} has travelFromPrevious, but there is no previous stop that day.`,
          day: day.day,
          stopIds: [stop.id],
        });
      }

      const hasLat = typeof stop.lat === "number";
      const hasLng = typeof stop.lng === "number";
      if (hasLat !== hasLng) {
        issues.push({
          severity: "error",
          code: "partial_coordinates",
          message: `Stop "${stop.title}" must provide both latitude and longitude or neither.`,
          day: day.day,
          stopIds: [stop.id],
        });
      }

      if (VENUE_CATEGORIES.has(stop.category) && !hasPlaceIdentity(stop)) {
        issues.push({
          severity: "warning",
          code: "missing_place_identity",
          message: `Stop "${stop.title}" has no place id, Maps URL, or coordinate pair to identify the venue.`,
          day: day.day,
          stopIds: [stop.id],
        });
      }

      if (stop.placeId?.trim()) {
        const matchingStops = places.get(stop.placeId.trim()) ?? [];
        matchingStops.push({ day: day.day, stop });
        places.set(stop.placeId.trim(), matchingStops);
      }

      if (start !== null && !segmentMatchesTime(stop.segment, start)) {
        issues.push({
          severity: "warning",
          code: "segment_time_mismatch",
          message: `Stop "${stop.title}" at ${stop.time} does not match its ${stop.segment} segment.`,
          day: day.day,
          stopIds: [stop.id],
        });
      }

      if (start !== null && prior) {
        if (start < prior.start) {
          issues.push({
            severity: "error",
            code: "stops_out_of_order",
            message: `Stop "${stop.title}" starts before the previous stop in day ${day.day}.`,
            day: day.day,
            stopIds: [prior.stop.id, stop.id],
          });
        } else if (
          typeof prior.stop.durationMinutes === "number" &&
          start < prior.start + prior.stop.durationMinutes
        ) {
          issues.push({
            severity: "error",
            code: "stops_overlap",
            message: `Stop "${stop.title}" starts before "${prior.stop.title}" ends.`,
            day: day.day,
            stopIds: [prior.stop.id, stop.id],
          });
        }
      }

      if (start !== null) prior = { stop, start };
    }
  }

  for (const [day, count] of dayNumbers) {
    if (count > 1) {
      issues.push({
        severity: "error",
        code: "duplicate_day_number",
        message: `Day number ${day} is used ${count} times.`,
        day,
      });
    }
  }

  for (const [date, days] of dates) {
    if (days.length > 1) {
      issues.push({
        severity: "error",
        code: "duplicate_date",
        message: `Date ${date} is assigned to multiple days (${days.join(", ")}).`,
      });
    }
  }

  for (const [placeId, matches] of places) {
    if (
      matches.length > 1 &&
      !matches.every(({ stop }) => REPEATABLE_CATEGORIES.has(stop.category))
    ) {
      issues.push({
        severity: "error",
        code: "duplicate_place",
        message: `Place ${placeId} appears in multiple non-repeatable stops.`,
        day: matches[0]?.day,
        stopIds: matches.map(({ stop }) => stop.id),
      });
    }
  }

  const stopCost = roundedStopCost(itinerary);
  if (
    stopCost !== null &&
    typeof itinerary.estimatedTotalMyr === "number" &&
    Math.abs(stopCost - itinerary.estimatedTotalMyr) >
      Math.max(1, itinerary.estimatedTotalMyr * 0.05)
  ) {
    issues.push({
      severity: "warning",
      code: "estimated_total_mismatch",
      message: `The RM ${itinerary.estimatedTotalMyr} estimated total does not match the RM ${stopCost} sum of itemized stop costs.`,
    });
  }

  const effectiveTotal = itinerary.estimatedTotalMyr ?? stopCost;
  if (
    effectiveTotal !== null &&
    effectiveTotal !== undefined &&
    typeof itinerary.budgetMyr === "number" &&
    effectiveTotal > itinerary.budgetMyr
  ) {
    issues.push({
      severity: "warning",
      code: "budget_exceeded",
      message: `The estimated RM ${effectiveTotal} total exceeds the RM ${itinerary.budgetMyr} budget.`,
    });
  }

  return issues;
}

export function hasItineraryValidationErrors(
  issues: readonly ItineraryValidationIssue[],
): boolean {
  return issues.some((issue) => issue.severity === "error");
}
