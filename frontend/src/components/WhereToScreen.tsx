import React, { useState } from 'react';
import { DESTINATIONS } from '../data/mockData';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';

interface WhereToScreenProps {
  onNavigate: (screen: ScreenId) => void;
  selectedDestination: string;
  onSelectDestination: (dest: string) => void;
}

export const WhereToScreen: React.FC<WhereToScreenProps> = ({
  onNavigate,
  selectedDestination,
  onSelectDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState('Penang, Malaysia');

  const filteredDestinations = DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayList = filteredDestinations.length > 0 ? filteredDestinations : DESTINATIONS;

  const handleSelect = (destName: string, location: string) => {
    onSelectDestination(destName);
    setSearchQuery(location);
  };

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        currentScreen="where"
        onNavigate={onNavigate}
        showBack={false}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-5 pt-16 w-full">
        <div className="flex flex-col w-full pb-6">
          {/* Stepper Indicator (Step 1 of 4) */}
          <div className="flex items-center gap-2 w-full py-2 mb-8" aria-label="Step 1 of 4">
            <div className="h-1 flex-1 rounded-full bg-[#163300] transition-all duration-300"></div>
            <div className="h-1 flex-1 rounded-full bg-[#E4E2DD] transition-all duration-300"></div>
            <div className="h-1 flex-1 rounded-full bg-[#E4E2DD] transition-all duration-300"></div>
            <div className="h-1 flex-1 rounded-full bg-[#E4E2DD] transition-all duration-300"></div>
          </div>

          {/* Massive Confident Headline */}
          <h1 className="font-headline text-[32px] leading-tight font-extrabold text-[#163300] tracking-tight mb-7">
            Where to?
          </h1>

          {/* Search Capsule */}
          <div className="relative w-full mb-7 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#163300]/60">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input
              id="destination-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination"
              className="w-full h-14 pl-12 pr-12 bg-[#F5F4EE] border border-transparent focus:border-[#717A68]/30 text-[#163300] font-headline font-semibold text-base rounded-[16px] focus:outline-none focus:bg-[#EFEEE8] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                id="clear-btn"
                aria-label="Clear destination"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#163300]/40 hover:text-[#163300] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </button>
            )}
          </div>

          {/* Suggested Minimal Cards */}
          <div className="flex flex-col gap-3">
            {displayList.map((dest) => {
              const isSelected = selectedDestination.toLowerCase() === dest.name.toLowerCase();

              return (
                <button
                  key={dest.id}
                  onClick={() => handleSelect(dest.name, dest.location)}
                  className={`destination-option flex items-center justify-between p-3.5 pr-4 rounded-[16px] bg-[#FFFFFF] shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer text-left ${
                    isSelected
                      ? 'border-2 border-[#163300]'
                      : 'border border-[#E9E8E3] hover:border-[#C1CAB5]'
                  }`}
                  data-active={isSelected ? 'true' : 'false'}
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <span className="font-headline font-bold text-[17px] text-[#163300]">
                      {dest.name}
                    </span>
                  </div>

                  <div
                    className={`status-indicator w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#9FE870] text-[#163300] font-bold'
                        : 'bg-[#EFEEE8] text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] font-bold leading-none">
                      check
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Primary Bottom Action */}
      <div className="w-full px-5 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-where-continue"
          onClick={() => onNavigate('when')}
          className="w-full h-14 rounded-[16px] bg-[#9FE870] hover:bg-[#92d866] text-[#163300] font-headline text-[17px] font-bold tracking-tight flex items-center justify-center shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
