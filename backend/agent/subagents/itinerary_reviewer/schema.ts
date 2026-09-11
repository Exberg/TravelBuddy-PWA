import { z } from "zod";

export const reviewFindingCategorySchema = z.enum([
  "duplicate",
  "chronology",
  "route",
  "timing",
  "opening_hours",
  "booking",
  "budget",
  "preference",
  "dietary",
  "accessibility",
  "hard_constraint",
  "pace",
  "variety",
  "place_evidence",
]);

export const reviewFindingSchema = z.object({
  category: reviewFindingCategorySchema,
  day: z.number().int().min(1).max(60).optional(),
  stopIds: z.array(z.string().min(1).max(64)).max(12).optional(),
  message: z.string().min(1).max(240),
  suggestedFix: z.string().min(1).max(240).optional(),
});

export const preferenceCoverageSchema = z.object({
  preference: z.string().min(1).max(160),
  status: z.enum(["met", "partial", "unmet", "unknown"]),
  evidence: z.array(z.string().min(1).max(160)).max(8),
  dayNumbers: z.array(z.number().int().min(1).max(60)).max(30),
  note: z.string().min(1).max(240).optional(),
});

export const hardConstraintCoverageSchema = z.object({
  constraint: z.string().min(1).max(160),
  status: z.enum(["satisfied", "violated", "unverified"]),
  evidence: z.array(z.string().min(1).max(160)).max(8),
  dayNumbers: z.array(z.number().int().min(1).max(60)).max(30),
  stopIds: z.array(z.string().min(1).max(64)).max(12).optional(),
  note: z.string().min(1).max(240).optional(),
});

/** Structured, read-only audit returned to the itinerary coordinator. */
export const reviewReportSchema = z.object({
  verdict: z.enum(["ready", "revise", "blocked"]),
  summary: z.string().min(1).max(320),
  errors: z.array(reviewFindingSchema).max(30),
  warnings: z.array(reviewFindingSchema).max(30),
  suggestions: z.array(reviewFindingSchema).max(30),
  preferenceCoverage: z.array(preferenceCoverageSchema).max(30),
  hardConstraintCoverage: z.array(hardConstraintCoverageSchema).max(30),
});

export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type ReviewReport = z.infer<typeof reviewReportSchema>;
