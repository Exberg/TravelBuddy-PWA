import { defineTool } from "eve/tools";
import { z } from "zod";
import { currencyRateState, rateFromQuote } from "../lib/currency";

const currencyCodeSchema = z
  .string()
  .regex(/^[A-Za-z]{3}$/)
  .transform((value) => value.toUpperCase())
  .describe("Three-letter ISO 4217 currency code, e.g. MYR or JPY.");

const successSchema = z.object({
  success: z.literal(true),
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  rate: z.number(),
  convertedAmount: z.number(),
  date: z.literal("onboarding-recorded-rate"),
  source: z.literal("TravelBuddy onboarding rate"),
});

const errorSchema = z.object({
  success: z.literal(false),
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const resultSchema = z.discriminatedUnion("success", [
  successSchema,
  errorSchema,
]);

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default defineTool({
  description:
    "Convert an amount using the exchange rate already recorded during TravelBuddy onboarding. This tool never fetches a live market rate.",
  inputSchema: z.object({
    from: currencyCodeSchema,
    to: currencyCodeSchema,
    amount: z.number().finite().nonnegative(),
  }),
  outputSchema: resultSchema,
  execute({ from, to, amount }) {
    const normalizedFrom = from.toUpperCase();
    const normalizedTo = to.toUpperCase();
    const rate = rateFromQuote(
      currencyRateState.get().quote,
      normalizedFrom,
      normalizedTo,
    );
    if (rate === null) {
      return {
        success: false as const,
        from: normalizedFrom,
        to: normalizedTo,
        amount,
        error: {
          code: "unrecorded_currency_pair",
          message:
            "No onboarding exchange rate was recorded for that currency pair.",
        },
      };
    }
    return {
      success: true as const,
      from: normalizedFrom,
      to: normalizedTo,
      amount,
      rate,
      convertedAmount: roundCurrency(amount * rate),
      date: "onboarding-recorded-rate" as const,
      source: "TravelBuddy onboarding rate" as const,
    };
  },
});
