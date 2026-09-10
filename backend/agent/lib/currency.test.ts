import { describe, expect, test } from "bun:test";
import { rateFromQuote, resolveClientCurrencyRate } from "./currency";

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

  test("reads the quote from Eve client context", () => {
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
                fixedConversionRate: 84,
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
});
