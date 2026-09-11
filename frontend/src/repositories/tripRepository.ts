import type { TripRecord } from '../store/tripStore';
import {
  MOCK_COLLABORATIVE_TRIP,
  MOCK_COLLABORATIVE_TRIP_ID,
} from '../data/mockCollaborativeTrip';

const TRIP_HISTORY_KEY = 'travelbuddy:trips:v1';

/**
 * Application persistence boundary for trips.
 *
 * The local implementation is deliberately asynchronous even though
 * localStorage is synchronous. A Supabase implementation can replace it
 * without changing callers or the trip domain model.
 */
export interface TripRepository {
  list(): Promise<TripRecord[]>;
  get(tripId: string): Promise<TripRecord | null>;
  upsert(record: TripRecord): Promise<void>;
}

function readLocalRecords(): TripRecord[] {
  try {
    const value = window.localStorage.getItem(TRIP_HISTORY_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as TripRecord[]) : [];
  } catch {
    return [];
  }
}

function hasTripId(record: TripRecord): record is TripRecord & { tripId: string } {
  return typeof record.tripId === 'string' && record.tripId.length > 0;
}

function isUsableTripRecord(record: TripRecord) {
  return hasTripId(record) &&
    typeof record.createdAt === 'string' &&
    typeof record.destination === 'string' &&
    record.destination.trim().length > 0 &&
    typeof record.travelers === 'number' &&
    Number.isFinite(record.travelers) &&
    Array.isArray(record.mustVisitPlaces);
}

function canonicalMockRecord(saved?: TripRecord): TripRecord {
  const collaboration = MOCK_COLLABORATIVE_TRIP.collaboration;
  if (!collaboration) return MOCK_COLLABORATIVE_TRIP;

  const savedBudgets = new Map(
    saved?.collaboration?.members.map((member) => [member.id, member.budgetMyr]),
  );
  const members = collaboration.members.map((member) => {
    const savedBudget = savedBudgets.get(member.id);
    return typeof savedBudget === 'number' && Number.isFinite(savedBudget)
      ? { ...member, budgetMyr: savedBudget }
      : member;
  });
  const budgetMyr = members.reduce(
    (total, member) => total + member.budgetMyr,
    0,
  );

  return {
    ...MOCK_COLLABORATIVE_TRIP,
    budgetMyr,
    collaboration: { ...collaboration, members },
    itinerary: MOCK_COLLABORATIVE_TRIP.itinerary
      ? { ...MOCK_COLLABORATIVE_TRIP.itinerary, budgetMyr }
      : null,
  };
}

function recordsWithMockFallback() {
  const records = readLocalRecords().filter(isUsableTripRecord);
  const savedMock = records.find(
    (record) => record.tripId === MOCK_COLLABORATIVE_TRIP_ID,
  );
  return [
    ...records.filter(
      (record) => record.tripId !== MOCK_COLLABORATIVE_TRIP_ID,
    ),
    canonicalMockRecord(savedMock),
  ];
}

export class LocalTripRepository implements TripRepository {
  async list() {
    return recordsWithMockFallback().sort((left, right) => {
      const leftTime = left.updatedAt ?? left.createdAt;
      const rightTime = right.updatedAt ?? right.createdAt;
      return rightTime.localeCompare(leftTime);
    });
  }

  async get(tripId: string) {
    return recordsWithMockFallback().find(
      (record) => record.tripId === tripId,
    ) ?? null;
  }

  async upsert(record: TripRecord) {
    try {
      const records = readLocalRecords().filter(
        (item) => item.tripId !== record.tripId,
      );
      window.localStorage.setItem(
        TRIP_HISTORY_KEY,
        JSON.stringify([record, ...records]),
      );
    } catch {
      // The active Zustand cache remains usable if persistence is unavailable.
    }
  }
}

export const tripRepository: TripRepository = new LocalTripRepository();

/** Seeds exactly one opt-in collaboration demo without replacing saved trips. */
export async function ensureMockCollaborativeTrip(
  repository: TripRepository = tripRepository,
) {
  const existing = await repository.get(MOCK_COLLABORATIVE_TRIP_ID);
  if (!existing) await repository.upsert(MOCK_COLLABORATIVE_TRIP);
}
