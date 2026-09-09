import React, { useEffect, useState } from 'react';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';

interface WhenScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type SelectionStep = 'departure' | 'return';

const startOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

/**
 * Local calendar date as YYYY-MM-DD. `toISOString()` would shift the date for
 * anyone east or west of UTC, which is exactly the audience for a Malaysian
 * travel app.
 */
const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const fromIsoDate = (value: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const isSameDay = (left: Date | null, right: Date) =>
  left !== null && dateKey(left) === dateKey(right);

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
    : 'Choose a date';

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

export const WhenScreen: React.FC<WhenScreenProps> = ({ onNavigate }) => {
  const setDates = useTripStore((state) => state.setDates);
  const setDurationLabel = useTripStore((state) => state.setDurationLabel);
  const savedStart = useTripStore((state) => state.startDate);
  const savedEnd = useTripStore((state) => state.endDate);
  const savedDurationLabel = useTripStore((state) => state.durationLabel);

  const [selectedDuration, setSelectedDuration] = useState(savedDurationLabel);
  const [startDate, setStartDate] = useState(
    () => fromIsoDate(savedStart) ?? startOfToday(),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    () => fromIsoDate(savedEnd) ?? addDays(startOfToday(), 14),
  );
  // The initial departure is already populated, so the first calendar click can
  // choose a return date (including one in a following month). After a return
  // is chosen, the next click starts a new departure -> return sequence.
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('return');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const anchor = fromIsoDate(savedStart) ?? startOfToday();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  // Every date mutation goes through here, so the store and the calendar can
  // never disagree about the range the agent is planning against.
  const commitRange = (nextStart: Date, nextEnd: Date | null) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setDates(toIsoDate(nextStart), nextEnd ? toIsoDate(nextEnd) : null);
  };

  const commitDuration = (label: string) => {
    setSelectedDuration(label);
    setDurationLabel(label);
  };

  // The calendar opens with a pre-filled range. Persist it on first visit so a
  // traveler who just taps Continue still gives the agent real dates.
  useEffect(() => {
    if (savedStart !== null) return;
    setDates(toIsoDate(startDate), endDate ? toIsoDate(endDate) : null);
    // Intentionally runs only for the initial unset state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const durationOptions = [
    { label: 'Weekend', days: 3 },
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: 'Flexible', days: null },
  ];

  const handleDurationClick = (option: (typeof durationOptions)[number]) => {
    commitDuration(option.label);

    if (option.days === null) {
      commitRange(startDate, null);
      setSelectionStep('return');
      return;
    }

    commitRange(startDate, addDays(startDate, option.days));
    setSelectionStep('departure');
  };

  const handleDayClick = (day: Date) => {
    if (selectionStep === 'departure') {
      commitRange(day, null);
      setSelectionStep('return');
      commitDuration('Flexible');
      setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
      return;
    }

    if (day < startDate) {
      // A date before the current departure is a corrected departure, not a return.
      commitRange(day, null);
      commitDuration('Flexible');
      return;
    }

    commitRange(startDate, day);
    setSelectionStep('departure');
    commitDuration('Flexible');
  };

  const moveMonth = (months: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + months, 1),
    );
  };

  const firstDayOffset = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) =>
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1),
  );
  const trailingDays = (7 - ((firstDayOffset + daysInMonth) % 7)) % 7;

  return (
    <div className="relative w-full max-w-[430px] h-[100dvh] mx-auto bg-[#FBF9F4] text-[#163300] flex flex-col overflow-hidden">
      <ScreenHeader
        title="Onboarding When"
        currentScreen="when"
        onBack={() => onNavigate('where')}
        onNavigate={onNavigate}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-5 pt-16 w-full">
        <div className="flex flex-col w-full pb-6">
          <div className="w-full pt-2 pb-6 flex items-center justify-between gap-2" aria-label="Step 2 of 4">
            <div className="h-1.5 flex-1 rounded-full bg-[#163300]"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] relative overflow-hidden">
              <div className="absolute inset-0 bg-[#9FE870] opacity-40"></div>
            </div>
            <div className="h-1.5 flex-1 rounded-full bg-[#E9E8E3]"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#E9E8E3]"></div>
          </div>

          <div className="pb-6">
            <h1 className="font-headline font-extrabold text-[40px] leading-[44px] text-[#163300] tracking-tight">
              When?
            </h1>
          </div>

          <div className="w-full bg-[#FFFFFF] border border-[#E9E8E3]/70 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectionStep('departure')}
                className="flex flex-col text-left rounded-lg px-1 -mx-1 transition-colors hover:bg-[#F5F4EE]"
                aria-label="Choose departure date"
                aria-pressed={selectionStep === 'departure'}
              >
                <span className="font-label text-[11px] font-bold text-[#717A68] tracking-wider uppercase">
                  Departure
                </span>
                <span className="font-headline text-[24px] font-bold text-[#163300] mt-0.5 tracking-tight">
                  {formatDate(startDate)}
                </span>
              </button>
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F5F4EE] text-[#163300] border border-[#EFEEE8]">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectionStep('return')}
                className="flex flex-col text-right rounded-lg px-1 -mx-1 transition-colors hover:bg-[#F5F4EE]"
                aria-label="Choose return date"
                aria-pressed={selectionStep === 'return'}
              >
                <span className="font-label text-[11px] font-bold text-[#717A68] tracking-wider uppercase">
                  Return
                </span>
                <span className="font-headline text-[24px] font-bold text-[#163300] mt-0.5 tracking-tight">
                  {formatDate(endDate)}
                </span>
              </button>
            </div>
            <p className="mt-3 text-center font-label text-xs text-[#717A68]" aria-live="polite">
              {selectionStep === 'departure' ? 'Choose your departure date' : 'Now choose your return date'}
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-5 -mx-1 px-1">
            {durationOptions.map((opt) => {
              const isActive = selectedDuration === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => handleDurationClick(opt)}
                  className={`duration-chip px-5 h-10 rounded-full font-label text-[13px] font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#163300] text-[#9FE870]'
                      : 'bg-[#FFFFFF] border border-[#E9E8E3]/80 text-[#163300] hover:bg-[#F5F4EE]'
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="w-full bg-[#FFFFFF] border border-[#E9E8E3]/70 rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between pb-5 pt-0.5">
              <span className="font-headline text-[17px] font-bold text-[#163300] tracking-tight">
                {formatMonth(visibleMonth)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous Month"
                  onClick={() => moveMonth(-1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#717A68] hover:text-[#163300] hover:bg-[#F5F4EE] active:scale-90 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  aria-label="Next Month"
                  onClick={() => moveMonth(1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#717A68] hover:text-[#163300] hover:bg-[#F5F4EE] active:scale-90 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center mb-2 font-label text-[12px] font-semibold text-[#717A68]">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center items-center text-[14px]">
              {Array.from({ length: firstDayOffset }, (_, index) => (
                <div key={`leading-${index}`} className="h-10" />
              ))}

              {calendarDays.map((day) => {
                const isStart = isSameDay(startDate, day);
                const isEnd = isSameDay(endDate, day);
                const inRange = startDate < day && endDate !== null && day < endDate;
                let containerClass = 'h-10 flex items-center justify-center ';

                if (isStart && isEnd) {
                  containerClass += 'rounded-full';
                } else if (isStart) {
                  containerClass += 'bg-[#c8eea5]/50 rounded-l-full';
                } else if (isEnd) {
                  containerClass += 'bg-[#c8eea5]/50 rounded-r-full';
                } else if (inRange) {
                  containerClass += 'bg-[#c8eea5]/50 text-[#163300] font-semibold';
                }

                return (
                  <div key={dateKey(day)} className={containerClass}>
                    <button
                      onClick={() => handleDayClick(day)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-headline text-[14px] shadow-sm cursor-pointer ${
                        isStart || isEnd
                          ? 'bg-[#163300] text-[#9FE870] font-bold'
                          : 'text-[#163300] hover:bg-[#F5F4EE] transition-colors font-medium'
                      }`}
                      type="button"
                      aria-label={`${selectionStep === 'departure' ? 'Departure' : 'Return'} ${formatDate(day)}`}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                );
              })}

              {Array.from({ length: trailingDays }, (_, index) => (
                <div key={`trailing-${index}`} className="h-10" />
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="w-full px-5 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-when-continue"
          onClick={() => onNavigate('budget')}
          disabled={endDate === null}
          className="w-full h-14 bg-[#9FE870] text-[#163300] rounded-[16px] font-headline font-bold text-[17px] tracking-tight flex items-center justify-center transition-transform active:scale-[0.98] shadow-md shadow-[#9FE870]/25 hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
