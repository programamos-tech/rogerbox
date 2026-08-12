import { useQuery } from '@tanstack/react-query';
import { fetchClientCreditBalance } from '@/modules/gym-admin/services/gym-client-credits.service';

export function useGymClientCredit(clientInfoId: string | null | undefined) {
  return useQuery({
    queryKey: ['gym-client-credit', clientInfoId],
    queryFn: () => fetchClientCreditBalance(clientInfoId!),
    enabled: Boolean(clientInfoId),
  });
}
