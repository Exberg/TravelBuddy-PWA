import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Building an itinerary in a destination with a different currency uses the onboarding-recorded rate exactly once.",
  tags: ["itinerary", "currency", "tool-safety"],
  timeoutMs: 300_000,
  async test(t) {
    await t.send("Build my one-day Budapest itinerary.", {
      clientContext: {
        travelBuddy: {
          itinerarySnapshot: {
            tripId: "trip-budapest-currency",
            itinerary: null,
            revision: 0,
            updatedAt: null,
          },
          trip: {
            destination: "Budapest, Hungary",
            startDate: "2026-11-02",
            endDate: "2026-11-02",
            nights: 0,
            days: 1,
            budgetMyr: 10_750,
            budgetCurrency: "MYR",
            destinationCurrency: "HUF",
            fixedConversionRate: 84,
            travelers: 2,
          },
        },
      },
    });

    t.succeeded();
    t.noFailedActions();
    t.loadedSkill("itinerary_planning");
    t.calledTool("convert_currency", {
      input: { from: "MYR", to: "HUF", amount: 10_750 },
      output: { success: true, rate: 84, convertedAmount: 903_000 },
      count: 1,
    });
    t.calledTool("save_itinerary");
  },
});
