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
