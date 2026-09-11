// Helpers for evals that exercise delegated (subagent-backed) planning.
//
// Declared subagents in eve always run as durable background tasks: the
// `day_planner` call returns `{ status: "working" }` immediately and the
// dispatching turn ends there. Each child's result arrives later as a
// task-triggered notification that starts a NEW turn on the same session.
//
// `t.send()` resolves at the first turn boundary, so an eval that only inspects
// that turn can never see the merge, the review, or the final `save_itinerary`.
// It would pass a coordinator that dispatches planners and then abandons the
// trip — which is exactly the failure this helper exists to catch.

import type { EveEvalContext, EveEvalToolCall, EveEvalTurn } from "eve/evals";

export interface FollowedPlanning {
  /** The notification-driven turns consumed after the dispatch turn. */
  readonly turns: readonly EveEvalTurn[];
  /** Tool calls across the dispatch turn and every followed turn. */
  readonly toolCalls: readonly EveEvalToolCall[];
  /** The `save_itinerary` call, when the coordinator ever got there. */
  readonly published: EveEvalToolCall | undefined;
  /** Last assistant text seen, so an eval can catch a silent finish. */
  readonly lastMessage: string | undefined;
}

/**
 * Consume the session's follow-up turns until the coordinator publishes an
 * itinerary or `maxTurns` is reached.
 *
 * Each background child wakes the coordinator once, so a three-planner trip
 * normally needs at least three follow-up turns, plus one more for the review,
 * before the plan is published.
 *
 * A coordinator that abandons the trip fails the eval either way: it returns
 * with `published` unset once the turn budget runs out, or the wait for a turn
 * that never arrives trips the eval timeout. Neither can report a false pass.
 */
export async function followDelegatedPlanning(
  t: EveEvalContext,
  dispatch: EveEvalTurn,
  options?: { readonly maxTurns?: number },
): Promise<FollowedPlanning> {
  const maxTurns = options?.maxTurns ?? 10;
  const turns: EveEvalTurn[] = [];
  const toolCalls: EveEvalToolCall[] = [...dispatch.toolCalls];

  // The primary session was consumed from index 0, so the events captured so
  // far are also this session's absolute stream position.
  let cursor = t.events.length;
  let lastMessage = dispatch.message;
  let published = findPublish(dispatch.toolCalls);

  while (!published && turns.length < maxTurns) {
    const turn = await t.target
      .watchTurn(dispatch.sessionId, { startIndex: cursor })
      .result();

    turns.push(turn);
    cursor += turn.events.length;
    toolCalls.push(...turn.toolCalls);
    if (turn.message !== undefined) lastMessage = turn.message;
    published = findPublish(turn.toolCalls);

    const names = turn.toolCalls.map((call) => call.name).join(", ");
    t.log(
      `follow-up turn ${turns.length}: ${names || "no tool calls"}${
        turn.message ? "" : " (no assistant text)"
      }`,
    );
  }

  return { turns, toolCalls, published, lastMessage };
}

function findPublish(
  calls: readonly EveEvalToolCall[],
): EveEvalToolCall | undefined {
  return calls.find((call) => call.name === "save_itinerary");
}

/** Pulls the published plan out of a `save_itinerary` tool result. */
export function publishedItinerary(call: EveEvalToolCall | undefined): unknown {
  return (call?.output as { itinerary?: unknown } | undefined)?.itinerary;
}
