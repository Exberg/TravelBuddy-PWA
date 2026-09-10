import { describe, expect, test } from "bun:test";
import {
  buildPhotoMediaUrl,
  buildTextSearchQuery,
  decodePhotoName,
  mapPlaceDetails,
  mapTextSearchResponse,
  type GooglePlaceDetails,
  type GoogleTextSearchResponse,
} from "./places-mapping";

describe("buildTextSearchQuery", () => {
  test("builds a sights query", () => {
    expect(buildTextSearchQuery("Penang", "sights")).toBe(
      "top attractions in Penang",
    );
  });

  test("builds a cafes query", () => {
    expect(buildTextSearchQuery("Penang", "cafes")).toBe("cafes in Penang");
  });

  test("builds a stays query", () => {
    expect(buildTextSearchQuery("Penang", "stays")).toBe(
      "places to stay in Penang",
    );
  });
});

describe("mapTextSearchResponse", () => {
  test("maps a full place response", () => {
    const response: GoogleTextSearchResponse = {
      places: [
        {
          id: "place-abc",
          displayName: { text: "The Blue Mansion" },
          shortFormattedAddress: "Heritage Core",
          rating: 4.8,
          location: { latitude: 5.4141, longitude: 100.3288 },
          types: ["museum", "tourist_attraction"],
          photos: [{ name: "places/place-abc/photos/photo-1" }],
        },
      ],
    };

    const [place] = mapTextSearchResponse(response, "sights");

    expect(place).toEqual({
      id: "place-abc",
      title: "The Blue Mansion",
      subtitle: "Heritage Core • 4.8",
      category: "sights",
      rating: 4.8,
      photoName: "places/place-abc/photos/photo-1",
      iconName: "museum",
      lat: 5.4141,
      lng: 100.3288,
    });
  });

  test("handles a missing rating and missing photo", () => {
    const response: GoogleTextSearchResponse = {
      places: [
        {
          id: "place-xyz",
          displayName: { text: "New Cafe" },
          formattedAddress: "Some Street",
          location: { latitude: 5.42, longitude: 100.33 },
          types: ["cafe"],
        },
      ],
    };

    const [place] = mapTextSearchResponse(response, "cafes");

    expect(place.rating).toBe(0);
    expect(place.photoName).toBeNull();
    expect(place.subtitle).toBe("Some Street");
    expect(place.iconName).toBe("local_cafe");
  });

  test("falls back to the category default icon when types are unmapped", () => {
    const response: GoogleTextSearchResponse = {
      places: [
        {
          id: "place-1",
          displayName: { text: "Mystery Spot" },
          location: { latitude: 1, longitude: 2 },
          types: ["some_unmapped_type"],
        },
      ],
    };

    const [place] = mapTextSearchResponse(response, "stays");
    expect(place.iconName).toBe("hotel");
  });

  test("skips places missing an id or coordinates", () => {
    const response: GoogleTextSearchResponse = {
      places: [
        { displayName: { text: "No id" }, location: { latitude: 1, longitude: 2 } },
        { id: "no-coords", displayName: { text: "No coords" } },
        {
          id: "ok",
          displayName: { text: "Valid" },
          location: { latitude: 1, longitude: 2 },
        },
      ],
    };

    const results = mapTextSearchResponse(response, "sights");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ok");
  });

  test("returns an empty array when places is missing", () => {
    expect(mapTextSearchResponse({}, "sights")).toEqual([]);
  });
});

describe("decodePhotoName", () => {
  test("decodes a valid URL-encoded photo resource name", () => {
    const encoded = encodeURIComponent("places/place-abc/photos/photo-1");
    expect(decodePhotoName(encoded)).toBe("places/place-abc/photos/photo-1");
  });

  test("rejects a missing name", () => {
    expect(decodePhotoName(undefined)).toBeNull();
  });

  test("rejects a name that doesn't start with places/", () => {
    expect(decodePhotoName(encodeURIComponent("not-a-photo"))).toBeNull();
  });

  test("rejects a name containing path traversal", () => {
    expect(
      decodePhotoName(encodeURIComponent("places/../../etc/passwd")),
    ).toBeNull();
  });
});

describe("mapPlaceDetails", () => {
  test("maps a full place details response", () => {
    const place: GooglePlaceDetails = {
      id: "place-abc",
      displayName: { text: "The Blue Mansion" },
      shortFormattedAddress: "Heritage Core",
      formattedAddress: "14 Leith St, Georgetown",
      rating: 4.8,
      userRatingCount: 1234,
      primaryTypeDisplayName: { text: "Museum" },
      editorialSummary: { text: "An indigo-blue heritage mansion." },
      priceLevel: "PRICE_LEVEL_MODERATE",
      websiteUri: "https://example.com",
      googleMapsUri: "https://maps.google.com/?cid=1",
      photos: [
        { name: "places/place-abc/photos/photo-1" },
        { name: "places/place-abc/photos/photo-2" },
      ],
      reviews: [
        {
          rating: 5,
          text: { text: "Stunning architecture." },
          relativePublishTimeDescription: "2 months ago",
          authorAttribution: {
            displayName: "Ada L.",
            photoUri: "https://lh3.googleusercontent.com/a/ada",
          },
        },
      ],
    };

    expect(mapPlaceDetails(place)).toEqual({
      id: "place-abc",
      title: "The Blue Mansion",
      address: "Heritage Core",
      category: "Museum",
      rating: 4.8,
      userRatingCount: 1234,
      summary: "An indigo-blue heritage mansion.",
      priceLevel: "PRICE_LEVEL_MODERATE",
      websiteUri: "https://example.com",
      googleMapsUri: "https://maps.google.com/?cid=1",
      photoNames: [
        "places/place-abc/photos/photo-1",
        "places/place-abc/photos/photo-2",
      ],
      reviews: [
        {
          author: "Ada L.",
          authorPhotoUri: "https://lh3.googleusercontent.com/a/ada",
          rating: 5,
          text: "Stunning architecture.",
          relativeTime: "2 months ago",
        },
      ],
    });
  });

  test("applies defaults for missing fields and drops empty reviews", () => {
    const place: GooglePlaceDetails = {
      id: "place-xyz",
      displayName: { text: "New Cafe" },
      formattedAddress: "Some Street",
      reviews: [
        { rating: 4, text: { text: "" } },
        {
          rating: 4,
          originalText: { text: "Solid espresso." },
          authorAttribution: {},
        },
      ],
    };

    const details = mapPlaceDetails(place);

    expect(details.address).toBe("Some Street");
    expect(details.rating).toBe(0);
    expect(details.userRatingCount).toBe(0);
    expect(details.summary).toBeNull();
    expect(details.priceLevel).toBeNull();
    expect(details.photoNames).toEqual([]);
    expect(details.reviews).toEqual([
      {
        author: "Google user",
        authorPhotoUri: null,
        rating: 4,
        text: "Solid espresso.",
        relativeTime: "",
      },
    ]);
  });
});

describe("buildPhotoMediaUrl", () => {
  test("builds the Google Photo media URL with the api key and default width", () => {
    const url = buildPhotoMediaUrl("places/place-abc/photos/photo-1", "secret-key");
    expect(url).toBe(
      "https://places.googleapis.com/v1/places/place-abc/photos/photo-1/media?maxWidthPx=800&key=secret-key",
    );
  });

  test("respects a custom maxWidthPx", () => {
    const url = buildPhotoMediaUrl("places/place-abc/photos/photo-1", "secret-key", 400);
    expect(url).toContain("maxWidthPx=400");
  });
});
