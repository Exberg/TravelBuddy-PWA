import { defineTool } from "eve/tools";
import { z } from "zod";
import { fixedRate } from "../lib/currency";
import { resolveTravelBuddyContext } from "../model-selection";

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
  date: z.literal("fixed-planning-rate"),
  source: z.literal("TravelBuddy fixed planning rate"),
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
    "Convert an amount using TravelBuddy's fixed planning rate. Use this for explicit currency conversions, such as converting a MYR budget to JPY. Do not present the result as a live market rate.",
  inputSchema: z.object({
    from: currencyCodeSchema,
    to: currencyCodeSchema,
    amount: z.number().finite().nonnegative(),
  }),
  outputSchema: resultSchema,
  async execute({ from, to, amount }, ctx) {
    const context = resolveTravelBuddyContext(ctx.messages);
    const trip = context?.trip;
    const configuredFrom = typeof trip === "object" && trip !== null &&
      typeof (trip as { budgetCurrency?: unknown }).budgetCurrency === "string"
      ? (trip as { budgetCurrency: string }).budgetCurrency.toUpperCase()
      : undefined;
    const configuredTo = typeof trip === "object" && trip !== null &&
      typeof (trip as { destinationCurrency?: unknown }).destinationCurrency === "string"
      ? (trip as { destinationCurrency: string }).destinationCurrency.toUpperCase()
      : undefined;
    const configuredRate = typeof trip === "object" && trip !== null &&
      typeof (trip as { fixedConversionRate?: unknown }).fixedConversionRate === "number"
      ? (trip as { fixedConversionRate: number }).fixedConversionRate
      : null;
    const normalizedFrom = from.toUpperCase();
    const normalizedTo = to.toUpperCase();
    const rate = configuredFrom === normalizedFrom && configuredTo === normalizedTo && configuredRate !== null
      ? configuredRate
      : fixedRate(normalizedFrom, normalizedTo);
    if (rate === null) {
      return { success: false as const, from: normalizedFrom, to: normalizedTo, amount,
        error: { code: "unsupported_currency", message: "No fixed planning rate is configured for that currency pair." } };
    }
    return {
      success: true as const,
      from: normalizedFrom,
      to: normalizedTo,
      amount,
      rate,
      convertedAmount: roundCurrency(amount * rate),
      date: "fixed-planning-rate" as const,
      source: "TravelBuddy fixed planning rate" as const,
    };
  },
});
