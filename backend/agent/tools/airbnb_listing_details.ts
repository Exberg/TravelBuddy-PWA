import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAirbnbListingDetails } from "../lib/openbnb";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date in YYYY-MM-DD format.");
const guestCountSchema = z.number().int().min(0).max(16);

export default defineTool({
  description:
    "Fetch public details for one Airbnb listing id, including location, description, highlights, amenities, policies, and a direct listing link. Use after airbnb_search when the traveler wants to compare or inspect a result. Data comes from OpenBNB's open-source extraction logic and may change when Airbnb changes its page.",
  inputSchema: z.object({
    id: z
      .string()
      .regex(/^\d+$/)
      .describe("Numeric Airbnb listing id returned by airbnb_search."),
    checkin: dateSchema.optional(),
    checkout: dateSchema.optional(),
    adults: guestCountSchema.default(1),
    children: guestCountSchema.default(0),
    infants: guestCountSchema.default(0),
    pets: guestCountSchema.default(0),
    ignoreRobotsText: z
      .boolean()
      .default(false)
      .describe(
        "Override Airbnb robots.txt for this request. Leave false unless the user explicitly asks to bypass it and accepts the site's terms.",
      ),
  }),
  async execute(input, ctx) {
    return getAirbnbListingDetails(input, ctx.abortSignal);
  },
});
