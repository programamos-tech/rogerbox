import type {
  GymClientCredit,
  GymClientCreditInsert,
  GymPendingAdvance,
} from '@/types/gym';

export async function fetchClientCreditBalance(
  clientInfoId: string,
): Promise<{ balance: number; movements: GymClientCredit[] }> {
  const res = await fetch(
    `/api/admin/gym/credits?client_info_id=${encodeURIComponent(clientInfoId)}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Error al cargar saldo',
    );
  }
  return {
    balance: Number(data.balance) || 0,
    movements: (data.movements || []) as GymClientCredit[],
  };
}

export async function postClientCredit(
  payload: GymClientCreditInsert,
): Promise<GymClientCredit> {
  const res = await fetch('/api/admin/gym/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Error al registrar abono',
    );
  }
  return data as GymClientCredit;
}

export async function fetchPendingAdvances(
  clientInfoId?: string,
): Promise<GymPendingAdvance[]> {
  const qs = clientInfoId
    ? `?client_info_id=${encodeURIComponent(clientInfoId)}`
    : '';
  const res = await fetch(`/api/admin/gym/credits/pending-advances${qs}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Error al cargar anticipos',
    );
  }
  return (data.items || []) as GymPendingAdvance[];
}

export async function resolvePendingAdvance(payload: {
  membership_id: string;
  action: 'convert' | 'discard';
}): Promise<void> {
  const res = await fetch('/api/admin/gym/credits/pending-advances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Error al resolver anticipo',
    );
  }
}
