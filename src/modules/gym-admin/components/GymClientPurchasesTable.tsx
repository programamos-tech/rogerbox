'use client';

import { CreditCard, Edit, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  getMembershipPeriodProgress,
  periodEndFromStart,
} from '@/lib/dateUtils';
import { getGymWhatsappHref } from '@/lib/gymClientDisplay';
import { gymUserDetailStyles as t } from '@/modules/gym-admin/styles';
import { DatePickerField } from '@/shared/components/DatePickerField';
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon';
import { pickLatestExpiredMembershipPerPlan } from '@/shared/utils/gym-membership-admin.util';
import { gymPaymentInvoiceTotal } from '@/shared/utils/gym-payment-amount.util';

type MembershipRow = {
  kind: 'membership';
  id: string;
  sortKey: number;
  membership: any;
};

type CourseRow = {
  kind: 'course';
  id: string;
  sortKey: number;
  purchase: any;
};

type PurchaseRow = MembershipRow | CourseRow;

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const dateOnly = String(dateStr).slice(0, 10);
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function resolvePlan(membership: any): { id: string | null; name: string } {
  const rawPlan = membership?.plan;
  if (Array.isArray(rawPlan)) {
    const first = rawPlan[0] || {};
    return {
      id: first?.id ? String(first.id) : null,
      name: first?.name || 'Plan',
    };
  }
  return {
    id: rawPlan?.id ? String(rawPlan.id) : null,
    name: rawPlan?.name || 'Plan',
  };
}

function resolveCourse(purchase: any) {
  const course = Array.isArray(purchase?.course)
    ? purchase.course[0]
    : purchase?.course;
  return course || null;
}

function membershipStatus(
  membership: any,
  today: Date,
  renewIds: Set<string>,
): { label: string; className: string; rank: number } {
  if (membership.status === 'cancelled') {
    return { label: 'Cancelada', className: t.badgeCancelled, rank: 50 };
  }
  const start = parseLocalDate(membership.start_date);
  const end = parseLocalDate(membership.end_date);
  if (end < today) {
    // Solo "Renovar" marca atención: último periodo sin renovar.
    // El resto del historial ya cerró → "Finalizado" (no alarma roja).
    if (renewIds.has(String(membership.id))) {
      return { label: 'Renovar', className: t.badgeRenew, rank: 20 };
    }
    return { label: 'Finalizado', className: t.badgeFinished, rank: 40 };
  }
  if (start > today) {
    return { label: 'Próximo', className: t.badgeScheduled, rank: 15 };
  }
  const period = getMembershipPeriodProgress(
    membership.start_date,
    membership.end_date,
    today,
  );
  if (period.endingSoon) {
    return { label: 'Por vencer', className: t.badgeEndingSoon, rank: 10 };
  }
  return { label: 'Al día', className: t.badgePeriod, rank: 5 };
}

function courseStatus(
  purchase: any,
  today: Date,
): { label: string; className: string; rank: number; endStr: string | null } {
  const course = resolveCourse(purchase);
  const durationDays =
    Number(course?.duration_days) > 0 ? Number(course.duration_days) : 30;
  const startStr = purchase.access_granted_at
    ? String(purchase.access_granted_at).slice(0, 10)
    : null;
  const endStr = startStr
    ? periodEndFromStart(parseLocalDate(startStr), durationDays)
    : null;

  if (purchase.is_course_finished) {
    return {
      label: 'Finalizado',
      className: t.badgeFinished,
      rank: 45,
      endStr,
    };
  }
  if (endStr && parseLocalDate(endStr) < today) {
    return {
      label: 'Finalizado',
      className: t.badgeFinished,
      rank: 40,
      endStr,
    };
  }
  if (purchase.is_active) {
    if (endStr) {
      const period = getMembershipPeriodProgress(startStr!, endStr, today);
      if (period.endingSoon) {
        return {
          label: 'Por vencer',
          className: t.badgeEndingSoon,
          rank: 10,
          endStr,
        };
      }
    }
    return { label: 'Activo', className: t.badgePeriod, rank: 5, endStr };
  }
  return {
    label: 'Completado',
    className: t.badgeCancelled,
    rank: 45,
    endStr,
  };
}

