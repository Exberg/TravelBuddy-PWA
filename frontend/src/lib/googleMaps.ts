import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// Singleton loader: Google's script tag must only ever be injected once per
// page. Every caller awaits the same promise instead of re-triggering a load.
let loadPromise: Promise<typeof google.maps> | null = null;
let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;
let routesPromise: Promise<google.maps.RoutesLibrary> | null = null;
let optionsSet = false;

function configureGoogleMaps() {
  if (optionsSet) return;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'VITE_GOOGLE_MAPS_API_KEY is not set. Add it to frontend/.env to render the map.',
    );
  }

  setOptions({ key: apiKey, v: 'weekly' });
  optionsSet = true;
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loadPromise) return loadPromise;

  try {
    configureGoogleMaps();
  } catch (error) {
    return Promise.reject(error);
  }

  // `marker` brings in AdvancedMarkerElement, used by MapPinOverlay.
  loadPromise = Promise.all([importLibrary('maps'), importLibrary('marker')]).then(
    () => google.maps,
  );
  return loadPromise;
}

// Autocomplete does not render a map. Import only the Places library so the
// heavier maps and marker libraries remain deferred until MapScreen is used.
export function loadGooglePlaces(): Promise<google.maps.PlacesLibrary> {
  if (placesPromise) return placesPromise;

  try {
    configureGoogleMaps();
  } catch (error) {
    return Promise.reject(error);
  }

  placesPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  return placesPromise;
}

// Route computation is billable and is only needed by the itinerary map.
// Keeping this separate prevents other map and autocomplete surfaces from
// downloading the Routes library.
export function loadGoogleRoutes(): Promise<google.maps.RoutesLibrary> {
  if (routesPromise) return routesPromise;

  try {
    configureGoogleMaps();
  } catch (error) {
    return Promise.reject(error);
  }

  routesPromise = importLibrary('routes') as Promise<google.maps.RoutesLibrary>;
  return routesPromise;
}
