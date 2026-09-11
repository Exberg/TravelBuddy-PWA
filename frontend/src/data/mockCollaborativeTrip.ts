import type { TripRecord } from '../store/tripStore';

export const MOCK_COLLABORATIVE_TRIP_ID = 'demo-penang-crew';
export const MOCK_COLLABORATIVE_TRIP_IMAGE_URL =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Street%20Scene%20-%20George%20Town%20-%20Penang%20-%20Malaysia%20-%2004%20(35445618596).jpg?width=960';

/**
 * The app's only seeded trip. Collaboration is nullable on TripRecord, so this
 * example cannot change the behavior of trips people create.
 */
export const MOCK_COLLABORATIVE_TRIP: TripRecord = {
  tripId: MOCK_COLLABORATIVE_TRIP_ID,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-10T12:30:00.000Z',
  travelPreferences: 'Local food, heritage walks, relaxed mornings, and one beach sunset.',
  travelPreferenceKeywords: [
    { label: 'local food', sentiment: 'wanted' },
    { label: 'heritage walks', sentiment: 'wanted' },
    { label: 'early mornings', sentiment: 'unwanted' },
  ],
  destination: 'Penang',
  destinationDescription: 'George Town, Penang, Malaysia',
  startDate: '2026-10-16',
  endDate: '2026-10-18',
  durationLabel: 'Weekend',
  budgetMyr: 3200,
  budgetCurrency: 'MYR',
  destinationCurrency: 'MYR',
  fixedConversionRate: 1,
  travelers: 4,
  mustVisitPlaces: [
    {
      id: 'demo-blue-mansion',
      title: 'Cheong Fatt Tze Mansion',
      category: 'sights',
      lat: 5.4213,
      lng: 100.3344,
      voteCount: 3,
    },
    {
      id: 'demo-penang-hill',
      title: 'Penang Hill',
      category: 'sights',
      lat: 5.4085,
      lng: 100.2774,
      voteCount: 2,
    },
  ],
  collaboration: {
    name: 'Penang Crew',
    members: [
      { id: 'you', name: 'Patrick', initials: 'PY', budgetMyr: 900, isCurrentUser: true },
      { id: 'aisha', name: 'Aisha', initials: 'AI', budgetMyr: 750, isCurrentUser: false },
      { id: 'marcus', name: 'Marcus', initials: 'MC', budgetMyr: 850, isCurrentUser: false },
      { id: 'mei', name: 'Mei', initials: 'ML', budgetMyr: 700, isCurrentUser: false },
    ],
  },
  revision: 1,
  lastChangeNote: 'Created a shared weekend itinerary',
  itinerary: {
    title: 'Penang Crew Weekend',
    destination: 'George Town, Penang, Malaysia',
    startDate: '2026-10-16',
    endDate: '2026-10-18',
    travelers: 4,
    summary: 'A relaxed shared weekend of heritage streets, Penang favourites, and a sunset by the sea.',
    estimatedTotalMyr: 2740,
    budgetMyr: 3200,
    assumptions: ['Shared rooms and local ride-hailing', 'Food estimates cover all four travelers'],
    days: [
      {
        day: 1,
        date: '2026-10-16',
        title: 'Heritage core on foot',
        area: 'George Town',
        stops: [
          { id: 'blue-mansion', time: '10:30', segment: 'morning', title: 'Cheong Fatt Tze Mansion', description: 'Start with a guided look inside George Town’s iconic blue mansion.', category: 'sight', durationMinutes: 90, estimatedCostMyr: 100, bookingRequired: true },
          { id: 'tek-sen-lunch', time: '12:30', segment: 'afternoon', title: 'Tek Sen lunch', description: 'Share classic Penang dishes around one table.', category: 'food', durationMinutes: 75, estimatedCostMyr: 180, halalStatus: 'not_halal', travelFromPrevious: { mode: 'walk', durationMinutes: 12 } },
          { id: 'armenian-street', time: '14:30', segment: 'afternoon', title: 'Armenian Street', description: 'Browse murals, shophouses, and small local stores together.', category: 'sight', durationMinutes: 120, estimatedCostMyr: 40, travelFromPrevious: { mode: 'walk', durationMinutes: 9 } },
          { id: 'kimberley-night-food', time: '19:00', segment: 'evening', title: 'Kimberley Street food', description: 'Pick individual favourites from the evening hawker stalls.', category: 'food', durationMinutes: 90, estimatedCostMyr: 160, halalStatus: 'unverified', travelFromPrevious: { mode: 'walk', durationMinutes: 15 } },
        ],
      },
      {
        day: 2,
        date: '2026-10-17',
        title: 'Views and island flavours',
        area: 'Air Itam & Batu Ferringhi',
        stops: [
          { id: 'penang-hill', time: '09:30', segment: 'morning', title: 'Penang Hill', description: 'Ride the funicular for cooler air and panoramic island views.', category: 'nature', durationMinutes: 180, estimatedCostMyr: 160, bookingRequired: true },
          { id: 'air-itam-lunch', time: '13:00', segment: 'afternoon', title: 'Air Itam lunch', description: 'Try laksa and other neighbourhood favourites.', category: 'food', durationMinutes: 75, estimatedCostMyr: 100, halalStatus: 'unverified', travelFromPrevious: { mode: 'drive', durationMinutes: 12 } },
          { id: 'batu-ferringhi', time: '17:00', segment: 'evening', title: 'Batu Ferringhi sunset', description: 'Slow down on the beach before the night market opens.', category: 'nature', durationMinutes: 150, estimatedCostMyr: 120, travelFromPrevious: { mode: 'drive', durationMinutes: 35 } },
        ],
      },
      {
        day: 3,
        date: '2026-10-18',
        title: 'Slow final morning',
        area: 'George Town',
        stops: [
          { id: 'kopitiam-breakfast', time: '09:30', segment: 'morning', title: 'Kopitiam breakfast', description: 'Ease into the last day with coffee, toast, and eggs.', category: 'food', durationMinutes: 75, estimatedCostMyr: 80, halalStatus: 'unverified' },
          { id: 'clan-jetties', time: '11:15', segment: 'morning', title: 'Clan Jetties', description: 'Take one final waterfront walk through the historic settlements.', category: 'sight', durationMinutes: 75, estimatedCostMyr: 20, travelFromPrevious: { mode: 'walk', durationMinutes: 18 } },
          { id: 'departure', time: '14:00', segment: 'afternoon', title: 'Head home', description: 'Collect bags and share a ride to the airport.', category: 'transport', durationMinutes: 45, estimatedCostMyr: 80, travelFromPrevious: { mode: 'drive', durationMinutes: 20 } },
        ],
      },
    ],
  },
};
