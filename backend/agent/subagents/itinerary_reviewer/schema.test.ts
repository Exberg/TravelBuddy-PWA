import { describe, expect, test } from "bun:test";
import { reviewReportSchema } from "./schema";

const validReport = {
  verdict: "blocked" as const,
  summary: "The itinerary needs a dietary-safety correction before publishing.",
  errors: [
    {
      category: "hard_constraint" as const,
      day: 1,
      stopIds: ["day-1-lunch"],
      message: "The nut allergy is not addressed at lunch.",
      suggestedFix: "Replace lunch or mark it for direct allergen confirmation.",
    },
  ],
  warnings: [],
  suggestions: [],
  preferenceCoverage: [
    {
      preference: "Relaxed pace",
      status: "met" as const,
      evidence: ["Day 1 contains three spaced stops"],
      dayNumbers: [1],
    },
  ],
  hardConstraintCoverage: [
    {
      constraint: "Nut allergy",
      status: "unverified" as const,
      evidence: [],
      dayNumbers: [1],
      stopIds: ["day-1-lunch"],
    },
  ],
};

describe("reviewReportSchema", () => {
  test("accepts findings and explicit coverage records", () => {
    expect(reviewReportSchema.parse(validReport)).toEqual(validReport);
  });

  test("rejects an unknown finding category", () => {
    expect(() =>
      reviewReportSchema.parse({
        ...validReport,
        errors: [{ ...validReport.errors[0], category: "weather" }],
      }),
    ).toThrow();
  });

  test("requires both preference and hard-constraint coverage", () => {
    const { hardConstraintCoverage: _omitted, ...incomplete } = validReport;
    expect(() => reviewReportSchema.parse(incomplete)).toThrow();
  });
});
