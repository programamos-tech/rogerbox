'use client';

import { Cake, MessageSquare, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatDateOnlyLocal, getTodayYmdColombia } from '@/lib/dateUtils';
import {
  buildBirthdayWhatsappUrl,
  buildRogerboxBirthdayWhatsappMessage,
  type BirthdayClientRow,
} from '@/shared/utils/birthday.util';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';

const STORAGE_PREFIX = 'rogerbox-birthdays-modal-dismissed';

function getDismissKey(ymd: string) {
  return `${STORAGE_PREFIX}-${ymd}`;
}

export function wasDailyBirthdaysModalDismissedToday(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(getDismissKey(getTodayYmdColombia())) === '1';
}

export function dismissDailyBirthdaysModalForToday() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getDismissKey(getTodayYmdColombia()), '1');
}

type DailyBirthdaysModalProps = {
  isOpen: boolean;
  onClose: () => void;
  clients: BirthdayClientRow[];
  loading?: boolean;
  dateYmd?: string;
};

export function DailyBirthdaysModal({
  isOpen,
  onClose,
  clients,
  loading = false,
  dateYmd,
}: DailyBirthdaysModalProps) {
  const todayLabel = formatDateOnlyLocal(dateYmd || getTodayYmdColombia(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleClose = useCallback(() => {
    dismissDailyBirthdaysModalForToday();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const sampleMessage = clients[0]
    ? buildRogerboxBirthdayWhatsappMessage(clients[0].name)
    : buildRogerboxBirthdayWhatsappMessage('');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-birthdays-title"
      >
        <div className="shrink-0 px-5 py-4 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-[#164151]/5 to-[#85ea10]/10 dark:from-[#164151]/30 dark:to-[#85ea10]/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#85ea10]/20 flex items-center justify-center shrink-0">
                <Cake className="w-5 h-5 text-[#164151] dark:text-[#85ea10]" />
              </div>
              <div className="min-w-0">
                <h2
                  id="daily-birthdays-title"
                  className="text-lg font-bold text-[#164151] dark:text-white"
                >
                  Cumpleaños de hoy
                </h2>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5 capitalize">
                  {todayLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/50">
                Cargando cumpleaños...
              </p>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-sm text-center text-gray-500 dark:text-white/50 py-8">
              No hay cumpleaños hoy.
            </p>
          ) : (
            clients.map((client) => {
              const waUrl = buildBirthdayWhatsappUrl(
                client.name,
                client.whatsapp,
              );
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03]"
                >
                  <GymSeededAvatar
                    seed={client.id}
                    size={44}
                    className="shrink-0 rounded-full ring-2 ring-[#85ea10]/20"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[#164151] dark:text-white truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      🎂 {client.age} años · {client.birthDayMonthLabel}
                    </p>
                    {client.document_id && (
                      <p className="text-[11px] text-gray-400 dark:text-white/40">
                        CC {client.document_id}
                      </p>
                    )}
                  </div>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  ) : (
                    <span className="shrink-0 text-[10px] text-gray-400 dark:text-white/40 px-2">
                      Sin WA
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!loading && clients.length > 0 && (
          <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white/40 mb-1">
              Mensaje RogerBox
            </p>
            <p className="text-xs text-gray-600 dark:text-white/60 leading-relaxed italic">
              &ldquo;{sampleMessage}&rdquo;
            </p>
          </div>
        )}

        <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-[#164151] dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

/** Carga cumpleaños de hoy y abre el modal si hay clientes y no se cerró hoy. */
export function useDailyBirthdaysModal(enabled: boolean) {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<BirthdayClientRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || wasDailyBirthdaysModalDismissedToday()) return;

    let cancelled = false;
    const today = getTodayYmdColombia();

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/gym/birthdays?date=${today}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const list = (data.clients || []) as BirthdayClientRow[];
        if (!cancelled && list.length > 0) {
          setClients(list);
          setIsOpen(true);
        }
      } catch {
        // silencioso: no bloquear el backoffice
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, clients, loading, close, dateYmd: getTodayYmdColombia() };
}
