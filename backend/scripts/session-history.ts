import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type OtelValue = {
  stringValue?: string;
  intValue?: number | string;
  doubleValue?: number;
  boolValue?: boolean;
};

type OtelAttribute = { key: string; value: OtelValue };
type OtelSpan = {
  traceId?: string;
  spanId?: string;
  name?: string;
  startTimeUnixNano?: string;
  endTimeUnixNano?: string;
  attributes?: OtelAttribute[];
  status?: { code?: number; message?: string };
};

export type SessionHistoryEntry = {
  sessionId: string;
  traceId: string;
  startedAt: string;
  durationMs: number | null;
  model: string | null;
  provider: string | null;
  prompt: string | null;
  response: string | null;
  finishReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  toolCalls: Array<{ name: string; input?: unknown; output?: unknown }>;
  errors: string[];
};

const traceRoot = path.resolve(process.cwd(), ".eve/traces/v1");

function valueOf(attribute: OtelAttribute | undefined): unknown {
  if (!attribute) return undefined;
  const value = attribute.value;
  return (
    value.stringValue ??
    value.intValue ??
    value.doubleValue ??
    value.boolValue
  );
}

function attributesOf(span: OtelSpan): Map<string, unknown> {
  return new Map(
    (span.attributes ?? []).map((attribute) => [
      attribute.key,
      valueOf(attribute),
    ]),
  );
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function promptFromMessages(value: unknown): string | null {
  const messages = parseJson(value);
  if (!Array.isArray(messages)) return null;

  const prompts = messages
    .filter(
      (message): message is { role: string; content: unknown } =>
        typeof message === "object" &&
        message !== null &&
        (message as { role?: unknown }).role === "user",
    )
    .map((message) => message.content)
    .filter(
      (content): content is string =>
        typeof content === "string" &&
        !content.startsWith("Client context:\n"),
    );

  return prompts.at(-1) ?? null;
}

function numeric(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function nanosToIso(value: string | undefined): string | null {
  if (!value) return null;
  return new Date(Number(BigInt(value) / 1_000_000n)).toISOString();
}

async function readSpans(traceDirectory: string): Promise<OtelSpan[]> {
  const segmentsDirectory = path.join(traceDirectory, "segments");
  const names = await readdir(segmentsDirectory).catch(() => []);
  const spans: OtelSpan[] = [];

  for (const name of names.filter((value) => value.endsWith(".json"))) {
    const document = JSON.parse(
      await readFile(path.join(segmentsDirectory, name), "utf8"),
    ) as {
      resourceSpans?: Array<{
        scopeSpans?: Array<{ spans?: OtelSpan[] }>;
      }>;
    };
    for (const resource of document.resourceSpans ?? []) {
      for (const scope of resource.scopeSpans ?? []) {
        spans.push(...(scope.spans ?? []));
      }
    }
  }

  return [...new Map(spans.map((span) => [span.spanId, span])).values()];
}

export async function readSessionHistory(): Promise<SessionHistoryEntry[]> {
  const traceDirectories = await readdir(traceRoot, { withFileTypes: true }).catch(
    () => [],
  );
  const entries: SessionHistoryEntry[] = [];

  for (const directory of traceDirectories.filter((entry) => entry.isDirectory())) {
    const spans = await readSpans(path.join(traceRoot, directory.name));
    const attributed = spans.map((span) => ({
      span,
      attributes: attributesOf(span),
    }));
    const sessionId = attributed
      .map(({ attributes }) => attributes.get("agent.session.id"))
      .find((value): value is string => typeof value === "string");
    if (!sessionId) continue;

    const chats = attributed.filter(({ span, attributes }) =>
      span.name?.startsWith("chat ") || attributes.has("gen_ai.request.model"),
    );
    const chat =
      chats.find(({ attributes }) => attributes.has("ai.response.text")) ??
      chats[0];
    const starts = spans
      .map((span) => span.startTimeUnixNano)
      .filter((value): value is string => typeof value === "string");
    const ends = spans
      .map((span) => span.endTimeUnixNano)
      .filter((value): value is string => typeof value === "string");
    const start = starts.reduce<string | undefined>(
      (minimum, value) =>
        minimum === undefined || BigInt(value) < BigInt(minimum) ? value : minimum,
      undefined,
    );
    const end = ends.reduce<string | undefined>(
      (maximum, value) =>
        maximum === undefined || BigInt(value) > BigInt(maximum) ? value : maximum,
      undefined,
    );

    const toolCalls = attributed.flatMap(({ span, attributes }) => {
      const name =
        attributes.get("gen_ai.tool.name") ?? attributes.get("tool.name");
      if (typeof name !== "string") return [];
      return [
        {
          name,
          ...(attributes.has("gen_ai.tool.call.arguments")
            ? { input: parseJson(attributes.get("gen_ai.tool.call.arguments")) }
            : {}),
          ...(attributes.has("gen_ai.tool.call.result")
            ? { output: parseJson(attributes.get("gen_ai.tool.call.result")) }
            : {}),
        },
      ];
    });
    const errors = attributed.flatMap(({ span, attributes }) => {
      const message =
        span.status?.message ??
        attributes.get("error.message") ??
        attributes.get("exception.message");
      return typeof message === "string" && message.length > 0 ? [message] : [];
    });
    const chatAttributes = chat?.attributes ?? new Map<string, unknown>();
    const startedAt = nanosToIso(start) ?? new Date(0).toISOString();

    entries.push({
      sessionId,
      traceId: directory.name,
      startedAt,
      durationMs:
        start && end ? Number((BigInt(end) - BigInt(start)) / 1_000_000n) : null,
      model:
        typeof chatAttributes.get("gen_ai.request.model") === "string"
          ? (chatAttributes.get("gen_ai.request.model") as string)
          : null,
      provider:
        typeof chatAttributes.get("gen_ai.provider.name") === "string"
          ? (chatAttributes.get("gen_ai.provider.name") as string)
          : null,
      prompt: promptFromMessages(chatAttributes.get("ai.prompt.messages")),
      response:
        typeof chatAttributes.get("ai.response.text") === "string"
          ? (chatAttributes.get("ai.response.text") as string)
          : null,
      finishReason:
        typeof chatAttributes.get("ai.response.finish_reason") === "string"
          ? (chatAttributes.get("ai.response.finish_reason") as string)
          : null,
      inputTokens: numeric(chatAttributes.get("agent.usage.input_tokens")),
      outputTokens: numeric(chatAttributes.get("agent.usage.output_tokens")),
      toolCalls,
      errors: [...new Set(errors)],
    });
  }

  return entries.sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const [command = "latest", argument] = process.argv.slice(2);
  const history = await readSessionHistory();

  if (command === "list") {
    const limit = Number.parseInt(argument ?? "20", 10);
    print(history.slice(0, Number.isFinite(limit) ? limit : 20).map(({ response, ...entry }) => entry));
    return;
  }

  if (command === "latest") {
    if (!history[0]) throw new Error("No local Eve session traces were found.");
    print(history[0]);
    return;
  }

  if (command === "inspect") {
    if (!argument) throw new Error("Usage: sessions:inspect <session-id>");
    const entry = history.find((session) => session.sessionId === argument);
    if (!entry) throw new Error(`No local Eve trace found for session ${argument}.`);
    print(entry);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.main) {
  await main();
}
