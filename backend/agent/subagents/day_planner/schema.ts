import { z } from "zod";
import { itineraryDaySchema } from "../../lib/itinerary";

/** Structured hand-off from a day planner to the coordinating agent. */
export const dayPlannerOutputSchema = z.object({
  days: z
    .array(itineraryDaySchema)
    .min(1)
    .max(7)
    .describe("Only the days assigned in the delegation message, in day order."),
  warnings: z
    .array(z.string().min(1).max(200))
    .max(12)
    .describe(
      "Unverified hours, dietary safety, booking risk, long transfers, or other issues the coordinator must surface.",
    ),
  assumptions: z
    .array(z.string().min(1).max(200))
    .max(8)
    .describe("Assumptions made because the delegation omitted required detail."),
});

export type DayPlannerOutput = z.infer<typeof dayPlannerOutputSchema>;
