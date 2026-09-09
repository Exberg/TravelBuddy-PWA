import { useRef, useState, type ReactNode } from 'react';
import { useEveAgentRuntime } from '@assistant-ui/eve';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import type { ClientSessionState, MessageStreamEvent } from 'eve/client';

const STORAGE_KEY = 'travelbuddy:eve-chat:v1';

interface SavedChat {
  events: readonly MessageStreamEvent[];
  session?: ClientSessionState;
}

interface EveAssistantProviderProps {
  children: ReactNode;
  destination: string;
}

function readSavedChat(): SavedChat {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return { events: [] };

    const parsed = JSON.parse(value) as Partial<SavedChat>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      session: parsed.session,
    };
  } catch {
    return { events: [] };
  }
}

function saveChat(chat: SavedChat) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Chat still works when storage is unavailable or full; it just will not
    // resume from this browser after a reload.
  }
}

export function EveAssistantProvider({
  children,
  destination,
}: EveAssistantProviderProps) {
  const [savedChat] = useState(readSavedChat);
  const eventsRef = useRef<MessageStreamEvent[]>([...savedChat.events]);
  const sessionRef = useRef<ClientSessionState | undefined>(savedChat.session);
  const configuredHost = import.meta.env.VITE_EVE_URL?.trim();

  const runtime = useEveAgentRuntime({
    ...(configuredHost ? { host: configuredHost } : {}),
    initialEvents: savedChat.events,
    initialSession: savedChat.session,
    resume: savedChat.session !== undefined,
    prepareSend: (input) => ({
      ...input,
      clientContext: {
        destination,
        surface: 'TravelBuddy PWA',
      },
    }),
    onEvent: (event) => {
      eventsRef.current = [...eventsRef.current, event];
      saveChat({ events: eventsRef.current, session: sessionRef.current });
    },
    onSessionChange: (session) => {
      sessionRef.current = session;
      saveChat({ events: eventsRef.current, session });
    },
    onFinish: (snapshot) => {
      eventsRef.current = [...snapshot.events];
      sessionRef.current = snapshot.session;
      saveChat({ events: snapshot.events, session: snapshot.session });
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
