import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScreenId } from '../types';
import {
  isMeaningfulTrip,
  selectTripRecord,
  useTripStore,
  type TripRecord,
} from '../store/tripStore';
import { tripRepository } from '../repositories/tripRepository';

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

const AnalyticsIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>
);

const SettingsIcon = ({ className = '' }: IconProps) => (
  <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);

function Ring({ color, track, offset, children, large = false }: { color: string; track: string; offset: number; children: ReactNode; large?: boolean }) {
  const size = large ? 'h-28 w-28' : 'h-16 w-16';
  const viewBox = large ? '0 0 100 100' : '0 0 60 60';
  const center = large ? 50 : 30;
  const radius = large ? 38 : 23;
  const circumference = large ? 238.76 : 144.5;
  return (
    <div className={`relative ${size} flex shrink-0 items-center justify-center`}>
      <svg className="h-full w-full -rotate-90 transform" viewBox={viewBox}>
        <circle cx={center} cy={center} fill="transparent" r={radius} stroke={track} strokeWidth={large ? 12 : 6.5} />
        <circle cx={center} cy={center} fill="transparent" r={radius} stroke={color} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth={large ? 12 : 6.5} />
      </svg>
      {children}
    </div>
  );
}

const MacroCard = ({ value, label, color, track, icon, offset }: { value: string; label: string; color: string; track: string; icon: ReactNode; offset: number }) => (
  <div className="flex flex-col items-center rounded-[24px] border border-[#e4e2dd] bg-white px-3 py-5 text-center shadow-sm">
    <div className="tnum text-[22px] font-bold leading-tight tracking-tight text-[#163300]">{value}</div>
    <div className="mt-0.5 text-[12px] font-medium text-[#6B6F66]">{label}</div>
    <Ring color={color} track={track} offset={offset}>
      <div className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: track }}>
        {icon}
      </div>
    </Ring>
  </div>
);

const Nutrient = ({ color, children, icon }: { color: string; children: ReactNode; icon: ReactNode }) => (
  <div className="flex items-center gap-1"><span style={{ color }}>{icon}</span><span className="tnum">{children}</span></div>
);

const FALLBACK_TRIP_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKw475tHkL7l-w8Q22z-42tEXHSwni9b4TNs9tcutCdw8q4pO62EU762ZyHpB5mqhEmYxq5gyfJRt2pmkblstyh8N1Pm1X9lXqUzRk_SdVlETVIf50ecoutTdu02c47QziXvvw1sK80tl5iiEow-3KstWhOyi_R6tPI3mNhYoujz8IbowNb2g2ujlN1m1wwaU3wwPVnvDwrQn9yPNfefalpAcE7IbP5i2ncmydEt1XZ73TfpLrpeVW',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAIATePhMtj3IT6r3rRlRwLPHjbnFcPTz2HgRtGLnbWcuAQ5RDZ4ugryPpwIlLzTF7tbeotLvN2SDcWeVURGxfUjRKeJ-VvY38uc7Zrv0Lsa6Q7D-n4y4tIuKEXa02UPDZpLWb7IFeqago2anvChrU0cUiQI2gu23X9hUNVFZsVHZN75pub-ywufiDbCb6ICHsWXVQlcRrnYJzkikqsGaQyK9usHdFxvL4mzpnxWPpFb4-RRu_IxUMd',
];

