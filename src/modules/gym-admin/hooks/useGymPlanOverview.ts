import { useQuery } from '@tanstack/react-query';
import { fetchGymPlanOverview } from '@/modules/gym-admin/services/gym-plan-overview.service';

export function useGymPlanOverview(planId: string | undefined) {
  return useQuery({
    queryKey: ['gym-plan-overview', planId],
    queryFn: () => fetchGymPlanOverview(planId!),
    enabled: Boolean(planId),
  });
}
