import { describe, expect, test } from "bun:test";
import {
  mapPlaceDetail,
  mapPlaceSummary,
  mapReviewHighlights,
  mapRoute,
  parseDurationSeconds,
} from "./maps";

describe("mapPlaceSummary", () => {
  test("maps a full Google place", () => {
    const summary = mapPlaceSummary({
      id: "ChIJabc",
      displayName: { text: "Toh Soon Cafe" },
      shortFormattedAddress: "184 Lebuh Campbell",
      formattedAddress: "184 Lebuh Campbell, 10100 George Town",
      primaryTypeDisplayName: { text: "Cafe" },
      rating: 4.3,
      userRatingCount: 1200,
      priceLevel: "PRICE_LEVEL_INEXPENSIVE",
      location: { latitude: 5.4187, longitude: 100.3327 },
      googleMapsUri: "https://maps.google.com/?cid=1",
      currentOpeningHours: { openNow: true },
      editorialSummary: { text: "Back-lane charcoal toast." },
    });

    expect(summary).toEqual({
      placeId: "ChIJabc",
      name: "Toh Soon Cafe",
      address: "184 Lebuh Campbell",
      primaryType: "Cafe",
      rating: 4.3,
      userRatingCount: 1200,
      priceLevel: "PRICE_LEVEL_INEXPENSIVE",
      location: { lat: 5.4187, lng: 100.3327 },
      googleMapsUri: "https://maps.google.com/?cid=1",
      openNow: true,
      summary: "Back-lane charcoal toast.",
    });
  });

  test("returns null without a place id, since it cannot be looked up again", () => {
    expect(mapPlaceSummary({ displayName: { text: "Nameless" } })).toBeNull();
  });

  test("nulls missing optional fields instead of inventing them", () => {
    const summary = mapPlaceSummary({ id: "ChIJxyz" });

    expect(summary).toMatchObject({
      name: "Unknown place",
      rating: null,
      openNow: null,
      location: null,
      summary: null,
    });
  });

  test("falls back to the long address when the short one is absent", () => {
    expect(
      mapPlaceSummary({ id: "ChIJxyz", formattedAddress: "14 Leith St" })?.address,
    ).toBe("14 Leith St");
  });
});

describe("mapReviewHighlights", () => {
  test("drops short reviews, collapses whitespace, and caps the count", () => {
    const highlights = mapReviewHighlights({
      id: "ChIJabc",
      reviews: [
        { text: { text: "Great!" } },
        {
          text: {
            text: "The  kaya toast\nhere is worth the queue, and the coffee is properly strong.",
          },
        },
        { originalText: { text: "b".repeat(60) } },
        { text: { text: "c".repeat(60) } },
        { text: { text: "d".repeat(60) } },
      ],
    });

    expect(highlights).toHaveLength(3);
    expect(highlights[0]).toBe(
      "The kaya toast here is worth the queue, and the coffee is properly strong.",
    );
  });

  test("truncates a very long review", () => {
    const [highlight] = mapReviewHighlights({
      id: "ChIJabc",
      reviews: [{ text: { text: "x".repeat(500) } }],
    });

    expect(highlight).toHaveLength(241);
    expect(highlight?.endsWith("…")).toBe(true);
  });
});

describe("mapPlaceDetail", () => {
  test("adds hours, contact details, and types", () => {
    const detail = mapPlaceDetail({
      id: "ChIJabc",
      displayName: { text: "Blue Mansion" },
      regularOpeningHours: { weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM"] },
      websiteUri: "https://example.com",
      nationalPhoneNumber: "04-262 0006",
      types: ["tourist_attraction"],
    });

    expect(detail).toMatchObject({
      openingHours: ["Monday: 9:00 AM – 5:00 PM"],
      websiteUri: "https://example.com",
      phone: "04-262 0006",
      types: ["tourist_attraction"],
      reviewHighlights: [],
    });
  });
});

describe("parseDurationSeconds", () => {
  test("parses Google's second-suffixed durations", () => {
    expect(parseDurationSeconds("540s")).toBe(540);
    expect(parseDurationSeconds("540.5s")).toBe(540.5);
  });

  test("rejects anything else", () => {
    expect(parseDurationSeconds(undefined)).toBeNull();
    expect(parseDurationSeconds("9 minutes")).toBeNull();
    expect(parseDurationSeconds("540")).toBeNull();
  });
});

describe("mapRoute", () => {
  test("converts the first route to whole minutes", () => {
    expect(
      mapRoute({ routes: [{ duration: "545s", distanceMeters: 700 }] }, "WALK"),
    ).toEqual({ mode: "WALK", durationMinutes: 9, distanceMeters: 700 });
  });

  test("returns null when Google found no route", () => {
    expect(mapRoute({ routes: [] }, "TRANSIT")).toBeNull();
  });
});
