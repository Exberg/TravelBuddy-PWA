// Lets the agent read back the itinerary it published earlier in this session
// so an edit can preserve everything the traveler did not ask to change.
// Without this the model would have to reconstruct the plan from conversation
// history, which loses stop ids, coordinates and place ids.

import { defineTool } from "eve/tools";
import { z } from "zod";
import { countStops, itineraryReadState, itineraryState } from "../lib/itinerary";

export default defineTool({
  description:
    "Read the itinerary currently shown in the app. Call this before editing an existing itinerary so you can resend the complete plan with only the requested change applied.",
  inputSchema: z.object({}),
  async execute() {
    const { itinerary, revision, updatedAt } = itineraryState.get();

    if (!itinerary) {
      return {
        exists: false as const,
        note: "No itinerary has been published in this conversation yet.",
      };
    }

    // Records that this revision was actually read, which `save_itinerary`
    // requires before it will accept a plan that drops days or stops.
    itineraryReadState.update(() => ({ revision }));

    return {
      exists: true as const,
      revision,
      updatedAt,
      dayCount: itinerary.days.length,
      stopCount: countStops(itinerary),
      itinerary,
    };
  },
});
