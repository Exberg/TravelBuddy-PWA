// The structured itinerary contract.
//
// This schema is the single source of truth for the shape the agent produces
// and the PWA renders. `frontend/src/types.ts` mirrors it as plain TypeScript,
// so keep the two in sync when changing anything here.
//
// Design notes:
// - Every stop carries a stable `id` so the traveler can ask for a targeted
//   edit ("move the blue mansion to day 2") without regenerating the trip.
// - No icon field: the frontend derives icons from `category`, which keeps the
//   model from inventing Material Symbol names that don't exist.
// - Costs are per-stop and in MYR, matching the RM budget the app collects.

import { defineState } from "eve/context";
import { z } from "zod";
import { resolveTravelBuddyContext } from "../model-selection";

export const ITINERARY_CURRENCY = "MYR";

export const stopCategorySchema = z.enum([
  "sight",
  "food",
  "cafe",
  "activity",
  "nature",
  "shopping",
  "nightlife",
  "transport",
  "stay",
  "rest",
]);

export const daySegmentSchema = z.enum(["morning", "afternoon", "evening"]);

export const halalStatusSchema = z.enum([
  "certified",
  "muslim_friendly",
  "pork_free_claimed",
  "unverified",
  "not_halal",
]);

export const travelHopSchema = z.object({
  mode: z.enum(["walk", "drive", "transit", "bicycle", "ferry"]),
  durationMinutes: z.number().int().min(0).max(1440),
  distanceMeters: z.number().min(0).optional(),
});

export const itineraryStopSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .describe(
      "Stable kebab-case id for this stop, e.g. 'blue-mansion-tour'. Reuse the existing id when editing a stop.",
    ),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .describe("Start time in 24-hour HH:MM local time."),
  segment: daySegmentSchema,
  title: z.string().min(1).max(80),
  description: z
    .string()
    .min(1)
    .max(200)
    .describe("One short line on why this stop is here and what to expect."),
  category: stopCategorySchema,
  durationMinutes: z.number().int().min(5).max(720).optional(),
  placeId: z
    .string()
    .optional()
    .describe("Google place id, when this stop came from a place lookup."),
  address: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  googleMapsUri: z.string().optional(),
  estimatedCostMyr: z
    .number()
    .min(0)
    .optional()
    .describe("Approximate cost for the whole party at this stop, in RM."),
  travelFromPrevious: travelHopSchema
    .optional()
    .describe("How the traveler gets here from the previous stop of the day."),
  bookingRequired: z.boolean().optional(),
  halalStatus: halalStatusSchema
    .optional()
    .describe("Only set for food stops. Use 'unverified' unless you confirmed it."),
  warning: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Anything the traveler must verify themselves, e.g. unconfirmed hours or allergen risk.",
    ),
});

export const itineraryDaySchema = z.object({
  day: z.number().int().min(1).max(60),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("ISO date (YYYY-MM-DD) when the trip dates are known."),
  title: z
    .string()
    .min(1)
    .max(80)
    .describe("Short theme for the day, e.g. 'Heritage core on foot'."),
  area: z
    .string()
    .max(80)
    .optional()
    .describe("The neighbourhood or zone this day stays within."),
  stops: z.array(itineraryStopSchema).min(1).max(12),
});

export const itinerarySchema = z.object({
  title: z.string().min(1).max(80).describe("e.g. 'Penang Heritage Flow'."),
  destination: z.string().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  travelers: z.number().int().min(1).max(50).optional(),
  summary: z
    .string()
    .min(1)
    .max(320)
    .describe("Two sentences at most on the shape of the trip."),
  estimatedTotalMyr: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Approximate total for the whole party across the whole trip, in RM. Omit rather than guessing wildly.",
    ),
  budgetMyr: z
    .number()
    .min(0)
    .optional()
    .describe("The traveler's stated total budget, echoed back for comparison."),
  days: z.array(itineraryDaySchema).min(1).max(30),
  assumptions: z
    .array(z.string().max(200))
    .max(8)
    .optional()
    .describe("Anything you had to assume, and anything the traveler must verify."),
});

export type ItineraryStop = z.infer<typeof itineraryStopSchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

export interface ItinerarySlot {
  /** The app trip this working copy belongs to. */
  tripId: string | null;
  itinerary: Itinerary | null;
  /** Bumped on every save so the client can tell revisions apart. */
  revision: number;
  updatedAt: string | null;
}

/**
 * Durable per-session home for the current itinerary. Lets the agent read the
 * plan back on a later turn to make a targeted edit instead of rebuilding it,
 * and survives redeploys mid-conversation.
 */
export const itineraryState = defineState<ItinerarySlot>(
  "travelbuddy.itinerary",
  () => ({ tripId: null, itinerary: null, revision: 0, updatedAt: null }),
);

const clientItinerarySnapshotSchema = z.object({
  tripId: z.string().min(1),
  itinerary: itinerarySchema.nullable(),
  revision: z.number().int().min(0),
  updatedAt: z.string().nullable(),
});

export type ClientItinerarySnapshot = z.infer<
  typeof clientItinerarySnapshotSchema
>;

/** Reads the app-owned itinerary snapshot attached to the current turn. */
export function resolveClientItinerarySnapshot(
  messages: readonly { role?: unknown; content?: unknown }[],
): ClientItinerarySnapshot | null {
  const value = resolveTravelBuddyContext(messages)?.itinerarySnapshot;
  const result = clientItinerarySnapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Reconciles Eve's per-session working copy with the app's canonical trip.
 * A different trip always replaces the slot. Within one trip revisions are
 * monotonic, so replaying an older client snapshot can never overwrite newer
 * server work that the stream has not delivered yet.
 */
export function hydrateItineraryState(snapshot: ClientItinerarySnapshot) {
  const current = itineraryState.get();
  if (
    current.tripId === snapshot.tripId &&
    current.revision >= snapshot.revision
  ) {
    return;
  }

  itineraryState.update(() => snapshot);
}

export function countStops(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => total + day.stops.length, 0);
}

/**
 * Sums per-stop costs as a fallback when the model omits `estimatedTotalMyr`.
 * Returns null when no stop carries a cost, so callers can stay silent about
 * money rather than reporting a misleading RM 0.
 */
export function sumEstimatedCostMyr(itinerary: Itinerary): number | null {
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

/** Sorts each day's stops by clock time and renumbers days from 1. */
export function normalizeItinerary(itinerary: Itinerary): Itinerary {
  const days = [...itinerary.days]
    .sort((left, right) => left.day - right.day)
    .map((day, index) => ({
      ...day,
      day: index + 1,
      stops: [...day.stops].sort((left, right) =>
        left.time.localeCompare(right.time),
      ),
    }));

  return { ...itinerary, days };
}

/** Ids the model reused across stops would break targeted edits downstream. */
export function findDuplicateStopIds(itinerary: Itinerary): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const day of itinerary.days) {
    for (const stop of day.stops) {
      if (seen.has(stop.id)) duplicates.add(stop.id);
      seen.add(stop.id);
    }
  }

  return [...duplicates];
}

/** Compact one-line-per-day rendering, for the model rather than the traveler. */
export function describeItinerary(itinerary: Itinerary): string {
  const lines = itinerary.days.map((day) => {
    const stops = day.stops
      .map((stop) => `${stop.time} ${stop.title} [${stop.id}]`)
      .join("; ");
    return `Day ${day.day}${day.date ? ` (${day.date})` : ""} — ${day.title}: ${stops}`;
  });

  return [`${itinerary.title} · ${itinerary.destination}`, ...lines].join("\n");
}
