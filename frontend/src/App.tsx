import { lazy, Suspense, useState } from 'react';
import { ScreenId } from './types';
import { WhereToScreen } from './components/WhereToScreen';
import { WhenScreen } from './components/WhenScreen';
import { BudgetScreen } from './components/BudgetScreen';
import { WhoScreen } from './components/WhoScreen';
import { MapScreen } from './components/MapScreen';
import { QuickNavigator } from './components/QuickNavigator';

const ChatScreen = lazy(async () => {
  const module = await import('./components/ChatScreen');
  return { default: module.ChatScreen };
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('where');
  const [selectedDestination, setSelectedDestination] = useState('Penang');
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(
    new Set(['place-1', 'place-2', 'place-3'])
  );

  const handleTogglePlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'where':
        return (
          <WhereToScreen
            onNavigate={setCurrentScreen}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
          />
        );
      case 'when':
        return <WhenScreen onNavigate={setCurrentScreen} />;
      case 'budget':
        return <BudgetScreen onNavigate={setCurrentScreen} />;
      case 'who':
        return <WhoScreen onNavigate={setCurrentScreen} />;
      case 'map':
        return (
          <MapScreen
            onNavigate={setCurrentScreen}
            selectedPlaceIds={selectedPlaceIds}
            onTogglePlace={handleTogglePlace}
          />
        );
      case 'chat':
        return (
          <Suspense
            fallback={
              <div className="flex h-[100dvh] w-full max-w-[430px] items-center justify-center bg-[#FBF9F4] font-label text-sm text-[#41493A]">
                Preparing your trip chat…
              </div>
            }
          >
            <ChatScreen
              destination={selectedDestination}
              onNavigate={setCurrentScreen}
            />
          </Suspense>
        );
      default:
        return (
          <WhereToScreen
            onNavigate={setCurrentScreen}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] flex justify-center selection:bg-[#9FE870] selection:text-[#163300]">
      {renderScreen()}
      <QuickNavigator
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
}
