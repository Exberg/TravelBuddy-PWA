import React, { useState } from 'react';
import { ScreenHeader } from './ScreenHeader';
import { ScreenId } from '../types';

interface WhenScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WhenScreen: React.FC<WhenScreenProps> = ({ onNavigate }) => {
  const [selectedDuration, setSelectedDuration] = useState('2 Weeks');
  const [startDay, setStartDay] = useState(14);
  const [endDay, setEndDay] = useState(28);

  const durationOptions = [
    { label: 'Weekend', days: 3 },
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: 'Flexible', days: 14 },
  ];

  const handleDurationClick = (option: { label: string; days: number }) => {
    setSelectedDuration(option.label);
    if (option.label === 'Weekend') {
      setStartDay(17);
      setEndDay(19);
    } else if (option.label === '1 Week') {
      setStartDay(14);
      setEndDay(21);
    } else if (option.label === '2 Weeks') {
      setStartDay(14);
      setEndDay(28);
    } else if (option.label === '1 Month') {
      setStartDay(1);
      setEndDay(31);
    }
  };

  const handleDayClick = (day: number) => {
    if (day < startDay) {
      setStartDay(day);
    } else if (day === startDay) {
      // keep
    } else {
      setEndDay(day);
    }
  };

  // Calendar dates for October 2025 (starts on Wednesday, so 2 blank offsets for Mon, Tue)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

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
          {/* Stepper Progress Bar (Step 2 of 4) */}
          <div className="w-full pt-2 pb-6 flex items-center justify-between gap-2" aria-label="Step 2 of 4">
            <div className="h-1.5 flex-1 rounded-full bg-[#163300]"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#163300] relative overflow-hidden">
              <div className="absolute inset-0 bg-[#9FE870] opacity-40"></div>
            </div>
            <div className="h-1.5 flex-1 rounded-full bg-[#E9E8E3]"></div>
            <div className="h-1.5 flex-1 rounded-full bg-[#E9E8E3]"></div>
          </div>

          {/* Giant Minimalist Headline */}
          <div className="pb-6">
            <h1 className="font-headline font-extrabold text-[40px] leading-[44px] text-[#163300] tracking-tight">
              When?
            </h1>
          </div>

          {/* Date Range Capsule Card */}
          <div className="w-full bg-[#FFFFFF] border border-[#E9E8E3]/70 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label text-[11px] font-bold text-[#717A68] tracking-wider uppercase">
                  Departure
                </span>
                <span className="font-headline text-[24px] font-bold text-[#163300] mt-0.5 tracking-tight">
                  {startDay} Oct
                </span>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F5F4EE] text-[#163300] border border-[#EFEEE8]">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-label text-[11px] font-bold text-[#717A68] tracking-wider uppercase">
                  Return
                </span>
                <span className="font-headline text-[24px] font-bold text-[#163300] mt-0.5 tracking-tight">
                  {endDay} Oct
                </span>
              </div>
            </div>
          </div>

          {/* Minimal Duration Chips */}
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

          {/* Calendar Month View */}
          <div className="w-full bg-[#FFFFFF] border border-[#E9E8E3]/70 rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between pb-5 pt-0.5">
              <span className="font-headline text-[17px] font-bold text-[#163300] tracking-tight">
                October 2025
              </span>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous Month"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#717A68] hover:text-[#163300] hover:bg-[#F5F4EE] active:scale-90 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  aria-label="Next Month"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#717A68] hover:text-[#163300] hover:bg-[#F5F4EE] active:scale-90 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 text-center mb-2 font-label text-[12px] font-semibold text-[#717A68]">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center items-center text-[14px]">
              {/* Empty offset days for Mon, Tue (Oct 1 2025 is Wednesday) */}
              <div className="h-10"></div>
              <div className="h-10"></div>

              {daysInMonth.map((day) => {
                const isStart = day === startDay;
                const isEnd = day === endDay;
                const inRange = day > startDay && day < endDay;

                // Determine styling for range continuity
                let containerClass = 'h-10 flex items-center justify-center ';
                if (isStart && isEnd) {
                  containerClass += 'rounded-full';
                } else if (isStart) {
                  containerClass += 'bg-[#c8eea5]/50 rounded-l-full';
                } else if (isEnd) {
                  containerClass += 'bg-[#c8eea5]/50 rounded-r-full';
                } else if (inRange) {
                  containerClass += 'bg-[#c8eea5]/50 text-[#163300] font-semibold';
                } else {
                  containerClass += '';
                }

                if (isStart || isEnd) {
                  return (
                    <div key={day} className={containerClass}>
                      <button
                        onClick={() => handleDayClick(day)}
                        className="w-9 h-9 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center font-headline font-bold text-[14px] shadow-sm cursor-pointer"
                        type="button"
                      >
                        {day}
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`${containerClass} text-[#163300] hover:bg-[#F5F4EE] transition-colors font-medium rounded-full cursor-pointer`}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}

              {/* Trailing empty cells */}
              <div className="h-10"></div>
              <div className="h-10"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Primary Bottom Action */}
      <div className="w-full px-5 pt-4 pb-6 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent shrink-0">
        <button
          id="btn-when-continue"
          onClick={() => onNavigate('budget')}
          className="w-full h-14 bg-[#9FE870] text-[#163300] rounded-[16px] font-headline font-bold text-[17px] tracking-tight flex items-center justify-center transition-transform active:scale-[0.98] shadow-md shadow-[#9FE870]/25 hover:brightness-105 cursor-pointer"
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
