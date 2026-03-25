'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type DashboardCourseCarouselRowProps = {
  children: ReactNode;
  className?: string;
};

/** Fila con scroll horizontal: flechas clicables que desplazan sin activar las tarjetas. */
export function DashboardCourseCarouselRow({
  children,
  className,
}: DashboardCourseCarouselRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const gap = 6;
    const overflow = scrollWidth > clientWidth + gap;
    setShowLeft(overflow && scrollLeft > gap);
    setShowRight(overflow && scrollLeft < scrollWidth - clientWidth - gap);
  }, []);

  const scrollByAmount = useCallback((direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 320);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  const stopAndScroll = useCallback(
    (e: React.MouseEvent | React.PointerEvent, direction: -1 | 1) => {
      e.preventDefault();
      e.stopPropagation();
      scrollByAmount(direction);
    },
    [scrollByAmount],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      ro.disconnect();
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);

  useEffect(() => {
    updateEdges();
  }, [children, updateEdges]);

  return (
    <div className="relative min-w-0 lg:static">
      {/* Primero el scroll: si las flechas van después en el DOM quedan encima y reciben el clic */}
      <div
        ref={ref}
        className={className}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
      {showLeft && (
        <>
          <div
            className="pointer-events-none absolute inset-y-1 left-0 z-[5] w-12 bg-gradient-to-r from-white from-25% to-transparent dark:from-gray-800 dark:from-25% lg:hidden"
            aria-hidden
          />
          <button
            type="button"
            className="absolute inset-y-1 left-0 z-20 flex w-12 min-h-[44px] items-center justify-center lg:hidden touch-manipulation"
            aria-label="Ver cursos anteriores"
            onClick={(e) => stopAndScroll(e, -1)}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-gray-200/80 dark:bg-gray-800/95 dark:ring-gray-600/80">
              <ChevronLeft
                className="h-5 w-5 shrink-0 text-[#85ea10]"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
          </button>
        </>
      )}
      {showRight && (
        <>
          <div
            className="pointer-events-none absolute inset-y-1 right-0 z-[5] w-12 bg-gradient-to-l from-white from-25% to-transparent dark:from-gray-800 dark:from-25% lg:hidden"
            aria-hidden
          />
          <button
            type="button"
            className="absolute inset-y-1 right-0 z-20 flex w-12 min-h-[44px] items-center justify-center lg:hidden touch-manipulation"
            aria-label="Ver más cursos"
            onClick={(e) => stopAndScroll(e, 1)}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-gray-200/80 dark:bg-gray-800/95 dark:ring-gray-600/80">
              <ChevronRight
                className="h-5 w-5 shrink-0 text-[#85ea10]"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
