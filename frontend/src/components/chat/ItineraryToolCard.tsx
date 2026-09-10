import { useMemo } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import { GridMatrixLoader, MatrixSkeletonRows } from './GridMatrixLoader';
import { ShimmerText } from './ThinkingIndicator';
import { countStops, formatMyr, parseSaveItineraryResult } from '../../lib/itinerary';

/**
 * In-chat card for the agent's `save_itinerary` call.
 *
 * The full plan is rendered in the trip sheet below, so this stays a compact
 * receipt: what changed, how big the trip is, and what it costs. While the tool
 * is still running it shows a grid matrix loader instead of a half-parsed
 * itinerary.
 */
interface ItineraryToolCardProps extends ToolCallMessagePartProps {
  onOpenItinerary?: () => void;
}

/**
 * A persistent assistant-ui message artifact. It intentionally lives in the
 * conversation instead of the sheet so it remains the manual re-entry point
 * after the traveler dismisses the sheet completely.
 */
export function ItineraryToolCard({
  status,
  result,
  onOpenItinerary,
}: ItineraryToolCardProps) {
  const published = useMemo(() => parseSaveItineraryResult(result), [result]);

  if (status.type !== 'complete' || !published) {
    const failed = status.type === 'incomplete';

    if (failed) {
      return (
        <div className="tb-rise flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5">
          <span className="material-symbols-outlined text-[16px] text-red-600">
            error
          </span>
          <span className="font-label text-[12px] font-semibold text-red-700">
            Could not update the itinerary
          </span>
        </div>
      );
    }

    return (
      <section className="tb-rise rounded-2xl border border-[#9FE870]/50 bg-[#F5F4EE] p-4">
        <div className="flex items-center gap-2.5">
          <GridMatrixLoader size={4} label="Building your itinerary" />
          <ShimmerText className="font-label text-[12px] font-bold text-[#41493A]">
            Laying out your itinerary
          </ShimmerText>
        </div>
        <MatrixSkeletonRows rows={4} className="mt-3.5" />
      </section>
    );
  }

  const { itinerary, changeNote, revision } = published;

  return (
    <button
      type="button"
      onClick={onOpenItinerary}
      aria-label={`Open ${itinerary.title} itinerary`}
      className="tb-rise block w-full cursor-pointer rounded-2xl border border-[#9FE870]/50 bg-[#F5F4EE] p-4 text-left transition-[transform,border-color,background-color] hover:border-[#9FE870] hover:bg-[#eaf9dc] active:scale-[0.985]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9FE870]">
          <span className="material-symbols-outlined text-[13px] text-[#163300]">
            route
          </span>
        </span>
        <p className="font-label text-[11px] font-bold uppercase tracking-wide text-[#41493A]">
          {revision > 1 ? 'Itinerary updated' : 'Itinerary ready'}
        </p>
      </div>

      <p className="mt-1.5 font-headline text-base font-bold text-[#163300]">
        {itinerary.title}
      </p>
      <p className="mt-1 font-body text-xs leading-relaxed text-[#41493A]">
        {changeNote}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-white px-2.5 py-1 font-label text-[11px] font-semibold text-[#163300]">
          {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 font-label text-[11px] font-semibold text-[#163300]">
          {countStops(itinerary)} stops
        </span>
        {typeof itinerary.estimatedTotalMyr === 'number' ? (
          <span className="rounded-full bg-[#eaf9dc] px-2.5 py-1 font-label text-[11px] font-bold tabular-nums text-[#163300]">
            ~{formatMyr(itinerary.estimatedTotalMyr)}
            {typeof itinerary.budgetMyr === 'number'
              ? ` of ${formatMyr(itinerary.budgetMyr)}`
              : ''}
          </span>
        ) : null}
      </div>

      {itinerary.assumptions?.length ? (
        <ul className="mt-3 flex list-none flex-col gap-1">
          {itinerary.assumptions.map((assumption) => (
            <li
              key={assumption}
              className="flex items-start gap-1.5 font-body text-[11px] leading-snug text-[#41493A]"
            >
              <span className="material-symbols-outlined text-[13px]">info</span>
              {assumption}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 flex items-center gap-1 font-label text-[11px] font-bold text-[#163300]">
        Open itinerary
        <span className="material-symbols-outlined text-[15px]">north_east</span>
      </p>
    </button>
  );
}
