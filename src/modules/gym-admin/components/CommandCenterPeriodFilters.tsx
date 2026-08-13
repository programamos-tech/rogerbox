'use client';

import { commandCenterStyles as t } from '@/modules/gym-admin/styles';
import type { CommandCenterPeriodPreset } from '@/modules/gym-admin/utils/command-center-period.util';
import { DatePickerField } from '@/shared/components/DatePickerField';

const PRESETS: { id: CommandCenterPeriodPreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: '7d', label: '7 días' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
  { id: 'day', label: 'Día' },
  { id: 'range', label: 'Rango' },
];

type CommandCenterPeriodFiltersProps = {
  preset: CommandCenterPeriodPreset;
  onPreset: (preset: CommandCenterPeriodPreset) => void;
  today: string;
  day: string;
  onDay: (ymd: string) => void;
  rangeFrom: string;
  rangeTo: string;
  onRangeFrom: (ymd: string) => void;
  onRangeTo: (ymd: string) => void;
};

export function CommandCenterPeriodFilters({
  preset,
  onPreset,
  today,
  day,
  onDay,
  rangeFrom,
  rangeTo,
  onRangeFrom,
  onRangeTo,
}: CommandCenterPeriodFiltersProps) {
  return (
    <div className={t.filterRow}>
      {PRESETS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPreset(item.id)}
          className={preset === item.id ? t.filterChipOn : t.filterChipOff}
        >
          {item.label}
        </button>
      ))}
      {preset === 'day' ? (
        <DatePickerField
          value={day}
          onChange={onDay}
          maxDate={today}
          aria-label="Día específico"
          className="min-w-[148px]"
          triggerClassName={t.filterDateTrigger}
        />
      ) : null}
      {preset === 'range' ? (
        <div className="flex items-center gap-2">
          <DatePickerField
            value={rangeFrom}
            onChange={onRangeFrom}
            maxDate={today}
            aria-label="Fecha de inicio"
            className="min-w-[148px]"
            triggerClassName={t.filterDateTrigger}
          />
          <span className="text-sm text-gray-500 dark:text-white/45">—</span>
          <DatePickerField
            value={rangeTo}
            onChange={onRangeTo}
            maxDate={today}
            minDate={rangeFrom}
            aria-label="Fecha de fin"
            className="min-w-[148px]"
            triggerClassName={t.filterDateTrigger}
          />
        </div>
      ) : null}
    </div>
  );
}
