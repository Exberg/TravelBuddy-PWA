import { beforeEach, describe, expect, test } from 'bun:test';
import {
  ensureMockCollaborativeTrip,
  LocalTripRepository,
} from './tripRepository';
import type { TripRecord } from '../store/tripStore';
import {
  MOCK_COLLABORATIVE_TRIP,
  MOCK_COLLABORATIVE_TRIP_ID,
} from '../data/mockCollaborativeTrip';

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
  collaboration: null,
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

    expect(
      (await repository.list()).filter((record) => record.tripId === 'trip-1'),
    ).toHaveLength(1);
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

    const ids = (await repository.list()).map((record) => record.tripId);
    expect(ids).toContain('trip-1');
    expect(ids).toContain(MOCK_COLLABORATIVE_TRIP_ID);
    expect(ids).not.toContain(undefined);
  });

  test('hides incomplete history records that cannot be restored', async () => {
    const repository = new LocalTripRepository();
    const storage = (globalThis.window as { localStorage: MemoryStorage }).localStorage;
    storage.setItem(
      'travelbuddy:trips:v1',
      JSON.stringify([trip({ tripId: 'broken', destination: '' }), trip()]),
    );

    const ids = (await repository.list()).map((record) => record.tripId);
    expect(ids).not.toContain('broken');
    expect(ids).toContain('trip-1');
  });

  test('exposes the demo even when local storage has no copy', async () => {
    const repository = new LocalTripRepository();

    expect(await repository.get(MOCK_COLLABORATIVE_TRIP_ID)).toEqual(
      MOCK_COLLABORATIVE_TRIP,
    );
  });

  test('seeds one collaborative trip without replacing existing trips', async () => {
    const repository = new LocalTripRepository();
    await repository.upsert(trip());

    await ensureMockCollaborativeTrip(repository);

    expect(await repository.get('trip-1')).not.toBeNull();
    expect(await repository.get(MOCK_COLLABORATIVE_TRIP_ID)).toEqual(
      MOCK_COLLABORATIVE_TRIP,
    );
    expect(await repository.list()).toHaveLength(2);
  });

  test('keeps personal budgets while restoring the demo identity', async () => {
    const repository = new LocalTripRepository();
    const collaboration = MOCK_COLLABORATIVE_TRIP.collaboration!;
    await repository.upsert({
      ...MOCK_COLLABORATIVE_TRIP,
      destination: 'Austria',
      destinationDescription: 'Austria',
      collaboration: {
        ...collaboration,
        members: collaboration.members.map((member) =>
          member.id === 'you' ? { ...member, budgetMyr: 1000 } : member,
        ),
      },
    });

    await ensureMockCollaborativeTrip(repository);

    const restored = await repository.get(MOCK_COLLABORATIVE_TRIP_ID);
    expect(restored?.destination).toBe('Penang');
    expect(restored?.destinationDescription).toContain('Penang');
    expect(restored?.budgetMyr).toBe(3300);
    expect(
      restored?.collaboration?.members.find((member) => member.id === 'you')
        ?.budgetMyr,
    ).toBe(1000);
  });

  test('keeps the collective budget equal to individual contributions', () => {
    const contributionTotal = MOCK_COLLABORATIVE_TRIP.collaboration?.members.reduce(
      (total, member) => total + member.budgetMyr,
      0,
    );

    expect(MOCK_COLLABORATIVE_TRIP.itinerary?.days.length).toBeGreaterThan(0);
    expect(contributionTotal).toBe(MOCK_COLLABORATIVE_TRIP.budgetMyr);
  });
});
