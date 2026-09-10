import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';
import { usePlaceAutocomplete } from '../hooks/usePlaceAutocomplete';
import { useTripStore } from '../store/tripStore';

interface WhereToScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WhereToScreen: React.FC<WhereToScreenProps> = ({ onNavigate }) => {
  const setDestination = useTripStore((state) => state.setDestination);
  const savedDescription = useTripStore((state) => state.destinationDescription);
  const [searchQuery, setSearchQuery] = useState(
    () => savedDescription ?? '',
  );
  const [selectedDestination, setSelectedDestination] = useState(
    () => Boolean(savedDescription?.trim()),
  );
  const [isResolving, setIsResolving] = useState(false);
  const { suggestions, isLoading: isSearching, error } = usePlaceAutocomplete(searchQuery);

  // Live Places Autocomplete only kicks in once the user has typed enough to
  // form a meaningful query; below that we show a lightweight search prompt
  // instead of any canned/mock destination list.
  const showLiveSuggestions = searchQuery.trim().length >= 2;

  // Surface autocomplete failures (rate limits, network errors) as a toast
  // rather than silently showing nothing.
  useEffect(() => {
    if (error) {
      toast.error('Could not search destinations', {
        description: 'Check your connection and try again.',
      });
    }
  }, [error]);

  const handleSelectSuggestion = async (suggestion: (typeof suggestions)[number]) => {
    setIsResolving(true);
    try {
      const place = await suggestion.toPlace();
      // The full location string ("George Town, Penang, Malaysia") is what the
      // agent plans against; the short name stays for UI headings.
      setDestination(place.name, place.location);
      setSearchQuery(place.location);
      setSelectedDestination(true);
    } catch {
      // Fall back to the prediction text if fetchFields fails (e.g. rate
      // limited); the user can still continue with a reasonable name.
      const description = `${suggestion.mainText}, ${suggestion.secondaryText}`.replace(
        /, $/,
        '',
      );
      setDestination(suggestion.mainText, description);
      setSearchQuery(description);
      setSelectedDestination(true);
      toast.warning('Using approximate location', {
        description: "We couldn't load full details for that place, but you can keep going.",
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        currentScreen="where"
        onNavigate={onNavigate}
        onBack={() => onNavigate('home')}
        showBack
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // A typed query is only a search, not a destination choice.
                // Invalidate the previous choice so Continue cannot carry a
                // stale destination into the next onboarding step.
                if (selectedDestination) {
                  setDestination('', null);
                  setSelectedDestination(false);
                }
              }}
              placeholder="Search destination"
              className="w-full h-14 pl-12 pr-12 bg-[#F5F4EE] border border-transparent focus:border-[#717A68]/30 text-[#163300] font-headline font-semibold text-base rounded-[16px] focus:outline-none focus:bg-[#EFEEE8] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                id="clear-btn"
                aria-label="Clear destination"
                onClick={() => {
                  setSearchQuery('');
                  setDestination('', null);
                  setSelectedDestination(false);
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#163300]/40 hover:text-[#163300] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </button>
            )}
          </div>

          {/* Suggested Minimal Cards */}
          {showLiveSuggestions ? (
            <div className="flex flex-col gap-3">
              {isSearching && suggestions.length === 0 ? (
                <p className="font-label text-[13px] text-[#41493A] text-center py-4">
                  Searching…
                </p>
              ) : suggestions.length === 0 ? (
                <p className="font-label text-[13px] text-[#41493A] text-center py-4">
                  No destinations found.
                </p>
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    onClick={() => void handleSelectSuggestion(suggestion)}
                    disabled={isResolving}
                    className="destination-option flex items-center justify-between p-3.5 pr-4 rounded-[16px] bg-[#FFFFFF] shadow-sm border border-[#E9E8E3] hover:border-[#C1CAB5] transition-all duration-200 active:scale-[0.98] cursor-pointer text-left disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#F5F4EE] shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-[#41493A]">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline font-bold text-[16px] text-[#163300] truncate">
                          {suggestion.mainText}
                        </span>
                        {suggestion.secondaryText && (
                          <span className="font-body text-[13px] text-[#41493A] truncate">
                            {suggestion.secondaryText}
                          </span>
                        )}
                        <span className="font-label text-[11px] text-[#717A68]">
                          {suggestion.isCountry ? 'Country' : 'City or region'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-[#E9E8E3] bg-[#FFFFFF]/60 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F4EE]">
                <span className="material-symbols-outlined text-[24px] text-[#41493A]">
                  travel_explore
                </span>
              </div>
              <p className="font-headline text-[15px] font-bold text-[#163300]">
                Search for a destination
              </p>
              <p className="font-body text-[13px] text-[#41493A]">
                Start typing a country, city, or region to see live suggestions.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Primary Bottom Action */}
      <div className="w-full px-5 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-where-continue"
          onClick={() => onNavigate('when')}
          disabled={!selectedDestination || isResolving}
          className="w-full h-14 rounded-[16px] bg-[#9FE870] hover:bg-[#92d866] text-[#163300] font-headline text-[17px] font-bold tracking-tight flex items-center justify-center shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#9FE870]"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
