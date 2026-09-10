import { describe, expect, test } from "bun:test";
import { fixedRate } from "./currency";

describe("fixed planning currency rates", () => {
  test("converts MYR to a configured destination currency", () => {
    expect(fixedRate("MYR", "JPY")).toBe(34.2);
  });

  test("returns null for unsupported currencies", () => {
    expect(fixedRate("MYR", "ZZZ")).toBeNull();
  });
});
