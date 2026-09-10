import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';

interface GroupsSettingsScreenProps {
  screen: 'groups' | 'settings';
  onNavigate: (screen: ScreenId) => void;
}

interface GroupMessage {
  id: number;
  name: string;
  initials: string;
  text: string;
  time: string;
  mine?: boolean;
}

const initialMessages: GroupMessage[] = [
  { id: 1, name: 'Maya', initials: 'M', text: 'Penang food weekend is on. What should we lock in first?', time: '9:41 AM' },
  { id: 2, name: 'Jordan', initials: 'J', text: 'Let’s start with Saturday dinner — I found three great spots.', time: '9:44 AM' },
  { id: 3, name: 'You', initials: 'Y', text: 'I’m voting for somewhere walkable from George Town.', time: '9:48 AM', mine: true },
];

const pollOptions = [
  { id: 'kebaya', label: 'Kebaya Dining Room', votes: 2 },
  { id: 'gurney', label: 'Gurney Drive hawker stalls', votes: 1 },
  { id: 'coast', label: 'The Blue Mansion courtyard', votes: 1 },
];

export function GroupsSettingsScreen({ screen }: GroupsSettingsScreenProps) {
  const isGroups = screen === 'groups';
  const travelPreferences = useTripStore((state) => state.travelPreferences);
  const setTravelPreferences = useTripStore((state) => state.setTravelPreferences);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const totalPollVotes = pollOptions.reduce((total, option) => total + option.votes, 0) + (selectedPollOption ? 1 : 0);

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        name: 'You',
        initials: 'Y',
        text,
        time: 'Now',
        mine: true,
      },
    ]);
    setDraft('');
  };

  return (
    <div className="min-h-screen select-none bg-[#fbf9f4] pb-8 font-sans text-[#1b1c19]">
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-6 pb-8 pt-12">
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
          <section className="flex min-h-[calc(100dvh-190px)] flex-col rounded-[28px] border border-[#e4e2dd] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e4e2dd] px-5 py-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B6F66]">4 members</p>
                <h2 className="mt-1 text-[21px] font-extrabold tracking-tight text-[#163300]">Weekend in Penang</h2>
              </div>
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f4ee] text-lg font-bold tracking-widest text-[#163300]">•••</span>
            </div>

            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5">
              <div className="flex justify-center">
                <span className="rounded-full bg-[#eaf9dc] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#163300]">Today</span>
              </div>

              {messages.map((message) => (
                <div key={message.id} className={`flex items-end gap-2 ${message.mine ? 'justify-end' : ''}`}>
                  {!message.mine && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c5eba3] text-[11px] font-extrabold text-[#163300]">{message.initials}</div>}
                  <div className={`max-w-[80%] ${message.mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!message.mine && <span className="mb-1 px-1 text-[11px] font-bold text-[#6B6F66]">{message.name}</span>}
                    <div className={`rounded-[20px] px-4 py-3 text-[14px] leading-5 ${message.mine ? 'rounded-br-[6px] bg-[#163300] text-white' : 'rounded-tl-[6px] border border-[#e5e5e5] bg-[#fbf9f4] text-[#1b1c19]'}`}>
                      {message.text}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-[#8a8d85]">{message.time}</span>
                  </div>
                </div>
              ))}

              <div className="rounded-[20px] border border-[#e5e5e5] bg-[#f7f7f7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6B6F66]">Poll</p>
                    <h3 className="mt-1 text-[16px] font-bold text-[#163300]">Where should we eat Saturday?</h3>
                  </div>
                  <span className="rounded-full bg-[#eaf9dc] px-2.5 py-1 text-[10px] font-bold text-[#163300]">Open</span>
                </div>
                <div className="mt-4 space-y-2">
                  {pollOptions.map((option) => {
                    const isSelected = selectedPollOption === option.id;
                    const optionVotes = option.votes + (isSelected ? 1 : 0);
                    const percentage = Math.round((optionVotes / totalPollVotes) * 100);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-label={`${option.label}, ${percentage} percent, ${isSelected ? 'selected' : 'not selected'}`}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPollOption(option.id)}
                        className={`relative w-full overflow-hidden rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] ${isSelected ? 'border-[#8ad45c] bg-[#eaf9dc]' : 'border-[#d2d2d2] bg-white hover:border-[#9fe870]'}`}
                      >
                        <span className="relative z-10 flex items-center justify-between gap-3 text-[13px] font-bold text-[#163300]">
                          <span>{option.label}</span>
                          <span>{percentage}%</span>
                        </span>
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-[#c5eba3]/50 transition-all" style={{ width: `${percentage}%` }} />
                      </button>
                    );
                  })}
                </div>
                <p role="status" className="mt-3 text-[11px] text-[#6B6F66]">{selectedPollOption ? 'Your vote is counted' : 'Tap an option to vote'} · {totalPollVotes} votes</p>
              </div>
            </div>

            <form onSubmit={submitMessage} className="flex items-center gap-2 border-t border-[#e4e2dd] p-3">
              <input
                aria-label="Message the group"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message the group"
                className="min-w-0 flex-1 rounded-[16px] border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-[14px] text-[#163300] outline-none placeholder:text-[#9a9d95] focus:border-[#163300] focus:ring-4 focus:ring-[#9fe870]/35"
              />
              <button type="submit" aria-label="Send message" disabled={!draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-[#163300] transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40">
                <span className="text-xl font-bold">↑</span>
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-[#e4e2dd] bg-white p-6 shadow-sm">
              <label htmlFor="travel-preferences" className="block text-[24px] font-extrabold tracking-tight text-[#163300]">Your preferences</label>
              <textarea id="travel-preferences" value={travelPreferences} onChange={(event) => setTravelPreferences(event.target.value)} placeholder={'I like quiet neighborhoods and local food…\nI dislike packed tours and early mornings…'} maxLength={1000} rows={8} className="mt-5 min-h-52 w-full resize-none select-text rounded-[22px] border border-[#d2d2d2] bg-[#f5f4ee] px-5 py-4 text-[16px] leading-7 text-[#1b1c19] outline-none transition placeholder:text-[#717A68] focus:border-[#163300] focus:bg-white focus:ring-4 focus:ring-[#9fe870]/35" />
            </section>
            <section className="overflow-hidden rounded-[26px] border border-[#e4e2dd] bg-white shadow-sm">
              {['Profile', 'Notifications'].map((item, index) => (
                <div key={item} className={`flex w-full items-center justify-between px-5 py-5 text-left ${index > 0 ? 'border-t border-[#e4e2dd]' : ''}`}>
                  <span className="text-[15px] font-bold text-[#163300]">{item}</span>
                  <span className="text-xl text-[#6B6F66]" aria-hidden="true">›</span>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
