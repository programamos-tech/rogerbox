import type { GymCommandCenterResponse } from '@/modules/gym-admin/types';

export async function fetchGymCommandCenter(
  from: string,
  to: string,
): Promise<GymCommandCenterResponse> {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`/api/admin/gym/command-center?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Error al cargar el centro de mando',
    );
  }
  return data as GymCommandCenterResponse;
}
