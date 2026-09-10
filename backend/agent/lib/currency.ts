import { defineState } from "eve/context";
import { z } from "zod";
import { resolveTravelBuddyContext } from "../model-selection";

export interface CurrencyRateQuote {
  from: string;
  to: string;
  rate: number;
}

interface CurrencyRateSlot {
  /** Prevents a chat reused for another trip from retaining the old quote. */
  tripId: string | null;
  quote: CurrencyRateQuote | null;
}

const tripCurrencySchema = z.object({
  budgetCurrency: z.string().regex(/^[A-Za-z]{3}$/),
  destinationCurrency: z.string().regex(/^[A-Za-z]{3}$/),
  fixedConversionRate: z.number().finite().positive(),
});

/** Durable session copy of the rate captured by the onboarding flow. */
export const currencyRateState = defineState<CurrencyRateSlot>(
  "travelbuddy.currency-rate",
  () => ({ tripId: null, quote: null }),
);

/**
 * Reads the app-owned onboarding quote attached to a turn. A missing or invalid
 * quote is represented explicitly so switching trips clears stale session data.
 */
export function resolveClientCurrencyRate(
  messages: readonly { role?: unknown; content?: unknown }[],
): CurrencyRateSlot | null {
  const travelBuddy = resolveTravelBuddyContext(messages);
  if (!travelBuddy) return null;

  const itinerarySnapshot = travelBuddy.itinerarySnapshot;
  const tripId =
    typeof itinerarySnapshot === "object" &&
    itinerarySnapshot !== null &&
    !Array.isArray(itinerarySnapshot) &&
    typeof (itinerarySnapshot as { tripId?: unknown }).tripId === "string"
      ? (itinerarySnapshot as { tripId: string }).tripId
      : null;

  const parsed = tripCurrencySchema.safeParse(travelBuddy.trip);
  if (!parsed.success) return { tripId, quote: null };

  return {
    tripId,
    quote: {
      from: parsed.data.budgetCurrency.toUpperCase(),
      to: parsed.data.destinationCurrency.toUpperCase(),
      rate: parsed.data.fixedConversionRate,
    },
  };
}

export function hydrateCurrencyRateState(snapshot: CurrencyRateSlot) {
  const current = currencyRateState.get();
  if (
    current.tripId === snapshot.tripId &&
    current.quote?.from === snapshot.quote?.from &&
    current.quote?.to === snapshot.quote?.to &&
    current.quote?.rate === snapshot.quote?.rate
  ) {
    return;
  }

  currencyRateState.update(() => snapshot);
}

/** Resolves the captured pair in either direction without network access. */
export function rateFromQuote(
  quote: CurrencyRateQuote | null,
  from: string,
  to: string,
): number | null {
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  if (normalizedFrom === normalizedTo) return 1;
  if (!quote) return null;
  if (quote.from === normalizedFrom && quote.to === normalizedTo) {
    return quote.rate;
  }
  if (quote.from === normalizedTo && quote.to === normalizedFrom) {
    return 1 / quote.rate;
  }
  return null;
}
