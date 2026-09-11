import { describe, expect, test } from 'bun:test';
import {
  createQuotaSafeStateStorage,
  nightsBetween,
  toItinerarySnapshot,
  toTripContext,
  type TripPreferences,
} from './tripStore';

describe('createQuotaSafeStateStorage', () => {
  test('does not throw when browser storage quota is exceeded', () => {
    const quotaError = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    const storage = createQuotaSafeStateStorage(() => ({
      getItem: () => {
        throw quotaError;
      },
      setItem: () => {
        throw quotaError;
      },
      removeItem: () => {
        throw quotaError;
      },
    }));

    expect(storage.getItem('trip')).toBeNull();
    expect(() => storage.setItem('trip', '{}')).not.toThrow();
    expect(() => storage.removeItem('trip')).not.toThrow();
  });
});

function preferences(overrides: Partial<TripPreferences> = {}): TripPreferences {
  return {
    travelPreferences: '',
    travelPreferenceKeywords: [],
    destination: 'Penang',
    destinationDescription: null,
    startDate: null,
    endDate: null,
    durationLabel: '2 Weeks',
    budgetMyr: 4500,
    budgetCurrency: 'MYR',
    destinationCurrency: null,
    fixedConversionRate: null,
    travelers: 2,
    mustVisitPlaces: [],
    collaboration: null,
    ...overrides,
  };
}

describe('nightsBetween', () => {
  test('counts whole nights', () => {
    expect(nightsBetween('2026-10-14', '2026-10-17')).toBe(3);
  });

  test('handles a same-day trip', () => {
    expect(nightsBetween('2026-10-14', '2026-10-14')).toBe(0);
  });

  test('rejects a reversed or incomplete range', () => {
    expect(nightsBetween('2026-10-17', '2026-10-14')).toBeNull();
    expect(nightsBetween('2026-10-14', null)).toBeNull();
    expect(nightsBetween(null, null)).toBeNull();
  });

  test('is unaffected by a DST-style month boundary', () => {
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3);
  });
});

describe('toTripContext', () => {
  test('derives nights and days from the selected dates', () => {
    const context = toTripContext(
      preferences({ startDate: '2026-10-14', endDate: '2026-10-16' }),
    );

    expect(context).toMatchObject({
      startDate: '2026-10-14',
      endDate: '2026-10-16',
      nights: 2,
      days: 3,
      budgetMyr: 4500,
      budgetCurrency: 'MYR',
      travelers: 2,
    });
    expect(context.durationPreference).toBeUndefined();
  });

  test('passes the selected currency pair to the agent', () => {
    const context = toTripContext(
      preferences({
        destinationDescription: 'Tokyo, Japan',
        destinationCurrency: 'JPY',
        fixedConversionRate: 34.2,
      }),
    );

    expect(context).toMatchObject({
      budgetCurrency: 'MYR',
      destinationCurrency: 'JPY',
    });
  });

  test('withholds the conversion rate so the agent must use its tool', () => {
    const context = toTripContext(
      preferences({
        destinationDescription: 'Tokyo, Japan',
        destinationCurrency: 'JPY',
        fixedConversionRate: 34.2,
      }),
    );

    expect(context.fixedConversionRate).toBeUndefined();
    expect(JSON.stringify(context)).not.toContain('34.2');
  });

  test('falls back to the duration preset when dates are not set', () => {
    const context = toTripContext(preferences({ durationLabel: 'Weekend' }));

    expect(context.durationPreference).toBe('Weekend');
    expect(context.nights).toBeUndefined();
    expect(context.days).toBeUndefined();
  });

  test('prefers the resolved destination description over the short name', () => {
    expect(
      toTripContext(
        preferences({ destinationDescription: 'George Town, Penang, Malaysia' }),
      ).destination,
    ).toBe('George Town, Penang, Malaysia');
  });

  test('omits must-visit places entirely when none are selected', () => {
    expect(toTripContext(preferences()).mustVisitPlaces).toBeUndefined();
  });

  test('sends must-visit places as names with coordinates', () => {
    const context = toTripContext(
      preferences({
        mustVisitPlaces: [
          {
            id: 'ChIJabc',
            title: 'Cheong Fatt Tze Mansion',
            category: 'sights',
            lat: 5.4212,
            lng: 100.3345,
          },
        ],
      }),
    );

    expect(context.mustVisitPlaces).toEqual([
      { name: 'Cheong Fatt Tze Mansion', lat: 5.4212, lng: 100.3345 },
    ]);
  });

  test('sends non-empty likes and dislikes to the agent', () => {
    const context = toTripContext(
      preferences({
        travelPreferences: '  I like local food. I dislike early mornings.  ',
      }),
    );

    expect(context.travelPreferences).toBe(
      'I like local food. I dislike early mornings.',
    );
  });

  test('omits blank travel preferences', () => {
    expect(
      toTripContext(preferences({ travelPreferences: '   ' }))
        .travelPreferences,
    ).toBeUndefined();
  });

  test('includes structured preference keywords when present', () => {
    expect(
      toTripContext(
        preferences({
          travelPreferenceKeywords: [
            { label: 'local food', sentiment: 'wanted' },
            { label: 'early mornings', sentiment: 'unwanted' },
          ],
        }),
      ).travelPreferenceKeywords,
    ).toEqual([
      { label: 'local food', sentiment: 'wanted' },
      { label: 'early mornings', sentiment: 'unwanted' },
    ]);
  });

  test('omits empty structured preference keywords', () => {
    expect(toTripContext(preferences()).travelPreferenceKeywords).toBeUndefined();
  });
});
describe('toItinerarySnapshot', () => {
  const state = {
    tripId: 'trip-1',
    revision: 4,
    updatedAt: '2026-09-09T12:00:00.000Z',
    itinerary: { title: 'Penang Weekend', days: [] },
  } as unknown as Parameters<typeof toItinerarySnapshot>[0];

  test('carries the full plan when the session needs it', () => {
    expect(toItinerarySnapshot(state)).toMatchObject({
      tripId: 'trip-1',
      revision: 4,
      itinerary: { title: 'Penang Weekend' },
    });
  });

  test('omits the plan the agent session already holds', () => {
    const snapshot = toItinerarySnapshot(state, { includeItinerary: false });

    expect(snapshot.itinerary).toBeUndefined();
    expect(snapshot).toMatchObject({ tripId: 'trip-1', revision: 4 });
  });
});
