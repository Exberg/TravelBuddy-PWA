import { defineAgent, defineDynamic } from "eve";
import { selectQwenModel } from "../../qwen-model";
import { reviewReportSchema } from "./schema";

export default defineAgent({
  description:
    "Perform a read-only whole-trip quality review after day drafts are merged. Check preference and hard-constraint coverage, duplicates, sequencing, pace, budget, variety, and unsupported claims; return structured errors, warnings, and suggestions without editing or publishing.",
  defaultTools: false,
  model: defineDynamic({
    events: { "step.started": selectQwenModel },
  }),
  reasoning: "low",
  outputSchema: reviewReportSchema,
});
