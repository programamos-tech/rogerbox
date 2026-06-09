/**
 * Reglas alineadas con overview de plan (gym) y fechas locales (Colombia / YYYY-MM-DD).
 * Evita new Date('YYYY-MM-DD') en UTC y unifica plan_id con plan.id anidado.
 */

import { getTodayYmdColombia, parseLocalDate } from '@/lib/dateUtils';

export function resolveMembershipPlanId(m: {
  plan_id?: string | null;
  plan?: { id?: string } | { id?: string }[] | null;
}): string | null {
  if (m?.plan_id) return String(m.plan_id);
  const p = m?.plan;
  if (Array.isArray(p) && p[0]?.id) return String(p[0].id);
  if (p && typeof p === 'object' && 'id' in p && (p as { id?: string }).id) {
    return String((p as { id: string }).id);
  }
  return null;
}

export function resolveMembershipPlanName(m: {
  plan?: { name?: string } | { name?: string }[] | null;
}): string {
  const p = m?.plan;
  if (p && !Array.isArray(p) && typeof p === 'object' && 'name' in p) {
    return String((p as { name?: string }).name || 'Plan');
  }
  if (Array.isArray(p) && p[0]?.name) return String(p[0].name);
  return 'Plan';
}

function membershipHasRegisteredPayment(m: {
  has_registered_payment?: boolean;
  hasRegisteredPayment?: boolean;
  status?: string;
}): boolean {
  if (m.status === 'courtesy') return true;
  return !!(m.has_registered_payment ?? m.hasRegisteredPayment);
}

/** Período en curso: inicio ≤ hoy ≤ fin (active|courtesy). */
export function isMembershipCurrentPeriod(
  m: { status?: string; start_date?: string; end_date?: string },
  todayRef: Date,
): boolean {
  if (m.status === 'cancelled') return false;
  if (m.status !== 'active' && m.status !== 'courtesy') return false;
  const today = dayOnly(todayRef);
  const start = dayOnly(parseLocalDate(m.start_date!));
  const end = dayOnly(parseLocalDate(m.end_date!));
  return start <= today && end >= today;
}

/** Período programado (pago anticipado): inicio > hoy y fin ≥ hoy. */
export function isMembershipScheduledPeriod(
  m: { status?: string; start_date?: string; end_date?: string },
  todayRef: Date,
): boolean {
  if (m.status === 'cancelled') return false;
  if (m.status !== 'active' && m.status !== 'courtesy') return false;
  const today = dayOnly(todayRef);
  const start = dayOnly(parseLocalDate(m.start_date!));
  const end = dayOnly(parseLocalDate(m.end_date!));
  return start > today && end >= today;
}

export function computeCurrentPlanIdSet(
  memberships: any[],
  todayRef: Date,
): Set<string> {
  return new Set(
    (memberships || [])
      .filter((m) => isMembershipCurrentPeriod(m, todayRef))
      .map((m) => resolveMembershipPlanId(m))
      .filter(Boolean) as string[],
  );
}

