import { defineEval } from "eve/evals";

// Regression for wrun_01M24RM3HQBW0HKQ0MQYNXW6BQ: changing the model to a
// Gateway string while adding Exa made the turn fail before web_search ran.
// A current-information request must complete through the authored search tool
// while the selected model continues to use its direct provider credentials.
export default defineEval({
  description:
    "A current travel-information request completes and uses the direct Exa-backed web search tool.",
  tags: ["web-search", "provider-routing", "tool-safety"],
  timeoutMs: 120_000,
  async test(t) {
    await t.send(
      "Find one currently announced public photography event in George Town, Penang and give me its source link.",
      {
        clientContext: {
          travelBuddy: {
            trip: { destination: "George Town, Penang, Malaysia", travelers: 1 },
          },
        },
      },
    );

    t.succeeded();
    t.calledTool("web_search");
    t.noFailedActions();
  },
});
