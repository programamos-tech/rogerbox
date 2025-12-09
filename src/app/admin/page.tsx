'use client';

import QuickLoading from '@/components/QuickLoading';
import BannerManagement from '@/components/admin/BannerManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import ComplementManagement from '@/components/admin/ComplementManagement';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import CourseCreator from '@/components/admin/CourseCreator';
import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-browser';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Home,
  Image,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Plus,
  Ruler,
  Scale,
  Search,
  Settings,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface AdminStats {
  kpis: {
    totalUsers: number;
    usersThisMonth: number;
    totalCourses: number;
    activeCourses: number;
    totalSales: number;
    salesThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
  };
  charts: {
    usersByDay: { date: string; count: number }[];
    salesByDay: { date: string; amount: number; count: number }[];
  };
  topCourses: { id: string; title: string; students: number }[];
  goalsDistribution: { goal: string; count: number }[];
  contentStatus: {
    courses: { total: number; published: number };
    blogs: { total: number; published: number };
    complements: { total: number; published: number };
    banners: { total: number; active: number };
  };
  recentUsers: { id: string; name: string; email: string; created_at: string }[];
  recentSales: { id: string; customer_name: string; amount: number; status: string; created_at: string; course_title: string }[];
}


interface Course {
  id: string;
  title: string;
  short_description: string;
  description?: string;
  preview_image?: string;
  price: number;
  discount_percentage: number;
  category: string;
  duration_days: number;
  students_count: number;
  rating: number;
  calories_burned: number;
  intro_video_url?: string;
  level: string;
  is_published: boolean;
  created_at: string;
  course_lessons?: Array<{
    id: string;
    title: string;
    description: string;
    video_url: string;
    preview_image: string;
    lesson_order: number;
    duration_minutes: number;
  }>;
}

interface Sale {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  customer_email: string;
  customer_name: string;
  wompi_transaction_id: string;
  created_at: string;
  course?: {
    id: string;
    title: string;
    preview_image: string;
    price: number;
  };
  profile?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

// Definición de las secciones del sidebar
const menuSections = [
  {
    title: 'Principal',
    items: [{ id: 'overview', label: 'Dashboard', icon: BarChart3, description: 'Resumen general' }],
  },
  {
    title: 'Contenido',
    items: [
      { id: 'courses', label: 'Cursos', icon: BookOpen, description: 'Gestionar cursos' },
      { id: 'complements', label: 'Complementos', icon: Play, description: 'Videos semanales' },
      { id: 'banners', label: 'Banners', icon: Image, description: 'Banners del dashboard' },
      { id: 'blogs', label: 'Blogs', icon: FileText, description: 'Artículos nutricionales' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { id: 'users', label: 'Usuarios', icon: Users, description: 'Clientes registrados' },
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, description: 'Historial de compras' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes de la plataforma' },
    ],
  },
];

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
  };
  return translations[goal] || goal;
};

