import type { ReactNode } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { GridMatrixLoader } from './GridMatrixLoader';

const PLANNING_TOOL_NAMES = new Set(['day_planner', 'itinerary_reviewer']);
const TRAVELER_LABEL_PREFIX = 'traveler label:';
const MAX_LABEL_LENGTH = 80;

type PlanningStatus = ToolCallMessagePartProps['status'];

interface PlanningProgressCardProps {
  children: ReactNode;
  status: PlanningStatus;
}

export function isPlanningToolName(toolName: string) {
  return PLANNING_TOOL_NAMES.has(toolName);
}

function travelerLabel(toolName: string, args: unknown) {
  const fallback =
    toolName === 'itinerary_reviewer'
      ? 'Reviewing your trip'
      : 'Planning part of your trip';

  if (!args || typeof args !== 'object') return fallback;

  const message = (args as Record<string, unknown>).message;
  if (typeof message !== 'string') return fallback;

  const firstLine = message.split(/\r?\n/, 1)[0]?.trim() ?? '';
  if (!firstLine.toLowerCase().startsWith(TRAVELER_LABEL_PREFIX)) {
    return fallback;
  }

  const label = firstLine.slice(TRAVELER_LABEL_PREFIX.length).trim();
  if (!label) return fallback;

  const safeLabel = label.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!safeLabel) return fallback;

  return safeLabel.length > MAX_LABEL_LENGTH
    ? `${safeLabel.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`
    : safeLabel;
}

function statusMeta(
  toolName: string,
  status: PlanningStatus,
  isError?: boolean,
) {
  if (isError === true || status.type === 'incomplete') {
    return {
      icon: 'error',
      label: 'Needs attention',
      tone: 'bg-[#FFDAD6] text-[#93000A]',
    };
  }

  if (status.type === 'running' || status.type === 'requires-action') {
    return {
      icon: null,
      label: toolName === 'itinerary_reviewer' ? 'Reviewing' : 'Planning',
      tone: 'bg-[#9FE870] text-[#163300]',
    };
  }

  return {
    icon: 'check',
    label: 'Done',
    tone: 'bg-[#EAF9DC] text-[#163300]',
  };
}

export function PlanningProgressCard({
  children,
  status,
}: PlanningProgressCardProps) {
  const isRunning =
    status.type === 'running' || status.type === 'requires-action';
  const failed = status.type === 'incomplete';

  return (
    <section
      aria-label="Trip planning progress"
      aria-live="polite"
      aria-busy={isRunning}
      className="tb-rise overflow-hidden rounded-2xl border border-[#163300]/15 bg-white"
    >
      <div className="flex items-center justify-between gap-3 bg-[#163300] px-3.5 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9FE870] text-[#163300]">
            <span className="material-symbols-filled text-[16px]">route</span>
          </span>
          <h3 className="truncate font-headline text-sm font-bold">
            {failed
              ? 'Trip planning needs attention'
              : isRunning
                ? 'Building your trip'
                : 'Trip planning complete'}
          </h3>
        </div>
        {isRunning ? (
          <span className="shrink-0 rounded-full bg-[#9FE870] px-2.5 py-1 font-label text-[10px] font-bold uppercase tracking-wider text-[#163300]">
            Live
          </span>
        ) : null}
      </div>

      <div className="divide-y divide-[#E5E5E5] px-3.5">{children}</div>
    </section>
  );
}

export function PlanningProgressStep({
  toolName,
  args,
  status,
  isError,
}: ToolCallMessagePartProps) {
  const meta = statusMeta(toolName, status, isError);
  const label = travelerLabel(toolName, args);
  const isRunning =
    status.type === 'running' || status.type === 'requires-action';

  return (
    <div className="flex min-h-12 items-center gap-3 py-2.5">
      {isRunning ? (
        <GridMatrixLoader size={3} label={`${meta.label}: ${label}`} />
      ) : (
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${meta.tone}`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {meta.icon}
          </span>
        </span>
      )}

      <span className="min-w-0 flex-1 truncate font-body text-[13px] font-medium text-[#163300]">
        {label}
      </span>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 font-label text-[10px] font-bold uppercase tracking-wide ${meta.tone}`}
      >
        {meta.label}
      </span>
    </div>
  );
}
