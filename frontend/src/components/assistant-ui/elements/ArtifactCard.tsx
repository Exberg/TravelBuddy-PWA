import type { ComponentProps, KeyboardEvent } from 'react';
import { ArrowUpRightIcon, MapPinnedIcon } from 'lucide-react';

type ArtifactCardProps = Omit<
  ComponentProps<'div'>,
  'children' | 'title' | 'meta' | 'generating' | 'words'
> & {
  title: string;
  meta: string;
  generating?: boolean;
  words?: number;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * assistant-ui Artifact Card, styled for TravelBuddy's itinerary artifacts.
 * The generated element is props-driven, so the existing Eve tool renderer
 * can keep owning publication state and the itinerary-sheet interaction.
 */
export function ArtifactCard({
  title,
  meta,
  generating = false,
  words = 0,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: ArtifactCardProps) {
  const interactive = typeof onClick === 'function';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      interactive &&
      !event.defaultPrevented &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <div
      data-slot="artifact-card"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={joinClasses(
        'group flex w-full cursor-pointer items-center gap-3 rounded-[20px] border border-[#9FE870]/50 bg-[#F5F4EE] p-3.5 text-left text-[#163300] outline-none transition-[transform,border-color,background-color] duration-150 hover:-translate-y-px hover:border-[#9FE870] hover:bg-[#EAF9DC] focus-visible:ring-2 focus-visible:ring-[#9FE870] focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#9FE870] text-[#163300]">
        <MapPinnedIcon
          aria-hidden="true"
          className={joinClasses(
            generating && 'animate-pulse motion-reduce:animate-none',
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-headline text-[14px] font-bold">{title}</p>
        {generating ? (
          <p className="mt-0.5 flex items-center gap-1 font-label text-[11px] font-semibold text-[#41493A]">
            <span className="shimmer shimmer-spread-120">Writing</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{words} words</span>
          </p>
        ) : (
          <p className="mt-0.5 truncate font-label text-[11px] font-semibold tabular-nums text-[#41493A]">
            {meta}
          </p>
        )}
      </div>

      <ArrowUpRightIcon
        aria-hidden="true"
        className="text-[#41493A] opacity-60 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}
