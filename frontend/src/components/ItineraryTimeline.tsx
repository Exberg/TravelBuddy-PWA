import type { ItineraryDay, ItineraryStop } from '../types';
import {
  dayCostMyr,
  formatHop,
  formatMyr,
  halalLabel,
  hopIcon,
  segmentLabel,
  stopIcon,
} from '../lib/itinerary';

interface StopRowProps {
  stop: ItineraryStop;
  isLast: boolean;
}

/**
 * One stop on the day's spine rail. Everything below the title is conditional:
 * the agent omits fields it could not verify, and a row should never show an
 * empty cost or an invented travel time.
 */
function StopRow({ stop, isLast }: StopRowProps) {
  const mapsHref =
    stop.googleMapsUri ??
    (stop.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${stop.placeId}`
      : null);

  return (
    <li className="flex gap-3">
      <div className="flex w-11 shrink-0 flex-col items-end pt-0.5">
        <span className="font-label text-xs font-bold tabular-nums text-[#163300]">
          {stop.time}
        </span>
        <span className="font-label text-[10px] uppercase tracking-wide text-[#41493A]/70">
          {segmentLabel(stop.segment)}
        </span>
      </div>

      {/* Vertical spine rail with a node per stop (DESIGN.md timeline tile). */}
      <div className="flex shrink-0 flex-col items-center pt-1.5">
        <span className="h-2 w-2 rounded-full bg-[#9FE870] ring-2 ring-[#163300]" />
        {!isLast ? <span className="mt-1 w-px flex-1 bg-[#163300]/15" /> : null}
      </div>

      <div className="min-w-0 flex-1 pb-3">
        <div className="rounded-2xl border border-[#E5E5E5]/70 bg-[#F5F4EE] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-headline text-sm font-bold text-[#163300]">
                {stop.title}
              </p>
              <p className="mt-0.5 font-body text-xs leading-relaxed text-[#41493A]">
                {stop.description}
              </p>
            </div>
            <span className="material-symbols-outlined shrink-0 text-[19px] text-[#41493A]">
              {stopIcon(stop)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {typeof stop.durationMinutes === 'number' ? (
              <span className="rounded-full bg-white px-2 py-0.5 font-label text-[10px] font-semibold text-[#41493A]">
                {stop.durationMinutes} min
              </span>
            ) : null}
            {typeof stop.estimatedCostMyr === 'number' ? (
              <span className="rounded-full bg-[#eaf9dc] px-2 py-0.5 font-label text-[10px] font-bold tabular-nums text-[#163300]">
                {formatMyr(stop.estimatedCostMyr)}
              </span>
            ) : null}
            {stop.halalStatus ? (
              <span className="rounded-full bg-white px-2 py-0.5 font-label text-[10px] font-semibold text-[#41493A]">
                {halalLabel(stop.halalStatus)}
              </span>
            ) : null}
            {stop.bookingRequired ? (
              <span className="rounded-full bg-[#163300] px-2 py-0.5 font-label text-[10px] font-bold text-[#9FE870]">
                Booking needed
              </span>
            ) : null}
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-0.5 font-label text-[10px] font-bold text-[#163300] underline decoration-[#9FE870] decoration-2 underline-offset-2"
              >
                Map
                <span className="material-symbols-outlined text-[12px]">
                  north_east
                </span>
              </a>
            ) : null}
          </div>

          {stop.warning ? (
            <p className="mt-2 flex items-start gap-1.5 font-body text-[11px] leading-snug text-[#8a5a00]">
              <span className="material-symbols-outlined text-[13px]">info</span>
              {stop.warning}
            </p>
          ) : null}
        </div>

        {stop.travelFromPrevious ? (
          <p className="mt-1.5 flex items-center gap-1 pl-1 font-label text-[10px] font-semibold uppercase tracking-wide text-[#41493A]/80">
            <span className="material-symbols-outlined text-[13px]">
              {hopIcon(stop.travelFromPrevious.mode)}
            </span>
            {formatHop(
              stop.travelFromPrevious.mode,
              stop.travelFromPrevious.durationMinutes,
            )}
          </p>
        ) : null}
      </div>
    </li>
  );
}

interface ItineraryTimelineProps {
  day: ItineraryDay;
}

export function ItineraryTimeline({ day }: ItineraryTimelineProps) {
  const cost = dayCostMyr(day.stops);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2 pb-2">
        <div className="min-w-0">
          <p className="truncate font-headline text-sm font-bold text-[#163300]">
            {day.title}
          </p>
          {day.area ? (
            <p className="truncate font-body text-[11px] text-[#41493A]">
              {day.area}
            </p>
          ) : null}
        </div>
        {cost !== null ? (
          <span className="shrink-0 font-label text-[11px] font-bold tabular-nums text-[#41493A]">
            {formatMyr(cost)}
          </span>
        ) : null}
      </div>

      <ul className="flex list-none flex-col">
        {day.stops.map((stop, index) => (
          <StopRow
            key={stop.id}
            stop={stop}
            isLast={index === day.stops.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
