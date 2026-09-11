import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";
import {
  followDelegatedPlanning,
  publishedItinerary,
} from "./delegated-planning";

// Regression for a real Sydney session (trace 1af439aa…, 2026-09-11).
//
// The coordinator blueprinted an 8-day trip, dispatched three `day_planner`
// children in one step, and its turn ended there — correct, because declared
// subagents run as background tasks. One child finished five minutes later and
// woke it. Seeing two ranges still outstanding, it reasoned "Empty delivery"
// and returned `<eve-empty-delivery/>`. Nothing woke it again. `save_itinerary`
// was never called, so the app had no artifact card and no timeline: the
// traveler asked for an itinerary and got silence.
//
// The whole failure lives in the turns AFTER the one `t.send()` waits for, which
// is why this follows the notification turns instead of asserting on the
// dispatch turn.
export default defineEval({
  description:
    "A delegated multi-day trip publishes exactly one itinerary once every planner has reported back.",
  tags: ["itinerary", "subagents", "long-trip", "regression"],
  timeoutMs: 900_000,
  async test(t) {
    const dispatch = await t.send("Build my itinerary", {
      clientContext: {
        travelBuddy: {
          trip: {
            destination: "Sydney NSW, Australia",
            startDate: "2026-09-11",
            endDate: "2026-09-18",
            nights: 7,
            days: 8,
            budgetMyr: 13750,
            budgetCurrency: "MYR",
            destinationCurrency: "AUD",
            travelers: 1,
            travelPreferences:
              "Harbour views, coastal walks, local food, and a relaxed pace.",
          },
        },
      },
    });

    dispatch.expectOk();
    t.calledSubagent("day_planner", {
      count: (count) => count >= 2 && count <= 4,
    });

    const followed = await followDelegatedPlanning(t, dispatch);

    // The gate: dispatching planners is not planning. The session has to reach a
    // publish, or the traveler sees nothing at all.
    t.calledTool("save_itinerary", { count: 1 });

    const published = await t.require(
      publishedItinerary(followed.published),
      satisfies(
        (value) => Array.isArray((value as { days?: unknown[] })?.days),
        "the coordinator published an itinerary after its planners reported",
      ),
    );

    t.check(published, matches(itinerarySchema)).label("itinerary schema");
    t.check(
      published,
      satisfies((value) => {
        const days = (value as { days?: unknown[] }).days;
        return Array.isArray(days) && days.length === 8;
      }, "covers all eight days of the trip"),
    );

    // Every delegated range has to survive the merge. Publishing three of eight
    // days would satisfy a naive "did it save" check.
    t.check(
      published,
      satisfies((value) => {
        const days =
          (value as { days?: Array<{ day: number; stops?: unknown[] }> }).days ??
          [];
        const numbers = days.map((day) => day.day).sort((a, b) => a - b);
        return (
          numbers.every((day, index) => day === index + 1) &&
          days.every((day) => Array.isArray(day.stops) && day.stops.length > 0)
        );
      }, "days 1-8 are each present once and none is empty"),
    );

    t.calledSubagent("itinerary_reviewer", { count: 1 });
    t.noFailedActions();

    // The empty-delivery finish is the user-visible half of this bug: the plan
    // must be announced, not just written to state.
    t.check(
      followed.lastMessage,
      satisfies(
        (value) => typeof value === "string" && value.trim().length > 0,
        "the traveler is told the itinerary is ready",
      ),
    ).label("closing message");
  },
});
