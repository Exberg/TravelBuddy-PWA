import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ScreenHeader } from './ScreenHeader';
import { BottomSheet, type BottomSheetSnap } from './BottomSheet';
import { ScreenId, PlaceItem, type PlaceCategory } from '../types';
import { usePlaces } from '../hooks/usePlaces';
import { loadGoogleMaps } from '../lib/googleMaps';
import { MapPinOverlay } from './MapPinOverlay';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import { useTripStore } from '../store/tripStore';

interface MapScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; // Neutral world view until places load

// Keep pins clear of the header (top) and the docked bottom sheet.
const MAP_PADDING: google.maps.Padding = { top: 96, right: 48, bottom: 220, left: 48 };

export const MapScreen: React.FC<MapScreenProps> = ({ onNavigate }) => {
  const destination = useTripStore((state) => state.destination);
  const mustVisitPlaces = useTripStore((state) => state.mustVisitPlaces);
  const toggleMustVisitPlace = useTripStore((state) => state.toggleMustVisitPlace);

  // The store keeps the full place (name and coordinates) because the agent
  // needs those to plan around a must-visit, not just an opaque place id.
  const selectedPlaceIds = useMemo(
    () => new Set(mustVisitPlaces.map((place) => place.id)),
    [mustVisitPlaces],
  );

  // Start with one useful category instead of issuing both paid Places
  // searches before the traveler has expressed interest in cafes or All.
  const [activeFilter, setActiveFilter] = useState<'all' | PlaceCategory>('sights');
  const [sheetSnap, setSheetSnap] = useState<BottomSheetSnap>('half');
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const { places, isLoading, error } = usePlaces(destination, activeFilter);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, MapPinOverlay>>(new Map());
  const [mapsReady, setMapsReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const selectedPlaceIdsRef = useRef(selectedPlaceIds);
  selectedPlaceIdsRef.current = selectedPlaceIds;
  // Opening a place detail swaps the sheet body to the detail view and
  // expands the sheet so it's readable. Kept in a ref so the marker overlay
  // callbacks always invoke the latest handler.
  const openDetail = (id: string) => {
    setActivePlaceId(id);
    setSheetSnap('full');
  };
  const openDetailRef = useRef(openDetail);
  openDetailRef.current = openDetail;

  // Surface data/loading failures as toasts instead of covering the map with
  // an inline error panel.
  useEffect(() => {
    if (error) {
      toast.error('Could not load places', {
        description: `We couldn't find spots for ${destination}. Pull to refresh or try again.`,
      });
    }
  }, [error, destination]);

  useEffect(() => {
    if (mapError) {
      toast.error('Map failed to load', { description: mapError });
    }
  }, [mapError]);

  // Avoid a billable dynamic-map load when place discovery fails or the user
  // leaves this screen before results arrive.
  useEffect(() => {
    if (places.length > 0) setShouldLoadMap(true);
  }, [places.length]);

  // Initialize the map once, after the Maps JS API has actually loaded.
  useEffect(() => {
    if (!shouldLoadMap) return;
    let cancelled = false;
    const container = mapContainerRef.current;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !container || mapRef.current) return;
        mapRef.current = new maps.Map(container, {
          center: DEFAULT_CENTER,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          // Raster rendering does not create a WebGL context, avoiding GPU /
          // hardware-acceleration warnings on lower-powered mobile devices.
          renderingType: maps.RenderingType.RASTER,
          // AdvancedMarkerElement requires a Map ID. "DEMO_MAP_ID" is
          // Google's shared development ID; use a raster-configured Map ID
          // from the same Cloud project in production.
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID',
        });
        setMapsReady(true);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setMapError(caught instanceof Error ? caught.message : 'Failed to load Google Maps');
      });

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (map) {
        google.maps.event.clearInstanceListeners(map);
        mapRef.current = null;
        container?.replaceChildren();
      }
    };
  }, [shouldLoadMap]);

  const filteredPlaces = useMemo(
    () =>
      places.filter((place) => {
        if (activeFilter === 'all') return true;
        return place.category === activeFilter;
      }),
    [activeFilter, places],
  );

  // Keep the pin overlays in sync with the currently visible places and
  // selection state so the map and sheet always show the same categories.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapsReady || !map) return;

    const overlays = overlaysRef.current;
    const seenIds = new Set(filteredPlaces.map((place) => place.id));

    for (const [id, overlay] of overlays) {
      if (!seenIds.has(id)) {
        overlay.setMap(null);
        overlays.delete(id);
      }
    }

    filteredPlaces.forEach((place) => {
      const isSelected = selectedPlaceIdsRef.current.has(place.id);
      const existing = overlays.get(place.id);
      const options = {
        pinIcon: place.pinIcon,
        pinLabel: place.pinLabel,
        isSelected,
        zIndex: isSelected ? 25 : 15,
        onClick: () => openDetailRef.current(place.id),
      };

      if (existing) {
        existing.update(options);
      } else {
        const overlay = new MapPinOverlay({
          position: { lat: place.lat, lng: place.lng },
          ...options,
        });
        overlay.setMap(map);
        overlays.set(place.id, overlay);
      }
    });

    if (filteredPlaces.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredPlaces.forEach((place) => bounds.extend({ lat: place.lat, lng: place.lng }));
      map.fitBounds(bounds, MAP_PADDING);
    }
  }, [mapsReady, filteredPlaces, selectedPlaceIds]);

  // Clean up overlays on unmount.
  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current.clear();
    };
  }, []);

  const recenterMap = () => {
    const map = mapRef.current;
    if (!map || filteredPlaces.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredPlaces.forEach((place) => bounds.extend({ lat: place.lat, lng: place.lng }));
    map.fitBounds(bounds, MAP_PADDING);
  };

  const selectedCount = selectedPlaceIds.size;
  const activePlace = places.find((place) => place.id === activePlaceId) ?? null;
  const lastScrollTopRef = useRef(0);

  const handleSheetScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    if (sheetSnap !== 'full' && scrollTop > lastScrollTopRef.current) {
      setSheetSnap('full');
    }
    lastScrollTopRef.current = scrollTop;
  };

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        title="Map Must Haves"
        currentScreen="map"
        onBack={() => onNavigate('who')}
        onNavigate={onNavigate}
      />

      {/* Full-bleed map sits behind the collapsible sheet so it stays visible. */}
      <main className="flex-1 relative pt-14 overflow-hidden">
        <div className="absolute inset-0 top-14 bg-[#e4eef0]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md px-4 py-2 shadow-md pointer-events-none">
              <span className="h-2 w-2 rounded-full bg-[#9FE870] animate-pulse" />
              <span className="font-label text-[12px] font-medium text-[#41493A]">
                Finding great spots…
              </span>
            </div>
          )}

          {/* Floating Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button
              aria-label="Recenter Map"
              onClick={recenterMap}
              className="w-10 h-10 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md shadow-md flex items-center justify-center text-[#163300] active:scale-90 transition-transform border border-black/[0.04] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">near_me</span>
            </button>
            <button
              aria-label="Layers"
              className="w-10 h-10 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md shadow-md flex items-center justify-center text-[#163300] active:scale-90 transition-transform border border-black/[0.04] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </button>
          </div>
        </div>

        {/* Draggable mobile bottom sheet: half-height by default, full screen on an upward swipe. */}
        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          label={activePlace ? 'Place details' : 'Places list'}
        >
          {activePlace ? (
            <PlaceDetailSheet
              place={activePlace}
              isSelected={selectedPlaceIds.has(activePlace.id)}
              onToggleSelect={() => toggleMustVisitPlace(activePlace)}
              onBack={() => setActivePlaceId(null)}
              onScroll={handleSheetScroll}
            />
          ) : (
            <>
              {/* Sheet Header with Filter Pills */}
              <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(['all', 'sights', 'cafes'] as const).map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`filter-pill px-3.5 py-1.5 rounded-full font-label text-[13px] tracking-tight transition-all shrink-0 active:scale-95 cursor-pointer capitalize ${
                      isActive
                        ? 'bg-[#163300] text-[#9FE870] font-semibold'
                        : 'bg-[#F5F4EE] text-[#41493A] font-medium hover:bg-[#EFEEE8]'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                );
              })}
            </div>

            {/* Selection Counter Pill */}
            <span
              id="selected-badge"
              className="font-label text-[12px] font-semibold text-[#163300] bg-[#EFEEE8] px-3 py-1.5 rounded-full shrink-0 border border-black/[0.03]"
            >
              {selectedCount} selected
            </span>
          </div>

          {/* Place List Cards — scrolls within the sheet, clears the floating CTA */}
          <div
            className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto no-scrollbar pb-28"
              onScroll={handleSheetScroll}
              id="places-container"
          >
            {isLoading && places.length === 0 ? (
              <p className="font-label text-[13px] text-[#41493A] text-center py-6">
                Finding great spots in {destination}…
              </p>
            ) : filteredPlaces.length === 0 ? (
              <p className="font-label text-[13px] text-[#41493A] text-center py-6">
                No places found for this filter.
              </p>
            ) : (
              filteredPlaces.map((place: PlaceItem) => {
                const isSelected = selectedPlaceIds.has(place.id);

                return (
                  <div
                    key={place.id}
                    onClick={() => openDetail(place.id)}
                    className="place-card flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F4EE] border border-black/[0.03] transition-all active:scale-[0.99] cursor-pointer hover:bg-[#EFEEE8]/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt={place.title}
                          loading="lazy"
                          decoding="async"
                          className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#E9E8E3] shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px] text-[#41493A]">
                            {place.iconName}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-[15px] text-[#163300] truncate tracking-tight">
                          {place.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-[#41493A]">
                            {place.iconName}
                          </span>
                          <span className="font-body text-[12px] text-[#41493A] font-medium truncate">
                            {place.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      aria-label={isSelected ? `Remove ${place.title}` : `Select ${place.title}`}
                      aria-pressed={isSelected}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMustVisitPlace(place);
                      }}
                      className={`selection-control w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ml-2 transition-all active:scale-90 cursor-pointer ${
                        isSelected
                          ? 'bg-[#9FE870] text-[#163300]'
                          : 'bg-[#E9E8E3] text-[#E4E2DD]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] font-black">
                        check
                      </span>
                    </button>
                  </div>
                );
              })
            )}
              </div>
            </>
          )}
        </BottomSheet>
      </main>

      {/* Prominent Kinetic Floating CTA */}
      <div className="safe-bottom-padding absolute bottom-0 inset-x-0 px-4 pt-4 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF] to-transparent z-40 pointer-events-none">
        <button
          id="cta-button"
          disabled={selectedCount === 0}
          onClick={() => onNavigate('chat')}
          className={`w-full h-14 rounded-full bg-[#9FE870] text-[#163300] font-headline font-bold text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(159,232,112,0.4)] active:scale-[0.98] transition-all hover:brightness-105 cursor-pointer pointer-events-auto ${
            selectedCount === 0 ? 'opacity-50' : 'opacity-100'
          }`}
        >
          <span className="material-symbols-filled text-[20px]">
            auto_awesome
          </span>
          <span>
            {selectedCount > 0 ? `Build Itinerary (${selectedCount})` : 'Select Places to Continue'}
          </span>
        </button>
      </div>
    </div>
  );
};
