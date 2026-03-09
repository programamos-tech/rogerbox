/**
 * Suma N meses calendario a una fecha (mes a mes: 25 feb → 25 mar).
 * Si el día no existe en el mes resultante (ej. 31 ene → feb), usa el último día del mes (28/29 feb).
 */
export function addCalendarMonths(date: Date, months: number): Date {
  const d = date.getDate();
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(d, lastDay));
  return result;
}

/**
 * Convierte duration_days del plan a meses para cálculo mes a mes (30 → 1, 60 → 2, 90 → 3).
 */
export function durationDaysToMonths(durationDays: number): number {
  if (!durationDays || durationDays <= 0) return 1;
  return Math.max(1, Math.round(durationDays / 30));
}

/**
 * Dada una fecha de inicio y duration_days del plan, devuelve la fecha de fin en formato YYYY-MM-DD (mes a mes).
 */
export function membershipEndDateFromStart(
  startDate: Date,
  durationDays: number,
): string {
  const end = addCalendarMonths(startDate, durationDaysToMonths(durationDays));
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
}

/** Parsea YYYY-MM-DD como fecha local (evita UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Parsea un string YYYY-MM-DD como fecha local (no UTC) y la formatea.
 * Evita que "2026-03-03" se muestre como 2 mar en zonas detrás de UTC.
 */
export function formatDateOnlyLocal(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
  locale = 'es-ES',
): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, options);
}
