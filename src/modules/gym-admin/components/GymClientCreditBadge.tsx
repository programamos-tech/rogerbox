'use client';

import { Wallet } from 'lucide-react';
import { memo } from 'react';
import { gymClientsListStyles as t } from '@/modules/gym-admin/styles';
import { formatCopAmount } from '@/modules/gym-admin/utils/gym-money.util';

export const GymClientCreditBadge = memo(function GymClientCreditBadge({
  balance,
  className,
}: {
  balance?: number | null;
  className?: string;
}) {
  const amount = Number(balance) || 0;
  if (!(amount > 0)) return null;

  const label = formatCopAmount(amount);

  return (
    <span
      className={className ? `${t.creditBadge} ${className}` : t.creditBadge}
      title={`Saldo a favor: ${label}`}
    >
      <Wallet className="h-3 w-3 shrink-0" aria-hidden />
      Saldo {label}
    </span>
  );
});
