import { beforeEach, describe, expect, test } from 'bun:test';
import { LocalConversationRepository } from './chatHistory';
import { MOCK_COLLABORATIVE_TRIP_ID } from '../data/mockCollaborativeTrip';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.assign(globalThis, { window: { localStorage: storage } });
});

describe('LocalConversationRepository', () => {
  test('creates one resumable conversation for a trip', async () => {
    const repository = new LocalConversationRepository();
    const history = await repository.load('trip-1', 'Penang');

    expect(history.chats).toHaveLength(1);
    expect(history.chats[0]?.tripId).toBe('trip-1');
    expect(history.chats[0]?.events).toEqual([]);
    expect(history.chats[0]?.resumeOnMount).toBe(false);
  });

  test('migrates v2 chats without copying their itinerary snapshot', async () => {
    storage.setItem(
      'travelbuddy:eve-chats:v2',
      JSON.stringify({
        version: 2,
        activeChatId: 'chat-1',
        chats: [
          {
            id: 'chat-1',
            tripId: 'trip-1',
            title: 'Penang trip',
            createdAt: '2026-09-09T10:00:00.000Z',
            updatedAt: '2026-09-09T11:00:00.000Z',
            events: [{ type: 'message.received', data: { message: 'hello' } }],
            session: { sessionId: 'wrun_123', streamIndex: 4 },
            itinerary: { revision: 99, itinerary: { title: 'stale' } },
          },
        ],
      }),
    );

    const repository = new LocalConversationRepository();
    const history = await repository.load('trip-1', 'Penang');
    const migrated = storage.getItem('travelbuddy:eve-chats:v3');

    expect(history.chats[0]?.session?.sessionId).toBe('wrun_123');
    expect(migrated).not.toContain('"itinerary"');
    expect(JSON.parse(migrated ?? '{}').chats[0].events).toHaveLength(1);
    expect(JSON.parse(migrated ?? '{}').chats[0].session.streamIndex).toBe(4);
  });

  test('restores completed chat events without resuming the turn', async () => {
    storage.setItem(
      'travelbuddy:eve-chats:v3',
      JSON.stringify({
        version: 3,
        activeChatId: 'chat-1',
        chats: [
          {
            id: 'chat-1',
            tripId: 'trip-1',
            title: 'Penang trip',
            createdAt: '2026-09-09T10:00:00.000Z',
            updatedAt: '2026-09-09T11:00:00.000Z',
            events: [{ type: 'turn.completed', data: { turnId: 'turn-1', sequence: 1 } }],
            session: { sessionId: 'wrun_123', streamIndex: 4 },
            resumeOnMount: false,
          },
        ],
      }),
    );

    const history = await new LocalConversationRepository().load('trip-1', 'Penang');

    expect(history.chats[0]?.events).toHaveLength(1);
    expect(history.chats[0]?.resumeOnMount).toBe(false);
  });

  test('replaces an Austria conversation previously attached to the Penang demo', async () => {
    storage.setItem(
      'travelbuddy:eve-chats:v3',
      JSON.stringify({
        version: 3,
        activeChatId: 'contaminated-demo-chat',
        chats: [
          {
            id: 'contaminated-demo-chat',
            tripId: MOCK_COLLABORATIVE_TRIP_ID,
            title: 'Austria trip',
            createdAt: '2026-09-09T10:00:00.000Z',
            updatedAt: '2026-09-09T11:00:00.000Z',
            events: [{ type: 'message.received', data: { message: 'Austria' } }],
            session: { sessionId: 'wrun_austria', streamIndex: 4 },
            resumeOnMount: false,
          },
          {
            id: 'real-trip-chat',
            tripId: 'real-trip',
            title: 'Tokyo trip',
            createdAt: '2026-09-08T10:00:00.000Z',
            updatedAt: '2026-09-08T11:00:00.000Z',
            events: [],
            resumeOnMount: false,
          },
        ],
      }),
    );

    const history = await new LocalConversationRepository().load(
      MOCK_COLLABORATIVE_TRIP_ID,
      'Penang',
    );
    const demoChat = history.chats.find(
      (chat) => chat.tripId === MOCK_COLLABORATIVE_TRIP_ID,
    );

    expect(demoChat?.title).toBe('Penang trip');
    expect(demoChat?.events).toEqual([]);
    expect(demoChat?.session).toBeUndefined();
    expect(history.chats.some((chat) => chat.id === 'real-trip-chat')).toBe(true);
  });
});
