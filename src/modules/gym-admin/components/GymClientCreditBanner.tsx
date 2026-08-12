'use client';

import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GymClientCreditBanner({
  clientInfoId,
  balance,
}: {
  clientInfoId: string;
  balance: number;
}) {
  const router = useRouter();

  if (!(balance > 0)) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#85ea10]/35 bg-[#85ea10]/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-[#85ea10]/[0.1]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#85ea10]/20">
          <Wallet className="h-4 w-4 text-[#3f7d08] dark:text-[#85ea10]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#164151] dark:text-white">
            Saldo a favor:{' '}
            <span className="tabular-nums text-[#3f7d08] dark:text-[#85ea10]">
              ${balance.toLocaleString('es-CO')}
            </span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#164151]/65 dark:text-white/50">
            Este monto se ofrece al facturar un plan nuevo o renovación.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          router.push(
            `/admin?tab=gym-payments&clientId=${encodeURIComponent(clientInfoId)}`,
          )
        }
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#164151] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1a4d5f]"
      >
        Facturar con saldo
      </button>
    </div>
  );
}
