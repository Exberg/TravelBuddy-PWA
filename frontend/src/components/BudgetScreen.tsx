import React, { useEffect, useState } from 'react';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';

const COUNTRY_CURRENCIES: Record<string, string> = {
  australia: 'AUD',
  bolivia: 'BOB',
  cambodia: 'KHR',
  china: 'CNY',
  france: 'EUR',
  germany: 'EUR',
  india: 'INR',
  indonesia: 'IDR',
  italy: 'EUR',
  japan: 'JPY',
  malaysia: 'MYR',
  'new zealand': 'NZD',
  philippines: 'PHP',
  singapore: 'SGD',
  'south korea': 'KRW',
  spain: 'EUR',
  taiwan: 'TWD',
  thailand: 'THB',
  vietnam: 'VND',
  'united arab emirates': 'AED',
  'united kingdom': 'GBP',
  'united states': 'USD',
};

function normalizeCountry(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDestinationCountry(destination: string): string | null {
  const parts = destination
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of [...parts].reverse()) {
    const normalizedPart = normalizeCountry(part);
    const country = Object.keys(COUNTRY_CURRENCIES).find(
      (name) =>
        normalizedPart === name ||
        normalizedPart.endsWith(` ${name}`) ||
        normalizedPart.startsWith(`${name} `),
    );
    if (country) return country;
  }

  return null;
}

interface BudgetScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onNavigate }) => {
  // Written straight to the store: the agent treats this as the trip's hard
  // budget ceiling, so there is no separate "confirm" step to lose it at.
  const budget = useTripStore((state) => state.budgetMyr);
  const setBudget = useTripStore((state) => state.setBudgetMyr);
  const destination = useTripStore((state) => state.destination);
  const destinationDescription = useTripStore(
    (state) => state.destinationDescription,
  );
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [conversionError, setConversionError] = useState(false);

  const destinationCountry = getDestinationCountry(
    destinationDescription ?? destination,
  );
  const destinationCountryLabel = destinationCountry
    ? destinationCountry.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;
  const destinationCurrency = destinationCountry
    ? COUNTRY_CURRENCIES[destinationCountry]
    : null;

  useEffect(() => {
    setConversionRate(null);
    setConversionError(false);

    if (!destinationCurrency) return;
    if (destinationCurrency === 'MYR') {
      setConversionRate(1);
      return;
    }

    let stale = false;
    const url = new URL(
      `https://api.frankfurter.dev/v2/rate/MYR/${destinationCurrency}`,
    );

    fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Frankfurter returned ${response.status}`);
        return (await response.json()) as {
          rate?: number;
        };
      })
      .then((data) => {
        if (stale) return;

        if (typeof data.rate === 'number' && Number.isFinite(data.rate)) {
          setConversionRate(data.rate);
        } else {
          setConversionError(true);
        }
      })
      .catch(() => {
        if (!stale) setConversionError(true);
      });

    return () => {
      stale = true;
    };
  }, [destinationCurrency]);

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
              {destinationCountryLabel && destinationCurrency !== 'MYR' && (
                <span className="font-body text-xs text-[#C5EBA3] mt-3">
                  {convertedBudget
                    ? `≈ ${convertedBudget} in ${destinationCountryLabel}`
                    : conversionError
                      ? `${destinationCountryLabel} uses ${destinationCurrency}; live conversion unavailable`
                      : null}
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