type TripCardItem = {
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
    tripId: trip.tripId,
    title: trip.itinerary?.title ?? `${trip.destination} trip`,
    time: formatTripDate(trip.startDate, trip.updatedAt ?? 'Planned'),
    duration: dayCount ? `${dayCount} Days Trip` : `${trip.durationLabel} Trip`,
    image: FALLBACK_TRIP_IMAGES[index % FALLBACK_TRIP_IMAGES.length],
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
  onOpen: (tripId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.tripId)}
      aria-label={`Continue ${item.title} chat`}
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
    </button>
  );
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const tripState = useTripStore();
  const startNewTrip = useTripStore((state) => state.startNewTrip);
  const selectTrip = useTripStore((state) => state.selectTrip);
  const [tripItems, setTripItems] = useState<TripCardItem[]>([]);

  const openTripChat = async (tripId: string) => {
    if (await selectTrip(tripId)) onNavigate('chat');
  };

  useEffect(() => {
    let cancelled = false;

    async function refreshTrips() {
      if (isMeaningfulTrip(tripState)) {
        await tripRepository.upsert(selectTripRecord(tripState));
      }
      const records = await tripRepository.list();
      if (!cancelled) setTripItems(records.map(toTripCardItem));
    }

    void refreshTrips();
    return () => {
      cancelled = true;
    };
  }, [tripState]);

  return (
    <div className="min-h-screen select-none bg-[#fbf9f4] pb-28 font-sans text-[#1b1c19]">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pb-6 pt-12">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#163300] text-[#9fe870] shadow-sm"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.79 12.21-5.66 2.12 2.12-5.66 5.66-2.12-2.12 5.66zM12 10.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" /></svg></div><h1 className="text-[30px] font-extrabold leading-none tracking-tight text-[#163300]">TravelBuddy</h1></div>
          <div className="flex items-center gap-2.5"><div className="flex h-10 items-center gap-1.5 rounded-full border border-[#e4e2dd] bg-white px-3.5 shadow-sm"><FlameIcon className="h-4 w-4 text-[#FF6B35]" /><span className="tnum text-[15px] font-bold leading-none text-[#163300]">15</span></div></div>
        </header>

        <section className="flex w-full items-center justify-between overflow-hidden rounded-[28px] border border-[#e4e2dd] bg-white p-6 shadow-sm"><div className="flex flex-col justify-center"><div className="tnum text-[60px] font-bold leading-none tracking-tight text-[#163300]">42h</div><div className="mt-2 text-[15px] font-medium text-[#6B6F66]">Time saved</div><span className="mt-2.5 inline-flex w-max rounded-full bg-[#eaf9dc] px-2.5 py-1 text-xs font-semibold text-[#163300]">+6.5h this week</span></div><Ring color="#9fe870" track="#eef5e7" offset={55} large><div className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e2dd] bg-[#fbf9f4] shadow-inner"><ClockIcon className="h-5 w-5 text-[#163300]" /></div></Ring></section>

        <div className="grid w-full grid-cols-3 gap-3"><MacroCard value="RM 1.8k" label="Budget saved" color="#FF6B55" track="#ffe9e4" offset={35} icon={<WalletIcon className="h-3.5 w-3.5 text-[#FF6B55]" />} /><MacroCard value="14" label="Places pinned" color="#FF9F1C" track="#fff2dd" offset={45} icon={<PinIcon className="h-3.5 w-3.5 text-[#FF9F1C]" />} /><MacroCard value="96%" label="Friends going" color="#2E86DE" track="#e5f1fd" offset={15} icon={<CheckIcon className="h-3.5 w-3.5 text-[#2E86DE]" />} /></div>

        <div className="pb-1 pt-2"><h2 className="text-[26px] font-extrabold tracking-tight text-[#163300]">Recent Trips</h2></div>
        <div className="flex flex-col gap-3.5">{tripItems.map((item) => <TripCard item={item} onOpen={(tripId) => void openTripChat(tripId)} key={item.tripId} />)}</div>
      </main>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center"><div className="pointer-events-auto relative w-full max-w-md"><button aria-label="Log food" onClick={() => {
          startNewTrip();
          onNavigate('where');
        }} className="absolute -top-7 right-6 z-20 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-[#85dc52] bg-[#9fe870] text-[#163300] shadow-xl transition hover:shadow-2xl active:scale-95"><svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="32" aria-hidden="true"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg></button><nav className="flex w-full items-center border-t border-[#e4e2dd] bg-white/95 px-6 pb-8 pt-3 shadow-lg backdrop-blur" aria-label="Primary navigation"><div className="flex w-3/4 items-center justify-between pr-4"><button type="button" className="flex flex-col items-center gap-1 text-[#163300]" onClick={() => onNavigate('home')}><HomeIcon className="h-6 w-6" /><span className="text-[11px] font-bold tracking-tight">Home</span></button><button type="button" className="flex flex-col items-center gap-1 text-[#6B6F66] transition hover:text-[#163300]" onClick={() => onNavigate('groups')}><AnalyticsIcon className="h-6 w-6" /><span className="text-[11px] font-medium tracking-tight">Groups</span></button><button type="button" className="flex flex-col items-center gap-1 text-[#6B6F66] transition hover:text-[#163300]" onClick={() => onNavigate('settings')}><SettingsIcon className="h-6 w-6" /><span className="text-[11px] font-medium tracking-tight">Settings</span></button></div></nav></div></div>
    </div>
  );
}
