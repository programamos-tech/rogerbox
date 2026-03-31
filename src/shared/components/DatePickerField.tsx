'use client';

import {
  addDays,
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { parseLocalDate } from '@/lib/dateUtils';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

function toYmd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function parseYmd(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}/.test(ymd)) return null;
  try {
    return parseLocalDate(ymd.slice(0, 10));
  } catch {
    return null;
  }
}

export interface DatePickerFieldProps {
  value: string;
  onChange?: (isoDate: string) => void;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  minDate?: string;
  maxDate?: string;
  /** Clases del contenedor externo */
  className?: string;
  /** Clases del disparador (solo modo editable) */
  triggerClassName?: string;
  /** Clases del área de solo lectura (sustituye estilos por defecto si se pasa) */
  readOnlyInnerClassName?: string;
  /** Texto accesible */
  'aria-label'?: string;
}

/**
 * Selector de fecha con panel tipo RogerBox (mismo patrón que CourseStartDateModal).
 * No usa `<input type="date" />` para evitar el picker nativo claro del SO.
 */
export function DatePickerField({
  value,
  onChange,
  id,
  disabled = false,
  readOnly = false,
  minDate,
  maxDate,
  className = '',
  triggerClassName = '',
  readOnlyInnerClassName,
  'aria-label': ariaLabel,
}: DatePickerFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selected = useMemo(() => parseYmd(value), [value]);
  const minD = useMemo(() => (minDate ? parseYmd(minDate) : null), [minDate]);
  const maxD = useMemo(() => (maxDate ? parseYmd(maxDate) : null), [maxDate]);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? new Date();
    return startOfMonth(base);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const d = parseYmd(value);
    if (d) setViewMonth(startOfMonth(d));
  }, [value]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = addDays(start, 41);
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [viewMonth]);

  const dayDisabled = useCallback(
    (day: Date) => {
      if (minD && isBefore(day, minD)) return true;
      if (maxD && isAfter(day, maxD)) return true;
      return false;
    },
    [minD, maxD],
  );

  const isTodayDisabled = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return dayDisabled(t);
  }, [dayDisabled]);

  const displayText = useMemo(() => {
    if (!selected) return '—';
    return format(selected, 'dd/MM/yyyy');
  }, [selected]);

  const [panelPos, setPanelPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const updatePanelPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const approxH = 300;
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < approxH && r.top > approxH;
    const top = flip ? r.top - approxH - 8 : r.bottom + 8;
    setPanelPos({
      top,
      left: Math.min(r.left, window.innerWidth - 296),
      width: Math.max(r.width, 280),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPos();
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePanelPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const baseReadonlyClasses =
    'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border cursor-not-allowed border-gray-200 dark:border-white/[0.08] bg-gray-100/90 dark:bg-white/[0.06] text-[#164151] dark:text-white/90';

  if (readOnly) {
    return (
      <div className={`relative ${className}`}>
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400/90 dark:text-white/35" />
        <div id={id} className={readOnlyInnerClassName ?? baseReadonlyClasses}>
          {displayText}
        </div>
      </div>
    );
  }

  const triggerDisabled = disabled;

  const defaultTrigger =
    'w-full flex items-center gap-2 pl-10 pr-3 py-2.5 text-sm text-left rounded-xl border transition-all ' +
    'border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[#164151] dark:text-white ' +
    'focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 ' +
    'hover:border-gray-300 dark:hover:border-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed';

  const panel = open && mounted && (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-[240] rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-[#1a2332] shadow-xl overflow-hidden"
      style={{
        top: panelPos.top,
        left: panelPos.left,
        width: Math.max(panelPos.width, 280),
        maxWidth: 'min(100vw - 16px, 320px)',
      }}
    >
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/70"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-gray-900 dark:text-white/95 capitalize">
          {viewMonth
            .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
            .replace(/^\w/, (c) => c.toUpperCase())}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/70"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/[0.08]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[10px] font-medium text-gray-500 dark:text-white/45"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 p-1.5 gap-px">
        {calendarDays.map((day) => {
          const dis = dayDisabled(day);
          const isSel = selected && isSameDay(day, selected);
          const today = isToday(day);
          const otherMonth = !isSameMonth(day, viewMonth);
          return (
            <button
              key={format(day, 'yyyy-MM-dd')}
              type="button"
              disabled={dis}
              onClick={() => {
                if (dis || !onChange) return;
                onChange(toYmd(day));
                setOpen(false);
              }}
              className={`
                h-8 flex items-center justify-center text-xs rounded-lg transition-colors
                ${otherMonth ? 'text-gray-300 dark:text-white/25' : 'text-gray-900 dark:text-white/95'}
                ${isSel ? 'ring-1 ring-[#85ea10]/50 bg-[#85ea10]/10 font-semibold' : ''}
                ${!isSel && today && !otherMonth ? 'ring-1 ring-gray-300/80 dark:ring-white/20' : ''}
                ${!isSel && !today && !otherMonth && !dis ? 'hover:bg-gray-100 dark:hover:bg-white/10' : ''}
                ${dis ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/80 dark:bg-white/[0.03]">
        <button
          type="button"
          disabled={isTodayDisabled}
          onClick={() => {
            const t = new Date();
            t.setHours(0, 0, 0, 0);
            if (dayDisabled(t)) return;
            onChange?.(toYmd(t));
            setViewMonth(startOfMonth(t));
            setOpen(false);
          }}
          className="text-xs font-medium text-gray-600 dark:text-white/55 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Hoy
        </button>
        {selected && (
          <span className="text-[10px] text-gray-500 dark:text-white/40 truncate max-w-[140px]">
            {format(selected, 'd MMM yyyy')}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400/90 dark:text-white/35 z-[1]" />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={triggerDisabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={() => {
          if (triggerDisabled) return;
          setOpen((o) => !o);
        }}
        className={`${defaultTrigger} ${triggerClassName}`}
      >
        <span className="flex-1 truncate">{displayText}</span>
      </button>
      {mounted && panel && createPortal(panel, document.body)}
    </div>
  );
}
