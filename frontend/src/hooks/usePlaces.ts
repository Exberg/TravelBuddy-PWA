import { useEffect, useState } from 'react';
import { fetchPlaces } from '../lib/places';
import type { PlaceCategory, PlaceItem } from '../types';

const CATEGORIES: readonly PlaceCategory[] = ['sights', 'cafes', 'stays'];

export interface UsePlacesResult {
  places: PlaceItem[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Merges sights/cafes/stays results for a destination into one deduped,
 * stably-ordered place list (sights, then cafes, then stays; each category
 * in the order returned by the API).
 */
export function mergePlaceResults(results: PlaceItem[][]): PlaceItem[] {
  const seen = new Set<string>();
  const merged: PlaceItem[] = [];

  for (const categoryResults of results) {
    for (const place of categoryResults) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      merged.push(place);
    }
  }

  return merged;
}

export function usePlaces(destination: string): UsePlacesResult {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!destination) {
      setPlaces([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all(CATEGORIES.map((category) => fetchPlaces(destination, category)))
      .then((results) => {
        if (cancelled) return;
        setPlaces(mergePlaceResults(results));
        setIsLoading(false);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught : new Error('Failed to load places'));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  return { places, isLoading, error };
}
