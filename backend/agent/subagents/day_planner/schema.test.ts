import { describe, expect, test } from "bun:test";
import { dayPlannerOutputSchema } from "./schema";

const validResult = {
  days: [
    {
      day: 2,
      date: "2026-10-02",
      title: "Heritage core on foot",
      area: "George Town",
      stops: [
        {
          id: "day-2-blue-mansion",
          time: "09:00",
          segment: "morning" as const,
          title: "Blue Mansion",
          description: "A timed heritage-house tour near the morning cluster.",
          category: "sight" as const,
          placeId: "ChIJ-example",
        },
      ],
    },
  ],
  warnings: ["Confirm the tour time before booking."],
  assumptions: [],
};

describe("dayPlannerOutputSchema", () => {
  test("accepts assigned itinerary days plus planning caveats", () => {
    expect(dayPlannerOutputSchema.parse(validResult)).toEqual(validResult);
  });

  test("rejects an empty day hand-off", () => {
    expect(() =>
      dayPlannerOutputSchema.parse({
        days: [],
        warnings: [],
        assumptions: [],
      }),
    ).toThrow();
  });

  test("retains the canonical itinerary stop validation", () => {
    expect(() =>
      dayPlannerOutputSchema.parse({
        ...validResult,
        days: [
          {
            ...validResult.days[0],
            stops: [{ ...validResult.days[0]!.stops[0], time: "9am" }],
          },
        ],
      }),
    ).toThrow();
  });
});
