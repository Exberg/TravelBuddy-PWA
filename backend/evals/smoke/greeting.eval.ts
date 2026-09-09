import { defineEval } from "eve/evals";

export default defineEval({
  description: "A greeting gets a normal reply without invoking tools.",
  tags: ["smoke", "deterministic"],
  async test(t) {
    await t.send("Hi! I'm planning a trip.");

    t.succeeded();
    t.usedNoTools();
  },
});
