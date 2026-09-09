import { defineEval } from "eve/evals";

// A travel assistant that answers place questions from memory will confidently
// recommend closed restaurants. The map tools exist so it doesn't have to, and
// the instructions say to use them for anything about a real place.
export default defineEval({
  description:
    "A question about a real nearby place is answered with the Google Maps tools, not from model memory.",
  tags: ["places", "tool-safety"],
  timeoutMs: 180_000,
  async test(t) {
    await t.send("What's a good coffee spot near Armenian Street in Penang?", {
      clientContext: {
        travelBuddy: {
          trip: {
            destination: "George Town, Penang, Malaysia",
            budgetMyr: 1200,
            budgetCurrency: "MYR",
            travelers: 2,
          },
        },
      },
    });

    t.succeeded();
    t.calledTool("search_places");
    t.noFailedActions();

    // A single coffee recommendation is not itinerary work: it should neither
    // load the planning procedure nor republish the trip.
    t.notCalledTool("load_skill");
    t.notCalledTool("save_itinerary");
  },
});
