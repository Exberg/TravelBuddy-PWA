import React, { useState } from 'react';
import { PLACES } from '../data/mockData';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId, PlaceItem } from '../types';

interface MapScreenProps {
  onNavigate: (screen: ScreenId) => void;
  selectedPlaceIds: Set<string>;
  onTogglePlace: (id: string) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  onNavigate,
  selectedPlaceIds,
  onTogglePlace,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'sights' | 'cafes' | 'stays'>('all');

  const filteredPlaces = PLACES.filter((place) => {
    if (activeFilter === 'all') return true;
    return place.category === activeFilter;
  });

  const selectedCount = selectedPlaceIds.size;

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        title="Map Must Haves"
        currentScreen="map"
        onBack={() => onNavigate('who')}
        onNavigate={onNavigate}
      />

      <main className="flex-1 flex flex-col pt-14 relative overflow-y-auto no-scrollbar">
        {/* Interactive Map Section */}
        <div className="relative w-full h-[390px] bg-[#e4eef0] overflow-hidden">
          {/* Map background */}
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-500"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC0lzMQcsaeY-R2t9VSRL_uFn_R1eBOgXyY1qJ6NXv1CP0eHyJhqvh5NPmKJCvJzhgFhhSSGVGWHrc29wYdTtSFazBxRDvk74bJlGvNC0leO8yafhjcNZNyZBEGmXkx_9jYXLovf3DX0rAR7H3ItPCmD0M2-fg7UJBzGJY6X0TnYP9xHBIo6B-DAPlIwBTAQfvMJAMsGPirbp-kXq2byzJQv_Wn-YMGxsbVn8ZLxZ0hh0itTIcwQu1N')`,
            }}
          />

          {/* Soft warm map overlay matching kinetic theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FBF9F4]/25 via-transparent to-[#FBF9F4]/40 pointer-events-none" />

          {/* Floating Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button
              aria-label="Recenter Map"
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

          {/* Map Pins */}
          {PLACES.map((place) => {
            const isSelected = selectedPlaceIds.has(place.id);
            const posStyle: React.CSSProperties = {
              top: place.pinPosition.top,
              left: place.pinPosition.left,
              right: place.pinPosition.right,
              zIndex: isSelected ? 25 : 15,
            };

            return (
              <button
                key={place.id}
                onClick={() => onTogglePlace(place.id)}
                style={posStyle}
                className="pin-toggle absolute -translate-x-1/2 -translate-y-1/2 group active:scale-95 transition-all cursor-pointer"
                title={`Toggle ${place.title}`}
              >
                {isSelected ? (
                  <>
                    <div className="pin-bubble flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#163300] text-[#9FE870] shadow-lg ring-2 ring-white transition-all">
                      <span className="material-symbols-filled text-[15px]">
                        {place.pinIcon}
                      </span>
                      <span className="font-label text-[12px] font-bold tracking-tight text-white whitespace-nowrap">
                        {place.pinLabel}
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-[#163300] rotate-45 mx-auto -mt-1 shadow-sm" />
                  </>
                ) : (
                  <>
                    <div className="pin-bubble flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFFFFF]/95 text-[#163300] shadow-md ring-1 ring-black/[0.06] transition-all">
                      <span className="material-symbols-outlined text-[13px] text-[#41493A]">
                        {place.pinIcon}
                      </span>
                      <span className="font-label text-[11px] font-medium whitespace-nowrap text-[#163300]">
                        {place.pinLabel}
                      </span>
                    </div>
                    <div className="w-1.5 h-1.5 bg-[#FFFFFF]/95 rotate-45 mx-auto -mt-0.5" />
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Kinetic Bottom Sheet */}
        <div className="relative -mt-6 z-30 flex-1 flex flex-col bg-[#FFFFFF] rounded-t-[24px] px-4 pt-3 pb-8 shadow-[0_-8px_24px_rgba(22,51,0,0.06)] border-t border-black/[0.04]">
          {/* Subtle Drag Handle */}
          <div className="w-10 h-1.5 bg-[#dbdad5]/80 rounded-full mx-auto mb-3.5" />

          {/* Sheet Header with Filter Pills */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(['all', 'sights', 'cafes', 'stays'] as const).map((filter) => {
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

          {/* Place List Cards */}
          <div className="flex flex-col gap-2.5" id="places-container">
            {filteredPlaces.map((place: PlaceItem) => {
              const isSelected = selectedPlaceIds.has(place.id);

              return (
                <div
                  key={place.id}
                  onClick={() => onTogglePlace(place.id)}
                  className="place-card flex items-center justify-between p-2.5 rounded-2xl bg-[#F5F4EE] border border-black/[0.03] transition-all active:scale-[0.99] cursor-pointer hover:bg-[#EFEEE8]/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={place.imageUrl}
                      alt={place.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                    />
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
                    aria-label={`Select ${place.title}`}
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
            })}
          </div>
        </div>
      </main>

      {/* Prominent Kinetic Floating CTA */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-6 pt-4 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF] to-transparent z-40 pointer-events-none">
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
