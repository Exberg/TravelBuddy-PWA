import { useEffect, useRef, useState } from 'react';
import { loadGooglePlaces } from '../lib/googleMaps';

export interface DestinationSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  /** Country predictions are shown before cities and regions. */
  isCountry: boolean;
  /** Resolves full place details (name + lat/lng) only when the user picks this suggestion. */
  toPlace: () => Promise<{ name: string; location: string; lat: number; lng: number }>;
}

const DEBOUNCE_MS = 250;

/**
 * Debounced Google Places Autocomplete (New) search for destination text
 * input. Calls `google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions`
 * directly (not the `PlaceAutocompleteElement` widget) so the results can be
 * rendered with TravelBuddy's own card styling instead of Google's
 * closed-shadow-DOM component.
 */
export function usePlaceAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      loadGooglePlaces()
        .then(async (library) => {
          if (cancelled) return;
          const placesLibrary = library;

          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
          }

          const { suggestions: results } =
            await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: trimmed,
              // Keep country destinations available alongside cities so a
              // traveler can choose Iceland or Japan directly, then narrow
              // the same search to a city when that is more useful.
              includedPrimaryTypes: [
                'country',
                'locality',
                'administrative_area_level_1',
                'administrative_area_level_3',
              ],
              sessionToken: sessionTokenRef.current,
            });

          if (cancelled) return;

          const mappedSuggestions = results
            .filter((suggestion) => suggestion.placePrediction !== null)
            .map((suggestion) => {
              const prediction = suggestion.placePrediction!;
              const predictionTypes =
                (prediction as unknown as { types?: string[] }).types ?? [];

              return {
                placeId: prediction.placeId,
                mainText: prediction.mainText?.text ?? prediction.text.text,
                secondaryText: prediction.secondaryText?.text ?? '',
                isCountry: predictionTypes.includes('country'),
                toPlace: async () => {
                  const place = prediction.toPlace();
                  await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location'],
                  });
                  // A session concludes once fetchFields is called; start a fresh
                  // token for the next search session.
                  sessionTokenRef.current = null;
                  return {
                    name: place.displayName ?? prediction.mainText?.text ?? trimmed,
                    location: place.formattedAddress ?? prediction.text.text,
                    lat: place.location?.lat() ?? 0,
                    lng: place.location?.lng() ?? 0,
                  };
                },
              };
            })
            .sort((left, right) => Number(right.isCountry) - Number(left.isCountry));

          setSuggestions(mappedSuggestions);
          setIsLoading(false);
        })
        .catch((caught: unknown) => {
          if (cancelled) return;
          setError(caught instanceof Error ? caught : new Error('Failed to fetch destination suggestions'));
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { suggestions, isLoading, error };
}
