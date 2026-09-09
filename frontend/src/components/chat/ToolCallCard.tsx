import { useState, type FormEvent } from 'react';
import {
  toolApprovalAcceptsText,
  useToolCallElapsed,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import { GridMatrixLoader, MatrixSkeletonRows } from './GridMatrixLoader';
import { ShimmerText } from './ThinkingIndicator';

interface ToolMeta {
  icon: string;
  running: string;
  done: string;
}

/**
 * Human labels for the tools the TravelBuddy agent actually calls. Anything not
 * listed falls back to a title-cased tool name, so a new backend tool still
 * renders sensibly.
 */
const TOOL_META: Record<string, ToolMeta> = {
  search_places: {
    icon: 'travel_explore',
    running: 'Searching real places',
    done: 'Searched places',
  },
  place_details: {
    icon: 'storefront',
    running: 'Reading place details',
    done: 'Read place details',
  },
  geocode_place: {
    icon: 'my_location',
    running: 'Pinning the location',
    done: 'Pinned the location',
  },
  travel_time: {
    icon: 'directions',
    running: 'Measuring travel time',
    done: 'Measured travel time',
  },
  web_search: {
    icon: 'language',
    running: 'Searching the web',
    done: 'Searched the web',
  },
  get_itinerary: {
    icon: 'event_note',
    running: 'Reading your itinerary',
    done: 'Read your itinerary',
  },
  save_itinerary: {
    icon: 'route',
    running: 'Updating your itinerary',
    done: 'Updated your itinerary',
  },
  ask_question: {
    icon: 'help',
    running: 'Asking you a question',
    done: 'Question answered',
  },
  agent: {
    icon: 'hub',
    running: 'Delegating to a specialist',
    done: 'Specialist finished',
  },
  bash: { icon: 'terminal', running: 'Running a command', done: 'Ran a command' },
  read_file: { icon: 'description', running: 'Reading a file', done: 'Read a file' },
  write_file: { icon: 'edit_note', running: 'Writing a file', done: 'Wrote a file' },
};

export function formatToolName(toolName: string) {
  return toolName
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toolMeta(toolName: string): ToolMeta {
  return (
    TOOL_META[toolName] ?? {
      icon: 'build',
      running: `Running ${formatToolName(toolName)}`,
      done: formatToolName(toolName),
    }
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** One-line summary of the model's arguments, shown next to the tool label. */
function summarizeArgs(args: unknown): string | null {
  if (!args || typeof args !== 'object') return null;
  const record = args as Record<string, unknown>;

  for (const key of [
    'query',
    'question',
    'placeName',
    'place',
    'name',
    'title',
    'changeNote',
    'command',
    'path',
    'prompt',
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return truncate(value.trim(), 70);
  }

  const origin = record.origin;
  const destination = record.destination;
  if (origin || destination) {
    const from = truncate(stringifyValue(origin), 26);
    const to = truncate(stringifyValue(destination), 26);
    if (from || to) return `${from} → ${to}`;
  }

  return null;
}

function argRows(args: unknown) {
  if (!args || typeof args !== 'object') return [];
  return Object.entries(args as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 6)
    .map(([key, value]) => ({
      key,
      value: truncate(stringifyValue(value), 160),
    }));
}

function formatResult(result: unknown) {
  if (result === undefined || result === null) return null;
  if (typeof result === 'string') return truncate(result, 700);
  try {
    return truncate(JSON.stringify(result, null, 2), 700);
  } catch {
    return null;
  }
}

function formatElapsed(elapsedMs: number | undefined) {
  if (elapsedMs === undefined) return null;
  if (elapsedMs < 1000) return `${elapsedMs}ms`;
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

/**
 * Approval / clarification gate. Rendered outside the collapsed thought trace
 * because it is the one tool state that blocks the run on the traveler.
 */
function ToolApprovalCard({
  toolName,
  approval,
  respondToApproval,
}: ToolCallMessagePartProps & {
  approval: NonNullable<ToolCallMessagePartProps['approval']>;
}) {
  const [answer, setAnswer] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const acceptsText = toolApprovalAcceptsText(approval);

  const respond = async (
    response: Parameters<typeof respondToApproval>[0],
  ) => {
    setIsResponding(true);
    try {
      await respondToApproval(response);
    } finally {
      setIsResponding(false);
    }
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = answer.trim();
    if (text) void respond({ text });
  };

  return (
    <section className="tb-rise rounded-2xl border border-[#9FE870]/60 bg-[#F5F4EE] p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9FE870]">
          <span className="material-symbols-outlined text-[15px] text-[#163300]">
            {toolMeta(toolName).icon}
          </span>
        </span>
        <p className="font-label text-[11px] font-bold uppercase tracking-wide text-[#41493A]">
          TravelBuddy needs your input
        </p>
      </div>

      <p className="mt-2.5 font-body text-sm leading-relaxed text-[#163300]">
        {approval.prompt ?? `Allow ${formatToolName(toolName)}?`}
      </p>

      {approval.options?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {approval.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={isResponding}
              onClick={() => void respond({ optionId: option.id })}
              className="rounded-full border border-[#163300]/15 bg-white px-3.5 py-2 font-label text-xs font-semibold transition-colors hover:border-[#9FE870] active:scale-95 disabled:opacity-50"
            >
              {option.label ?? formatToolName(option.kind)}
            </button>
          ))}
        </div>
      ) : approval.display !== 'text' ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isResponding}
            onClick={() => void respond({ approved: true })}
            className="rounded-full bg-[#163300] px-4 py-2 font-label text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            Allow
          </button>
          <button
            type="button"
            disabled={isResponding}
            onClick={() => void respond({ approved: false })}
            className="rounded-full border border-[#163300]/15 bg-white px-4 py-2 font-label text-xs font-semibold transition-transform active:scale-95 disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      ) : null}

      {acceptsText ? (
        <form onSubmit={submitAnswer} className="mt-3 flex gap-2">
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer"
            aria-label="Answer TravelBuddy"
            className="min-w-0 flex-1 rounded-full border border-[#163300]/15 bg-white px-4 py-2 text-sm outline-none focus:border-[#9FE870]"
          />
          <button
            type="submit"
            disabled={!answer.trim() || isResponding}
            className="rounded-full bg-[#9FE870] px-4 py-2 font-label text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : null}

      {isResponding ? (
        <div className="mt-3">
          <GridMatrixLoader size={3} label="Sending your answer" />
        </div>
      ) : null}
    </section>
  );
}

/**
 * Generic tool call row: a compact status line that expands into the arguments
 * the model sent and the raw result it got back.
 */
export function ToolCallCard(props: ToolCallMessagePartProps) {
  const { toolName, args, result, isError, status, approval } = props;
  const [isOpen, setIsOpen] = useState(false);
  const elapsed = formatElapsed(useToolCallElapsed());

  const needsApproval =
    approval !== undefined &&
    approval.approved === undefined &&
    approval.resolution === undefined;

  if (needsApproval) {
    return <ToolApprovalCard {...props} approval={approval} />;
  }

  const meta = toolMeta(toolName);
  const isRunning = status.type === 'running' || status.type === 'requires-action';
  const failed = isError === true || status.type === 'incomplete';
  const rows = argRows(args);
  const summary = summarizeArgs(args);
  const resultPreview = formatResult(result);
  const canExpand = rows.length > 0 || resultPreview !== null;

  return (
    <div className="tb-rise rounded-xl border border-[#E5E5E5] bg-[#F5F4EE]/80">
      <button
        type="button"
        disabled={!canExpand}
        aria-expanded={canExpand ? isOpen : undefined}
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left disabled:cursor-default"
      >
        {isRunning ? (
          <GridMatrixLoader size={3} label={meta.running} />
        ) : (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              failed ? 'bg-red-100 text-red-600' : 'bg-[#eaf9dc] text-[#163300]'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {failed ? 'error' : meta.icon}
            </span>
          </span>
        )}

        <span className="min-w-0 flex-1">
          {isRunning ? (
            <ShimmerText className="block truncate font-label text-[12px] font-semibold text-[#41493A]">
              {meta.running}
              {summary ? ` · ${summary}` : ''}
            </ShimmerText>
          ) : (
            <span
              className={`block truncate font-label text-[12px] font-semibold ${
                failed ? 'text-red-600' : 'text-[#41493A]'
              }`}
            >
              {failed ? `${formatToolName(toolName)} failed` : meta.done}
              {summary ? ` · ${summary}` : ''}
            </span>
          )}
        </span>

        {elapsed ? (
          <span className="shrink-0 font-label text-[10px] font-semibold tabular-nums text-[#41493A]/60">
            {elapsed}
          </span>
        ) : null}

        {canExpand ? (
          <span
            className={`material-symbols-outlined shrink-0 text-[16px] text-[#41493A]/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          >
            expand_more
          </span>
        ) : null}
      </button>

      {isRunning && !isOpen ? (
        <div className="px-2.5 pb-2.5">
          <MatrixSkeletonRows rows={2} />
        </div>
      ) : null}

      {isOpen ? (
        <div className="tb-rise space-y-2.5 border-t border-[#E5E5E5] px-2.5 py-2.5">
          {rows.length ? (
            <div className="space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-wider text-[#41493A]/70">
                Input
              </p>
              <dl className="space-y-1">
                {rows.map(({ key, value }) => (
                  <div key={key} className="flex gap-2 text-[11px] leading-snug">
                    <dt className="shrink-0 font-label font-semibold text-[#41493A]/80">
                      {key}
                    </dt>
                    <dd className="min-w-0 flex-1 break-words font-body text-[#163300]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {isRunning ? <MatrixSkeletonRows rows={3} /> : null}

          {resultPreview !== null ? (
            <div className="space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-wider text-[#41493A]/70">
                {failed ? 'Error' : 'Result'}
              </p>
              <pre className="no-scrollbar max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-2 font-mono text-[10.5px] leading-snug text-[#163300]">
                {resultPreview}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
