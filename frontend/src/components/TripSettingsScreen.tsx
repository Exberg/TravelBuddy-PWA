import { useState } from 'react';
import type { ScreenId } from '../types';
import { ScreenHeader } from './ScreenHeader';
import { useTripStore } from '../store/tripStore';

interface TripSettingsScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const durationOptions = ['Weekend', '1 Week', '2 Weeks', 'Flexible'];

function formatDate(value: string | null) {
  if (!value) return 'Choose date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function TripSettingsScreen({ onNavigate }: TripSettingsScreenProps) {
  const trip = useTripStore();
  const [destination, setDestination] = useState(
    trip.destinationDescription ?? trip.destination,
  );
  const [startDate, setStartDate] = useState(trip.startDate ?? '');
  const [endDate, setEndDate] = useState(trip.endDate ?? '');
  const [durationLabel, setDurationLabel] = useState(trip.durationLabel);
  const [budget, setBudget] = useState(trip.budgetMyr);
  const [travelers, setTravelers] = useState(trip.travelers);

  const saveChanges = () => {
    const cleanDestination = destination.trim();
    trip.setDestination(cleanDestination, cleanDestination || null);
    trip.setDates(startDate || null, endDate || null);
    trip.setDurationLabel(durationLabel);
    trip.setBudgetMyr(budget);
    trip.setTravelers(travelers);
    onNavigate('chat');
  };

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#FBF9F4] text-[#163300]">
      <ScreenHeader
        title="Trip Settings"
        currentScreen="trip-settings"
        onBack={() => onNavigate('chat')}
        onNavigate={onNavigate}
      />

      <main className="no-scrollbar flex-1 overflow-y-auto px-6 pb-32 pt-20">
        <div className="space-y-5">
          <div>
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.12em] text-[#717A68]">
              Your trip
            </p>
            <h1 className="mt-2 font-headline text-[32px] font-extrabold leading-tight tracking-tight">
              Keep the plan current.
            </h1>
          </div>

          <section className="space-y-4 rounded-[24px] border border-[#E4E2DD] bg-white p-5 shadow-sm">
            <div>
              <label htmlFor="trip-destination" className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-[#717A68]">
                Destination
              </label>
              <input
                id="trip-destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Where are you going?"
                className="mt-2 h-14 w-full rounded-2xl border border-[#E4E2DD] bg-[#F5F4EE] px-4 font-headline text-[16px] font-bold text-[#163300] outline-none transition focus:border-[#717A68] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-2xl bg-[#F5F4EE] p-3.5">
                <span className="block font-label text-[10px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Departure</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-2 w-full bg-transparent font-headline text-[14px] font-bold text-[#163300] outline-none"
                  aria-label={`Departure: ${formatDate(startDate || null)}`}
                />
              </label>
              <label className="rounded-2xl bg-[#F5F4EE] p-3.5">
                <span className="block font-label text-[10px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Return</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 w-full bg-transparent font-headline text-[14px] font-bold text-[#163300] outline-none"
                  aria-label={`Return: ${formatDate(endDate || null)}`}
                />
              </label>
            </div>

            <div>
              <span className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Trip length</span>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {durationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDurationLabel(option)}
                    className={`shrink-0 rounded-full px-4 py-2.5 font-headline text-[13px] font-bold transition active:scale-95 ${durationLabel === option ? 'bg-[#163300] text-[#9FE870]' : 'border border-[#E4E2DD] bg-[#F5F4EE] text-[#41493A]'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-[24px] border border-[#E4E2DD] bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Budget</span>
                  <p className="mt-1 font-headline text-[25px] font-extrabold tabular-nums">RM {budget.toLocaleString('en-US')}</p>
                </div>
                <span className="font-label text-xs text-[#717A68]">MYR</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                className="kinetic-range mt-4 w-full cursor-pointer appearance-none bg-transparent"
                aria-label="Trip budget in Malaysian ringgit"
              />
              <div className="flex justify-between font-label text-[11px] text-[#717A68]"><span>RM 1,000</span><span>RM 15,000</span></div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E4E2DD] pt-5">
              <div>
                <span className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Travelers</span>
                <p className="mt-1 font-headline text-[16px] font-bold">{travelers === 1 ? 'Solo trip' : `${travelers} people`}</p>
              </div>
              <div className="flex items-center gap-3 rounded-full bg-[#F5F4EE] p-1">
                <button type="button" aria-label="Decrease travelers" onClick={() => setTravelers(Math.max(1, travelers - 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-[22px] text-[#163300] transition hover:bg-white disabled:opacity-30" disabled={travelers <= 1}>−</button>
                <span className="w-5 text-center font-headline text-[16px] font-extrabold tabular-nums">{travelers}</span>
                <button type="button" aria-label="Increase travelers" onClick={() => setTravelers(Math.min(12, travelers + 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-[22px] text-[#163300] transition hover:bg-white disabled:opacity-30" disabled={travelers >= 12}>+</button>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#E4E2DD] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-[#717A68]">Must-visit places</span>
                <p className="mt-1 font-headline text-[16px] font-bold">Your saved picks</p>
              </div>
              <span className="rounded-full bg-[#EAF9DC] px-2.5 py-1 font-label text-[11px] font-bold text-[#163300]">{trip.mustVisitPlaces.length}</span>
            </div>
            {trip.mustVisitPlaces.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {trip.mustVisitPlaces.map((place) => (
                  <button key={place.id} type="button" onClick={() => trip.removeMustVisitPlace(place.id)} className="inline-flex items-center gap-1.5 rounded-full border border-[#C1CAB5] bg-[#F5F4EE] px-3 py-2 font-body text-[13px] text-[#163300] transition hover:border-[#163300]">
                    {place.title}<span aria-hidden="true" className="text-[#717A68]">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-[#F5F4EE] px-4 py-3 font-body text-[13px] text-[#717A68]">No saved places yet.</p>
            )}
          </section>
        </div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#FBF9F4] via-[#FBF9F4] to-transparent px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
        <button type="button" onClick={saveChanges} className="h-14 w-full rounded-2xl bg-[#9FE870] font-headline text-[16px] font-extrabold text-[#163300] shadow-[0_8px_24px_rgba(159,232,112,0.35)] transition hover:brightness-105 active:scale-[0.98]">
          Save changes
        </button>
      </div>
    </div>
  );
}
