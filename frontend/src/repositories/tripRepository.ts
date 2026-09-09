import type { TripRecord } from '../store/tripStore';

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

export class LocalTripRepository implements TripRepository {
  async list() {
    return readLocalRecords().sort((left, right) => {
      const leftTime = left.updatedAt ?? left.createdAt;
      const rightTime = right.updatedAt ?? right.createdAt;
      return rightTime.localeCompare(leftTime);
    });
  }

  async get(tripId: string) {
    return readLocalRecords().find((record) => record.tripId === tripId) ?? null;
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
