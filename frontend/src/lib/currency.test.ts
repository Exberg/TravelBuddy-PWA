import { describe, expect, test } from 'bun:test';
import { getDestinationCurrency, getFixedRate } from './currency';

describe('currency planning helpers', () => {
  test('derives the destination currency locally', () => {
    expect(getDestinationCurrency('Tokyo, Japan')).toBe('JPY');
    expect(getDestinationCurrency('George Town, Penang, Malaysia')).toBe('MYR');
    expect(getDestinationCurrency('Budapest, Hungary')).toBe('HUF');
  });

  test('returns a deterministic cross-currency rate', () => {
    expect(getFixedRate('MYR', 'EUR')).toBe(0.21);
    expect(getFixedRate('EUR', 'MYR')).toBeCloseTo(1 / 0.21);
    expect(getFixedRate('MYR', 'HUF')).toBe(84);
  });
});
