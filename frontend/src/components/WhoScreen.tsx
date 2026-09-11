import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';
import { MOCK_COLLABORATIVE_TRIP_ID } from '../data/mockCollaborativeTrip';

interface WhoScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WhoScreen: React.FC<WhoScreenProps> = ({ onNavigate }) => {
  // Party size drives per-person cost estimates in the itinerary, so it goes
  // to the store rather than staying local to this screen.
  const count = useTripStore((state) => state.travelers);
  const tripId = useTripStore((state) => state.tripId);
  const setCount = useTripStore((state) => state.setTravelers);
  const [isBouncing, setIsBouncing] = useState(false);

  const minCount = 1;
  const maxCount = 12;

  const triggerBounce = () => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 150);
  };

  const handleDecrement = () => {
    if (count > minCount) {
      setCount(count - 1);
      triggerBounce();
    }
  };

  const handleIncrement = () => {
    if (count < maxCount) {
      setCount(count + 1);
      triggerBounce();
    }
  };

  const handlePillClick = (val: number) => {
    setCount(val);
    triggerBounce();
  };

  const handleShare = async () => {
    // This is the local prototype handoff for collaboration: a future remote
    // repository can use the same tripId to sync preferences, budget,
    // must-have places, and itinerary edits between everyone who joins.
    const sharePath = tripId === MOCK_COLLABORATIVE_TRIP_ID
      ? '/demo/penang'
      : `/trips/${encodeURIComponent(tripId)}/onboarding/who`;
    const shareUrl = `${window.location.origin}${sharePath}`;
    const shareData = {
      title: 'TravelBuddy trip',
      text: 'Join our TravelBuddy trip plan',
      url: shareUrl,
    };

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData);
        return;
      }

      if (typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied');
        return;
      }

      toast.error('Sharing is unavailable in this browser');
    } catch (error) {
      // Closing the native share sheet is not an error worth surfacing.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Could not create a share link');
    }
  };

  const getLabel = () => {
    if (count === 1) return 'SOLO';
    if (count === 2) return 'COUPLE';
    if (count >= 3 && count <= 5) return 'SMALL CREW';
    return 'GROUP';
  };

  const isSoloActive = count === 1;
  const isCoupleActive = count === 2;
  const isGroupActive = count >= 3;

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        title="Onboarding Who"
        currentScreen="who"
        onBack={() => onNavigate('budget')}
        onNavigate={onNavigate}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-6 pt-16 w-full">
        <div className="flex flex-col w-full">
          {/* 4-Segment Progress Bar (Step 4 of 4) */}
          <div
            aria-label="Step 4 of 4"
            className="w-full flex items-center gap-2 pt-2 pb-6"
            role="progressbar"
          >
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] transition-all duration-300"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] transition-all duration-300"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] transition-all duration-300"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] transition-all duration-300"></div>
          </div>

          {/* Minimalist Headline */}
          <div className="mt-2 mb-2">
            <h1 className="font-headline text-[34px] font-extrabold text-[#163300] tracking-tight">
              Who?
            </h1>
            <p className="font-body text-sm font-normal text-[#41493A] mt-0.5">
              Select the number of travelers
            </p>
          </div>
        </div>

        {/* Central Interaction Hub */}
        <div className="flex flex-col items-center justify-center my-auto py-8">
          <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
            {/* Stepper Controls & Massive Number Display */}
            <div className="flex items-center justify-between w-full px-2 mb-9">
              {/* Decrement Button */}
              <button
                id="btn-decrement"
                aria-label="Decrease travelers"
                onClick={handleDecrement}
                disabled={count <= minCount}
                className="w-16 h-16 rounded-full bg-[#F5F4EE] hover:bg-[#eafcd4] border border-[#C1CAB5]/30 text-[#163300] flex items-center justify-center transition-all duration-150 active:scale-90 select-none shadow-sm disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[30px] font-semibold select-none">
                  remove
                </span>
              </button>

              {/* Dynamic Counter Display */}
              <div className="flex flex-col items-center justify-center px-4">
                <span
                  id="counter-value"
                  className={`font-display text-[84px] leading-none text-[#163300] font-extrabold tracking-tighter select-none transition-transform duration-150 ${
                    isBouncing ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {count}
                </span>
                <span
                  id="counter-label"
                  className="font-headline text-[13px] text-[#163300]/70 mt-3 tracking-widest uppercase font-bold select-none"
                >
                  {getLabel()}
                </span>
              </div>

              {/* Increment Button */}
              <button
                id="btn-increment"
                aria-label="Increase travelers"
                onClick={handleIncrement}
                disabled={count >= maxCount}
                className="w-16 h-16 rounded-full bg-[#F5F4EE] hover:bg-[#eafcd4] border border-[#C1CAB5]/30 text-[#163300] flex items-center justify-center transition-all duration-150 active:scale-90 select-none shadow-sm cursor-pointer disabled:opacity-30"
                type="button"
              >
                <span className="material-symbols-outlined text-[30px] font-semibold select-none">
                  add
                </span>
              </button>
            </div>

            {/* Group Mode Segmented Control Pills */}
            <div className="flex items-center p-1.5 bg-[#EFEEE8] border border-[#C1CAB5]/30 rounded-full gap-1 shadow-inner select-none">
              <button
                id="pill-solo"
                onClick={() => handlePillClick(1)}
                className={`preset-pill px-6 py-2.5 rounded-full font-headline text-xs tracking-wide uppercase font-bold transition-all duration-200 cursor-pointer ${
                  isSoloActive
                    ? 'bg-[#163300] text-[#9FE870] shadow-sm'
                    : 'bg-transparent text-[#163300]/70 hover:text-[#163300]'
                }`}
                type="button"
              >
                Solo
              </button>
              <button
                id="pill-couple"
                onClick={() => handlePillClick(2)}
                className={`preset-pill px-6 py-2.5 rounded-full font-headline text-xs tracking-wide uppercase font-bold transition-all duration-200 cursor-pointer ${
                  isCoupleActive
                    ? 'bg-[#163300] text-[#9FE870] shadow-sm'
                    : 'bg-transparent text-[#163300]/70 hover:text-[#163300]'
                }`}
                type="button"
              >
                Couple
              </button>
              <button
                id="pill-group"
                onClick={() => handlePillClick(4)}
                className={`preset-pill px-6 py-2.5 rounded-full font-headline text-xs tracking-wide uppercase font-bold transition-all duration-200 cursor-pointer ${
                  isGroupActive
                    ? 'bg-[#163300] text-[#9FE870] shadow-sm'
                    : 'bg-transparent text-[#163300]/70 hover:text-[#163300]'
                }`}
                type="button"
              >
                Group
              </button>
            </div>

            {count > 1 && (
              /* Share is only relevant once this trip has collaborators. */
              <button
                id="btn-share-trip"
                type="button"
                aria-label="Share trip"
                onClick={() => void handleShare()}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#C1CAB5]/45 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wide text-[#163300] transition-colors hover:border-[#163300] hover:bg-[#F5F4EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300] active:scale-[0.98]"
              >
                <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
                Share
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Fixed Primary CTA */}
      <div className="w-full px-6 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-who-explore"
          onClick={() => onNavigate('map')}
          className="w-full h-14 bg-[#9FE870] hover:bg-[#8ee05c] text-[#163300] rounded-full font-headline text-[16px] font-bold flex items-center justify-center tracking-tight shadow-[0_8px_24px_rgba(159,232,112,0.35)] active:scale-[0.98] transition-all cursor-pointer"
          type="button"
        >
          Explore
        </button>
      </div>
    </div>
  );
};
