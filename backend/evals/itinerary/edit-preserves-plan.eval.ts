import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";

const TRIP_CONTEXT = {
  travelBuddy: {
    trip: {
      destination: "George Town, Penang, Malaysia",
      startDate: "2026-11-02",
      endDate: "2026-11-03",
      nights: 1,
      days: 2,
      budgetMyr: 1200,
      budgetCurrency: "MYR",
      travelers: 2,
    },
  },
};

// Editing is where a plan-shaped agent usually breaks: it regenerates the whole
// trip, or replies in prose and leaves the app showing a stale timeline. Both
// failures are invisible in a chat transcript, so assert the mechanics instead —
// the agent reads the current plan back, republishes a complete one, and keeps
// day 1 exactly as it was.
export default defineEval({
  description:
    "A targeted itinerary edit republishes the complete plan and leaves the untouched day intact.",
  tags: ["itinerary", "editing"],
  timeoutMs: 420_000,
  async test(t) {
    const build = await t.send("Build my 2-day itinerary.", {
      clientContext: TRIP_CONTEXT,
    });

    build.expectOk();
    const original = (
      build.requireToolCall("save_itinerary").output as {
        itinerary?: { days?: Array<{ day: number; stops: Array<{ id: string }> }> };
      } | undefined
    )?.itinerary;

    await t.require(
      original,
      satisfies(
        (value) => Array.isArray((value as { days?: unknown[] })?.days),
        "the first turn published an itinerary",
      ),
    );

    const originalDayOne = original?.days?.find((day) => day.day === 1);

    const edit = await t.send(
      "Day 2 is too packed. Drop one afternoon stop from day 2 and leave day 1 alone.",
      { clientContext: TRIP_CONTEXT },
    );

    edit.expectOk();
    t.noFailedActions();

    // Reading the current plan back is what makes a partial edit safe; without
    // it the model rebuilds from chat history and loses place ids.
    edit.calledTool("get_itinerary");

    const revised = (
      edit.requireToolCall("save_itinerary").output as {
        revision?: number;
        itinerary?: unknown;
      } | undefined
    );

    t.check(revised?.itinerary, matches(itinerarySchema)).label(
      "revised itinerary schema",
    );

    t.check(
      revised?.revision,
      satisfies(
        (value) => typeof value === "number" && value >= 2,
        "publishes a new revision rather than the first one",
      ),
    );

    t.check(
      revised?.itinerary,
      satisfies((value) => {
        const days = (value as { days?: Array<{ day: number }> })?.days ?? [];
        return days.length === 2;
      }, "still has both days"),
    );

    t.check(
      revised?.itinerary,
      satisfies((value) => {
        const days =
          (value as { days?: Array<{ day: number; stops: Array<{ id: string }> }> })
            ?.days ?? [];
        const revisedDayOne = days.find((day) => day.day === 1);
        const before = originalDayOne?.stops.map((stop) => stop.id) ?? [];
        const after = revisedDayOne?.stops.map((stop) => stop.id) ?? [];
        return (
          before.length > 0 &&
          before.length === after.length &&
          before.every((id, index) => id === after[index])
        );
      }, "day 1 stop ids are unchanged"),
    );
  },
});
