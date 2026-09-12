import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";
import {
  followDelegatedPlanning,
  publishedItinerary,
} from "./delegated-planning";

// Regression for the real Tokyo session a5debbe1… (2026-09-12). The root
// correctly delegated the trip, but three-day planner briefs expanded into
// 10+ model steps and repeated place/route lookups. The task cohort therefore
// stayed incomplete and the root could never reach itinerary_reviewer or
// save_itinerary.
//
// Delegated planning finishes across several turns, because each background
// planner wakes the coordinator in a new one. This follows those turns rather
// than asserting on the dispatch turn alone.
export default defineEval({
  description:
    "An eight-day Tokyo trip delegates bounded two-day research, reviews the merged plan, and publishes once.",
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
            startDate: "2026-09-12",
            endDate: "2026-09-19",
            nights: 7,
            days: 8,
            budgetMyr: 11000,
            budgetCurrency: "MYR",
            destinationCurrency: "JPY",
            travelers: 1,
            travelPreferences: "I like matcha, dislike",
            mustVisitPlaces: [
              {
                name: "Sensō-ji",
                lat: 35.7147651,
                lng: 139.7966553,
              },
              {
                name: "Tokyo Skytree",
                lat: 35.7100627,
                lng: 139.8107004,
              },
            ],
          },
        },
      },
    });

    turn.expectOk();
    // Four two-day briefs keep each research task small enough to finish and
    // let Eve deliver the complete cohort back to the coordinator reliably.
    t.calledSubagent("day_planner", { count: 4 });

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
