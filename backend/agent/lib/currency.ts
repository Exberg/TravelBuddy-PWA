/** Stable planning rates. These are intentionally not live market rates. */
export const FIXED_MYR_RATES: Record<string, number> = {
  AED: 0.98, AUD: 0.33, BOB: 1.64, CNY: 1.68, EUR: 0.21, GBP: 0.18,
  INR: 19.6, IDR: 3700, JPY: 34.2, KHR: 950, KRW: 317, MYR: 1,
  NZD: 0.36, PHP: 13.1, SGD: 0.30, THB: 8.25, TWD: 7.45, USD: 0.24,
  VND: 6100,
};

export function fixedRate(from: string, to: string): number | null {
  const fromRate = FIXED_MYR_RATES[from.toUpperCase()];
  const toRate = FIXED_MYR_RATES[to.toUpperCase()];
  return fromRate && toRate ? toRate / fromRate : null;
}
