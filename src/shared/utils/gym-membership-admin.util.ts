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

export type GymRenewalAdminContext = {
  today: Date;
  cancelled: any[];
  active: any[];
  expired: any[];
  nonCancelled: any[];
  activePlanIds: Set<string>;
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

export function buildGymRenewalAdminContext(
  memberships: any[],
  today?: Date,
): GymRenewalAdminContext {
  const t = today ?? getGymAdminToday();
  const { cancelled, active, expired } = partitionGymMembershipsLikeOverview(
    memberships,
    t,
  );
  const activePlanIds = computeActivePlanIdSet(active);
  const expiredNeedingRenewal = pickLatestExpiredMembershipPerPlan(
    computeExpiredNeedingRenewal(expired, activePlanIds),
  );
  return {
    today: t,
    cancelled,
    active,
    expired,
    nonCancelled: [...active, ...expired],
    activePlanIds,
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
