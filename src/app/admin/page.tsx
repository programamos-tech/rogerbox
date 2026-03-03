'use client';

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  BookOpen,
  Cake,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Code,
  CreditCard,
  DollarSign,
  Dumbbell,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
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
  RefreshCw,
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
  UserX,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import BannerManagement from '@/components/admin/BannerManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import ComplementManagement from '@/components/admin/ComplementManagement';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import GymClientForm from '@/components/admin/GymClientForm';
import GymPaymentsManagement, {
  type GymPaymentsManagementRef,
} from '@/components/admin/GymPaymentsManagement';
import GymPlansManagement, {
  type GymPlansManagementRef,
} from '@/components/admin/GymPlansManagement';
// Admin dashboard component
import QuickLoading from '@/components/QuickLoading';
import UnderConstruction from '@/components/UnderConstruction';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-browser';

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
  recentUsers: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  }[];
  recentSales: {
    id: string;
    customer_name: string;
    amount: number;
    status: string;
    created_at: string;
    course_title: string;
  }[];
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
        id: 'gym-plans',
        label: 'Planes',
        icon: Dumbbell,
        description: 'Gestionar planes del gimnasio',
      },
      {
        id: 'users',
        label: 'Clientes',
        icon: Users,
        description: 'Gestiona clientes de la sede física',
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
        label: 'Complementos',
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

function AdminDashboardContent() {
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all'); // 'all', 'physical', 'online', 'both'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all'); // 'all', 'active', 'renewal', 'no-products', 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userCounts, setUserCounts] = useState({
    total: 0,
    active: 0,
    renewal: 0,
    noProducts: 0,
    inactive: 0,
  });
  const usersPerPage = 20;
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
  const [productsModal, setProductsModal] = useState<{
    isOpen: boolean;
    user: any | null;
    position: { x: number; y: number } | null;
  }>({
    isOpen: false,
    user: null,
    position: null,
  });

  // Estados para el nuevo dashboard de ingresos
  const [revenueStats, setRevenueStats] = useState<{
    fisica?: {
      total: number;
      cash: number;
      transfer: number;
      mixed: number;
      count: number;
    };
    online?: {
      total: number;
      cash: number;
      transfer: number;
      mixed: number;
      count: number;
    };
    ambas?: {
      total: number;
      cash: number;
      transfer: number;
      mixed: number;
      count: number;
    };
  } | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sedeFilter, setSedeFilter] = useState<'fisica' | 'online' | 'ambas'>(
    'fisica',
  );
  const [showRevenueNumbers, setShowRevenueNumbers] = useState(true);
  const [weeklyData, setWeeklyData] = useState<
    { date: string; amount: number; dayName: string }[]
  >([]);
  const [loadingWeeklyData, setLoadingWeeklyData] = useState(false);
  const [dailyPayments, setDailyPayments] = useState<any[]>([]);
  const [loadingDailyPayments, setLoadingDailyPayments] = useState(false);
  const [birthdayClients, setBirthdayClients] = useState<any[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);

  // Parsear YYYY-MM-DD en hora local para que no cambie el día (evita UTC → 10 en vez de 11)
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
    const envEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com'; // fallback seguro
    const matchId = envId && user.id === envId;
    const matchEmail = envEmail && user.email === envEmail;
    const matchRole = user.user_metadata?.role === 'admin';
    return Boolean(matchId || matchEmail || matchRole);
  }, [user]);

  // Leer query param 'tab' y establecer activeTab al cargar
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = menuSections.flatMap((section) =>
      section.items.map((item) => item.id),
    );

    if (tabParam && validTabs.includes(tabParam)) {
      // Si hay un tab válido en la URL, usarlo
      setActiveTab(tabParam);
    } else if (!tabParam) {
      // Si no hay tab en la URL, establecer el default y actualizar la URL
      const defaultTab = 'overview';
      setActiveTab(defaultTab);
      // Solo actualizar la URL si realmente no hay parámetro (evitar loops)
      if (window.location.search !== `?tab=${defaultTab}`) {
        router.replace(`/admin?tab=${defaultTab}`, { scroll: false });
      }
    }
  }, [searchParams, router]);

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
      loadUsers('', 'all', 1);
    } else if (activeTab === 'sales') {
      loadSales();
    } else if (activeTab === 'overview') {
      // Cargar ingresos del día actual por defecto
      const today = new Date();
      // Usar fecha local en lugar de ISO para evitar problemas de zona horaria
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      loadRevenueStats(todayStr, todayStr, sedeFilter);
      loadWeeklyData();
      loadBirthdayClients(todayStr, todayStr);
    }
  }, [activeTab]);

  // Recargar usuarios cuando cambien filtros o página
  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(
        () => {
          loadUsers(userSearchTerm, paymentStatusFilter, currentPage);
        },
        userSearchTerm ? 300 : 0,
      ); // Debounce solo para búsqueda
      return () => clearTimeout(timeoutId);
    }
  }, [userSearchTerm, paymentStatusFilter, currentPage]);

  // Cargar ingresos cuando cambien los filtros
  useEffect(() => {
    if (activeTab === 'overview') {
      let startDate = '';
      let endDate = '';

      if (dateFilter === 'today') {
        const today = new Date();
        // Usar fecha local en lugar de ISO para evitar problemas de zona horaria
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        startDate = `${year}-${month}-${day}`;
        endDate = startDate;
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          return; // No cargar si no hay fechas personalizadas
        }
      }

      if (startDate && endDate) {
        loadRevenueStats(startDate, endDate, sedeFilter);
        // Cargar datos de la gráfica: usar fechas personalizadas si están disponibles, si no usar últimos 7 días
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          loadWeeklyData(customStartDate, customEndDate);
          loadDailyPayments(customStartDate, customEndDate);
          loadBirthdayClients(customStartDate, customEndDate);
        } else if (dateFilter === 'today') {
          loadWeeklyData(); // Sin parámetros = últimos 7 días por defecto
          loadDailyPayments(startDate, endDate);
          loadBirthdayClients(startDate, endDate);
        }
      }
    }
  }, [dateFilter, customStartDate, customEndDate, sedeFilter, activeTab]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueStats = async (
    startDate: string,
    endDate: string,
    sede: string,
  ) => {
    try {
      setLoadingRevenue(true);
      const response = await fetch(
        `/api/admin/revenue-stats?start_date=${startDate}&end_date=${endDate}&sede=${sede}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar ingresos');
      }

      // Convertir array de resultados a objeto por sede
      const statsBySede: {
        fisica?: {
          total: number;
          cash: number;
          transfer: number;
          mixed: number;
          count: number;
        };
        online?: {
          total: number;
          cash: number;
          transfer: number;
          mixed: number;
          count: number;
        };
        ambas?: {
          total: number;
          cash: number;
          transfer: number;
          mixed: number;
          count: number;
        };
      } = {};
      if (data.results) {
        data.results.forEach(
          (result: {
            sede: 'fisica' | 'online' | 'ambas';
            total: number;
            cash: number;
            transfer: number;
            mixed: number;
            count: number;
          }) => {
            const sede = result.sede;
            if (sede === 'fisica' || sede === 'online' || sede === 'ambas') {
              statsBySede[sede] = {
                total: result.total,
                cash: result.cash,
                transfer: result.transfer,
                mixed: result.mixed,
                count: result.count,
              };
            }
          },
        );
      }

      setRevenueStats(statsBySede);
    } catch (error) {
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadWeeklyData = async (
    customStartDate?: string,
    customEndDate?: string,
  ) => {
    try {
      setLoadingWeeklyData(true);
      let startDate: Date;
      let endDate: Date;

      if (customStartDate && customEndDate) {
        const [sy, sm, sd] = customStartDate.split('-').map(Number);
        const [ey, em, ed] = customEndDate.split('-').map(Number);
        startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      } else {
        const today = new Date();
        endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
          999,
        );
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
          0,
        );
        startDate.setDate(startDate.getDate() - 6);
      }

      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      // Una sola petición con desglose por día (evita 7–11 peticiones)
      const response = await fetch(
        `/api/admin/revenue-stats?start_date=${startStr}&end_date=${endStr}&sede=${sedeFilter}&group_by=day`,
      );
      const data = await response.json();

      const weeklyDataArray: {
        date: string;
        amount: number;
        dayName: string;
      }[] = [];
      const byDay = data.byDay || [];

      for (const day of byDay) {
        let totalAmount = 0;
        if (day.results) {
          const ambasData = day.results.find((r: any) => r.sede === 'ambas');
          const fisicaData = day.results.find((r: any) => r.sede === 'fisica');
          const onlineData = day.results.find((r: any) => r.sede === 'online');
          if (sedeFilter === 'ambas' && ambasData)
            totalAmount = ambasData.total;
          else if (sedeFilter === 'fisica' && fisicaData)
            totalAmount = fisicaData.total;
          else if (sedeFilter === 'online' && onlineData)
            totalAmount = onlineData.total;
        }
        const dateObj = new Date(day.date + 'T12:00:00');
        const dayName = dateObj.toLocaleDateString('es-ES', {
          weekday: 'short',
        });
        weeklyDataArray.push({
          date: day.date,
          amount: totalAmount,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        });
      }

      setWeeklyData(weeklyDataArray);
    } catch (error) {
    } finally {
      setLoadingWeeklyData(false);
    }
  };

  const loadDailyPayments = async (startDate: string, endDate: string) => {
    try {
      setLoadingDailyPayments(true);
      const allPayments: any[] = [];

      // Parsear fechas correctamente para evitar problemas de zona horaria
      // Las fechas vienen en formato YYYY-MM-DD
      const [startYear, startMonth, startDay] = startDate
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

      // Crear fechas locales sin problemas de zona horaria
      const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

      // Convertir a formato ISO para la consulta
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Cargar pagos de sede física si el filtro lo permite
      if (sedeFilter === 'fisica' || sedeFilter === 'ambas') {
        const { data: gymPayments, error: gymError } = await supabaseAdmin
          .from('gym_payments')
          .select(`
            *,
            client_info:gym_client_info(
              id,
              name,
              document_id,
              email,
              whatsapp
            ),
            plan:gym_plans(
              id,
              name,
              price,
              duration_days
            )
          `)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false });

        if (gymError) {
        } else if (gymPayments) {
          // Agregar tipo de sede a cada pago
          gymPayments.forEach((payment: any) => {
            allPayments.push({ ...payment, sede: 'fisica' });
          });
        }
      }

      // Cargar orders de sede online si el filtro lo permite
      if (sedeFilter === 'online' || sedeFilter === 'ambas') {
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select(`
            *,
            user:profiles(
              id,
              name,
              email
            ),
            course:courses(
              id,
              title
            )
          `)
          .eq('status', 'approved')
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false });

        if (ordersError) {
        } else if (orders) {
          // Transformar orders a formato similar a payments
          orders.forEach((order: any) => {
            allPayments.push({
              id: order.id,
              amount: order.amount,
              payment_method: 'transfer', // Orders siempre son transferencia
              payment_date: order.created_at.split('T')[0],
              created_at: order.created_at,
              invoice_number: null,
              client_info: {
                name: order.user?.name || 'Cliente online',
                document_id: null,
                email: order.user?.email || null,
              },
              plan: {
                name: order.course?.title || 'Curso online',
                price: order.amount,
                duration_days: null,
              },
              sede: 'online',
            });
          });
        }
      }

      // Ordenar todos los pagos por fecha de registro facturado (más recientes primero)
      allPayments.sort((a, b) => {
        const dateA = new Date(a.created_at || a.payment_date).getTime();
        const dateB = new Date(b.created_at || b.payment_date).getTime();
        return dateB - dateA;
      });

      setDailyPayments(allPayments);
    } catch (error) {
      setDailyPayments([]);
    } finally {
      setLoadingDailyPayments(false);
    }
  };

  const loadBirthdayClients = async (startDate?: string, endDate?: string) => {
    try {
      setLoadingBirthdays(true);

      // Determinar el rango de fechas a buscar
      let searchStartDate: Date;
      let searchEndDate: Date;

      if (startDate && endDate) {
        // Parsear fechas correctamente para evitar problemas de zona horaria
        // Las fechas vienen en formato YYYY-MM-DD, parsearlas como fecha local
        const [startYear, startMonth, startDay] = startDate
          .split('-')
          .map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

        searchStartDate = new Date(startYear, startMonth - 1, startDay);
        searchEndDate = new Date(endYear, endMonth - 1, endDay);

        // Si startDate y endDate son iguales, asegurarse de que searchEndDate sea el mismo día
        if (startDate === endDate) {
          searchEndDate = new Date(startYear, startMonth - 1, startDay);
        }
      } else {
        // Por defecto: hoy
        const today = new Date();
        searchStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        searchEndDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
      }

      searchStartDate.setHours(0, 0, 0, 0);
      searchEndDate.setHours(0, 0, 0, 0); // Cambiar a inicio del día para comparación correcta

      // Obtener todos los clientes con fecha de nacimiento
      const { data: clients, error } = await supabaseAdmin
        .from('gym_client_info')
        .select(`
          *,
          gym_memberships(
            id,
            status,
            plan:gym_plans(
              id,
              name
            )
          )
        `)
        .not('birth_date', 'is', null);

      if (error) {
        setBirthdayClients([]);
        return;
      }

      // Filtrar clientes que cumplen años en el rango de fechas seleccionado
      // Los cumpleaños se comparan por mes y día, no por año completo
      const birthdaysInRange = (clients || []).filter((client: any) => {
        if (!client.birth_date) return false;

        // Parsear fecha de nacimiento correctamente
        // La fecha puede venir como string ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) o como Date object
        let birthDateStr: string;
        if (typeof client.birth_date === 'string') {
          // Si viene como string, extraer solo la parte de la fecha YYYY-MM-DD
          // Manejar tanto formato '1982-02-16' como '1982-02-16T00:00:00.000Z'
          birthDateStr = client.birth_date.split('T')[0].split(' ')[0];

          // Validar que tenga el formato correcto YYYY-MM-DD
          if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
            return false;
          }
        } else {
          // Si es un objeto Date o timestamp, parsear como fecha local
          // IMPORTANTE: Usar métodos locales para evitar problemas de zona horaria
          const tempDate = new Date(client.birth_date);
          // Verificar que la fecha sea válida
          if (isNaN(tempDate.getTime())) {
            return false;
          }
          const year = tempDate.getFullYear();
          const month = String(tempDate.getMonth() + 1).padStart(2, '0');
          const day = String(tempDate.getDate()).padStart(2, '0');
          birthDateStr = `${year}-${month}-${day}`;
        }

        // Extraer mes y día directamente del string (evitar problemas de zona horaria)
        const parts = birthDateStr.split('-');
        if (parts.length !== 3) {
          return false;
        }

        // Parsear directamente del string sin crear objetos Date
        const birthYear = parseInt(parts[0], 10);
        const birthMonthNum = parseInt(parts[1], 10); // Mes (1-12)
        const birthDayNum = parseInt(parts[2], 10); // Día (1-31)

        // Validar que los valores sean válidos
        if (isNaN(birthYear) || isNaN(birthMonthNum) || isNaN(birthDayNum)) {
          return false;
        }

        if (
          birthMonthNum < 1 ||
          birthMonthNum > 12 ||
          birthDayNum < 1 ||
          birthDayNum > 31
        ) {
          return false;
        }

        // Crear un array de todas las fechas en el rango
        // Usar las fechas parseadas directamente sin crear objetos Date para evitar problemas de zona horaria
        const datesInRange: { month: number; day: number }[] = [];

        // Parsear fechas del rango desde los strings
        const [startYear, startMonth, startDay] = startDate
          ? startDate.split('-').map(Number)
          : [
              searchStartDate.getFullYear(),
              searchStartDate.getMonth() + 1,
              searchStartDate.getDate(),
            ];
        const [endYear, endMonth, endDay] = endDate
          ? endDate.split('-').map(Number)
          : [
              searchEndDate.getFullYear(),
              searchEndDate.getMonth() + 1,
              searchEndDate.getDate(),
            ];

        // Crear fechas locales sin problemas de zona horaria usando el constructor local
        // Usar directamente los valores parseados para evitar problemas de zona horaria
        let currentYear = startYear;
        let currentMonth = startMonth;
        let currentDayNum = startDay;

        // Comparar fechas usando números en lugar de objetos Date para evitar problemas de zona horaria
        const endDateNum = endYear * 10000 + endMonth * 100 + endDay;

        // Iterar día por día hasta llegar al día final (inclusive)
        while (true) {
          // Calcular el número de fecha actual
          const currentDateNum =
            currentYear * 10000 + currentMonth * 100 + currentDayNum;

          // Si ya pasamos la fecha final, salir del bucle
          if (currentDateNum > endDateNum) {
            break;
          }

          // Agregar la fecha actual al rango
          datesInRange.push({
            month: currentMonth,
            day: currentDayNum,
          });

          // Avanzar al siguiente día
          currentDayNum++;

          // Manejar cambio de mes
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
          if (currentDayNum > daysInMonth) {
            currentDayNum = 1;
            currentMonth++;
            // Manejar cambio de año
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            }
          }
        }

        // Verificar si el cumpleaños coincide con alguna fecha en el rango
        const matches = datesInRange.some(
          (date) => date.month === birthMonthNum && date.day === birthDayNum,
        );

        // Debug temporal para Ana Julia
        if (client.name && client.name.toLowerCase().includes('ana julia')) {
        }

        return matches;
      });

      // Calcular la edad de cada cliente usando la fecha de referencia (última fecha del rango o hoy)
      const referenceDate = endDate ? new Date(endDate) : new Date();
      const clientsWithAge = birthdaysInRange.map((client: any) => {
        const birthDate = new Date(client.birth_date);
        const age = referenceDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
        const dayDiff = referenceDate.getDate() - birthDate.getDate();

        // Ajustar edad si aún no ha cumplido años en la fecha de referencia
        const finalAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        return {
          ...client,
          age: finalAge,
          activeMembership: client.gym_memberships?.find(
            (m: any) => m.status === 'active',
          ),
        };
      });

      setBirthdayClients(clientsWithAge);
    } catch (error) {
      setBirthdayClients([]);
    } finally {
      setLoadingBirthdays(false);
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
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadUsers = async (search?: string, status?: string, page?: number) => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        page: String(page || currentPage),
        limit: String(usersPerPage),
        search: search ?? userSearchTerm,
        status: status ?? paymentStatusFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar clientes');
      }

      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setUserCounts(
        data.counts || {
          total: 0,
          active: 0,
          renewal: 0,
          noProducts: 0,
          inactive: 0,
        },
      );
    } catch (error) {
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
        `,
        )
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Luego obtenemos los perfiles de los usuarios
      const userIds = [
        ...new Set(ordersData?.map((order) => order.user_id).filter(Boolean)),
      ];

      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .in('id', userIds);

        if (profilesData) {
          profilesMap = profilesData.reduce(
            (acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            },
            {} as Record<string, any>,
          );
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
    } finally {
      setLoadingSales(false);
    }
  };

  const toggleCoursePublish = async (
    courseId: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, is_published: !currentStatus }
            : course,
        ),
      );
    } catch (error) {}
  };

  const editCourse = (courseId: string) => {
    router.push(`/admin/courses/${courseId}/edit`);
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

      // Primero eliminar lecciones relacionadas
      const { data: lessonsData, error: lessonsError } = await supabaseAdmin
        .from('course_lessons')
        .delete()
        .eq('course_id', courseId)
        .select();

      if (lessonsError) {
        throw new Error(`Error al eliminar lecciones: ${lessonsError.message}`);
      }
      // Usar API route del servidor (service_role key solo funciona en servidor)
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
      setCourses((prev) => prev.filter((course) => course.id !== courseId));

      // Cerrar el diálogo de confirmación sin mostrar modal de éxito
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al eliminar el curso. Por favor, inténtalo de nuevo.',
        type: 'danger',
        onConfirm: () =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
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
    return (
      <QuickLoading
        message="Cargando panel de administración..."
        duration={1000}
      />
    );
  }

  if (!loading && !user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#164151] dark:text-white mb-4">
            Acceso Denegado
          </h1>
          <p className="text-[#164151]/80 dark:text-gray-400">
            No tienes permisos para acceder a esta sección.
          </p>
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
                  const isActive = activeTab === item.id;
                  // Indicador especial para Usuarios (incluye ambas sedes)
                  const isUsersItem = item.id === 'users';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        router.push(`/admin?tab=${item.id}`, { scroll: false });
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
                  {user?.user_metadata?.name || profile?.name || 'Admin'}
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
            {/* Mobile menu button */}
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

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            {activeTab === 'courses' && (
              <button
                onClick={() => router.push('/admin/courses/new')}
                className="bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Curso</span>
              </button>
            )}

            {activeTab === 'users' && (
              <>
                <button
                  onClick={() => {
                    loadUsers();
                  }}
                  className="bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 font-semibold p-2.5 sm:px-5 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  title="Actualizar lista de clientes"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
                <button
                  onClick={() => {
                    setEditingClient(null);
                    setShowClientForm(true);
                  }}
                  className="bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold p-2.5 sm:px-5 sm:py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  title="Crear Cliente Físico"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear Cliente Físico</span>
                </button>
              </>
            )}

            {activeTab === 'gym-plans' && (
              <button
                onClick={() => {
                  gymPlansRef.current?.openCreateModal();
                }}
                className="bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Plan</span>
              </button>
            )}

            {activeTab === 'gym-payments' && (
              <>
                <button
                  onClick={() => {
                    gymPaymentsRef.current?.refresh();
                  }}
                  className="bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                  title="Actualizar lista de pagos"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
                <button
                  onClick={() => {
                    gymPaymentsRef.current?.openCreateModal();
                  }}
                  className="bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg hover:shadow-xl"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Registrar Pago</span>
                </button>
              </>
            )}

            {/* Powered by */}
            <a
              href="https://andresruss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-[#164151]/60 dark:text-white/50 hover:text-[#164151] dark:hover:text-white transition-colors mr-2"
            >
              <Zap className="w-3 h-3 text-[#85ea10]" />
              <span className="font-semibold">powered by</span>
              <span className="font-bold text-[#85ea10]">andresruss.st</span>
            </a>

            {/* Notifications */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-400 dark:bg-white/60 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20">
          {/* Overview Tab - Nuevo Dashboard de Ingresos */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Filtro de Sede */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-[#164151] dark:text-white">
                      Sede:
                    </label>
                    <select
                      value={sedeFilter}
                      onChange={(e) =>
                        setSedeFilter(
                          e.target.value as 'fisica' | 'online' | 'ambas',
                        )
                      }
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[#164151] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#164151]/50"
                    >
                      <option value="fisica">Física</option>
                      <option value="ambas" disabled className="text-gray-400">
                        Ambas (deshabilitado)
                      </option>
                      <option value="online" disabled className="text-gray-400">
                        En Línea (deshabilitado)
                      </option>
                    </select>
                  </div>

                  {/* Filtro de Fecha */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setShowRevenueNumbers(!showRevenueNumbers)
                        }
                        className="w-6 h-6 flex items-center justify-center text-[#164151]/70 dark:text-white/60 hover:text-[#164151] dark:hover:text-white transition-colors"
                        title={
                          showRevenueNumbers
                            ? 'Ocultar números'
                            : 'Mostrar números'
                        }
                      >
                        {showRevenueNumbers ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <label className="text-sm font-semibold text-[#164151] dark:text-white">
                        Período:
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDateFilter('today')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          dateFilter === 'today'
                            ? 'bg-[#164151] text-white'
                            : 'bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        onClick={() => setDateFilter('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          dateFilter === 'custom'
                            ? 'bg-[#164151] text-white'
                            : 'bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                        }`}
                      >
                        Personalizado
                      </button>
                    </div>

                    {/* Selector de fechas personalizadas: clic en todo el campo abre calendario, icono blanco */}
                    {dateFilter === 'custom' && (
                      <div className="flex items-center gap-2">
                        <div
                          className="relative flex items-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-[#164151]/50 cursor-pointer min-w-[140px]"
                          onClick={(e) => {
                            const target = (e.target as HTMLElement)
                              .closest('div')
                              ?.querySelector(
                                'input[type="date"]',
                              ) as HTMLInputElement | null;
                            target?.showPicker?.();
                          }}
                        >
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full pl-3 pr-9 py-2 rounded-lg bg-transparent text-[#164151] dark:text-white text-sm focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <Calendar className="absolute right-2.5 w-4 h-4 text-[#164151] dark:text-white pointer-events-none" />
                        </div>
                        <span className="text-gray-500 dark:text-white/50">
                          -
                        </span>
                        <div
                          className="relative flex items-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-[#164151]/50 cursor-pointer min-w-[140px]"
                          onClick={(e) => {
                            const target = (e.target as HTMLElement)
                              .closest('div')
                              ?.querySelector(
                                'input[type="date"]',
                              ) as HTMLInputElement | null;
                            target?.showPicker?.();
                          }}
                        >
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full pl-3 pr-9 py-2 rounded-lg bg-transparent text-[#164151] dark:text-white text-sm focus:outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <Calendar className="absolute right-2.5 w-4 h-4 text-[#164151] dark:text-white pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards de Ingresos */}
              {loadingRevenue ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164151] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500 dark:text-white/50">
                      Cargando ingresos...
                    </p>
                  </div>
                </div>
              ) : revenueStats ? (
                <>
                  {/* Dashboard Sede Física */}
                  {sedeFilter === 'fisica' && revenueStats.fisica && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Total */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#164151] dark:text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Total
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Ingresos totales de la sede física
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.fisica.total.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Efectivo */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-[#164151] dark:text-[#85ea10]" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Efectivo
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Pagos recibidos en efectivo
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.fisica.cash.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Transferencia */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Transferencia
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Pagos recibidos por transferencia bancaria
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.fisica.transfer.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Sede En Línea */}
                  {sedeFilter === 'online' && revenueStats.online && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Total */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#164151] dark:text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Total
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Ingresos totales de la sede en línea
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.online.total.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Pagos Online */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Pagos Online
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Pagos procesados electrónicamente
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.online.transfer.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Transacciones */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-[#85ea10] dark:text-[#85ea10]" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Transacciones
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Número total de ventas realizadas
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? revenueStats.online.count
                            : '•••'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Ambas Sedes (Resumen Combinado) */}
                  {sedeFilter === 'ambas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Total */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#164151] dark:text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Total
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Ingresos totales de ambas sedes
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${(revenueStats.ambas?.total || 0).toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Efectivo */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-[#164151] dark:text-[#85ea10]" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Efectivo
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Pagos en efectivo de la sede física
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${(revenueStats.ambas?.cash || 0).toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>

                      {/* Transferencia */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#164151]/70 dark:text-white/70" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Transferencia
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Transferencias y pagos online
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${(revenueStats.ambas?.transfer || 0).toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    No hay datos para mostrar
                  </p>
                </div>
              )}

              {/* Gráfica de Ventas Semanales */}
              {(dateFilter === 'today' || dateFilter === 'custom') && (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 px-6 pt-6 pb-2 shadow-lg mt-8">
                  <h3 className="text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wide mb-3">
                    {dateFilter === 'custom' && customStartDate && customEndDate
                      ? `Ventas del Período (${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${parseLocalDate(customEndDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })})`
                      : 'Ventas de la Última Semana'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/50 mb-12">
                    {dateFilter === 'custom' && customStartDate && customEndDate
                      ? `Visualización de los ingresos diarios del período seleccionado para analizar tendencias y patrones de venta`
                      : 'Visualización de los ingresos diarios de los últimos 7 días para analizar tendencias y patrones de venta'}
                  </p>

                  {loadingWeeklyData ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#164151]"></div>
                    </div>
                  ) : weeklyData.length > 0 ? (
                    <div className="relative mt-8">
                      {/* Gráfica */}
                      <div className="relative h-64 flex items-end justify-between gap-1 mb-0">
                        {weeklyData.map((day, index) => {
                          const maxAmount = Math.max(
                            ...weeklyData.map((d) => d.amount),
                            1,
                          );
                          const height =
                            maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                          const barHeight = Math.max(height, 8);

                          // Formatear fecha en hora local (evita que 11 se muestre como 10 por UTC)
                          const date = parseLocalDate(day.date);
                          const dayNumber = date.getDate();
                          const month = date.toLocaleDateString('es-ES', {
                            month: 'short',
                          });

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center gap-1 h-full relative group"
                            >
                              {/* Tooltip con fecha e ingresos */}
                              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-[#164151] dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                <p className="font-semibold mb-1">
                                  {day.dayName}, {dayNumber} {month}
                                </p>
                                <p className="text-[#85ea10] font-bold">
                                  {showRevenueNumbers
                                    ? `$${day.amount.toLocaleString('es-CO')}`
                                    : '••••••'}
                                </p>
                              </div>

                              {/* Valor sobre el punto */}
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-center w-full">
                                <p className="text-xs font-semibold text-[#164151] dark:text-white">
                                  {showRevenueNumbers
                                    ? `$${day.amount.toLocaleString('es-CO')}`
                                    : '••••'}
                                </p>
                              </div>

                              {/* Contenedor de la barra */}
                              <div className="flex-1 w-full flex items-end justify-center relative">
                                {/* Línea vertical */}
                                <div
                                  className="w-3/4 bg-[#164151]/20 dark:bg-[#85ea10]/20 rounded-t transition-all duration-500 relative cursor-pointer hover:bg-[#164151]/30 dark:hover:bg-[#85ea10]/30"
                                  style={{ height: `${barHeight}%` }}
                                >
                                  {/* Punto en la parte superior */}
                                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-[#85ea10] dark:bg-[#164151] rounded-full border-2 border-white dark:border-gray-900 shadow-md"></div>
                                </div>
                              </div>

                              {/* Nombre del día y fecha */}
                              <div className="text-center">
                                <p className="text-[10px] font-medium text-gray-500 dark:text-white/50">
                                  {day.dayName}
                                </p>
                                <p className="text-[9px] text-gray-400 dark:text-white/40">
                                  {dayNumber}/{date.getMonth() + 1}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Línea conectando los puntos */}
                      <svg
                        className="absolute top-8 left-0 right-0 h-40 pointer-events-none"
                        style={{ zIndex: 1 }}
                      >
                        <polyline
                          points={weeklyData
                            .map((day, index) => {
                              const maxAmount = Math.max(
                                ...weeklyData.map((d) => d.amount),
                                1,
                              );
                              const height =
                                maxAmount > 0
                                  ? (day.amount / maxAmount) * 100
                                  : 0;
                              const barHeight = Math.max(height, 8);
                              const x =
                                ((index + 0.5) / weeklyData.length) * 100;
                              const y = 100 - barHeight;
                              return `${x}%,${y}%`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="text-[#85ea10]/40 dark:text-[#164151]/40"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        No hay datos para mostrar
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Facturas del Período y Cumpleaños - Grid de 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Lista de Facturas del Período */}
                {(dateFilter === 'today' || dateFilter === 'custom') && (
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 px-6 pt-6 pb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wide">
                          Facturas del Período
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                          {dateFilter === 'custom' &&
                          customStartDate &&
                          customEndDate
                            ? `Facturas emitidas del ${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} al ${parseLocalDate(customEndDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                            : `Facturas emitidas hoy (${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })})`}
                        </p>
                      </div>
                      {dailyPayments.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            Total facturas
                          </p>
                          <p className="text-lg font-bold text-[#164151] dark:text-white">
                            {dailyPayments.length}
                          </p>
                        </div>
                      )}
                    </div>

                    {loadingDailyPayments ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164151] mx-auto mb-4"></div>
                          <p className="text-sm text-gray-500 dark:text-white/50">
                            Cargando facturas...
                          </p>
                        </div>
                      </div>
                    ) : dailyPayments.length > 0 ? (
                      <div className="space-y-3 mt-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                        {dailyPayments.map((payment) => {
                          // Usar created_at (fecha de registro facturado) como prioridad
                          const paymentDate = new Date(
                            payment.created_at || payment.payment_date,
                          );
                          const paymentMethodLabels: { [key: string]: string } =
                            {
                              cash: 'Efectivo',
                              transfer: 'Transferencia',
                              mixed: 'Mixto',
                            };

                          // Determinar nombre del cliente y documento según la sede
                          const clientName =
                            payment.sede === 'online'
                              ? payment.user?.name ||
                                payment.client_info?.name ||
                                'Cliente online'
                              : payment.client_info?.name ||
                                'Cliente sin nombre';
                          const clientDoc =
                            payment.sede === 'online'
                              ? payment.user?.email || 'Sin documento'
                              : payment.client_info?.document_id ||
                                'Sin documento';
                          const planName =
                            payment.plan?.name ||
                            payment.course?.title ||
                            'Producto no disponible';

                          return (
                            <div
                              key={payment.id}
                              className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
                                      <User className="w-5 h-5 text-[#164151] dark:text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-[#164151] dark:text-white">
                                          {clientName}
                                        </p>
                                        {payment.sede && (
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                              payment.sede === 'fisica'
                                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                                : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                                            }`}
                                          >
                                            {payment.sede === 'fisica'
                                              ? 'Física'
                                              : 'Online'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-white/50">
                                        {clientDoc}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mt-3 ml-13">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                        {payment.sede === 'online'
                                          ? 'Curso/Plan'
                                          : 'Plan'}
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                                        {planName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                        Método de pago
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                                        {paymentMethodLabels[
                                          payment.payment_method
                                        ] ||
                                          payment.payment_method ||
                                          'Transferencia'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                        Fecha
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                                        {payment.payment_date &&
                                        /^\d{4}-\d{2}-\d{2}$/.test(
                                          payment.payment_date,
                                        )
                                          ? formatDateOnlyLocal(
                                              payment.payment_date,
                                              {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                              },
                                              'es-ES',
                                            )
                                          : paymentDate.toLocaleDateString(
                                              'es-ES',
                                              {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                              },
                                            )}
                                      </p>
                                    </div>
                                    {payment.invoice_number && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                          Factura
                                        </p>
                                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                                          #{payment.invoice_number}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-4 text-right">
                                  <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                    Monto
                                  </p>
                                  <p className="text-xl font-bold text-[#85ea10]">
                                    {showRevenueNumbers
                                      ? `$${Number(payment.amount).toLocaleString('es-CO')}`
                                      : '••••••'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                        <p className="text-sm text-gray-500 dark:text-white/50">
                          No se encontraron facturas para este período
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Clientes que Cumplen Años Hoy */}
                {activeTab === 'overview' && (
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 px-6 pt-6 pb-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#164151] dark:text-white uppercase tracking-wide">
                            🎉 Cumpleaños
                            {dateFilter === 'custom' &&
                            customStartDate &&
                            customEndDate
                              ? customStartDate === customEndDate
                                ? ` del ${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`
                                : ` del ${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} al ${parseLocalDate(customEndDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`
                              : ' de Hoy'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                            {dateFilter === 'custom' &&
                            customStartDate &&
                            customEndDate
                              ? customStartDate === customEndDate
                                ? `Clientes que cumplen años el ${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                : `Clientes que cumplen años entre el ${parseLocalDate(customStartDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} y el ${parseLocalDate(customEndDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`
                              : `Clientes que cumplen años hoy (${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })})`}
                          </p>
                        </div>
                      </div>
                      {birthdayClients.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            Total
                          </p>
                          <p className="text-lg font-bold text-[#164151] dark:text-white">
                            {birthdayClients.length}
                          </p>
                        </div>
                      )}
                    </div>

                    {loadingBirthdays ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164151] mx-auto mb-4"></div>
                          <p className="text-sm text-gray-500 dark:text-white/50">
                            Cargando cumpleaños...
                          </p>
                        </div>
                      </div>
                    ) : birthdayClients.length > 0 ? (
                      <div className="space-y-3 mt-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                        {birthdayClients.map((client) => {
                          // Parsear fecha de nacimiento correctamente para evitar problemas de zona horaria
                          let birthDateStr: string;
                          if (typeof client.birth_date === 'string') {
                            birthDateStr = client.birth_date.split('T')[0];
                          } else {
                            const tempDate = new Date(client.birth_date);
                            const year = tempDate.getFullYear();
                            const month = String(
                              tempDate.getMonth() + 1,
                            ).padStart(2, '0');
                            const day = String(tempDate.getDate()).padStart(
                              2,
                              '0',
                            );
                            birthDateStr = `${year}-${month}-${day}`;
                          }

                          // Extraer día y mes directamente del string para evitar problemas de zona horaria
                          const parts = birthDateStr.split('-');
                          const birthYear = parseInt(parts[0], 10);
                          const birthMonth = parseInt(parts[1], 10);
                          const birthDay = parseInt(parts[2], 10);

                          // Formatear directamente sin crear objeto Date para evitar problemas de zona horaria
                          const monthNames = [
                            'enero',
                            'febrero',
                            'marzo',
                            'abril',
                            'mayo',
                            'junio',
                            'julio',
                            'agosto',
                            'septiembre',
                            'octubre',
                            'noviembre',
                            'diciembre',
                          ];
                          const formattedBirthday = `${birthDay} de ${monthNames[birthMonth - 1]}`;

                          return (
                            <div
                              key={client.id}
                              className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center text-[#164151] dark:text-white font-bold text-lg border-2 border-[#85ea10]/30">
                                      {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-lg text-[#164151] dark:text-white">
                                          {client.name}
                                        </p>
                                        <span className="text-xs px-2 py-1 rounded-full bg-[#85ea10]/20 dark:bg-[#85ea10]/20 text-[#164151] dark:text-[#85ea10] font-semibold">
                                          🎂 {client.age} años
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                                        {client.document_id || 'Sin documento'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mt-3 ml-13">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                        Fecha de nacimiento
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white">
                                        {formattedBirthday}
                                      </p>
                                    </div>
                                    {client.whatsapp && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                          WhatsApp
                                        </p>
                                        <button
                                          onClick={() => {
                                            const phoneNumber =
                                              client.whatsapp.replace(
                                                /\D/g,
                                                '',
                                              );
                                            const message = encodeURIComponent(
                                              `Hola ${client.name}! Felicidades desde Rogerbox, gracias por hacer parte de este equipo. ¡Que tengas un excelente día!`,
                                            );
                                            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                                            window.open(whatsappUrl, '_blank');
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg text-sm font-medium transition-all hover:shadow-md group"
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                          <span>{client.whatsapp}</span>
                                        </button>
                                      </div>
                                    )}
                                    {client.email && (
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-white/50 mb-1">
                                          Email
                                        </p>
                                        <p className="text-sm font-medium text-[#164151] dark:text-white">
                                          {client.email}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-4 text-center">
                                  <div className="w-12 h-12 rounded-full bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center border-2 border-[#85ea10]/30">
                                    <Cake className="w-6 h-6 text-[#85ea10]" />
                                  </div>
                                  <p className="text-xs text-[#164151] dark:text-white font-semibold mt-2">
                                    ¡Feliz Cumpleaños!
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Cake className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                        <p className="text-sm text-gray-500 dark:text-white/50">
                          No hay clientes que cumplan años hoy
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40 mt-2">
                          ¡Que tengas un excelente día! 🎉
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {loadingCourses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <LoadingState key={i} message="Cargando cursos..." />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No hay cursos"
                  description="Crea tu primer curso para que los usuarios puedan verlo en el dashboard."
                  action={{
                    label: 'Crear Curso',
                    onClick: () => router.push('/admin/courses/new'),
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={() => editCourse(course.id)}
                      onDelete={() => deleteCourse(course.id, course.title)}
                      onTogglePublish={() =>
                        toggleCoursePublish(course.id, course.is_published)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blogs Tab */}
          {activeTab === 'blogs' && (
            <UnderConstruction
              title="Blog Nutricional"
              icon={FileText}
              description="El sistema de artículos y blogs está recibiendo una actualización de diseño. ¡Vuelve pronto para publicar contenido!"
            />
          )}

          {/* Complements Tab */}
          {activeTab === 'complements' && <ComplementManagement />}

          {/* Banners Tab */}
          {activeTab === 'banners' && (
            <UnderConstruction
              title="Banners"
              icon={Image}
              description="El editor de banners y publicidad del dashboard está siendo renovado."
            />
          )}

          {/* Gym Plans Tab */}
          {activeTab === 'gym-plans' && (
            <GymPlansManagement ref={gymPlansRef} />
          )}

          {/* Gym Payments Tab */}
          {activeTab === 'gym-payments' && (
            <GymPaymentsManagement ref={gymPaymentsRef} />
          )}

          {/* Gym Collections Tab */}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Status Summary - Compact */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setPaymentStatusFilter(
                      paymentStatusFilter === 'active' ? 'all' : 'active',
                    );
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentStatusFilter === 'active' ? 'bg-[#85ea10] text-[#164151]' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-[#85ea10]/20'}`}
                >
                  <span className="font-bold">{userCounts.active}</span> Al día
                </button>
                <button
                  onClick={() => {
                    setPaymentStatusFilter(
                      paymentStatusFilter === 'renewal' ? 'all' : 'renewal',
                    );
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentStatusFilter === 'renewal' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-orange-500/20'}`}
                >
                  <span className="font-bold">{userCounts.renewal}</span>{' '}
                  Renovar
                </button>
                <button
                  onClick={() => {
                    setPaymentStatusFilter(
                      paymentStatusFilter === 'no-products'
                        ? 'all'
                        : 'no-products',
                    );
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentStatusFilter === 'no-products' ? 'bg-gray-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-500/20'}`}
                >
                  <span className="font-bold">{userCounts.noProducts}</span> Sin
                  productos
                </button>
                <button
                  onClick={() => {
                    setPaymentStatusFilter(
                      paymentStatusFilter === 'inactive' ? 'all' : 'inactive',
                    );
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${paymentStatusFilter === 'inactive' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-red-500/20'}`}
                >
                  <span className="font-bold">{userCounts.inactive}</span>{' '}
                  Inactivos
                </button>
                {paymentStatusFilter !== 'all' && (
                  <button
                    onClick={() => {
                      setPaymentStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-white/20 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/30 transition-all"
                  >
                    Ver todos ({userCounts.total})
                  </button>
                )}
              </div>

              {/* Search and Filters Bar */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                    <input
                      type="text"
                      placeholder="Buscar por cédula, nombre o correo..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 focus:border-[#85ea10]/50 transition-all"
                    />
                  </div>

                  {/* Filters - Side by side on mobile, flexible on larger screens */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4">
                    {/* Type Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                      <select
                        value={userTypeFilter}
                        onChange={(e) => {
                          setUserTypeFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-8 sm:pl-12 pr-4 sm:pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[11px] sm:text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
                      >
                        <option value="all">Clientes: Todos</option>
                        <option value="physical">Solo físicos</option>
                        <option value="online">Solo online</option>
                        <option value="both">Ambos</option>
                      </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => {
                          setPaymentStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-8 sm:pl-12 pr-4 sm:pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[11px] sm:text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50 appearance-none cursor-pointer"
                      >
                        <option value="all">Estado: Todos</option>
                        <option value="active">Al día</option>
                        <option value="renewal">Renovar</option>
                        <option value="no-products">Sin productos</option>
                        <option value="inactive">Inactivos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                {loadingUsers ? (
                  <LoadingState message="Cargando clientes..." />
                ) : users.length === 0 ? (
                  <EmptyState
                    icon={userSearchTerm ? Search : Users}
                    title={
                      userSearchTerm
                        ? 'No se encontraron clientes'
                        : 'No hay clientes registrados'
                    }
                    description={
                      userSearchTerm
                        ? `No hay clientes que coincidan con "${userSearchTerm}"`
                        : 'Los clientes aparecerán aquí cuando se registren'
                    }
                  />
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Documento
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Productos
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              WhatsApp
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="text-right px-3 md:px-4 py-3 md:py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {users.map((user) => {
                            // Calcular si tiene más de 30 días sin pagar
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const allMemberships = user.gym_memberships || [];
                            const expiredMemberships = allMemberships.filter(
                              (m: any) => {
                                const endDate = new Date(m.end_date);
                                endDate.setHours(0, 0, 0, 0);
                                return endDate < today;
                              },
                            );
                            const latestExpired =
                              expiredMemberships.length > 0
                                ? expiredMemberships.sort(
                                    (a: any, b: any) =>
                                      new Date(b.end_date).getTime() -
                                      new Date(a.end_date).getTime(),
                                  )[0]
                                : null;
                            const daysSinceExpired = latestExpired
                              ? Math.floor(
                                  (today.getTime() -
                                    new Date(
                                      latestExpired.end_date,
                                    ).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                )
                              : 0;
                            const hasExpiredMoreThan30Days =
                              daysSinceExpired > 30;
                            const isInactive = user.is_inactive || false;
                            // Solo mostrar botón de inactivar si tiene más de 30 días PERO NO está inactivo aún
                            const shouldShowInactiveButton =
                              hasExpiredMoreThan30Days && !isInactive;
                            const isAdminUser =
                              user.email === 'rogerbox@admin.com' ||
                              user.email ===
                                process.env.NEXT_PUBLIC_ADMIN_EMAIL;

                            return (
                              <tr
                                key={user.id}
                                onClick={() =>
                                  !isAdminUser &&
                                  router.push(`/admin/users/${user.id}`)
                                }
                                className={`${isAdminUser ? '' : 'hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer hover:border-[#85ea10]/30'} transition-all group border-l-4 border-transparent ${
                                  isInactive
                                    ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30'
                                    : ''
                                }`}
                              >
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-[#164151] dark:text-white truncate">
                                        {user.name ||
                                          user.full_name ||
                                          'Sin nombre'}
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
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  {user.document_id ? (
                                    <div className="flex items-center gap-1.5">
                                      <CreditCard className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs font-medium text-[#164151] dark:text-white">
                                        {user.document_id}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400 dark:text-white/40">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);

                                      // Obtener todas las membresías físicas
                                      const allMemberships =
                                        user.gym_memberships || [];

                                      // Obtener todos los cursos activos
                                      const allCourses =
                                        user.activeCoursePurchases || [];

                                      // Si no tiene productos
                                      if (
                                        allMemberships.length === 0 &&
                                        allCourses.length === 0
                                      ) {
                                        return (
                                          <span className="text-sm font-medium text-gray-500 dark:text-white/50">
                                            Sin productos
                                          </span>
                                        );
                                      }

                                      // Calcular estados
                                      const activeMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate >= today &&
                                            m.status !== 'cancelled'
                                          );
                                        });
                                      const expiredMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate < today &&
                                            m.status !== 'cancelled'
                                          );
                                        });

                                      // Construir lista completa de productos con estados
                                      const allProducts: Array<{
                                        name: string;
                                        type: 'membership' | 'course';
                                        isActive: boolean;
                                        isCancelled?: boolean;
                                        isScheduled?: boolean;
                                        membership?: any;
                                      }> = [];

                                      // Membresías canceladas (para mostrar al final)
                                      const cancelledMemberships =
                                        allMemberships.filter(
                                          (m: any) => m.status === 'cancelled',
                                        );

                                      // 1. Primero: Agregar membresías activas actuales (no programadas)
                                      activeMemberships.forEach((m: any) => {
                                        const startDate = new Date(
                                          m.start_date,
                                        );
                                        startDate.setHours(0, 0, 0, 0);
                                        const isScheduled = startDate > today;

                                        if (!isScheduled) {
                                          allProducts.push({
                                            name: m.plan?.name || 'Plan',
                                            type: 'membership',
                                            isActive: true,
                                            membership: m,
                                          });
                                        }
                                      });

                                      // 2. Segundo: Agregar membresías programadas (pagos anticipados)
                                      activeMemberships.forEach((m: any) => {
                                        const startDate = new Date(
                                          m.start_date,
                                        );
                                        startDate.setHours(0, 0, 0, 0);
                                        const isScheduled = startDate > today;

                                        if (isScheduled) {
                                          allProducts.push({
                                            name: m.plan?.name || 'Plan',
                                            type: 'membership',
                                            isActive: true,
                                            isScheduled: true,
                                            membership: m,
                                          });
                                        }
                                      });

                                      // 3. Tercero: Agregar membresías vencidas (para renovar)
                                      expiredMemberships.forEach((m: any) => {
                                        allProducts.push({
                                          name: m.plan?.name || 'Plan',
                                          type: 'membership',
                                          isActive: false,
                                          membership: m,
                                        });
                                      });

                                      // 4. Cuarto: Agregar membresías canceladas
                                      cancelledMemberships.forEach((m: any) => {
                                        allProducts.push({
                                          name: m.plan?.name || 'Plan',
                                          type: 'membership',
                                          isActive: false,
                                          isCancelled: true,
                                          membership: m,
                                        });
                                      });

                                      // Agregar cursos
                                      allCourses.forEach((p: any) => {
                                        allProducts.push({
                                          name: p.course?.title || 'Curso',
                                          type: 'course',
                                          isActive: true,
                                        });
                                      });

                                      // Obtener el primer producto para mostrar
                                      const firstProduct =
                                        allProducts.length > 0
                                          ? allProducts[0]
                                          : null;
                                      const hasMoreProducts =
                                        allProducts.length > 1;

                                      const handleClick = (
                                        e: React.MouseEvent<HTMLButtonElement>,
                                      ) => {
                                        const rect =
                                          e.currentTarget.getBoundingClientRect();
                                        const popoverWidth = 288; // w-72 = 288px
                                        const spaceOnRight =
                                          window.innerWidth - rect.right;
                                        const spaceOnLeft = rect.left;

                                        // Decidir si mostrar a la derecha o izquierda
                                        const showOnRight =
                                          spaceOnRight >= popoverWidth ||
                                          spaceOnRight > spaceOnLeft;

                                        setProductsModal({
                                          isOpen: true,
                                          user: { ...user, allProducts },
                                          position: {
                                            x: showOnRight
                                              ? rect.right + 8
                                              : rect.left - popoverWidth - 8, // 8px de separación
                                            y: rect.top, // Alineado con el elemento
                                          },
                                        });
                                      };

                                      if (!firstProduct) {
                                        return (
                                          <span className="text-sm font-medium text-gray-500 dark:text-white/50">
                                            Sin productos
                                          </span>
                                        );
                                      }

                                      return (
                                        <button
                                          onClick={handleClick}
                                          className="text-left hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
                                          title={
                                            hasMoreProducts
                                              ? `Ver todos los productos (${allProducts.length})`
                                              : undefined
                                          }
                                        >
                                          <span className="text-sm font-medium text-[#164151] dark:text-white">
                                            {firstProduct.name}
                                          </span>
                                          {hasMoreProducts && (
                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                              +{allProducts.length - 1}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  <div>
                                    {user.userType === 'both' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#164151]/15 text-[#164151] dark:bg-white/10 dark:text-white/70">
                                        Ambos
                                      </span>
                                    )}
                                    {user.userType === 'physical' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#164151]/15 text-[#164151] dark:bg-white/10 dark:text-white/70">
                                        <Dumbbell className="w-3 h-3" />
                                        Físico
                                      </span>
                                    )}
                                    {user.userType === 'online' && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400">
                                        <Globe className="w-3 h-3" />
                                        Online
                                      </span>
                                    )}
                                    {user.userType === 'none' && (
                                      <span className="text-xs text-gray-400 dark:text-white/40">
                                        -
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-3 md:py-4">
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
                                    <span className="text-xs text-gray-400 dark:text-white/40">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  <div>
                                    {(() => {
                                      // Si está inactivo, siempre mostrar "Inactivo" primero
                                      if (user.is_inactive) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                            <X className="w-3 h-3" />
                                            Inactivo
                                          </span>
                                        );
                                      }

                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);

                                      // Obtener todas las membresías físicas
                                      const allMemberships =
                                        user.gym_memberships || [];

                                      // Obtener todos los cursos activos
                                      const allCourses =
                                        user.activeCoursePurchases || [];

                                      // Si no tiene productos
                                      if (
                                        allMemberships.length === 0 &&
                                        allCourses.length === 0
                                      ) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                                            <AlertCircle className="w-3 h-3" />
                                            Sin pagos
                                          </span>
                                        );
                                      }

                                      // Calcular estados de membresías físicas
                                      const activeMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate >= today &&
                                            m.status !== 'cancelled'
                                          );
                                        });
                                      const expiredMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate < today &&
                                            m.status !== 'cancelled'
                                          );
                                        });

                                      // Membresías canceladas
                                      const cancelledMemberships =
                                        allMemberships.filter(
                                          (m: any) => m.status === 'cancelled',
                                        );
                                      const hasOnlyCancelled =
                                        cancelledMemberships.length > 0 &&
                                        activeMemberships.length === 0 &&
                                        expiredMemberships.length === 0;

                                      // Si solo tiene membresías canceladas
                                      if (hasOnlyCancelled) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400">
                                            <X className="w-3 h-3" />
                                            Cancelado
                                          </span>
                                        );
                                      }

                                      // Si solo tiene cursos online
                                      if (
                                        allMemberships.length === 0 &&
                                        allCourses.length > 0
                                      ) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle className="w-3 h-3" />
                                            Al día
                                          </span>
                                        );
                                      }

                                      // Si solo tiene membresías físicas (no canceladas)
                                      const nonCancelledMemberships =
                                        allMemberships.filter(
                                          (m: any) => m.status !== 'cancelled',
                                        );
                                      if (
                                        nonCancelledMemberships.length > 0 &&
                                        allCourses.length === 0
                                      ) {
                                        // Todos activos
                                        if (
                                          activeMemberships.length ===
                                            nonCancelledMemberships.length &&
                                          expiredMemberships.length === 0
                                        ) {
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                              <CheckCircle className="w-3 h-3" />
                                              Al día
                                            </span>
                                          );
                                        }
                                        // Todos vencidos
                                        if (
                                          expiredMemberships.length ===
                                            nonCancelledMemberships.length &&
                                          activeMemberships.length === 0
                                        ) {
                                          // Siempre mostrar "Renovar" cuando está vencido (no importa cuántos días)
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                              <AlertTriangle className="w-3 h-3" />
                                              Renovar
                                            </span>
                                          );
                                        }
                                        // Mezcla: algunos activos, algunos vencidos
                                        if (
                                          activeMemberships.length > 0 &&
                                          expiredMemberships.length > 0
                                        ) {
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                              <Bell className="w-3 h-3" />
                                              Parcial
                                            </span>
                                          );
                                        }
                                      }

                                      // Si tiene ambos (físico y online)
                                      if (
                                        nonCancelledMemberships.length > 0 &&
                                        allCourses.length > 0
                                      ) {
                                        // Si todas las membresías están activas
                                        if (
                                          activeMemberships.length ===
                                            nonCancelledMemberships.length &&
                                          expiredMemberships.length === 0
                                        ) {
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                              <CheckCircle className="w-3 h-3" />
                                              Al día
                                            </span>
                                          );
                                        }
                                        // Si hay membresías vencidas (aunque tenga cursos activos)
                                        if (expiredMemberships.length > 0) {
                                          return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                              <Bell className="w-3 h-3" />
                                              Parcial
                                            </span>
                                          );
                                        }
                                      }

                                      // Fallback
                                      return (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                                          <AlertCircle className="w-3 h-3" />
                                          Sin pagos
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-3 md:py-4">
                                  <div
                                    className="flex items-center justify-end gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Botón Recordatorio/Inactivar - visible solo cuando tiene estado "Renovar" (planes vencidos) */}
                                    {(() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);

                                      // Calcular estados de membresías
                                      const allMemberships =
                                        user.gym_memberships || [];
                                      const activeMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate >= today &&
                                            m.status !== 'cancelled'
                                          );
                                        });
                                      const expiredMemberships =
                                        allMemberships.filter((m: any) => {
                                          const endDate = new Date(m.end_date);
                                          endDate.setHours(0, 0, 0, 0);
                                          return (
                                            endDate < today &&
                                            m.status !== 'cancelled'
                                          );
                                        });

                                      const isInactive =
                                        user.is_inactive || false;

                                      // Solo mostrar si:
                                      // 1. Tiene planes vencidos (estado "Renovar")
                                      // 2. NO tiene planes activos
                                      // 3. Tiene contacto
                                      // 4. NO está inactivo
                                      const hasOnlyExpiredMemberships =
                                        expiredMemberships.length > 0 &&
                                        activeMemberships.length === 0;

                                      if (
                                        !hasOnlyExpiredMemberships ||
                                        !(user.whatsapp || user.phone) ||
                                        isInactive
                                      ) {
                                        return null;
                                      }

                                      // Calcular días desde que venció
                                      const latestExpired =
                                        expiredMemberships.sort(
                                          (a: any, b: any) =>
                                            new Date(b.end_date).getTime() -
                                            new Date(a.end_date).getTime(),
                                        )[0];
                                      const expiredDate = new Date(
                                        latestExpired.end_date,
                                      );
                                      expiredDate.setHours(0, 0, 0, 0);
                                      const daysSinceExpired = Math.floor(
                                        (today.getTime() -
                                          expiredDate.getTime()) /
                                          (1000 * 60 * 60 * 24),
                                      );

                                      // Si tiene más de 30 días sin pagar, mostrar botón "Inactivar" en rojo
                                      if (daysSinceExpired > 30) {
                                        const clientInfoId =
                                          user.isUnregisteredClient
                                            ? user.id
                                            : user.client_info_id ||
                                              user.gym_memberships?.[0]
                                                ?.client_info_id ||
                                              null;

                                        if (!clientInfoId) return null;

                                        const handleInactivate = async (
                                          e: React.MouseEvent,
                                        ) => {
                                          e.stopPropagation();

                                          if (
                                            !confirm(
                                              `¿Estás seguro de inactivar a ${user.name || user.full_name || 'este usuario'}?`,
                                            )
                                          ) {
                                            return;
                                          }

                                          try {
                                            const response = await fetch(
                                              `/api/admin/gym/clients/${clientInfoId}/toggle-inactive`,
                                              {
                                                method: 'PATCH',
                                                headers: {
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  is_inactive: true,
                                                }),
                                              },
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                'Error al actualizar estado',
                                              );
                                            }

                                            // Recargar usuarios
                                            loadUsers();
                                          } catch (error) {
                                            alert(
                                              'Error al inactivar el usuario',
                                            );
                                          }
                                        };

                                        return (
                                          <button
                                            onClick={handleInactivate}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                            title="Inactivar usuario (30 días sin pagar)"
                                          >
                                            <Ban className="w-4 h-4" />
                                          </button>
                                        );
                                      }

                                      // Menos de 30 días, mostrar botón "Recordatorio" normal
                                      const latestMembership =
                                        allMemberships.length > 0
                                          ? allMemberships.sort(
                                              (a: any, b: any) =>
                                                new Date(b.end_date).getTime() -
                                                new Date(a.end_date).getTime(),
                                            )[0]
                                          : null;
                                      const planName =
                                        latestMembership?.plan?.name ||
                                        'tu plan';
                                      const endDate = latestMembership?.end_date
                                        ? new Date(
                                            latestMembership.end_date,
                                          ).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                          })
                                        : 'la fecha indicada';

                                      const handleReminder = () => {
                                        const clientName =
                                          user.name ||
                                          user.full_name ||
                                          'Cliente';
                                        const whatsappNumber = (
                                          user.whatsapp ||
                                          user.phone ||
                                          ''
                                        ).replace(/\D/g, '');

                                        if (!whatsappNumber) return;

                                        const message = encodeURIComponent(
                                          `Hola ${clientName}, tu plan "${planName}" venció el ${endDate}. ¿Deseas renovarlo?`,
                                        );

                                        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                                        window.open(whatsappUrl, '_blank');
                                      };

                                      return (
                                        <button
                                          onClick={handleReminder}
                                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                          title="Enviar recordatorio de renovación"
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                        </button>
                                      );
                                    })()}
                                    {!isAdminUser && (
                                      <>
                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/admin/users/${user.id}`,
                                            )
                                          }
                                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                          title="Ver detalles"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/admin/users/${user.id}?edit=true`,
                                            )
                                          }
                                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                          title="Editar"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Card view para móviles */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                      {users.map((user) => {
                        // Calcular estados para la tarjeta
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const memberships = user.gym_memberships || [];
                        const activeMemberships = memberships.filter(
                          (m: any) => {
                            const endDate = new Date(m.end_date);
                            endDate.setHours(0, 0, 0, 0);
                            return endDate >= today && m.status !== 'cancelled';
                          },
                        );
                        const nonCancelledMemberships = memberships.filter(
                          (m: any) => m.status !== 'cancelled',
                        );
                        const cancelledMemberships = memberships.filter(
                          (m: any) => m.status === 'cancelled',
                        );
                        const hasActive = activeMemberships.length > 0;
                        const hasExpired =
                          nonCancelledMemberships.length > 0 && !hasActive;
                        const hasOnlyCancelled =
                          cancelledMemberships.length > 0 &&
                          nonCancelledMemberships.length === 0;

                        let statusColor = 'border-gray-300';
                        let statusBadge = null;

                        if (user.is_inactive) {
                          statusColor = 'border-red-400/60';
                          statusBadge = (
                            <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Inactivo
                            </span>
                          );
                        } else if (hasActive) {
                          statusColor = 'border-emerald-400/50';
                          statusBadge = (
                            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Al día
                            </span>
                          );
                        } else if (hasExpired) {
                          statusColor = 'border-orange-400/60';
                          statusBadge = (
                            <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Renovación
                            </span>
                          );
                        } else if (hasOnlyCancelled) {
                          statusColor = 'border-slate-400/60';
                          statusBadge = (
                            <span className="bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Cancelado
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Sin productos
                            </span>
                          );
                        }

                        const isAdminUserMobile =
                          user.email === 'rogerbox@admin.com' ||
                          user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

                        return (
                          <div
                            key={user.id}
                            onClick={() =>
                              !isAdminUserMobile &&
                              router.push(`/admin/users/${user.id}`)
                            }
                            className={`p-4 ${isAdminUserMobile ? '' : 'hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer active:bg-gray-100'} transition-all border-l-4 ${statusColor} relative group bg-white dark:bg-gray-900`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-bold text-[#164151] dark:text-white truncate">
                                    {user.name ||
                                      user.full_name ||
                                      'Sin nombre'}
                                  </h4>
                                  {!user.isUnregisteredClient && (
                                    <div className="w-4 h-4 rounded-full bg-[#85ea10] flex items-center justify-center flex-shrink-0">
                                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                    </div>
                                  )}
                                  {statusBadge}
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                  <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                                    ID: {user.document_id || 'N/A'} •{' '}
                                    {user.email}
                                  </p>
                                  <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded-md bg-[#164151]/5 dark:bg-white/5 text-[9px] font-bold text-[#164151]/50 dark:text-white/30 uppercase tracking-wider">
                                    {user.user_type === 'online'
                                      ? 'Usuario Online'
                                      : 'Usuario Presencial'}
                                  </span>
                                </div>
                              </div>

                              {/* Solo mostrar botón WhatsApp si está en Renovación o Inactivo */}
                              {(user.phone || user.whatsapp) &&
                                (hasExpired || user.is_inactive) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const phone = (
                                        user.phone || user.whatsapp
                                      ).replace(/\D/g, '');
                                      const clientName =
                                        user.name ||
                                        user.full_name ||
                                        'Cliente';

                                      let message = '';
                                      if (user.is_inactive) {
                                        message = encodeURIComponent(
                                          `Hola ${clientName}, te extrañamos en RogerBox. ¿Te gustaría volver a entrenar con nosotros?`,
                                        );
                                      } else if (
                                        hasExpired &&
                                        memberships.length > 0
                                      ) {
                                        // Obtener la última membresía vencida
                                        const lastMembership = memberships[0];
                                        const planName =
                                          lastMembership?.plan?.name ||
                                          'tu plan';
                                        const endDate = lastMembership?.end_date
                                          ? new Date(
                                              lastMembership.end_date,
                                            ).toLocaleDateString('es-CO', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric',
                                            })
                                          : 'la fecha indicada';
                                        message = encodeURIComponent(
                                          `Hola ${clientName}, tu plan "${planName}" venció el ${endDate}. ¿Deseas renovarlo?`,
                                        );
                                      }

                                      const whatsappUrl = message
                                        ? `https://wa.me/${phone}?text=${message}`
                                        : `https://wa.me/${phone}`;
                                      window.open(whatsappUrl, '_blank');
                                    }}
                                    className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-colors"
                                  >
                                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                                  </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 overflow-hidden flex-wrap"
                              >
                                {(user.activeCoursePurchases || []).length >
                                  0 && (
                                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                      {
                                        (user.activeCoursePurchases || [])
                                          .length
                                      }
                                    </span>
                                  </div>
                                )}
                                {/* Mostrar planes activos */}
                                {activeMemberships.length > 0 &&
                                  activeMemberships.map(
                                    (membership: any, idx: number) => (
                                      <div
                                        key={membership.id || idx}
                                        className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-1 rounded-lg"
                                      >
                                        <Dumbbell className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-none">
                                          {membership.plan?.name?.split(
                                            ' ',
                                          )[0] || 'Plan'}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                {/* Mostrar planes vencidos (para renovar) */}
                                {memberships
                                  .filter((m: any) => {
                                    const endDate = new Date(m.end_date);
                                    endDate.setHours(0, 0, 0, 0);
                                    return endDate < today;
                                  })
                                  .map((membership: any, idx: number) => (
                                    <div
                                      key={`expired-${membership.id || idx}`}
                                      className="flex items-center gap-1 bg-orange-100 dark:bg-orange-500/10 px-2 py-1 rounded-lg"
                                    >
                                      <Dumbbell className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 leading-none">
                                        {membership.plan?.name?.split(' ')[0] ||
                                          'Plan'}
                                      </span>
                                      <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                    </div>
                                  ))}
                              </div>

                              <div className="flex items-center gap-1 text-[#164151]/30 dark:text-white/20 font-bold uppercase text-[9px] tracking-widest group-hover:text-[#85ea10] transition-colors">
                                Ver Perfil
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 mb-16 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-500 dark:text-white/40">
                        Mostrando{' '}
                        <span className="text-[#164151] dark:text-white font-medium">
                          {(currentPage - 1) * usersPerPage + 1}
                        </span>{' '}
                        a{' '}
                        <span className="text-[#164151] dark:text-white font-medium">
                          {Math.min(
                            currentPage * usersPerPage,
                            userCounts.total,
                          )}
                        </span>{' '}
                        de{' '}
                        <span className="text-[#164151] dark:text-white font-medium">
                          {userCounts.total}
                        </span>{' '}
                        clientes
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
                        <div className="flex items-center gap-1">
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
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1),
                            )
                          }
                          disabled={
                            currentPage === totalPages || totalPages === 0
                          }
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
                          disabled={
                            currentPage === totalPages || totalPages === 0
                          }
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
                )}
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <UnderConstruction
              title="Ventas Online"
              icon={ShoppingCart}
              description="El historial de transacciones online y pasarela de pagos se encuentra bajo revisión de seguridad y mejoras."
            />
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

      {/* Products Popover */}
      {productsModal.isOpen && productsModal.user && productsModal.position && (
        <>
          {/* Overlay transparente para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() =>
              setProductsModal({ isOpen: false, user: null, position: null })
            }
          />
          {/* Popover pequeño posicionado */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-white/10 shadow-xl w-72 max-h-80 overflow-hidden"
            style={{
              left: `${Math.max(8, Math.min(productsModal.position.x, window.innerWidth - 296))}px`, // 296 = 288 + 8px margin
              top: `${Math.max(8, Math.min(productsModal.position.y, window.innerHeight - 328))}px`, // 328 = 320 + 8px margin
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#164151] dark:text-white">
                Productos
              </h3>
              <button
                onClick={() =>
                  setProductsModal({
                    isOpen: false,
                    user: null,
                    position: null,
                  })
                }
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
              {productsModal.user.allProducts &&
              productsModal.user.allProducts.length > 0 ? (
                productsModal.user.allProducts.map(
                  (product: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {product.type === 'membership' ? (
                            <Dumbbell
                              className={`w-3.5 h-3.5 flex-shrink-0 ${product.isActive ? 'text-[#85ea10]' : 'text-gray-400'}`}
                            />
                          ) : (
                            <Globe className="w-3.5 h-3.5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[#164151] dark:text-white truncate">
                              {product.name}
                            </p>
                            {product.membership && (
                              <p className="text-xs text-gray-500 dark:text-white/50">
                                {product.isScheduled
                                  ? `Inicia: ${new Date(product.membership.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
                                  : product.isActive
                                    ? `Vence: ${new Date(product.membership.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
                                    : `Venció: ${new Date(product.membership.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                            product.isScheduled
                              ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                              : product.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : product.isCancelled
                                  ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400'
                                  : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {product.isScheduled
                            ? 'Próximo'
                            : product.isActive
                              ? 'Al día'
                              : product.isCancelled
                                ? 'Cancelado'
                                : 'Renovar'}
                        </span>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-xs text-gray-500 dark:text-white/50 text-center py-2">
                  Sin productos
                </p>
              )}
            </div>
          </div>
        </>
      )}

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

export default function AdminDashboard() {
  return (
    <Suspense fallback={<QuickLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

// ===== Componentes Auxiliares =====

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function CourseCard({
  course,
  onEdit,
  onDelete,
  onTogglePublish,
}: CourseCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-lg hover:border-[#85ea10]/30 transition-all duration-200 overflow-hidden">
      {/* Imagen del curso */}
      <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden rounded-t-2xl">
        {course.preview_image ? (
          <img
            src={course.preview_image}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              course.is_published
                ? 'bg-[#85ea10] text-black'
                : 'bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white/70'
            }`}
          >
            {course.is_published ? 'Publicado' : 'Borrador'}
          </span>
        </div>
      </div>

      {/* Contenido - mismo estilo que planes */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#164151] dark:text-white mb-1 line-clamp-2">
              {course.title}
            </h3>
            {course.short_description && (
              <p className="text-sm text-[#164151]/60 dark:text-white/60 line-clamp-2">
                {course.short_description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#164151]/80 dark:text-white/60">
              Precio:
            </span>
            <span className="text-lg font-bold text-[#164151] dark:text-white">
              ${Number(course.price ?? 0).toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#164151]/80 dark:text-white/60">
              Duración:
            </span>
            <span className="text-sm font-semibold text-[#164151] dark:text-white">
              {course.duration_days} días
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#164151]/80 dark:text-white/60">
              Nivel:
            </span>
            <span className="text-sm font-semibold text-[#164151] dark:text-white capitalize">
              {course.level}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
            <span className="text-sm text-[#164151]/80 dark:text-white/60">
              Estudiantes:
            </span>
            <span
              className={`text-sm font-bold px-2.5 py-1 rounded-full ${(course.students_count ?? 0) > 0 ? 'bg-[#85ea10]/10 text-[#85ea10]' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40'}`}
            >
              {course.students_count ?? 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePublish}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              course.is_published
                ? 'bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/20'
                : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black'
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
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-10 shadow-sm dark:shadow-none">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#85ea10]/30 border-t-[#85ea10] rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-[#164151]/80 dark:text-white/70">
          {message}
        </p>
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

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm dark:shadow-none">
      <Icon className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
      <p className="text-[#164151] dark:text-white font-medium mb-2">{title}</p>
      <p className="text-sm text-[#164151]/60 dark:text-white/60 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[#164151] text-white hover:bg-[#1a4d5f] dark:bg-[#164151] dark:hover:bg-[#1a4d5f] font-semibold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm mx-auto"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}