export type GymClientPurchasesTableProps = {
  userData: any;
  editingStartDateMembershipId?: string | null;
  newStartDate?: string;
  setNewStartDate?: (v: string) => void;
  isUpdatingStartDate?: boolean;
  handleStartEditStartDate?: (membership: any) => void;
  handleCancelEditStartDate?: () => void;
  handleSaveStartDate?: (membershipId: string) => Promise<void>;
  openCancelMembershipModal?: (membership: any) => void;
  cancellingMembershipId?: string | null;
};

export function GymClientPurchasesTable({
  userData,
  editingStartDateMembershipId = null,
  newStartDate = '',
  setNewStartDate = () => {},
  isUpdatingStartDate = false,
  handleStartEditStartDate = () => {},
  handleCancelEditStartDate = () => {},
  handleSaveStartDate = async () => {},
  openCancelMembershipModal = () => {},
  cancellingMembershipId = null,
}: GymClientPurchasesTableProps) {
  const router = useRouter();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const renewIds = useMemo(() => {
    const expiredRaw = (userData.gym_memberships || []).filter(
      (membership: any) => {
        const endDate = parseLocalDate(membership.end_date);
        if (endDate >= today || membership.status === 'cancelled') return false;
        const hasRenewedSamePlan = (userData.gym_memberships || []).some(
          (m: any) =>
            m.id !== membership.id &&
            m.plan_id === membership.plan_id &&
            m.status !== 'cancelled' &&
            parseLocalDate(m.end_date) >= today,
        );
        return !hasRenewedSamePlan;
      },
    );
    const latest = pickLatestExpiredMembershipPerPlan(expiredRaw);
    return new Set(latest.map((m: any) => String(m.id)));
  }, [userData.gym_memberships, today]);

  const rows = useMemo(() => {
    const membershipRows: PurchaseRow[] = (userData.gym_memberships || []).map(
      (membership: any) => {
        const status = membershipStatus(membership, today, renewIds);
        return {
          kind: 'membership' as const,
          id: `m-${membership.id}`,
          sortKey: status.rank * 1e15 - parseLocalDate(membership.end_date).getTime(),
          membership,
        };
      },
    );

    const courseRows: PurchaseRow[] = (userData.course_purchases || []).map(
      (purchase: any) => {
        const status = courseStatus(purchase, today);
        const endMs = status.endStr
          ? parseLocalDate(status.endStr).getTime()
          : purchase.access_granted_at
            ? parseLocalDate(String(purchase.access_granted_at).slice(0, 10)).getTime()
            : 0;
        return {
          kind: 'course' as const,
          id: `c-${purchase.id}`,
          sortKey: status.rank * 1e15 - endMs,
          purchase,
        };
      },
    );

    return [...membershipRows, ...courseRows].sort(
      (a, b) => a.sortKey - b.sortKey,
    );
  }, [userData.gym_memberships, userData.course_purchases, today, renewIds]);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-sm text-gray-500 dark:text-white/50">
        Sin compras registradas en Rogerbox.
      </p>
    );
  }

  const resolveClientInfoId = (membership?: any) => {
    if (userData.isUnregisteredClient) return userData.id;
    return (
      membership?.client_info_id ||
      userData.client_info_id ||
      userData.gym_memberships?.[0]?.client_info_id ||
      null
    );
  };

  const displayName = (() => {
    const full = typeof userData.full_name === 'string' ? userData.full_name.trim() : '';
    const n = typeof userData.name === 'string' ? userData.name.trim() : '';
    const gym =
      typeof userData.gym_client_name === 'string'
        ? userData.gym_client_name.trim()
        : '';
    if (full) return full;
    if (n) return n;
    if (gym) return gym;
    return 'Cliente';
  })();

  return (
    <div className={t.tableShell}>
      <div className={t.tableWrap}>
        <table className={`${t.table} min-w-[920px]`}>
          <thead>
            <tr>
              <th className={`${t.th} ${t.thLeft}`}>Producto</th>
              <th className={`${t.th} ${t.thLeft}`}>Periodo</th>
              <th className={`${t.th} ${t.thLeft}`}>Estado</th>
              <th className={`${t.th} ${t.thLeft}`}>Factura</th>
              <th className={`${t.th} ${t.thLeft}`}>Monto</th>
              <th className={`${t.th} ${t.actionsCellTh}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.kind === 'course') {
                const purchase = row.purchase;
                const course = resolveCourse(purchase);
                const status = courseStatus(purchase, today);
                const startStr = purchase.access_granted_at
                  ? String(purchase.access_granted_at).slice(0, 10)
                  : null;
                const amount = Number(purchase.purchase_price) || 0;

                return (
                  <tr key={row.id} className={t.rowStatic}>
                    <td className={t.td}>
                      <p className={t.planName}>{course?.title || 'Curso'}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/40">
                        Curso en línea
                      </p>
                    </td>
                    <td className={t.td}>
                      {startStr ? (
                        <span className={t.periodDates}>
                          {formatDayLabel(parseLocalDate(startStr))}
                          {status.endStr ? (
                            <>
                              <span className={t.periodSep}>→</span>
                              {formatDayLabel(parseLocalDate(status.endStr))}
                            </>
                          ) : null}
                        </span>
                      ) : (
                        <span className={t.historyMuted}>—</span>
                      )}
                    </td>
                    <td className={t.td}>
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td className={t.td}>
                      <span className={t.historyMuted}>—</span>
                    </td>
                    <td className={t.td}>
                      {amount > 0 ? (
                        <span className="text-sm font-semibold tabular-nums">
                          ${amount.toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className={t.historyMuted}>—</span>
                      )}
                    </td>
                    <td className={t.td}>
                      <span className={t.historyMuted}>—</span>
                    </td>
                  </tr>
                );
              }

              const membership = row.membership;
              const plan = resolvePlan(membership);
              const status = membershipStatus(membership, today, renewIds);
              const isEditingStart =
                editingStartDateMembershipId === membership.id;
              const needsRenew = renewIds.has(String(membership.id));
              const isActivePeriod =
                membership.status !== 'cancelled' &&
                parseLocalDate(membership.end_date) >= today;
              const clientInfoId = resolveClientInfoId(membership);
              const whatsappHref = getGymWhatsappHref(
                userData.whatsapp || userData.phone,
              );
              const amount = gymPaymentInvoiceTotal(
                membership.payment || {},
              );
              const hasInvoice =
                Boolean(membership.payment?.invoice_number) || amount > 0;

              const handleRenewWhatsApp = () => {
                const whatsappNumber = (
                  userData.whatsapp ||
                  userData.phone ||
                  ''
                ).replace(/\D/g, '');
                if (!whatsappNumber) return;
                const endDateFormatted = parseLocalDate(
                  membership.end_date,
                ).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                });
                const message = encodeURIComponent(
                  `Hola ${displayName}, tu plan "${plan.name}" finalizó el ${endDateFormatted}. ¿Deseas renovar tu membresía para continuar?`,
                );
                window.open(
                  `https://wa.me/${whatsappNumber}?text=${message}`,
                  '_blank',
                );
              };

              return (
                <tr key={row.id} className={t.rowStatic}>
                  <td className={t.td}>
                    <p className={t.planName}>
                      {plan.id ? (
                        <Link
                          href={`/admin/gym-plans/${plan.id}`}
                          className="inline-flex items-center gap-1.5 rounded-sm underline decoration-white/15 underline-offset-3 transition-colors hover:text-[#85ea10] hover:decoration-[#85ea10]/55"
                          title="Ver detalle del plan"
                        >
                          <span>{plan.name}</span>
                          <FileText className="h-3.5 w-3.5 opacity-75" />
                        </Link>
                      ) : (
                        plan.name
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/40">
                      Membresía sede física
                    </p>
                  </td>
                  <td className={t.td}>
                    {isEditingStart ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DatePickerField
                          id={`membership-start-${membership.id}`}
                          value={newStartDate}
                          onChange={(iso) => setNewStartDate(iso)}
                          disabled={isUpdatingStartDate}
                          aria-label="Fecha de inicio del plan"
                          className="min-w-[140px] max-w-[180px]"
                          triggerClassName="py-1.5 min-h-[32px] text-xs rounded-lg border-gray-300 dark:border-white/20 bg-white dark:bg-gray-800/90"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveStartDate(membership.id)}
                          disabled={isUpdatingStartDate}
                          className="px-2 py-1 text-xs bg-[#85ea10] text-[#164151] rounded-lg hover:bg-[#85ea10]/80 transition-colors disabled:opacity-50"
                          title="Guardar fecha"
                        >
                          {isUpdatingStartDate ? '…' : '✓'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditStartDate}
                          disabled={isUpdatingStartDate}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className={t.periodDates}>
                        {formatDayLabel(parseLocalDate(membership.start_date))}
                        <span className={t.periodSep}>→</span>
                        {formatDayLabel(parseLocalDate(membership.end_date))}
                      </span>
                    )}
                  </td>
                  <td className={t.td}>
                    {userData.is_inactive && needsRenew ? (
                      <span className={t.badgeInactiveClient}>Inactivo</span>
                    ) : (
                      <span className={status.className}>{status.label}</span>
                    )}
                  </td>
                  <td className={t.td}>
                    {membership.payment?.invoice_number ? (
                      membership.payment.id ? (
                        <Link
                          href={`/admin/payments/${membership.payment.id}`}
                          className={t.invoiceLink}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          #{membership.payment.invoice_number}
                        </Link>
                      ) : (
                        <span className="text-xs tabular-nums text-gray-500 dark:text-white/45">
                          #{membership.payment.invoice_number}
                        </span>
                      )
                    ) : (
                      <span className={t.historyMuted}>—</span>
                    )}
                  </td>
                  <td className={t.td}>
                    {hasInvoice ? (
                      <div>
                        <span className="text-sm font-semibold tabular-nums">
                          ${amount.toLocaleString('es-CO')}
                        </span>
                        {Number(membership.payment?.credit_applied) > 0 ? (
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/40">
                            Saldo a favor
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className={t.historyMuted}>—</span>
                    )}
                  </td>
                  <td className={t.td}>
                    <div className={t.actionsCell}>
                      {isActivePeriod ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditStartDate(membership)}
                            className={t.actionBtn}
                            title="Editar fecha de inicio"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openCancelMembershipModal(membership)
                            }
                            disabled={
                              cancellingMembershipId === membership.id
                            }
                            className={t.actionDanger}
                            title="Cancelar membresía"
                          >
                            {cancellingMembershipId === membership.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      ) : null}
                      {needsRenew ? (
                        <>
                          {whatsappHref ? (
                            <button
                              type="button"
                              onClick={handleRenewWhatsApp}
                              className={t.whatsappAction}
                              title="Invitar a renovar por WhatsApp"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                          {clientInfoId ? (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/admin?tab=gym-payments&clientId=${clientInfoId}${plan.id ? `&planId=${plan.id}` : ''}`,
                                )
                              }
                              className={t.actionBtn}
                              title="Registrar pago"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          ) : null}
                          {membership.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() =>
                                openCancelMembershipModal(membership)
                              }
                              disabled={
                                cancellingMembershipId === membership.id
                              }
                              className={t.actionDanger}
                              title="Cancelar membresía"
                            >
                              {cancellingMembershipId === membership.id ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      {!isActivePeriod && !needsRenew ? (
                        <span className={t.historyMuted}>—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
