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
import Link from 'next/link';
import { memo, useCallback, useMemo, useState } from 'react';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { getGymWhatsappHref } from '@/lib/gymClientDisplay';
import { useGymCommandCenter } from '@/modules/gym-admin/hooks/useGymCommandCenter';
import { commandCenterStyles as t } from '@/modules/gym-admin/styles';
import type {
  CommandCenterBirthdayPerson,
  CommandCenterQueuePerson,
} from '@/modules/gym-admin/types';
import { formatCopHidden } from '@/modules/gym-admin/utils/gym-money.util';
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon';
import { buildBirthdayWhatsappUrl } from '@/shared/utils/birthday.util';

type GymCommandCenterPageProps = {
  onOpenCash: () => void;
  onGoToTab: (tabId: string) => void;
};

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

function vsYesterdayLabel(pct: number | null) {
  if (pct == null) return 'Sin movimiento ayer';
  const rounded = Math.round(pct);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% vs ayer`;
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

const QueueRow = memo(function QueueRow({
  href,
  name,
  meta,
  whatsappHref,
}: {
  href: string;
  name: string;
  meta: string;
  whatsappHref: string | null;
}) {
  return (
    <div className={t.row}>
      <div className={t.avatar} aria-hidden>
        {(name || '?').charAt(0).toUpperCase()}
      </div>
      <Link href={href} className={t.rowBody}>
        <p className={t.rowName}>{name}</p>
        <p className={t.rowMeta}>{meta}</p>
      </Link>
      <div className={t.rowActions}>
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

export function GymCommandCenterPage({
  onOpenCash,
  onGoToTab,
}: GymCommandCenterPageProps) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGymCommandCenter();
  const [hideMoney, setHideMoney] = useState(false);

  const money = useCallback(
    (amount: number) => formatCopHidden(hideMoney, amount),
    [hideMoney],
  );

  const todayTitle = useMemo(
    () => (data?.today ? formatTodayTitle(data.today) : 'Hoy'),
    [data?.today],
  );

  const queueEmpty = useMemo(() => {
    if (!data) return false;
    const { totals } = data.queue;
    return (
      totals.collect + totals.renew + totals.advances + totals.birthdays === 0
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className={t.page}>
        <div className={t.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={t.skeleton} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className={`${t.skeleton} h-80`} />
          <div className={`${t.skeleton} h-80`} />
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
  const netDelta = kpis.netToday.vsYesterdayPct ?? 0;

  return (
    <div className={t.page}>
      <div className={t.header}>
        <div>
          <h1 className={t.title}>{todayTitle}</h1>
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
              <p className={t.kpiLabel}>Neto del día</p>
              <p className={t.kpiHint}>Ingresos menos egresos (sede física)</p>
            </div>
          </div>
          <p className={t.kpiValue}>{money(kpis.netToday.amount)}</p>
          <p className={`${t.kpiDelta} ${deltaClass(netDelta)}`}>
            {vsYesterdayLabel(kpis.netToday.vsYesterdayPct)}
          </p>
        </button>
      </div>

      <div className={t.split}>
        <section className={t.panel}>
          <div className={t.panelHeader}>
            <div>
              <h2 className={t.panelTitle}>Hacer hoy</h2>
              <p className={t.panelHint}>
                Cobrar, renovar, revisar anticipos y felicitar
              </p>
            </div>
          </div>

          {queueEmpty ? (
            <p className={t.empty}>Nada pendiente. El gimnasio está al día.</p>
          ) : (
            <div className="pb-3">
              {queue.collect.length > 0 ? (
                <>
                  <p className={t.sectionLabel}>
                    Cobrar · {queue.totals.collect}
                  </p>
                  {queue.collect.map((person) => (
                    <QueueRow
                      key={`collect-${person.client_info_id}`}
                      href={person.href}
                      name={person.name}
                      meta={`${person.plan_name} · venció hace ${person.days} ${person.days === 1 ? 'día' : 'días'}`}
                      whatsappHref={whatsappWithText(
                        person.whatsapp,
                        collectMessage(person),
                      )}
                    />
                  ))}
                </>
              ) : null}

              {queue.renew.length > 0 ? (
                <>
                  <p className={t.sectionLabel}>
                    Renovar · {queue.totals.renew}
                  </p>
                  {queue.renew.map((person) => (
                    <QueueRow
                      key={`renew-${person.client_info_id}`}
                      href={person.href}
                      name={person.name}
                      meta={`${person.plan_name} · ${person.days} ${person.days === 1 ? 'día' : 'días'} · ${formatDateOnlyLocal(person.date, { day: 'numeric', month: 'short' })}`}
                      whatsappHref={whatsappWithText(
                        person.whatsapp,
                        renewMessage(person),
                      )}
                    />
                  ))}
                </>
              ) : null}

              {queue.advances.length > 0 ? (
                <>
                  <p className={t.sectionLabel}>
                    Anticipos · {queue.totals.advances}
                  </p>
                  {queue.advances.map((person) => (
                    <QueueRow
                      key={`adv-${person.client_info_id}`}
                      href={person.href}
                      name={person.name}
                      meta={`${person.plan_name} · empieza ${formatDateOnlyLocal(person.date, { day: 'numeric', month: 'short' })}${person.amount != null ? ` · ${money(person.amount)}` : ''}`}
                      whatsappHref={getGymWhatsappHref(person.whatsapp)}
                    />
                  ))}
                </>
              ) : null}

              {queue.birthdays.length > 0 ? (
                <>
                  <p className={t.sectionLabel}>
                    Cumpleaños · {queue.totals.birthdays}
                  </p>
                  {queue.birthdays.map(
                    (person: CommandCenterBirthdayPerson) => (
                      <QueueRow
                        key={`bd-${person.client_info_id}`}
                        href={person.href}
                        name={person.name}
                        meta={`${person.age} años`}
                        whatsappHref={buildBirthdayWhatsappUrl(
                          person.name,
                          person.whatsapp,
                        )}
                      />
                    ),
                  )}
                </>
              ) : null}
            </div>
          )}
        </section>

        <section className={t.panel}>
          <div className={t.panelHeader}>
            <div>
              <h2 className={t.panelTitle}>Caja de hoy</h2>
              <p className={t.panelHint}>
                {cash.invoiceCount}{' '}
                {cash.invoiceCount === 1 ? 'factura' : 'facturas'} en sede
                física
              </p>
            </div>
            <Wallet className="w-4 h-4 text-[#164151]/50 dark:text-white/40" />
          </div>

          <div className="pb-2">
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
              {cash.onlineCount === 1 ? 'venta' : 'ventas'} hoy
            </p>
          </button>
        </section>
      </div>
    </div>
  );
}
