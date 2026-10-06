import type { GymPendingAdvance } from '@/types/gym';

export async function fetchPendingAdvances(
  clientInfoId?: string,
): Promise<GymPendingAdvance[]> {
  const qs = clientInfoId
    ? `?client_info_id=${encodeURIComponent(clientInfoId)}`
    : '';
  const res = await fetch(`/api/admin/gym/pending-advances${qs}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Error al cargar anticipos',
    );
  }
  return (data.items || []) as GymPendingAdvance[];
}

export async function discardPendingAdvance(
  membershipId: string,
): Promise<void> {
  const res = await fetch('/api/admin/gym/pending-advances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ membership_id: membershipId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Error al descartar anticipo',
    );
  }
}
