import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// Singleton loader: Google's script tag must only ever be injected once per
// page. Every caller awaits the same promise instead of re-triggering a load.
let loadPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    loadPromise = Promise.reject(
      new Error(
        'VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env to render the map.',
      ),
    );
    return loadPromise;
  }

  setOptions({ key: apiKey, v: 'weekly' });
  // `marker` brings in AdvancedMarkerElement, used by MapPinOverlay.
  loadPromise = Promise.all([importLibrary('maps'), importLibrary('marker')]).then(
    () => google.maps,
  );
  return loadPromise;
}
