import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps, loadGoogleRoutes } from '../lib/googleMaps';
import { MapPinOverlay } from './MapPinOverlay';
import type { ItineraryDay } from '../types';
import { stopIcon } from '../lib/itinerary';

interface ItineraryMapProps {
  day: ItineraryDay;
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
}

const MAP_PADDING: google.maps.Padding = {
  top: 96,
  right: 48,
  bottom: 280,
  left: 48,
};

// Route results are reused when the traveler switches between chat and map or
// revisits a day. This avoids repeating a billable request within the session.
const routeCache = new Map<string, Promise<google.maps.routes.Route | null>>();

function routeCacheKey(stops: ReadonlyArray<{ lat?: number; lng?: number }>) {
  return stops.map((stop) => `${stop.lat},${stop.lng}`).join('|');
}

function computeDayRoute(
  Route: typeof google.maps.routes.Route,
  stops: ReadonlyArray<{ lat?: number; lng?: number }>,
) {
  if (stops.length < 2) return Promise.resolve(null);

  const key = routeCacheKey(stops);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const locations = stops.map((stop) => ({ lat: stop.lat!, lng: stop.lng! }));
  const request = Route.computeRoutes({
    origin: locations[0],
    destination: locations.at(-1)!,
    intermediates: locations.slice(1, -1).map((location) => ({
      location,
      via: false,
    })),
    fields: ['path', 'viewport'],
    polylineQuality: 'OVERVIEW',
    routingPreference: 'TRAFFIC_UNAWARE',
    travelMode: 'DRIVING',
  }).then(({ routes }) => routes?.[0] ?? null);

  routeCache.set(key, request);
  return request;
}

export function ItineraryMap({
  day,
  selectedStopId,
  onSelectStop,
}: ItineraryMapProps) {
  const stops = useMemo(
    () =>
      day.stops.filter(
        (stop) => typeof stop.lat === 'number' && typeof stop.lng === 'number',
      ),
    [day.stops],
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const overlaysRef = useRef<Map<string, MapPinOverlay>>(new Map());
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (stops.length === 0 || !mapContainerRef.current) return;
    let cancelled = false;
    const container = mapContainerRef.current;

    void loadGoogleMaps()
      .then((maps) => {
        if (cancelled || mapRef.current) return;
        mapRef.current = new maps.Map(container, {
          center: { lat: stops[0].lat!, lng: stops[0].lng! },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          renderingType: maps.RenderingType.RASTER,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID',
        });
        setMapsReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Map failed to load');
        }
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
      }
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current.clear();
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
      polylinesRef.current = [];
      setMapsReady(false);
      container.replaceChildren();
    };
  }, [stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map || stops.length === 0) return;

    const overlays = overlaysRef.current;
    const visibleIds = new Set(stops.map((stop) => stop.id));
    overlays.forEach((overlay, id) => {
      if (!visibleIds.has(id)) {
        overlay.setMap(null);
        overlays.delete(id);
      }
    });
    stops.forEach((stop, index) => {
      const options = {
        pinIcon: stopIcon(stop),
        pinLabel: `${index + 1} · ${stop.title}`,
        isSelected: stop.id === selectedStopId,
        zIndex:
          stop.id === selectedStopId ? 1_000 : 20 + stops.length - index,
        onClick: () => onSelectStop(stop.id),
      };
      const existing = overlays.get(stop.id);
      if (existing) {
        existing.update(options);
      } else {
        const overlay = new MapPinOverlay({
          position: { lat: stop.lat!, lng: stop.lng! },
          ...options,
        });
        overlay.setMap(map);
        overlays.set(stop.id, overlay);
      }
    });

  }, [mapsReady, onSelectStop, selectedStopId, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map || stops.length === 0) return;

    const selectedStop = stops.find((stop) => stop.id === selectedStopId);
    if (selectedStop) {
      map.panTo({ lat: selectedStop.lat!, lng: selectedStop.lng! });
    }
  }, [mapsReady, selectedStopId, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map || stops.length === 0) return;
    let cancelled = false;

    const stopBounds = new google.maps.LatLngBounds();
    stops.forEach((stop) =>
      stopBounds.extend({ lat: stop.lat!, lng: stop.lng! }),
    );

    if (stops.length === 1) {
      map.fitBounds(stopBounds, MAP_PADDING);
      map.setZoom(15);
      return;
    }

    setMapError(null);
    void loadGoogleRoutes()
      .then(({ Route }) => computeDayRoute(Route, stops))
      .then((route) => {
        if (cancelled) return;
        if (!route) {
          setMapError('Google Maps could not find a route for these stops.');
          map.fitBounds(stopBounds, MAP_PADDING);
          return;
        }
        polylinesRef.current.forEach((polyline) => polyline.setMap(null));
        polylinesRef.current = route.createPolylines({
          polylineOptions: {
            strokeColor: '#163300',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          },
        });
        polylinesRef.current.forEach((polyline) => polyline.setMap(map));
        map.fitBounds(route.viewport ?? stopBounds, MAP_PADDING);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('[TravelBuddy] Google route request failed', error);
          setMapError(
            'The route could not be loaded. Your stop markers are still available.',
          );
          map.fitBounds(stopBounds, MAP_PADDING);
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
      polylinesRef.current = [];
    };
  }, [mapsReady, stops]);

  if (stops.length === 0) {
    return (
      <div className="flex h-28 items-center gap-3 rounded-2xl border border-dashed border-[#c1cab5] bg-[#f5f4ee] px-4">
        <span className="material-symbols-outlined text-[22px] text-[#41493A]">map</span>
        <p className="font-body text-xs leading-relaxed text-[#41493A]">
          Route preview will appear when this day has mapped locations.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#e4eef0]">
      <div ref={mapContainerRef} className="h-full w-full" />
      {mapError ? (
        <div className="absolute inset-x-4 top-16 rounded-2xl border border-[#E5E5E5] bg-white/95 px-4 py-3 text-center shadow-md backdrop-blur">
          <p className="font-body text-xs text-[#41493A]">{mapError}</p>
        </div>
      ) : null}
    </div>
  );
}
