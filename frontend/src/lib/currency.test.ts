import { describe, expect, test } from 'bun:test';
import { getDestinationCurrency, getFixedRate } from './currency';

describe('currency planning helpers', () => {
  test('derives the destination currency locally', () => {
    expect(getDestinationCurrency('Tokyo, Japan')).toBe('JPY');
    expect(getDestinationCurrency('George Town, Penang, Malaysia')).toBe('MYR');
  });

  test('returns a deterministic cross-currency rate', () => {
    expect(getFixedRate('MYR', 'EUR')).toBe(0.21);
    expect(getFixedRate('EUR', 'MYR')).toBeCloseTo(1 / 0.21);
  });
});
