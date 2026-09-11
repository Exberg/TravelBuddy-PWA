// The one channel through which a structured itinerary reaches the PWA.
//
// The tool result carries the full itinerary object, which the frontend renders
// directly from the tool call part (see frontend/src/components/ChatScreen.tsx).
// `toModelOutput` keeps the model's own view to a short confirmation so a
// 10-stop plan isn't re-sent on every later step of the turn.

import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  countStops,
  describeItinerary,
  detectPlanShrink,
  findDuplicateStopIds,
  itinerarySchema,
  itineraryReadState,
  itineraryState,
  ITINERARY_CURRENCY,
  normalizeItinerary,
  sumEstimatedCostMyr,
} from "../lib/itinerary";
import {
  hasItineraryValidationErrors,
  validateItinerary,
} from "../lib/itinerary-validation";

export default defineTool({
  description:
    "Publish the traveler's itinerary to the app so it renders in the trip timeline. Always call this after creating an itinerary or making any change to one, and always pass the COMPLETE itinerary: this replaces the previous version rather than merging into it. Call get_itinerary first when editing, keep the ids of stops you are not changing, and describe what changed in `changeNote`.",
  inputSchema: z.object({
    itinerary: itinerarySchema,
    changeNote: z
      .string()
      .min(1)
      .max(200)
      .describe(
        "One line on what changed, e.g. 'Created 3-day plan' or 'Swapped day 2 lunch for a halal option'.",
      ),
  }),
  async execute({ itinerary, changeNote }) {
    const duplicates = findDuplicateStopIds(itinerary);
    if (duplicates.length > 0) {
      throw new Error(
        `Stop ids must be unique across the whole itinerary. Reused: ${duplicates.join(", ")}. Re-send with distinct ids.`,
      );
    }

    const validationIssues = validateItinerary(itinerary);
    if (hasItineraryValidationErrors(validationIssues)) {
      const details = validationIssues
        .filter((issue) => issue.severity === "error")
        .map((issue) => `[${issue.code}] ${issue.message}`)
        .join(" ");
      throw new Error(
        `The itinerary failed deterministic validation and was not published. ${details}`,
      );
    }

    const normalized = normalizeItinerary(itinerary);
    const current = itineraryState.get();

    // This tool replaces the stored plan. A publish that drops days or stops is
    // only safe if the caller read the plan it is replacing, so require that
    // read rather than trusting it to have happened.
    const shrink = detectPlanShrink(current.itinerary, normalized);
    if (shrink && itineraryReadState.get().revision !== current.revision) {
      throw new Error(
        `This would replace a ${shrink.priorDays}-day, ${shrink.priorStops}-stop itinerary with a ${shrink.nextDays}-day, ${shrink.nextStops}-stop one, and you have not read revision ${current.revision}. save_itinerary replaces rather than merges, so the missing days would be deleted. Call get_itinerary, then resend the COMPLETE plan with only the requested change applied. If the traveler did ask to remove days or stops, calling get_itinerary first satisfies this check.`,
      );
    }

    const estimatedTotalMyr =
      normalized.estimatedTotalMyr ?? sumEstimatedCostMyr(normalized) ?? undefined;
    const published = { ...normalized, estimatedTotalMyr };
    const updatedAt = new Date().toISOString();

    const revision = current.revision + 1;
    itineraryState.update(() => ({
      tripId: current.tripId,
      itinerary: published,
      revision,
      updatedAt,
    }));
    // The caller authored this revision, so it knows the plan without re-reading
    // it. This keeps a second edit in the same turn from tripping the check.
    itineraryReadState.update(() => ({ revision }));

    return {
      status: "published" as const,
      revision,
      updatedAt,
      changeNote,
      currency: ITINERARY_CURRENCY,
      itinerary: published,
    };
  },
  toModelOutput(output) {
    const { itinerary } = output;
    const budgetLine =
      typeof itinerary.estimatedTotalMyr === "number"
        ? ` Estimated total RM ${itinerary.estimatedTotalMyr}${
            typeof itinerary.budgetMyr === "number"
              ? ` against a RM ${itinerary.budgetMyr} budget.`
              : "."
          }`
        : "";

    return {
      type: "text",
      value: [
        `Itinerary published to the app (revision ${output.revision}): ${itinerary.days.length} days, ${countStops(itinerary)} stops.${budgetLine}`,
        "The traveler can now see this timeline, so summarise it in a sentence or two rather than listing every stop again.",
        describeItinerary(itinerary),
      ].join("\n"),
    };
  },
});
