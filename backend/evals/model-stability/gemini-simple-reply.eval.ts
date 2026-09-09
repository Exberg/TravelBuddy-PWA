import { defineEval } from "eve/evals";

// Isolates provider health from agent design: a greeting needs no tools, no
// skill, and almost no output. If this fails while the Qwen path passes, the
// problem is gemini-3.8-flash itself rather than anything TravelBuddy asked of
// it.
export default defineEval({
  description:
    "Gemini returns a complete reply to a trivial prompt, isolating provider stability from itinerary complexity.",
  tags: ["gemini", "model-stability"],
  timeoutMs: 60_000,
  async test(t) {
    const turn = await t.send("Hi!", {
      clientContext: { travelBuddy: { model: "gemini-3.8-flash" } },
    });

    turn.expectOk();
    turn.eventsSatisfy(
      "Gemini ends the turn normally",
      (events) =>
        events.some(
          (event) =>
            event.type === "step.completed" &&
            event.data.finishReason === "stop",
        ),
    );
  },
});
