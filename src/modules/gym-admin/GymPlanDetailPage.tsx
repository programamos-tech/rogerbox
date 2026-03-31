'use client';

import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Filter,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  formatMembershipDayLabel,
  formatDateOnlyLocal,
  getMembershipPeriodProgress,
  getTodayYmdColombia,
  parseLocalDate,
} from '@/lib/dateUtils';
import { useGymPlanOverview } from '@/modules/gym-admin/hooks/useGymPlanOverview';
import { gymPlanDetailStyles as s } from '@/modules/gym-admin/styles';
import type { GymPlanOverviewMembership } from '@/modules/gym-admin/types';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';

function PlanMembershipCard({
  membership,
  today,
}: {
  membership: GymPlanOverviewMembership;
  today: Date;
}) {
  const c = membership.client_info;
  const href =
    c?.user_id != null && c.user_id !== ''
      ? `/admin/users/${c.user_id}`
      : null;
  const seed = membership.client_info_id || '—';
  const period = getMembershipPeriodProgress(
    membership.start_date,
    membership.end_date,
    today,
  );
  const endDate = parseLocalDate(membership.end_date);
  const isExpiredPeriod = today > endDate;
  const isScheduled = period.notStarted;

  let barClass =
    'h-full rounded-full transition-[width] duration-300 bg-[#85ea10]';
  let trackRing = '';
  if (isExpiredPeriod) {
    barClass =
      'h-full rounded-full bg-red-500/80 dark:bg-red-500/70';
  } else if (isScheduled) {
    barClass = 'h-full rounded-full bg-cyan-500/50';
  } else if (period.endingSoon) {
    barClass =
      'h-full rounded-full bg-gradient-to-r from-[#85ea10] to-amber-500';
    trackRing = 'ring-1 ring-amber-500/45';
  }

  const pctWidth = isExpiredPeriod
    ? 100
    : isScheduled
      ? 0
      : Math.round(period.pct);

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex gap-3">
        <GymSeededAvatar
          seed={seed}
          size={44}
          className="h-11 w-11 shrink-0 rounded-full"
          alt=""
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {href ? (
                <Link
                  href={href}
                  className="text-base font-semibold leading-snug text-[#164151] dark:text-white hover:underline decoration-[#85ea10]/70 underline-offset-2"
                >
                  {c?.name ?? 'Sin nombre'}
                </Link>
              ) : (
                <p className="text-base font-semibold text-[#164151] dark:text-white">
                  {c?.name ?? 'Sin nombre'}
                </p>
              )}
              {c?.document_id ? (
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/45 tabular-nums">
                  Doc. {c.document_id}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {isExpiredPeriod ? (
                <span className="inline-flex items-center rounded-md border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                  Vencido
                </span>
              ) : isScheduled ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Próximo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200/90 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/85">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#85ea10]" />
                  En período
                </span>
              )}
              {href ? (
                <Link href={href} className={`${s.link} text-sm`}>
                  Ver ficha
                </Link>
              ) : (
                <span className="text-xs text-gray-500 dark:text-white/40">
                  Sin cuenta web
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10 ${trackRing}`}
              role="progressbar"
              aria-valuenow={pctWidth}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso del período de la membresía"
            >
              <div
                className={barClass}
                style={{ width: `${pctWidth}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-gray-500 dark:text-white/45">
              <span>
                Inicio{' '}
                <span className="font-medium text-[#164151] dark:text-white/80">
                  {formatMembershipDayLabel(
                    parseLocalDate(membership.start_date),
                  )}
                </span>
              </span>
              <span>
                Fin{' '}
                <span className="font-medium text-[#164151] dark:text-white/80">
                  {formatMembershipDayLabel(
                    parseLocalDate(membership.end_date),
                  )}
                </span>
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-500 dark:text-white/40">
              {isExpiredPeriod ? (
                <>
                  El período finalizó el{' '}
                  {formatDateOnlyLocal(membership.end_date, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </>
              ) : isScheduled ? (
                <>
                  Comienza en {period.daysToStart}{' '}
                  {period.daysToStart === 1 ? 'día' : 'días'}
                </>
              ) : period.endingSoon ? (
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Quedan {period.daysLeft}{' '}
                  {period.daysLeft === 1 ? 'día' : 'días'} — por vencer
                </span>
              ) : (
                <>
                  {Math.round(period.pct)}% del período · {period.daysLeft}{' '}
                  {period.daysLeft === 1 ? 'día restante' : 'días restantes'}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

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
  const [membershipStateFilter, setMembershipStateFilter] = useState<
    'all' | 'active' | 'scheduled' | 'expired'
  >('all');

  const today = useMemo(() => {
    const d = parseLocalDate(getTodayYmdColombia());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const planMemberships = useMemo(() => {
    if (!data) return [];
    const active = [...data.active_memberships].sort(
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
  }, [data]);

  const filteredMemberships = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return planMemberships.filter((m) => {
      const endDate = parseLocalDate(m.end_date);
      const isExpiredPeriod = today > endDate;
      const period = getMembershipPeriodProgress(
        m.start_date,
        m.end_date,
        today,
      );
      const isScheduled = period.notStarted;

      if (membershipStateFilter === 'active' && (isExpiredPeriod || isScheduled))
        return false;
      if (membershipStateFilter === 'scheduled' && !isScheduled) return false;
      if (membershipStateFilter === 'expired' && !isExpiredPeriod) return false;

      if (!q) return true;
      const name = (m.client_info?.name || '').toLowerCase();
      const doc = String(m.client_info?.document_id || '').toLowerCase();
      return name.includes(q) || doc.includes(q);
    });
  }, [planMemberships, clientSearch, membershipStateFilter, today]);

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
  const headerBack = (
    <button
      type="button"
      onClick={() => router.push(backHref)}
      className="inline-flex items-center gap-2 rounded-lg bg-[#164151] text-white dark:bg-white dark:text-[#164151] hover:bg-[#1a4d5f] dark:hover:bg-gray-100 px-3 py-2 text-sm font-semibold transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver
    </button>
  );

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
        headerRight={headerBack}
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
        headerRight={headerBack}
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
      headerRight={headerBack}
    >
      <div className="w-full max-w-none">
        <div className="pb-8 border-b border-gray-200/60 dark:border-white/[0.06] flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 xl:gap-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40">
              Precio de lista
            </p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold tabular-nums text-[#164151] dark:text-white tracking-tight">
              ${Number(plan.price).toLocaleString('es-CO')}{' '}
              <span className="text-lg sm:text-xl font-semibold text-gray-500 dark:text-white/40">
                COP
              </span>
            </p>
            <p className="mt-5 text-sm text-gray-600 dark:text-white/60">
              <span className="text-gray-500 dark:text-white/40">Duración: </span>
              <span className="font-semibold text-[#164151] dark:text-white">
                {plan.duration_days} días
              </span>
              <span className="mx-2 text-gray-400 dark:text-white/25">·</span>
              <span className="text-gray-500 dark:text-white/45">Catálogo: </span>
              {plan.is_active ? (
                <span className="font-semibold text-[#85ea10]">Activo</span>
              ) : (
                <span className="text-gray-500 dark:text-white/45">Inactivo</span>
              )}
            </p>
            {plan.description ? (
              <p className="mt-6 pt-6 border-t border-gray-200/80 dark:border-white/[0.08] text-sm text-gray-600 dark:text-white/55 leading-relaxed">
                {plan.description}
              </p>
            ) : null}
          </div>

          <div className="w-full xl:w-auto xl:min-w-[620px]">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1 sm:min-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/35" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente por nombre o cédula"
                className="w-full rounded-xl border border-gray-200/80 bg-white/70 pl-9 pr-3 py-2.5 text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-2 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
              </div>
              <div className="relative sm:w-[210px]">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/35" />
                <select
                  value={membershipStateFilter}
                  onChange={(e) =>
                    setMembershipStateFilter(
                      e.target.value as
                        | 'all'
                        | 'active'
                        | 'scheduled'
                        | 'expired',
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-gray-200/80 bg-white/70 pl-9 pr-3 py-2.5 text-sm text-[#164151] outline-none transition focus:border-[#85ea10]/55 focus:ring-2 focus:ring-[#85ea10]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                >
                  <option value="all">Estado: Todos</option>
                  <option value="active">En período</option>
                  <option value="scheduled">Próximo</option>
                  <option value="expired">Vencido</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <section className="pt-8">
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40">
            Clientes con este plan
          </h2>
          <p className="mb-6 text-[10px] leading-snug text-gray-500 dark:text-white/35">
            Progreso del período de cada membresía (vigentes y vencidos).
          </p>
          {filteredMemberships.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500 dark:text-white/45 border-t border-b border-gray-200/80 dark:border-white/[0.08]">
              {planMemberships.length === 0
                ? 'No hay clientes registrados con este plan.'
                : 'No hay clientes que coincidan con ese filtro.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredMemberships.map((m) => (
                <PlanMembershipCard
                  key={m.id}
                  membership={m}
                  today={today}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
