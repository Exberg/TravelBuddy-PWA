import { beforeEach, describe, expect, test } from 'bun:test';
import { LocalConversationRepository } from './chatHistory';

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
    expect(JSON.parse(migrated ?? '{}').chats[0].events).toEqual([]);
    expect(JSON.parse(migrated ?? '{}').chats[0].session.streamIndex).toBe(0);
  });
});
