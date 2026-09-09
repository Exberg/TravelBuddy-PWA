import { defineEval } from "eve/evals";

export default defineEval({
  description: "Travel preferences survive across turns in the same Eve session.",
  tags: ["conversation", "deterministic"],
  async test(t) {
    const first = await t.send(
      "For this trip, remember that I prefer quiet nature activities over shopping.",
    );
    first.expectOk();

    const second = await t.send("What kind of activities do I prefer?");

    t.succeeded();
    second.messageIncludes(/quiet|nature/i);
    t.usedNoTools();
  },
});
