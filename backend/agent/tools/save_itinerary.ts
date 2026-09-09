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
  findDuplicateStopIds,
  itinerarySchema,
  itineraryState,
  ITINERARY_CURRENCY,
  normalizeItinerary,
  sumEstimatedCostMyr,
} from "../lib/itinerary";

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

    const normalized = normalizeItinerary(itinerary);
    const estimatedTotalMyr =
      normalized.estimatedTotalMyr ?? sumEstimatedCostMyr(normalized) ?? undefined;
    const published = { ...normalized, estimatedTotalMyr };
    const updatedAt = new Date().toISOString();

    const current = itineraryState.get();
    const revision = current.revision + 1;
    itineraryState.update(() => ({
      tripId: current.tripId,
      itinerary: published,
      revision,
      updatedAt,
    }));

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
