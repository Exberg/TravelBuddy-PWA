import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "Gemini completes a multi-day itinerary instead of stopping midway through generated text.",
  tags: ["gemini", "model-stability"],
  timeoutMs: 60_000,
  async test(t) {
    const turn = await t.send("Build me a compact itinerary for 5D4N in Egypt.", {
      clientContext: { travelBuddy: { model: "gemini-3.8-flash" } },
    });

    turn.expectOk();
    turn.messageIncludes(/day\s*5/i);
    turn.eventsSatisfy(
      "Gemini ends the answer normally",
      (events) =>
        events.some(
          (event) =>
            event.type === "step.completed" &&
            event.data.finishReason === "stop",
        ),
    );
  },
});
