import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

const MAX_FIRST_ANSWER_LATENCY_MS = 20_000;

export default defineEval({
  description:
    "Qwen begins its traveler-visible answer without a long hidden reasoning delay.",
  tags: ["performance", "qwen"],
  timeoutMs: 60_000,
  async test(t) {
    const startedAt = Date.now();
    const live = await t.start("Suggest a compact one-day itinerary for Singapore.", {
      clientContext: { travelBuddy: { model: "qwen-3.8-max" } },
    });

    await live.waitForEvent("message.appended");
    const firstAnswerLatencyMs = Date.now() - startedAt;
    t.log(`Qwen first-answer latency: ${firstAnswerLatencyMs}ms`);
    t.check(
      firstAnswerLatencyMs,
      satisfies(
        (latencyMs) =>
          typeof latencyMs === "number" &&
          latencyMs < MAX_FIRST_ANSWER_LATENCY_MS,
        `first traveler-visible answer arrives within ${MAX_FIRST_ANSWER_LATENCY_MS}ms`,
      ),
    );

    const turn = await live.result();
    turn.expectOk();
  },
});
