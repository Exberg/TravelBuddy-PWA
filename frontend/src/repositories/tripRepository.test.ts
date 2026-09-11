import { beforeEach, describe, expect, test } from 'bun:test';
import { LocalTripRepository } from './tripRepository';
import type { TripRecord } from '../store/tripStore';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const trip = (overrides: Partial<TripRecord> = {}): TripRecord => ({
  tripId: 'trip-1',
  createdAt: '2026-09-09T10:00:00.000Z',
  travelPreferences: '',
  travelPreferenceKeywords: [],
  destination: 'Penang',
  destinationDescription: 'George Town, Penang, Malaysia',
  startDate: null,
  endDate: null,
  durationLabel: 'Weekend',
  budgetMyr: 1500,
  travelers: 2,
  mustVisitPlaces: [],
  itinerary: null,
  revision: 0,
  updatedAt: null,
  lastChangeNote: null,
  ...overrides,
});

beforeEach(() => {
  Object.assign(globalThis, {
    window: { localStorage: new MemoryStorage() },
  });
});

describe('LocalTripRepository', () => {
  test('upserts one canonical record per trip id', async () => {
    const repository = new LocalTripRepository();
    await repository.upsert(trip());
    await repository.upsert(trip({ revision: 2, lastChangeNote: 'Replanned' }));

    expect(await repository.list()).toHaveLength(1);
    expect((await repository.get('trip-1'))?.revision).toBe(2);
  });

  test('returns null for an unknown active trip pointer', async () => {
    const repository = new LocalTripRepository();
    expect(await repository.get('missing')).toBeNull();
  });

  test('does not expose legacy records without a trip id as clickable trips', async () => {
    const repository = new LocalTripRepository();
    const storage = (globalThis.window as { localStorage: MemoryStorage }).localStorage;
    storage.setItem(
      'travelbuddy:trips:v1',
      JSON.stringify([{ ...trip(), tripId: undefined }, trip()]),
    );

    expect(await repository.list()).toHaveLength(1);
    expect((await repository.list())[0]?.tripId).toBe('trip-1');
  });
});
