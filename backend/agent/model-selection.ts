export const QWEN_MODEL_ALIAS = "qwen-3.8-max";
export const GEMINI_MODEL_ALIAS = "gemini-3.8-flash";

export type TravelBuddyModelAlias =
  | typeof QWEN_MODEL_ALIAS
  | typeof GEMINI_MODEL_ALIAS;

export const DEFAULT_MODEL_ALIAS: TravelBuddyModelAlias = QWEN_MODEL_ALIAS;
const CLIENT_CONTEXT_PREFIX = "Client context:\n";

function messageText(content: unknown): string | undefined {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return undefined;

  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string",
    )
    .map((part) => part.text)
    .join("");
}

function modelFromContext(value: unknown): TravelBuddyModelAlias | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const travelBuddy = (value as { travelBuddy?: unknown }).travelBuddy;
  if (
    typeof travelBuddy !== "object" ||
    travelBuddy === null ||
    Array.isArray(travelBuddy)
  ) {
    return undefined;
  }

  const model = (travelBuddy as { model?: unknown }).model;
  return model === QWEN_MODEL_ALIAS || model === GEMINI_MODEL_ALIAS
    ? model
    : undefined;
}

export function resolveTravelBuddyContext(
  messages: readonly { role?: unknown; content?: unknown }[],
): Record<string, unknown> | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;

    const text = messageText(message.content);
    if (!text) continue;

    try {
      const contextJson = text.startsWith(CLIENT_CONTEXT_PREFIX)
        ? text.slice(CLIENT_CONTEXT_PREFIX.length)
        : text;
      const parsed = JSON.parse(contextJson) as { travelBuddy?: unknown };
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        typeof parsed.travelBuddy === "object" &&
        parsed.travelBuddy !== null &&
        !Array.isArray(parsed.travelBuddy)
      ) {
        return parsed.travelBuddy as Record<string, unknown>;
      }
    } catch {
      // Ordinary user messages are not JSON and are intentionally ignored.
    }
  }

  return undefined;
}

/** Reads the latest TravelBuddy client context, defaulting invalid input. */
export function resolveRequestedModel(
  messages: readonly { role?: unknown; content?: unknown }[],
): TravelBuddyModelAlias {
  const travelBuddy = resolveTravelBuddyContext(messages);
  return travelBuddy
    ? modelFromContext({ travelBuddy }) ?? DEFAULT_MODEL_ALIAS
    : DEFAULT_MODEL_ALIAS;
}
