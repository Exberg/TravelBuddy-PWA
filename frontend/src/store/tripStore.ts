// Single source of truth for the trip the traveler is planning.
//
// Two jobs:
//  1. Capture what the onboarding screens collect (destination, dates, budget,
//     party size, must-visit places) so it survives navigation between screens
//     and a page reload. Previously each screen kept its answers in local
//     useState and threw them away on the way to the next screen.
//  2. Hold the structured itinerary the agent publishes through its
//     `save_itinerary` tool, so the chat screen's timeline renders real agent
//     output instead of mock data.
//
// The trip preferences are also what the agent plans against: `tripContext()`
// projects them into the JSON the chat sends as Eve client context.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Itinerary, MustVisitPlace, PlaceItem } from '../types';
import { tripRepository } from '../repositories/tripRepository';

/** Kept in sync with backend/agent/model-selection.ts. */
export type TravelBuddyModel = 'qwen-3.8-max' | 'gemini-3.8-flash';

export interface TripPreferences {
  destination: string;
  /** Resolved from Places Autocomplete when the traveler picks a suggestion. */
  destinationDescription: string | null;
  /** ISO date, YYYY-MM-DD. */
  startDate: string | null;
  endDate: string | null;
  /** The duration preset the traveler tapped, e.g. '1 Week' or 'Flexible'. */
  durationLabel: string;
  budgetMyr: number;
  travelers: number;
  mustVisitPlaces: MustVisitPlace[];
}

export type JsonSafe =
  | string
  | number
  | boolean
  | null
  | readonly JsonSafe[]
  | { readonly [key: string]: JsonSafe };

/**
 * The trip context sent to the agent as Eve client context.
 *
 * Typed as a JSON record rather than a named interface so it satisfies Eve's
 * index-signature-based client-context type without a cast. Fields produced:
 *
 * - `destination` — always
 * - `startDate`, `endDate`, `nights`, `days` — when a date range is chosen
 * - `durationPreference` — instead of dates, when only a preset was tapped
 * - `budgetMyr`, `budgetCurrency`, `travelers` — always
 * - `mustVisitPlaces` — `{ name, lat, lng }[]`, only when some are selected
 *
 * Unset answers are omitted rather than sent as null, so the agent assumes or
 * asks instead of planning against a placeholder.
 */
export type TripContext = { readonly [key: string]: JsonSafe };

interface ItinerarySlice {
  itinerary: Itinerary | null;
  revision: number;
  updatedAt: string | null;
  lastChangeNote: string | null;
}

interface TripState extends TripPreferences, ItinerarySlice {
  tripId: string;
  createdAt: string;
  storageHydrated: boolean;
  model: TravelBuddyModel;

  setDestination: (destination: string, description?: string | null) => void;
  setDates: (startDate: string | null, endDate: string | null) => void;
  setDurationLabel: (durationLabel: string) => void;
  setBudgetMyr: (budgetMyr: number) => void;
  setTravelers: (travelers: number) => void;
  toggleMustVisitPlace: (place: PlaceItem) => void;
  removeMustVisitPlace: (placeId: string) => void;
  setModel: (model: TravelBuddyModel) => void;
  hydrateFromRepository: () => Promise<void>;
  selectTrip: (tripId: string) => Promise<boolean>;
  startNewTrip: () => void;

  publishItinerary: (
    itinerary: Itinerary,
    meta: { revision: number; updatedAt: string; changeNote: string },
  ) => void;
  clearItinerary: () => void;
}

export interface TripRecord extends TripPreferences, ItinerarySlice {
  tripId: string;
  createdAt: string;
}

