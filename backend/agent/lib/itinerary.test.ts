import { describe, expect, test } from "bun:test";
import {
  countStops,
  describeItinerary,
  detectPlanShrink,
  findDuplicateStopIds,
  itinerarySchema,
  normalizeItinerary,
  resolveClientItinerarySnapshot,
  sumEstimatedCostMyr,
  type Itinerary,
} from "./itinerary";

function withTwoDays(): Itinerary {
  const itinerary = makeItinerary();
  itinerary.days.push({
    day: 2,
    title: "Coast",
    stops: [
      {
        id: "sunset",
        time: "18:30",
        segment: "evening",
        title: "Clan Jetties",
        description: "Waterfront sunset.",
        category: "nature",
      },
    ],
  });
  return itinerary;
}

function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    title: "Penang Heritage Flow",
    destination: "George Town, Penang",
    summary: "Two walkable days through the heritage core.",
    days: [
      {
        day: 1,
        title: "Heritage core on foot",
        stops: [
          {
            id: "kopi-stop",
            time: "08:30",
            segment: "morning",
            title: "Toh Soon Cafe",
            description: "Charcoal toast before the heat.",
            category: "cafe",
            estimatedCostMyr: 20,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("itinerarySchema", () => {
  test("accepts a minimal itinerary", () => {
    expect(itinerarySchema.parse(makeItinerary())).toBeTruthy();
  });

  test("rejects a 12-hour clock time", () => {
    const itinerary = makeItinerary();
    itinerary.days[0]!.stops[0]!.time = "8:30am";
    expect(() => itinerarySchema.parse(itinerary)).toThrow();
  });

  test("rejects a day with no stops", () => {
    const itinerary = makeItinerary();
    itinerary.days[0]!.stops = [];
    expect(() => itinerarySchema.parse(itinerary)).toThrow();
  });

  test("rejects an unknown stop category", () => {
    const itinerary = makeItinerary() as unknown as {
      days: Array<{ stops: Array<{ category: string }> }>;
    };
    itinerary.days[0]!.stops[0]!.category = "spa";
    expect(() => itinerarySchema.parse(itinerary)).toThrow();
  });
});

describe("normalizeItinerary", () => {
  test("sorts stops by clock time and renumbers days", () => {
    const normalized = normalizeItinerary(
      makeItinerary({
        days: [
          {
            day: 4,
            title: "Coast",
            stops: [
              {
                id: "sunset",
                time: "18:30",
                segment: "evening",
                title: "Clan Jetties",
                description: "Waterfront sunset.",
                category: "nature",
              },
              {
                id: "lunch",
                time: "12:30",
                segment: "afternoon",
                title: "Teksen",
                description: "Peranakan lunch.",
                category: "food",
              },
            ],
          },
        ],
      }),
    );

    expect(normalized.days[0]!.day).toBe(1);
    expect(normalized.days[0]!.stops.map((stop) => stop.id)).toEqual([
      "lunch",
      "sunset",
    ]);
  });
});

describe("findDuplicateStopIds", () => {
  test("reports ids reused across days", () => {
    const itinerary = makeItinerary();
    itinerary.days.push({
      day: 2,
      title: "Encore",
      stops: [{ ...itinerary.days[0]!.stops[0]! }],
    });

    expect(findDuplicateStopIds(itinerary)).toEqual(["kopi-stop"]);
  });

  test("returns nothing when ids are unique", () => {
    expect(findDuplicateStopIds(makeItinerary())).toEqual([]);
  });
});

describe("sumEstimatedCostMyr", () => {
  test("adds per-stop costs", () => {
    expect(sumEstimatedCostMyr(makeItinerary())).toBe(20);
  });

  test("returns null when no stop has a cost, rather than RM 0", () => {
    const itinerary = makeItinerary();
    delete itinerary.days[0]!.stops[0]!.estimatedCostMyr;
    expect(sumEstimatedCostMyr(itinerary)).toBeNull();
  });
});

describe("countStops and describeItinerary", () => {
  test("counts every stop across days", () => {
    expect(countStops(makeItinerary())).toBe(1);
  });

  test("renders one line per day including stop ids for later edits", () => {
    expect(describeItinerary(makeItinerary())).toContain("[kopi-stop]");
  });
});

describe("detectPlanShrink", () => {
  test("reports a dropped day", () => {
    expect(detectPlanShrink(withTwoDays(), makeItinerary())).toEqual({
      priorDays: 2,
      nextDays: 1,
      priorStops: 2,
      nextStops: 1,
    });
  });

  test("reports a dropped stop even when the day count holds", () => {
    const prior = makeItinerary();
    prior.days[0]!.stops.push({
      id: "extra",
      time: "15:00",
      segment: "afternoon",
      title: "Kek Lok Si",
      description: "Hillside temple.",
      category: "sight",
    });

    expect(detectPlanShrink(prior, makeItinerary())).toMatchObject({
      priorStops: 2,
      nextStops: 1,
    });
  });

  test("allows a plan that grows or stays the same size", () => {
    expect(detectPlanShrink(makeItinerary(), withTwoDays())).toBeNull();
    expect(detectPlanShrink(makeItinerary(), makeItinerary())).toBeNull();
  });

  test("allows the first publish, when there is nothing to lose", () => {
    expect(detectPlanShrink(null, makeItinerary())).toBeNull();
  });
});

describe("resolveClientItinerarySnapshot", () => {
  test("reads a snapshot that omits the plan the session already holds", () => {
    expect(
      resolveClientItinerarySnapshot([
        {
          role: "user",
          content: `Client context:\n${JSON.stringify({
            travelBuddy: {
              itinerarySnapshot: {
                tripId: "trip-1",
                revision: 3,
                updatedAt: "2026-09-09T12:00:00.000Z",
              },
            },
          })}`,
        },
      ]),
    ).toEqual({
      tripId: "trip-1",
      revision: 3,
      updatedAt: "2026-09-09T12:00:00.000Z",
    });
  });

  test("reads the canonical snapshot from Eve client context", () => {
    const itinerary = makeItinerary();
    const snapshot = resolveClientItinerarySnapshot([
      {
        role: "user",
        content: `Client context:\n${JSON.stringify({
          travelBuddy: {
            itinerarySnapshot: {
              tripId: "trip-1",
              itinerary,
              revision: 3,
              updatedAt: "2026-09-09T12:00:00.000Z",
            },
          },
        })}`,
      },
    ]);

    expect(snapshot).toEqual({
      tripId: "trip-1",
      itinerary,
      revision: 3,
      updatedAt: "2026-09-09T12:00:00.000Z",
    });
  });

  test("rejects an invalid itinerary instead of poisoning session state", () => {
    expect(
      resolveClientItinerarySnapshot([
        {
          role: "user",
          content: JSON.stringify({
            travelBuddy: {
              itinerarySnapshot: {
                tripId: "trip-1",
                itinerary: { title: "incomplete" },
                revision: 3,
                updatedAt: null,
              },
            },
          }),
        },
      ]),
    ).toBeNull();
  });
});
