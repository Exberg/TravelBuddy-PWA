import React, { useState, type ReactNode } from 'react';
import { ScreenId } from '../types';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  rightAction?: ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  showBack = true,
  currentScreen,
  onNavigate,
  rightAction,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const screens: { id: ScreenId; label: string; step?: string }[] = [
    { id: 'where', label: 'Where to?', step: 'Step 1' },
    { id: 'when', label: 'When?', step: 'Step 2' },
    { id: 'budget', label: 'Budget', step: 'Step 3' },
    { id: 'who', label: 'Who?', step: 'Step 4' },
    { id: 'map', label: 'Map Must Haves', step: 'Explore' },
    { id: 'chat', label: 'Ai Chat', step: 'Itinerary' },
  ];

  return (
    <header className="fixed top-0 max-w-md w-full z-50 bg-[#FBF9F4]/90 backdrop-blur-md pt-safe border-b border-black/[0.04]">
      <div className="h-14 px-4 flex items-center justify-between">
        {showBack ? (
          <button
            id="header-back-btn"
            aria-label="Go back"
            onClick={onBack}
            className="w-10 h-10 -ml-1.5 flex items-center justify-center text-[#163300] hover:bg-[#efeee8]/70 rounded-full active:scale-90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
          </button>
        ) : (
          <div className="w-10 h-10 -ml-1.5" />
        )}

        {title && (
          <h1 className="font-headline font-bold text-[17px] text-[#163300] tracking-tight text-center truncate max-w-[220px]">
            {title}
          </h1>
        )}

        <div className="relative">
          {rightAction ?? (
          <>
          <button
            id="header-profile-btn"
            aria-label="Switch screen or profile"
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-[#163300] text-[#9FE870] flex items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer"
            title="Click to jump to any screen"
          >
            <span className="material-symbols-filled text-[19px]">person</span>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.08] p-2 flex flex-col gap-1 text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-black/[0.05] flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#717A68]">
                    Jump to Screen
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#9FE870] text-[#163300]">
                    6 Screens
                  </span>
                </div>
                {screens.map((item) => {
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setShowMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl text-xs font-headline flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-[#163300] text-[#9FE870] font-bold'
                          : 'text-[#163300] hover:bg-[#F5F4EE] font-medium'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-[#9FE870]/20 text-[#9FE870]' : 'text-[#717A68]'
                        }`}
                      >
                        {item.step}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          </>
          )}
        </div>
      </div>
    </header>
  );
};
