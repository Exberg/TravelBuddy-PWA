import type { MessageStreamEvent } from 'eve/client';
import { MOCK_COLLABORATIVE_TRIP } from './mockCollaborativeTrip';

export const MOCK_COLLABORATIVE_CHAT_ID = 'demo-penang-crew-chat';

const TURN_ID = 'demo-penang-turn-1';
const TOOL_CALL_ID = 'demo-save-penang-itinerary';
const EVENT_TIME = '2026-09-10T12:30:00.000Z';

function event<T extends Omit<MessageStreamEvent, 'meta'>>(
  sequence: number,
  value: T,
): MessageStreamEvent {
  return {
    ...value,
    meta: {
      id: `demo-penang-event-${sequence}`,
      at: EVENT_TIME,
    },
  } as MessageStreamEvent;
}

/**
 * A small completed Eve stream for the built-in Penang collaboration demo.
 * Keeping the tool lifecycle real makes assistant-ui render the same artifact
 * card used by a live save_itinerary call, including its open action.
 */
export const MOCK_COLLABORATIVE_CHAT_EVENTS: readonly MessageStreamEvent[] = [
  event(1, {
    type: 'message.received',
    data: {
      message: 'Can you pull together a relaxed weekend plan for the Penang crew?',
      parts: [{ type: 'text', text: 'Can you pull together a relaxed weekend plan for the Penang crew?' }],
      sequence: 1,
      turnId: TURN_ID,
    },
  }),
  event(2, {
    type: 'actions.requested',
    data: {
      actions: [{
        kind: 'tool-call',
        callId: TOOL_CALL_ID,
        toolName: 'save_itinerary',
        input: { destination: 'George Town, Penang, Malaysia' },
      }],
      sequence: 2,
      stepIndex: 0,
      turnId: TURN_ID,
    },
  }),
  event(3, {
    type: 'action.result',
    data: {
      result: {
        kind: 'tool-result',
        callId: TOOL_CALL_ID,
        toolName: 'save_itinerary',
        output: {
          status: 'published',
          revision: 1,
          updatedAt: EVENT_TIME,
          currency: 'MYR',
          changeNote: 'Created a shared weekend itinerary for the Penang Crew.',
          itinerary: MOCK_COLLABORATIVE_TRIP.itinerary,
        },
      },
      sequence: 3,
      stepIndex: 0,
      status: 'completed',
      turnId: TURN_ID,
    },
  }),
  event(4, {
    type: 'message.completed',
    data: {
      finishReason: 'stop',
      message: 'I mapped out a relaxed three-day plan for the Penang Crew, with heritage walks, local food, Penang Hill, and a Batu Ferringhi sunset. Open the itinerary card to explore each day.',
      sequence: 4,
      stepIndex: 1,
      turnId: TURN_ID,
    },
  }),
  event(5, {
    type: 'turn.completed',
    data: { sequence: 5, turnId: TURN_ID },
  }),
];
