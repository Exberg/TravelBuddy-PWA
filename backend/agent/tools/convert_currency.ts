import { defineTool } from "eve/tools";
import { z } from "zod";

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
  date: z.string(),
  source: z.literal("Frankfurter"),
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
    "Convert an amount between currencies using the latest working-day rate from Frankfurter. Use this for explicit currency conversions, such as converting a MYR budget to JPY; do not guess exchange rates. Returns the rate, converted amount, and rate date in a structured result.",
  inputSchema: z.object({
    from: currencyCodeSchema,
    to: currencyCodeSchema,
    amount: z.number().finite().nonnegative(),
  }),
  outputSchema: resultSchema,
  async execute({ from, to, amount }, ctx) {
    const url = new URL(
      `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
    );

    try {
      const response = await fetch(url, { signal: ctx.abortSignal });
      if (!response.ok) {
        return {
          success: false as const,
          from,
          to,
          amount,
          error: {
            code: "frankfurter_http_error",
            message: `Frankfurter returned HTTP ${response.status}.`,
          },
        };
      }

      const data: unknown = await response.json();
      if (!isFrankfurterResponse(data)) {
        return {
          success: false as const,
          from,
          to,
          amount,
          error: {
            code: "invalid_frankfurter_response",
            message: "Frankfurter did not return a numeric rate for that currency pair.",
          },
        };
      }

      return {
        success: true as const,
        from,
        to,
        amount,
        rate: data.rate,
        convertedAmount: roundCurrency(amount * data.rate),
        date: data.date,
        source: "Frankfurter" as const,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      return {
        success: false as const,
        from,
        to,
        amount,
        error: {
          code: "frankfurter_request_failed",
          message: "Unable to reach Frankfurter right now.",
        },
      };
    }
  },
});

function isFrankfurterResponse(
  value: unknown,
): value is { date: string; base: string; quote: string; rate: number } {
  if (typeof value !== "object" || value === null) return false;

  const response = value as {
    date?: unknown;
    base?: unknown;
    quote?: unknown;
    rate?: unknown;
  };
  return (
    typeof response.date === "string" &&
    typeof response.base === "string" &&
    typeof response.quote === "string" &&
    typeof response.rate === "number" &&
    Number.isFinite(response.rate) &&
    response.rate >= 0
  );
}
