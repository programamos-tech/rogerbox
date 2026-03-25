'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  CreditCard,
  DollarSign,
  Download,
  Dumbbell,
  FileText,
  Globe,
  Home,
  Image,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Settings,
  ShoppingCart,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import type { GymPayment } from '@/types/gym';

// Definición de las secciones del sidebar (mismo que en admin/page.tsx)
const menuSections = [
  {
    title: 'Principal',
    items: [
      {
        id: 'overview',
        label: 'Dashboard',
        icon: BarChart3,
        description: 'Resumen general',
      },
    ],
  },
  {
    title: 'Sede Física',
    items: [
      {
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        description: 'Gestiona usuarios y clientes físicos',
      },
      {
        id: 'gym-plans',
        label: 'Planes',
        icon: Dumbbell,
        description: 'Gestionar planes del gimnasio',
      },
      {
        id: 'gym-payments',
        label: 'Pagos',
        icon: CreditCard,
        description: 'Facturar planes a clientes físicos',
      },
    ],
  },
  {
    title: 'Sede en Línea',
    items: [
      {
        id: 'sales',
        label: 'Ventas',
        icon: ShoppingCart,
        description: 'Historial de compras',
      },
      {
        id: 'courses',
        label: 'Cursos',
        icon: BookOpen,
        description: 'Gestionar cursos',
      },
      {
        id: 'complements',
        label: 'Retos',
        icon: Play,
        description: 'Videos semanales',
      },
      {
        id: 'banners',
        label: 'Banners',
        icon: Image,
        description: 'Banners del dashboard',
      },
      {
        id: 'blogs',
        label: 'Blogs',
        icon: FileText,
        description: 'Artículos nutricionales',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        id: 'settings',
        label: 'Configuración',
        icon: Settings,
        description: 'Ajustes de la plataforma',
      },
    ],
  },
];

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, profile, loading: authLoading } = useSupabaseAuth();
  const [payment, setPayment] = useState<GymPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const paymentId = params?.id as string;

  // Encontrar el item activo (Pagos)
  const activeItem =
    menuSections
      .flatMap((section) => section.items)
      .find((item) => item.id === 'gym-payments') || menuSections[0].items[0];

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-white/60">
            Factura no encontrada
          </p>
          <button
            onClick={() => router.push('/admin?tab=gym-payments')}
            className="mt-4 px-4 py-2 bg-[#164151] text-white rounded-lg hover:bg-[#1a4d5f] transition-colors"
          >
            Volver a Pagos
          </button>
        </div>
      </div>
    );
  }

  const paymentMethodText = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mixed: 'Mixto',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex">
      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mismo que en admin/page.tsx */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10
        flex flex-col
        transition-all duration-300 ease-in-out
      `}
      >
        {/* Logo Header */}
        <div
          className={`
          h-16 flex items-center border-b border-gray-200 dark:border-white/10 px-4
          ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
        `}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-[#164151] dark:text-white font-black text-xl tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-widest font-semibold">
                  Admin Panel
                </span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-[#164151] dark:text-white font-bold text-sm">
                R
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-black text-[#164151]/60 dark:text-white/50 uppercase tracking-widest">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem.id === item.id;
                  // Indicador especial para Usuarios (incluye ambas sedes)
                  const isUsersItem = item.id === 'users';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'gym-payments') {
                          router.push('/admin?tab=gym-payments');
                        } else {
                          router.push(`/admin?tab=${item.id}`);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${
                          isActive
                            ? 'bg-[#85ea10]/20 dark:bg-[#85ea10]/20 text-[#164151] dark:text-white'
                            : 'text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left min-w-0 flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-tight truncate">
                            {item.label}
                          </span>
                          {isUsersItem && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#164151]/10 dark:bg-[#164151]/20 text-[#164151] dark:text-[#164151] font-medium">
                              Ambas
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div
          className={`
          border-t border-gray-200 dark:border-white/10 p-4
          ${sidebarCollapsed ? 'flex justify-center' : ''}
        `}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-[#164151]/70 dark:text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#164151] dark:text-white truncate">
                  {authUser?.user_metadata?.name || profile?.name || 'Admin'}
                </p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-white/50 truncate">
                  Admin
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors flex-shrink-0"
                title="Ir al Dashboard"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
              title="Ir al Dashboard"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151] dark:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#164151] dark:text-white">
                DETALLE DE FACTURA
              </h1>
              <p className="text-xs text-gray-500 dark:text-white/40">
                Factura #
                {payment.invoice_number ||
                  payment.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {payment.status === 'voided' ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold">
                <XCircle className="w-4 h-4" />
                Anulado
              </span>
            ) : (
              <button
                onClick={() => {
                  setVoidError('');
                  setVoidReason('');
                  setShowVoidModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" />
                Anular factura
              </button>
            )}
            <button
              onClick={() => router.push('/admin?tab=gym-payments')}
              className="px-4 py-2 rounded-lg bg-[#164151] dark:bg-white text-white dark:text-[#164151] hover:bg-[#1a4d5f] dark:hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Anulación — primero para verse sin scroll */}
            {payment.status === 'voided' && (
              <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-4">
                <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Factura anulada
                </h2>
                {payment.voided_reason && (
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <span className="font-medium">Motivo:</span>{' '}
                    {payment.voided_reason}
                  </p>
                )}
              </div>
            )}

            {/* Información de la Factura */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Información de la Factura
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Número de Factura
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      #
                      {payment.invoice_number ||
                        payment.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Fecha de Emisión
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {new Date(payment.created_at).toLocaleDateString(
                        'es-ES',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Fecha de Pago
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {formatDateOnlyLocal(payment.payment_date, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Monto
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      ${payment.amount.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Información del Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Nombre
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.client_info?.name || 'No especificado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Documento
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.client_info?.document_id || 'No especificado'}
                    </p>
                  </div>
                </div>
                {payment.client_info?.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40">
                        Email
                      </p>
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {payment.client_info.email}
                      </p>
                    </div>
                  </div>
                )}
                {payment.client_info?.whatsapp && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40">
                        WhatsApp
                      </p>
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {payment.client_info.whatsapp}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Pago */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Detalles del Pago
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Dumbbell className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Plan
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.plan?.name || 'No especificado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Método de Pago
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {paymentMethodText[payment.payment_method] ||
                        payment.payment_method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Período
                    </p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {formatDateOnlyLocal(payment.period_start, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {formatDateOnlyLocal(payment.period_end, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {payment.notes && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Notas
                </h2>
                <p className="text-sm text-[#164151] dark:text-white">
                  {payment.notes}
                </p>
              </div>
            )}
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
      </main>
    </div>
  );
}
