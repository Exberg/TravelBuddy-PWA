import type { ClientSessionState, MessageStreamEvent } from 'eve/client';
import { MOCK_COLLABORATIVE_TRIP_ID } from '../data/mockCollaborativeTrip';

const CHAT_HISTORY_KEY = 'travelbuddy:eve-chats:v3';
const PREVIOUS_CHAT_HISTORY_KEY = 'travelbuddy:eve-chats:v2';
const LEGACY_CHAT_KEY = 'travelbuddy:eve-chat:v1';

export interface LocalChat {
  id: string;
  tripId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** Cached UI projection; Eve remains the durable event-log owner. */
  events: readonly MessageStreamEvent[];
  session?: ClientSessionState;
  /** True only while a durable turn may still be running. */
  resumeOnMount: boolean;
}

export interface LocalChatHistory {
  activeChatId: string;
  chats: LocalChat[];
}

interface StoredChatHistory extends LocalChatHistory {
  version: 2 | 3;
}

interface LegacySavedChat {
  events?: readonly MessageStreamEvent[];
  session?: ClientSessionState;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ??
    `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createLocalChat(tripId: string, destination: string): LocalChat {
  const now = new Date().toISOString();
  return {
    id: createId(),
    tripId,
    title: `${destination.trim() || 'New'} trip`,
    createdAt: now,
    updatedAt: now,
    events: [],
    resumeOnMount: false,
  };
}

function isSession(value: unknown): value is ClientSessionState {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Partial<ClientSessionState>;
  return (
    typeof session.sessionId === 'string' &&
    typeof session.streamIndex === 'number'
  );
}

function parseHistory(value: string | null): LocalChatHistory | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredChatHistory>;
    if (
      (parsed.version !== 2 && parsed.version !== 3) ||
      typeof parsed.activeChatId !== 'string' ||
      !Array.isArray(parsed.chats)
    ) {
      return null;
    }

    const chats = parsed.chats.flatMap((value) => {
      if (typeof value !== 'object' || value === null) return [];
      const chat = value as Partial<LocalChat>;
      if (
        typeof chat.id !== 'string' ||
        typeof chat.title !== 'string' ||
        !Array.isArray(chat.events)
      ) {
        return [];
      }

      const now = new Date().toISOString();
      return [{
        id: chat.id,
        ...(typeof chat.tripId === 'string' ? { tripId: chat.tripId } : {}),
        title: chat.title,
        createdAt: typeof chat.createdAt === 'string' ? chat.createdAt : now,
        updatedAt: typeof chat.updatedAt === 'string' ? chat.updatedAt : now,
        events: chat.events,
        ...(isSession(chat.session) ? { session: chat.session } : {}),
        resumeOnMount:
          typeof chat.resumeOnMount === 'boolean'
            ? chat.resumeOnMount
            : isSession(chat.session) && chat.events.length === 0,
      } satisfies LocalChat];
    });
    if (chats.length === 0) return null;

    return {
      activeChatId: chats.some((chat) => chat.id === parsed.activeChatId)
        ? parsed.activeChatId
        : chats[0].id,
      chats,
    };
  } catch {
    return null;
  }
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Loads the versioned local chat index and selects the single chat assigned to
 * the active trip. Older chats without a tripId are migrated without dropping
 * their events or Eve session.
 */
export interface ConversationRepository {
  load(tripId: string, destination: string): Promise<LocalChatHistory>;
  save(history: LocalChatHistory): Promise<void>;
}

export class LocalConversationRepository implements ConversationRepository {
  async load(
    tripId: string,
    destination: string,
  ): Promise<LocalChatHistory> {
    const current = parseHistory(readStorage(CHAT_HISTORY_KEY));
    const stored = current ?? parseHistory(readStorage(PREVIOUS_CHAT_HISTORY_KEY));
    if (stored) {
      let changed = current === null;
      const migrated = stored.chats.map((chat) => {
        if (chat.tripId) return chat;
        changed = true;
        return { ...chat, tripId: `legacy-${chat.id}` };
      });

      let activeChat = migrated.find((chat) => chat.tripId === tripId);
      const expectedTitle = `${destination.trim() || 'New'} trip`;
      if (
        activeChat &&
        tripId === MOCK_COLLABORATIVE_TRIP_ID &&
        activeChat.title !== expectedTitle
      ) {
        // Early versions could associate the previously active destination's
        // Eve session with the demo id. Replace only that contaminated demo
        // conversation; unrelated trip histories must remain untouched.
        activeChat = createLocalChat(tripId, destination);
        migrated.unshift(activeChat);
        changed = true;
      }
      if (!activeChat) {
        // Unscoped v2 chats are preserved under a legacy id, but must never be
        // adopted by a new trip: doing so replays the previous trip's thread.
        activeChat = createLocalChat(tripId, destination);
        migrated.unshift(activeChat);
        changed = true;
      }

      const seenTripIds = new Set<string>();
      const chats = migrated.filter((chat) => {
        if (!chat.tripId || seenTripIds.has(chat.tripId)) return false;
        seenTripIds.add(chat.tripId);
        return true;
      });
      const history = { activeChatId: activeChat.id, chats };
      if (
        changed ||
        stored.activeChatId !== activeChat.id ||
        chats.length !== stored.chats.length
      ) {
        await this.save(history);
      }
      return history;
    }

    const activeChat = createLocalChat(tripId, destination);
    const chats: LocalChat[] = [activeChat];

    try {
      const legacyValue = readStorage(LEGACY_CHAT_KEY);
      if (legacyValue) {
        const legacy = JSON.parse(legacyValue) as LegacySavedChat;
        const hasEvents =
          Array.isArray(legacy.events) && legacy.events.length > 0;
        const hasSession = isSession(legacy.session);

        if (hasEvents || hasSession) {
          const now = new Date().toISOString();
          chats.push({
            id: createId(),
            tripId: `legacy-${Date.now()}`,
            title: 'Previous TravelBuddy chat',
            createdAt: now,
            updatedAt: now,
            events: hasEvents ? legacy.events! : [],
            ...(hasSession ? { session: legacy.session } : {}),
            resumeOnMount: hasSession && !hasEvents,
          });
        }
      }
    } catch {
      // A malformed legacy value should not prevent a clean chat from opening.
    }

    const history = { activeChatId: activeChat.id, chats };
    await this.save(history);
    return history;
  }

  async save(history: LocalChatHistory) {
    try {
      const stored: StoredChatHistory = {
        version: 3,
        activeChatId: history.activeChatId,
        chats: history.chats.map((chat) => ({
          ...chat,
          // Cache the last completed projection so opening a saved trip is a
          // read-only restore. Eve remains the durable source of truth.
          events: chat.events,
        })),
      };
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(stored));
    } catch {
      // Chat still works when local storage is unavailable or full.
    }
  }
}

export const conversationRepository: ConversationRepository =
  new LocalConversationRepository();

export function loadChatHistory(tripId: string, destination: string) {
  return conversationRepository.load(tripId, destination);
}

export function saveChatHistory(history: LocalChatHistory) {
  return conversationRepository.save(history);
}

export function countUserMessages(chat: LocalChat) {
  return chat.events.reduce(
    (count, event) => count + (event.type === 'message.received' ? 1 : 0),
    0,
  );
}
