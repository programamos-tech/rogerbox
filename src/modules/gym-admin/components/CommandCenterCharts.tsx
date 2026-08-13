'use client';

import { memo, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { commandCenterStyles as t } from '@/modules/gym-admin/styles';
import type { GymCommandCenterResponse } from '@/modules/gym-admin/types';
import { formatCopHidden } from '@/modules/gym-admin/utils/gym-money.util';
import { useTheme } from '@/shared/components/ThemeProvider';

type Charts = GymCommandCenterResponse['charts'];

type CommandCenterChartsProps = {
  charts: Charts;
  hideMoney: boolean;
};

type TooltipViewProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
};

function compactCop(amount: number) {
  const n = Math.round(Number(amount) || 0);
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `$${millions.toFixed(millions >= 10 ? 0 : 1)}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

function truncateLabel(name: string, max = 16) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function MoneyTooltip({
  active,
  payload,
  label,
  hideMoney,
}: TooltipViewProps & { hideMoney: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={t.chartTooltip}>
      <p className={t.chartTooltipLabel}>{label}</p>
      <p className={t.chartTooltipValue}>
        {formatCopHidden(hideMoney, Number(payload[0].value || 0))}
      </p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: TooltipViewProps) {
  if (!active || !payload?.length) return null;
  const count = Number(payload[0].value || 0);
  return (
    <div className={t.chartTooltip}>
      <p className={t.chartTooltipLabel}>{label}</p>
      <p className={t.chartTooltipValue}>
        {count} {count === 1 ? 'cliente' : 'clientes'}
      </p>
    </div>
  );
}

export const CommandCenterCharts = memo(function CommandCenterCharts({
  charts,
  hideMoney,
}: CommandCenterChartsProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const axis = dark ? '#9ca3af' : '#6b7280';
  const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(22,65,81,0.08)';
  const accent = dark ? '#85ea10' : '#164151';

  const weekTotal = useMemo(
    () => charts.revenueWeek.reduce((sum, day) => sum + day.amount, 0),
    [charts.revenueWeek],
  );
  const mixTotal = useMemo(
    () => charts.planMix.reduce((sum, item) => sum + item.count, 0),
    [charts.planMix],
  );

  return (
    <div className={t.chartsGrid}>
      <section className={t.chartPanel}>
        <div className={t.panelHeader}>
          <div className="min-w-0">
            <h2 className={t.panelTitle}>Ingresos 7 días</h2>
            <p className={t.panelHint}>
              Sede física · efectivo, transferencia y mixto
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-[#164151] dark:text-white">
            {formatCopHidden(hideMoney, weekTotal)}
          </p>
        </div>
        <div className={t.chartBody}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={charts.revenueWeek}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="commandRevenueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value: number) =>
                  hideMoney ? '' : compactCop(value)
                }
              />
              <Tooltip
                cursor={{ stroke: accent, strokeOpacity: 0.25 }}
                content={(props) => (
                  <MoneyTooltip
                    active={props.active}
                    payload={props.payload as TooltipViewProps['payload']}
                    label={String(props.label ?? '')}
                    hideMoney={hideMoney}
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={accent}
                strokeWidth={2}
                fill="url(#commandRevenueFill)"
                dot={false}
                activeDot={{ r: 4, fill: accent }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={t.chartPanel}>
        <div className={t.panelHeader}>
          <div className="min-w-0">
            <h2 className={t.panelTitle}>Mix de planes</h2>
            <p className={t.panelHint}>Clientes vigentes por plan</p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-[#164151] dark:text-white">
            {mixTotal}
          </p>
        </div>
        {charts.planMix.length > 0 ? (
          <div className={t.chartBody}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.planMix}
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke={grid} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: string) => truncateLabel(value)}
                />
                <Tooltip
                  cursor={{
                    fill: dark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(22,65,81,0.05)',
                  }}
                  content={(props) => (
                    <CountTooltip
                      active={props.active}
                      payload={props.payload as TooltipViewProps['payload']}
                      label={String(props.label ?? '')}
                    />
                  )}
                />
                <Bar
                  dataKey="count"
                  fill={accent}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={t.empty}>Sin clientes vigentes para graficar.</p>
        )}
      </section>
    </div>
  );
});
