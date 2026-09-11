import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ScreenId } from '../types';
import {
  useTripStore,
  type TripRecord,
} from '../store/tripStore';
import {
  ensureMockCollaborativeTrip,
  tripRepository,
} from '../repositories/tripRepository';
import {
  MOCK_COLLABORATIVE_TRIP_ID,
  MOCK_COLLABORATIVE_TRIP_IMAGE_URL,
} from '../data/mockCollaborativeTrip';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type IconProps = { className?: string };

const FlameIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 23c4.97 0 9-4.03 9-9 0-4.52-3.34-8.25-7.72-8.87.28.91.44 1.88.44 2.87 0 2.21-1.79 4-4 4-.54 0-1.05-.11-1.52-.3C8.08 12.37 8 13.17 8 14c0 4.97 4.03 9 9 9zM12 2C8.5 7 6 9.5 6 14c0 1.25.32 2.43.88 3.46C6.32 16.42 6 15.25 6 14c0-3.31 2.69-6 6-6 .55 0 1.07.07 1.56.21C12.72 5.8 12 3.86 12 2z" />
  </svg>
);

const ClockIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" /></svg>
);

const WalletIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM4 13a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm5-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H9z" clipRule="evenodd" /></svg>
);

const PinIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 1 1 9.9 9.9L10 18.9l-4.95-4.95a7 7 0 0 1 0-9.9zM10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" clipRule="evenodd" /></svg>
);

const CheckIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" /></svg>
);

const LightningIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);

const WheatIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 22 16 8" /><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
  </svg>
);

const DropIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
);

const HomeIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);

const GroupIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
    <path d="M18 14a6 6 0 0 1 3 5.2" />
  </svg>
);

const SettingsIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);

const FALLBACK_TRIP_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKw475tHkL7l-w8Q22z-42tEXHSwni9b4TNs9tcutCdw8q4pO62EU762ZyHpB5mqhEmYxq5gyfJRt2pmkblstyh8N1Pm1X9lXqUzRk_SdVlETVIf50ecoutTdu02c47QziXvvw1sK80tl5iiEow-3KstWhOyi_R6tPI3mNhYoujz8IbowNb2g2ujlN1m1wwaU3wwPVnvDwrQn9yPNfefalpAcE7IbP5i2ncmydEt1XZ73TfpLrpeVW',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAIATePhMtj3IT6r3rRlRwLPHjbnFcPTz2HgRtGLnbWcuAQ5RDZ4ugryPpwIlLzTF7tbeotLvN2SDcWeVURGxfUjRKeJ-VvY38uc7Zrv0Lsa6Q7D-n4y4tIuKEXa02UPDZpLWb7IFeqago2anvChrU0cUiQI2gu23X9hUNVFZsVHZN75pub-ywufiDbCb6ICHsWXVQlcRrnYJzkikqsGaQyK9usHdFxvL4mzpnxWPpFb4-RRu_IxUMd',
];

type TripCardItem = {
  record: TripRecord;
  tripId: string;
  title: string;
  time: string;
  duration: string;
  image: string;
  stats: string[][];
};

