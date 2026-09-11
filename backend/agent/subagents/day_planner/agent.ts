import { defineAgent, defineDynamic } from "eve";
import { selectQwenModel } from "../../qwen-model";
import { dayPlannerOutputSchema } from "./schema";

export default defineAgent({
  description:
    "Research and draft one or more specifically assigned itinerary days using real Google Maps places and travel times. Delegate independent day or neighbourhood groups here in parallel; this specialist cannot save or publish an itinerary.",
  defaultTools: false,
  model: defineDynamic({
    events: { "step.started": selectQwenModel },
  }),
  reasoning: "low",
  outputSchema: dayPlannerOutputSchema,
});
