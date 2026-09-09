import { useEffect, useState } from 'react';
import { fetchPlaceDetails } from '../lib/places';
import type { PlaceDetails } from '../types';

export interface UsePlaceDetailsResult {
  details: PlaceDetails | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches full place details (photos, reviews, summary) for a single place.
 * Pass `null` to keep the hook idle (e.g. when no place detail is open).
 * Results are cached per place id for the lifetime of the component so
 * reopening a place doesn't refetch.
 */
export function usePlaceDetails(placeId: string | null): UsePlaceDetailsResult {
  const [cache, setCache] = useState<Record<string, PlaceDetails>>({});
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!placeId) {
      setDetails(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = cache[placeId];
    if (cached) {
      setDetails(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setDetails(null);
    setIsLoading(true);
    setError(null);

    fetchPlaceDetails(placeId)
      .then((result) => {
        if (cancelled) return;
        setCache((prev) => ({ ...prev, [placeId]: result }));
        setDetails(result);
        setIsLoading(false);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught : new Error('Failed to load details'));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `cache` is intentionally omitted: we read it for a fast path but don't
    // want cache writes to retrigger the fetch effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  return { details, isLoading, error };
}
