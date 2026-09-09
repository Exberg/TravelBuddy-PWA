import React, { useState } from 'react';
import { ScreenId } from '../types';

interface QuickNavigatorProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const QuickNavigator: React.FC<QuickNavigatorProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ScreenId; label: string; number: string }[] = [
    { id: 'home', label: 'Home', number: '0' },
    { id: 'where', label: 'Where to?', number: '1' },
    { id: 'when', label: 'When?', number: '2' },
    { id: 'budget', label: 'Budget', number: '3' },
    { id: 'who', label: 'Who?', number: '4' },
    { id: 'map', label: 'Map Must Haves', number: '5' },
    { id: 'chat', label: 'Ai Chat', number: '6' },
  ];

  return (
    <aside aria-label="Screen navigator" className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="bg-[#163300] text-white rounded-2xl shadow-2xl p-2.5 mb-2 border border-[#9FE870]/30 w-52 flex flex-col gap-1 backdrop-blur-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
            <span className="text-[11px] font-headline font-bold text-[#9FE870] uppercase tracking-wider">
              Preview All Screens
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1 pt-1">
            {screens.map((s) => {
              const active = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onNavigate(s.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-headline transition-all cursor-pointer ${
                    active
                      ? 'bg-[#9FE870] text-[#163300] font-bold shadow-sm'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  <span
                    className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                      active ? 'bg-[#163300] text-[#9FE870]' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {s.number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#163300] text-[#9FE870] border border-[#9FE870]/40 shadow-lg text-xs font-headline font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        title="Quick switch between screens"
      >
        <span className="material-symbols-outlined text-[15px]">layers</span>
        <span>Screens ({screens.findIndex((s) => s.id === currentScreen) + 1}/{screens.length})</span>
      </button>
    </aside>
  );
};
