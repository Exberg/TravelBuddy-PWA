import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ScreenId } from './types';
import { WhereToScreen } from './components/WhereToScreen';
import { WhenScreen } from './components/WhenScreen';
import { BudgetScreen } from './components/BudgetScreen';
import { WhoScreen } from './components/WhoScreen';
import { HomeScreen } from './components/HomeScreen';
import { QuickNavigator } from './components/QuickNavigator';
import { SettingsScreen } from './components/SettingsScreen';
import { TripSettingsScreen } from './components/TripSettingsScreen';
import { useTripStore } from './store/tripStore';
import {
  MOCK_COLLABORATIVE_TRIP,
  MOCK_COLLABORATIVE_TRIP_ID,
} from './data/mockCollaborativeTrip';

const ChatScreen = lazy(async () => {
  const module = await import('./components/ChatScreen');
  return { default: module.ChatScreen };
});

const MapScreen = lazy(async () => {
  const module = await import('./components/MapScreen');
  return { default: module.MapScreen };
});

const SCREEN_ROUTES: Record<ScreenId, string> = {
  home: '/',
  where: '/onboarding/where',
  when: '/onboarding/when',
  budget: '/onboarding/budget',
  who: '/onboarding/who',
  map: '/map',
  chat: '/chat',
  groups: '/groups',
  settings: '/settings',
  'trip-settings': '/trip-settings',
};

interface ScreenViewProps {
  screen: ScreenId;
}

function ScreenView({ screen }: ScreenViewProps) {
  const navigate = useNavigate();
  const onNavigate = (nextScreen: ScreenId) =>
    navigate(SCREEN_ROUTES[nextScreen]);

  let content;
  switch (screen) {
    case 'home':
      content = <HomeScreen onNavigate={onNavigate} />;
      break;
    case 'where':
      content = <WhereToScreen onNavigate={onNavigate} />;
      break;
    case 'when':
      content = <WhenScreen onNavigate={onNavigate} />;
      break;
    case 'budget':
      content = <BudgetScreen onNavigate={onNavigate} />;
      break;
    case 'who':
      content = <WhoScreen onNavigate={onNavigate} />;
      break;
    case 'map':
      content = (
        <Suspense
          fallback={
            <div className="flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
              Preparing your map…
            </div>
          }
        >
          <MapScreen onNavigate={onNavigate} />
        </Suspense>
      );
      break;
    case 'chat':
      content = (
        <Suspense
          fallback={
            <div className="flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
              Preparing your trip chat…
            </div>
          }
        >
          <ChatScreen onNavigate={onNavigate} />
        </Suspense>
      );
      break;
    case 'groups':
      content = <SettingsScreen screen="groups" onNavigate={onNavigate} />;
      break;
    case 'settings':
      content = <SettingsScreen screen="settings" onNavigate={onNavigate} />;
      break;
    case 'trip-settings':
      content = <TripSettingsScreen onNavigate={onNavigate} />;
      break;
  }

  return (
    <>
      {content}
      {screen !== 'home' && screen !== 'groups' && screen !== 'settings' && screen !== 'trip-settings' ? (
        <QuickNavigator currentScreen={screen} onNavigate={onNavigate} />
      ) : null}
    </>
  );
}

function SharedTripRoute({ screen }: { screen: 'who' | 'chat' }) {
  const { tripId } = useParams<{ tripId: string }>();
  const selectTrip = useTripStore((state) => state.selectTrip);
  const activateTrip = useTripStore((state) => state.activateTrip);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      setStatus('loading');
      if (!tripId) {
        setStatus('missing');
        return;
      }

      try {
        // The built-in collaboration demo is a static app asset. Loading it
        // directly makes copied links independent of browser persistence.
        if (tripId === MOCK_COLLABORATIVE_TRIP_ID) {
          activateTrip(MOCK_COLLABORATIVE_TRIP);
          if (!cancelled) setStatus('ready');
          return;
        }
        const selected = await selectTrip(tripId);
        // Home activates the exact record it rendered before navigation. Keep
        // that valid snapshot if storage changed between the click and route.
        const isAlreadyActive = useTripStore.getState().tripId === tripId;
        if (!cancelled) setStatus(selected || isAlreadyActive ? 'ready' : 'missing');
      } catch {
        if (!cancelled) setStatus('missing');
      }
    }

    void loadTrip();
    return () => {
      cancelled = true;
    };
  }, [activateTrip, selectTrip, tripId]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
        Restoring your trip…
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <div className="flex min-h-screen w-full max-w-[430px] flex-col items-center justify-center gap-4 bg-[#FBF9F4] px-6 text-center font-label text-[#163300]">
        <h1 className="text-xl font-bold">Trip not found</h1>
        <p className="text-sm text-[#41493A]">This trip may have been removed or is unavailable.</p>
        <Link to="/" className="rounded-full bg-[#9FE870] px-5 py-2.5 text-sm font-bold text-[#163300] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300]">
          Back to home
        </Link>
      </div>
    );
  }

  return <ScreenView screen={screen} />;
}

function MockCollaborativeTripRoute() {
  const activateTrip = useTripStore((state) => state.activateTrip);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Route entry is the source of truth, so the demo cannot inherit whichever
    // trip happened to be active when its card was pressed.
    activateTrip(MOCK_COLLABORATIVE_TRIP);
    setReady(true);
  }, [activateTrip]);

  if (!ready) {
    return (
      <div className="flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
        Opening the Penang crew trip…
      </div>
    );
  }

  return <ScreenView screen="chat" />;
}

export default function App() {
  const storageHydrated = useTripStore((state) => state.storageHydrated);
  const hydrateFromRepository = useTripStore(
    (state) => state.hydrateFromRepository,
  );

  useEffect(() => {
    void hydrateFromRepository();
  }, [hydrateFromRepository]);

  if (!storageHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
        Restoring your trips…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FBF9F4] flex justify-center selection:bg-[#9FE870] selection:text-[#163300]">
        <Routes>
          <Route path="/" element={<ScreenView screen="home" />} />
          <Route path="/onboarding/where" element={<ScreenView screen="where" />} />
          <Route path="/onboarding/when" element={<ScreenView screen="when" />} />
          <Route path="/onboarding/budget" element={<ScreenView screen="budget" />} />
          <Route path="/onboarding/who" element={<ScreenView screen="who" />} />
          <Route path="/map" element={<ScreenView screen="map" />} />
          <Route path="/chat" element={<ScreenView screen="chat" />} />
          <Route path="/trips/:tripId/chat" element={<SharedTripRoute screen="chat" />} />
          {/* The prototype share link returns collaborators to onboarding so
              they can review the shared budget and traveler preferences before
              continuing to must-haves and the editable itinerary. */}
          <Route path="/trips/:tripId/onboarding/who" element={<SharedTripRoute screen="who" />} />
          <Route path="/demo/penang" element={<MockCollaborativeTripRoute />} />
          <Route path="/groups" element={<ScreenView screen="groups" />} />
          <Route path="/settings" element={<ScreenView screen="settings" />} />
          <Route path="/trip-settings" element={<ScreenView screen="trip-settings" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: 'font-label',
          }}
        />
      </div>
    </BrowserRouter>
  );
}
