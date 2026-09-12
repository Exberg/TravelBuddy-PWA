import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

// Regression for the real Tokyo session 4558abbe… (2026-09-12).
//
// The coordinator dispatched four day planners and received four
// `{ status: "working" }` admission receipts. Eve correctly continued the
// model loop, but the coordinator treated the receipts as if drafts existed,
// invented all eight days itself, and called `itinerary_reviewer` in the same
// turn. No grounded planner result had arrived, and `save_itinerary` was never
// reached.
export default defineEval({
  description:
    "A coordinator turn stops after dispatch receipts and waits for real planner results before review.",
  tags: ["itinerary", "subagents", "dispatch-boundary", "regression"],
  timeoutMs: 180_000,
  async test(t) {
    const dispatch = await t.send("Build my itinerary", {
      clientContext: {
        travelBuddy: {
          trip: {
            destination: "Tokyo, Japan",
            startDate: "2026-09-12",
            endDate: "2026-09-19",
            nights: 7,
            days: 8,
            budgetMyr: 12000,
            budgetCurrency: "MYR",
            destinationCurrency: "JPY",
            travelers: 1,
            travelPreferences: "I like matcha, dislikes",
            mustVisitPlaces: [
              {
                name: "Shibuya Sky",
                lat: 35.6586719,
                lng: 139.7019848,
              },
              {
                name: "Tokyo Skytree",
                lat: 35.7100627,
                lng: 139.8107004,
              },
              {
                name: "HATCOFFEE",
                lat: 35.7072891,
                lng: 139.7933029,
              },
            ],
          },
        },
      },
    });

    dispatch.expectOk();
    t.calledSubagent("day_planner", { count: 4 });

    t.check(
      dispatch.toolCalls,
      satisfies(
        (calls) =>
          !(calls as ReadonlyArray<{ name: string }>).some(
            (call) =>
              call.name === "itinerary_reviewer" ||
              call.name === "save_itinerary",
          ),
        "the dispatch turn contains no reviewer or save call",
      ),
    ).label("wait for planner results");

    t.check(
      dispatch.toolCalls,
      satisfies((calls) => {
        const planners = (
          calls as ReadonlyArray<{ name: string; output?: unknown }>
        ).filter((call) => call.name === "day_planner");

        return planners.every(
          (call) =>
            (call.output as { status?: unknown } | undefined)?.status ===
            "working",
        );
      }, "planner calls returned admission receipts, not draft results"),
    ).label("receipts are not drafts");
  },
});
