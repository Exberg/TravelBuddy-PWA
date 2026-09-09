import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MODEL_ALIAS,
  GEMINI_MODEL_ALIAS,
  QWEN_MODEL_ALIAS,
  resolveRequestedModel,
} from "./model-selection";

const contextMessage = (model: unknown) => ({
  role: "user",
  content: JSON.stringify({ travelBuddy: { model } }),
});

describe("resolveRequestedModel", () => {
  test("accepts Qwen", () => {
    expect(resolveRequestedModel([contextMessage(QWEN_MODEL_ALIAS)])).toBe(
      QWEN_MODEL_ALIAS,
    );
  });

  test("accepts Gemini", () => {
    expect(resolveRequestedModel([contextMessage(GEMINI_MODEL_ALIAS)])).toBe(
      GEMINI_MODEL_ALIAS,
    );
  });

  test("accepts Eve's model-visible client context format", () => {
    expect(
      resolveRequestedModel([
        {
          role: "user",
          content: `Client context:\n${JSON.stringify({
            travelBuddy: { model: GEMINI_MODEL_ALIAS },
          })}`,
        },
      ]),
    ).toBe(GEMINI_MODEL_ALIAS);
  });

  test("defaults a missing selection to Qwen", () => {
    expect(resolveRequestedModel([])).toBe(DEFAULT_MODEL_ALIAS);
  });

  test("defaults malformed context to Qwen", () => {
    expect(
      resolveRequestedModel([
        { role: "user", content: "{not-json" },
        { role: "user", content: JSON.stringify({ travelBuddy: null }) },
      ]),
    ).toBe(DEFAULT_MODEL_ALIAS);
  });

  test("defaults unsupported model values to Qwen", () => {
    expect(
      resolveRequestedModel([
        contextMessage(GEMINI_MODEL_ALIAS),
        contextMessage("gemini-ultra"),
      ]),
    ).toBe(DEFAULT_MODEL_ALIAS);
  });
});
