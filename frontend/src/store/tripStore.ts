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
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';
import type { Itinerary, MustVisitPlace, PlaceItem } from '../types';
import { tripRepository } from '../repositories/tripRepository';
import { getDestinationCurrency, getFixedRate } from '../lib/currency';
import type { PreferenceKeyword } from '../lib/preferences';

/**
 * The active-trip pointer is an optimization, not critical data. A full
 * localStorage quota must never make a state update throw and blank the app.
 */
export function createQuotaSafeStateStorage(
  getStorage: () => StateStorage,
): StateStorage {
  return {
    getItem: (name) => {
      try {
        return getStorage().getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        getStorage().setItem(name, value);
      } catch {
        // TripRepository remains the canonical store. The active in-memory
        // trip is usable when this small pointer cannot be persisted.
      }
    },
    removeItem: (name) => {
      try {
        getStorage().removeItem(name);
      } catch {
        // Removing an optional cache is best-effort.
      }
    },
  };
}

const quotaSafeTripStorage = createQuotaSafeStateStorage(
  () => globalThis.localStorage,
);

/** TravelBuddy uses one model across the coordinator and all subagents. */
export type TravelBuddyModel = 'qwen-3.8-max';

export interface TripCollaborator {
  id: string;
  name: string;
  initials: string;
  budgetMyr: number;
  isCurrentUser: boolean;
}

export interface TripCollaboration {
  name: string;
  members: TripCollaborator[];
}

