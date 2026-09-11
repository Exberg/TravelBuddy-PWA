// Google Maps tool definitions, shared by the root agent and the itinerary
// planner subagent.
//
// A declared subagent inherits nothing from the root's `tools/`, so both agents
// need their own tool files. Defining the tools once here and re-exporting them
// from each `tools/<name>.ts` keeps a single implementation while letting eve
// derive the model-facing tool name from the filename in both places.

import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  computeRoute,
  describeMapsError,
  fetchPlaceDetail,
  geocode,
  searchPlaces,
  type TravelMode,
  type Waypoint,
} from "./maps";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const travelModeSchema = z
  .enum(["walk", "drive", "transit", "bicycle"])
  .describe("How the traveler moves between the two points.");

function toApiMode(mode: z.infer<typeof travelModeSchema>): TravelMode {
  return mode.toUpperCase() as TravelMode;
}

const waypointObjectSchema = z.union([
  z.object({ placeId: z.string().min(1) }),
  z.object({ location: latLngSchema }),
  z.object({ address: z.string().min(2).max(200) }),
]);

// Models routinely hand this parameter a JSON-encoded string rather than an
// object — `"{\"placeId\": \"ChIJ...\"}"` — and a union of object variants
// rejects that during input validation, so the call fails before `execute` ever
// runs. Every travel_time call in the 2026-09-11 Sydney session died this way,
// which silently cost the plan its measured hops. Accepting a string and
// normalizing it here is cheaper than a tool that is right but unusable.
const waypointSchema = z.union([
  waypointObjectSchema,
  z.string().min(2).max(400),
]);

/** Normalizes an accepted waypoint input into the shape the Routes API needs. */
export function toWaypoint(value: z.infer<typeof waypointSchema>): Waypoint {
  if (typeof value !== "string") return value as Waypoint;

  const trimmed = value.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = waypointObjectSchema.safeParse(JSON.parse(trimmed));
      if (parsed.success) return parsed.data as Waypoint;
    } catch {
      // Not valid JSON after all. Fall through and read it as an address.
    }
  }

  return { address: trimmed };
}

export const searchPlacesTool = defineTool({
  description:
    "Search Google Maps for real places (attractions, restaurants, cafes, hotels, shops) matching a natural-language query. Use this instead of recalling places from memory, and prefer biasing the search to a coordinate so results stay in the right part of the city. Returns ratings, price bucket, coordinates and whether each place is open right now.",
  inputSchema: z.object({
    query: z
      .string()
      .min(2)
      .max(200)
      .describe(
        "What to look for, including the location, e.g. 'halal nasi kandar in George Town Penang'.",
      ),
    near: latLngSchema
      .optional()
      .describe("Bias results toward this point. Get it from geocode_place."),
    radiusMeters: z
      .number()
      .int()
      .min(100)
      .max(50_000)
      .optional()
      .describe("Bias radius around `near`. Defaults to 5000."),
    minRating: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe("Drop places rated below this. 4.0 is a reasonable filter."),
    openNow: z
      .boolean()
      .optional()
      .describe("Only return places open at this moment."),
    maxResults: z.number().int().min(1).max(20).optional(),
  }),
  async execute(input) {
    try {
      const places = await searchPlaces(input);
      if (places.length === 0) {
        return {
          places: [],
          note: `Google Maps returned no places for "${input.query}".`,
        };
      }
      return { places };
    } catch (error) {
      return { places: [], error: describeMapsError(error) };
    }
  },
});

export const placeDetailsTool = defineTool({
  description:
    "Look up one place on Google Maps by its place id: opening hours for every day of the week, website, phone, price bucket, rating, place types and a few review excerpts. Use this before committing a place to an itinerary slot when the timing matters, and to check dietary or halal signals in the reviews.",
  inputSchema: z.object({
    placeId: z
      .string()
      .min(1)
      .describe("Google place id from search_places, e.g. 'ChIJ...'."),
  }),
  async execute({ placeId }) {
    try {
      return { place: await fetchPlaceDetail(placeId) };
    } catch (error) {
      return { place: null, error: describeMapsError(error) };
    }
  },
});

export const travelTimeTool = defineTool({
  description:
    "Get the real Google Maps travel time and distance between two points for walking, driving, transit or cycling. Use this before sequencing stops so the plan is geographically sensible, and never guess a travel duration you could measure here.",
  inputSchema: z.object({
    origin: waypointSchema.describe(
      'Starting point, as an object: {"placeId":"ChIJ..."}, {"location":{"lat":-33.86,"lng":151.21}} or {"address":"..."}. A plain string is read as an address.',
    ),
    destination: waypointSchema.describe(
      'Ending point, as an object: {"placeId":"ChIJ..."}, {"location":{"lat":-33.86,"lng":151.21}} or {"address":"..."}. A plain string is read as an address.',
    ),
    mode: travelModeSchema,
  }),
  async execute(input) {
    try {
      const leg = await computeRoute(
        toWaypoint(input.origin),
        toWaypoint(input.destination),
        toApiMode(input.mode),
      );
      return { route: leg };
    } catch (error) {
      return { route: null, error: describeMapsError(error) };
    }
  },
});

export const geocodePlaceTool = defineTool({
  description:
    "Resolve a city, neighbourhood, landmark or address to coordinates and a canonical name. Call this once at the start of planning to anchor the destination, then pass the coordinates to search_places as `near`.",
  inputSchema: z.object({
    query: z
      .string()
      .min(2)
      .max(200)
      .describe("A place name or address, e.g. 'George Town, Penang, Malaysia'."),
  }),
  async execute({ query }) {
    try {
      return { location: await geocode(query) };
    } catch (error) {
      return { location: null, error: describeMapsError(error) };
    }
  },
});
