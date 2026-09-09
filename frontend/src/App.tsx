import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ScreenId } from './types';
import { WhereToScreen } from './components/WhereToScreen';
import { WhenScreen } from './components/WhenScreen';
import { BudgetScreen } from './components/BudgetScreen';
import { WhoScreen } from './components/WhoScreen';
import { MapScreen } from './components/MapScreen';
import { HomeScreen } from './components/HomeScreen';
import { QuickNavigator } from './components/QuickNavigator';
import { GroupsSettingsScreen } from './components/GroupsSettingsScreen';
import { useTripStore } from './store/tripStore';

const ChatScreen = lazy(async () => {
  const module = await import('./components/ChatScreen');
  return { default: module.ChatScreen };
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
      content = <MapScreen onNavigate={onNavigate} />;
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
      content = <GroupsSettingsScreen screen="groups" onNavigate={onNavigate} />;
      break;
    case 'settings':
      content = <GroupsSettingsScreen screen="settings" onNavigate={onNavigate} />;
      break;
  }

  return (
    <>
      {content}
      {screen !== 'home' && screen !== 'groups' && screen !== 'settings' ? (
        <QuickNavigator currentScreen={screen} onNavigate={onNavigate} />
      ) : null}
    </>
  );
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
          <Route path="/groups" element={<ScreenView screen="groups" />} />
          <Route path="/settings" element={<ScreenView screen="settings" />} />
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
