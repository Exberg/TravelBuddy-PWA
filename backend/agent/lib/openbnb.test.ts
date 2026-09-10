import { describe, expect, test } from "bun:test";
import {
  buildAirbnbListingUrl,
  buildAirbnbSearchUrl,
  parseAirbnbListingHtml,
  parseAirbnbSearchHtml,
} from "./openbnb";

function airbnbHtml(payload: unknown) {
  return `<html><body><script id="data-deferred-state-0" type="application/json">${JSON.stringify(payload)}</script></body></html>`;
}

describe("OpenBNB URL construction", () => {
  test("maps search filters to Airbnb query parameters", async () => {
    const url = await buildAirbnbSearchUrl({
      location: "George Town, Malaysia",
      placeId: "ChIJ123",
      checkin: "2026-10-01",
      checkout: "2026-10-04",
      adults: 2,
      children: 1,
      minPrice: 100,
      maxPrice: 500,
      propertyType: "entire_home",
      cursor: "next-page",
    });

    expect(url.pathname).toBe("/s/George-Town--Malaysia/homes");
    expect(url.searchParams.get("place_id")).toBe("ChIJ123");
    expect(url.searchParams.get("checkin")).toBe("2026-10-01");
    expect(url.searchParams.get("checkout")).toBe("2026-10-04");
    expect(url.searchParams.get("adults")).toBe("2");
    expect(url.searchParams.get("children")).toBe("1");
    expect(url.searchParams.get("price_min")).toBe("100");
    expect(url.searchParams.get("price_max")).toBe("500");
    expect(url.searchParams.get("l2_property_type_ids[]")).toBe("1");
    expect(url.searchParams.get("cursor")).toBe("next-page");
  });

  test("uses listing-detail date parameter names", () => {
    const url = buildAirbnbListingUrl({
      id: "12345",
      checkin: "2026-10-01",
      checkout: "2026-10-04",
      adults: 2,
    });

    expect(url.pathname).toBe("/rooms/12345");
    expect(url.searchParams.get("check_in")).toBe("2026-10-01");
    expect(url.searchParams.get("check_out")).toBe("2026-10-04");
  });
});

describe("OpenBNB Airbnb payload parsing", () => {
  test("extracts compact search results and direct links", () => {
    const encodedId = Buffer.from("StayListing:12345").toString("base64");
    const html = airbnbHtml({
      niobeClientData: [
        [
          "key",
          {
            data: {
              presentation: {
                staysSearch: {
                  results: {
                    searchResults: [
                      {
                        __typename: "StaySearchResult",
                        demandStayListing: {
                          id: encodedId,
                          description: "Loft in George Town",
                          location: "George Town, Malaysia",
                        },
                        badges: [{ text: "Guest favourite" }],
                        avgRatingA11yLabel: "Rated 4.9 out of 5",
                        structuredDisplayPrice: {
                          primaryLine: { accessibilityLabel: "RM 320 per night" },
                        },
                        ignored: "not returned",
                      },
                    ],
                    paginationInfo: { nextPageCursor: "cursor-2" },
                  },
                },
              },
            },
          },
        ],
      ],
    });

    const result = parseAirbnbSearchHtml(html);

    expect(result.paginationInfo).toEqual({ nextPageCursor: "cursor-2" });
    expect(result.searchResults).toHaveLength(1);
    expect(result.searchResults[0]).toMatchObject({
      id: "12345",
      url: "https://www.airbnb.com/rooms/12345",
      avgRatingA11yLabel: "Rated 4.9 out of 5",
      badges: "Guest favourite",
    });
    expect(result.searchResults[0]).not.toHaveProperty("ignored");
  });

  test("recovers client-rendered amenities and highlights", () => {
    const html = airbnbHtml({
      niobeClientData: [
        [
          "details",
          {
            data: {
              presentation: {
                stayProductDetailPage: {
                  sections: {
                    sections: [
                      {
                        sectionId: "LOCATION_DEFAULT",
                        section: {
                          __typename: "LocationSection",
                          title: "Where you'll be",
                          subtitle: "George Town, Penang",
                          lat: 5.4141,
                          lng: 100.3288,
                        },
                      },
                      {
                        sectionId: "AMENITIES_DEFAULT",
                        section: { __typename: "AmenitiesSection" },
                      },
                    ],
                  },
                },
              },
              node: {
                pdpPresentation: {
                  amenities: {
                    title: "What this place offers",
                    seeAllAmenitiesGroups: [
                      {
                        title: "Internet",
                        amenities: [{ title: "Wifi", available: true }],
                      },
                      {
                        title: "Not included",
                        amenities: [{ title: "Dryer", available: false }],
                      },
                    ],
                  },
                  highlights: [
                    { title: "Self check-in", subtitle: "Use the lockbox" },
                  ],
                },
              },
            },
          },
        ],
      ],
    });

    const details = parseAirbnbListingHtml(html) as Array<Record<string, any>>;

    expect(details.find((section) => section.id === "LOCATION_DEFAULT")).toMatchObject({
      title: "Where you'll be",
      subtitle: "George Town, Penang",
      lat: 5.4141,
      lng: 100.3288,
    });
    expect(details.find((section) => section.id === "AMENITIES_DEFAULT")).toMatchObject({
      seeAllAmenitiesGroups: {
        Internet: "Wifi",
        "Not included": "Dryer",
      },
    });
    expect(details.find((section) => section.id === "HIGHLIGHTS_DEFAULT")).toEqual({
      id: "HIGHLIGHTS_DEFAULT",
      highlights: "Self check-in: Use the lockbox",
    });
  });
});
