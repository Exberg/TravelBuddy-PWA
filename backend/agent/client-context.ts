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