export interface TripPreferences {
  /** Free-form likes and dislikes that should guide every trip. */
  travelPreferences: string;
  /** Structured keywords extracted from the free-form preference text. */
  travelPreferenceKeywords: PreferenceKeyword[];
  destination: string;
  /** Resolved from Places Autocomplete when the traveler picks a suggestion. */
  destinationDescription: string | null;
  /** ISO date, YYYY-MM-DD. */
  startDate: string | null;
  endDate: string | null;
  /** The duration preset the traveler tapped, e.g. '1 Week' or 'Flexible'. */
  durationLabel: string;
  budgetMyr: number;
  budgetCurrency: string;
  destinationCurrency: string | null;
  /**
   * Captured once when onboarding resolves the destination currency. Used for
   * the app's own display only; it is never sent to the agent. See
   * `toTripContext`.
   */
  fixedConversionRate: number | null;
  travelers: number;
  mustVisitPlaces: MustVisitPlace[];
  /** Non-null only for trips that have been shared with a group. */
  collaboration?: TripCollaboration | null;
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
 * - `budgetMyr`, `budgetCurrency`, `destinationCurrency`, `travelers` — always
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
  setTravelPreferences: (travelPreferences: string) => void;
  setTravelPreferenceKeywords: (keywords: PreferenceKeyword[]) => void;
  setDates: (startDate: string | null, endDate: string | null) => void;
  setDurationLabel: (durationLabel: string) => void;
  setBudgetMyr: (budgetMyr: number) => void;
  setCollaboratorBudget: (memberId: string, budgetMyr: number) => void;
  setTravelers: (travelers: number) => void;
  toggleMustVisitPlace: (place: PlaceItem) => void;
  removeMustVisitPlace: (placeId: string) => void;
  setModel: (model: TravelBuddyModel) => void;
  hydrateFromRepository: () => Promise<void>;
  selectTrip: (tripId: string) => Promise<boolean>;
  activateTrip: (record: TripRecord) => void;
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

// Prevent an older asynchronous repository read from replacing a trip the
// traveler selected more recently.
let tripSelectionSequence = 0;

function createTripId() {
  return globalThis.crypto?.randomUUID?.() ??
    `trip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function tripRecordFromState(state: TripState): TripRecord {
  return {
    tripId: state.tripId,
    travelPreferences: state.travelPreferences,
    travelPreferenceKeywords: state.travelPreferenceKeywords,
    destination: state.destination,
    destinationDescription: state.destinationDescription,
    startDate: state.startDate,
    endDate: state.endDate,
    durationLabel: state.durationLabel,
    budgetMyr: state.budgetMyr,
    budgetCurrency: state.budgetCurrency,
    destinationCurrency: state.destinationCurrency,
    fixedConversionRate: state.fixedConversionRate,
    travelers: state.travelers,
    mustVisitPlaces: state.mustVisitPlaces,
    collaboration: state.collaboration,
    itinerary: state.itinerary,
    revision: state.revision,
    updatedAt: state.updatedAt,
    lastChangeNote: state.lastChangeNote,
    createdAt: state.createdAt,
  };
}

function tripRecordToState(
  record: TripRecord,
  travelPreferences: string,
  travelPreferenceKeywords: PreferenceKeyword[],
) {
  const budgetCurrency = record.budgetCurrency ?? 'MYR';
  const destinationCurrency =
    record.destinationCurrency ??
    getDestinationCurrency(record.destinationDescription ?? record.destination);
  const fixedConversionRate =
    typeof record.fixedConversionRate === 'number' &&
    Number.isFinite(record.fixedConversionRate) &&
    record.fixedConversionRate > 0
      ? record.fixedConversionRate
      : destinationCurrency
        ? getFixedRate(budgetCurrency, destinationCurrency)
        : null;

  return {
    tripId: record.tripId,
    createdAt: record.createdAt,
    // Preferences belong to the traveler, not an individual trip. Keep the
    // current global value when moving between saved trips.
    travelPreferences,
    travelPreferenceKeywords: normalizeStoredPreferenceKeywords(
      record.travelPreferenceKeywords,
      travelPreferenceKeywords,
    ),
    destination: record.destination,
    destinationDescription: record.destinationDescription,
    startDate: record.startDate,
    endDate: record.endDate,
    durationLabel: record.durationLabel,
    budgetMyr: record.budgetMyr,
    budgetCurrency,
    destinationCurrency,
    fixedConversionRate,
    travelers: record.travelers,
    mustVisitPlaces: record.mustVisitPlaces,
    collaboration: record.collaboration ?? null,
    itinerary: record.itinerary,
    revision: record.revision,
    updatedAt: record.updatedAt,
    lastChangeNote: record.lastChangeNote,
  };
}

export function selectTripRecord(state: TripState): TripRecord {
  return tripRecordFromState(state);
}

/**
 * JSON-safe canonical snapshot Eve uses to recover per-session working state.
 *
 * The client context is serialised into a model-visible prompt message, so the
 * full plan is worth sending only when the agent's session does not already
 * hold it: on a fresh session, or after the app changed the plan itself. Pass
 * `includeItinerary: false` on later turns to send just the trip identity and
 * revision. The agent reads the plan back through `get_itinerary`.
 */
export function toItinerarySnapshot(
  state: TripState,
  { includeItinerary = true }: { includeItinerary?: boolean } = {},
): TripContext {
  return {
    tripId: state.tripId,
    ...(includeItinerary
      ? { itinerary: state.itinerary as unknown as JsonSafe }
      : {}),
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
  travelPreferences: '',
  travelPreferenceKeywords: [],
  // A new trip starts blank; destinations must come from the traveler rather
  // than from the previous demo/default destination.
  destination: '',
  destinationDescription: null,
  startDate: null,
  endDate: null,
  durationLabel: '1 Week',
  budgetMyr: 4500,
  budgetCurrency: 'MYR',
  destinationCurrency: null,
  fixedConversionRate: null,
  travelers: 1,
  mustVisitPlaces: [],
  collaboration: null,
};

function normalizeStoredPreferenceKeywords(
  value: unknown,
  fallback: PreferenceKeyword[] = [],
) {
  if (!Array.isArray(value)) return fallback;
  return value.flatMap((item): PreferenceKeyword[] => {
    if (typeof item === 'string' && item.trim()) {
      const legacyLabel = item.trim();
      const unwantedPrefix = /^(?:i\s+)?(?:do\s+not|don't|dont|dislike|hate|avoid|no|not)\s+/i;
      const isUnwanted = unwantedPrefix.test(legacyLabel);
      return [{
        label: legacyLabel.replace(unwantedPrefix, '').trim(),
        sentiment: isUnwanted ? 'unwanted' : 'wanted',
      }];
    }
    if (
      typeof item === 'object' &&
      item !== null &&
      'label' in item &&
      typeof item.label === 'string' &&
      'sentiment' in item &&
      (item.sentiment === 'wanted' || item.sentiment === 'unwanted')
    ) {
      return [{ label: item.label, sentiment: item.sentiment }];
    }
    return [];
  });
}

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

      setDestination: (destination, description = null) => {
        const resolvedDestination = description ?? destination;
        set((state) => {
          const destinationCurrency = getDestinationCurrency(resolvedDestination);
          return {
            destination,
            destinationDescription: description,
            destinationCurrency,
            fixedConversionRate: destinationCurrency
              ? getFixedRate(state.budgetCurrency, destinationCurrency)
              : null,
          };
        });
      },

      setTravelPreferences: (travelPreferences) => set({ travelPreferences }),

      setTravelPreferenceKeywords: (travelPreferenceKeywords) =>
        set({ travelPreferenceKeywords }),

      setDates: (startDate, endDate) => set({ startDate, endDate }),

      setDurationLabel: (durationLabel) => set({ durationLabel }),

      setBudgetMyr: (budgetMyr) => set({ budgetMyr }),

      setCollaboratorBudget: (memberId, budgetMyr) =>
        set((state) => {
          if (!state.collaboration) return state;

          const members = state.collaboration.members.map((member) =>
            member.id === memberId ? { ...member, budgetMyr } : member,
          );
          return {
            collaboration: { ...state.collaboration, members },
            // The planning agent continues to receive one budget ceiling. For
            // a group trip it is simply the sum of private contributions.
            budgetMyr: members.reduce(
              (total, member) => total + member.budgetMyr,
              0,
            ),
          };
        }),

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
                    voteCount: 1,
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
        const selectionSequence = ++tripSelectionSequence;
        const current = get();
        const saved = await tripRepository.get(current.tripId);
        if (selectionSequence !== tripSelectionSequence) return;
        if (saved) {
          set({
            ...tripRecordToState(
              saved,
              current.travelPreferences,
              current.travelPreferenceKeywords,
            ),
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
        const selectionSequence = ++tripSelectionSequence;
        const saved = await tripRepository.get(tripId);
        if (selectionSequence !== tripSelectionSequence) return false;
        if (!saved) return false;

        set({
          ...tripRecordToState(
            saved,
            get().travelPreferences,
            get().travelPreferenceKeywords,
          ),
          storageHydrated: true,
        });
        return true;
      },

      // Home already holds the canonical record returned by the repository.
      // Activating that snapshot avoids a second storage read during routing.
      activateTrip: (record) => {
        tripSelectionSequence += 1;
        set({
          ...tripRecordToState(
            record,
            get().travelPreferences,
            get().travelPreferenceKeywords,
          ),
          storageHydrated: true,
        });
      },

      startNewTrip: () => {
        tripSelectionSequence += 1;
        set((state) => {
          if (isMeaningfulTrip(state)) {
            void tripRepository.upsert(tripRecordFromState(state));
          }
          return {
            ...DEFAULT_PREFERENCES,
            travelPreferences: state.travelPreferences,
            travelPreferenceKeywords: state.travelPreferenceKeywords,
            tripId: createTripId(),
            createdAt: new Date().toISOString(),
            storageHydrated: true,
            itinerary: null,
            revision: 0,
            updatedAt: null,
            lastChangeNote: null,
            model: state.model,
          };
        });
      },

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
      storage: createJSONStorage(() => quotaSafeTripStorage),
      // Actions are recreated on load; only persist data. `version` lets a
      // future schema change invalidate stale saved trips.
      version: 5,
      migrate: (persistedState) => {
        const state = persistedState as Partial<TripState>;
        return {
          ...state,
          travelPreferenceKeywords: normalizeStoredPreferenceKeywords(
            state.travelPreferenceKeywords,
          ),
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
        travelPreferences: state.travelPreferences,
        travelPreferenceKeywords: state.travelPreferenceKeywords,
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
  const travelPreferences = preferences.travelPreferences.trim();

  return {
    ...(travelPreferences ? { travelPreferences } : {}),
    ...(preferences.travelPreferenceKeywords.length > 0
      ? {
          travelPreferenceKeywords: preferences.travelPreferenceKeywords.map(
            ({ label, sentiment }) => ({ label, sentiment }),
          ),
        }
      : {}),
    destination: preferences.destinationDescription ?? preferences.destination,
    budgetMyr: preferences.budgetMyr,
    budgetCurrency: preferences.budgetCurrency,
    destinationCurrency: preferences.destinationCurrency,
    // `fixedConversionRate` is deliberately withheld. The agent reads this
    // context as a prompt message, and a visible rate is one it multiplies
    // itself rather than calling `convert_currency`. The backend derives the
    // rate from the pair, so the tool stays the only source of a converted
    // amount. The rate remains in the store for the budget screen's display.
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
    travelPreferences: state.travelPreferences,
    travelPreferenceKeywords: state.travelPreferenceKeywords,
    destination: state.destination,
    destinationDescription: state.destinationDescription,
    startDate: state.startDate,
    endDate: state.endDate,
    durationLabel: state.durationLabel,
    budgetMyr: state.budgetMyr,
    budgetCurrency: state.budgetCurrency,
    destinationCurrency: state.destinationCurrency,
    fixedConversionRate: state.fixedConversionRate,
    travelers: state.travelers,
    mustVisitPlaces: state.mustVisitPlaces,
    collaboration: state.collaboration,
  };
}
