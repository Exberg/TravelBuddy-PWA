import React, { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

export type BottomSheetSnap = 'collapsed' | 'half' | 'full';

interface BottomSheetProps {
  snap: BottomSheetSnap;
  onSnapChange: (snap: BottomSheetSnap) => void;
  label: string;
  children: React.ReactNode;
}

const COLLAPSED_HEIGHT = 176;
const HALF_HEIGHT_RATIO = 0.68;
const HEADER_HEIGHT = 56;

function getViewportHeight() {
  return typeof document === 'undefined' ? 800 : document.documentElement.clientHeight;
}

function getSnapHeight(snap: BottomSheetSnap) {
  const viewportHeight = getViewportHeight();

  switch (snap) {
    case 'full':
      return Math.max(COLLAPSED_HEIGHT, viewportHeight - HEADER_HEIGHT);
    case 'half':
      return Math.max(COLLAPSED_HEIGHT, viewportHeight * HALF_HEIGHT_RATIO);
    case 'collapsed':
    default:
      return COLLAPSED_HEIGHT;
  }
}

function clampHeight(height: number) {
  return Math.min(getSnapHeight('full'), Math.max(COLLAPSED_HEIGHT, height));
}

function nearestSnap(height: number, velocityY: number): BottomSheetSnap {
  const heights = {
    collapsed: getSnapHeight('collapsed'),
    half: getSnapHeight('half'),
    full: getSnapHeight('full'),
  };

  // A quick upward/downward release should bias toward the next snap rather
  // than making the user drag all the way past its midpoint.
  if (velocityY < -500) return height < heights.half ? 'half' : 'full';
  if (velocityY > 500) return height > heights.half ? 'half' : 'collapsed';

  return (Object.keys(heights) as BottomSheetSnap[]).reduce((closest, candidate) =>
    Math.abs(heights[candidate] - height) < Math.abs(heights[closest] - height)
      ? candidate
      : closest,
  'collapsed');
}

/**
 * Native-feeling mobile sheet chrome. The sheet height follows the pointer
 * while dragging, then settles to the nearest accessible snap point.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  snap,
  onSnapChange,
  label,
  children,
}) => {
  const sheetHeight = useMotionValue(getSnapHeight(snap));
  const dragRef = useRef({
    active: false,
    startHeight: getSnapHeight(snap),
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
  });
  const didDragRef = useRef(false);

  useEffect(() => {
    if (dragRef.current.active) return;
    animate(sheetHeight, getSnapHeight(snap), {
      type: 'spring',
      stiffness: 380,
      damping: 40,
    });
  }, [sheetHeight, snap]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const now = performance.now();
    dragRef.current = {
      active: true,
      startHeight: sheetHeight.get(),
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: now,
      velocityY: 0,
    };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    const deltaY = event.clientY - drag.startY;
    drag.velocityY = ((event.clientY - drag.lastY) / elapsed) * 1000;
    drag.lastY = event.clientY;
    drag.lastTime = now;

    if (Math.abs(deltaY) > 4) didDragRef.current = true;
    sheetHeight.set(clampHeight(drag.startHeight - deltaY));
  };

  const settleAfterDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;

    drag.active = false;
    const targetSnap = nearestSnap(sheetHeight.get(), drag.velocityY);
    onSnapChange(targetSnap);
    animate(sheetHeight, getSnapHeight(targetSnap), {
      type: 'spring',
      stiffness: 380,
      damping: 40,
    });
  };

  const handleToggle = () => {
    // A swipe also fires the handle's click event on touch devices.
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onSnapChange(snap === 'collapsed' ? 'half' : 'collapsed');
  };

  return (
    <motion.section
      style={{ height: sheetHeight }}
      aria-label={label}
      className="bottom-sheet absolute bottom-0 inset-x-0 z-30 flex min-h-0 flex-col overflow-hidden rounded-t-[28px] border-t border-black/[0.05] bg-[#FFFFFF] px-4 pt-2 shadow-[0_-12px_32px_rgba(22,51,0,0.14)] will-change-[height]"
    >
      <button
        type="button"
        aria-label={snap === 'full' ? `Collapse ${label}` : snap === 'half' ? `Expand ${label} to full screen` : `Expand ${label}`}
        aria-expanded={snap !== 'collapsed'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={settleAfterDrag}
        onPointerCancel={settleAfterDrag}
        onClick={handleToggle}
        className="flex w-full shrink-0 touch-none cursor-grab flex-col items-center pb-3 pt-1 active:cursor-grabbing"
      >
        <span className="h-1.5 w-10 rounded-full bg-[#D8D6CF] transition-colors active:bg-[#BDBBB3]" />
      </button>

      {children}
    </motion.section>
  );
};
