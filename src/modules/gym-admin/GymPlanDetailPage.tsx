'use client';

import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Filter,
  MessageCircle,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  formatMembershipDayLabel,
  getMembershipPeriodProgress,
  getTodayYmdColombia,
  parseLocalDate,
} from '@/lib/dateUtils';
import { getGymWhatsappHref } from '@/lib/gymClientDisplay';
import { useGymPlanOverview } from '@/modules/gym-admin/hooks/useGymPlanOverview';
import { formatGymPlanDuration } from '@/modules/gym-admin/utils/gym-plan-duration.util';
import { gymPlanClientsStyles as t } from '@/modules/gym-admin/styles';
import type { GymPlanOverviewMembership } from '@/modules/gym-admin/types';

type ClientRowStatus = 'expired' | 'ending_soon' | 'current';
type ClientSortKey = 'name' | 'status' | 'end' | 'progress';
type SortDir = 'asc' | 'desc';
type MembershipFilter = 'all' | 'expired' | 'ending_soon' | 'current';

const PAGE_SIZE = 25;

/** Orden por defecto: vencidos → por vencer → al día */
const STATUS_ORDER: Record<ClientRowStatus, number> = {
  expired: 0,
  ending_soon: 1,
  current: 2,
};

/** Membresía a mostrar: la más reciente que ya empezó (futuros → Anticipos por revisar). */
function pickRosterMembership(
  memberships: GymPlanOverviewMembership[],
  today: Date,
): GymPlanOverviewMembership {
  const started = memberships.filter((m) => {
    const start = parseLocalDate(m.start_date);
    start.setHours(0, 0, 0, 0);
    return start <= today;
  });
  return started[0] || memberships[0];
}

function getClientRowMeta(
  memberships: GymPlanOverviewMembership[],
  today: Date,
) {
  const latest = pickRosterMembership(memberships, today);
  const client = latest.client_info;
  const href =
    client?.user_id != null && client.user_id !== ''
      ? `/admin/users/${client.user_id}`
      : null;
  const period = getMembershipPeriodProgress(
    latest.start_date,
    latest.end_date,
    today,
  );
  const endDate = parseLocalDate(latest.end_date);
  const isExpired = today > endDate;
  const status: ClientRowStatus = isExpired
    ? 'expired'
    : period.endingSoon
      ? 'ending_soon'
      : 'current';
  const pctWidth = isExpired ? 100 : Math.round(period.pct);
  const whatsappHref = getGymWhatsappHref(client?.whatsapp);
  const whatsappLabel = whatsappHref ? client?.whatsapp || null : null;

  return {
    latest,
    client,
    href,
    period,
    status,
    whatsappHref,
    whatsappLabel,
    pctWidth,
    startMs: parseLocalDate(latest.start_date).getTime(),
    endMs: endDate.getTime(),
    startLabel: formatMembershipDayLabel(parseLocalDate(latest.start_date)),
    endLabel: formatMembershipDayLabel(endDate),
  };
}

function statusLabel(status: ClientRowStatus) {
  if (status === 'expired') return 'Vencido';
  if (status === 'ending_soon') return 'Por vencer';
  return 'Al día';
}

function statusClass(status: ClientRowStatus) {
  if (status === 'expired') return t.badgeExpired;
  if (status === 'ending_soon') return t.badgeEndingSoon;
  return t.badgePeriod;
}

function progressFillClass(status: ClientRowStatus) {
  if (status === 'expired') return t.progressFillExpired;
  if (status === 'ending_soon') return t.progressFillSoon;
  return t.progressFill;
}

function remainingLabel(
  status: ClientRowStatus,
  period: ReturnType<typeof getMembershipPeriodProgress>,
) {
  if (status === 'expired') return 'Vencido';
  if (status === 'ending_soon') {
    return `${period.daysLeft} ${period.daysLeft === 1 ? 'día' : 'días'} · por vencer`;
  }
  return `${Math.round(period.pct)}% · ${period.daysLeft} ${period.daysLeft === 1 ? 'día' : 'días'}`;
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDir;
}) {
  if (!active) {
    return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5" />
  );
}

