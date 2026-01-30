'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  ArrowLeft,
  CreditCard,
  User,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Bell,
  ChevronLeft,
  Home,
  Menu,
  Settings,
  ShoppingCart,
  Users,
  Dumbbell,
  AlertCircle,
  BookOpen,
  Play,
  Image,
  Globe,
} from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';
import { GymPayment } from '@/types/gym';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Definición de las secciones del sidebar (mismo que en admin/page.tsx)
const menuSections = [
  {
    title: 'Principal',
    items: [{ id: 'overview', label: 'Dashboard', icon: BarChart3, description: 'Resumen general' }],
  },
  {
    title: 'Sede Física',
    items: [
      { id: 'users', label: 'Usuarios', icon: Users, description: 'Gestiona usuarios y clientes físicos' },
      { id: 'gym-plans', label: 'Planes', icon: Dumbbell, description: 'Gestionar planes del gimnasio' },
      { id: 'gym-payments', label: 'Pagos', icon: CreditCard, description: 'Facturar planes a clientes físicos' },

    ],
  },
  {
    title: 'Sede en Línea',
    items: [
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, description: 'Historial de compras' },
      { id: 'courses', label: 'Cursos', icon: BookOpen, description: 'Gestionar cursos' },
      { id: 'complements', label: 'Complementos', icon: Play, description: 'Videos semanales' },
      { id: 'banners', label: 'Banners', icon: Image, description: 'Banners del dashboard' },
      { id: 'blogs', label: 'Blogs', icon: FileText, description: 'Artículos nutricionales' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes de la plataforma' },
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

  const paymentId = params?.id as string;

  // Encontrar el item activo (Pagos)
  const activeItem = menuSections
    .flatMap((section) => section.items)
    .find((item) => item.id === 'gym-payments') || menuSections[0].items[0];

  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com';
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
      const response = await fetch(`/api/admin/gym/payments?payment_id=${paymentId}`);
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
        console.warn('Factura no encontrada');
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    } finally {
      setLoading(false);
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

    const paymentMethodText = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      mixed: 'Mixto',
    };

    invoiceDiv.innerHTML = `
      <div style="border: 2px solid #164151; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #164151; padding-bottom: 20px;">
          <h1 style="color: #164151; margin: 0; font-size: 28px; font-weight: bold;">FACTURA</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">RogerBox</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #164151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Información de la Factura</h2>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Número de Factura:</strong> #${payment.invoice_number || payment.id.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Fecha de Emisión:</strong> ${new Date(payment.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Fecha de Pago:</strong> ${new Date(payment.payment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #164151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Información del Cliente</h2>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Nombre:</strong> ${payment.client_info?.name || 'No especificado'}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Documento:</strong> ${payment.client_info?.document_id || 'No especificado'}</p>
          ${payment.client_info?.email ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${payment.client_info.email}</p>` : ''}
          ${payment.client_info?.whatsapp ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>WhatsApp:</strong> ${payment.client_info.whatsapp}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #164151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Detalles del Pago</h2>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Plan:</strong> ${payment.plan?.name || 'No especificado'}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Monto:</strong> $${payment.amount.toLocaleString('es-CO')}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Método de Pago:</strong> ${paymentMethodText[payment.payment_method] || payment.payment_method}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Período:</strong> ${new Date(payment.period_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} - ${new Date(payment.period_end).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        
        ${payment.notes ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #164151; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Notas</h2>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${payment.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #164151; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Gracias por su pago</p>
          <p style="color: #666; font-size: 12px; margin: 5px 0;">RogerBox - Sistema de Gestión</p>
        </div>
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

      const fileName = `factura-${payment.invoice_number || payment.id.substring(0, 8)}-${new Date(payment.payment_date).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
          <p className="text-lg text-gray-600 dark:text-white/60">Factura no encontrada</p>
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
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mismo que en admin/page.tsx */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
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
              <span className="text-[#164151] dark:text-white font-bold text-sm">R</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
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
                        ${isActive
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
                <p className="text-[10px] font-medium text-gray-500 dark:text-white/50 truncate">Admin</p>
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
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151] dark:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-[#164151] dark:text-white">DETALLE DE FACTURA</h1>
              <p className="text-xs text-gray-500 dark:text-white/40">Factura #{payment.invoice_number || payment.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin?tab=gym-payments')}
            className="px-4 py-2 rounded-lg bg-[#164151] dark:bg-white text-white dark:text-[#164151] hover:bg-[#1a4d5f] dark:hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Información de la Factura */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Información de la Factura
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Número de Factura</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      #{payment.invoice_number || payment.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Fecha de Emisión</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {new Date(payment.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Fecha de Pago</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {new Date(payment.payment_date).toLocaleDateString('es-ES', {
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
                    <p className="text-xs text-gray-500 dark:text-white/40">Monto</p>
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
                    <p className="text-xs text-gray-500 dark:text-white/40">Nombre</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.client_info?.name || 'No especificado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Documento</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.client_info?.document_id || 'No especificado'}
                    </p>
                  </div>
                </div>
                {payment.client_info?.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40">Email</p>
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
                      <p className="text-xs text-gray-500 dark:text-white/40">WhatsApp</p>
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
                    <p className="text-xs text-gray-500 dark:text-white/40">Plan</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {payment.plan?.name || 'No especificado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Método de Pago</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {paymentMethodText[payment.payment_method] || payment.payment_method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Período</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {new Date(payment.period_start).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(payment.period_end).toLocaleDateString('es-ES', {
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
                <p className="text-sm text-[#164151] dark:text-white">{payment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
