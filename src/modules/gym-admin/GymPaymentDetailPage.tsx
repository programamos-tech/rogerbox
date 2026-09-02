'use client';

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { isPlaceholderGymWhatsapp } from '@/lib/gymClientDisplay';
import {
  adminFormModalStyles as modal,
  gymPaymentDetailStyles as t,
  gymUserDetailStyles as u,
} from '@/modules/gym-admin/styles';
import { downloadGymPaymentInvoicePdf } from '@/modules/gym-admin/utils/gym-payment-invoice-pdf.util';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import {
  gymPaymentCashAmount,
  gymPaymentCreditApplied,
  gymPaymentInvoiceTotal,
  gymPaymentMethodLabel,
} from '@/shared/utils/gym-payment-amount.util';
import type { GymPayment } from '@/types/gym';

export function GymPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useSupabaseAuth();
  const [payment, setPayment] = useState<GymPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const paymentId = params?.id as string;

  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
    const matchId = envId && authUser.id === envId;
    const matchEmail = envEmail && authUser.email === envEmail;
    const matchRole = authUser.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [authUser]);

  const loadPaymentData = async (opts?: { quiet?: boolean }) => {
    try {
      if (!opts?.quiet) setLoading(true);
      const response = await fetch(
        `/api/admin/gym/payments?payment_id=${paymentId}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar factura');
      }
      const foundPayment = Array.isArray(data.payments)
        ? data.payments.find((p: GymPayment) => p.id === paymentId)
        : data.payment;
      setPayment(foundPayment || null);
    } catch {
      setPayment(null);
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (paymentId) void loadPaymentData();
  }, [authLoading, authUser, isAdmin, paymentId, router]);

  const handleVoidPayment = async () => {
    if (!payment || !paymentId) return;
    const reason = voidReason.trim();
    if (reason.length < 10) {
      setVoidError('El motivo debe tener al menos 10 caracteres.');
      return;
    }
    setVoidError('');
    try {
      setIsVoiding(true);
      const res = await fetch(
        `/api/admin/gym/payments/${encodeURIComponent(paymentId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'void', reason }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al anular');
      setShowVoidModal(false);
      setVoidReason('');
      await loadPaymentData({ quiet: true });
    } catch (e: unknown) {
      setVoidError(e instanceof Error ? e.message : 'Error al anular el pago');
    } finally {
      setIsVoiding(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!payment) return;
    try {
      setIsDownloading(true);
      await downloadGymPaymentInvoicePdf(payment);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (authLoading || loading) {
    return <QuickLoading />;
  }

  if (!payment) {
    return (
      <AdminLayout
        title="Factura"
        description="Documento no encontrado"
        activeTab="gym-payments"
      >
        <div className="space-y-4 py-8 text-center">
          <p className="text-[#164151]/80 dark:text-white/60">
            Factura no encontrada
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin?tab=gym-payments')}
            className={u.toolbarBtnPrimary}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a pagos
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isVoided = payment.status === 'voided';
  const invoiceLabel = payment.invoice_number
    ? String(payment.invoice_number).padStart(3, '0')
    : payment.id.substring(0, 8).toUpperCase();
  const methodLabel = gymPaymentMethodLabel(payment);
  const invoiceTotal = gymPaymentInvoiceTotal(payment);
  const creditApplied = gymPaymentCreditApplied(payment);
  const cashAmount = gymPaymentCashAmount(payment);
  const clientHref = payment.client_info?.user_id
    ? `/admin/users/${payment.client_info.user_id}`
    : `/admin/users/${payment.client_info_id}`;
  const wa =
    payment.client_info?.whatsapp &&
    !isPlaceholderGymWhatsapp(payment.client_info.whatsapp)
      ? payment.client_info.whatsapp
      : null;

  const summaryItems = [
    { label: 'Factura', value: `#${invoiceLabel}` },
    {
      label: 'Estado',
      value: isVoided ? 'Anulada' : 'Vigente',
      emphasize: !isVoided,
      danger: isVoided,
    },
    {
      label: 'Emisión',
      value: new Date(payment.created_at).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    {
      label: 'Pago',
      value: formatDateOnlyLocal(payment.payment_date, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    },
    { label: 'Método', value: methodLabel },
    {
      label: 'Total',
      value: `$${invoiceTotal.toLocaleString('es-CO')} COP`,
      emphasize: !isVoided,
      danger: isVoided,
    },
  ];

  return (
    <AdminLayout
      title={`Factura #${invoiceLabel}`}
      description="Comprobante de pago · Sede física"
      activeTab="gym-payments"
    >
      <div className={t.page}>
        <div className={t.detailToolbar}>
          <div className={t.detailMetaRow}>
            <span
              className={
                isVoided
                  ? 'text-lg font-semibold tabular-nums text-red-700/80 line-through dark:text-red-400/90'
                  : 'text-lg font-semibold tabular-nums text-[#164151] dark:text-white'
              }
            >
              #{invoiceLabel}
            </span>
            <span className={t.detailMetaSep}>·</span>
            {isVoided ? (
              <span className={t.badgeVoided}>
                <XCircle className="h-3 w-3" />
                Anulada
              </span>
            ) : (
              <span className={t.badgeActive}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Vigente
              </span>
            )}
            <span className={`${t.detailMetaSep} hidden sm:inline`}>·</span>
            <span className={`${t.detailMetaMuted} hidden sm:inline`}>
              NIT 1102819763-9 · Los Alpes · 3005009487
            </span>
          </div>

          <div className={t.detailActions}>
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className={u.toolbarBtn}
              title="Descargar PDF"
            >
              <Download className="h-3.5 w-3.5 text-[#85ea10]" />
              {isDownloading ? 'Generando…' : 'PDF'}
            </button>
            {!isVoided ? (
              <button
                type="button"
                onClick={() => {
                  setVoidError('');
                  setVoidReason('');
                  setShowVoidModal(true);
                }}
                className={u.toolbarBtnDanger}
              >
                <XCircle className="h-3.5 w-3.5" />
                Anular
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push('/admin?tab=gym-payments')}
              className={t.detailBackBtn}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </button>
          </div>
        </div>

        {isVoided ? (
          <div className={t.voidBanner}>
            <p className={t.voidTitle}>Documento anulado</p>
            <p className={t.voidBody}>
              {payment.voided_reason
                ? `Motivo: ${payment.voided_reason}`
                : 'Esta factura no cuenta en los ingresos del dashboard.'}
            </p>
          </div>
        ) : null}

        <div className={u.summaryStrip}>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={u.summaryItem}
              title={item.value}
            >
              <span className={u.summaryLabel}>{item.label}</span>
              <span
                className={
                  item.danger
                    ? `${u.summaryValue} text-red-700 dark:text-red-400`
                    : item.emphasize
                      ? `${u.summaryValue} text-[#3f7d08] dark:text-[#85ea10]`
                      : u.summaryValue
                }
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className={t.panel}>
            <p className={t.panelTitle}>Cliente</p>
            <div className="flex items-start gap-3">
              <GymSeededAvatar
                seed={payment.client_info_id}
                size={48}
                className="h-12 w-12 shrink-0 rounded-full ring-1 ring-gray-200 dark:ring-white/12"
                alt=""
              />
              <div className="min-w-0">
                <Link href={clientHref} className={t.clientLink}>
                  {payment.client_info?.name || '—'}
                  <ChevronRight className="h-4 w-4 text-[#85ea10]" />
                </Link>
                <div className={u.clientMeta}>
                  {payment.client_info?.document_id ? (
                    <span className="tabular-nums">
                      Doc. {payment.client_info.document_id}
                    </span>
                  ) : null}
                  {payment.client_info?.email ? (
                    <span className="break-all">
                      {payment.client_info.email}
                    </span>
                  ) : null}
                  {wa ? (
                    <span className="tabular-nums">WhatsApp {wa}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={t.panel}>
            <p className={t.panelTitle}>Plan facturado</p>
            <p className={t.planName}>{payment.plan?.name || 'Plan'}</p>
            <p className={t.metaLine}>
              <span className={t.metaLabel}>Período: </span>
              {formatDateOnlyLocal(payment.period_start, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              —{' '}
              {formatDateOnlyLocal(payment.period_end, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className={t.metaLine}>
              <span className={t.metaLabel}>Forma de pago: </span>
              {methodLabel}
            </p>
            <div className="mt-4 border-t border-gray-200/70 pt-4 dark:border-white/[0.08]">
              <p className={t.panelTitle}>Total COP</p>
              <p
                className={
                  isVoided ? t.totalValueVoided : t.totalValue
                }
              >
                ${invoiceTotal.toLocaleString('es-CO')}
              </p>
              {creditApplied > 0 ? (
                <p className="mt-1 text-xs text-[#164151]/60 dark:text-white/45">
                  {cashAmount > 0
                    ? `$${creditApplied.toLocaleString('es-CO')} saldo a favor · $${cashAmount.toLocaleString('es-CO')} en caja`
                    : 'Cubierto con saldo a favor'}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        {payment.notes ? (
          <section className={t.panel}>
            <p className={t.panelTitle}>Observaciones</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#164151]/85 dark:text-white/75">
              {payment.notes}
            </p>
          </section>
        ) : null}
      </div>

      {showVoidModal ? (
        <div className={modal.overlay}>
          <div className={`${modal.panel} max-w-md`}>
            <div className={modal.header}>
              <h3 className={modal.title}>Anular factura</h3>
              <button
                type="button"
                onClick={() => {
                  if (!isVoiding) {
                    setShowVoidModal(false);
                    setVoidReason('');
                    setVoidError('');
                  }
                }}
                className={modal.closeBtn}
                disabled={isVoiding}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className={modal.body}>
              <p className="text-sm text-[#164151]/70 dark:text-white/60">
                Esta factura dejará de contar en los ingresos del dashboard.
                Escribe el motivo de la anulación (mínimo 10 caracteres).
              </p>
              <div>
                <label className={modal.label}>¿Por qué se anula?</label>
                <textarea
                  value={voidReason}
                  onChange={(e) => {
                    setVoidReason(e.target.value);
                    setVoidError('');
                  }}
                  placeholder="Ej: Pago registrado por error, cliente canceló..."
                  className={`${modal.input} min-h-[100px] resize-none`}
                  rows={3}
                  minLength={10}
                  maxLength={500}
                  disabled={isVoiding}
                />
                <p className={modal.helper}>
                  {voidReason.length}/500 (mín. 10)
                </p>
              </div>
              {voidError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {voidError}
                </p>
              ) : null}
              <div className={modal.footer}>
                <button
                  type="button"
                  onClick={() => {
                    setShowVoidModal(false);
                    setVoidReason('');
                    setVoidError('');
                  }}
                  disabled={isVoiding}
                  className={modal.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleVoidPayment}
                  disabled={isVoiding || voidReason.trim().length < 10}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isVoiding ? 'Anulando…' : 'Anular factura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
