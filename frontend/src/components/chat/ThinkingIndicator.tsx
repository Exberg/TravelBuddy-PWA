import { useEffect, useState, type ReactNode } from 'react';
import { GridMatrixLoader } from './GridMatrixLoader';

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * `tw-shimmer` text. The base color stays solid and the plugin sweeps a lighter
 * band across the glyphs, which is what gives the "thinking" line its motion
 * without a spinner.
 */
export function ShimmerText({ children, className = '' }: ShimmerTextProps) {
  return (
    <span className={`shimmer shimmer-spread-120 ${className}`}>{children}</span>
  );
}

const THINKING_PHRASES = [
  'Reading your trip brief',
  'Checking real places on the map',
  'Balancing travel time between stops',
  'Fitting everything to your budget',
  'Shaping the day, hour by hour',
];

function useRotatingPhrase(phrases: string[], intervalMs = 2600) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [phrases, intervalMs]);

  return phrases[index] ?? phrases[0]!;
}

interface ThinkingIndicatorProps {
  /** Fixed label. Omit to cycle through the planning phrases. */
  label?: string;
  className?: string;
}

/**
 * The streaming placeholder shown inside an assistant turn before any text has
 * arrived: a grid matrix loader plus a shimmering status line.
 */
export function ThinkingIndicator({
  label,
  className = '',
}: ThinkingIndicatorProps) {
  const rotating = useRotatingPhrase(THINKING_PHRASES);
  const text = label ?? rotating;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`tb-rise flex items-center gap-2.5 ${className}`}
    >
      <GridMatrixLoader label="TravelBuddy is working" />
      <ShimmerText
        key={text}
        className="min-w-0 font-label text-[12px] font-semibold text-[#41493A]"
      >
        {text}
      </ShimmerText>
    </div>
  );
}
