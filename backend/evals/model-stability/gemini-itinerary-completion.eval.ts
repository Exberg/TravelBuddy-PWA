import { defineEval } from "eve/evals";
import { matches, satisfies } from "eve/evals/expect";
import { itinerarySchema } from "../../agent/lib/itinerary";

// Originally written because Gemini stopped midway through generated itinerary
// text. The agent no longer writes the itinerary into chat prose — it publishes
// it through `save_itinerary` and summarises — so the completion check now lives
// where the days actually are: the tool payload.
//
// KNOWN FAILING, provider-side. gemini-3.8-flash terminates the turn with
// finishReason "other" after a handful of tokens, or returns an empty response,
// as soon as the turn needs to run tools. Verified independent of TravelBuddy's
// instructions: `gemini-simple-reply` (no tools) passes on the same model, and
// this case fails identically with the "acknowledge before researching"
// guidance removed. The PWA never requests Gemini — the trip store defaults to
// qwen-3.8-max — so no traveler hits this path today. Left asserting the real
// contract rather than weakened, so it turns green if the provider recovers.
export default defineEval({
  description:
    "Gemini completes a multi-day itinerary turn and publishes every requested day instead of stopping midway.",
  tags: ["gemini", "model-stability"],
  // Itinerary turns now include live Google Maps research.
  timeoutMs: 300_000,
  async test(t) {
    const turn = await t.send("Build me a compact itinerary for 5D4N in Egypt.", {
      clientContext: { travelBuddy: { model: "gemini-3.8-flash" } },
    });

    turn.expectOk();

    const published = (
      turn.requireToolCall("save_itinerary").output as
        | { itinerary?: unknown }
        | undefined
    )?.itinerary;

    t.check(published, matches(itinerarySchema)).label("itinerary schema");

    t.check(
      published,
      satisfies((value) => {
        const days = (value as { days?: unknown[] } | undefined)?.days;
        return Array.isArray(days) && days.length === 5;
      }, "publishes all five days"),
    );

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
