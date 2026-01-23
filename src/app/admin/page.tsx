'use client';

import QuickLoading from '@/components/QuickLoading';
import BannerManagement from '@/components/admin/BannerManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import ComplementManagement from '@/components/admin/ComplementManagement';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import CourseCreator from '@/components/admin/CourseCreator';
import GymPlansManagement, { GymPlansManagementRef } from '@/components/admin/GymPlansManagement';
import GymPaymentsManagement, { GymPaymentsManagementRef } from '@/components/admin/GymPaymentsManagement';
import GymCollectionsManagement from '@/components/admin/GymCollectionsManagement';
import GymClientForm from '@/components/admin/GymClientForm';
import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-browser';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Check,
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
  Globe,
  Home,
  Image,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
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
  Dumbbell,
  ClipboardList,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';

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
  user_id?: string | null;
  course_id?: string | null;
  gym_plan_id?: string | null;
  order_type?: 'course' | 'gym_plan' | null;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  wompi_transaction_id?: string | null;
  created_at: string;
  course?: {
    id: string;
    title: string;
    preview_image: string;
    price: number;
  } | null;
  gym_plan?: {
    id: string;
    name: string;
    price: number;
  } | null;
  profile?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
}

// Definición de las secciones del sidebar
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
  const searchParams = useSearchParams();
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
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all'); // 'all', 'physical', 'online', 'both'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all'); // 'all', 'paid', 'unpaid', 'overdue'
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState<string>('all'); // 'all', 'online', 'physical'
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
  const gymPlansRef = useRef<GymPlansManagementRef>(null);
  const gymPaymentsRef = useRef<GymPaymentsManagementRef>(null);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com'; // fallback seguro
    const matchId = envId && user.id === envId;
    const matchEmail = envEmail && user.email === envEmail;
    const matchRole = user.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [user]);

  // Leer query param 'tab' y establecer activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      // Verificar que el tab existe en las secciones del menú
      const validTabs = menuSections.flatMap((section) => section.items.map((item) => item.id));
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams]);

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

      // Obtener órdenes con cursos y planes físicos
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
          ),
          gym_plan:gym_plans (
            id,
            name,
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
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'N/A',
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
          <h1 className="text-2xl font-bold text-[#164151] dark:text-white mb-4">Acceso Denegado</h1>
          <p className="text-[#164151]/80 dark:text-gray-400">No tienes permisos para acceder a esta sección.</p>
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
                  const isActive = activeTab === item.id;
                  // Indicador especial para Usuarios (incluye ambas sedes)
                  const isUsersItem = item.id === 'users';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
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
                  {user?.user_metadata?.name || profile?.name || 'Admin'}
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
            {/* Quick Actions */}
            {activeTab === 'courses' && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseCreator(true);
                }}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Curso</span>
              </button>
            )}

            {activeTab === 'users' && (
              <button
                onClick={() => {
                  setEditingClient(null);
                  setShowClientForm(true);
                }}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Cliente Físico</span>
              </button>
            )}

            {activeTab === 'gym-plans' && (
              <button
                onClick={() => {
                  gymPlansRef.current?.openCreateModal();
                }}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Plan</span>
              </button>
            )}

            {activeTab === 'gym-payments' && (
              <button
                onClick={() => {
                  gymPaymentsRef.current?.openCreateModal();
                }}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Registrar Pago</span>
              </button>
            )}

            {/* Notifications */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-400 dark:bg-white/60 rounded-full border-2 border-white dark:border-gray-900"></span>
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
                    <div className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                    </div>
                    <span className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      +{stats.kpis.usersThisMonth} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#164151] dark:text-white">{stats.kpis.totalUsers}</p>
                  <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60">Usuarios</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                    </div>
                    <span className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      {stats.kpis.totalCourses} total
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#164151] dark:text-white">{stats.kpis.activeCourses}</p>
                  <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60">Cursos Activos</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                    </div>
                    <span className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      +{stats.kpis.salesThisMonth} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#164151] dark:text-white">{stats.kpis.totalSales}</p>
                  <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60">Ventas</p>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                    </div>
                    <span className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      +${stats.kpis.revenueThisMonth?.toLocaleString('es-CO')} este mes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#164151] dark:text-white">${stats.kpis.totalRevenue?.toLocaleString('es-CO')}</p>
                  <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60">Ingresos Totales</p>
                </div>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Gráfica de Usuarios */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-5 shadow-lg">
                  <h3 className="text-sm font-black text-[#164151] dark:text-white uppercase tracking-tight mb-4">
                    Nuevos Usuarios (7 días)
                  </h3>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {stats.charts.usersByDay.map((day, i) => {
                      const maxCount = Math.max(...stats.charts.usersByDay.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-[#164151]/80 dark:text-white/70">{day.count}</span>
                          <div 
                            className="w-full bg-gray-300 dark:bg-white/20 rounded-t-lg transition-all duration-500"
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
                  <h3 className="text-sm font-black text-[#164151] dark:text-white uppercase tracking-tight mb-4">
                    Ingresos (7 días)
                  </h3>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {stats.charts.salesByDay.map((day, i) => {
                      const maxAmount = Math.max(...stats.charts.salesByDay.map(d => d.amount), 1);
                      const height = (day.amount / maxAmount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-[#164151]/80 dark:text-white/70">
                            {day.amount > 0 ? `$${(day.amount / 1000).toFixed(0)}k` : '-'}
                          </span>
                          <div 
                            className="w-full bg-gray-300 dark:bg-white/20 rounded-t-lg transition-all duration-500"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 dark:text-white/50">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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

          {/* Gym Plans Tab */}
          {activeTab === 'gym-plans' && <GymPlansManagement ref={gymPlansRef} />}

          {/* Gym Payments Tab */}
          {activeTab === 'gym-payments' && <GymPaymentsManagement ref={gymPaymentsRef} />}

          {/* Gym Collections Tab */}
          {activeTab === 'gym-collections' && <GymCollectionsManagement />}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search and Filters Bar */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios por nombre o email..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                    <select
                      value={userTypeFilter}
                      onChange={(e) => {
                        setUserTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-12 pr-10 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
                    >
                      <option value="all">Todos los usuarios</option>
                      <option value="physical">Solo físicos</option>
                      <option value="online">Solo online</option>
                      <option value="both">Ambos</option>
                    </select>
                  </div>

                  {/* Payment Status Filter */}
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => {
                        setPaymentStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-12 pr-10 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="paid">Al día</option>
                      <option value="unpaid">Sin pagos</option>
                      <option value="overdue">Vencidos</option>
                    </select>
                  </div>
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
                    // Filter users based on search term, type, and payment status
                    let filteredUsers = users.filter((user) => {
                      const searchLower = userSearchTerm.toLowerCase();
                      const matchesSearch =
                        user.name?.toLowerCase().includes(searchLower) ||
                        user.email?.toLowerCase().includes(searchLower);

                      // Filter by user type
                      let matchesType = true;
                      if (userTypeFilter === 'physical') {
                        matchesType = user.hasGymMembership && !user.hasOnlinePurchase;
                      } else if (userTypeFilter === 'online') {
                        matchesType = user.hasOnlinePurchase && !user.hasGymMembership;
                      } else if (userTypeFilter === 'both') {
                        matchesType = user.hasGymMembership && user.hasOnlinePurchase;
                      }

                      // Filter by payment status
                      let matchesPayment = true;
                      if (paymentStatusFilter === 'paid') {
                        matchesPayment = user.hasActiveGymMembership || user.hasOnlinePurchase;
                      } else if (paymentStatusFilter === 'unpaid') {
                        matchesPayment = !user.hasActiveGymMembership && !user.hasOnlinePurchase && user.hasGymMembership;
                      } else if (paymentStatusFilter === 'overdue') {
                        // Usuarios con membresías vencidas
                        const hasExpiredMembership = user.gym_memberships?.some(
                          (m: any) => m.status === 'expired' || (m.status === 'active' && new Date(m.end_date) < new Date())
                        );
                        matchesPayment = hasExpiredMembership;
                      }

                      return matchesSearch && matchesType && matchesPayment;
                    });

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
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Cliente
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Documento
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Productos
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Tipo
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  WhatsApp
                                </th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="text-right px-4 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                              {paginatedUsers.map((user) => (
                                <tr
                                  key={user.id}
                                  onClick={() => router.push(`/admin/users/${user.id}`)}
                                  className="hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer group border-l-4 border-transparent hover:border-[#85ea10]/30"
                                >
                                  <td className="px-4 py-4">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-[#164151] dark:text-white truncate">
                                          {user.name || user.full_name || 'Sin nombre'}
                                        </p>
                                        {/* Check verde rellenito para usuarios registrados */}
                                        {!user.isUnregisteredClient && (
                                          <div className="w-4 h-4 rounded-full bg-[#85ea10] flex items-center justify-center flex-shrink-0">
                                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#164151]/60 dark:text-white/50 mt-0.5 truncate">
                                        {user.email || 'Sin email'}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    {user.document_id ? (
                                      <div className="flex items-center gap-1.5">
                                        <CreditCard className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs font-medium text-[#164151] dark:text-white">
                                          {user.document_id}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-white/40">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div>
                                      {(() => {
                                        // Mostrar el producto/plan que compró el usuario
                                        
                                        // Si tiene membresía activa, mostrar solo el plan
                                        if (user.hasActiveGymMembership && user.activeGymMembership?.plan) {
                                          const planName = user.activeGymMembership.plan.name || 'Plan';
                                          return (
                                            <span className="text-sm font-medium text-[#164151] dark:text-white">
                                              {planName}
                                            </span>
                                          );
                                        }
                                        
                                        // Si tiene membresía pero está vencida, mostrar el plan con icono y texto gris
                                        if (user.hasGymMembership && !user.hasActiveGymMembership && user.gym_memberships?.length > 0) {
                                          // Buscar la membresía más reciente
                                          const latestMembership = user.gym_memberships
                                            .sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
                                          const planName = latestMembership?.plan?.name || 'Plan';
                                          return (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-white/50">
                                              <AlertCircle className="w-3.5 h-3.5" />
                                              {planName}
                                            </span>
                                          );
                                        }
                                        
                                        // Si es usuario online con compras activas, mostrar el curso
                                        if (user.hasOnlinePurchase && user.activeCoursePurchases?.length > 0) {
                                          const courseName = user.activeCoursePurchases[0]?.course?.title || 'Curso';
                                          return (
                                            <span className="text-sm font-medium text-[#164151] dark:text-white">
                                              {courseName}
                                            </span>
                                          );
                                        }
                                        
                                        // Si no ha comprado nada - diseño más profesional y serio
                                        return (
                                          <span className="text-sm font-medium text-gray-500 dark:text-white/50">
                                            Sin productos
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div>
                                      {user.userType === 'both' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                                          Ambos
                                        </span>
                                      )}
                                      {user.userType === 'physical' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                                          <Dumbbell className="w-3 h-3" />
                                          Físico
                                        </span>
                                      )}
                                      {user.userType === 'online' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                                          <Globe className="w-3 h-3" />
                                          Online
                                        </span>
                                      )}
                                      {user.userType === 'none' && (
                                        <span className="text-xs text-gray-400 dark:text-white/40">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    {user.phone || user.whatsapp ? (
                                      <a
                                        href={`https://wa.me/${(user.phone || user.whatsapp).replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                      >
                                        <Phone className="w-3 h-3" />
                                        {user.phone || user.whatsapp}
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-white/40">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div>
                                      {(() => {
                                        // Para clientes físicos: verificar si está al día con pagos
                                        if (user.userType === 'physical' || user.hasGymMembership) {
                                          if (user.hasActiveGymMembership) {
                                            return (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]">
                                                <CheckCircle className="w-3 h-3 text-[#164151] dark:text-[#85ea10]" />
                                                Al día
                                              </span>
                                            );
                                          } else if (user.hasGymMembership) {
                                            // Tiene membresía pero está vencida - mostrar "Renovar" para incentivar acción
                                            return (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                                <AlertCircle className="w-3 h-3" />
                                                Renovar
                                              </span>
                                            );
                                          }
                                          // Cliente físico sin membresías registradas
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                                              <AlertCircle className="w-3 h-3" />
                                              Sin pagos
                                            </span>
                                          );
                                        }
                                        // Para clientes online: verificar si tiene factura al día (compras activas)
                                        if (user.userType === 'online' || user.hasOnlinePurchase) {
                                          if (user.hasOnlinePurchase && user.activeCoursePurchases && user.activeCoursePurchases.length > 0) {
                                            return (
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/30 dark:text-[#85ea10]">
                                                <CheckCircle className="w-3 h-3 text-[#164151] dark:text-[#85ea10]" />
                                                Al día
                                              </span>
                                            );
                                          }
                                          // Cliente online sin compras activas
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                                              <AlertCircle className="w-3 h-3" />
                                              Sin pagos
                                            </span>
                                          );
                                        }
                                        // Usuario sin tipo definido o sin pagos
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                                            <AlertCircle className="w-3 h-3" />
                                            Sin pagos
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                      {/* Botón Recordatorio - solo visible cuando membresía está vencida */}
                                      {user.hasGymMembership && !user.hasActiveGymMembership && (user.whatsapp || user.phone) && (() => {
                                        // Obtener la membresía más reciente para el mensaje
                                        const latestMembership = user.gym_memberships?.length > 0
                                          ? user.gym_memberships.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
                                          : null;
                                        const planName = latestMembership?.plan?.name || 'tu plan';
                                        const endDate = latestMembership?.end_date 
                                          ? new Date(latestMembership.end_date).toLocaleDateString('es-ES', {
                                              day: '2-digit',
                                              month: 'long',
                                              year: 'numeric',
                                            })
                                          : 'la fecha indicada';
                                        
                                        const handleReminder = () => {
                                          const clientName = user.name || user.full_name || 'Cliente';
                                          const whatsappNumber = (user.whatsapp || user.phone || '').replace(/\D/g, '');
                                          
                                          if (!whatsappNumber) return;
                                          
                                          const message = encodeURIComponent(
                                            `Hola ${clientName}, tu plan "${planName}" venció el ${endDate}. ¿Deseas renovarlo?`
                                          );
                                          
                                          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                                          window.open(whatsappUrl, '_blank');
                                        };
                                        
                                        return (
                                          <button
                                            onClick={handleReminder}
                                            className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors flex items-center gap-1.5 text-xs font-medium"
                                            title="Enviar recordatorio de renovación"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Recordatorio</span>
                                          </button>
                                        );
                                      })()}
                                      {/* Botón Registrar Pago - solo para clientes físicos */}
                                      {(user.userType === 'physical' || user.hasGymMembership || user.isUnregisteredClient) && (() => {
                                        // Obtener client_info_id
                                        const clientInfoId = user.isUnregisteredClient ? user.id : (user.gym_memberships?.[0]?.client_info_id || null);
                                        
                                        // Obtener plan_id del último plan (activo o vencido)
                                        const latestMembership = user.gym_memberships?.length > 0
                                          ? user.gym_memberships.sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]
                                          : user.activeGymMembership;
                                        const planId = latestMembership?.plan?.id || null;
                                        
                                        const handleRegisterPayment = () => {
                                          // Cambiar a la pestaña de pagos
                                          setActiveTab('gym-payments');
                                          // Abrir el modal con cliente y plan prellenados
                                          setTimeout(() => {
                                            gymPaymentsRef.current?.openCreateModal(clientInfoId || undefined, planId || undefined);
                                          }, 100);
                                        };
                                        
                                        return (
                                          <button
                                            onClick={handleRegisterPayment}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Registrar pago"
                                          >
                                            <CreditCard className="w-4 h-4" />
                                          </button>
                                        );
                                      })()}
                                      <button
                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="Ver detalles"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => router.push(`/admin/users/${user.id}?edit=true`)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        title="Editar"
                                      >
                                        <Edit className="w-4 h-4" />
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
                            <span className="text-[#164151] dark:text-white font-medium">{startIndex + 1}</span>{' '}
                            a{' '}
                            <span className="text-[#164151] dark:text-white font-medium">
                              {Math.min(endIndex, totalUsers)}
                            </span>{' '}
                            de <span className="text-[#164151] dark:text-white font-medium">{totalUsers}</span>{' '}
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
                                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all text-sm cursor-pointer ${
                                        currentPage === i
                                          ? 'bg-[#85ea10] text-black font-semibold'
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
                    <h2 className="text-xl font-bold text-[#164151] dark:text-white">Historial de Ventas</h2>
                    <p className="text-sm text-gray-500 dark:text-white/60 mt-1">
                      {sales.length} {sales.length === 1 ? 'venta registrada' : 'ventas registradas'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por cliente, curso o plan..."
                        value={salesSearchTerm}
                        onChange={(e) => {
                          setSalesSearchTerm(e.target.value);
                          setSalesCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]"
                      />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                      <select
                        value={salesTypeFilter}
                        onChange={(e) => {
                          setSalesTypeFilter(e.target.value);
                          setSalesCurrentPage(1);
                        }}
                        className="pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
                      >
                        <option value="all">Todas las ventas</option>
                        <option value="online">Solo Online</option>
                        <option value="physical">Solo Físicas</option>
                      </select>
                    </div>
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
                    let filteredSales = sales.filter((sale) => {
                      const searchLower = salesSearchTerm.toLowerCase();
                      const matchesSearch =
                        sale.customer_name?.toLowerCase().includes(searchLower) ||
                        sale.customer_email?.toLowerCase().includes(searchLower) ||
                        sale.course?.title?.toLowerCase().includes(searchLower) ||
                        sale.gym_plan?.name?.toLowerCase().includes(searchLower) ||
                        sale.wompi_transaction_id?.toLowerCase().includes(searchLower);

                      // Filter by type
                      let matchesType = true;
                      if (salesTypeFilter === 'online') {
                        matchesType = Boolean(sale.order_type === 'course' || (!sale.order_type && sale.course_id));
                      } else if (salesTypeFilter === 'physical') {
                        matchesType = Boolean(sale.order_type === 'gym_plan' || sale.gym_plan_id);
                      }

                      return matchesSearch && matchesType;
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
                                  Producto
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
                                      <p className="font-medium text-[#164151] dark:text-white text-sm">
                                        {sale.customer_name || sale.profile?.name || 'Sin nombre'}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-white/40">
                                        {sale.customer_email || sale.profile?.email}
                                      </p>
                                    </div>
                                  </td>

                                  {/* Producto (Curso o Plan) */}
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      {sale.order_type === 'gym_plan' || sale.gym_plan_id ? (
                                        <>
                                          <div className="w-10 h-10 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/30 flex items-center justify-center">
                                            <Dumbbell className="w-5 h-5 text-[#85ea10]" />
                                          </div>
                                          <div>
                                            <p className="font-medium text-[#164151] dark:text-white text-sm max-w-[200px] truncate">
                                              {sale.gym_plan?.name || 'Plan físico'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-white/40">Plan físico</p>
                                          </div>
                                        </>
                                      ) : (
                                        <>
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
                                          <div>
                                            <p className="font-medium text-[#164151] dark:text-white text-sm max-w-[200px] truncate">
                                              {sale.course?.title || 'Curso eliminado'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-white/40">Curso online</p>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Monto */}
                                  <td className="py-4 px-4">
                                      <p className="font-semibold text-[#164151] dark:text-white text-sm">
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
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-medium text-[#164151]/90 dark:text-white/70">
                                      <CreditCard className="w-3 h-3" />
                                      {sale.payment_method || 'N/A'}
                                    </span>
                                  </td>

                                  {/* Fecha */}
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="text-sm text-[#164151] dark:text-white">
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
                                  : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
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
                                  : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
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
                                        : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
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
                                  : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
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
                                  : 'bg-gray-100 dark:bg-white/10 text-[#164151]/90 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer'
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

      {/* Gym Client Form Modal */}
      <GymClientForm
        isOpen={showClientForm}
        onClose={() => {
          setShowClientForm(false);
          setEditingClient(null);
        }}
        onSuccess={() => {
          setShowClientForm(false);
          setEditingClient(null);
          loadUsers();
        }}
        clientToEdit={editingClient}
      />

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
        <h3 className="text-base font-black text-[#164151] dark:text-white line-clamp-2 mb-2 uppercase tracking-tight">
          {course.title}
        </h3>

        <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60 line-clamp-2 mb-4">{course.short_description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/20">
            <p className="text-[10px] font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide mb-0.5">Precio</p>
            <p className="text-sm font-semibold text-[#164151] dark:text-white">
              ${course.price?.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/20">
            <p className="text-[10px] font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide mb-0.5">Duración</p>
            <p className="text-sm font-semibold text-[#164151] dark:text-white">{course.duration_days} días</p>
          </div>
          <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/20">
            <p className="text-[10px] font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide mb-0.5">Nivel</p>
            <p className="text-sm font-semibold text-[#164151] dark:text-white capitalize">{course.level}</p>
          </div>
          <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/20">
            <p className="text-[10px] font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide mb-0.5">Estudiantes</p>
            <p className="text-sm font-semibold text-[#164151] dark:text-white">{course.students_count}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20 text-[#164151] dark:text-white px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
        <p className="text-xs font-semibold text-[#164151]/80 dark:text-white/70">{message}</p>
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
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#164151]/70 dark:text-white/70" />
        </div>
        <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-2">{title}</h3>
        <p className="text-xs font-medium text-[#164151]/80 dark:text-white/60 mb-6 max-w-sm">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white/90 font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
