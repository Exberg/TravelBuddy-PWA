import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Currency conversion uses the configured TravelBuddy planning rate without a live exchange-rate dependency.",
  tags: ["currency", "performance", "tool-safety"],
  async test(t) {
    await t.send("Convert my RM 4500 budget to the destination currency.", {
      clientContext: {
        travelBuddy: {
          trip: {
            budgetCurrency: "MYR",
            destinationCurrency: "JPY",
            fixedConversionRate: 34.2,
          },
        },
      },
    });

    t.succeeded();
    t.calledTool("convert_currency");
    t.noFailedActions();
  },
});
