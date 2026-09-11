import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";
import {
  followDelegatedPlanning,
  publishedItinerary,
} from "./delegated-planning";

// Regression for long itinerary turns that previously performed every place
// lookup serially and sometimes exhausted the turn before save_itinerary.
//
// Delegated planning finishes across several turns, because each background
// planner wakes the coordinator in a new one. This follows those turns rather
// than asserting on the dispatch turn alone.
export default defineEval({
  description:
    "A long trip delegates bounded day research, reviews the merged plan, and publishes once.",
  tags: ["itinerary", "subagents", "long-trip"],
  // Following the planners' notification turns takes as long as the research
  // itself, not just the dispatch turn.
  timeoutMs: 900_000,
  async test(t) {
    const turn = await t.send("Build the complete itinerary for my trip.", {
      clientContext: {
        travelBuddy: {
          trip: {
            destination: "Tokyo, Japan",
            startDate: "2026-11-02",
            endDate: "2026-11-09",
            nights: 7,
            days: 8,
            budgetMyr: 9000,
            budgetCurrency: "MYR",
            destinationCurrency: "JPY",
            travelers: 2,
            travelPreferences:
              "Local food, calm mornings, anime, and neighbourhood walks. Avoid packed schedules.",
            mustVisitPlaces: [
              {
                name: "Meiji Jingu",
                lat: 35.6764,
                lng: 139.6993,
              },
            ],
          },
        },
      },
    });

    turn.expectOk();
    t.calledSubagent("day_planner", {
      count: (count) => count >= 2 && count <= 4,
    });

    const followed = await followDelegatedPlanning(t, turn);

    t.noFailedActions();
    t.calledSubagent("itinerary_reviewer", { count: 1 });
    t.calledTool("save_itinerary", { count: 1 });

    const published = await t.require(
      publishedItinerary(followed.published),
      satisfies(
        (value) => Array.isArray((value as { days?: unknown[] })?.days),
        "the delegated plan reached save_itinerary",
      ),
    );

    t.check(published, matches(itinerarySchema)).label("itinerary schema");
    t.check(
      published,
      satisfies((value) => {
        const days = (value as { days?: unknown[] } | undefined)?.days;
        return Array.isArray(days) && days.length === 8;
      }, "covers all eight requested days"),
    );
  },
});
