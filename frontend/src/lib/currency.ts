export const FIXED_MYR_RATES: Record<string, number> = {
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
  SGD: 0.30,
  THB: 8.25,
  TWD: 7.45,
  USD: 0.24,
  VND: 6_100,
};

const COUNTRY_CURRENCIES: Record<string, string> = {
  australia: 'AUD', bolivia: 'BOB', cambodia: 'KHR', china: 'CNY',
  france: 'EUR', germany: 'EUR', hungary: 'HUF', india: 'INR', indonesia: 'IDR',
  italy: 'EUR', japan: 'JPY', malaysia: 'MYR', 'new zealand': 'NZD',
  philippines: 'PHP', singapore: 'SGD', 'south korea': 'KRW', spain: 'EUR',
  taiwan: 'TWD', thailand: 'THB', vietnam: 'VND',
  'united arab emirates': 'AED', 'united kingdom': 'GBP',
  'united states': 'USD',
};

function normalizeCountry(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getDestinationCurrency(destination: string): string | null {
  const parts = destination.split(',').map((part) => part.trim()).filter(Boolean);
  for (const part of [...parts].reverse()) {
    const normalized = normalizeCountry(part);
    const country = Object.keys(COUNTRY_CURRENCIES).find((name) =>
      normalized === name || normalized.endsWith(` ${name}`) || normalized.startsWith(`${name} `),
    );
    if (country) return COUNTRY_CURRENCIES[country];
  }
  return null;
}

export function getFixedRate(from: string, to: string): number | null {
  const fromRate = FIXED_MYR_RATES[from.toUpperCase()];
  const toRate = FIXED_MYR_RATES[to.toUpperCase()];
  return fromRate && toRate ? toRate / fromRate : null;
}
