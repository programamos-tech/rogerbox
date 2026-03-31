import type { GymPlanOverviewResponse } from '@/modules/gym-admin/types';

export async function fetchGymPlanOverview(
  planId: string,
): Promise<GymPlanOverviewResponse> {
  const res = await fetch(`/api/admin/gym/plans/${planId}/overview`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Error al cargar el plan',
    );
  }
  return data as GymPlanOverviewResponse;
}
