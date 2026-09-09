import { useState, type ReactNode } from 'react';
import { GridMatrixLoader } from './GridMatrixLoader';
import { ShimmerText } from './ThinkingIndicator';

interface ThoughtTraceProps {
  /** True while any part inside the trace is still streaming. */
  isRunning: boolean;
  /** Number of reasoning + tool parts collected in this trace. */
  steps: number;
  children: ReactNode;
}

/**
 * Collapsible chain-of-thought container, one per run of adjacent reasoning and
 * tool-call parts.
 *
 * It stays open while the agent works so the traveler can watch the steps, then
 * folds itself away once the run finishes — unless the traveler has already
 * toggled it, in which case their choice wins.
 */
export function ThoughtTrace({ isRunning, steps, children }: ThoughtTraceProps) {
  const [override, setOverride] = useState<boolean | null>(null);
  const isOpen = override ?? isRunning;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#FBF9F4]">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOverride(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {isRunning ? (
          <GridMatrixLoader label="TravelBuddy is working" />
        ) : (
          <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#eaf9dc]">
            <span className="material-symbols-outlined text-[13px] text-[#163300]">
              psychology
            </span>
          </span>
        )}

        <span className="min-w-0 flex-1">
          {isRunning ? (
            <ShimmerText className="block truncate font-label text-[12px] font-bold text-[#41493A]">
              Working through your trip
            </ShimmerText>
          ) : (
            <span className="block truncate font-label text-[12px] font-bold text-[#41493A]">
              Planning steps
              <span className="ml-1.5 font-semibold text-[#41493A]/70">
                {steps} {steps === 1 ? 'step' : 'steps'}
              </span>
            </span>
          )}
        </span>

        <span
          className={`material-symbols-outlined shrink-0 text-[18px] text-[#41493A]/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          expand_more
        </span>
      </button>

      {isOpen ? (
        <div className="tb-rise space-y-2 border-t border-[#E5E5E5] px-3 py-2.5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

interface ReasoningTraceProps {
  text: string;
  isStreaming: boolean;
}

/** A single reasoning part inside the thought trace. */
export function ReasoningTrace({ text, isStreaming }: ReasoningTraceProps) {
  if (!text.trim()) {
    return isStreaming ? (
      <ShimmerText className="block font-label text-[12px] font-semibold text-[#41493A]">
        Thinking it through
      </ShimmerText>
    ) : null;
  }

  return (
    <div className="flex gap-2 border-l-2 border-[#9FE870]/50 pl-2.5">
      <p
        className={`min-w-0 whitespace-pre-wrap font-body text-[12px] leading-relaxed ${
          isStreaming ? 'shimmer text-[#41493A]' : 'text-[#41493A]/85'
        }`}
      >
        {text}
      </p>
    </div>
  );
}
