import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Currency conversion uses the configured TravelBuddy planning rate without a live exchange-rate dependency.",
  tags: ["currency", "performance", "tool-safety"],
  async test(t) {
    await t.send("Convert my RM 10750 budget to HUF.", {
      clientContext: {
        travelBuddy: {
          trip: {
            budgetCurrency: "MYR",
            destinationCurrency: "HUF",
            fixedConversionRate: 84,
          },
        },
      },
    });

    t.succeeded();
    t.calledTool("convert_currency", {
      input: { from: "MYR", to: "HUF", amount: 10750 },
      output: {
        success: true,
        rate: 84,
        convertedAmount: 903000,
        source: "TravelBuddy onboarding rate",
      },
    });
    t.noFailedActions();
  },
});
