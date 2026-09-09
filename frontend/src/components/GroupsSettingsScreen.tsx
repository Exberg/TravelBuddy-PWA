import type { ScreenId } from '../types';
import { BottomNav } from './BottomNav';

interface GroupsSettingsScreenProps {
  screen: 'groups' | 'settings';
  onNavigate: (screen: ScreenId) => void;
}

const PlusIcon = () => <span aria-hidden="true" className="text-2xl font-light leading-none">+</span>;

export function GroupsSettingsScreen({ screen, onNavigate }: GroupsSettingsScreenProps) {
  const isGroups = screen === 'groups';

  return (
    <div className="min-h-screen select-none bg-[#fbf9f4] pb-32 font-sans text-[#1b1c19]">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pb-8 pt-12">
        <header className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6B6F66]">TravelBuddy</p>
            <h1 className="mt-1 text-[30px] font-extrabold leading-none tracking-tight text-[#163300]">{isGroups ? 'Groups' : 'Settings'}</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300] text-[#9fe870] shadow-sm" aria-hidden="true">
            {isGroups ? <span className="text-lg font-bold">•••</span> : <span className="text-lg">⚙</span>}
          </div>
        </header>

        {isGroups ? (
          <>
            <section className="rounded-[28px] border border-[#e4e2dd] bg-white p-6 shadow-sm">
              <p className="text-[13px] font-semibold text-[#6B6F66]">Plan together</p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-[#163300]">Your travel groups</h2>
              <p className="mt-2 max-w-[280px] text-[14px] leading-6 text-[#6B6F66]">Create a group to keep trips, ideas, and decisions in one place.</p>
              <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#163300] px-4 py-3 text-[13px] font-bold text-[#9fe870] transition hover:bg-[#285500]">
                <PlusIcon /> Create a group
              </button>
            </section>
            <section className="rounded-[26px] border border-dashed border-[#cfcfc6] bg-[#f5f4ee] px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6B6F66] shadow-sm"><span className="text-xl" aria-hidden="true">○</span></div>
              <h2 className="mt-4 text-[17px] font-bold text-[#163300]">No groups yet</h2>
              <p className="mt-1 text-[13px] text-[#6B6F66]">Your shared trips will appear here.</p>
            </section>
          </>
        ) : (
          <>
            <section className="rounded-[28px] border border-[#e4e2dd] bg-white p-6 shadow-sm">
              <p className="text-[13px] font-semibold text-[#6B6F66]">Make it yours</p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-[#163300]">Preferences</h2>
              <p className="mt-2 text-[14px] leading-6 text-[#6B6F66]">Settings will be available here as TravelBuddy grows.</p>
            </section>
            <section className="overflow-hidden rounded-[26px] border border-[#e4e2dd] bg-white shadow-sm">
              {['Profile', 'Notifications', 'Travel preferences'].map((item, index) => (
                <button type="button" key={item} className={`flex w-full items-center justify-between px-5 py-5 text-left ${index > 0 ? 'border-t border-[#e4e2dd]' : ''}`}>
                  <span className="text-[15px] font-bold text-[#163300]">{item}</span>
                  <span className="text-xl text-[#6B6F66]" aria-hidden="true">›</span>
                </button>
              ))}
            </section>
          </>
        )}
      </main>
      <BottomNav currentScreen={screen} onNavigate={onNavigate} onCreateTrip={() => onNavigate('where')} />
    </div>
  );
}
