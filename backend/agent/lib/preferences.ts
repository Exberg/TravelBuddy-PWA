import { generateText } from "ai";
import { z } from "zod";
import { qwenModel } from "../qwen-model";

export const MAX_PREFERENCE_LENGTH = 1_000;
export const MAX_PREFERENCE_KEYWORDS = 12;

const preferenceKeywordSchema = z.object({
  label: z.string(),
  sentiment: z.enum(["wanted", "unwanted"]),
});

const keywordResultSchema = z.object({
  keywords: z.array(preferenceKeywordSchema).max(24),
});

export type PreferenceKeyword = z.infer<typeof preferenceKeywordSchema>;

function stripSentimentPrefix(label: string, sentiment: PreferenceKeyword["sentiment"]) {
  const prefix = sentiment === "unwanted"
    ? /^(?:i\s+)?(?:do\s+not|don't|dont|dislike|hate|avoid|no|not)\s+/i
    : /^(?:i\s+)?(?:like|love|prefer|enjoy|want)\s+/i;
  return label.replace(prefix, "");
}

export function normalizePreferenceKeywords(keywords: readonly PreferenceKeyword[]) {
  const seen = new Set<string>();
  const normalized: PreferenceKeyword[] = [];

  for (const keyword of keywords) {
    const clean = stripSentimentPrefix(keyword.label, keyword.sentiment)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.,;:!?]+$/g, "");
    if (!clean || clean.length > 80) continue;

    const key = clean.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ label: clean, sentiment: keyword.sentiment });
    if (normalized.length === MAX_PREFERENCE_KEYWORDS) break;
  }

  return normalized;
}

export function parsePreferenceKeywordResponse(responseText: string) {
  const trimmed = responseText.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const objectStart = withoutFence.indexOf("{");
  const objectEnd = withoutFence.lastIndexOf("}");
  if (objectStart < 0 || objectEnd < objectStart) {
    throw new Error("Qwen did not return a JSON object");
  }

  const parsed = JSON.parse(withoutFence.slice(objectStart, objectEnd + 1));
  const result = keywordResultSchema.parse(parsed);
  return normalizePreferenceKeywords(result.keywords);
}

export async function extractPreferenceKeywords(text: string) {
  // ModelScope currently returns `choices: null` when Qwen3.8-Max receives an
  // OpenAI `response_format` payload. Ask for strict JSON as ordinary text and
  // validate it locally instead. Thinking is unnecessary for extraction and
  // can consume the whole output budget before Qwen reaches its final answer.
  const result = await generateText({
    model: qwenModel,
    system:
      'Extract concise travel preferences from the user text. Return only valid JSON in the exact shape {"keywords":[{"label":"short neutral phrase","sentiment":"wanted"}]} with sentiment set to either "wanted" or "unwanted", and no markdown or commentary. The label must name only the subject, without words such as like, want, dislike, avoid, no, or not. Include only meaningful topics, dietary needs, pace, and accessibility constraints. Do not invent preferences.',
    prompt: text,
    providerOptions: { modelscope: { enable_thinking: false } },
    maxOutputTokens: 300,
  });

  return parsePreferenceKeywordResponse(result.text);
}
