import React from 'react';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';
import { getFixedRate } from '../lib/currency';

interface BudgetScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onNavigate }) => {
  // Written straight to the store: the agent treats this as the trip's hard
  // budget ceiling, so there is no separate "confirm" step to lose it at.
  const budget = useTripStore((state) => state.budgetMyr);
  const setBudget = useTripStore((state) => state.setBudgetMyr);
  const destinationCurrency = useTripStore((state) => state.destinationCurrency);
  const budgetCurrency = useTripStore((state) => state.budgetCurrency);
  const conversionRate = destinationCurrency
    ? getFixedRate(budgetCurrency, destinationCurrency)
    : null;

  const presetAmounts = [2500, 4500, 8000];

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const convertedBudget =
    conversionRate !== null && destinationCurrency
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: destinationCurrency,
          maximumFractionDigits: 0,
        }).format(Math.round(budget * conversionRate))
      : null;

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        title="Onboarding Budget"
        currentScreen="budget"
        onBack={() => onNavigate('when')}
        onNavigate={onNavigate}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-6 pt-20 w-full max-w-md mx-auto">
        <div className="flex flex-col w-full pb-6">
          {/* 4-Segment Kinetic Progress Bar (Step 3 of 4) */}
          <div aria-label="Step 3 of 4" className="flex items-center gap-2 w-full pt-2 pb-8">
            <div className="h-1.5 rounded-full flex-1 bg-[#163300]"></div>
            <div className="h-1.5 rounded-full flex-1 bg-[#163300]"></div>
            <div className="h-1.5 rounded-full flex-1 bg-[#163300]"></div>
            <div className="h-1.5 rounded-full flex-1 bg-[#E4E2DD]"></div>
          </div>

          {/* Editorial Headline */}
          <div className="w-full mb-6">
            <h1 className="font-display font-extrabold text-4xl sm:text-[40px] tracking-tight text-[#163300]">
              Budget
            </h1>
            <p className="font-body text-sm text-[#41493A] mt-1.5">
              Set a monthly target to power your kinetic goals.
            </p>
          </div>

          {/* Signature Forest Hero Amount Canvas */}
          <div className="relative w-full rounded-3xl bg-[#163300] text-white p-7 my-2 shadow-xl shadow-[#163300]/10 overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-[#9FE870]/15 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center py-4">
              <span className="text-xs uppercase tracking-widest text-[#9FE870] font-headline font-bold mb-2">
                Target Monthly Spend
              </span>
              <div className="flex items-baseline justify-center tracking-tight">
                <span className="font-headline text-2xl font-bold text-[#9FE870] mr-2">
                  RM
                </span>
                <span
                  id="budget-val"
                  className="font-display text-5xl sm:text-6xl font-extrabold text-white tabular-nums tracking-tight"
                >
                  {formatNumber(budget)}
                </span>
              </div>
              {destinationCurrency && destinationCurrency !== 'MYR' && (
                <span className="font-body text-xs text-[#C5EBA3] mt-3">
                  {convertedBudget
                    ? `≈ ${convertedBudget} · fixed planning rate`
                    : `Destination uses ${destinationCurrency}`}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-col gap-6 w-full mt-6">
            {/* Preset Segment Chips */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {presetAmounts.map((amt) => {
                const isActive = budget === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBudget(amt)}
                    className={`preset-chip h-12 rounded-2xl flex items-center justify-center font-headline text-xs transition-all duration-150 active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#9FE870] border border-[#9FE870] text-[#163300] font-bold shadow-sm'
                        : 'bg-[#F5F4EE] border border-[#C1CAB5]/40 text-[#163300] font-semibold hover:bg-[#EFEEE8]'
                    }`}
                  >
                    RM {formatNumber(amt)}
                  </button>
                );
              })}
            </div>

            {/* Tactile Range Slider Track */}
            <div className="relative w-full flex flex-col gap-2 pt-2 px-1">
              <input
                id="budget-slider"
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="kinetic-range w-full appearance-none bg-transparent cursor-pointer focus:outline-none"
              />
              <div className="flex justify-between text-[11px] font-headline font-semibold text-[#41493A] px-0.5">
                <span>RM 1,000</span>
                <span>RM 15,000</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Primary CTA Footprint */}
      <div className="w-full px-6 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-budget-continue"
          type="button"
          onClick={() => onNavigate('who')}
          className="w-full h-14 bg-[#9FE870] text-[#163300] rounded-full font-headline font-bold text-base flex items-center justify-center shadow-lg shadow-[#9FE870]/25 hover:bg-[#bdf29b] transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