/** Inicio del día “hoy” según calendario Colombia (YYYY-MM-DD). */
export function getGymAdminToday(): Date {
  const d = parseLocalDate(getTodayYmdColombia());
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Misma clasificación que `overview/route.ts`: canceladas / vigentes (active|courtesy, fin≥hoy) / vencidas u otras.
 */
export function partitionGymMembershipsLikeOverview(
  memberships: any[],
  todayRef: Date,
): { cancelled: any[]; active: any[]; expired: any[] } {
  const cancelled: any[] = [];
  const active: any[] = [];
  const expired: any[] = [];
  const today = dayOnly(todayRef);

  for (const m of memberships || []) {
    if (m.status === 'cancelled') {
      cancelled.push(m);
      continue;
    }
    const end = dayOnly(parseLocalDate(m.end_date));
    if (end < today) {
      expired.push(m);
      continue;
    }
    if (m.status === 'active' || m.status === 'courtesy') {
      active.push(m);
    } else {
      expired.push(m);
    }
  }

  return { cancelled, active, expired };
}

export function computeActivePlanIdSet(activeMemberships: any[]): Set<string> {
  return new Set(
    activeMemberships
      .map((m) => resolveMembershipPlanId(m))
      .filter(Boolean) as string[],
  );
}

export function computeExpiredNeedingRenewal(
  expiredMemberships: any[],
  activePlanIds: Set<string>,
): any[] {
  return expiredMemberships.filter((m) => {
    const pid = resolveMembershipPlanId(m);
    if (!pid) return true;
    return !activePlanIds.has(pid);
  });
}

/**
 * Varios períodos vencidos del mismo plan → un solo ítem: el de `end_date` más reciente
 * (última deuda de renovación por plan). Sin `plan_id` resuelto, cada membresía cuenta por su `id`.
 */
export function pickLatestExpiredMembershipPerPlan(
  memberships: any[],
): any[] {
  const best = new Map<string, any>();
  for (const m of memberships || []) {
    const pid = resolveMembershipPlanId(m);
    const key = pid ? `plan:${pid}` : `mem:${m.id}`;
    const end = parseLocalDate(m.end_date).getTime();
    const cur = best.get(key);
    if (!cur || parseLocalDate(cur.end_date).getTime() < end) {
      best.set(key, m);
    }
  }
  return [...best.values()].sort(
    (a, b) =>
      parseLocalDate(b.end_date).getTime() -
      parseLocalDate(a.end_date).getTime(),
  );
}

export type GymPlanPeriodKind = 'current' | 'scheduled' | 'expired';

export type GymPlanAdminSummary = {
  planId: string;
  planName: string;
  kind: GymPlanPeriodKind;
  membership: any;
  hasRegisteredPayment: boolean;
  hasUpcomingScheduled: boolean;
};

export type ClientGymAdminStatus =
  | 'none'
  | 'all_current'
  | 'partial_renewal'
  | 'current_no_payment'
  | 'scheduled_only'
  | 'renewal'
  | 'cancelled_only';

export type AdminProductRow = {
  name: string;
  type: 'membership' | 'course';
  isActive: boolean;
  isCancelled?: boolean;
  isScheduled?: boolean;
  missingRegisteredPayment?: boolean;
  membership?: any;
  planId?: string;
};

export type GymRenewalAdminContext = {
  today: Date;
  cancelled: any[];
  active: any[];
  current: any[];
  scheduled: any[];
  expired: any[];
  nonCancelled: any[];
  activePlanIds: Set<string>;
  currentPlanIds: Set<string>;
  expiredNeedingRenewal: any[];
};

/** IDs de plan únicos entre membresías vencidas que aún requieren seguimiento de renovación. */
export function renewalPendingPlanIdsFromMemberships(
  expiredNeedingRenewal: any[],
): string[] {
  const ids = new Set<string>();
  for (const m of expiredNeedingRenewal || []) {
    const pid = resolveMembershipPlanId(m);
    if (pid) ids.add(pid);
  }
  return [...ids];
}

/** True si todos los planes pendientes de renovación están marcados como descartados. */
export function allRenewalPlansDismissed(
  pendingPlanIds: string[],
  dismissedPlanIds: string[] | undefined | null,
): boolean {
  if (!pendingPlanIds.length) return false;
  const d = new Set(dismissedPlanIds || []);
  return pendingPlanIds.every((id) => d.has(id));
}

/** Opciones para menú admin: descartar / reabrir por plan. */
export function buildRenewalPlanMenuOptions(
  expiredNeedingRenewal: any[],
): { planId: string; label: string }[] {
  const map = new Map<string, string>();
  for (const m of expiredNeedingRenewal || []) {
    const pid = resolveMembershipPlanId(m);
    if (!pid || map.has(pid)) continue;
    let label = 'Plan';
    const p = m.plan;
    if (p && !Array.isArray(p) && typeof p === 'object' && 'name' in p) {
      label = String((p as { name?: string }).name || 'Plan');
    } else if (Array.isArray(p) && p[0]?.name) {
      label = String(p[0].name);
    }
    map.set(pid, label);
  }
  return [...map.entries()].map(([planId, label]) => ({ planId, label }));
}

function summarizePlanMembershipGroup(
  planId: string,
  items: any[],
  today: Date,
): GymPlanAdminSummary | null {
  const currents = items.filter((m) => isMembershipCurrentPeriod(m, today));
  const scheduled = items.filter((m) => isMembershipScheduledPeriod(m, today));
  const expiredCandidates = items.filter((m) => {
    const end = dayOnly(parseLocalDate(m.end_date));
    return end < today;
  });

  let kind: GymPlanPeriodKind;
  let membership: any;

  if (currents.length > 0) {
    kind = 'current';
    membership = [...currents].sort(
      (a, b) =>
        parseLocalDate(b.end_date).getTime() -
        parseLocalDate(a.end_date).getTime(),
    )[0];
  } else if (scheduled.length > 0) {
    kind = 'scheduled';
    membership = [...scheduled].sort(
      (a, b) =>
        parseLocalDate(a.start_date).getTime() -
        parseLocalDate(b.start_date).getTime(),
    )[0];
  } else if (expiredCandidates.length > 0) {
    kind = 'expired';
    membership = [...expiredCandidates].sort(
      (a, b) =>
        parseLocalDate(b.end_date).getTime() -
        parseLocalDate(a.end_date).getTime(),
    )[0];
  } else {
    return null;
  }

  return {
    planId,
    planName: resolveMembershipPlanName(membership),
    kind,
    membership,
    hasRegisteredPayment: membershipHasRegisteredPayment(membership),
    hasUpcomingScheduled: kind === 'current' && scheduled.length > 0,
  };
}

/** Un resumen por plan: vigente / programado / vencido (el más relevante por plan). */
export function summarizeGymPlansPerClient(
  memberships: any[],
  todayRef?: Date,
): GymPlanAdminSummary[] {
  const today = dayOnly(todayRef ?? getGymAdminToday());
  const nonCancelled = (memberships || []).filter(
    (m) => m.status !== 'cancelled',
  );
  const byPlan = new Map<string, any[]>();

  for (const m of nonCancelled) {
    const pid = resolveMembershipPlanId(m);
    const key = pid ?? `mem:${m.id}`;
    const arr = byPlan.get(key) || [];
    arr.push(m);
    byPlan.set(key, arr);
  }

  const summaries: GymPlanAdminSummary[] = [];
  for (const [planId, items] of byPlan) {
    const summary = summarizePlanMembershipGroup(planId, items, today);
    if (summary) summaries.push(summary);
  }

  return summaries.sort((a, b) => a.planName.localeCompare(b.planName));
}

export function computeClientGymAdminStatus(
  summaries: GymPlanAdminSummary[],
  memberships?: any[],
): ClientGymAdminStatus {
  const all = memberships || [];
  const nonCancelled = all.filter((m) => m.status !== 'cancelled');
  if (all.length > 0 && nonCancelled.length === 0) return 'cancelled_only';
  if (summaries.length === 0) return 'none';

  const allCurrentPaid = summaries.every(
    (s) => s.kind === 'current' && s.hasRegisteredPayment,
  );
  if (allCurrentPaid) return 'all_current';

  if (summaries.every((s) => s.kind === 'expired')) return 'renewal';
  if (summaries.every((s) => s.kind === 'scheduled')) return 'scheduled_only';

  const anyUnpaidCurrent = summaries.some(
    (s) => s.kind === 'current' && !s.hasRegisteredPayment,
  );
  if (
    anyUnpaidCurrent &&
    !summaries.some((s) => s.kind === 'expired')
  ) {
    return 'current_no_payment';
  }

  return 'partial_renewal';
}

export function isClientFullyCurrentOnGymPlans(
  memberships: any[],
  todayRef?: Date,
): boolean {
  const summaries = summarizeGymPlansPerClient(memberships, todayRef);
  return computeClientGymAdminStatus(summaries, memberships) === 'all_current';
}

/** Lista de productos admin: un ítem por plan (+ programados extra y cursos). */
export function buildAdminProductsList(
  memberships: any[],
  activeCoursePurchases: any[],
  todayRef?: Date,
): AdminProductRow[] {
  const today = dayOnly(todayRef ?? getGymAdminToday());
  const { cancelled } = partitionGymMembershipsLikeOverview(memberships, today);
  const summaries = summarizeGymPlansPerClient(memberships, today);
  const products: AdminProductRow[] = [];

  for (const s of summaries) {
    if (s.kind === 'current') {
      products.push({
        name: s.planName,
        type: 'membership',
        isActive: true,
        membership: s.membership,
        planId: s.planId,
        missingRegisteredPayment: !s.hasRegisteredPayment,
      });
      if (s.hasUpcomingScheduled) {
        const scheduledOnPlan = (memberships || []).filter(
          (m) =>
            m.status !== 'cancelled' &&
            resolveMembershipPlanId(m) === s.planId &&
            isMembershipScheduledPeriod(m, today),
        );
        const next = [...scheduledOnPlan].sort(
          (a, b) =>
            parseLocalDate(a.start_date).getTime() -
            parseLocalDate(b.start_date).getTime(),
        )[0];
        if (next) {
          products.push({
            name: s.planName,
            type: 'membership',
            isActive: true,
            isScheduled: true,
            membership: next,
            planId: s.planId,
            missingRegisteredPayment: !membershipHasRegisteredPayment(next),
          });
        }
      }
    } else if (s.kind === 'scheduled') {
      products.push({
        name: s.planName,
        type: 'membership',
        isActive: true,
        isScheduled: true,
        membership: s.membership,
        planId: s.planId,
        missingRegisteredPayment: !s.hasRegisteredPayment,
      });
    } else {
      products.push({
        name: s.planName,
        type: 'membership',
        isActive: false,
        membership: s.membership,
        planId: s.planId,
      });
    }
  }

  for (const m of cancelled) {
    products.push({
      name: resolveMembershipPlanName(m),
      type: 'membership',
      isActive: false,
      isCancelled: true,
      membership: m,
      planId: resolveMembershipPlanId(m) ?? undefined,
    });
  }

  for (const p of activeCoursePurchases || []) {
    products.push({
      name: p.course?.title || 'Curso',
      type: 'course',
      isActive: true,
    });
  }

  return products;
}

export function buildGymRenewalAdminContext(
  memberships: any[],
  today?: Date,
): GymRenewalAdminContext {
  const t = today ?? getGymAdminToday();
  const { cancelled, active, expired } = partitionGymMembershipsLikeOverview(
    memberships,
    t,
  );
  const current = (memberships || []).filter((m) =>
    isMembershipCurrentPeriod(m, t),
  );
  const scheduled = (memberships || []).filter((m) =>
    isMembershipScheduledPeriod(m, t),
  );
  const activePlanIds = computeActivePlanIdSet(active);
  const currentPlanIds = computeCurrentPlanIdSet(memberships, t);
  const expiredNeedingRenewal = pickLatestExpiredMembershipPerPlan(
    computeExpiredNeedingRenewal(expired, currentPlanIds),
  );
  return {
    today: t,
    cancelled,
    active,
    current,
    scheduled,
    expired,
    nonCancelled: [...active, ...expired],
    activePlanIds,
    currentPlanIds,
    expiredNeedingRenewal,
  };
}

/** Membresías no canceladas con fin de período estrictamente antes de `today` (solo calendario). */
export function getCalendarExpiredNonCancelled(
  memberships: any[],
  todayRef: Date,
): any[] {
  const today = dayOnly(todayRef);
  return (memberships || []).filter((m) => {
    if (m.status === 'cancelled') return false;
    const end = dayOnly(parseLocalDate(m.end_date));
    return end < today;
  });
}

/** Categoría de “activo + renovación” alineada con badges del listado admin. */
export type MixRenewalCategory = 'none' | 'pending' | 'dismissed';

export function getMixRenewalFilterCategory(
  memberships: any[],
  activeCoursePurchases: any[],
  dismissedPlanIds: string[] | undefined | null,
  today?: Date,
): MixRenewalCategory {
  const t = today ?? getGymAdminToday();
  const courses = activeCoursePurchases || [];
  const nonCancelled = (memberships || []).filter(
    (m: any) => m.status !== 'cancelled',
  );
  if (nonCancelled.length === 0) return 'none';

  const ctx = buildGymRenewalAdminContext(memberships, t);
  if (ctx.expiredNeedingRenewal.length === 0) return 'none';

  const pendingIds = renewalPendingPlanIdsFromMemberships(
    ctx.expiredNeedingRenewal,
  );
  if (!pendingIds.length) return 'none';

  // Solo membresía física (sin cursos): período en curso + plan vencido sin cubrir
  if (courses.length === 0) {
    if (ctx.current.length === 0 || ctx.expiredNeedingRenewal.length === 0) {
      return 'none';
    }
    if (allRenewalPlansDismissed(pendingIds, dismissedPlanIds)) {
      return 'dismissed';
    }
    return 'pending';
  }

  // Físico + cursos online: hay planes vencidos que piden renovación
  if (
    nonCancelled.length > 0 &&
    courses.length > 0 &&
    ctx.expiredNeedingRenewal.length > 0
  ) {
    if (allRenewalPlansDismissed(pendingIds, dismissedPlanIds)) {
      return 'dismissed';
    }
    return 'pending';
  }

  return 'none';
}
