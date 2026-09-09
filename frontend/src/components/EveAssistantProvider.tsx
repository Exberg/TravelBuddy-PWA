import { useRef, type ReactNode } from 'react';
import { useEveAgentRuntime } from '@assistant-ui/eve';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import type { ClientSessionState, MessageStreamEvent } from 'eve/client';
import { parseSaveItineraryResult } from '../lib/itinerary';
import {
  selectTripPreferences,
  toItinerarySnapshot,
  toTripContext,
  useTripStore,
} from '../store/tripStore';
import type { LocalChat } from '../lib/chatHistory';

interface EveAssistantProviderProps {
  children: ReactNode;
  chat: LocalChat;
  onChatChange: (chatId: string, update: Partial<LocalChat>) => void;
}

/**
 * Pulls the published itinerary out of a stream event.
 *
 * The agent's `save_itinerary` tool result is the structured contract between
 * the agent and the app: capturing it here rather than only in the message UI
 * means the trip timeline updates even while the traveler is scrolled away
 * from the tool call, and it survives a chat reload through the store.
 */
function readPublishedItinerary(event: MessageStreamEvent) {
  if (event.type !== 'action.result') return null;

  const { result } = event.data;
  if (
    result.kind !== 'tool-result' ||
    result.toolName !== 'save_itinerary' ||
    result.isError === true
  ) {
    return null;
  }

  return parseSaveItineraryResult(result.output);
}

export function EveAssistantProvider({
  children,
  chat,
  onChatChange,
}: EveAssistantProviderProps) {
  const eventsRef = useRef<MessageStreamEvent[]>([...chat.events]);
  const sessionRef = useRef<ClientSessionState | undefined>(chat.session);
  const configuredHost = import.meta.env.VITE_EVE_URL?.trim();

  const runtime = useEveAgentRuntime({
    ...(configuredHost ? { host: configuredHost } : {}),
    initialEvents: chat.events,
    initialSession: chat.session,
    resume: chat.session !== undefined,
    prepareSend: (input) => ({
      ...input,
      clientContext: (() => {
        const tripState = useTripStore.getState();
        return {
          surface: 'TravelBuddy PWA',
          travelBuddy: {
            model: tripState.model,
            itinerarySnapshot: toItinerarySnapshot(tripState),
            // Everything the onboarding screens collected. The agent treats the
            // destination, dates, budget, party size and must-visit places as
            // hard constraints on any itinerary it builds.
            //
            trip: toTripContext(selectTripPreferences(tripState)),
            today: new Date().toISOString().slice(0, 10),
          },
        };
      })(),
    }),
    onEvent: (event) => {
      eventsRef.current = [...eventsRef.current, event];

      const published = readPublishedItinerary(event);
      if (published) {
        useTripStore.getState().publishItinerary(published.itinerary, {
          revision: published.revision,
          updatedAt: published.updatedAt,
          changeNote: published.changeNote,
        });
      }
    },
    onSessionChange: (session) => {
      sessionRef.current = session;
      onChatChange(chat.id, {
        session,
        updatedAt: new Date().toISOString(),
      });
    },
    onFinish: (snapshot) => {
      eventsRef.current = [...snapshot.events];
      sessionRef.current = snapshot.session;
      onChatChange(chat.id, {
        events: snapshot.events,
        session: snapshot.session,
        updatedAt: new Date().toISOString(),
      });
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
