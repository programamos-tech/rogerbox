'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, User, DollarSign, Calendar, FileText, Search, X, Save, CheckCircle, Eye, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from 'lucide-react';
import { GymClientInfo, GymPlan, GymPayment, PaymentMethod } from '@/types/gym';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const GymPaymentsManagement = forwardRef<GymPaymentsManagementRef>((props, ref) => {
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
    payment_date: new Date().toISOString().split('T')[0],
    period_start: new Date().toISOString().split('T')[0],
    period_end: '',
    notes: '',
  });
  const [selectedClient, setSelectedClient] = useState<GymClientInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<GymPlan | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [expiredMembershipToPay, setExpiredMembershipToPay] = useState<any>(null);
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);

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
    if (typeof window !== 'undefined' && !loading && !loadingPayments && clients.length > 0 && plans.length > 0 && !urlParamsProcessed) {
      const params = new URLSearchParams(window.location.search);
      const clientId = params.get('clientId');
      const planId = params.get('planId');

      if (clientId || planId) {
        const client = clientId ? clients.find(c => c.id === clientId) : null;
        // Buscar el plan incluso si está inactivo (para planes vencidos)
        const plan = planId ? plans.find(p => p.id === planId) : null;

        // Debug: verificar si el plan se encontró
        if (planId && !plan) {
          console.log('🔍 Plan no encontrado:', {
            planIdBuscado: planId,
            planesDisponibles: plans.map(p => ({ id: p.id, name: p.name, is_active: p.is_active })),
            totalPlanes: plans.length
          });
        } else if (planId && plan) {
          console.log('✅ Plan encontrado:', { id: plan.id, name: plan.name });
        }

        // Solo procesar si encontramos al menos uno de los dos
        if (client || plan) {
          // Marcar como procesado primero para evitar múltiples ejecuciones
          setUrlParamsProcessed(true);

          // Primero establecer el cliente si existe
          if (client) {
            setSelectedClient(client);
            setFormData(prev => ({
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
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.duration_days);

            setFormData(prev => ({
              ...prev,
              plan_id: planId!,
              amount: plan.price,
              period_start: startDate.toISOString().split('T')[0],
              period_end: endDate.toISOString().split('T')[0],
            }));

            // Verificar membresía activa para este plan si hay cliente seleccionado
            if (client) {
              // Usar setTimeout para asegurar que el estado se actualice primero
              setTimeout(() => {
                checkActiveMembershipForPlan(client.id, plan.id);
              }, 300);
            }
          } else if (planId) {
            // Si el plan no se encontró, mostrar un error
            console.warn(`Plan con ID ${planId} no encontrado en la lista de planes disponibles. Planes disponibles:`, plans.map(p => ({ id: p.id, name: p.name })));
            setError(`El plan seleccionado no está disponible. Por favor, selecciona otro plan.`);
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

  useEffect(() => {
    if (selectedPlan) {
      const startDate = new Date(formData.period_start);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      setFormData(prev => ({
        ...prev,
        plan_id: selectedPlan.id,
        amount: selectedPlan.price,
        period_end: endDate.toISOString().split('T')[0],
      }));

      // Verificar si hay membresía activa para este plan específico
      if (selectedClient) {
        checkActiveMembershipForPlan(selectedClient.id, selectedPlan.id);
      }
    }
  }, [selectedPlan, formData.period_start, selectedClient]);

  const checkActiveMembershipForPlan = async (clientId: string, planId: string) => {
    setCheckingMembership(true);
    setError('');
    setHasActiveMembership(false);
    setExpiredMembershipToPay(null);
    setIsAdvancePayment(false);

    try {
      const membershipsRes = await fetch(
        `/api/admin/gym/memberships?client_info_id=${clientId}`
      );

      if (membershipsRes.ok) {
        const memberships = await membershipsRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar membresía activa SOLO para el MISMO plan que se está pagando
        const activeMembershipForThisPlan = memberships.find((m: any) => {
          const endDate = new Date(m.end_date);
          endDate.setHours(0, 0, 0, 0);
          return m.plan_id === planId && m.status !== 'cancelled' && endDate >= today;
        });

        // Si hay membresía activa para ESTE MISMO plan, es pago anticipado
        if (activeMembershipForThisPlan) {
          const latestEndDate = new Date(activeMembershipForThisPlan.end_date);
          latestEndDate.setHours(0, 0, 0, 0);
          
          // El nuevo plan empieza el día siguiente
          const newStartDate = new Date(latestEndDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          
          // Calcular fecha de fin basada en la duración del plan seleccionado
          const planDuration = selectedPlan?.duration_days || 30;
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newEndDate.getDate() + planDuration - 1);
          
          // Actualizar las fechas del formulario automáticamente
          setFormData(prev => ({
            ...prev,
            period_start: newStartDate.toISOString().split('T')[0],
            period_end: newEndDate.toISOString().split('T')[0],
          }));
          
          // Marcar como pago anticipado (permitido)
          setIsAdvancePayment(true);
          setHasActiveMembership(false);
          setError('');
        } else {
          // No hay membresía activa para ESTE plan, fechas normales (desde hoy)
          const planDuration = selectedPlan?.duration_days || 30;
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + planDuration - 1);
          
          setFormData(prev => ({
            ...prev,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
          }));
          
          setError('');
          setHasActiveMembership(false);
          setExpiredMembershipToPay(null);
          setIsAdvancePayment(false);
        }
      }
    } catch (error) {
      console.error('Error checking membership:', error);
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
      console.error('Error loading data:', error);
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
      setPayments(Array.isArray(data) ? data : (data.payments || []));
    } catch (error) {
      console.error('Error loading payments:', error);
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
        `/api/admin/gym/memberships?client_info_id=${formData.client_info_id}`
      );
      let membershipId: string;

      if (membershipsRes.ok) {
        const memberships = await membershipsRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar membresía vencida para este plan específico para reutilizarla
        const expiredMembershipForThisPlan = memberships.find(
          (m: any) => {
            const endDate = new Date(m.end_date);
            endDate.setHours(0, 0, 0, 0);
            return m.plan_id === formData.plan_id && m.status !== 'cancelled' && (m.status === 'expired' || endDate < today);
          }
        );

        if (expiredMembershipForThisPlan && !isAdvancePayment) {
          // Usar membresía vencida existente (se renovará con el nuevo pago)
          membershipId = expiredMembershipForThisPlan.id;
        } else {
          // Crear nueva membresía (pago anticipado o plan nuevo o plan diferente)
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

      // Registrar el pago
      const paymentRes = await fetch('/api/admin/gym/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membership_id: membershipId,
          client_info_id: formData.client_info_id,
          plan_id: formData.plan_id,
          amount: formData.amount,
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
      payment_date: new Date().toISOString().split('T')[0],
      period_start: new Date().toISOString().split('T')[0],
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
        const client = clients.find(c => c.id === clientId);
        if (client) {
          setSelectedClient(client);
          setFormData(prev => ({
            ...prev,
            client_info_id: clientId,
          }));
        }
      }

      // Si se proporciona planId, prellenar el plan
      if (planId) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setSelectedPlan(plan);
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + plan.duration_days);

          setFormData(prev => ({
            ...prev,
            plan_id: planId,
            amount: plan.price,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
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
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filtrar pagos por búsqueda y plan
  const totalPayments = sortedPayments.length;
  const filteredPayments = sortedPayments
    .map((payment, index) => ({
      payment,
      // Calcular índice inverso: el más reciente (índice 0) tiene el número más alto
      originalIndex: totalPayments - index - 1
    }))
    .filter(({ payment, originalIndex }) => {
      // Filtro por plan
      if (selectedPlanFilter !== 'all' && payment.plan_id !== selectedPlanFilter) {
        return false;
      }

      // Búsqueda por ID de factura, nombre o cédula
      if (paymentSearchTerm) {
        const searchLower = paymentSearchTerm.toLowerCase();
        const invoiceId = payment.invoice_number ? `#${payment.invoice_number.padStart(3, '0')}`.toLowerCase() : '';
        const clientName = payment.client_info?.name?.toLowerCase() || '';
        const clientDocument = payment.client_info?.document_id?.toLowerCase() || '';

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
  }, [paymentSearchTerm, selectedPlanFilter]);

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

    invoiceDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #85ea10; padding-bottom: 20px;">
        <div style="font-size: 36px; font-weight: 900; color: #000; font-family: 'Arial Black', Arial, sans-serif; letter-spacing: 0px; text-transform: uppercase;">
          ROGER<span style="color: #85ea10;">BOX</span>
        </div>
        <div style="font-size: 24px; font-weight: bold; color: #85ea10; margin-top: 20px;">FACTURA</div>
        <div style="font-size: 18px; color: #666; margin-top: 10px;">
          ${payment.invoice_number ? `Factura No. ${payment.invoice_number}` : `Pago No. ${payment.id.substring(0, 8).toUpperCase()}`}
        </div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #85ea10;">
        <h3 style="margin: 0 0 15px 0; color: #000; font-size: 18px;">Información del Emisor</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Razón Social:</strong> ROGERBOX</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>NIT:</strong> 1102819763-9</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Dirección:</strong> Cr 54 A #25-26, Edificio Mont Cervino, Local 1, Los Alpes</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Teléfono/WhatsApp:</strong> 3005009487</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Email:</strong> info@rogerbox.com</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #000; font-size: 18px;">Información del Cliente</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Nombre:</strong> ${payment.client_info?.name || 'No especificado'}</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Documento:</strong> ${payment.client_info?.document_id || 'No especificado'}</p>
        ${payment.client_info?.email ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${payment.client_info.email}</p>` : ''}
        ${payment.client_info?.whatsapp ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>WhatsApp:</strong> ${payment.client_info.whatsapp}</p>` : ''}
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 12px; margin: 30px 0;">
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #666;">Plan:</span>
          <span style="color: #000; text-align: right; max-width: 60%;">${payment.plan?.name || 'Plan'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #666;">Descripción:</span>
          <span style="color: #000; text-align: right; max-width: 60%;">${payment.plan?.description || 'Membresía de gimnasio'}</span>
        </div>
        <div style="background: #e5f7ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <strong>Período Facturado:</strong><br>
          Del ${new Date(payment.period_start).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })} al ${new Date(payment.period_end).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #666;">Fecha de Pago:</span>
          <span style="color: #000; text-align: right; max-width: 60%;">${new Date(payment.payment_date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600; color: #666;">Método de Pago:</span>
          <span style="color: #000; text-align: right; max-width: 60%;">${payment.payment_method === 'cash'
        ? 'Efectivo'
        : payment.payment_method === 'transfer'
          ? 'Transferencia'
          : 'Mixto'
      }</span>
        </div>
        ${payment.notes ? `
        <div style="display: flex; justify-content: space-between; padding: 12px 0;">
          <span style="font-weight: 600; color: #666;">Notas:</span>
          <span style="color: #000; text-align: right; max-width: 60%;">${payment.notes}</span>
        </div>
        ` : ''}
      </div>

      <div style="background: #85ea10; color: #000; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">TOTAL A PAGAR</div>
        <div style="font-size: 32px; font-weight: 900;">$${payment.amount.toLocaleString('es-CO')} COP</div>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
        <p><strong>Esta factura es válida como comprobante de pago</strong></p>
        <p>Factura generada el ${new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
        <p style="margin-top: 15px;">RogerBox - Entrenamientos HIIT profesionales</p>
        <p>www.rogerbox.com</p>
        <p style="margin-top: 10px; font-size: 11px; color: #999;">
          Para consultas o reclamos, contacta a nuestro equipo de soporte
        </p>
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

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Descargar el PDF
      const fileName = `factura-${payment.invoice_number || payment.id.substring(0, 8)}-${new Date(payment.payment_date).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar la factura. Por favor, intenta nuevamente.');
    } finally {
      // Limpiar el elemento temporal
      document.body.removeChild(invoiceDiv);
    }
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#164151] dark:text-white">Registrar Pago</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Mensaje de pago anticipado */}
              {isAdvancePayment && !error && (
                <div className="p-4 bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">Pago Anticipado</p>
                      <p className="text-sm text-cyan-600 dark:text-cyan-300 mt-1">
                        Este cliente tiene un plan activo. El nuevo plan iniciará automáticamente el{' '}
                        <strong>{new Date(formData.period_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de Cliente */}
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                  Cliente *
                </label>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-[#164151] dark:text-white">{selectedClient.name}</p>
                        <p className="text-xs text-gray-500 dark:text-white/60">
                          {selectedClient.document_id} • {selectedClient.whatsapp}
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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      placeholder="Buscar cliente por nombre, cédula o WhatsApp..."
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                    />
                    {clientSearchTerm && filteredClients.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleClientSelect(client)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                          >
                            <p className="text-sm font-medium text-[#164151] dark:text-white">{client.name}</p>
                            <p className="text-xs text-gray-500 dark:text-white/60">
                              {client.document_id} • {client.whatsapp}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selección de Plan */}
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                  Plan *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${selectedPlan?.id === plan.id
                        ? 'border-[#85ea10] bg-[#85ea10]/10 dark:bg-[#85ea10]/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[#164151] dark:text-white">{plan.name}</h4>
                        {selectedPlan?.id === plan.id && (
                          <CheckCircle className="w-5 h-5 text-[#85ea10]" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/60 mb-2">
                        {plan.description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#164151] dark:text-white">
                          ${plan.price.toLocaleString('es-CO')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-white/60">
                          {plan.duration_days} días
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Información del Pago */}
              {selectedPlan && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                      Monto (COP) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#164151] dark:text-white font-medium text-base">
                        $
                      </span>
                      <input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                      Método de Pago *
                    </label>
                    <select
                      required
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="mixed">Mixto</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Fechas */}
              {selectedPlan && (
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                      Fecha de Pago *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        required
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                      Inicio del Período *
                      {isAdvancePayment && (
                        <span className="ml-2 text-xs font-normal text-cyan-600 dark:text-cyan-400">(automático)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isAdvancePayment ? 'text-cyan-500' : 'text-gray-400'}`} />
                      <input
                        type="date"
                        required
                        value={formData.period_start}
                        readOnly={isAdvancePayment}
                        onChange={(e) => {
                          if (isAdvancePayment) return; // No permitir cambio manual en pago anticipado
                          const startDate = new Date(e.target.value);
                          const endDate = new Date(startDate);
                          if (selectedPlan) {
                            endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
                            setFormData({
                              ...formData,
                              period_start: e.target.value,
                              period_end: endDate.toISOString().split('T')[0],
                            });
                          } else {
                            setFormData({ ...formData, period_start: e.target.value });
                          }
                        }}
                        className={`w-full pl-12 pr-5 py-3.5 border rounded-xl text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all text-base ${
                          isAdvancePayment 
                            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 cursor-not-allowed' 
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                      Fin del Período *
                      {isAdvancePayment && (
                        <span className="ml-2 text-xs font-normal text-cyan-600 dark:text-cyan-400">(automático)</span>
                      )}
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${isAdvancePayment ? 'text-cyan-500' : 'text-gray-400'}`} />
                      <input
                        type="date"
                        required
                        value={formData.period_end}
                        readOnly
                        className={`w-full pl-12 pr-5 py-3.5 border rounded-xl text-[#164151] dark:text-white text-base cursor-not-allowed ${
                          isAdvancePayment 
                            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30' 
                            : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-[#164151] dark:text-white mb-3">
                  Notas
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 resize-none transition-all text-base"
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedClient || !selectedPlan || hasActiveMembership || checkingMembership}
                  className="px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Registrando...' : checkingMembership ? 'Verificando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
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
            <p className="text-[#164151] dark:text-white font-medium mb-2 text-lg">No hay pagos registrados</p>
            <p className="text-sm text-[#164151]/60 dark:text-white/60 mb-6">
              Registra el primer pago para comenzar
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      ID Factura
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Fecha de Pago
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
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
                        onClick={() => router.push(`/admin/payments/${payment.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-[#164151] dark:text-white">
                            {payment.invoice_number ? `#${payment.invoice_number.padStart(3, '0')}` : `#${(originalIndex + 1).toString().padStart(3, '0')}`}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-[#164151] dark:text-white">
                              {payment.client_info?.name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-[#164151]/60 dark:text-white/50">
                              {payment.client_info?.document_id || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-[#164151] dark:text-white">
                            {payment.plan?.name || 'Plan'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-[#164151] dark:text-white">
                            ${payment.amount.toLocaleString('es-CO')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80">
                            {payment.payment_method === 'cash'
                              ? 'Efectivo'
                              : payment.payment_method === 'transfer'
                                ? 'Transferencia'
                                : 'Mixto'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#164151] dark:text-white">
                            {new Date(payment.payment_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#164151] dark:text-white">
                            {new Date(payment.period_start).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                            })}{' '}
                            -{' '}
                            {new Date(payment.period_end).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(payment);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#85ea10]/20 dark:bg-[#85ea10]/30 text-[#164151] dark:text-[#85ea10] hover:bg-[#85ea10]/30 dark:hover:bg-[#85ea10]/40 transition-colors"
                            title="Descargar factura"
                          >
                            <Download className="w-3 h-3" />
                            {payment.invoice_number ? `Fact. ${payment.invoice_number.padStart(3, '0')}` : 'Factura'}
                          </button>
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
                    onClick={() => router.push(`/admin/payments/${payment.id}`)}
                    className="p-4 bg-white dark:bg-gray-900 active:bg-gray-50 dark:active:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest block mb-1">
                          {payment.invoice_number ? `Factura #${payment.invoice_number.padStart(3, '0')}` : `Pago #${(originalIndex + 1).toString().padStart(3, '0')}`}
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
                          {payment.payment_method === 'cash' ? 'Efectivo' : payment.payment_method === 'transfer' ? 'Transf.' : 'Mixto'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[#164151]/60 dark:text-white/40">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(payment.payment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#164151]/40 dark:text-white/20">
                          <CreditCard className="w-3 h-3" />
                          <span className="font-semibold">{payment.plan?.name || 'Plan'}</span>
                        </div>
                      </div>
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
                  <span className="text-[#164151] dark:text-white font-medium">{startIndex + 1}</span>{' '}
                  a{' '}
                  <span className="text-[#164151] dark:text-white font-medium">
                    {Math.min(endIndex, totalFilteredPayments)}
                  </span>{' '}
                  de <span className="text-[#164151] dark:text-white font-medium">{totalFilteredPayments}</span>{' '}
                  pagos
                </div>

                <div className="flex items-center gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${currentPage === 1
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                      }`}
                    title="Primera página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Previous Page Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${currentPage === 1
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
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span
                              key="ellipsis-start"
                              className="px-2 text-gray-400 dark:text-white/40"
                            >
                              ...
                            </span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all text-sm cursor-pointer ${currentPage === i
                              ? 'bg-[#164151] text-white font-semibold'
                              : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                              }`}
                          >
                            {i}
                          </button>
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
                            </span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Next Page Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${currentPage === totalPages || totalPages === 0
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
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${currentPage === totalPages || totalPages === 0
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
});

GymPaymentsManagement.displayName = 'GymPaymentsManagement';

export default GymPaymentsManagement;
