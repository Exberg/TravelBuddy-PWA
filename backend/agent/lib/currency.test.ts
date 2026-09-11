import { describe, expect, test } from "bun:test";
import {
  rateForPair,
  rateFromQuote,
  resolveClientCurrencyRate,
} from "./currency";

describe("recorded onboarding currency rates", () => {
  const quote = { from: "MYR", to: "HUF", rate: 84 };

  test("uses the recorded rate directly", () => {
    expect(rateFromQuote(quote, "MYR", "HUF")).toBe(84);
  });

  test("supports the reverse of the recorded pair", () => {
    expect(rateFromQuote(quote, "HUF", "MYR")).toBeCloseTo(1 / 84);
  });

  test("rejects a pair that onboarding did not record", () => {
    expect(rateFromQuote(quote, "MYR", "JPY")).toBeNull();
  });

  test("derives a rate from the currency pair", () => {
    expect(rateForPair("MYR", "HUF")).toBe(84);
    expect(rateForPair("MYR", "IDR")).toBe(3_700);
    expect(rateForPair("HUF", "MYR")).toBeCloseTo(1 / 84);
  });

  test("has no rate for a currency outside the planning table", () => {
    expect(rateForPair("MYR", "ZWL")).toBeNull();
  });

  test("resolves the quote from the pair in Eve client context", () => {
    expect(
      resolveClientCurrencyRate([
        {
          role: "user",
          content: `Client context:\n${JSON.stringify({
            travelBuddy: {
              itinerarySnapshot: { tripId: "trip-hungary" },
              trip: {
                budgetCurrency: "MYR",
                destinationCurrency: "HUF",
              },
            },
          })}`,
        },
      ]),
    ).toEqual({
      tripId: "trip-hungary",
      quote,
    });
  });

  test("ignores a rate a client leaked into the context", () => {
    expect(
      resolveClientCurrencyRate([
        {
          role: "user",
          content: `Client context:\n${JSON.stringify({
            travelBuddy: {
              itinerarySnapshot: { tripId: "trip-hungary" },
              trip: {
                budgetCurrency: "MYR",
                destinationCurrency: "HUF",
                fixedConversionRate: 1,
              },
            },
          })}`,
        },
      ]),
    ).toEqual({
      tripId: "trip-hungary",
      quote,
    });
  });

  test("records no quote for an unsupported pair", () => {
    expect(
      resolveClientCurrencyRate([
        {
          role: "user",
          content: `Client context:\n${JSON.stringify({
            travelBuddy: {
              itinerarySnapshot: { tripId: "trip-harare" },
              trip: { budgetCurrency: "MYR", destinationCurrency: "ZWL" },
            },
          })}`,
        },
      ]),
    ).toEqual({ tripId: "trip-harare", quote: null });
  });
});
