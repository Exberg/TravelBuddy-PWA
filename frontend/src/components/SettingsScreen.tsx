import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ScreenId } from '../types';
import { useTripStore } from '../store/tripStore';
import { extractPreferenceKeywords } from '../lib/preferences';
import { BottomNav } from './BottomNav';

interface SettingsScreenProps {
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

export function SettingsScreen({ screen, onNavigate }: SettingsScreenProps) {
  const isGroups = screen === 'groups';
  const startNewTrip = useTripStore((state) => state.startNewTrip);
  const travelPreferences = useTripStore((state) => state.travelPreferences);
  const setTravelPreferences = useTripStore((state) => state.setTravelPreferences);
  const travelPreferenceKeywords = useTripStore((state) => state.travelPreferenceKeywords);
  const setTravelPreferenceKeywords = useTripStore((state) => state.setTravelPreferenceKeywords);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
  const [editingKeyword, setEditingKeyword] = useState('');
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

  const extractKeywords = async () => {
    const text = travelPreferences.trim();
    if (!text || isExtracting) return;

    setIsExtracting(true);
    setPreferenceError(null);
    try {
      const result = await extractPreferenceKeywords(text);
      setTravelPreferenceKeywords(result.keywords);
    } catch (error) {
      setPreferenceError(error instanceof Error ? error.message : 'Could not extract keywords right now');
    } finally {
      setIsExtracting(false);
    }
  };

  const startKeywordEdit = (index: number) => {
    setEditingKeywordIndex(index);
    setEditingKeyword(travelPreferenceKeywords[index].label);
  };

  const commitKeywordEdit = () => {
    if (editingKeywordIndex === null) return;
    const clean = editingKeyword.replace(/\s+/g, ' ').trim();
    if (clean) {
      const nextKeywords = travelPreferenceKeywords.map((keyword, index) =>
        index === editingKeywordIndex ? { ...keyword, label: clean } : keyword,
      );
      setTravelPreferenceKeywords(
        nextKeywords.filter(
          (keyword, index) =>
            nextKeywords.findIndex(
              (item) => item.label.toLocaleLowerCase() === keyword.label.toLocaleLowerCase(),
            ) === index,
        ),
      );
    }
    setEditingKeywordIndex(null);
    setEditingKeyword('');
  };

  const removeKeyword = (index: number) => {
    setTravelPreferenceKeywords(
      travelPreferenceKeywords.filter((_, keywordIndex) => keywordIndex !== index),
    );
    if (editingKeywordIndex === index) {
      setEditingKeywordIndex(null);
      setEditingKeyword('');
    }
  };

  const toggleKeywordSentiment = (index: number) => {
    setTravelPreferenceKeywords(
      travelPreferenceKeywords.map((keyword, keywordIndex) =>
        keywordIndex === index
          ? {
              ...keyword,
              sentiment: keyword.sentiment === 'wanted' ? 'unwanted' : 'wanted',
            }
          : keyword,
      ),
    );
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md select-none bg-[#fbf9f4] pb-28 font-sans text-[#1b1c19]">
      <main className="mx-auto flex w-full max-w-md flex-col items-stretch gap-6 px-6 pb-8 pt-12">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#163300] text-[#9fe870] shadow-sm">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.79 12.21-5.66 2.12 2.12-5.66 5.66-2.12-2.12 5.66zM12 10.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" />
              </svg>
            </div>
            <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-[#163300]">{isGroups ? 'Groups' : 'Settings'}</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163300] text-[#9fe870] shadow-sm" aria-hidden="true">
            {isGroups ? <span className="text-lg font-bold">•••</span> : <span className="text-lg">⚙</span>}
          </div>
        </header>

        {isGroups ? (
          <section className="flex w-full min-h-[calc(100dvh-190px)] flex-col rounded-[28px] border border-[#e4e2dd] bg-white shadow-sm">
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void extractKeywords();
              }}
              className="w-full rounded-[28px] border border-[#e4e2dd] bg-white p-6 shadow-sm"
            >
              <label htmlFor="travel-preferences" className="block text-[24px] font-extrabold tracking-tight text-[#163300]">Your preferences</label>
              <textarea
                id="travel-preferences"
                value={travelPreferences}
                onChange={(event) => setTravelPreferences(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void extractKeywords();
                  }
                }}
                placeholder={'I like quiet neighborhoods and local food…\nI dislike packed tours and early mornings…'}
                maxLength={1000}
                rows={8}
                className="mt-5 min-h-52 w-full resize-none select-text rounded-[22px] border border-[#d2d2d2] bg-[#f5f4ee] px-5 py-4 text-[16px] leading-7 text-[#1b1c19] outline-none transition placeholder:text-[#717A68] focus:border-[#163300] focus:bg-white focus:ring-4 focus:ring-[#9fe870]/35"
              />
              <div className="mt-4 flex min-h-6 items-center justify-between gap-3">
                <span role="status" className={`text-[12px] ${preferenceError ? 'font-medium text-[#BA1A1A]' : 'text-[#717A68]'}`}>
                  {isExtracting ? 'Finding your travel style…' : preferenceError}
                </span>
                <button type="submit" disabled={!travelPreferences.trim() || isExtracting} className="shrink-0 rounded-full bg-[#163300] px-4 py-2.5 font-headline text-[12px] font-extrabold text-[#9FE870] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35">
                  {isExtracting ? 'Extracting' : 'Extract keywords'}
                </button>
              </div>
              {travelPreferenceKeywords.length > 0 && (
                <div className="mt-5 space-y-4" aria-label="Extracted travel preferences">
                  {(['wanted', 'unwanted'] as const).map((sentiment) => {
                    const group = travelPreferenceKeywords
                      .map((keyword, index) => ({ keyword, index }))
                      .filter(({ keyword }) => keyword.sentiment === sentiment);
                    if (group.length === 0) return null;

                    const isWanted = sentiment === 'wanted';
                    return (
                      <div key={sentiment}>
                        <p className={`mb-2 font-label text-[10px] font-extrabold uppercase tracking-[0.12em] ${isWanted ? 'text-[#47672D]' : 'text-[#BA1A1A]'}`}>
                          {isWanted ? 'Wanted' : 'Not for me'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.map(({ keyword, index }) => (
                            <div
                              key={`${keyword.sentiment}-${keyword.label}-${index}`}
                              className={`inline-flex items-center gap-1 rounded-full border py-1.5 pl-1.5 pr-1.5 text-[13px] font-bold ${isWanted ? 'border-[#8AD45C] bg-[#EAF9DC] text-[#163300]' : 'border-[#FFB4AB] bg-[#FFDAD6] text-[#93000A]'}`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleKeywordSentiment(index)}
                                aria-label={`Mark ${keyword.label} as ${isWanted ? 'unwanted' : 'wanted'}`}
                                className={`flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#163300] ${isWanted ? 'bg-[#9FE870]' : 'bg-[#FFB4AB]'}`}
                              >
                                {isWanted ? '+' : '−'}
                              </button>
                              {editingKeywordIndex === index ? (
                                <input
                                  autoFocus
                                  value={editingKeyword}
                                  onChange={(event) => setEditingKeyword(event.target.value)}
                                  onBlur={commitKeywordEdit}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') { event.preventDefault(); commitKeywordEdit(); }
                                    if (event.key === 'Escape') { setEditingKeywordIndex(null); setEditingKeyword(''); }
                                  }}
                                  aria-label={`Edit keyword ${keyword.label}`}
                                  className="w-24 bg-transparent outline-none"
                                />
                              ) : (
                                <button type="button" onClick={() => startKeywordEdit(index)} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#163300]">{keyword.label}</button>
                              )}
                              <button type="button" onClick={() => removeKeyword(index)} aria-label={`Remove ${keyword.label}`} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163300]">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
            <section className="w-full overflow-hidden rounded-[26px] border border-[#e4e2dd] bg-white shadow-sm">
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

      <BottomNav
        currentScreen={screen}
        onNavigate={onNavigate}
        onCreateTrip={() => {
          startNewTrip();
          onNavigate('where');
        }}
      />
    </div>
  );
}
