'use client';

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { getGymWhatsappHref } from '@/lib/gymClientDisplay';
import { CommandCenterPeriodFilters } from '@/modules/gym-admin/components/CommandCenterPeriodFilters';
import { useGymCommandCenter } from '@/modules/gym-admin/hooks/useGymCommandCenter';
import { commandCenterStyles as t } from '@/modules/gym-admin/styles';
import type {
  CommandCenterBirthdayPerson,
  CommandCenterQueuePerson,
} from '@/modules/gym-admin/types';
import {
  type CommandCenterPeriodPreset,
  daysInclusive,
  getCommandCenterToday,
  resolveCommandCenterPeriod,
  ymdAddLocal,
} from '@/modules/gym-admin/utils/command-center-period.util';
import { formatCopHidden } from '@/modules/gym-admin/utils/gym-money.util';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon';
import { buildBirthdayWhatsappUrl } from '@/shared/utils/birthday.util';

type GymCommandCenterPageProps = {
  onOpenCash: () => void;
  onGoToTab: (tabId: string) => void;
};

const EMPTY_CHARTS = { revenueWeek: [], planMix: [] };

const CommandCenterCharts = dynamic(
  () =>
    import('@/modules/gym-admin/components/CommandCenterCharts').then(
      (mod) => mod.CommandCenterCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className={t.chartsGrid}>
        <div className={`${t.skeleton} h-64`} />
        <div className={`${t.skeleton} h-64`} />
      </div>
    ),
  },
);

