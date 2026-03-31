'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, Download, X, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { isPlaceholderGymWhatsapp } from '@/lib/gymClientDisplay';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import type { GymPayment } from '@/types/gym';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useSupabaseAuth();
  const [payment, setPayment] = useState<GymPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

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

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (paymentId && isAdmin) {
      loadPaymentData();
    }
  }, [authLoading, authUser, isAdmin, paymentId, router]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/gym/payments?payment_id=${paymentId}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar factura');
      }

      // Buscar el pago específico
      const foundPayment = Array.isArray(data.payments)
        ? data.payments.find((p: GymPayment) => p.id === paymentId)
        : data.payment;

      if (foundPayment) {
        setPayment(foundPayment);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

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
      await loadPaymentData();
    } catch (e: unknown) {
      setVoidError(e instanceof Error ? e.message : 'Error al anular el pago');
    } finally {
      setIsVoiding(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!payment) return;

    const invoiceDiv = document.createElement('div');
    invoiceDiv.style.width = '800px';
    invoiceDiv.style.padding = '40px';
    invoiceDiv.style.backgroundColor = '#ffffff';
    invoiceDiv.style.fontFamily = 'Arial, sans-serif';
    invoiceDiv.style.color = '#333';
    invoiceDiv.style.position = 'absolute';
    invoiceDiv.style.left = '-9999px';

    const paymentMethodText =
      payment.payment_method === 'cash'
        ? 'Efectivo'
        : payment.payment_method === 'transfer'
          ? 'Transferencia'
          : 'Mixto';
    const periodStartFormatted = formatDateOnlyLocal(payment.period_start, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const periodEndFormatted = formatDateOnlyLocal(payment.period_end, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const paymentDateFormatted = formatDateOnlyLocal(payment.payment_date, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const clientWa = payment.client_info?.whatsapp;
    const waPdfBlock =
      clientWa && !isPlaceholderGymWhatsapp(clientWa)
        ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">WhatsApp ${clientWa}</div>`
        : clientWa && isPlaceholderGymWhatsapp(clientWa)
          ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 2px; font-style: italic;">WhatsApp pendiente</div>`
          : '';

    invoiceDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: 900; color: #164151; letter-spacing: -0.5px; font-family: Arial, sans-serif;">
          <strong style="font-weight: 900;">ROGER</strong><strong style="color: #85ea10; font-weight: 900;">BOX</strong>
        </div>
        <div style="font-size: 13px; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.08em;">
          Comprobante de pago
        </div>
        <div style="font-size: 15px; color: #164151; font-weight: 600; margin-top: 12px;">
          ${payment.invoice_number ? `Factura Nº ${String(payment.invoice_number).padStart(3, '0')}` : `Pago ${payment.id.substring(0, 8).toUpperCase()}`}
        </div>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 28px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 220px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Emisor</div>
          <div style="font-size: 14px; color: #164151; font-weight: 600;">ROGERBOX</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">NIT 1102819763-9</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Cr 54 A #25-26, Los Alpes · 3005009487</div>
        </div>
        <div style="flex: 1; min-width: 220px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Cliente</div>
          <div style="font-size: 14px; color: #164151; font-weight: 600;">${payment.client_info?.name || '—'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Doc. ${payment.client_info?.document_id || '—'}</div>
          ${waPdfBlock}
        </div>
      </div>

      <div style="background: #164151; color: #fff; padding: 14px 20px; border-radius: 12px 12px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
        Detalle del plan y pago
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500; width: 38%;">Plan</td>
            <td style="padding: 14px 20px; color: #164151; font-weight: 600;">${payment.plan?.name || 'Plan'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de inicio</td>
            <td style="padding: 14px 20px; color: #0f172a;">${periodStartFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de finalización</td>
            <td style="padding: 14px 20px; color: #0f172a;">${periodEndFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de pago</td>
            <td style="padding: 14px 20px; color: #0f172a;">${paymentDateFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Método de pago</td>
            <td style="padding: 14px 20px; color: #0f172a;">${paymentMethodText}</td>
          </tr>
          ${
            payment.notes
              ? `<tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Notas</td>
            <td style="padding: 14px 20px; color: #0f172a;">${payment.notes}</td>
          </tr>`
              : ''
          }
          <tr style="background: #f0fdf4;">
            <td style="padding: 18px 20px; color: #164151; font-weight: 700; font-size: 15px;">Total pagado</td>
            <td style="padding: 18px 20px; color: #164151; font-weight: 800; font-size: 20px;">$${payment.amount.toLocaleString('es-CO')} COP</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">
          RogerBox · registro interno · exportado ${new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    `;

    document.body.appendChild(invoiceDiv);

    try {
      const canvas = await html2canvas(invoiceDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `factura-${payment.invoice_number || payment.id.substring(0, 8)}-${payment.payment_date}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      alert('Error al generar el PDF');
    } finally {
      document.body.removeChild(invoiceDiv);
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
        headerRight={
          <button
            type="button"
            onClick={() => router.push('/admin?tab=gym-payments')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#164151] text-white dark:bg-white dark:text-[#164151] px-3 py-2 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        }
      >
        <p className="text-center text-[#164151]/80 dark:text-white/60 py-12">
          Factura no encontrada
        </p>
      </AdminLayout>
    );
  }

  const paymentMethodText = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mixed: 'Mixto',
  };

  const invoiceLabel =
    payment.invoice_number || payment.id.substring(0, 8).toUpperCase();

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {payment.status !== 'voided' ? (
        <>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm font-semibold text-[#164151] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4 text-[#85ea10]" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setVoidError('');
              setVoidReason('');
              setShowVoidModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 px-3 py-2 text-sm font-semibold transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Anular
          </button>
        </>
      ) : (
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold">
          <XCircle className="w-4 h-4" />
          Anulado
        </span>
      )}
      <button
        type="button"
        onClick={() => router.push('/admin?tab=gym-payments')}
        className="inline-flex items-center gap-2 rounded-lg bg-[#164151] text-white dark:bg-white dark:text-[#164151] px-3 py-2 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>
    </div>
  );

  return (
    <AdminLayout
      title="Detalle de factura"
      description={`Factura #${invoiceLabel}`}
      activeTab="gym-payments"
      headerRight={headerActions}
    >
      <div className="max-w-6xl mx-auto space-y-0">
            {payment.status === 'voided' && (
              <div className="mb-8 border-l-4 border-red-500/70 pl-4 py-1 text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold uppercase tracking-wider text-[11px] text-red-700 dark:text-red-300 mb-1">
                  Documento anulado
                </p>
                {payment.voided_reason && (
                  <p>
                    <span className="font-medium">Motivo:</span>{' '}
                    {payment.voided_reason}
                  </p>
                )}
              </div>
            )}

            <div
              className="relative text-[#164151] dark:text-white overflow-hidden"
              role="article"
            >
              <div className="relative z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-8 border-b border-gray-200/80 dark:border-white/[0.08]">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-white/40">
                    Comprobante de pago · Sede física
                  </p>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#164151] dark:text-white">
                    Factura #
                    {payment.invoice_number ||
                      payment.id.substring(0, 8).toUpperCase()}
                  </h2>
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-white/40 max-w-xl leading-relaxed">
                    NIT 1102819763-9 · Cr 54 A #25-26, Los Alpes · 3005009487
                  </p>
                </div>
                <div className="text-sm shrink-0 space-y-1 sm:text-right text-gray-600 dark:text-white/65">
                  <p>
                    <span className="text-gray-500 dark:text-white/45">
                      Estado:{' '}
                    </span>
                    {payment.status === 'voided' ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Anulado
                      </span>
                    ) : (
                      <span className="font-semibold text-[#85ea10]">
                        Pagado
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-gray-500 dark:text-white/45">
                      Emisión:{' '}
                    </span>
                    {new Date(payment.created_at).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p>
                    <span className="text-gray-500 dark:text-white/45">
                      Pago:{' '}
                    </span>
                    {formatDateOnlyLocal(payment.payment_date, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Protagonismo: quién compró | qué plan */}
              <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                <div className="min-w-0">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <GymSeededAvatar
                      seed={payment.client_info_id}
                      size={72}
                      className="shrink-0 rounded-full ring-2 ring-gray-200/80 dark:ring-white/12 shadow-sm"
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 mb-3">
                        Quién compró
                      </p>
                      <Link
                        href={
                          payment.client_info?.user_id
                            ? `/admin/users/${payment.client_info.user_id}`
                            : `/admin/users/${payment.client_info_id}`
                        }
                        className="inline-block text-2xl sm:text-3xl font-bold tracking-tight text-[#164151] dark:text-white leading-tight hover:underline decoration-[#85ea10]/70 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#85ea10]/45 focus-visible:rounded-sm"
                      >
                        {payment.client_info?.name || '—'}
                      </Link>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-white/55">
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
                        {payment.client_info?.whatsapp ? (
                          isPlaceholderGymWhatsapp(
                            payment.client_info.whatsapp,
                          ) ? (
                            <span className="text-xs text-gray-500 dark:text-white/45 italic">
                              WhatsApp pendiente
                            </span>
                          ) : (
                            <span className="tabular-nums">
                              WhatsApp {payment.client_info.whatsapp}
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 lg:pl-8 lg:border-l border-gray-200/80 dark:border-white/[0.08]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 mb-3">
                    Qué plan se facturó
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#85ea10] leading-tight">
                    {payment.plan?.name || 'Plan'}
                  </p>
                  <p className="mt-4 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
                    <span className="text-gray-500 dark:text-white/45">
                      Período:{' '}
                    </span>
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
                  <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                    <span className="text-gray-500 dark:text-white/45">
                      Forma de pago:{' '}
                    </span>
                    {paymentMethodText[payment.payment_method] ||
                      payment.payment_method}
                  </p>
                  <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-white/[0.08]">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-white/40">
                      Total COP
                    </p>
                    <p className="mt-1 text-3xl sm:text-4xl font-bold tabular-nums text-[#85ea10]">
                      ${payment.amount.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>

              {payment.notes ? (
                <section className="mt-10 sm:mt-12 pt-8 border-t border-gray-200/80 dark:border-white/[0.07]">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/40 mb-2">
                    Observaciones
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-white/75 leading-relaxed whitespace-pre-wrap">
                    {payment.notes}
                  </p>
                </section>
              ) : null}

              </div>

              {payment.status !== 'voided' ? (
                <div
                  className="pointer-events-none absolute inset-0 z-20 flex items-end justify-end overflow-hidden p-3 sm:p-5 md:p-6"
                  aria-hidden
                >
                  <div
                    className="max-w-[min(15.5rem,78vw)] origin-bottom-right -rotate-[12deg] rounded-lg border-[4px] border-[#85ea10] bg-gradient-to-b from-[#85ea10] via-[#7bd60a] to-[#6bc40a] px-5 py-2.5 sm:px-8 sm:py-3.5 shadow-[0_10px_32px_rgba(133,234,16,0.38)] ring-1 ring-[#164151]/15"
                  >
                    <p className="text-center font-black uppercase tracking-[0.38em] sm:tracking-[0.48em] text-[#164151] text-[clamp(1rem,3.2vw,1.65rem)] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]">
                      Pagado
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
      </div>

        {/* Modal anular factura */}
        {showVoidModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#164151] dark:text-white">
                  Anular factura
                </h3>
                <button
                  onClick={() => {
                    if (!isVoiding) {
                      setShowVoidModal(false);
                      setVoidReason('');
                      setVoidError('');
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60"
                  disabled={isVoiding}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
                Esta factura dejará de contar en los ingresos del dashboard.
                Escribe el motivo de la anulación (mínimo 10 caracteres).
              </p>
              <label className="block text-sm font-medium text-[#164151] dark:text-white mb-2">
                ¿Por qué se anula?
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => {
                  setVoidReason(e.target.value);
                  setVoidError('');
                }}
                placeholder="Ej: Pago registrado por error, cliente canceló..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#164151] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10] outline-none resize-none min-h-[100px]"
                rows={3}
                minLength={10}
                maxLength={500}
                disabled={isVoiding}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-white/40">
                {voidReason.length}/500 (mín. 10)
              </p>
              {voidError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {voidError}
                </p>
              )}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowVoidModal(false);
                    setVoidReason('');
                    setVoidError('');
                  }}
                  disabled={isVoiding}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-[#164151] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVoidPayment}
                  disabled={isVoiding || voidReason.trim().length < 10}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isVoiding ? 'Anulando…' : 'Anular factura'}
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
