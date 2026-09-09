import { useMemo, type CSSProperties } from 'react';

interface GridMatrixLoaderProps {
  /** Cells per row/column. 4 renders a 4x4 matrix. */
  size?: number;
  /** Cell edge length in pixels. */
  cell?: number;
  /** Gap between cells in pixels. */
  gap?: number;
  /** Accessible label announced while the matrix is visible. */
  label?: string;
  /** Tailwind classes for the cell fill, e.g. `bg-[#163300]/15`. */
  cellClassName?: string;
  className?: string;
}

/**
 * Grid matrix loading indicator.
 *
 * Two animations stack on purpose: every cell pulses on a diagonal delay so the
 * matrix reads as "work in progress", and `tw-shimmer`'s background sweep runs
 * across the whole grid using per-cell position hints so the highlight travels
 * as one continuous band instead of restarting inside each cell.
 */
export function GridMatrixLoader({
  size = 4,
  cell = 7,
  gap = 3,
  label = 'Working',
  cellClassName = 'bg-[#163300]/15',
  className = '',
}: GridMatrixLoaderProps) {
  const cells = useMemo(
    () =>
      Array.from({ length: size * size }, (_, index) => ({
        row: Math.floor(index / size),
        column: index % size,
      })),
    [size],
  );

  return (
    <span
      role="img"
      aria-label={label}
      className={`shimmer-container inline-grid shrink-0 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${size}, ${cell}px)`,
        gap: `${gap}px`,
      }}
    >
      {cells.map(({ row, column }) => (
        <span
          key={`${row}-${column}`}
          aria-hidden
          className={`tb-matrix-cell shimmer shimmer-bg shimmer-color-[#9FE870] rounded-[2px] ${cellClassName}`}
          style={
            {
              height: `${cell}px`,
              width: `${cell}px`,
              animationDelay: `${(row + column) * 90}ms`,
              '--shimmer-x': column * (cell + gap),
              '--shimmer-y': row * (cell + gap),
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/**
 * Skeleton rows used while a tool result is still streaming in. Same shimmer
 * engine as the matrix so both loaders sweep at a matching cadence.
 */
export function MatrixSkeletonRows({
  rows = 3,
  className = '',
}: {
  rows?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];

  return (
    <div
      aria-hidden
      className={`shimmer-container flex flex-col gap-2 ${className}`}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={`shimmer shimmer-bg h-3 rounded-full bg-[#163300]/10 ${
            widths[index % widths.length]
          }`}
          style={{ ['--shimmer-y' as string]: index * 20 } as CSSProperties}
        />
      ))}
    </div>
  );
}
