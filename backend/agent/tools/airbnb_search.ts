import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchAirbnb } from "../lib/openbnb";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date in YYYY-MM-DD format.");
const guestCountSchema = z.number().int().min(0).max(16);

export default defineTool({
  description:
    "Search public Airbnb listings for a destination and return current listing links, displayed prices, ratings, badges, and pagination. Use this when the traveler asks for Airbnb or vacation-rental options; do not invent availability or prices. Results come from OpenBNB's open-source Airbnb extraction logic and are not a booking confirmation.",
  inputSchema: z.object({
    location: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .describe("City, region, or destination to search."),
    placeId: z
      .string()
      .min(1)
      .optional()
      .describe("Google Maps place id, when one is already known."),
    checkin: dateSchema.optional(),
    checkout: dateSchema.optional(),
    adults: guestCountSchema.default(1),
    children: guestCountSchema.default(0),
    infants: guestCountSchema.default(0),
    pets: guestCountSchema.default(0),
    minPrice: z.number().finite().nonnegative().optional(),
    maxPrice: z.number().finite().nonnegative().optional(),
    cursor: z
      .string()
      .min(1)
      .optional()
      .describe("Pagination cursor returned by a previous search."),
    propertyType: z
      .enum(["entire_home", "private_room", "shared_room", "hotel_room"])
      .optional(),
    ignoreRobotsText: z
      .boolean()
      .default(false)
      .describe(
        "Override Airbnb robots.txt for this request. Leave false unless the user explicitly asks to bypass it and accepts the site's terms.",
      ),
  }),
  async execute(input, ctx) {
    return searchAirbnb(input, ctx.abortSignal);
  },
});
