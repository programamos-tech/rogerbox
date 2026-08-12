export type GymDurationUnit = 'day' | 'week' | 'month';

export const GYM_DURATION_PRESETS = [
  { key: '1d', label: '1 día', unit: 'day' as const, value: 1 },
  { key: '1w', label: '1 semana', unit: 'week' as const, value: 1 },
  { key: '2w', label: '2 semanas', unit: 'week' as const, value: 2 },
  { key: '1m', label: '1 mes', unit: 'month' as const, value: 1 },
  { key: '2m', label: '2 meses', unit: 'month' as const, value: 2 },
  { key: '3m', label: '3 meses', unit: 'month' as const, value: 3 },
] as const;

export function parseGymPlanDuration(durationDays: number): {
  unit: GymDurationUnit;
  value: number;
} {
  const days = Math.max(1, Number(durationDays) || 30);
  if (days >= 30 && days % 30 === 0) {
    return { unit: 'month', value: days / 30 };
  }
  // Quincena histórica (15 días) = 2 semanas
  if (days === 15) {
    return { unit: 'week', value: 2 };
  }
  if (days % 7 === 0) {
    return { unit: 'week', value: days / 7 };
  }
  return { unit: 'day', value: days };
}

export function toDurationDays(unit: GymDurationUnit, value: number): number {
  const n = Math.max(1, Math.round(Number(value) || 1));
  if (unit === 'month') return n * 30;
  if (unit === 'week') return n * 7;
  return n;
}

export function formatGymPlanDuration(durationDays: number): string {
  const { unit, value } = parseGymPlanDuration(durationDays);
  if (unit === 'month') {
    return value === 1 ? '1 mes' : `${value} meses`;
  }
  if (unit === 'week') {
    return value === 1 ? '1 semana' : `${value} semanas`;
  }
  return value === 1 ? '1 día' : `${value} días`;
}

export function isGymDurationPresetSelected(
  durationDays: number,
  unit: GymDurationUnit,
  value: number,
): boolean {
  const parsed = parseGymPlanDuration(durationDays);
  return parsed.unit === unit && parsed.value === value;
}