function formatTodayTitle(ymd: string) {
  const label = formatDateOnlyLocal(
    ymd,
    { weekday: 'long', day: 'numeric', month: 'long' },
    'es-CO',
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function vs30dLabel(delta: number) {
  if (delta === 0) return 'Igual que hace 30 días';
  if (delta > 0) return `+${delta} vs hace 30 días`;
  return `${delta} vs hace 30 días`;
}

function vsPrevLabel(
  pct: number | null,
  from: string,
  to: string,
  today: string,
) {
  if (pct == null) return 'Sin período anterior';
  const rounded = Math.round(pct);
  const sign = rounded > 0 ? '+' : '';
  const suffix =
    from === to
      ? from === today
        ? 'vs ayer'
        : 'vs día anterior'
      : 'vs período anterior';
  return `${sign}${rounded}% ${suffix}`;
}

function periodHeading(
  preset: CommandCenterPeriodPreset,
  from: string,
  to: string,
) {
  if (from === to) return formatTodayTitle(from);
  if (preset === '7d') return 'Últimos 7 días';
  if (preset === 'month') {
    const label = formatDateOnlyLocal(
      from,
      { month: 'long', year: 'numeric' },
      'es-CO',
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const start = formatDateOnlyLocal(from, { day: 'numeric', month: 'short' });
  const end = formatDateOnlyLocal(to, { day: 'numeric', month: 'short' });
  return `${start} – ${end}`;
}

function revenueTitle(from: string, to: string) {
  if (from === to) return 'Ingresos del día';
  const days = daysInclusive(from, to);
  if (days === 7) return 'Ingresos 7 días';
  return 'Ingresos del período';
}

function deltaClass(value: number) {
  if (value > 0) return t.kpiDeltaUp;
  if (value < 0) return t.kpiDeltaDown;
  return t.kpiDeltaFlat;
}

function whatsappWithText(whatsapp: string | null, message: string) {
  const href = getGymWhatsappHref(whatsapp);
  if (!href) return null;
  return `${href}?text=${encodeURIComponent(message)}`;
}

function collectMessage(person: CommandCenterQueuePerson) {
  const when = formatDateOnlyLocal(person.date, {
    day: 'numeric',
    month: 'long',
  });
  return `Hola ${person.name}, te recordamos que tu plan "${person.plan_name}" venció el ${when}. ¿Renovamos para que sigas entrenando?`;
}

function renewMessage(person: CommandCenterQueuePerson) {
  const when = formatDateOnlyLocal(person.date, {
    day: 'numeric',
    month: 'long',
  });
  const days = person.days === 1 ? '1 día' : `${person.days} días`;
  return `Hola ${person.name}, tu plan "${person.plan_name}" vence el ${when} (${days}). ¿Lo renovamos?`;
}

const QueueAvatar = memo(function QueueAvatar({
  seed,
  avatarUrl,
}: {
  seed: string;
  avatarUrl?: string | null;
}) {
  const raw = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  if (raw) {
    return (
      <img
        src={raw}
        alt=""
        width={36}
        height={36}
        className={`${t.avatar} object-cover`}
      />
    );
  }
  return <GymSeededAvatar seed={seed} size={36} className={t.avatar} alt="" />;
});

const QueueRow = memo(function QueueRow({
  href,
  name,
  meta,
  whatsappHref,
  badge,
  seed,
  avatarUrl,
}: {
  href: string;
  name: string;
  meta: string;
  whatsappHref: string | null;
  badge?: string;
  seed: string;
  avatarUrl?: string | null;
}) {
  return (
    <div className={t.row}>
      <QueueAvatar seed={seed} avatarUrl={avatarUrl} />
      <Link href={href} className={t.rowBody}>
        <p className={t.rowName}>{name}</p>
        <p className={t.rowMeta}>{meta}</p>
      </Link>
      <div className={t.rowActions}>
        {badge ? <span className={t.daysBadge}>{badge}</span> : null}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
            title={`WhatsApp a ${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <WhatsAppIcon className="w-4 h-4" />
          </a>
        ) : null}
        <Link
          href={href}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#164151]/50 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/10"
          title="Ver cliente"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
});

function QueueCard({
  title,
  hint,
  count,
  empty,
  accent,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  empty: string;
  accent?: 'warn' | 'default';
  children: ReactNode;
}) {
  const hasItems = count > 0;
  return (
    <section
      className={`${accent === 'warn' ? t.panelRenew : t.panel} ${t.queueCardHeight}`}
    >
      <div className={t.panelHeader}>
        <div className="min-w-0">
          <h2 className={t.panelTitle}>{title}</h2>
          <p className={t.panelHint}>{hint}</p>
        </div>
        <span
          className={
            !hasItems
              ? t.countBadgeMuted
              : accent === 'warn'
                ? t.countBadgeWarn
                : t.countBadge
          }
        >
          {count}
        </span>
      </div>
      {hasItems ? (
        <div className={t.queueList}>{children}</div>
      ) : (
        <p className={t.empty}>{empty}</p>
      )}
    </section>
  );
}

export function GymCommandCenterPage({
  onOpenCash,
  onGoToTab,
}: GymCommandCenterPageProps) {
  const todayYmd = useMemo(() => getCommandCenterToday(), []);
  const [preset, setPreset] = useState<CommandCenterPeriodPreset>('today');
  const [dayYmd, setDayYmd] = useState(todayYmd);
  const [rangeFrom, setRangeFrom] = useState(() => ymdAddLocal(todayYmd, -6));
  const [rangeTo, setRangeTo] = useState(todayYmd);
  const period = useMemo(
    () =>
      resolveCommandCenterPeriod({
        preset,
        today: todayYmd,
        day: dayYmd,
        rangeFrom,
        rangeTo,
      }),
    [preset, todayYmd, dayYmd, rangeFrom, rangeTo],
  );
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGymCommandCenter(period.from, period.to);
  const [hideMoney, setHideMoney] = useState(false);

  const handlePreset = useCallback(
    (next: CommandCenterPeriodPreset) => {
      setPreset(next);
      if (next === 'day') setDayYmd((current) => current || todayYmd);
      if (next === 'range') {
        setRangeFrom((current) => current || ymdAddLocal(todayYmd, -6));
        setRangeTo((current) => current || todayYmd);
      }
    },
    [todayYmd],
  );

  const money = useCallback(
    (amount: number) => formatCopHidden(hideMoney, amount),
    [hideMoney],
  );

  const heading = useMemo(
    () => periodHeading(preset, period.from, period.to),
    [preset, period.from, period.to],
  );

  if (isLoading && !data) {
    return (
      <div className={t.page}>
        <div className={t.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={t.skeleton} />
          ))}
        </div>
        <div className={t.chartsGrid}>
          <div className={`${t.skeleton} h-64`} />
          <div className={`${t.skeleton} h-64`} />
        </div>
        <div className={t.split}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${t.skeleton} ${t.queueCardHeight}`} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={t.errorBox}>
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          No se pudo cargar el centro de mando.
        </p>
        {error instanceof Error && error.message ? (
          <p className="mt-2 text-xs text-red-600/80 dark:text-red-300/70">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => refetch()}
          className={`${t.ghostBtn} mt-4`}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, cash, queue } = data;
  const from = data.period?.from ?? period.from;
  const to = data.period?.to ?? period.to;
  const isSingleDay = from === to;
  const isToday = isSingleDay && from === todayYmd;
  const netDelta = kpis.netToday.vsYesterdayPct ?? 0;

  return (
    <div className={t.page}>
      <div className={t.header}>
        <div>
          <h1 className={t.title}>{heading}</h1>
          <p className={t.subtitle}>
            Qué hay que hacer ahora en la sede física
          </p>
        </div>
        <div className={t.headerActions}>
          <button
            type="button"
            onClick={() => setHideMoney((v) => !v)}
            className={t.iconBtn}
            title={hideMoney ? 'Mostrar números' : 'Ocultar números'}
          >
            {hideMoney ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className={t.iconBtn}
            title="Actualizar"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
          <button type="button" onClick={onOpenCash} className={t.ghostBtn}>
            Ver caja del día
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CommandCenterPeriodFilters
        preset={preset}
        onPreset={handlePreset}
        today={todayYmd}
        day={dayYmd}
        onDay={setDayYmd}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onRangeFrom={setRangeFrom}
        onRangeTo={setRangeTo}
      />

      <div className={t.kpiGrid}>
        <button
          type="button"
          className={t.kpiCard}
          onClick={() => onGoToTab('users')}
        >
          <div className={t.kpiTop}>
            <div className={`${t.kpiIcon} bg-[#164151]/10 dark:bg-white/10`}>
              <Users className="w-4 h-4 text-[#164151] dark:text-white" />
            </div>
            <div>
              <p className={t.kpiLabel}>Vigentes</p>
              <p className={t.kpiHint}>Clientes con plan en curso</p>
            </div>
          </div>
          <p className={t.kpiValue}>{kpis.active.count}</p>
          <p className={`${t.kpiDelta} ${deltaClass(kpis.active.vs30d)}`}>
            {vs30dLabel(kpis.active.vs30d)}
          </p>
        </button>

        <div className={t.kpiCardStatic}>
          <div className={t.kpiTop}>
            <div className={`${t.kpiIcon} bg-amber-100 dark:bg-amber-500/20`}>
              <CalendarClock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className={t.kpiLabel}>Por vencer</p>
              <p className={t.kpiHint}>
                Próximos {kpis.endingSoon.days} días, sin renovación
              </p>
            </div>
          </div>
          <p className={t.kpiValue}>{kpis.endingSoon.count}</p>
          <p className={`${t.kpiDelta} ${t.kpiDeltaFlat}`}>
            Acción: WhatsApp de renovación
          </p>
        </div>

        <button
          type="button"
          className={t.kpiCard}
          onClick={() => onGoToTab('users')}
        >
          <div className={t.kpiTop}>
            <div className={`${t.kpiIcon} bg-orange-100 dark:bg-orange-500/20`}>
              <AlertTriangle className="w-4 h-4 text-orange-700 dark:text-orange-300" />
            </div>
            <div>
              <p className={t.kpiLabel}>Vencidos</p>
              <p className={t.kpiHint}>Sin plan vigente ni pago adelantado</p>
            </div>
          </div>
          <p className={t.kpiValue}>{kpis.expired.count}</p>
          <p className={`${t.kpiDelta} ${t.kpiDeltaFlat}`}>
            Acción: cobrar / renovar
          </p>
        </button>

        <button type="button" className={t.kpiCard} onClick={onOpenCash}>
          <div className={t.kpiTop}>
            <div className={`${t.kpiIcon} bg-[#85ea10]/20`}>
              {kpis.netToday.amount >= 0 ? (
                <TrendingUp className="w-4 h-4 text-[#164151] dark:text-[#85ea10]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-300" />
              )}
            </div>
            <div>
              <p className={t.kpiLabel}>
                {isSingleDay ? 'Neto del día' : 'Neto del período'}
              </p>
              <p className={t.kpiHint}>Ingresos menos egresos (sede física)</p>
            </div>
          </div>
          <p className={t.kpiValue}>{money(kpis.netToday.amount)}</p>
          <p className={`${t.kpiDelta} ${deltaClass(netDelta)}`}>
            {vsPrevLabel(kpis.netToday.vsYesterdayPct, from, to, todayYmd)}
          </p>
        </button>
      </div>

      <CommandCenterCharts
        charts={data.charts ?? EMPTY_CHARTS}
        hideMoney={hideMoney}
        revenueTitle={revenueTitle(from, to)}
      />

      <div className={t.split}>
        <QueueCard
          title="Cobrar"
          hint="Planes vencidos, sin renovación"
          count={queue.totals.collect}
          empty="Nadie por cobrar hoy."
        >
          {queue.collect.map((person) => (
            <QueueRow
              key={`collect-${person.client_info_id}`}
              href={person.href}
              name={person.name}
              seed={person.client_info_id}
              avatarUrl={person.avatar_url}
              meta={`${person.plan_name} · venció hace ${person.days} ${person.days === 1 ? 'día' : 'días'}`}
              whatsappHref={whatsappWithText(
                person.whatsapp,
                collectMessage(person),
              )}
            />
          ))}
        </QueueCard>

        <QueueCard
          title="Por renovar"
          hint="Vencen en los próximos 7 días"
          count={queue.totals.renew}
          empty="Nadie por vencer esta semana."
          accent="warn"
        >
          {queue.renew.map((person) => (
            <QueueRow
              key={`renew-${person.client_info_id}`}
              href={person.href}
              name={person.name}
              seed={person.client_info_id}
              avatarUrl={person.avatar_url}
              meta={`${person.plan_name} · ${formatDateOnlyLocal(person.date, { day: 'numeric', month: 'short' })}`}
              badge={person.days === 1 ? 'Hoy' : `${person.days} días`}
              whatsappHref={whatsappWithText(
                person.whatsapp,
                renewMessage(person),
              )}
            />
          ))}
        </QueueCard>

        <section className={`${t.panel} ${t.queueCardHeight}`}>
          <div className={t.panelHeader}>
            <div>
              <h2 className={t.panelTitle}>
                {isToday
                  ? 'Caja de hoy'
                  : isSingleDay
                    ? 'Caja del día'
                    : 'Caja del período'}
              </h2>
              <p className={t.panelHint}>
                {cash.invoiceCount}{' '}
                {cash.invoiceCount === 1 ? 'factura' : 'facturas'} en sede
                física
              </p>
            </div>
            <Wallet className="w-4 h-4 text-[#164151]/50 dark:text-white/40" />
          </div>

          <div className={`${t.queueList} flex flex-col`}>
            <div className={t.cashLine}>
              <span className={t.cashLabel}>Ingresos</span>
              <span className={t.cashValue}>{money(cash.income)}</span>
            </div>
            <div className={t.cashLine}>
              <span className={t.cashLabel}>Efectivo</span>
              <span className={t.cashValue}>{money(cash.cash)}</span>
            </div>
            <div className={t.cashLine}>
              <span className={t.cashLabel}>Transferencia</span>
              <span className={t.cashValue}>{money(cash.transfer)}</span>
            </div>
            {cash.mixed > 0 ? (
              <div className={t.cashLine}>
                <span className={t.cashLabel}>Mixto</span>
                <span className={t.cashValue}>{money(cash.mixed)}</span>
              </div>
            ) : null}
            <div className={t.cashLine}>
              <span className={t.cashLabel}>Egresos</span>
              <span className={t.cashValue}>{money(cash.expenses)}</span>
            </div>
            <div className={t.cashNet}>
              <span className={t.cashNetLabel}>Neto</span>
              <span className={t.cashNetValue}>{money(cash.net)}</span>
            </div>
            <button type="button" onClick={onOpenCash} className={t.onlineRow}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                Ver detalle de caja
              </p>
              <p className="text-sm font-medium text-[#164151] dark:text-white mt-0.5">
                Facturas, gráfica y filtros de período
              </p>
            </button>
            <button
              type="button"
              onClick={() => onGoToTab('sales')}
              className={t.onlineRow}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                Academia online
              </p>
              <p className="text-sm font-medium text-[#164151] dark:text-white mt-0.5">
                {money(cash.onlineIncome)} · {cash.onlineCount}{' '}
                {cash.onlineCount === 1 ? 'venta' : 'ventas'}
                {isToday ? ' hoy' : ''}
              </p>
            </button>
          </div>
        </section>
      </div>

      <div className={t.secondaryGrid}>
        <QueueCard
          title="Anticipos"
          hint="Planes pagados que aún no empiezan"
          count={queue.totals.advances}
          empty="Sin anticipos por revisar."
        >
          {queue.advances.map((person) => (
            <QueueRow
              key={`adv-${person.client_info_id}`}
              href={person.href}
              name={person.name}
              seed={person.client_info_id}
              avatarUrl={person.avatar_url}
              meta={`${person.plan_name} · empieza ${formatDateOnlyLocal(person.date, { day: 'numeric', month: 'short' })}${person.amount != null ? ` · ${money(person.amount)}` : ''}`}
              whatsappHref={getGymWhatsappHref(person.whatsapp)}
            />
          ))}
        </QueueCard>

        <QueueCard
          title="Cumpleaños"
          hint={
            isToday
              ? 'Clientes que cumplen años hoy'
              : isSingleDay
                ? 'Clientes que cumplen años ese día'
                : 'Clientes que cumplen años en el período'
          }
          count={queue.totals.birthdays}
          empty={
            isToday
              ? 'Nadie cumple años hoy.'
              : 'Nadie cumple años en este período.'
          }
        >
          {queue.birthdays.map((person: CommandCenterBirthdayPerson) => (
            <QueueRow
              key={`bd-${person.client_info_id}`}
              href={person.href}
              name={person.name}
              seed={person.client_info_id}
              avatarUrl={person.avatar_url}
              meta={`${person.age} años`}
              whatsappHref={buildBirthdayWhatsappUrl(
                person.name,
                person.whatsapp,
              )}
            />
          ))}
        </QueueCard>
      </div>
    </div>
  );
}