function createTripId() {
  return globalThis.crypto?.randomUUID?.() ??
    `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function tripRecordFromState(state: TripState): TripRecord {
  return {
    tripId: state.tripId,
    destination: state.destination,
    destinationDescription: state.destinationDescription,
    startDate: state.startDate,
    endDate: state.endDate,
    durationLabel: state.durationLabel,
    budgetMyr: state.budgetMyr,
    travelers: state.travelers,
    mustVisitPlaces: state.mustVisitPlaces,
    itinerary: state.itinerary,
    revision: state.revision,
    updatedAt: state.updatedAt,
    lastChangeNote: state.lastChangeNote,
    createdAt: state.createdAt,
  };
}

function tripRecordToState(record: TripRecord) {
  return {
    tripId: record.tripId,
    createdAt: record.createdAt,
    destination: record.destination,
    destinationDescription: record.destinationDescription,
    startDate: record.startDate,
    endDate: record.endDate,
    durationLabel: record.durationLabel,
    budgetMyr: record.budgetMyr,
    travelers: record.travelers,
    mustVisitPlaces: record.mustVisitPlaces,
    itinerary: record.itinerary,
    revision: record.revision,
    updatedAt: record.updatedAt,
    lastChangeNote: record.lastChangeNote,
  };
}

export function selectTripRecord(state: TripState): TripRecord {
  return tripRecordFromState(state);
}

/** JSON-safe canonical snapshot Eve uses to recover per-session working state. */
export function toItinerarySnapshot(state: TripState): TripContext {
  return {
    tripId: state.tripId,
    itinerary: state.itinerary as unknown as JsonSafe,
    revision: state.revision,
    updatedAt: state.updatedAt,
  };
}

export function isMeaningfulTrip(state: TripState) {
  return Boolean(
    state.destinationDescription ||
      state.startDate ||
      state.endDate ||
      state.mustVisitPlaces.length > 0 ||
      state.itinerary ||
      state.destination !== DEFAULT_PREFERENCES.destination,
  );
}

const DEFAULT_PREFERENCES: TripPreferences = {
  // A new trip starts blank; destinations must come from the traveler rather
  // than from the previous demo/default destination.
  destination: '',
  destinationDescription: null,
  startDate: null,
  endDate: null,
  durationLabel: '2 Weeks',
  budgetMyr: 4500,
  travelers: 1,
  mustVisitPlaces: [],
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      tripId: createTripId(),
      createdAt: new Date().toISOString(),
      storageHydrated: false,
      itinerary: null,
      revision: 0,
      updatedAt: null,
      lastChangeNote: null,
      model: 'qwen-3.8-max',

      setDestination: (destination, description = null) =>
        set({ destination, destinationDescription: description }),

      setDates: (startDate, endDate) => set({ startDate, endDate }),

      setDurationLabel: (durationLabel) => set({ durationLabel }),

      setBudgetMyr: (budgetMyr) => set({ budgetMyr }),

      setTravelers: (travelers) => set({ travelers }),

      toggleMustVisitPlace: (place) =>
        set((state) => {
          const exists = state.mustVisitPlaces.some(
            (selected) => selected.id === place.id,
          );

          return {
            mustVisitPlaces: exists
              ? state.mustVisitPlaces.filter(
                  (selected) => selected.id !== place.id,
                )
              : [
                  ...state.mustVisitPlaces,
                  {
                    id: place.id,
                    title: place.title,
                    category: place.category,
                    lat: place.lat,
                    lng: place.lng,
                  },
                ],
          };
        }),

      removeMustVisitPlace: (placeId) =>
        set((state) => ({
          mustVisitPlaces: state.mustVisitPlaces.filter(
            (place) => place.id !== placeId,
          ),
        })),

      setModel: (model) => set({ model }),

      hydrateFromRepository: async () => {
        const current = get();
        const saved = await tripRepository.get(current.tripId);
        if (saved) {
          set({
            ...tripRecordToState(saved),
            storageHydrated: true,
          });
          return;
        }

        // On the first v3 launch, preserve an active v2 Zustand snapshot by
        // importing it into the repository before trimming the local cache.
        if (isMeaningfulTrip(current)) {
          await tripRepository.upsert(tripRecordFromState(current));
        }
        set({ storageHydrated: true });
      },

      selectTrip: async (tripId) => {
        const saved = await tripRepository.get(tripId);
        if (!saved) return false;

        set({
          ...tripRecordToState(saved),
          storageHydrated: true,
        });
        return true;
      },

      startNewTrip: () =>
        set((state) => {
          if (isMeaningfulTrip(state)) {
            void tripRepository.upsert(tripRecordFromState(state));
          }
          return {
            ...DEFAULT_PREFERENCES,
            tripId: createTripId(),
            createdAt: new Date().toISOString(),
            storageHydrated: true,
            itinerary: null,
            revision: 0,
            updatedAt: null,
            lastChangeNote: null,
            model: state.model,
          };
        }),

      publishItinerary: (itinerary, meta) =>
        set((state) =>
          meta.revision <= state.revision
            ? state
            : {
                itinerary,
                revision: meta.revision,
                updatedAt: meta.updatedAt,
                lastChangeNote: meta.changeNote,
              },
        ),

      clearItinerary: () =>
        set((state) => ({
          itinerary: null,
          revision: state.revision + 1,
          updatedAt: new Date().toISOString(),
          lastChangeNote: 'Cleared itinerary',
        })),
    }),
    {
      name: 'travelbuddy:trip:v1',
      // Actions are recreated on load; only persist data. `version` lets a
      // future schema change invalidate stale saved trips.
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<TripState>;
        return {
          ...state,
          tripId:
            typeof state.tripId === 'string' && state.tripId.length > 0
              ? state.tripId
              : createTripId(),
          createdAt:
            typeof state.createdAt === 'string'
              ? state.createdAt
              : new Date().toISOString(),
        } as never;
      },
      partialize: (state) => ({
        // The persisted Zustand state is only an active-record pointer and a
        // local preference. Trip content has exactly one durable local owner:
        // TripRepository. A future Supabase repository uses this same seam.
        tripId: state.tripId,
        createdAt: state.createdAt,
        model: state.model,
      }),
    },
  ),
);

useTripStore.subscribe((state) => {
  if (state.storageHydrated && isMeaningfulTrip(state)) {
    void tripRepository.upsert(tripRecordFromState(state));
  }
});

/** Whole nights between two ISO dates, or null when either is missing. */
export function nightsBetween(
  startDate: string | null,
  endDate: string | null,
): number | null {
  if (!startDate || !endDate) return null;

  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  return Math.round((end - start) / 86_400_000);
}

/**
 * Projects the stored preferences into the trip context the agent reads.
 * Omits anything the traveler has not actually chosen so the agent asks or
 * assumes rather than planning against a placeholder.
 */
export function toTripContext(preferences: TripPreferences): TripContext {
  const nights = nightsBetween(preferences.startDate, preferences.endDate);

  return {
    destination: preferences.destinationDescription ?? preferences.destination,
    budgetMyr: preferences.budgetMyr,
    budgetCurrency: 'MYR',
    travelers: preferences.travelers,
    ...(preferences.startDate ? { startDate: preferences.startDate } : {}),
    ...(preferences.endDate ? { endDate: preferences.endDate } : {}),
    // A concrete date range beats the preset label; the preset is only a hint
    // for the agent when the traveler never picked real dates.
    ...(nights !== null
      ? { nights, days: nights + 1 }
      : preferences.durationLabel
        ? { durationPreference: preferences.durationLabel }
        : {}),
    ...(preferences.mustVisitPlaces.length > 0
      ? {
          mustVisitPlaces: preferences.mustVisitPlaces.map((place) => ({
            name: place.title,
            lat: place.lat,
            lng: place.lng,
          })),
        }
      : {}),
  };
}

/** Reads the preference slice out of the full store state. */
export function selectTripPreferences(state: TripState): TripPreferences {
  return {
    destination: state.destination,
    destinationDescription: state.destinationDescription,
    startDate: state.startDate,
    endDate: state.endDate,
    durationLabel: state.durationLabel,
    budgetMyr: state.budgetMyr,
    travelers: state.travelers,
    mustVisitPlaces: state.mustVisitPlaces,
  };
}