const formatTripDate = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T00:00:00`),
  );
};

const toTripCardItem = (trip: TripRecord, index: number): TripCardItem => {
  const stopCount = trip.itinerary?.days.reduce(
    (total, day) => total + day.stops.length,
    0,
  ) ?? 0;
  const dayCount = trip.itinerary?.days.length;
  return {
    record: trip,
    tripId: trip.tripId,
    title: trip.itinerary?.title ?? `${trip.destination} trip`,
    time: formatTripDate(trip.startDate, trip.updatedAt ?? 'Planned'),
    duration: dayCount ? `${dayCount} Days Trip` : `${trip.durationLabel} Trip`,
    image: trip.tripId === MOCK_COLLABORATIVE_TRIP_ID
      ? MOCK_COLLABORATIVE_TRIP_IMAGE_URL
      : FALLBACK_TRIP_IMAGES[index % FALLBACK_TRIP_IMAGES.length],
    stats: [
      [String(stopCount), 'stops'],
      [String(trip.travelers), 'pax'],
      [trip.itinerary ? 'Active' : 'Planned', ''],
    ],
  };
};

function TripCard({
  item,
  onOpen,
}: {
  item: TripCardItem;
  onOpen: (record: TripRecord) => void;
}) {
  const tripPath =
    item.tripId === MOCK_COLLABORATIVE_TRIP_ID
      ? '/demo/penang'
      : `/trips/${encodeURIComponent(item.tripId)}/chat`;

  return (
    <Link
      to={tripPath}
      onClick={() => onOpen(item.record)}
      aria-label={
        item.tripId === MOCK_COLLABORATIVE_TRIP_ID
          ? `Open ${item.title} collaboration`
          : `Continue ${item.title} chat`
      }
      className="flex w-full cursor-pointer items-center gap-4 rounded-[26px] border border-[#e4e2dd] bg-white p-4 text-left shadow-sm transition hover:border-[#9fe870] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300] active:scale-[0.99]"
    >
      <div className="h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[18px] bg-[#f5f4ee]"><img alt={item.title} className="h-full w-full object-cover" src={item.image} /></div>
      <div className="flex h-[110px] min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="flex items-center justify-between gap-2"><h3 className="truncate text-[17px] font-bold tracking-tight text-[#163300]">{item.title}</h3><span className="tnum shrink-0 rounded-full bg-[#f5f4ee] px-2.5 py-1 text-[11px] font-semibold text-[#6B6F66]">{item.time}</span></div>
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#163300]"><LightningIcon className="h-4 w-4 text-[#163300]" /><span>{item.duration}</span></div>
        <div className="flex items-center gap-4 text-[13px] font-semibold text-[#1b1c19]">
          {item.stats.map(([value, label], index) => <div className="flex items-center gap-1" key={`${value}-${label}`}><span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-[#FF5A5F]' : index === 1 ? 'bg-[#FF9F1C]' : 'bg-[#3A86FF]'}`} /><span className="tnum">{value}</span>{label ? <span className="font-medium text-[#6B6F66]">{label}</span> : null}</div>)}
        </div>
      </div>
    </Link>
  );
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const startNewTrip = useTripStore((state) => state.startNewTrip);
  const activateTrip = useTripStore((state) => state.activateTrip);
  const [tripItems, setTripItems] = useState<TripCardItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refreshTrips() {
      // Ensure the one local collaboration demo is available before the home
      // list reads from storage. All other trips still come from the repository
      // unchanged.
      await ensureMockCollaborativeTrip();
      const records = await tripRepository.list();
      // Keep the prototype entry easy to find while leaving the repository's
      // normal recency ordering untouched for every real trip.
      const mockTrip = records.find(
        (record) => record.tripId === MOCK_COLLABORATIVE_TRIP_ID,
      );
      const orderedRecords = mockTrip
        ? [mockTrip, ...records.filter((record) => record !== mockTrip)]
        : records;
      if (!cancelled) setTripItems(orderedRecords.map(toTripCardItem));
    }

    void refreshTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] select-none bg-[#fbf9f4] pb-28 font-sans text-[#1b1c19]">
      <main className="flex w-full flex-col gap-6 px-6 pb-6 pt-12">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#163300] text-[#9fe870] shadow-sm"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.79 12.21-5.66 2.12 2.12-5.66 5.66-2.12-2.12 5.66zM12 10.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" /></svg></div><h1 className="text-[30px] font-extrabold leading-none tracking-tight text-[#163300]">TravelBuddy</h1></div>
          <div className="flex items-center gap-2.5"><div className="flex h-10 items-center gap-1.5 rounded-full border border-[#e4e2dd] bg-white px-3.5 shadow-sm"><FlameIcon className="h-4 w-4 text-[#FF6B35]" /><span className="tnum text-[15px] font-bold leading-none text-[#163300]">15</span></div></div>
        </header>

        <section aria-label="TravelBuddy highlights" className="w-full overflow-hidden rounded-[28px] border border-[#163300] bg-[#163300] shadow-sm">
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" tabIndex={0}>
            <article className="relative flex min-w-full snap-center flex-col justify-between overflow-hidden p-6 text-white">
              <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border-[18px] border-[#9fe870]/25" aria-hidden="true" />
              <div className="absolute -bottom-20 -right-2 h-48 w-48 rounded-full bg-[#9fe870]/10" aria-hidden="true" />
              <div className="relative z-10 flex min-h-[250px] flex-col justify-between gap-8">
                <div><span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9fe870]">TravelBuddy</span><h2 className="mt-3 max-w-[280px] text-[32px] font-extrabold leading-[1.05] tracking-tight">Your next escape starts here.</h2><p className="mt-3 max-w-[260px] text-[14px] leading-6 text-white/75">Turn a destination idea into a trip your whole crew will love.</p></div>
                <Link to="/onboarding/where" onClick={startNewTrip} className="inline-flex w-max items-center rounded-full bg-[#9fe870] px-4 py-2.5 text-[13px] font-extrabold text-[#163300] transition hover:bg-[#b7f795] active:scale-[0.98]">Start planning <span className="ml-2" aria-hidden="true">→</span></Link>
              </div>
            </article>

            <article className="relative flex min-w-full snap-center flex-col justify-between overflow-hidden bg-[#eaf9dc] p-6 text-[#163300]">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#9fe870]" aria-hidden="true" /><div className="absolute right-16 top-16 h-12 w-12 rounded-full bg-white/60" aria-hidden="true" /><div className="absolute bottom-4 right-8 h-20 w-20 rounded-full border-[12px] border-[#163300]/10" aria-hidden="true" />
              <div className="relative z-10 flex min-h-[250px] flex-col justify-between gap-8"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2f6c00]">Made for the moment</span><h2 className="mt-3 max-w-[280px] text-[32px] font-extrabold leading-[1.05] tracking-tight">Less planning. More living.</h2><p className="mt-3 max-w-[260px] text-[14px] leading-6 text-[#41493a]">Keep the details together so you can stay present for the good parts.</p></div><Link to="/onboarding/where" onClick={startNewTrip} className="inline-flex w-max items-center rounded-full bg-[#163300] px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#2f6c00] active:scale-[0.98]">Build my itinerary <span className="ml-2" aria-hidden="true">→</span></Link></div>
            </article>

            <article className="relative flex min-w-full snap-center flex-col justify-between overflow-hidden bg-[#ffeadf] p-6 text-[#163300]">
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[#ff9f1c]/35" aria-hidden="true" /><div className="absolute bottom-[-38px] right-20 h-32 w-32 rounded-full border-[16px] border-[#ff6b35]/20" aria-hidden="true" />
              <div className="relative z-10 flex min-h-[250px] flex-col justify-between gap-8"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#b34a21]">Go together</span><h2 className="mt-3 max-w-[280px] text-[32px] font-extrabold leading-[1.05] tracking-tight">Make room for everyone.</h2><p className="mt-3 max-w-[260px] text-[14px] leading-6 text-[#6b4536]">Share the plan, find your rhythm, and make every stop count.</p></div><Link to="/onboarding/where" onClick={startNewTrip} className="inline-flex w-max items-center rounded-full bg-[#163300] px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#2f6c00] active:scale-[0.98]">Plan with friends <span className="ml-2" aria-hidden="true">→</span></Link></div>
            </article>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-[#163300] pb-4" aria-hidden="true"><span className="h-1.5 w-5 rounded-full bg-[#9fe870]" /><span className="h-1.5 w-1.5 rounded-full bg-white/35" /><span className="h-1.5 w-1.5 rounded-full bg-white/35" /></div>
        </section>

        <div className="pb-1 pt-2"><h2 className="text-[26px] font-extrabold tracking-tight text-[#163300]">Recent Trips</h2></div>
        <div className="flex flex-col gap-3.5">{tripItems.map((item) => <TripCard item={item} key={item.tripId} onOpen={activateTrip} />)}</div>
      </main>

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2">
        <Link to="/onboarding/where" aria-label="Add trip" onClick={startNewTrip} className="absolute -top-7 right-6 z-20 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#85dc52] bg-[#9fe870] text-[#163300] shadow-xl transition hover:shadow-2xl active:scale-95"><svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="32" aria-hidden="true"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg></Link>
        <nav className="flex w-full items-center border-t border-[#e4e2dd] bg-white/95 px-6 pb-8 pt-3 shadow-lg backdrop-blur" aria-label="Primary navigation"><div className="flex w-3/4 items-center justify-between pr-4"><button type="button" className="flex flex-col items-center gap-1 text-[#163300]" onClick={() => onNavigate('home')}><HomeIcon className="h-6 w-6" /><span className="text-[11px] font-bold tracking-tight">Home</span></button><button type="button" className="flex flex-col items-center gap-1 text-[#6B6F66] transition hover:text-[#163300]" onClick={() => onNavigate('groups')}><GroupIcon className="h-6 w-6" /><span className="text-[11px] font-medium tracking-tight">Groups</span></button><button type="button" className="flex flex-col items-center gap-1 text-[#6B6F66] transition hover:text-[#163300]" onClick={() => onNavigate('settings')}><SettingsIcon className="h-6 w-6" /><span className="text-[11px] font-medium tracking-tight">Settings</span></button></div></nav>
      </div>
    </div>
  );
}
