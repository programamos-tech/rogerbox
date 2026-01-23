'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Scale,
  Ruler,
  Target,
  BookOpen,
  Dumbbell,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Edit,
  Save,
  FileText,
  BarChart3,
  Bell,
  ChevronLeft,
  Home,
  Image,
  Menu,
  Play,
  Settings,
  ShoppingCart,
  Users,
  Globe,
  MessageSquare,
} from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';

// Función para traducir los goals a español
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
    items: [{ id: 'overview', label: 'Dashboard', icon: BarChart3, description: 'Resumen general' }],
  },
  {
    title: 'Sede Física',
    items: [
      { id: 'users', label: 'Usuarios', icon: Users, description: 'Gestiona usuarios y clientes físicos' },
      { id: 'gym-plans', label: 'Planes', icon: Dumbbell, description: 'Gestionar planes del gimnasio' },
      { id: 'gym-payments', label: 'Pagos', icon: CreditCard, description: 'Facturar planes a clientes físicos' },
      { id: 'gym-collections', label: 'Cobranza', icon: AlertCircle, description: 'Cobranza y seguimiento' },
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

  const userId = params?.id as string;
  
  // Encontrar el item activo (Usuarios)
  const activeItem = menuSections
    .flatMap((section) => section.items)
    .find((item) => item.id === 'users') || menuSections[0].items[0];

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

    if (userId && isAdmin) {
      loadUserData();
    }
  }, [authLoading, authUser, isAdmin, userId, router]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }

      const foundUser = data.users?.find((u: any) => u.id === userId);
      if (foundUser) {
        setUserData(foundUser);
        // Inicializar formulario de edición con los datos actuales
        setEditForm({
          name: foundUser.name || foundUser.full_name || '',
          email: foundUser.email || '',
          phone: foundUser.phone || foundUser.whatsapp || '',
          whatsapp: foundUser.whatsapp || foundUser.phone || '',
          document_id: foundUser.document_id || '',
          document_type: foundUser.document_type || 'CC',
          height: foundUser.height || '',
          weight: foundUser.weight || foundUser.current_weight || '',
          current_weight: foundUser.current_weight || foundUser.weight || '',
          gender: foundUser.gender || '',
          target_weight: foundUser.target_weight || '',
          goals: Array.isArray(foundUser.goals) ? foundUser.goals : (foundUser.goals ? JSON.parse(foundUser.goals) : []),
          address: foundUser.address || '',
          city: foundUser.city || '',
          birth_date: foundUser.birth_date || '',
          birth_year: foundUser.birth_year || '',
          medical_restrictions: foundUser.medical_restrictions || '',
        });
        
        // Activar modo edición si viene con query param edit=true
        if (searchParams.get('edit') === 'true') {
          setIsEditing(true);
        }
      } else {
        // Si no se encuentra en la lista, intentar cargar directamente
        const directResponse = await fetch(`/api/admin/users/${userId}`);
        const directData = await directResponse.json();
        if (directResponse.ok && directData.user) {
          setUserData(directData.user);
        } else {
          console.warn('Usuario no encontrado');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return <QuickLoading message="Cargando información del cliente..." duration={1000} />;
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#164151] dark:text-white mb-4">Cliente no encontrado</h1>
          <p className="text-[#164151]/80 dark:text-gray-400 mb-4">No se pudo cargar la información del cliente.</p>
          <button
            onClick={() => router.push('/admin')}
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
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h1 className="text-xl font-black text-[#164151] dark:text-white uppercase tracking-tight">{activeItem.label}</h1>
              <p className="text-xs text-[#164151]/80 dark:text-white/60 hidden sm:block font-medium">
                {activeItem.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin?tab=users')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Volver</span>
            </button>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError('');
                    loadUserData();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Información Personal y Fitness */}
              <div className="lg:col-span-2 space-y-6">
                {/* Estado y Tipo */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Estado del Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Estado</p>
                  <div>
                    {(() => {
                      // Si tiene membresía vencida, mostrar "Renovar"
                      if (userData.hasGymMembership && !userData.hasActiveGymMembership) {
                        return (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                              <AlertCircle className="w-5 h-5" />
                              Renovar
                            </span>
                          </p>
                        );
                      }
                      
                      if (userData.hasActiveGymMembership || userData.hasOnlinePurchase) {
                        return (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]">
                              <CheckCircle className="w-5 h-5" />
                              Al día
                            </span>
                          </p>
                        );
                      }
                      
                      // Si no está registrado y no tiene membresías, mostrar "Nuevo cliente"
                      if (userData.isUnregisteredClient) {
                        return (
                          <p className="text-sm font-medium text-[#164151] dark:text-white">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                              <User className="w-5 h-5" />
                              Nuevo cliente
                            </span>
                          </p>
                        );
                      }
                      
                      // Cliente registrado pero sin compras
                      return (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                            <User className="w-5 h-5" />
                            Nuevo cliente
                          </span>
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Tipo de Cliente</p>
                  {userData.userType === 'both' && (
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                        Físico + Online
                      </span>
                    </p>
                  )}
                  {userData.userType === 'physical' && (
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                        <Dumbbell className="w-5 h-5" />
                        Físico
                      </span>
                    </p>
                  )}
                  {userData.userType === 'online' && (
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                        <Globe className="w-5 h-5" />
                        Online
                      </span>
                    </p>
                  )}
                  {userData.userType === 'none' && (
                    <p className="text-sm font-medium text-gray-400 dark:text-white/40">-</p>
                  )}
                </div>
              </div>
                </div>

                {/* Información Personal */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Información Personal
              </h2>
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Nombre completo</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                      />
                    ) : (
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.first_name && userData.last_name
                          ? `${userData.first_name} ${userData.last_name}`
                          : userData.name || userData.full_name || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                      />
                    ) : (
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.email || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Teléfono / WhatsApp</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone || editForm.whatsapp || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value, whatsapp: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                      />
                    ) : (
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.phone || userData.whatsapp || 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Documento</p>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <select
                          value={editForm.document_type || 'CC'}
                          onChange={(e) => setEditForm({ ...editForm, document_type: e.target.value })}
                          className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                        >
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="TI">TI</option>
                          <option value="PA">PA</option>
                        </select>
                        <input
                          type="text"
                          value={editForm.document_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, document_id: e.target.value })}
                          disabled={userData.isUnregisteredClient}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.document_id
                          ? `${userData.document_type || 'CC'}: ${userData.document_id}`
                          : 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <>
                    {userData.isUnregisteredClient && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Restricciones médicas</p>
                          <textarea
                            value={editForm.medical_restrictions || ''}
                            onChange={(e) => setEditForm({ ...editForm, medical_restrictions: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 resize-none"
                            placeholder="Restricciones médicas o historial clínico..."
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {userData.address && !isEditing && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40">Dirección</p>
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.address}
                        {userData.city ? `, ${userData.city}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Dirección</p>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Ciudad</p>
                        <input
                          type="text"
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {userData.birth_year && !isEditing && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/40">Año de nacimiento</p>
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.birth_year} ({new Date().getFullYear() - userData.birth_year} años)
                      </p>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Fecha de nacimiento</p>
                      <input
                        type="date"
                        value={editForm.birth_date || editForm.birth_year ? `${editForm.birth_year || new Date().getFullYear()}-01-01` : ''}
                        onChange={(e) => {
                          const year = e.target.value ? new Date(e.target.value).getFullYear() : '';
                          setEditForm({ ...editForm, birth_date: e.target.value, birth_year: year });
                        }}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/40">Fecha de registro</p>
                    <p className="text-sm font-medium text-[#164151] dark:text-white">
                      {new Date(userData.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
                </div>

                {/* Información Fitness */}
                {!userData.isUnregisteredClient && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Información Fitness
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Scale className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Peso actual</p>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.current_weight || editForm.weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, current_weight: e.target.value ? parseFloat(e.target.value) : '', weight: e.target.value ? parseFloat(e.target.value) : '' })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="kg"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.current_weight || userData.weight
                            ? `${userData.current_weight || userData.weight} kg`
                            : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Peso objetivo</p>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.target_weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, target_weight: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="kg"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.target_weight ? `${userData.target_weight} kg` : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <Ruler className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Altura</p>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.height || ''}
                          onChange={(e) => setEditForm({ ...editForm, height: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                          placeholder="cm"
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.height ? `${userData.height} cm` : 'No especificada'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Género</p>
                      {isEditing ? (
                        <select
                          value={editForm.gender || ''}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                        >
                          <option value="">Seleccionar</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                          <option value="other">Otro</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.gender === 'male'
                            ? 'Masculino'
                            : userData.gender === 'female'
                            ? 'Femenino'
                            : userData.gender === 'other'
                            ? 'Otro'
                            : 'No especificado'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                    <Target className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">Metas</p>
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          {['lose_weight', 'gain_muscle', 'improve_health', 'maintain_weight', 'increase_endurance', 'flexibility', 'tone', 'endurance'].map((goal) => (
                            <label key={goal} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Array.isArray(editForm.goals) && editForm.goals.includes(goal)}
                                onChange={(e) => {
                                  const currentGoals = Array.isArray(editForm.goals) ? editForm.goals : [];
                                  if (e.target.checked) {
                                    setEditForm({ ...editForm, goals: [...currentGoals, goal] });
                                  } else {
                                    setEditForm({ ...editForm, goals: currentGoals.filter((g: string) => g !== goal) });
                                  }
                                }}
                                className="rounded border-gray-300 text-[#85ea10] focus:ring-[#85ea10]"
                              />
                              <span className="text-xs text-[#164151] dark:text-white">{translateGoal(goal)}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {formatGoals(userData.goals || userData.goal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {userData.dietary_habits && userData.dietary_habits.length > 0 && !isEditing && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl md:col-span-2">
                      <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Hábitos alimenticios</p>
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {userData.dietary_habits.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estadísticas de actividad */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-3 md:col-span-2">
                      <div className="p-4 bg-gray-100 dark:bg-white/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-[#164151] dark:text-white">
                          {userData.streak_days || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/40">Días de racha</p>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-500">
                          {userData.weight_progress_percentage || 0}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/40">Progreso peso</p>
                      </div>
                    </div>
                  )}
                </div>
                  </div>
                )}
              </div>

              {/* Right Column - Productos y Negocio */}
              <div className="space-y-6">
                {/* Productos Activos */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                Productos Activos
              </h2>
              <div className="space-y-3">
                {(() => {
                  // Mostrar TODAS las membresías activas
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Filtrar membresías activas (no vencidas)
                  const activeMemberships = (userData.gym_memberships || []).filter((membership: any) => {
                    const endDate = new Date(membership.end_date);
                    endDate.setHours(0, 0, 0, 0);
                    return endDate >= today;
                  });
                  
                  // Si no hay activas, mostrar la más reciente (aunque esté vencida)
                  const membershipsToShow = activeMemberships.length > 0 
                    ? activeMemberships.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
                    : (userData.gym_memberships?.length > 0 
                        ? [userData.gym_memberships.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]]
                        : []);
                  
                  return membershipsToShow.map((membership: any) => {
                    const endDate = new Date(membership.end_date);
                    endDate.setHours(0, 0, 0, 0);
                    const isExpired = endDate < today;
                    
                    return (
                      <div key={membership.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isExpired 
                              ? 'bg-slate-100 dark:bg-slate-500/20' 
                              : 'bg-[#85ea10]/20 dark:bg-[#85ea10]/30'
                          }`}>
                            <Dumbbell className={`w-5 h-5 ${isExpired ? 'text-slate-600 dark:text-slate-400' : 'text-[#85ea10]'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-[#164151] dark:text-white">
                                {membership.plan?.name || 'Plan'}
                              </p>
                              {isExpired ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400">
                                  Finalizada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]">
                                  Al día
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-white/50">
                              {isExpired ? 'Venció' : 'Vence'}: {new Date(membership.end_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            {membership.payment?.invoice_number && (
                              <p className="text-xs font-medium text-[#164151] dark:text-white mt-1">
                                Factura: #{membership.payment.invoice_number}
                              </p>
                            )}
                          </div>
                        </div>
                        {isExpired && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium">
                              Esta membresía ha finalizado. ¿Deseas renovarla?
                            </p>
                            {/* Botón Invitar a renovar (WhatsApp) */}
                            {userData.whatsapp || userData.phone ? (() => {
                              const planName = membership.plan?.name || 'tu plan';
                              const endDateFormatted = new Date(membership.end_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              });
                              
                              const handleRenew = () => {
                                const clientName = userData.name || userData.full_name || 'Cliente';
                                const whatsappNumber = (userData.whatsapp || userData.phone || '').replace(/\D/g, '');
                                
                                if (!whatsappNumber) return;
                                
                                const message = encodeURIComponent(
                                  `Hola ${clientName}, tu plan "${planName}" finalizó el ${endDateFormatted}. ¿Deseas renovar tu membresía para continuar?`
                                );
                                
                                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                                window.open(whatsappUrl, '_blank');
                              };
                              
                              return (
                                <button
                                  onClick={handleRenew}
                                  className="w-full px-4 py-2 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/30 text-[#164151] dark:text-[#85ea10] hover:bg-[#85ea10]/30 dark:hover:bg-[#85ea10]/40 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Invitar a renovar
                                </button>
                              );
                            })() : (
                              <p className="text-xs text-gray-400 dark:text-white/40">
                                No hay número de contacto disponible
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {userData.activeCoursePurchases && userData.activeCoursePurchases.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {userData.activeCoursePurchases.length}{' '}
                        {userData.activeCoursePurchases.length === 1 ? 'curso activo' : 'cursos activos'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {userData.activeCoursePurchases
                          .map((p: any) => p.course?.title)
                          .filter(Boolean)
                          .join(', ') || 'Cursos activos'}
                      </p>
                    </div>
                  </div>
                )}

                {!userData.activeGymMembership &&
                  (!userData.activeCoursePurchases || userData.activeCoursePurchases.length === 0) && (
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-center">
                      <p className="text-sm text-gray-400 dark:text-white/50 mb-3">No hay productos activos</p>
                      {/* Botón para clientes físicos - texto diferente si nunca ha comprado */}
                      {(userData.userType === 'physical' || userData.hasGymMembership || userData.isUnregisteredClient) && (() => {
                        // Obtener client_info_id
                        const clientInfoId = userData.isUnregisteredClient ? userData.id : (userData.gym_memberships?.[0]?.client_info_id || userData.id);
                        
                        // Verificar si nunca ha comprado (no tiene membresías ni compras)
                        const hasNeverPurchased = !userData.hasGymMembership && !userData.hasOnlinePurchase && !userData.gym_memberships?.length;
                        
                        // Obtener plan_id del último plan (activo o vencido)
                        const latestMembership = userData.gym_memberships?.length > 0
                          ? userData.gym_memberships.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
                          : userData.activeGymMembership;
                        const planId = latestMembership?.plan?.id || null;
                        
                        const handleRegisterPayment = () => {
                          // Navegar a la pestaña de pagos con parámetros
                          router.push(`/admin?tab=gym-payments&clientId=${clientInfoId}${planId ? `&planId=${planId}` : ''}`);
                        };
                        
                        return (
                          <button
                            onClick={handleRegisterPayment}
                            className="px-4 py-2 rounded-lg bg-[#164151] dark:bg-white text-white dark:text-[#164151] hover:bg-[#1a4d5f] dark:hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold mx-auto"
                            title={hasNeverPurchased ? "Empezar plan" : "Registrar nuevo pago"}
                          >
                            <CreditCard className="w-4 h-4" />
                            {hasNeverPurchased ? 'Empezar Plan' : 'Registrar Pago'}
                          </button>
                        );
                      })()}
                    </div>
                  )}
              </div>
                </div>

                {/* Membresías */}
                {userData.gym_memberships && userData.gym_memberships.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Historial de Facturación
                </h2>
                <div className="space-y-3">
                  {userData.gym_memberships
                    .sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
                    .map((membership: any) => {
                      // Verificar dinámicamente si está vencida
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endDate = new Date(membership.end_date);
                      endDate.setHours(0, 0, 0, 0);
                      const isExpired = endDate < today;
                      const isActive = !isExpired && membership.status === 'active';
                      
                      return (
                    <div
                      key={membership.id}
                      className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                          {membership.plan?.name || 'Plan'}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]'
                              : isExpired
                              ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'
                          }`}
                        >
                          {isActive
                            ? 'Al día'
                            : isExpired
                            ? 'Finalizada'
                            : membership.status === 'cancelled'
                            ? 'Cancelada'
                            : membership.status === 'courtesy'
                            ? 'Cortesía'
                            : membership.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-white/50">
                          {isExpired ? 'Venció' : 'Vence'}: {new Date(membership.end_date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        {membership.payment?.invoice_number ? (
                          <p className="text-xs font-medium text-[#164151] dark:text-white">
                            Factura: #{membership.payment.invoice_number}
                          </p>
                        ) : null}
                      </div>
                    </div>
                      );
                    })}
                </div>
                  </div>
                )}

                {/* Cursos */}
                {userData.course_purchases && userData.course_purchases.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider mb-4">
                  Historial de Cursos
                </h2>
                <div className="space-y-3">
                  {userData.course_purchases.map((purchase: any) => (
                    <div
                      key={purchase.id}
                      className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
                    >
                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                        {purchase.course?.title || 'Curso'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/50">
                        {purchase.is_active ? (
                          <span className="text-[#85ea10]">Activo</span>
                        ) : (
                          <span>Completado</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
