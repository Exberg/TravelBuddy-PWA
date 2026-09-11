import { defineState } from "eve/context";
import { z } from "zod";
import { resolveTravelBuddyContext } from "../client-context";

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

/**
 * Planning rates the server owns, expressed per 1 MYR.
 *
 * Kept in sync with `frontend/src/lib/currency.ts`, which uses the same table
 * to render the budget screen's approximate destination-currency figure.
 *
 * The rate deliberately lives here rather than in the client context: the
 * client context is serialised into a model-visible prompt message, and a rate
 * the model can read is a rate the model will multiply itself instead of
 * calling `convert_currency`. Keeping it server-side makes the tool the only
 * route to a converted amount.
 */
const FIXED_MYR_RATES: Record<string, number> = {
  AED: 0.98,
  AUD: 0.33,
  BOB: 1.64,
  CNY: 1.68,
  EUR: 0.21,
  GBP: 0.18,
  HUF: 84,
  INR: 19.6,
  IDR: 3_700,
  JPY: 34.2,
  KHR: 950,
  KRW: 317,
  MYR: 1,
  NZD: 0.36,
  PHP: 13.1,
  SGD: 0.3,
  THB: 8.25,
  TWD: 7.45,
  USD: 0.24,
  VND: 6_100,
};

/**
 * The client context only names the currency pair onboarding resolved. The
 * `fixedConversionRate` the app stores for its own display is intentionally
 * not read here, so a client that leaks it cannot influence the agent.
 */
const tripCurrencySchema = z.object({
  budgetCurrency: z.string().regex(/^[A-Za-z]{3}$/),
  destinationCurrency: z.string().regex(/^[A-Za-z]{3}$/),
});

/** Resolves a planning rate for a pair, or null when either side is unknown. */
export function rateForPair(from: string, to: string): number | null {
  const fromRate = FIXED_MYR_RATES[from.toUpperCase()];
  const toRate = FIXED_MYR_RATES[to.toUpperCase()];
  if (fromRate === undefined || toRate === undefined) return null;

  return toRate / fromRate;
}

/** Durable session copy of the rate captured by the onboarding flow. */
export const currencyRateState = defineState<CurrencyRateSlot>(
  "travelbuddy.currency-rate",
  () => ({ tripId: null, quote: null }),
);

/**
 * Resolves the trip's planning quote from the currency pair the app attached to
 * a turn. A missing or unsupported pair is represented explicitly so switching
 * trips clears stale session data.
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

  const from = parsed.data.budgetCurrency.toUpperCase();
  const to = parsed.data.destinationCurrency.toUpperCase();
  const rate = rateForPair(from, to);
  if (rate === null) return { tripId, quote: null };

  return { tripId, quote: { from, to, rate } };
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