// Función para formatear múltiples goals
const formatGoals = (goals: string | string[] | null | undefined): string => {
  if (!goals) return 'No especificada';

  if (typeof goals === 'string') {
    // Si es un string, puede ser un array serializado o un valor único
    try {
      const parsed = JSON.parse(goals);
      if (Array.isArray(parsed)) {
        return parsed.map(translateGoal).join(', ');
      }
    } catch {
      // Si no es JSON, es un valor único
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

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCourseCreator, setShowCourseCreator] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const salesPerPage = 10;
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
    isLoading: false,
  });

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com'; // fallback seguro
    const matchId = envId && user.id === envId;
    const matchEmail = envEmail && user.email === envEmail;
    const matchRole = user.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [user]);

  // Verificar si es admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading) {
      if (!isAdmin) {
        setLoading(false);
        router.push('/dashboard');
        return;
      }

      if (user) {
        loadAdminData();
      }
    }
  }, [authLoading, user, isAdmin, router]);

  // Cargar datos cuando se cambie de pestaña
  useEffect(() => {
    if (activeTab === 'courses') {
      loadCourses();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'sales') {
      loadSales();
    }
  }, [activeTab]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas');
      }
      
      setStats(data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          course_lessons (
            id,
            title,
            description,
            video_url,
            preview_image,
            lesson_number,
            lesson_order,
            duration_minutes
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }
      
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSales = async () => {
    try {
      setLoadingSales(true);

      // Primero obtenemos las órdenes con los cursos
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          *,
          course:courses (
            id,
            title,
            preview_image,
            price
          )
        `
        )
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Luego obtenemos los perfiles de los usuarios
      const userIds = [...new Set(ordersData?.map((order) => order.user_id).filter(Boolean))];

      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .in('id', userIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combinamos los datos
      const salesWithProfiles =
        ordersData?.map((order) => ({
          ...order,
          profile: order.user_id ? profilesMap[order.user_id] : null,
        })) || [];

      setSales(salesWithProfiles);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  const toggleCoursePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, is_published: !currentStatus } : course))
      );
    } catch (error) {
      console.error('Error updating course status:', error);
    }
  };

  const editCourse = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      const courseWithLessons = {
        ...course,
        lessons: course.course_lessons || [],
      };
      setEditingCourse(courseWithLessons);
      setShowCourseCreator(true);
    }
  };

  const deleteCourse = (courseId: string, courseTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Curso',
      message: `¿Estás seguro de que quieres eliminar el curso "${courseTitle}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: () => handleDeleteCourse(courseId, courseTitle),
      isLoading: false,
    });
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isLoading: true }));

      console.log('🗑️ Intentando eliminar curso:', { courseId, courseTitle });
      console.log('🔍 Configuración Supabase:', {
        url: supabaseAdmin.supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      });

      // Primero eliminar lecciones relacionadas
      console.log('📝 Eliminando lecciones del curso...');
      const { data: lessonsData, error: lessonsError } = await supabaseAdmin
        .from('course_lessons')
        .delete()
        .eq('course_id', courseId)
        .select();

      if (lessonsError) {
        console.error('❌ Error eliminando lecciones:', lessonsError);
        throw new Error(`Error al eliminar lecciones: ${lessonsError.message}`);
      }
      console.log(`✅ Lecciones eliminadas: ${lessonsData?.length || 0}`);

      // Usar API route del servidor (service_role key solo funciona en servidor)
      console.log('📝 Eliminando curso vía API...');
      
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include', // Asegurar que las cookies se envíen
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el curso');
      }

      const result = await response.json();
      console.log('✅ Curso eliminado exitosamente:', result);

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      
      // Cerrar el diálogo de confirmación sin mostrar modal de éxito
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error deleting course:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al eliminar el curso. Por favor, inténtalo de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
        isLoading: false,
      });
    }
  };

  // Obtener el item activo actual
  const getActiveItem = () => {
    for (const section of menuSections) {
      const item = section.items.find((i) => i.id === activeTab);
      if (item) return item;
    }
    return menuSections[0].items[0];
  };

  if (authLoading || loading) {
    return <QuickLoading message="Cargando panel de administración..." duration={1000} />;
  }

  if (!loading && !user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const activeItem = getActiveItem();

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
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
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
                <h1 className="text-gray-900 dark:text-white font-black text-xl tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-widest font-semibold">
                  Admin Panel
                </span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-[#85ea10] rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-lg">R</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-black text-gray-500 dark:text-white/50 uppercase tracking-widest">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${
                          isActive
                            ? 'bg-[#85ea10] text-black shadow-lg'
                            : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-[#85ea10]/10'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <span className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-black' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      {!sidebarCollapsed && isActive && <div className="w-2 h-2 rounded-full bg-black" />}
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
              <div className="w-9 h-9 bg-[#85ea10] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 dark:text-white truncate uppercase">
                  {user?.user_metadata?.name || profile?.name || 'Admin'}
                </p>
                <p className="text-[10px] font-semibold text-[#85ea10] truncate">Super Admin</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#85ea10]/10 text-gray-600 dark:text-white/60 hover:text-[#85ea10] transition-colors"
                title="Ir al Dashboard"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#85ea10]/10 text-gray-600 dark:text-white/60 hover:text-[#85ea10] transition-colors"
              title="Ir al Dashboard"
            >
              <Home className="w-5 h-5" />
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
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#85ea10]/10 text-gray-600 dark:text-white/60"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{activeItem.label}</h1>
              <p className="text-xs text-gray-600 dark:text-white/60 hidden sm:block font-medium">
                {activeItem.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            {activeTab === 'courses' && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseCreator(true);
                }}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm uppercase tracking-tight shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Crear Curso</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#85ea10]/10 text-gray-600 dark:text-white/60 hover:text-[#85ea10] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#85ea10] rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* KPIs Principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#85ea10] rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs font-bold text-[#85ea10] bg-[#85ea10]/10 px-2 py-1 rounded-full">
                      +{stats.kpis.usersThisMonth} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.kpis.totalUsers}</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-white/60 uppercase">Usuarios</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#85ea10] rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      {stats.kpis.totalCourses} total
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.kpis.activeCourses}</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-white/60 uppercase">Cursos Activos</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#85ea10] rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs font-bold text-[#85ea10] bg-[#85ea10]/10 px-2 py-1 rounded-full">
                      +{stats.kpis.salesThisMonth} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.kpis.totalSales}</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-white/60 uppercase">Ventas</p>
                </div>

                <div className="bg-gradient-to-br from-[#85ea10] to-[#6bc20a] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs font-bold text-black/70 bg-black/10 px-2 py-1 rounded-full">
                      +${stats.kpis.revenueThisMonth?.toLocaleString('es-CO')} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-black text-black">${stats.kpis.totalRevenue?.toLocaleString('es-CO')}</p>
                  <p className="text-xs font-semibold text-black/70 uppercase">Ingresos Totales</p>
                </div>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Gráfica de Usuarios */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Nuevos Usuarios (7 días)
                  </h3>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {stats.charts.usersByDay.map((day, i) => {
                      const maxCount = Math.max(...stats.charts.usersByDay.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-[#85ea10]">{day.count}</span>
                          <div 
                            className="w-full bg-[#85ea10] rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 dark:text-white/50">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gráfica de Ingresos */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Ingresos (7 días)
                  </h3>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {stats.charts.salesByDay.map((day, i) => {
                      const maxAmount = Math.max(...stats.charts.salesByDay.map(d => d.amount), 1);
                      const height = (day.amount / maxAmount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-[#85ea10]">
                            {day.amount > 0 ? `$${(day.amount / 1000).toFixed(0)}k` : '-'}
                          </span>
                          <div 
                            className="w-full bg-gradient-to-t from-[#85ea10] to-[#a5f03a] rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 dark:text-white/50">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Estado del Contenido + Top Cursos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Estado del Contenido */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Estado del Contenido
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#85ea10]" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Cursos</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {stats.contentStatus.courses.published}/{stats.contentStatus.courses.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#85ea10] rounded-full transition-all"
                        style={{ width: `${stats.contentStatus.courses.total > 0 ? (stats.contentStatus.courses.published / stats.contentStatus.courses.total) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#85ea10]" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Blogs</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {stats.contentStatus.blogs.published}/{stats.contentStatus.blogs.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#85ea10] rounded-full transition-all"
                        style={{ width: `${stats.contentStatus.blogs.total > 0 ? (stats.contentStatus.blogs.published / stats.contentStatus.blogs.total) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-[#85ea10]" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Complementos</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {stats.contentStatus.complements.published}/{stats.contentStatus.complements.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#85ea10] rounded-full transition-all"
                        style={{ width: `${stats.contentStatus.complements.total > 0 ? (stats.contentStatus.complements.published / stats.contentStatus.complements.total) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-[#85ea10]" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-white/70">Banners</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">
                        {stats.contentStatus.banners.active}/{stats.contentStatus.banners.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#85ea10] rounded-full transition-all"
                        style={{ width: `${stats.contentStatus.banners.total > 0 ? (stats.contentStatus.banners.active / stats.contentStatus.banners.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top Cursos */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Top Cursos
                  </h3>
                  {stats.topCourses.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-white/40">Sin cursos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.topCourses.map((course, i) => (
                        <div key={course.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            i === 0 ? 'bg-[#85ea10] text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white/60'
                          }`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{course.title}</p>
                          </div>
                          <span className="text-xs font-black text-[#85ea10]">{course.students}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metas de Usuarios */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Metas de Usuarios
                  </h3>
                  {stats.goalsDistribution.length === 0 ? (
                    <div className="text-center py-6">
                      <Target className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-white/40">Sin datos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.goalsDistribution.map((item) => {
                        const goalNames: Record<string, string> = {
                          lose_weight: 'Bajar de peso',
                          gain_muscle: 'Ganar músculo',
                          improve_health: 'Mejorar salud',
                          maintain_weight: 'Mantener peso',
                          increase_endurance: 'Resistencia',
                          flexibility: 'Flexibilidad',
                          stress_relief: 'Reducir estrés',
                          energy: 'Más energía',
                        };
                        const maxCount = Math.max(...stats.goalsDistribution.map(g => g.count), 1);
                        return (
                          <div key={item.goal}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-700 dark:text-white/70">
                                {goalNames[item.goal] || item.goal}
                              </span>
                              <span className="text-xs font-black text-[#85ea10]">{item.count}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#85ea10] rounded-full transition-all"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actividad Reciente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ventas Recientes */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-white/20 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Ventas Recientes</h3>
                    <button onClick={() => setActiveTab('sales')} className="text-xs font-bold text-[#85ea10] hover:text-[#7dd30f]">
                      Ver todas →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {stats.recentSales.length === 0 ? (
                      <div className="p-8 text-center">
                        <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-white/40">No hay ventas aún</p>
                      </div>
                    ) : (
                      stats.recentSales.map((sale) => (
                        <div key={sale.id} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{sale.customer_name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-white/40 truncate">{sale.course_title}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-black text-[#85ea10]">${sale.amount?.toLocaleString('es-CO')}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(sale.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Usuarios Recientes */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-white/20 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Usuarios Recientes</h3>
                    <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-[#85ea10] hover:text-[#7dd30f]">
                      Ver todos →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {stats.recentUsers.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-white/40">No hay usuarios aún</p>
                      </div>
                    ) : (
                      stats.recentUsers.map((user) => (
                        <div key={user.id} className="p-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#85ea10]/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#85ea10]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-white/40 truncate">{user.email}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 flex-shrink-0">
                            {new Date(user.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => { setEditingCourse(null); setShowCourseCreator(true); }}
                  className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black py-4 rounded-xl transition-all flex flex-col items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-tight">Crear Curso</span>
                </button>
                <button
                  onClick={() => setActiveTab('complements')}
                  className="bg-white/80 dark:bg-gray-900/80 hover:bg-[#85ea10]/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white font-black py-4 rounded-xl transition-all flex flex-col items-center gap-2 shadow-lg"
                >
                  <Play className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-tight">Complementos</span>
                </button>
                <button
                  onClick={() => setActiveTab('banners')}
                  className="bg-white/80 dark:bg-gray-900/80 hover:bg-[#85ea10]/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white font-black py-4 rounded-xl transition-all flex flex-col items-center gap-2 shadow-lg"
                >
                  <Image className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-tight">Banners</span>
                </button>
                <button
                  onClick={() => setActiveTab('blogs')}
                  className="bg-white/80 dark:bg-gray-900/80 hover:bg-[#85ea10]/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white font-black py-4 rounded-xl transition-all flex flex-col items-center gap-2 shadow-lg"
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-xs uppercase tracking-tight">Blogs</span>
                </button>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {loadingCourses ? (
                <LoadingState message="Cargando cursos..." />
              ) : courses.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No hay cursos creados"
                  description="Crea tu primer curso para comenzar"
                  action={{
                    label: 'Crear Curso',
                    onClick: () => {
                      setEditingCourse(null);
                      setShowCourseCreator(true);
                    },
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={() => editCourse(course.id)}
                      onDelete={() => deleteCourse(course.id, course.title)}
                      onTogglePublish={() => toggleCoursePublish(course.id, course.is_published)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blogs Tab */}
          {activeTab === 'blogs' && <BlogManagement />}

          {/* Complements Tab */}
          {activeTab === 'complements' && <ComplementManagement />}

          {/* Banners Tab */}
          {activeTab === 'banners' && <BannerManagement />}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar usuarios por nombre o email..."
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                {loadingUsers ? (
                  <LoadingState message="Cargando usuarios..." />
                ) : users.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No hay usuarios registrados"
                    description="Los usuarios aparecerán aquí cuando se registren"
                  />
                ) : (
                  (() => {
                    // Filter users based on search term
                    const filteredUsers = users.filter(
                      (user) =>
                        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                    );

                    // Pagination calculations
                    const totalUsers = filteredUsers.length;
                    const totalPages = Math.ceil(totalUsers / usersPerPage);
                    const startIndex = (currentPage - 1) * usersPerPage;
                    const endIndex = startIndex + usersPerPage;
                    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

                    // Ensure current page is valid
                    const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
                    if (validCurrentPage !== currentPage && totalPages > 0) {
                      setCurrentPage(validCurrentPage);
                    }

                    if (filteredUsers.length === 0) {
                      return (
                        <EmptyState
                          icon={Search}
                          title="No se encontraron usuarios"
                          description={`No hay usuarios que coincidan con "${userSearchTerm}"`}
                        />
                      );
                    }

                    return (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Usuario
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">
                                  Meta
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden md:table-cell">
                                  Peso
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">
                                  Registro
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {paginatedUsers.map((user) => (
                                <tr
                                  key={user.id}
                                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {user.name || 'Sin nombre'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 hidden lg:table-cell">
                                    {formatGoals(user.goals || user.goal)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 hidden md:table-cell">
                                    {user.current_weight || user.weight
                                      ? `${user.current_weight || user.weight} kg`
                                      : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/40 hidden lg:table-cell">
                                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end">
                                      <button
                                        onClick={() => setSelectedUser(user)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#85ea10]/20 text-gray-500 dark:text-white/40 hover:text-[#85ea10] transition-colors cursor-pointer"
                                        title="Ver detalles"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm text-gray-500 dark:text-white/40">
                            Mostrando{' '}
                            <span className="text-gray-900 dark:text-white font-medium">{startIndex + 1}</span>{' '}
                            a{' '}
                            <span className="text-gray-900 dark:text-white font-medium">
                              {Math.min(endIndex, totalUsers)}
                            </span>{' '}
                            de <span className="text-gray-900 dark:text-white font-medium">{totalUsers}</span>{' '}
                            usuarios
                          </div>

                          <div className="flex items-center gap-2">
                            {/* First Page Button */}
                            <button
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                currentPage === 1
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Primera página"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Previous Page Button */}
                            <button
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                currentPage === 1
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Página anterior"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
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
                                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
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
                                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all text-sm cursor-pointer ${
                                        currentPage === i
                                          ? 'bg-[#85ea10] text-black font-semibold'
                                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
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
                                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer text-sm"
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
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                currentPage === totalPages || totalPages === 0
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
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
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Última página"
                            >
                              <ChevronsRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Ventas</h2>
                    <p className="text-sm text-gray-500 dark:text-white/60 mt-1">
                      {sales.length} {sales.length === 1 ? 'venta registrada' : 'ventas registradas'}
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente o curso..."
                      value={salesSearchTerm}
                      onChange={(e) => {
                        setSalesSearchTerm(e.target.value);
                        setSalesCurrentPage(1);
                      }}
                      className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingSales ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#85ea10] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  (() => {
                    // Filtrar ventas
                    const filteredSales = sales.filter((sale) => {
                      const searchLower = salesSearchTerm.toLowerCase();
                      return (
                        sale.customer_name?.toLowerCase().includes(searchLower) ||
                        sale.customer_email?.toLowerCase().includes(searchLower) ||
                        sale.course?.title?.toLowerCase().includes(searchLower) ||
                        sale.wompi_transaction_id?.toLowerCase().includes(searchLower)
                      );
                    });

                    // Paginación
                    const totalPages = Math.ceil(filteredSales.length / salesPerPage);
                    const startIndex = (salesCurrentPage - 1) * salesPerPage;
                    const paginatedSales = filteredSales.slice(startIndex, startIndex + salesPerPage);

                    if (filteredSales.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-white/60">
                            {salesSearchTerm
                              ? 'No se encontraron ventas con esos criterios'
                              : 'No hay ventas registradas aún'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Sales Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-white/10">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Cliente
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Curso
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Monto
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Método
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Fecha
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {paginatedSales.map((sale) => (
                                <tr
                                  key={sale.id}
                                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  {/* Cliente */}
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {sale.customer_name || sale.profile?.name || 'Sin nombre'}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-white/40">
                                        {sale.customer_email || sale.profile?.email}
                                      </p>
                                    </div>
                                  </td>

                                  {/* Curso */}
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      {sale.course?.preview_image ? (
                                        <img
                                          src={sale.course.preview_image}
                                          alt={sale.course.title}
                                          className="w-10 h-10 rounded-lg object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                                          <BookOpen className="w-5 h-5 text-gray-400" />
                                        </div>
                                      )}
                                      <p className="font-medium text-gray-900 dark:text-white text-sm max-w-[200px] truncate">
                                        {sale.course?.title || 'Curso eliminado'}
                                      </p>
                                    </div>
                                  </td>

                                  {/* Monto */}
                                  <td className="py-4 px-4">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                      ${sale.amount?.toLocaleString('es-CO')}{' '}
                                      <span className="text-xs font-normal text-gray-500 dark:text-white/40">
                                        {sale.currency || 'COP'}
                                      </span>
                                    </p>
                                  </td>

                                  {/* Estado */}
                                  <td className="py-4 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        sale.status === 'approved' || sale.status === 'APPROVED'
                                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                          : sale.status === 'pending' || sale.status === 'PENDING'
                                          ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                          : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                      }`}
                                    >
                                      {sale.status === 'approved' || sale.status === 'APPROVED' ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : null}
                                      {sale.status === 'approved' || sale.status === 'APPROVED'
                                        ? 'Aprobado'
                                        : sale.status === 'pending' || sale.status === 'PENDING'
                                        ? 'Pendiente'
                                        : sale.status === 'declined' || sale.status === 'DECLINED'
                                        ? 'Rechazado'
                                        : sale.status}
                                    </span>
                                  </td>

                                  {/* Método de pago */}
                                  <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-700 dark:text-white/70">
                                      <CreditCard className="w-3 h-3" />
                                      {sale.payment_method || 'N/A'}
                                    </span>
                                  </td>

                                  {/* Fecha */}
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        {new Date(sale.created_at).toLocaleDateString('es-CO', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-white/40">
                                        {new Date(sale.created_at).toLocaleTimeString('es-CO', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                          <p className="text-sm text-gray-500 dark:text-white/60">
                            Mostrando {startIndex + 1} -{' '}
                            {Math.min(startIndex + salesPerPage, filteredSales.length)} de{' '}
                            {filteredSales.length} ventas
                          </p>

                          <div className="flex items-center gap-2">
                            {/* First Page Button */}
                            <button
                              onClick={() => setSalesCurrentPage(1)}
                              disabled={salesCurrentPage === 1}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                salesCurrentPage === 1
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Primera página"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Previous Page Button */}
                            <button
                              onClick={() => setSalesCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={salesCurrentPage === 1}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                salesCurrentPage === 1
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Página anterior"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (salesCurrentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (salesCurrentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = salesCurrentPage - 2 + i;
                                }

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setSalesCurrentPage(pageNum)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                      salesCurrentPage === pageNum
                                        ? 'bg-[#85ea10] text-black'
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Next Page Button */}
                            <button
                              onClick={() => setSalesCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={salesCurrentPage === totalPages || totalPages === 0}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                salesCurrentPage === totalPages || totalPages === 0
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Página siguiente"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Last Page Button */}
                            <button
                              onClick={() => setSalesCurrentPage(totalPages)}
                              disabled={salesCurrentPage === totalPages || totalPages === 0}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                                salesCurrentPage === totalPages || totalPages === 0
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
                              }`}
                              title="Última página"
                            >
                              <ChevronsRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <EmptyState
              icon={Settings}
              title="Configuración"
              description="Los ajustes de la plataforma estarán disponibles próximamente"
            />
          )}
        </div>
      </main>

      {/* Course Creator Modal */}
      {showCourseCreator && (
        <CourseCreator
          onClose={() => {
            setShowCourseCreator(false);
            setEditingCourse(null);
          }}
          onSuccess={() => {
            setShowCourseCreator(false);
            setEditingCourse(null);
            loadAdminData();
            loadCourses();
          }}
          courseToEdit={editingCourse}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Eliminar' : 'Confirmar'}
        cancelText="Cancelar"
        isLoading={confirmDialog.isLoading}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#85ea10] to-[#6bc20a] p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-black">{selectedUser.name || 'Sin nombre'}</h2>
                    <p className="text-black/70 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Información Personal
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Nombre completo</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedUser.first_name && selectedUser.last_name
                            ? `${selectedUser.first_name} ${selectedUser.last_name}`
                            : selectedUser.name || 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    {selectedUser.phone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Teléfono</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedUser.document_id && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Documento</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.document_type || 'CC'}: {selectedUser.document_id}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedUser.address && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Dirección</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.address}
                            {selectedUser.city ? `, ${selectedUser.city}` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedUser.birth_year && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Año de nacimiento</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.birth_year} ({new Date().getFullYear() - selectedUser.birth_year}{' '}
                            años)
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Fecha de registro</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(selectedUser.created_at).toLocaleDateString('es-ES', {
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
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                    Información Fitness
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Scale className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Peso actual</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedUser.current_weight || selectedUser.weight
                            ? `${selectedUser.current_weight || selectedUser.weight} kg`
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>

                    {selectedUser.target_weight && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Target className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Peso objetivo</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.target_weight} kg
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Ruler className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Altura</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedUser.height ? `${selectedUser.height} cm` : 'No especificada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Género</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedUser.gender === 'male'
                            ? 'Masculino'
                            : selectedUser.gender === 'female'
                            ? 'Femenino'
                            : selectedUser.gender === 'other'
                            ? 'Otro'
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <Target className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-white/40">Metas</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatGoals(selectedUser.goals || selectedUser.goal)}
                        </p>
                      </div>
                    </div>

                    {selectedUser.dietary_habits && selectedUser.dietary_habits.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-white/40">Hábitos alimenticios</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedUser.dietary_habits.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Estadísticas de actividad */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-[#85ea10]/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-[#85ea10]">{selectedUser.streak_days || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-white/40">Días de racha</p>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-500">
                          {selectedUser.weight_progress_percentage || 0}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/40">Progreso peso</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Componentes Auxiliares =====



interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function CourseCard({ course, onEdit, onDelete, onTogglePublish }: CourseCardProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 hover:border-[#85ea10]/50 transition-all group shadow-lg hover:shadow-xl overflow-hidden">
      {/* Imagen del curso */}
      <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
        {course.preview_image ? (
          <img
            src={course.preview_image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        {/* Badge de estado sobre la imagen */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 text-xs font-black rounded-full ${
              course.is_published
                ? 'bg-[#85ea10] text-black'
                : 'bg-gray-800/80 dark:bg-white/20 text-white dark:text-white/90 backdrop-blur-sm'
            }`}
          >
            {course.is_published ? 'Publicado' : 'Borrador'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-2 mb-2 uppercase tracking-tight">
          {course.title}
        </h3>

        <p className="text-xs font-medium text-gray-600 dark:text-white/60 line-clamp-2 mb-4">{course.short_description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
            <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Precio</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">
              ${course.price?.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
            <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Duración</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">{course.duration_days} días</p>
          </div>
          <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
            <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Nivel</p>
            <p className="text-sm font-black text-gray-900 dark:text-white capitalize">{course.level}</p>
          </div>
          <div className="bg-[#85ea10]/10 rounded-lg px-3 py-2 border border-[#85ea10]/20">
            <p className="text-[10px] font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide mb-0.5">Estudiantes</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">{course.students_count}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-[#85ea10]/10 hover:bg-[#85ea10]/20 border border-[#85ea10]/30 text-[#85ea10] px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex-1 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
          <button
            onClick={onTogglePublish}
            className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 uppercase tracking-tight ${
              course.is_published
                ? 'bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 border border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-400'
                : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black border border-[#85ea10]'
            }`}
          >
            {course.is_published ? (
              <>
                <X className="w-3.5 h-3.5" />
                Ocultar
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Publicar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-10 shadow-lg">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#85ea10]/30 border-t-[#85ea10] rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-gray-600 dark:text-white/70">{message}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-10 shadow-lg">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#85ea10]/10 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#85ea10]" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-gray-600 dark:text-white/60 mb-6 max-w-sm">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm uppercase tracking-tight shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
