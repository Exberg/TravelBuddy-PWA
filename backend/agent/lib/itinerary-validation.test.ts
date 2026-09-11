import { describe, expect, test } from "bun:test";
import type { Itinerary, ItineraryStop } from "./itinerary";
import {
  hasItineraryValidationErrors,
  validateItinerary,
} from "./itinerary-validation";

function stop(
  id: string,
  time: string,
  overrides: Partial<ItineraryStop> = {},
): ItineraryStop {
  return {
    id,
    time,
    segment: time < "12:00" ? "morning" : "afternoon",
    title: id,
    description: `Visit ${id}.`,
    category: "sight",
    placeId: `place-${id}`,
    ...overrides,
  };
}

function itinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    title: "Penang",
    destination: "George Town",
    summary: "A balanced city break.",
    days: [
      {
        day: 1,
        date: "2026-10-01",
        title: "Heritage",
        stops: [stop("museum", "09:00")],
      },
    ],
    ...overrides,
  };
}

function codes(value: Itinerary): string[] {
  return validateItinerary(value).map((issue) => issue.code);
}

describe("validateItinerary", () => {
  test("accepts a coherent itinerary", () => {
    expect(validateItinerary(itinerary())).toEqual([]);
  });

  test("reports duplicate real venues but allows repeated stays", () => {
    const value = itinerary({
      days: [
        {
          day: 1,
          title: "Arrival",
          stops: [
            stop("hotel-check-in", "09:00", {
              category: "stay",
              placeId: "hotel",
            }),
          ],
        },
        {
          day: 2,
          title: "Departure",
          stops: [
            stop("hotel-check-out", "09:00", {
              category: "stay",
              placeId: "hotel",
            }),
          ],
        },
      ],
    });
    expect(codes(value)).not.toContain("duplicate_place");

    value.days[1]!.stops[0] = stop("museum-again", "09:00", {
      placeId: "place-museum",
    });
    value.days[0]!.stops[0] = stop("museum", "09:00");
    expect(codes(value)).toContain("duplicate_place");
  });

  test("reports overlap, order, segment, and first-stop travel issues", () => {
    const value = itinerary();
    value.days[0]!.stops = [
      stop("museum", "14:00", {
        segment: "morning",
        durationMinutes: 120,
        travelFromPrevious: { mode: "walk", durationMinutes: 10 },
      }),
      stop("lunch", "15:00", { category: "food" }),
      stop("breakfast", "09:00"),
    ];

    const found = codes(value);
    expect(found).toContain("first_stop_has_travel");
    expect(found).toContain("segment_time_mismatch");
    expect(found).toContain("stops_overlap");
    expect(found).toContain("stops_out_of_order");
  });

  test("requires coordinate pairs and identity for real venues", () => {
    const value = itinerary();
    value.days[0]!.stops = [
      stop("unknown", "09:00", {
        placeId: undefined,
        googleMapsUri: undefined,
        lat: 5.4,
        lng: undefined,
      }),
    ];

    expect(codes(value)).toEqual(
      expect.arrayContaining(["partial_coordinates", "missing_place_identity"]),
    );
  });

  test("reports day numbering, duplicate dates, and empty days", () => {
    const value = itinerary({
      days: [
        { day: 2, date: "2026-10-01", title: "Empty", stops: [] },
        {
          day: 2,
          date: "2026-10-01",
          title: "Museum",
          stops: [stop("museum", "09:00")],
        },
      ],
    });

    const found = codes(value);
    expect(found).toContain("empty_day");
    expect(found).toContain("non_sequential_day_number");
    expect(found).toContain("duplicate_day_number");
    expect(found).toContain("duplicate_date");
  });

  test("warns about cost mismatch and budget overflow", () => {
    const value = itinerary({ estimatedTotalMyr: 150, budgetMyr: 100 });
    value.days[0]!.stops[0]!.estimatedCostMyr = 80;

    expect(codes(value)).toEqual(
      expect.arrayContaining(["estimated_total_mismatch", "budget_exceeded"]),
    );
  });

  test("warns about overpacked days", () => {
    const value = itinerary();
    value.days[0]!.stops = Array.from({ length: 7 }, (_, index) =>
      stop(`stop-${index}`, `${String(8 + index).padStart(2, "0")}:00`, {
        segment:
          index < 4 ? "morning" : "afternoon",
      }),
    );

    expect(codes(value)).toContain("overpacked_day");
  });

  test("exposes a simple blocking-error predicate", () => {
    const warningsOnly = validateItinerary(
      itinerary({ estimatedTotalMyr: 120, budgetMyr: 100 }),
    );
    expect(hasItineraryValidationErrors(warningsOnly)).toBe(false);

    const invalid = itinerary();
    invalid.days[0]!.stops[0]!.lat = 5.4;
    expect(hasItineraryValidationErrors(validateItinerary(invalid))).toBe(true);
  });
});
