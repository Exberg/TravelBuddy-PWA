import { useEffect, useState } from 'react';
import { fetchPlaces } from '../lib/places';
import type { PlaceCategory, PlaceItem } from '../types';

const CATEGORIES: readonly PlaceCategory[] = ['sights', 'cafes'];
type PlaceFilter = 'all' | PlaceCategory;

// Keep successful searches for the lifetime of the app. Revisiting the map or
// toggling a category then reuses the same request instead of billing Google
// Places again. Failed requests are evicted so a retry can recover.
const searchCache = new Map<string, Promise<PlaceItem[]>>();

function fetchPlacesCached(destination: string, category: PlaceCategory) {
  const key = `${destination.trim().toLocaleLowerCase()}::${category}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const request = fetchPlaces(destination, category).catch((error) => {
    searchCache.delete(key);
    throw error;
  });
  searchCache.set(key, request);
  return request;
}

export interface UsePlacesResult {
  places: PlaceItem[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Merges category results for a destination into one deduped, stably-ordered
 * place list, preserving the order of the category arrays and API results.
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

export function usePlaces(destination: string, filter: PlaceFilter): UsePlacesResult {
  const [result, setResult] = useState<{
    destination: string;
    byCategory: Partial<Record<PlaceCategory, PlaceItem[]>>;
  }>({ destination, byCategory: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setError(null);

    if (!destination) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    // Load one category by default. The other paid Text Search calls happen
    // only if the traveler asks for that filter (or explicitly chooses All).
    const requestedCategories = filter === 'all' ? CATEGORIES : [filter];
    const existing = result.destination === destination ? result.byCategory : {};
    const missingCategories = requestedCategories.filter(
      (category) => existing[category] === undefined,
    );

    if (missingCategories.length === 0) {
      setIsLoading(false);
      return;
    }

    Promise.all(
      missingCategories.map(async (category) => ({
        category,
        places: await fetchPlacesCached(destination, category),
      })),
    )
      .then((results) => {
        if (cancelled) return;
        setResult((current) => {
          const byCategory = current.destination === destination
            ? { ...current.byCategory }
            : {};
          for (const entry of results) byCategory[entry.category] = entry.places;
          return { destination, byCategory };
        });
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
  }, [destination, filter]);

  const byCategory = result.destination === destination ? result.byCategory : {};
  const visibleCategories = filter === 'all' ? CATEGORIES : [filter];
  const places = mergePlaceResults(
    visibleCategories.map((category) => byCategory[category] ?? []),
  );

  return { places, isLoading, error };
}
