import { defineChannel, GET } from "eve/channels";
import {
  buildPhotoMediaUrl,
  buildTextSearchQuery,
  decodePhotoName,
  mapPlaceDetails,
  mapTextSearchResponse,
  type GooglePlaceDetails,
  type GoogleTextSearchResponse,
  type PlaceCategory,
} from "../lib/places-mapping";

// Plain data-fetching HTTP routes for the MapScreen. This channel never
// touches the agent or a session: it's a server-side proxy that keeps
// GOOGLE_MAPS_API out of the browser while the frontend renders a real
// Google Map. Frontend calls: GET /places/search, GET /places/photo/:name.

const PLACE_CATEGORIES: readonly PlaceCategory[] = ["sights", "cafes", "stays"];

function isPlaceCategory(value: string | null): value is PlaceCategory {
  return !!value && (PLACE_CATEGORIES as readonly string[]).includes(value);
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.photos",
  "places.types",
].join(",");

// Place Details (New) returns a single place resource, so its field mask uses
// bare field paths (no "places." prefix).
const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "rating",
  "userRatingCount",
  "primaryTypeDisplayName",
  "editorialSummary",
  "priceLevel",
  "websiteUri",
  "googleMapsUri",
  "photos",
  "reviews",
].join(",");

export default defineChannel({
  routes: [
    GET("/places/search", async (request) => {
      const apiKey = process.env.GOOGLE_MAPS_API;
      if (!apiKey) {
        return Response.json(
          { error: "GOOGLE_MAPS_API is not configured" },
          { status: 500 },
        );
      }

      const url = new URL(request.url);
      const destination = url.searchParams.get("destination")?.trim();
      const category = url.searchParams.get("category");

      if (!destination) {
        return Response.json(
          { error: "destination is required" },
          { status: 400 },
        );
      }
      if (!isPlaceCategory(category)) {
        return Response.json(
          { error: `category must be one of: ${PLACE_CATEGORIES.join(", ")}` },
          { status: 400 },
        );
      }

      const textQuery = buildTextSearchQuery(destination, category);

      let upstream: Response;
      try {
        upstream = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify({ textQuery }),
        });
      } catch {
        return Response.json(
          { error: "Failed to reach Google Places API" },
          { status: 502 },
        );
      }

      if (!upstream.ok) {
        return Response.json(
          { error: "Google Places API request failed" },
          { status: 502 },
        );
      }

      const body = (await upstream.json()) as GoogleTextSearchResponse;
      const places = mapTextSearchResponse(body, category);

      return Response.json({ places });
    }),

    GET("/places/details/:placeId", async (_request, { params }) => {
      const apiKey = process.env.GOOGLE_MAPS_API;
      if (!apiKey) {
        return Response.json(
          { error: "GOOGLE_MAPS_API is not configured" },
          { status: 500 },
        );
      }

      const placeId = params.placeId?.trim();
      // Google place ids look like "ChIJ..."; reject anything that could be a
      // path-traversal attempt before interpolating into the upstream URL.
      if (!placeId || placeId.includes("/") || placeId.includes("..")) {
        return Response.json({ error: "Invalid place id" }, { status: 400 });
      }

      let upstream: Response;
      try {
        upstream = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": DETAILS_FIELD_MASK,
            },
          },
        );
      } catch {
        return Response.json(
          { error: "Failed to reach Google Places API" },
          { status: 502 },
        );
      }

      if (!upstream.ok) {
        return Response.json(
          { error: "Google Places API request failed" },
          { status: 502 },
        );
      }

      const body = (await upstream.json()) as GooglePlaceDetails;
      return Response.json({ place: mapPlaceDetails(body) });
    }),

    GET("/places/photo/:photoName", async (_request, { params }) => {
      const apiKey = process.env.GOOGLE_MAPS_API;
      if (!apiKey) {
        return Response.json(
          { error: "GOOGLE_MAPS_API is not configured" },
          { status: 500 },
        );
      }

      // photoName arrives URL-encoded because it contains slashes
      // (e.g. "places/<id>/photos/<photo-id>").
      const photoName = decodePhotoName(params.photoName);
      if (!photoName) {
        return Response.json({ error: "Invalid photo name" }, { status: 404 });
      }

      const mediaUrl = buildPhotoMediaUrl(photoName, apiKey);

      let upstream: Response;
      try {
        upstream = await fetch(mediaUrl);
      } catch {
        return Response.json({ error: "Photo not found" }, { status: 404 });
      }

      if (!upstream.ok || !upstream.body) {
        return Response.json({ error: "Photo not found" }, { status: 404 });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }),
  ],
});
