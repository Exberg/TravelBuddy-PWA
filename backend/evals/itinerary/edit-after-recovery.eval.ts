import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

// The app no longer repeats the whole plan in client context on every turn: the
// first turn of a session carries it, later turns carry only the revision, and
// the agent reads it back with `get_itinerary`. That makes a partial republish
// the dangerous failure, because `save_itinerary` replaces rather than merges.
// This asserts the second turn still edits against all three days instead of
// publishing only the day it touched.

function stop(id: string, time: string, title: string) {
  return {
    id,
    time,
    segment: "morning" as const,
    title,
    description: "Placed by the fixture so the edit has something to preserve.",
    category: "sight" as const,
    estimatedCostMyr: 40,
  };
}

const ITINERARY = {
  title: "Penang Three Ways",
  destination: "George Town, Penang, Malaysia",
  summary: "Three days across the heritage core, the hills and the coast.",
  budgetMyr: 1800,
  days: [
    { day: 1, title: "Heritage core", stops: [stop("blue-mansion", "10:00", "Blue Mansion")] },
    { day: 2, title: "Hills", stops: [stop("kek-lok-si", "10:00", "Kek Lok Si")] },
    { day: 3, title: "Coast", stops: [stop("clan-jetties", "10:00", "Clan Jetties")] },
  ],
};

const TRIP = {
  destination: ITINERARY.destination,
  budgetMyr: 1800,
  budgetCurrency: "MYR",
  travelers: 2,
  days: 3,
};

export default defineEval({
  description:
    "An edit on a later turn republishes all three days, with the plan read back rather than resent in context.",
  tags: ["itinerary", "editing", "recovery"],
  timeoutMs: 420_000,
  async test(t) {
    const session = t.newSession();

    // Turn one carries the plan, as the app does on a fresh session.
    const first = await session.send("What does day 2 look like right now?", {
      clientContext: {
        surface: "TravelBuddy PWA",
        travelBuddy: {
          trip: TRIP,
          itinerarySnapshot: {
            tripId: "trip-edit-after-recovery",
            itinerary: ITINERARY,
            revision: 5,
            updatedAt: "2026-09-09T12:00:00.000Z",
          },
        },
      },
    });

    first.expectOk();

    // Turn two omits it, as the app does once the session holds it.
    const edit = await session.send(
      "Make day 2 cheaper and leave days 1 and 3 alone.",
      {
        clientContext: {
          surface: "TravelBuddy PWA",
          travelBuddy: {
            trip: TRIP,
            itinerarySnapshot: {
              tripId: "trip-edit-after-recovery",
              revision: 5,
              updatedAt: "2026-09-09T12:00:00.000Z",
            },
          },
        },
      },
    );

    edit.expectOk();
    t.noFailedActions();
    edit.calledTool("get_itinerary");

    const published = edit.requireToolCall("save_itinerary").output as
      | { itinerary?: { days?: Array<{ day: number }> } }
      | undefined;

    t.check(
      published?.itinerary,
      satisfies((value) => {
        const days = (value as { days?: Array<{ day: number }> })?.days ?? [];
        return days.length === 3;
      }, "republishes all three days rather than only the edited one"),
    );
  },
});
