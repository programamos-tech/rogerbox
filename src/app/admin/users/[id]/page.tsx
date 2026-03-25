'use client';

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Dumbbell,
  Edit,
  FileText,
  Globe,
  Home,
  Image,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  Play,
  Ruler,
  Save,
  Scale,
  Settings,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
  User,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { UserDetailContent } from '@/shared/components/UserDetailContent';

// Función para traducir los goals a español (usado solo en menuSections / referencias locales)
const translateGoal = (goal: string): string => {
  const translations: Record<string, string> = {
    lose_weight: 'Bajar de peso',
    gain_muscle: 'Ganar músculo',
    improve_health: 'Mejorar salud',
    maintain_weight: 'Mantener peso',
    increase_endurance: 'Aumentar resistencia',
    flexibility: 'Flexibilidad',
    stress_relief: 'Reducir estrés',
    energy: 'Más energía',
    tone: 'Tonificar',
    endurance: 'Resistencia',
  };
  return translations[goal] || goal;
};

// Parsear fecha en hora local para no restar un día (UTC medianoche → día anterior en zonas como Colombia)
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const dateOnly = String(dateStr).slice(0, 10);
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
};

// Función para formatear múltiples goals
const formatGoals = (goals: string | string[] | null | undefined): string => {
  if (!goals) return 'No especificada';
  if (typeof goals === 'string') {
    try {
      const parsed = JSON.parse(goals);
      if (Array.isArray(parsed)) {
        return parsed.map(translateGoal).join(', ');
      }
    } catch {
      return translateGoal(goals);
    }
    return translateGoal(goals);
  }
  if (Array.isArray(goals)) {
    if (goals.length === 0) return 'No especificada';
    return goals.map(translateGoal).join(', ');
  }
  return 'No especificada';
};

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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, profile, loading: authLoading } = useSupabaseAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weightRecords, setWeightRecords] = useState<any[]>([]);
  const [loadingWeightRecords, setLoadingWeightRecords] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [cancellingMembershipId, setCancellingMembershipId] = useState<
    string | null
  >(null);
  const [showCancelMembershipModal, setShowCancelMembershipModal] =
    useState(false);
  const [membershipToCancel, setMembershipToCancel] = useState<any>(null);
  const [editingStartDateMembershipId, setEditingStartDateMembershipId] =
    useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [isUpdatingStartDate, setIsUpdatingStartDate] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userId = params?.id as string;

  // Encontrar el item activo (Usuarios)
  const activeItem =
    menuSections
      .flatMap((section) => section.items)
      .find((item) => item.id === 'users') || menuSections[0].items[0];

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
    if (userId && isAdmin) {
      loadUserData();
    }
  }, [authLoading, authUser, isAdmin, userId, router]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      // Timeout para no quedarse cargando si la API no responde (ej. Supabase lento)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`/api/admin/users/${userId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.user) {
        const user = data.user;
        setUserData(user);
        // Inicializar formulario de edición
        setEditForm({
          name: user.name || user.full_name || '',
          email: user.email || '',
          phone: user.phone || user.whatsapp || '',
          whatsapp: user.whatsapp || user.phone || '',
          document_id: user.document_id || '',
          document_type: user.document_type || 'CC',
          height: user.height || '',
          weight: user.weight || user.current_weight || '',
          current_weight: user.current_weight || user.weight || '',
          gender: user.gender || '',
          target_weight: user.target_weight || '',
          goals: Array.isArray(user.goals)
            ? user.goals
            : user.goals
              ? typeof user.goals === 'string'
                ? JSON.parse(user.goals)
                : user.goals
              : [],
          address: user.address || '',
          city: user.city || '',
          birth_date: user.birth_date || '',
          birth_year: user.birth_year || '',
          medical_restrictions: user.medical_restrictions || '',
        });

        // Activar modo edición si viene con query param edit=true
        if (searchParams.get('edit') === 'true') {
          setIsEditing(true);
        }

        // Cargar registros de peso si el usuario tiene user_id
        if (user.id && !user.isUnregisteredClient) {
          loadWeightRecords(user.id);
        }
      } else {
        setLoadError(data.error || 'Usuario no encontrado');
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setLoadError(
          'Tiempo de espera agotado. Comprueba la conexión o intenta de nuevo.',
        );
      } else {
        setLoadError('No se pudo cargar el usuario. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWeightRecords = async (userId: string) => {
    try {
      setLoadingWeightRecords(true);
      const { data, error } = await supabaseAdmin
        .from('weight_records')
        .select('weight, record_date, created_at, notes')
        .eq('user_id', userId)
        .order('record_date', { ascending: false })
        .limit(30);

      if (!error && data) {
        setWeightRecords(data);
      }
    } catch (error) {
    } finally {
      setLoadingWeightRecords(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }

      // Recargar datos
      await loadUserData();
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.message || 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      // Determinar si es un cliente de gym o un usuario registrado
      const endpoint =
        userData.isUnregisteredClient || userData.gym_client_id
          ? `/api/admin/gym/clients/${userData.gym_client_id || userData.id}`
          : `/api/admin/users/${userId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }

      // Redirigir al listado de usuarios
      router.push('/admin?tab=users');
    } catch (error: any) {
      setDeleteError(error.message || 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCancelMembershipModal = (membership: any) => {
    setMembershipToCancel(membership);
    setShowCancelMembershipModal(true);
  };

  const handleCancelMembership = async () => {
    if (!membershipToCancel) return;

    setCancellingMembershipId(membershipToCancel.id);

    try {
      const response = await fetch(
        `/api/admin/gym/memberships/${membershipToCancel.id}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar membresía');
      }

      // Cerrar modal y recargar datos
      setShowCancelMembershipModal(false);
      setMembershipToCancel(null);
      await loadUserData();
    } catch (error: any) {
      alert(error.message || 'Error al cancelar membresía');
    } finally {
      setCancellingMembershipId(null);
    }
  };

  const handleStartEditStartDate = (membership: any) => {
    setEditingStartDateMembershipId(membership.id);
    const d = parseLocalDate(membership.start_date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewStartDate(formattedDate);
  };

  const handleCancelEditStartDate = () => {
    setEditingStartDateMembershipId(null);
    setNewStartDate('');
  };

  const handleSaveStartDate = async (membershipId: string) => {
    if (!newStartDate) {
      alert('Por favor selecciona una fecha');
      return;
    }

    setIsUpdatingStartDate(true);

    try {
      const response = await fetch(
        `/api/admin/gym/memberships/${membershipId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_date: newStartDate,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar fecha de inicio');
      }

      // Recargar datos y cerrar edición
      await loadUserData();
      setEditingStartDateMembershipId(null);
      setNewStartDate('');
    } catch (error: any) {
      alert(error.message || 'Error al actualizar fecha de inicio');
    } finally {
      setIsUpdatingStartDate(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-white/50">
            Cargando cliente...
          </span>
        </div>
      </div>
    );
  }

  if (loadError && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-[#164151] dark:text-white mb-4">
            Error al cargar
          </h1>
          <p className="text-[#164151]/80 dark:text-gray-400 mb-6">
            {loadError}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setLoadError(null);
                loadUserData();
              }}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-6 py-2.5 rounded-lg transition-all"
            >
              Reintentar
            </button>
            <button
              onClick={() => router.push('/admin?tab=users')}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-6 py-2.5 rounded-lg transition-all"
            >
              Volver al Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#164151] dark:text-white mb-4">
            Cliente no encontrado
          </h1>
          <p className="text-[#164151]/80 dark:text-gray-400 mb-4">
            No se pudo cargar la información.
          </p>
          <button
            onClick={() => router.push('/admin?tab=users')}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-6 py-2.5 rounded-lg transition-all"
          >
            Volver al Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex">
      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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
                  const isActive = item.id === 'users'; // Siempre activo "Usuarios" en esta página
                  // Indicador especial para Usuarios (incluye ambas sedes)
                  const isUsersItem = item.id === 'users';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'users') {
                          router.push('/admin?tab=users');
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
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-semibold tracking-tight truncate">
                            {item.label}
                          </span>
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
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
              title="Ir al Dashboard"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-xl font-black text-[#164151] dark:text-white uppercase tracking-tight">
                {activeItem.label}
              </h1>
              <p className="text-xs text-[#164151]/80 dark:text-white/60 hidden sm:block font-medium">
                {activeItem.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push('/admin?tab=users')}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
              title="Volver a usuarios"
            >
              <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm font-medium">
                Volver a usuarios
              </span>
            </button>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError('');
                    loadUserData();
                  }}
                  className="p-2 sm:px-4 sm:py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
                  title="Cancelar"
                >
                  <X className="w-5 h-5 sm:hidden" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 sm:px-4 sm:py-2 rounded-lg bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isSaving ? 'Guardando...' : 'Guardar'}
                >
                  <Save className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 sm:px-4 sm:py-2 rounded-lg bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold transition-colors flex items-center gap-2"
                  title="Editar"
                >
                  <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 sm:px-4 sm:py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </>
            )}
          </div>
        </header>

        <UserDetailContent
          userData={userData}
          isSelf={false}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          handleSave={handleSave}
          saveError={saveError}
          loadUserData={loadUserData}
          weightRecords={weightRecords}
          loadingWeightRecords={loadingWeightRecords}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          handleDelete={handleDelete}
          deleteError={deleteError}
          setDeleteError={setDeleteError}
          isDeleting={isDeleting}
          showCancelMembershipModal={showCancelMembershipModal}
          setShowCancelMembershipModal={setShowCancelMembershipModal}
          membershipToCancel={membershipToCancel}
          setMembershipToCancel={setMembershipToCancel}
          handleCancelMembership={handleCancelMembership}
          cancellingMembershipId={cancellingMembershipId}
          openCancelMembershipModal={openCancelMembershipModal}
          editingStartDateMembershipId={editingStartDateMembershipId}
          setEditingStartDateMembershipId={setEditingStartDateMembershipId}
          newStartDate={newStartDate}
          setNewStartDate={setNewStartDate}
          handleStartEditStartDate={handleStartEditStartDate}
          handleCancelEditStartDate={handleCancelEditStartDate}
          handleSaveStartDate={handleSaveStartDate}
          isUpdatingStartDate={isUpdatingStartDate}
        />
      </main>
    </div>
  );
}
