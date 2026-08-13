import { useQuery } from '@tanstack/react-query';
import { fetchGymCommandCenter } from '@/modules/gym-admin/services/gym-command-center.service';

export function useGymCommandCenter(enabled = true) {
  return useQuery({
    queryKey: ['gym-command-center'],
    queryFn: fetchGymCommandCenter,
    enabled,
    staleTime: 30_000,
  });
}
