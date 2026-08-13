import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchGymCommandCenter } from '@/modules/gym-admin/services/gym-command-center.service';

export function useGymCommandCenter(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['gym-command-center', from, to],
    queryFn: () => fetchGymCommandCenter(from, to),
    enabled: enabled && Boolean(from && to),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
