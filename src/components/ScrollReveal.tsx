'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** 'up' = slide up + fade, 'fade' = solo fade */
  variant?: 'up' | 'fade';
  /** Porcentaje del elemento visible para activar (0-1). Default 0.12 */
  threshold?: number;
  /** Root margin para activar antes/después. Default '-40px 0px -40px 0px' */
  rootMargin?: string;
}

export default function ScrollReveal({
  children,
  className = '',
  variant = 'up',
  threshold = 0.12,
  rootMargin = '-40px 0px -40px 0px',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Un frame después para que el estado "oculto" se pinte primero y la transición se vea
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setVisible(true));
          });
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseClass = variant === 'fade' ? 'scroll-reveal-fade' : 'scroll-reveal';
  const visibleClass = visible ? 'scroll-reveal-visible' : '';

  return (
    <div ref={ref} className={`${baseClass} ${visibleClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