const PlanClientTableRow = memo(function PlanClientTableRow({
  memberships,
  today,
  onOpen,
}: {
  memberships: GymPlanOverviewMembership[];
  today: Date;
  onOpen: (href: string) => void;
}) {
  const meta = getClientRowMeta(memberships, today);
  const name = meta.client?.name ?? 'Sin nombre';

  return (
    <tr
      className={meta.href ? t.row : t.rowStatic}
      onClick={meta.href ? () => onOpen(meta.href as string) : undefined}
    >
      <td className={t.td}>
        {meta.href ? (
          <Link
            href={meta.href}
            className={t.planName}
            onClick={(event) => event.stopPropagation()}
          >
            {name}
          </Link>
        ) : (
          <p className={t.planName}>{name}</p>
        )}
        {meta.client?.document_id ? (
          <p className={t.planDesc}>Doc. {meta.client.document_id}</p>
        ) : null}
      </td>
      <td className={t.td}>
        <span className={statusClass(meta.status)}>
          {statusLabel(meta.status)}
        </span>
      </td>
      <td className={t.td}>
        <span className={t.periodDates}>
          {meta.startLabel}
          <span className={t.periodSep}>→</span>
          {meta.endLabel}
        </span>
      </td>
      <td className={`${t.td} ${t.progressCell}`}>
        <div
          className={t.progressTrack}
          role="progressbar"
          aria-valuenow={meta.pctWidth}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del período"
        >
          <div
            className={progressFillClass(meta.status)}
            style={{ width: `${meta.pctWidth}%` }}
          />
        </div>
        <p
          className={
            meta.status === 'ending_soon' ? t.progressMetaWarn : t.progressMeta
          }
        >
          {remainingLabel(meta.status, meta.period)}
        </p>
      </td>
      <td className={t.td}>
        {meta.whatsappHref && meta.whatsappLabel ? (
          <a
            href={meta.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className={t.whatsappLink}
          >
            {meta.whatsappLabel}
          </a>
        ) : (
          <span className={t.historyMuted}>—</span>
        )}
      </td>
      <td className={`${t.td} text-right`}>
        <div className="inline-flex items-center justify-end gap-0.5">
          {meta.whatsappHref ? (
            <a
              href={meta.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className={t.actionBtn}
              title="WhatsApp"
              aria-label={`WhatsApp de ${name}`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          ) : null}
          {meta.href ? (
            <Link
              href={meta.href}
              onClick={(event) => event.stopPropagation()}
              className={t.actionBtn}
              title="Ver ficha"
              aria-label={`Ver ficha de ${name}`}
            >
              <Eye className="w-4 h-4" />
            </Link>
          ) : null}
          {!meta.whatsappHref && !meta.href ? (
            <span className={t.historyMuted}>—</span>
          ) : null}
        </div>
      </td>
    </tr>
  );
});

export function GymPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params?.id as string | undefined;
  const { user: authUser, loading: authLoading } = useSupabaseAuth();

  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
    const matchId = envId && authUser.id === envId;
    const matchEmail = envEmail && authUser.email === envEmail;
    const matchRole = authUser.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [authUser]);

  const { data, isLoading, isError, error, refetch } =
    useGymPlanOverview(planId);
  const [clientSearch, setClientSearch] = useState('');
  const [membershipStateFilter, setMembershipStateFilter] =
    useState<MembershipFilter>('all');
  const [sortKey, setSortKey] = useState<ClientSortKey>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const today = useMemo(() => {
    const d = parseLocalDate(getTodayYmdColombia());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const planMemberships = useMemo(() => {
    if (!data) return [];
    // Excluir períodos futuros (van a Anticipos por revisar en Facturas).
    const startedOnly = (rows: GymPlanOverviewMembership[]) =>
      rows.filter((m) => {
        const start = parseLocalDate(m.start_date);
        start.setHours(0, 0, 0, 0);
        return start <= today;
      });

    const active = startedOnly([...data.active_memberships]).sort(
      (a, b) =>
        parseLocalDate(a.end_date).getTime() -
        parseLocalDate(b.end_date).getTime(),
    );
    const expired = [...data.expired_memberships].sort(
      (a, b) =>
        parseLocalDate(b.end_date).getTime() -
        parseLocalDate(a.end_date).getTime(),
    );
    return [...active, ...expired];
  }, [data, today]);

  const filteredMemberships = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return planMemberships.filter((m) => {
      const period = getMembershipPeriodProgress(
        m.start_date,
        m.end_date,
        today,
      );
      const endDate = parseLocalDate(m.end_date);
      const isExpiredPeriod = today > endDate;
      const status: ClientRowStatus = isExpiredPeriod
        ? 'expired'
        : period.endingSoon
          ? 'ending_soon'
          : 'current';

      if (membershipStateFilter !== 'all' && status !== membershipStateFilter) {
        return false;
      }

      if (!q) return true;
      const name = (m.client_info?.name || '').toLowerCase();
      const doc = String(m.client_info?.document_id || '').toLowerCase();
      return name.includes(q) || doc.includes(q);
    });
  }, [planMemberships, clientSearch, membershipStateFilter, today]);

  const groupedMembershipsByClient = useMemo(() => {
    const groups = new Map<string, GymPlanOverviewMembership[]>();
    for (const membership of filteredMemberships) {
      const clientKey =
        membership.client_info_id ||
        membership.client_info?.user_id ||
        `${membership.client_info?.name || 'sin-nombre'}-${membership.client_info?.document_id || 'sin-doc'}`;
      const current = groups.get(clientKey) || [];
      current.push(membership);
      groups.set(clientKey, current);
    }

    return Array.from(groups.values()).map((memberships) =>
      memberships.sort(
        (a, b) =>
          parseLocalDate(b.end_date).getTime() -
          parseLocalDate(a.end_date).getTime(),
      ),
    );
  }, [filteredMemberships]);

  const sortedClientGroups = useMemo(() => {
    const list = [...groupedMembershipsByClient];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const metaA = getClientRowMeta(a, today);
      const metaB = getClientRowMeta(b, today);

      // Siempre: vencidos → por vencer → al día
      const byStatus =
        STATUS_ORDER[metaA.status] - STATUS_ORDER[metaB.status];
      if (byStatus !== 0) return byStatus;

      if (sortKey === 'end' || sortKey === 'status') {
        if (metaA.status === 'expired') {
          return (metaB.endMs - metaA.endMs) * dir;
        }
        return (metaA.endMs - metaB.endMs) * dir;
      }
      if (sortKey === 'progress') {
        return (metaA.pctWidth - metaB.pctWidth) * dir;
      }
      const aName = (metaA.client?.name || '').toLowerCase();
      const bName = (metaB.client?.name || '').toLowerCase();
      return aName.localeCompare(bName, 'es') * dir;
    });
    return list;
  }, [groupedMembershipsByClient, sortKey, sortDir, today]);

  const clientSummary = useMemo(() => {
    let expired = 0;
    let endingSoon = 0;
    let current = 0;
    for (const group of groupedMembershipsByClient) {
      const { status } = getClientRowMeta(group, today);
      if (status === 'expired') expired += 1;
      else if (status === 'ending_soon') endingSoon += 1;
      else current += 1;
    }
    return {
      total: groupedMembershipsByClient.length,
      expired,
      endingSoon,
      current,
    };
  }, [groupedMembershipsByClient, today]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedClientGroups.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedClientGroups = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedClientGroups.slice(start, start + PAGE_SIZE);
  }, [sortedClientGroups, safePage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientSearch, membershipStateFilter, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: ClientSortKey) => {
      if (sortKey === key) {
        setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
        return;
      }
      setSortKey(key);
      setSortDir(key === 'name' || key === 'status' ? 'asc' : 'desc');
    },
    [sortKey],
  );

  const openClient = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, authUser, isAdmin, router]);

  const backHref = '/admin?tab=gym-plans';

  if (authLoading || !authUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-white/50">
            Comprobando acceso…
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout
        title="Plan"
        description="Cargando…"
        activeTab="gym-plans"
      >
        <div className="flex justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#164151]/70 dark:text-white/50">
              Cargando plan…
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout
        title="Plan"
        description="No se pudo cargar"
        activeTab="gym-plans"
      >
        <div className="text-center max-w-md mx-auto py-12">
          <p className="text-[#164151] dark:text-white mb-4">
            {error instanceof Error ? error.message : 'No se pudo cargar el plan'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-6 py-2.5"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { plan } = data;

  return (
    <AdminLayout
      title={plan.name}
      description="Detalle del plan"
      activeTab="gym-plans"
    >
      <div className="w-full max-w-none">
        <div className={t.detailToolbar}>
          <div className={t.detailMetaRow}>
            <span className={t.detailPrice}>
              ${Number(plan.price).toLocaleString('es-CO')}
              <span className={t.detailPriceCurrency}>COP</span>
            </span>
            <span className={t.detailMetaSep}>·</span>
            <span className={t.detailMetaMuted}>
              {formatGymPlanDuration(plan.duration_days)}
            </span>
            <span className={t.detailMetaSep}>·</span>
            {plan.is_active ? (
              <span className={t.badgeActive}>Activo</span>
            ) : (
              <span className={t.badgeInactive}>Inactivo</span>
            )}
            {plan.description ? (
              <>
                <span className={`${t.detailMetaSep} hidden xl:inline`}>·</span>
                <span className={t.detailDesc} title={plan.description}>
                  {plan.description}
                </span>
              </>
            ) : null}
          </div>

          <div className={t.detailActions}>
            <div className={t.detailSearch}>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/35" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className={t.detailSearchInput}
              />
            </div>
            <div className={t.detailFilter}>
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/35" />
              <select
                value={membershipStateFilter}
                onChange={(e) =>
                  setMembershipStateFilter(e.target.value as MembershipFilter)
                }
                className={t.detailFilterSelect}
              >
                <option value="all">Todos</option>
                <option value="expired">Vencidos</option>
                <option value="ending_soon">Por vencer</option>
                <option value="current">Al día</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className={t.detailBackBtn}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>
          </div>
        </div>

        <section>
          <div className={t.detailSectionHead}>
            <h2 className={t.detailSectionTitle}>Clientes con este plan</h2>
            <p className={t.detailSectionHelper}>
              Vigentes y vencidos · anticipos se revisan en Pagos
            </p>
          </div>
          {groupedMembershipsByClient.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500 dark:text-white/45 border-t border-b border-gray-200/80 dark:border-white/[0.08]">
              {planMemberships.length === 0
                ? 'No hay clientes registrados con este plan.'
                : 'No hay clientes que coincidan con ese filtro.'}
            </p>
          ) : (
            <div className={t.tableShell}>
              <div className={t.tableWrap}>
                <table className={t.table}>
                  <thead>
                    <tr>
                      <th className={`${t.th} ${t.thLeft}`}>
                        <button
                          type="button"
                          onClick={() => handleSort('name')}
                          className={t.sortButton}
                        >
                          Cliente
                          <SortIcon
                            active={sortKey === 'name'}
                            direction={sortDir}
                          />
                        </button>
                      </th>
                      <th className={`${t.th} ${t.thLeft}`}>
                        <button
                          type="button"
                          onClick={() => handleSort('status')}
                          className={t.sortButton}
                        >
                          Estado
                          <SortIcon
                            active={sortKey === 'status'}
                            direction={sortDir}
                          />
                        </button>
                      </th>
                      <th className={`${t.th} ${t.thLeft}`}>
                        <button
                          type="button"
                          onClick={() => handleSort('end')}
                          className={t.sortButton}
                        >
                          Período
                          <SortIcon
                            active={sortKey === 'end'}
                            direction={sortDir}
                          />
                        </button>
                      </th>
                      <th className={`${t.th} ${t.thLeft}`}>
                        <button
                          type="button"
                          onClick={() => handleSort('progress')}
                          className={t.sortButton}
                        >
                          Progreso
                          <SortIcon
                            active={sortKey === 'progress'}
                            direction={sortDir}
                          />
                        </button>
                      </th>
                      <th className={`${t.th} ${t.thLeft}`}>WhatsApp</th>
                      <th className={`${t.th} ${t.thRight}`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedClientGroups.map((clientMemberships) => (
                      <PlanClientTableRow
                        key={clientMemberships[0].id}
                        memberships={clientMemberships}
                        today={today}
                        onOpen={openClient}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={t.pager}>
                <p className={t.footerText}>
                  {clientSummary.total}{' '}
                  {clientSummary.total === 1 ? 'cliente' : 'clientes'}
                  <span className="mx-2 text-gray-300 dark:text-white/20">
                    ·
                  </span>
                  {clientSummary.expired} vencidos
                  <span className="mx-2 text-gray-300 dark:text-white/20">
                    ·
                  </span>
                  {clientSummary.endingSoon} por vencer
                  <span className="mx-2 text-gray-300 dark:text-white/20">
                    ·
                  </span>
                  {clientSummary.current} al día
                  <span className="mx-2 text-gray-300 dark:text-white/20">
                    ·
                  </span>
                  pág. {safePage}/{totalPages}
                </p>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={t.pagerBtn}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(1)}
                      aria-label="Primera página"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={t.pagerBtn}
                      disabled={safePage <= 1}
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - safePage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev != null && page - prev > 1;
                        return (
                          <span key={page} className="inline-flex items-center gap-1">
                            {showEllipsis ? (
                              <span className="px-1 text-xs text-gray-400">
                                …
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className={
                                page === safePage
                                  ? t.pagerBtnActive
                                  : t.pagerBtnPage
                              }
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </span>
                        );
                      })}
                    <button
                      type="button"
                      className={t.pagerBtn}
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={t.pagerBtn}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      aria-label="Última página"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
