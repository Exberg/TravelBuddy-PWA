import { describe, expect, test } from "bun:test";
import {
  MAX_PREFERENCE_KEYWORDS,
  normalizePreferenceKeywords,
  parsePreferenceKeywordResponse,
} from "./preferences";

describe("normalizePreferenceKeywords", () => {
  test("trims, de-duplicates case-insensitively, and removes empty values", () => {
    expect(normalizePreferenceKeywords([
      { label: "  local food  ", sentiment: "wanted" },
      { label: "Local   food.", sentiment: "wanted" },
      { label: "", sentiment: "wanted" },
      { label: "  quiet neighborhoods!", sentiment: "wanted" },
    ])).toEqual([
      { label: "local food", sentiment: "wanted" },
      { label: "quiet neighborhoods", sentiment: "wanted" },
    ]);
  });

  test("caps the pill list", () => {
    const keywords = Array.from({ length: MAX_PREFERENCE_KEYWORDS + 2 }, (_, i) => ({
      label: `keyword ${i}`,
      sentiment: "wanted" as const,
    }));
    expect(normalizePreferenceKeywords(keywords)).toHaveLength(MAX_PREFERENCE_KEYWORDS);
  });

  test("removes sentiment words and ignores oversized model values", () => {
    expect(normalizePreferenceKeywords([
      { label: "a".repeat(81), sentiment: "wanted" },
      { label: "dislike early mornings", sentiment: "unwanted" },
      { label: "I love street food", sentiment: "wanted" },
    ])).toEqual([
      { label: "early mornings", sentiment: "unwanted" },
      { label: "street food", sentiment: "wanted" },
    ]);
  });
});

describe("parsePreferenceKeywordResponse", () => {
  test("parses Qwen's plain JSON response", () => {
    expect(parsePreferenceKeywordResponse(
      '{"keywords":[{"label":"local food","sentiment":"wanted"},{"label":"dislike early mornings","sentiment":"unwanted"}]}',
    )).toEqual([
      { label: "local food", sentiment: "wanted" },
      { label: "early mornings", sentiment: "unwanted" },
    ]);
  });

  test("accepts a fenced JSON response and still validates its shape", () => {
    expect(parsePreferenceKeywordResponse(
      '```json\n{"keywords":[{"label":"slow pace","sentiment":"wanted"}]}\n```',
    )).toEqual([{ label: "slow pace", sentiment: "wanted" }]);
    expect(() => parsePreferenceKeywordResponse('{"items":[]}')).toThrow();
  });
});
