import type { ReactNode } from 'react';
import type { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onCreateTrip: () => void;
}

type IconProps = { className?: string };

const HomeIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

const AnalyticsIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>
);

const SettingsIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a2 2 0 0 0 1-2V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);

const NavItem = ({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) => (
  <button type="button" className={`flex flex-col items-center gap-1 ${active ? 'text-[#163300]' : 'text-[#6B6F66] transition hover:text-[#163300]'}`} onClick={onClick}>
    {icon}
    <span className={`text-[11px] tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </button>
);

export function BottomNav({ currentScreen, onNavigate, onCreateTrip }: BottomNavProps) {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="pointer-events-auto relative w-full max-w-md">
        <button aria-label="Log food" onClick={onCreateTrip} className="absolute -top-7 right-6 z-20 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#85dc52] bg-[#9fe870] text-[#163300] shadow-xl transition hover:shadow-2xl active:scale-95">
          <svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeWidth="3" viewBox="0 0 24 24" width="32" aria-hidden="true"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
        </button>
        <nav className="flex w-full items-center border-t border-[#e4e2dd] bg-white/95 px-6 pb-8 pt-3 shadow-lg backdrop-blur" aria-label="Primary navigation">
          <div className="flex w-3/4 items-center justify-between pr-4">
            <NavItem active={currentScreen === 'home'} icon={<HomeIcon className="h-6 w-6" />} label="Home" onClick={() => onNavigate('home')} />
            <NavItem active={currentScreen === 'groups'} icon={<AnalyticsIcon className="h-6 w-6" />} label="Groups" onClick={() => onNavigate('groups')} />
            <NavItem active={currentScreen === 'settings'} icon={<SettingsIcon className="h-6 w-6" />} label="Settings" onClick={() => onNavigate('settings')} />
          </div>
        </nav>
      </div>
    </div>
  );
}
