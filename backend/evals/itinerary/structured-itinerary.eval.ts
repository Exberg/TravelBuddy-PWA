import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";

// The app renders the itinerary from the `save_itinerary` tool result, so an
// itinerary that only exists as chat prose is a silent product failure: the
// traveler sees "here's your plan" above an empty timeline. This eval pins the
// behaviour the frontend depends on — a real tool call whose payload validates
// against the shared schema and honours the trip's hard constraints.
export default defineEval({
  description:
    "A request to build an itinerary produces a schema-valid save_itinerary call covering every requested day.",
  tags: ["itinerary", "structured-output"],
  timeoutMs: 300_000,
  async test(t) {
    const turn = await t.send(
      "Build my itinerary for this trip, keeping it walkable.",
      {
        clientContext: {
          travelBuddy: {
            // Left on the app's default model: the PWA never requests Gemini,
            // so this eval should exercise the path travelers actually get.
            trip: {
              destination: "George Town, Penang, Malaysia",
              startDate: "2026-11-02",
              endDate: "2026-11-04",
              nights: 2,
              days: 3,
              budgetMyr: 1800,
              budgetCurrency: "MYR",
              travelers: 2,
              mustVisitPlaces: [
                {
                  name: "Cheong Fatt Tze - The Blue Mansion",
                  lat: 5.4212,
                  lng: 100.3345,
                },
              ],
            },
          },
        },
      },
    );

    turn.expectOk();
    t.noFailedActions();

    const call = turn.requireToolCall("save_itinerary");
    const published = (call.output as { itinerary?: unknown } | undefined)
      ?.itinerary;

    t.check(published, matches(itinerarySchema)).label("itinerary schema");

    t.check(
      published,
      satisfies((value) => {
        const days = (value as { days?: unknown[] } | undefined)?.days;
        return Array.isArray(days) && days.length === 3;
      }, "covers all three requested days"),
    );

    // Stops must come from a real lookup rather than the model's memory: the
    // app deep-links each stop into Google Maps by place id.
    t.check(
      published,
      satisfies((value) => {
        const days =
          (value as { days?: Array<{ stops?: Array<{ placeId?: string }> }> })
            ?.days ?? [];
        return days
          .flatMap((day) => day.stops ?? [])
          .some((stop) => typeof stop.placeId === "string");
      }, "at least one stop carries a Google place id"),
    );

    // The traveler explicitly selected the Blue Mansion, which is a hard
    // constraint the plan may not quietly drop.
    t.check(
      published,
      satisfies((value) => {
        const serialized = JSON.stringify(value).toLowerCase();
        return (
          serialized.includes("blue mansion") ||
          serialized.includes("cheong fatt tze")
        );
      }, "keeps the must-visit place"),
    );

    t.calledTool("search_places").soft();
    t.loadedSkill("itinerary-planning").soft();
  },
});
