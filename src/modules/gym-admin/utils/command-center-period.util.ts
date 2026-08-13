import { getTodayYmdColombia, parseLocalDate } from '@/lib/dateUtils';

export type CommandCenterPeriodPreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | 'month'
  | 'year'
  | 'day'
  | 'range';

export const COMMAND_CENTER_MAX_PERIOD_DAYS = 366;

export function ymdAddLocal(ymd: string, days: number): string {
  const d = parseLocalDate(ymd);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysInclusive(from: string, to: string): number {
  const start = parseLocalDate(from).getTime();
  const end = parseLocalDate(to).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function resolveCommandCenterPeriod({
  preset,
  today,
  day,
  rangeFrom,
  rangeTo,
}: {
  preset: CommandCenterPeriodPreset;
  today: string;
  day: string;
  rangeFrom: string;
  rangeTo: string;
}): { from: string; to: string } {
  if (preset === 'yesterday') {
    const yesterday = ymdAddLocal(today, -1);
    return { from: yesterday, to: yesterday };
  }
  if (preset === '7d') {
    return { from: ymdAddLocal(today, -6), to: today };
  }
  if (preset === 'month') {
    return clampPeriod(`${today.slice(0, 7)}-01`, today);
  }
  if (preset === 'year') {
    return clampPeriod(`${today.slice(0, 4)}-01-01`, today);
  }
  if (preset === 'day') {
    const ymd = day || today;
    return { from: ymd, to: ymd };
  }
  if (preset === 'range') {
    let from = rangeFrom || ymdAddLocal(today, -6);
    let to = rangeTo || today;
    if (from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    return clampPeriod(from, to);
  }
  return { from: today, to: today };
}

function clampPeriod(from: string, to: string): { from: string; to: string } {
  let start = from;
  let end = to;
  if (start > end) {
    const swap = start;
    start = end;
    end = swap;
  }
  const days = daysInclusive(start, end);
  if (days > COMMAND_CENTER_MAX_PERIOD_DAYS) {
    start = ymdAddLocal(end, -(COMMAND_CENTER_MAX_PERIOD_DAYS - 1));
  }
  return { from: start, to: end };
}

export function getCommandCenterToday(): string {
  return getTodayYmdColombia();
}
