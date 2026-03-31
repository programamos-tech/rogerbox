'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  MessageSquare,
  Save,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  formatDateOnlyLocal,
  membershipEndDateFromStart,
  parseLocalDate,
} from '@/lib/dateUtils';
import { DatePickerField } from '@/shared/components/DatePickerField';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import type {
  GymClientInfo,
  GymPayment,
  GymPlan,
  PaymentMethod,
} from '@/types/gym';

/** Fecha en YYYY-MM-DD según la zona horaria local (evita que "hoy" salga en UTC). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Miles con punto (formato es-CO), sin decimales. */
function formatCopThousands(n: number): string {
  if (n === 0 || !Number.isFinite(n)) return '';
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function parseDigitsToAmount(s: string): number {
  const digits = s.replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

interface PaymentFormData {
  client_info_id: string;
  plan_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface GymPaymentsManagementRef {
  openCreateModal: (clientId?: string, planId?: string) => void;
  refresh: () => void;
}

const GymPaymentsManagement = forwardRef<GymPaymentsManagementRef>(
  (props, ref) => {
    const router = useRouter();
    const [clients, setClients] = useState<GymClientInfo[]>([]);
    const [plans, setPlans] = useState<GymPlan[]>([]);
    const [payments, setPayments] = useState<GymPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<PaymentFormData>({
      client_info_id: '',
      plan_id: '',
      amount: 0,
      payment_method: 'cash',
      payment_date: toLocalDateString(new Date()),
      period_start: toLocalDateString(new Date()),
      period_end: '',
      notes: '',
    });
    const [selectedClient, setSelectedClient] = useState<GymClientInfo | null>(
      null,
    );
    const [selectedPlan, setSelectedPlan] = useState<GymPlan | null>(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
    const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<
      'all' | 'active' | 'voided'
    >('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [hasActiveMembership, setHasActiveMembership] = useState(false);
    const [checkingMembership, setCheckingMembership] = useState(false);
    const [expiredMembershipToPay, setExpiredMembershipToPay] =
      useState<any>(null);
    const [discountPercent, setDiscountPercent] = useState<number>(0);
    const [isAdvancePayment, setIsAdvancePayment] = useState(false);
    const [amountFieldFocused, setAmountFieldFocused] = useState(false);
    const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
    /** Si viene en la URL (ej. ficha cliente → Renovar), no pisar inicio con pago anticipado. */
    const forcedPeriodStartRef = useRef<string | null>(null);

    useEffect(() => {
      loadData();
      loadPayments();
    }, []);

    // Cargar datos cuando se abre el modal con parámetros
    useEffect(() => {
      if (showForm && clients.length === 0) {
        loadData();
      }
    }, [showForm]);

    // Leer parámetros de URL para abrir modal automáticamente
    useEffect(() => {
      if (
        typeof window !== 'undefined' &&
        !loading &&
        !loadingPayments &&
        clients.length > 0 &&
        plans.length > 0 &&
        !urlParamsProcessed
      ) {
        const params = new URLSearchParams(window.location.search);
        const clientId = params.get('clientId');
        const planId = params.get('planId');
        const periodStartParam = params.get('periodStart');
        if (
          periodStartParam &&
          /^\d{4}-\d{2}-\d{2}$/.test(periodStartParam)
        ) {
          forcedPeriodStartRef.current = periodStartParam;
        }

        if (clientId || planId) {
          const client = clientId
            ? clients.find((c) => c.id === clientId)
            : null;
          // Buscar el plan incluso si está inactivo (para planes vencidos)
          const plan = planId ? plans.find((p) => p.id === planId) : null;

          // Debug: verificar si el plan se encontró
          if (planId && !plan) {
          } else if (planId && plan) {
          }

          // Solo procesar si encontramos al menos uno de los dos
          if (client || plan) {
            // Marcar como procesado primero para evitar múltiples ejecuciones
            setUrlParamsProcessed(true);

            // Primero establecer el cliente si existe
            if (client) {
              setSelectedClient(client);
              setFormData((prev) => ({
                ...prev,
                client_info_id: clientId!,
              }));
              setClientSearchTerm('');
              setError('');
              setHasActiveMembership(false);
              setCheckingMembership(false);
              setExpiredMembershipToPay(null);
            }

            // Luego establecer el plan si existe
            if (plan) {
              // Establecer el plan directamente
              setSelectedPlan(plan);
              const startDate =
                forcedPeriodStartRef.current &&
                /^\d{4}-\d{2}-\d{2}$/.test(forcedPeriodStartRef.current)
                  ? parseLocalDate(forcedPeriodStartRef.current)
                  : new Date();
              const durationDays = plan.duration_days ?? 30;
              const periodEndStr = membershipEndDateFromStart(startDate, durationDays);

              setFormData((prev) => ({
                ...prev,
                plan_id: planId!,
                amount: plan.price,
                period_start: toLocalDateString(startDate),
                period_end: periodEndStr,
              }));

              // Verificar membresía activa para este plan si hay cliente seleccionado
              if (client) {
                // Usar setTimeout para asegurar que el estado se actualice primero
                setTimeout(() => {
                  checkActiveMembershipForPlan(client.id, plan.id, plan);
                }, 300);
              }
            } else if (planId) {
              setError(
                `El plan seleccionado no está disponible. Por favor, selecciona otro plan.`,
              );
            }

            // Abrir el modal
            setShowForm(true);

            // Limpiar los parámetros de la URL después de un breve delay
            setTimeout(() => {
              const newUrl = window.location.pathname + '?tab=gym-payments';
              window.history.replaceState({}, '', newUrl);
            }, 300);
          }
        } else {
          // Si no hay parámetros, marcar como procesado también
          setUrlParamsProcessed(true);
        }
      }
    }, [loading, loadingPayments, clients, plans, urlParamsProcessed]);

    // Solo al cambiar plan o cliente: verificar membresía y poner fechas por defecto. No al cambiar la fecha manualmente.
    useEffect(() => {
      if (selectedPlan && selectedClient) {
        checkActiveMembershipForPlan(
          selectedClient.id,
          selectedPlan.id,
          selectedPlan,
        );
      }
    }, [selectedPlan?.id, selectedClient?.id]);

    // Mantener period_end en sync cuando cambia el plan (amount, duration) — por días del plan
    useEffect(() => {
      if (selectedPlan && formData.period_start) {
        const startDate = parseLocalDate(formData.period_start);
        const durationDays = selectedPlan.duration_days ?? 30;
        const periodEndStr = membershipEndDateFromStart(startDate, durationDays);
        setFormData((prev) => ({
          ...prev,
          plan_id: selectedPlan.id,
          amount: selectedPlan.price,
          period_end: periodEndStr,
        }));
        setDiscountPercent(0);
      }
    }, [selectedPlan?.id]);

    const checkActiveMembershipForPlan = async (
      clientId: string,
      planId: string,
      planForDuration?: GymPlan | null,
    ) => {
      setCheckingMembership(true);
      setError('');
      setHasActiveMembership(false);
      setExpiredMembershipToPay(null);
      setIsAdvancePayment(false);

      const planForCalc = planForDuration ?? selectedPlan;

      const forcedStart = forcedPeriodStartRef.current;
      if (
        forcedStart &&
        /^\d{4}-\d{2}-\d{2}$/.test(forcedStart) &&
        planForCalc
      ) {
        const planDuration = planForCalc.duration_days ?? 30;
        const periodEndStr = membershipEndDateFromStart(
          parseLocalDate(forcedStart),
          planDuration,
        );
        setFormData((prev) => ({
          ...prev,
          period_start: forcedStart,
          period_end: periodEndStr,
        }));
        setHasActiveMembership(false);
        setIsAdvancePayment(false);
        setExpiredMembershipToPay(null);
        setError('');
        forcedPeriodStartRef.current = null;
        setCheckingMembership(false);
        return;
      }

      try {
        const membershipsRes = await fetch(
          `/api/admin/gym/memberships?client_info_id=${clientId}`,
        );

        if (membershipsRes.ok) {
          const memberships = await membershipsRes.json();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Buscar membresía activa SOLO para el MISMO plan que se está pagando
          const activeMembershipForThisPlan = memberships.find((m: any) => {
            const endDate = new Date(m.end_date);
            endDate.setHours(0, 0, 0, 0);
            return (
              m.plan_id === planId &&
              m.status !== 'cancelled' &&
              endDate >= today
            );
          });

          // Si hay membresía activa para ESTE MISMO plan, es pago anticipado
          if (activeMembershipForThisPlan) {
            // Parsear end_date como fecha local (evitar UTC) para que "día siguiente" sea correcto
            const endStr = String(
              activeMembershipForThisPlan.end_date || '',
            ).slice(0, 10);
            const [y, m, d] = endStr.split('-').map(Number);
            const latestEndDate =
              y && m && d
                ? new Date(y, m - 1, d)
                : new Date(activeMembershipForThisPlan.end_date);

            // El nuevo plan empieza el día siguiente al último día del plan actual
            const newStartDate = new Date(latestEndDate);
            newStartDate.setDate(newStartDate.getDate() + 1);

            // Calcular fecha de fin según días del plan (ej. 15 días → inicio + 14)
            const planDuration = planForCalc?.duration_days ?? 30;
            const periodEndStr = membershipEndDateFromStart(newStartDate, planDuration);

            // Actualizar las fechas del formulario automáticamente
            setFormData((prev) => ({
              ...prev,
              period_start: toLocalDateString(newStartDate),
              period_end: periodEndStr,
            }));

            // Marcar como pago anticipado (permitido)
            setIsAdvancePayment(true);
            setHasActiveMembership(false);
            setError('');
          } else {
            // No hay membresía activa para ESTE plan, fechas normales (desde hoy) — por días del plan
            const planDuration = planForCalc?.duration_days ?? 30;
            const startDate = new Date();
            const periodEndStr = membershipEndDateFromStart(startDate, planDuration);

            setFormData((prev) => ({
              ...prev,
              period_start: toLocalDateString(startDate),
              period_end: periodEndStr,
            }));

            setError('');
            setHasActiveMembership(false);
            setExpiredMembershipToPay(null);
            setIsAdvancePayment(false);
          }
        }
      } catch (error) {
      } finally {
        setCheckingMembership(false);
      }
    };

    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsRes, plansRes] = await Promise.all([
          fetch('/api/admin/gym/clients'),
          fetch('/api/admin/gym/plans'),
        ]);

        if (!clientsRes.ok || !plansRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [clientsData, plansData] = await Promise.all([
          clientsRes.json(),
          plansRes.json(),
        ]);

        setClients(clientsData || []);
        // Cargar todos los planes (activos e inactivos) para permitir pagar planes vencidos
        setPlans(plansData || []);
      } catch (error) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    const loadPayments = async () => {
      try {
        setLoadingPayments(true);
        const response = await fetch('/api/admin/gym/payments');
        if (!response.ok) throw new Error('Error al cargar pagos');
        const data = await response.json();
        // Manejar tanto la estructura antigua (array) como la nueva ({ payments: [...] })
        setPayments(Array.isArray(data) ? data : data.payments || []);
      } catch (error) {
      } finally {
        setLoadingPayments(false);
      }
    };

    const handleClientSelect = async (client: GymClientInfo) => {
      setSelectedClient(client);
      setFormData({ ...formData, client_info_id: client.id });
      setClientSearchTerm('');
      setError('');
      setHasActiveMembership(false);
      setCheckingMembership(false);
      setExpiredMembershipToPay(null);
    };

    const handlePlanSelect = (plan: GymPlan) => {
      setSelectedPlan(plan);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
        if (!formData.client_info_id || !formData.plan_id) {
          setError('Debes seleccionar un cliente y un plan');
          setIsSubmitting(false);
          return;
        }

        // Verificar membresías existentes
        const membershipsRes = await fetch(
          `/api/admin/gym/memberships?client_info_id=${formData.client_info_id}`,
        );
        let membershipId: string;

        if (membershipsRes.ok) {
          // Siempre crear una nueva membresía para este pago (1 membresía = 1 período = 1 pago).
          // Renovación = nueva membresía con el período elegido + nuevo pago.
          const membershipRes = await fetch('/api/admin/gym/memberships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_info_id: formData.client_info_id,
              plan_id: formData.plan_id,
              start_date: formData.period_start,
              end_date: formData.period_end,
              status: 'active',
            }),
          });

          if (!membershipRes.ok) {
            const errorData = await membershipRes.json();
            throw new Error(errorData.error || 'Error al crear membresía');
          }

          const membershipData = await membershipRes.json();
          membershipId = membershipData.id;
        } else {
          // Si no se puede verificar membresías, crear nueva membresía
          const membershipRes = await fetch('/api/admin/gym/memberships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_info_id: formData.client_info_id,
              plan_id: formData.plan_id,
              start_date: formData.period_start,
              end_date: formData.period_end,
              status: 'active',
            }),
          });

          if (!membershipRes.ok) {
            const errorData = await membershipRes.json();
            throw new Error(errorData.error || 'Error al crear membresía');
          }

          const membershipData = await membershipRes.json();
          membershipId = membershipData.id;
        }

        // Monto final con descuento aplicado
        const baseAmount = formData.amount;
        const effectiveAmount =
          discountPercent > 0
            ? Math.round(baseAmount * (1 - Math.min(99, discountPercent) / 100))
            : baseAmount;

        // Registrar el pago
        const paymentRes = await fetch('/api/admin/gym/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            membership_id: membershipId,
            client_info_id: formData.client_info_id,
            plan_id: formData.plan_id,
            amount: effectiveAmount,
            payment_method: formData.payment_method,
            payment_date: formData.payment_date,
            period_start: formData.period_start,
            period_end: formData.period_end,
            notes: formData.notes || null,
          }),
        });

        if (!paymentRes.ok) {
          const errorData = await paymentRes.json();
          throw new Error(errorData.error || 'Error al registrar pago');
        }

        // Éxito - simplemente recargar y cerrar el formulario
        resetForm();
        setShowForm(false);
        loadPayments(); // Recargar lista de pagos
      } catch (error: any) {
        setError(error.message || 'Error al procesar el pago');
      } finally {
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      setFormData({
        client_info_id: '',
        plan_id: '',
        amount: 0,
        payment_method: 'cash',
        payment_date: toLocalDateString(new Date()),
        period_start: toLocalDateString(new Date()),
        period_end: '',
        notes: '',
      });
      setSelectedClient(null);
      setSelectedPlan(null);
      setClientSearchTerm('');
      setError('');
      setHasActiveMembership(false);
      setCheckingMembership(false);
      setExpiredMembershipToPay(null);
      setIsAdvancePayment(false);
      setUrlParamsProcessed(false);
      setDiscountPercent(0);
      setAmountFieldFocused(false);
    };

    const filteredClients = clients.filter((client) => {
      const searchLower = clientSearchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        client.document_id.toLowerCase().includes(searchLower) ||
        client.whatsapp.toLowerCase().includes(searchLower)
      );
    });

    // Exponer función para abrir el modal desde el padre
    useImperativeHandle(ref, () => ({
      openCreateModal: (clientId?: string, planId?: string) => {
        resetForm();

        // Si se proporciona clientId, prellenar el cliente
        if (clientId) {
          const client = clients.find((c) => c.id === clientId);
          if (client) {
            setSelectedClient(client);
            setFormData((prev) => ({
              ...prev,
              client_info_id: clientId,
            }));
          }
        }

        // Si se proporciona planId, prellenar el plan
        if (planId) {
          const plan = plans.find((p) => p.id === planId);
          if (plan) {
            setSelectedPlan(plan);
            const startDate = new Date();
            const durationDays = plan.duration_days ?? 30;
            const periodEndStr = membershipEndDateFromStart(startDate, durationDays);

            setFormData((prev) => ({
              ...prev,
              plan_id: planId,
              amount: plan.price,
              period_start: toLocalDateString(startDate),
              period_end: periodEndStr,
            }));
          }
        }

        setShowForm(true);
      },
      refresh: () => {
        loadPayments();
        loadData();
      },
    }));

    // Ordenar pagos de más reciente a más antiguo
    const sortedPayments = [...payments].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Filtrar pagos por búsqueda y plan
    const totalPayments = sortedPayments.length;
    const filteredPayments = sortedPayments
      .map((payment, index) => ({
        payment,
        // Calcular índice inverso: el más reciente (índice 0) tiene el número más alto
        originalIndex: totalPayments - index - 1,
      }))
      .filter(({ payment, originalIndex }) => {
        // Filtro por estado (anulados / vigentes)
        if (statusFilter === 'voided' && payment.status !== 'voided')
          return false;
        if (statusFilter === 'active' && payment.status === 'voided')
          return false;

        // Filtro por plan
        if (
          selectedPlanFilter !== 'all' &&
          payment.plan_id !== selectedPlanFilter
        ) {
          return false;
        }

        // Búsqueda por ID de factura, nombre o cédula
        if (paymentSearchTerm) {
          const searchLower = paymentSearchTerm.toLowerCase();
          const invoiceId = payment.invoice_number
            ? `#${payment.invoice_number.padStart(3, '0')}`.toLowerCase()
            : '';
          const clientName = payment.client_info?.name?.toLowerCase() || '';
          const clientDocument =
            payment.client_info?.document_id?.toLowerCase() || '';

          return (
            invoiceId.includes(searchLower) ||
            clientName.includes(searchLower) ||
            clientDocument.includes(searchLower)
          );
        }

        return true;
      });

    // Calcular paginación
    const totalFilteredPayments = filteredPayments.length;
    const totalPages = Math.ceil(totalFilteredPayments / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Resetear a página 1 cuando cambian los filtros
    useEffect(() => {
      setCurrentPage(1);
    }, [paymentSearchTerm, selectedPlanFilter, statusFilter]);

    const handleDownloadInvoice = async (payment: GymPayment) => {
      // Crear un elemento temporal para renderizar la factura
      const invoiceDiv = document.createElement('div');
      invoiceDiv.style.width = '800px';
      invoiceDiv.style.padding = '40px';
      invoiceDiv.style.backgroundColor = '#ffffff';
      invoiceDiv.style.fontFamily = 'Arial, sans-serif';
      invoiceDiv.style.color = '#333';
      invoiceDiv.style.position = 'absolute';
      invoiceDiv.style.left = '-9999px';
      invoiceDiv.style.top = '0';

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
      const methodLabel =
        payment.payment_method === 'cash'
          ? 'Efectivo'
          : payment.payment_method === 'transfer'
            ? 'Transferencia'
            : 'Mixto';

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
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Cr 54 A #25-26, Los Alpes</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">3005009487 · info@rogerbox.com</div>
        </div>
        <div style="flex: 1; min-width: 220px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Cliente</div>
          <div style="font-size: 14px; color: #164151; font-weight: 600;">${payment.client_info?.name || '—'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Doc. ${payment.client_info?.document_id || '—'}</div>
          ${payment.client_info?.whatsapp ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${payment.client_info.whatsapp}</div>` : ''}
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
            <td style="padding: 14px 20px; color: #0f172a;">${methodLabel}</td>
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

      <div style="margin-top: 28px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          <strong style="color: #164151;">Válido como comprobante de pago.</strong><br>
          Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">RogerBox · www.rogerbox.co</p>
      </div>
    `;

      document.body.appendChild(invoiceDiv);

      try {
        // Convertir el HTML a canvas
        const canvas = await html2canvas(invoiceDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        // Crear PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;

        pdf.addImage(
          imgData,
          'PNG',
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio,
        );

        // Descargar el PDF
        const fileName = `factura-${payment.invoice_number || payment.id.substring(0, 8)}-${payment.payment_date}.pdf`;
        pdf.save(fileName);
      } catch (error) {
        alert('Error al generar la factura. Por favor, intenta nuevamente.');
      } finally {
        // Limpiar el elemento temporal
        document.body.removeChild(invoiceDiv);
      }
    };

    const handleSendReceiptWhatsApp = (payment: GymPayment) => {
      const whatsapp = (payment.client_info?.whatsapp || '').replace(/\D/g, '');
      if (!whatsapp) {
        alert('Este cliente no tiene número de WhatsApp registrado.');
        return;
      }
      const phone = whatsapp.length === 10 ? `57${whatsapp}` : whatsapp;
      const name = payment.client_info?.name || 'Cliente';
      const plan = payment.plan?.name || 'Plan';
      const periodStart = formatDateOnlyLocal(payment.period_start, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const periodEnd = formatDateOnlyLocal(payment.period_end, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const paymentDate = formatDateOnlyLocal(payment.payment_date, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const amount = payment.amount.toLocaleString('es-CO');
      const message = `Hola ${name}, aquí está tu comprobante de pago de RogerBox:\n\n*Plan:* ${plan}\n*Período:* ${periodStart} - ${periodEnd}\n*Fecha de pago:* ${paymentDate}\n*Monto:* $${amount} COP\n\nGracias por tu pago. RogerBox · www.rogerbox.co`;
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        '_blank',
      );
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-20">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/50 dark:bg-black/70 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
              <div className="my-4 sm:my-6 w-full max-w-4xl flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
              <div className="shrink-0 px-5 py-4 sm:px-6 border-b border-gray-200/90 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#164151] dark:text-white/95">
                  Registrar Pago
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="px-5 py-5 sm:px-6 sm:pb-6 space-y-5 sm:space-y-6"
              >
                {error && (
                  <div className="p-2.5 sm:p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Mensaje de pago anticipado */}
                {isAdvancePayment && !error && (
                  <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-slate-600 dark:text-white/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#164151]/90 dark:text-white/80">
                          Pago anticipado
                        </p>
                        <p className="text-xs text-[#164151]/70 dark:text-white/55 mt-0.5 leading-relaxed">
                          Este cliente tiene un plan activo. El nuevo plan
                          iniciará el{' '}
                          <strong>
                            {formatDateOnlyLocal(formData.period_start, {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                          . Puedes ajustar la fecha abajo si lo necesitas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selección de Cliente */}
                <div>
                  <label className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2">
                    Cliente *
                  </label>
                  {selectedClient ? (
                    <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/90 dark:border-white/[0.08] rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GymSeededAvatar
                          seed={selectedClient.id}
                          size={40}
                          className="shrink-0 rounded-full ring-1 ring-gray-200/80 dark:ring-white/10"
                          alt=""
                        />
                        <div>
                          <p className="text-sm font-medium text-[#164151] dark:text-white truncate">
                            {selectedClient.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-white/60 truncate">
                            {selectedClient.document_id} •{' '}
                            {selectedClient.whatsapp}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient(null);
                          setFormData({ ...formData, client_info_id: '' });
                        }}
                        className="text-xs text-gray-500 hover:text-[#164151] dark:hover:text-white"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        placeholder="Buscar cliente por nombre, cédula o WhatsApp..."
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 transition-all"
                      />
                      {clientSearchTerm && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 max-h-[280px] overflow-y-auto scrollbar-hide rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg">
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleClientSelect(client)}
                              className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 flex items-center gap-2.5"
                            >
                              <GymSeededAvatar
                                seed={client.id}
                                size={32}
                                className="shrink-0 rounded-full ring-1 ring-gray-200/80 dark:ring-white/10"
                                alt=""
                              />
                              <div className="min-w-0">
                              <p className="text-sm font-medium text-[#164151] dark:text-white truncate">
                                {client.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-white/60 truncate">
                                {client.document_id} • {client.whatsapp}
                              </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selección de Plan */}
                <div>
                  <label className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2">
                    Plan *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handlePlanSelect(plan)}
                        className={`group rounded-xl border text-left transition-all duration-200 p-3.5 sm:p-4 ${
                          selectedPlan?.id === plan.id
                            ? 'border-[#85ea10]/30 dark:border-[#85ea10]/20 bg-[#85ea10]/5 dark:bg-[#85ea10]/5 ring-1 ring-inset ring-[#85ea10]/10 dark:ring-[#85ea10]/8'
                            : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent hover:border-gray-300 dark:hover:border-white/[0.14] hover:bg-gray-50/80 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-0.5">
                          <h4 className="text-sm font-medium text-[#164151] dark:text-white/95 leading-snug">
                            {plan.name}
                          </h4>
                          {selectedPlan?.id === plan.id && (
                            <CheckCircle className="w-4 h-4 shrink-0 text-[#85ea10]/70 dark:text-[#85ea10]/55" />
                          )}
                        </div>
                        {plan.description ? (
                          <p className="text-[11px] text-gray-500 dark:text-white/60 line-clamp-1 mb-1">
                            {plan.description}
                          </p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-sm font-bold text-[#164151] dark:text-white">
                            ${plan.price.toLocaleString('es-CO')}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-white/60 whitespace-nowrap">
                            {plan.duration_days} días
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Información del Pago */}
                {selectedPlan && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      <div className="min-w-0">
                        <label
                          htmlFor="gym-amount-cop"
                          className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2"
                        >
                          Monto (COP) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#164151]/70 dark:text-white/50 font-medium text-sm">
                            $
                          </span>
                          <input
                            id="gym-amount-cop"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            required
                            value={
                              amountFieldFocused
                                ? formData.amount === 0
                                  ? ''
                                  : String(formData.amount)
                                : formData.amount === 0
                                  ? ''
                                  : formatCopThousands(formData.amount)
                            }
                            onFocus={() => setAmountFieldFocused(true)}
                            onBlur={() => setAmountFieldFocused(false)}
                            onChange={(e) => {
                              const amount = parseDigitsToAmount(e.target.value);
                              setFormData({
                                ...formData,
                                amount,
                              });
                            }}
                            className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[#164151] dark:text-white tabular-nums placeholder-gray-400 dark:placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 transition-all"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2">
                          Desc. (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          step={1}
                          value={discountPercent === 0 ? '' : discountPercent}
                          onChange={(e) => {
                            const v =
                              e.target.value === ''
                                ? 0
                                : parseInt(e.target.value, 10);
                            setDiscountPercent(
                              isNaN(v) ? 0 : Math.min(99, Math.max(0, v)),
                            );
                          }}
                          placeholder="0"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 transition-all"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2">
                          Método de pago *
                        </label>
                        <select
                          required
                          value={formData.payment_method}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              payment_method: e.target.value as PaymentMethod,
                            })
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[#164151] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 transition-all"
                        >
                          <option value="cash">Efectivo</option>
                          <option value="transfer">Transferencia</option>
                          <option value="mixed">Mixto</option>
                        </select>
                      </div>
                    </div>

                    {discountPercent > 0 && (
                      <div className="p-3 sm:p-3.5 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200/80 dark:border-white/[0.08]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[#164151]/80 dark:text-white/70">
                            Total ({discountPercent}% dto.)
                          </span>
                          <span className="text-sm font-semibold text-[#164151] dark:text-white/90 tabular-nums">
                            $
                            {Math.round(
                              formData.amount * (1 - discountPercent / 100),
                            ).toLocaleString('es-CO')}{' '}
                            COP
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Fechas (calendario RogerBox, sin picker nativo) */}
                {selectedPlan && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="min-w-0">
                      <label
                        htmlFor="gym-payment-date"
                        className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2"
                      >
                        Fecha de pago *
                      </label>
                      <DatePickerField
                        id="gym-payment-date"
                        value={formData.payment_date}
                        onChange={(iso) =>
                          setFormData({ ...formData, payment_date: iso })
                        }
                        aria-label="Fecha de pago"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="gym-period-start"
                        className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2 leading-snug"
                      >
                        Inicio período *
                        {isAdvancePayment && (
                          <span className="block sm:inline sm:ml-1 text-[10px] font-normal text-slate-500 dark:text-white/45">
                            (editable)
                          </span>
                        )}
                      </label>
                      <DatePickerField
                        id="gym-period-start"
                        value={formData.period_start}
                        onChange={(iso) => {
                          const startDate = parseLocalDate(iso);
                          if (selectedPlan) {
                            const durationDays =
                              selectedPlan.duration_days ?? 30;
                            const periodEndStr = membershipEndDateFromStart(
                              startDate,
                              durationDays,
                            );
                            setFormData({
                              ...formData,
                              period_start: iso,
                              period_end: periodEndStr,
                            });
                          } else {
                            setFormData({
                              ...formData,
                              period_start: iso,
                            });
                          }
                        }}
                        triggerClassName={
                          isAdvancePayment
                            ? 'border-slate-200/90 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/15'
                            : ''
                        }
                        aria-label="Inicio del período"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="gym-period-end"
                        className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2 leading-snug"
                      >
                        Fin período *
                        {isAdvancePayment && (
                          <span className="block sm:inline sm:ml-1 text-[10px] font-normal text-slate-500 dark:text-white/45">
                            (auto)
                          </span>
                        )}
                      </label>
                      <DatePickerField
                        id="gym-period-end"
                        value={formData.period_end}
                        readOnly
                        readOnlyInnerClassName={
                          isAdvancePayment
                            ? 'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border cursor-not-allowed border-slate-200/90 dark:border-white/[0.1] bg-slate-100/80 dark:bg-white/[0.05] text-[#164151] dark:text-white/90'
                            : 'w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border cursor-not-allowed border-gray-200 dark:border-white/[0.08] bg-gray-100/90 dark:bg-white/[0.06] text-[#164151] dark:text-white/90'
                        }
                        aria-label="Fin del período (calculado)"
                      />
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-xs font-medium tracking-wide text-[#164151]/80 dark:text-white/70 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[#85ea10]/25 focus:border-[#85ea10]/35 resize-none transition-all"
                    rows={2}
                    placeholder="Opcional…"
                  />
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-3 pt-5 mt-1 border-t border-gray-200/90 dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.1] bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04] text-[#164151]/90 dark:text-white/85 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedClient ||
                      !selectedPlan ||
                      hasActiveMembership ||
                      checkingMembership
                    }
                    className="px-5 py-2.5 text-sm rounded-xl bg-[#164151] dark:bg-white text-white dark:text-gray-900 hover:bg-[#0f303d] dark:hover:bg-white/95 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting
                      ? 'Registrando...'
                      : checkingMembership
                        ? 'Verificando...'
                        : 'Registrar Pago'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Buscador y Filtros */}
          {payments.length > 0 && (
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Buscador */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={paymentSearchTerm}
                    onChange={(e) => setPaymentSearchTerm(e.target.value)}
                    placeholder="Buscar por factura, nombre o cédula..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-[11px] sm:text-sm"
                  />
                </div>

                {/* Filtro por Plan */}
                <div className="sm:w-64 relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedPlanFilter}
                    onChange={(e) => setSelectedPlanFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-[11px] sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los planes</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por estado (anulados / vigentes) */}
                <div className="sm:w-52 relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as 'all' | 'active' | 'voided',
                      )
                    }
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-[11px] sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los pagos</option>
                    <option value="active">Vigentes</option>
                    <option value="voided">Anulados</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Pagos */}
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
              <p className="text-[#164151] dark:text-white font-medium mb-2 text-lg">
                No hay pagos registrados
              </p>
              <p className="text-sm text-[#164151]/60 dark:text-white/60 mb-6">
                Registra el primer pago para comenzar
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        ID Factura
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Fecha de Pago
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                        Factura
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {totalFilteredPayments === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <p className="text-sm text-[#164151]/60 dark:text-white/60">
                            No se encontraron pagos con los filtros aplicados
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedPayments.map(({ payment, originalIndex }) => (
                        <tr
                          key={payment.id}
                          onClick={() =>
                            router.push(`/admin/payments/${payment.id}`)
                          }
                          className={`transition-colors cursor-pointer ${
                            payment.status === 'voided'
                              ? 'bg-red-50/60 dark:bg-red-500/5'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <p className="text-sm font-semibold text-[#164151] dark:text-white">
                              {payment.invoice_number
                                ? `#${payment.invoice_number.padStart(3, '0')}`
                                : `#${(originalIndex + 1).toString().padStart(3, '0')}`}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <div>
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                {payment.client_info?.name || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-[#164151]/60 dark:text-white/50">
                                {payment.client_info?.document_id || '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <p className="text-xs font-medium text-[#164151] dark:text-white">
                              {payment.plan?.name || 'Plan'}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <p className="text-sm font-semibold text-[#164151] dark:text-white">
                              ${payment.amount.toLocaleString('es-CO')}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80">
                              {payment.payment_method === 'cash'
                                ? 'Efectivo'
                                : payment.payment_method === 'transfer'
                                  ? 'Transferencia'
                                  : 'Mixto'}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <p className="text-xs text-[#164151] dark:text-white">
                              {formatDateOnlyLocal(payment.payment_date, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <p className="text-xs text-[#164151] dark:text-white">
                              {formatDateOnlyLocal(payment.period_start, {
                                day: '2-digit',
                                month: 'short',
                              })}{' '}
                              -{' '}
                              {formatDateOnlyLocal(payment.period_end, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </td>
                          <td className="px-3 md:px-4 py-3 md:py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendReceiptWhatsApp(payment);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                                title="Enviar comprobante por WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  WhatsApp
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadInvoice(payment);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#85ea10]/20 dark:bg-[#85ea10]/30 text-[#164151] dark:text-[#85ea10] hover:bg-[#85ea10]/30 dark:hover:bg-[#85ea10]/40 transition-colors"
                                title="Descargar factura"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {payment.invoice_number
                                    ? `Fact. ${payment.invoice_number.padStart(3, '0')}`
                                    : 'Factura'}
                                </span>
                              </button>
                              {payment.status === 'voided' && (
                                <span
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-white/50 flex-shrink-0"
                                  title="Anulada"
                                >
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Vista de móviles (Card view) */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                {totalFilteredPayments === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-[#164151]/60 dark:text-white/60">
                      No se encontraron pagos con los filtros aplicados
                    </p>
                  </div>
                ) : (
                  paginatedPayments.map(({ payment, originalIndex }) => (
                    <div
                      key={payment.id}
                      onClick={() =>
                        router.push(`/admin/payments/${payment.id}`)
                      }
                      className={`p-4 transition-colors cursor-pointer ${
                        payment.status === 'voided'
                          ? 'bg-red-50/70 dark:bg-red-500/5'
                          : 'bg-white dark:bg-gray-900 active:bg-gray-50 dark:active:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest block mb-1">
                            {payment.invoice_number
                              ? `Factura #${payment.invoice_number.padStart(3, '0')}`
                              : `Pago #${(originalIndex + 1).toString().padStart(3, '0')}`}
                          </span>
                          <h4 className="text-sm font-bold text-[#164151] dark:text-white">
                            {payment.client_info?.name || 'Sin nombre'}
                          </h4>
                          <p className="text-xs text-[#164151]/50 dark:text-white/40">
                            CC: {payment.client_info?.document_id || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#164151] dark:text-[#85ea10]">
                            ${payment.amount.toLocaleString('es-CO')}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[9px] font-bold text-gray-600 dark:text-white/60 uppercase">
                            {payment.payment_method === 'cash'
                              ? 'Efectivo'
                              : payment.payment_method === 'transfer'
                                ? 'Transf.'
                                : 'Mixto'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[#164151]/60 dark:text-white/40">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDateOnlyLocal(payment.payment_date, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#164151]/40 dark:text-white/20">
                            <CreditCard className="w-3 h-3" />
                            <span className="font-semibold">
                              {payment.plan?.name || 'Plan'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReceiptWhatsApp(payment);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-bold active:scale-95 transition-all"
                            title="Enviar por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(payment);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/30 text-[#164151] dark:text-[#85ea10] font-bold active:scale-95 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          {payment.status === 'voided' && (
                            <span
                              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-500 dark:text-white/50 flex-shrink-0"
                              title="Anulada"
                            >
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paginación */}
              {totalFilteredPayments > 0 && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500 dark:text-white/40">
                    Mostrando{' '}
                    <span className="text-[#164151] dark:text-white font-medium">
                      {startIndex + 1}
                    </span>{' '}
                    a{' '}
                    <span className="text-[#164151] dark:text-white font-medium">
                      {Math.min(endIndex, totalFilteredPayments)}
                    </span>{' '}
                    de{' '}
                    <span className="text-[#164151] dark:text-white font-medium">
                      {totalFilteredPayments}
                    </span>{' '}
                    pagos
                  </div>

                  <div className="flex items-center gap-2">
                    {/* First Page Button */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                      }`}
                      title="Primera página"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Previous Page Button */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                      }`}
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(
                          1,
                          currentPage - Math.floor(maxVisiblePages / 2),
                        );
                        const endPage = Math.min(
                          totalPages,
                          startPage + maxVisiblePages - 1,
                        );

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(
                            1,
                            endPage - maxVisiblePages + 1,
                          );
                        }

                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setCurrentPage(1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
                            >
                              1
                            </button>,
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span
                                key="ellipsis-start"
                                className="px-2 text-gray-400 dark:text-white/40"
                              >
                                ...
                              </span>,
                            );
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all text-sm cursor-pointer ${
                                currentPage === i
                                  ? 'bg-[#164151] text-white font-semibold'
                                  : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                              }`}
                            >
                              {i}
                            </button>,
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span
                                key="ellipsis-end"
                                className="px-2 text-gray-400 dark:text-white/40"
                              >
                                ...
                              </span>,
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
                            >
                              {totalPages}
                            </button>,
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        currentPage === totalPages || totalPages === 0
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                      }`}
                      title="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page Button */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        currentPage === totalPages || totalPages === 0
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                      }`}
                      title="Última página"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

GymPaymentsManagement.displayName = 'GymPaymentsManagement';

export default GymPaymentsManagement;
