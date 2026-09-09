import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

const ITINERARY = {
  title: "Penang Weekend",
  destination: "George Town, Penang, Malaysia",
  summary: "A compact heritage weekend.",
  days: [
    {
      day: 1,
      title: "Heritage core",
      stops: [
        {
          id: "blue-mansion",
          time: "10:00",
          segment: "morning",
          title: "Cheong Fatt Tze Mansion",
          description: "Tour the restored indigo mansion.",
          category: "sight",
        },
      ],
    },
  ],
} as const;

export default defineEval({
  description:
    "A new Eve session recovers the trip's canonical itinerary from client context before an edit.",
  tags: ["conversation", "itinerary", "recovery"],
  timeoutMs: 180_000,
  async test(t) {
    const session = t.newSession();
    const turn = await session.send(
      "Call get_itinerary and tell me whether the saved plan exists and which revision it is.",
      {
        clientContext: {
          surface: "TravelBuddy PWA",
          travelBuddy: {
            trip: { destination: ITINERARY.destination },
            itinerarySnapshot: {
              tripId: "trip-recovery-fixture",
              itinerary: ITINERARY,
              revision: 7,
              updatedAt: "2026-09-09T12:00:00.000Z",
            },
          },
        },
      },
    );

    turn.expectOk();
    const output = turn.requireToolCall("get_itinerary").output;
    t.check(
      output,
      satisfies(
        (value) =>
          (value as { exists?: unknown; revision?: unknown } | undefined)
            ?.exists === true &&
          (value as { revision?: unknown } | undefined)?.revision === 7,
        "the fresh session hydrated revision 7 before the tool read",
      ),
    );
  },
});
