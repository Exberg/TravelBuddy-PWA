import { describe, expect, test } from "bun:test";
import { toWaypoint } from "./maps-tools";

// Every travel_time call in the 2026-09-11 Sydney session was rejected during
// input validation because the model sent JSON-encoded strings for these
// parameters. The plan lost all of its measured hops as a result.
describe("toWaypoint", () => {
  test("passes an object waypoint through unchanged", () => {
    expect(toWaypoint({ placeId: "ChIJra9q0mmuEmsR4Hy11eshm38" })).toEqual({
      placeId: "ChIJra9q0mmuEmsR4Hy11eshm38",
    });
    expect(toWaypoint({ location: { lat: -33.8614, lng: 151.2108 } })).toEqual({
      location: { lat: -33.8614, lng: 151.2108 },
    });
    expect(toWaypoint({ address: "Circular Quay, Sydney NSW" })).toEqual({
      address: "Circular Quay, Sydney NSW",
    });
  });

  test("parses a JSON-encoded place id, the exact shape that failed", () => {
    expect(toWaypoint('{"placeId": "ChIJ3S-JXmauEmsRUcIaWtf4MzE"}')).toEqual({
      placeId: "ChIJ3S-JXmauEmsRUcIaWtf4MzE",
    });
  });

  test("parses a JSON-encoded address and location", () => {
    expect(
      toWaypoint('{"address": "Circular Quay Wharf 3, Alfred St, Sydney NSW"}'),
    ).toEqual({ address: "Circular Quay Wharf 3, Alfred St, Sydney NSW" });
    expect(toWaypoint('{"location":{"lat":-33.8568,"lng":151.2153}}')).toEqual({
      location: { lat: -33.8568, lng: 151.2153 },
    });
  });

  test("reads a bare string as an address", () => {
    expect(toWaypoint("Sydney Opera House")).toEqual({
      address: "Sydney Opera House",
    });
  });

  test("falls back to an address when the JSON does not parse or fit", () => {
    expect(toWaypoint('{"placeId": ')).toEqual({ address: '{"placeId":' });
    expect(toWaypoint('{"wharf": "3"}')).toEqual({ address: '{"wharf": "3"}' });
  });

  test("trims surrounding whitespace", () => {
    expect(toWaypoint('  {"placeId": "ChIJabc"}  ')).toEqual({
      placeId: "ChIJabc",
    });
    expect(toWaypoint("  Bondi Beach  ")).toEqual({ address: "Bondi Beach" });
  });
});
