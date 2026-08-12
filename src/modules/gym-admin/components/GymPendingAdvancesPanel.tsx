'use client';

import { AlertTriangle, Check, Wallet, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import {
  fetchPendingAdvances,
  resolvePendingAdvance,
} from '@/modules/gym-admin/services/gym-client-credits.service';
import type { GymPendingAdvance } from '@/types/gym';

export function GymPendingAdvancesPanel({
  clientInfoId,
  onResolved,
}: {
  /** Si se pasa, solo muestra anticipos de ese cliente (detalle). */
  clientInfoId?: string;
  onResolved?: () => void;
}) {
  const [items, setItems] = useState<GymPendingAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const isClientScope = Boolean(clientInfoId);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPendingAdvances(clientInfoId);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar anticipos');
    } finally {
      setLoading(false);
    }
  }, [clientInfoId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (
    membershipId: string,
    action: 'convert' | 'discard',
  ) => {
    try {
      setBusyId(membershipId);
      setError('');
      await resolvePendingAdvance({ membership_id: membershipId, action });
      setItems((prev) => prev.filter((i) => i.membership_id !== membershipId));
      onResolved?.();
    } catch (e: any) {
      setError(e.message || 'No se pudo resolver el anticipo');
    } finally {
      setBusyId(null);
    }
  };

  // En ficha de cliente: sin placeholder de carga (evita flash si no hay anticipos).
  if (loading && !isClientScope) {
    return (
      <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.05] p-4">
        <p className="text-sm text-[#164151]/70 dark:text-white/50">
          Revisando anticipos pendientes…
        </p>
      </div>
    );
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200/90 dark:border-amber-500/25 bg-amber-50/70 dark:bg-amber-500/[0.06] overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200/70 dark:border-amber-500/15 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#164151] dark:text-white">
            {isClientScope
              ? items.length === 1
                ? 'Anticipo por revisar'
                : `Anticipos por revisar (${items.length})`
              : `Anticipos por revisar (${items.length})`}
          </p>
          <p className="text-xs text-[#164151]/65 dark:text-white/50 mt-0.5 leading-relaxed">
            {isClientScope
              ? 'Membresía futura del flujo anterior. Convierte el pago a saldo a favor o descártalo (empieza en $0) con el contexto de este cliente.'
              : 'Membresías futuras creadas con el flujo viejo. Decide por cliente si conviertes el pago a saldo a favor o lo descartas (empieza en $0).'}
          </p>
        </div>
      </div>

      {error ? (
        <p className="px-4 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-amber-200/60 dark:divide-amber-500/10">
        {items.map((item) => (
          <div
            key={item.membership_id}
            className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              {!isClientScope ? (
                <>
                  <p className="text-sm font-semibold text-[#164151] dark:text-white">
                    {item.client_name}
                  </p>
                  <p className="text-xs text-[#164151]/60 dark:text-white/45 tabular-nums">
                    Doc. {item.document_id} · {item.plan_name}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-[#164151] dark:text-white">
                  {item.plan_name}
                </p>
              )}
              <p className="text-xs text-[#164151]/70 dark:text-white/55 mt-1 tabular-nums">
                Período{' '}
                {formatDateOnlyLocal(item.start_date, {
                  day: '2-digit',
                  month: 'short',
                })}{' '}
                →{' '}
                {formatDateOnlyLocal(item.end_date, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                {item.invoice_number ? (
                  <>
                    {' '}
                    · Factura #{item.invoice_number}
                    {item.payment_amount != null
                      ? ` · $${item.payment_amount.toLocaleString('es-CO')}`
                      : ''}
                  </>
                ) : (
                  ' · Sin factura'
                )}
              </p>
              <p className="text-[11px] text-[#164151]/50 dark:text-white/40 mt-0.5">
                Saldo actual: ${item.credit_balance.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={busyId === item.membership_id || !item.payment_id}
                onClick={() => handleAction(item.membership_id, 'convert')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#164151] text-white text-xs font-semibold hover:bg-[#1a4d5f] disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5" />
                Convertir a saldo
              </button>
              <button
                type="button"
                disabled={busyId === item.membership_id}
                onClick={() => handleAction(item.membership_id, 'discard')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-[#164151] dark:text-white text-xs font-semibold hover:bg-white/60 dark:hover:bg-white/5 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Empezar en $0
              </button>
              {busyId === item.membership_id ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#164151]/50 dark:text-white/40">
                  <Check className="w-3.5 h-3.5 animate-pulse" />
                  Guardando…
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
