'use client';

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  BellOff,
  BookOpen,
  Cake,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Code,
  Copy,
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
import GymExpensesManagement from '@/components/admin/GymExpensesManagement';
import GymPlansManagement, {
  type GymPlansManagementRef,
} from '@/components/admin/GymPlansManagement';
import { GymCommandCenterPage } from '@/modules/gym-admin/GymCommandCenterPage';
import {
  gymClientsColWidths,
  gymClientsListStyles as clientsListStyles,
} from '@/modules/gym-admin/styles';
import { WhatsAppIcon } from '@/shared/components/WhatsAppIcon';
// Admin dashboard component
import QuickLoading from '@/components/QuickLoading';
import UnderConstruction from '@/components/UnderConstruction';
import { DatePickerField } from '@/shared/components/DatePickerField';
import {
  DailyBirthdaysModal,
  useDailyBirthdaysModal,
} from '@/shared/components/DailyBirthdaysModal';
import { GymClientPaymentStatusBadge } from '@/shared/components/GymClientPaymentStatusBadge';
import { GymSeededAvatar } from '@/shared/components/GymSeededAvatar';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDateOnlyLocal, parseLocalDate } from '@/lib/dateUtils';
import {
  allRenewalPlansDismissed,
  buildAdminProductsList,
  buildGymRenewalAdminContext,
  buildRenewalPlanMenuOptions,
  computeClientGymAdminStatus,
  getCalendarExpiredNonCancelled,
  getGymAdminToday,
  renewalPendingPlanIdsFromMemberships,
  summarizeGymPlansPerClient,
} from '@/shared/utils/gym-membership-admin.util';
import {
  formatBirthDayMonthLabel,
  parseBirthDateYmd,
} from '@/shared/utils/birthday.util';
import { sortCourseLessonsByOrder } from '@/shared/utils/course-lessons.util';
import {
  gymPaymentInvoiceTotal,
  gymPaymentMethodLabel,
} from '@/shared/utils/gym-payment-amount.util';
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
  wompi_reference?: string | null;
  created_at: string;
  updated_at?: string | null;
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

function formatSaleDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Últimos 5 dígitos numéricos del ID Wompi (para tabla); si no hay dígitos, últimos 5 caracteres. */
function wompiIdLastFiveDigits(id: string | null | undefined): string {
  const s = (id || '').trim();
  if (!s) return '—';
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 5) return digits.slice(-5);
  if (digits.length > 0) return digits;
  return s.length <= 5 ? s : s.slice(-5);
}

function fullWompiOrderId(sale: {
  wompi_transaction_id?: string | null;
  wompi_reference?: string | null;
}): string {
  return (
    (sale.wompi_transaction_id || '').trim() ||
    (sale.wompi_reference || '').trim() ||
    ''
  );
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
        description: 'Centro de mando',
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
      {
        id: 'gym-expenses',
        label: 'Egresos',
        icon: Wallet,
        description: 'Registrar egresos de sede física',
      },
    ],
  },
  {
    title: 'Sede en Línea',
    items: [
      {
        id: 'sales',
        label: 'Ventas en línea',
        icon: ShoppingCart,
        description:
          'Historial de compras online (pasarela Wompi — cursos, no sede física)',
      },
      {
        id: 'courses',
        label: 'Cursos',
        icon: BookOpen,
        description: 'Gestionar cursos',
      },
      {
        id: 'complements',
        label: 'Retos semanales',
        icon: Play,
        description: 'Videos de retos por día (semana)',
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
        id: 'activities',
        label: 'Actividades',
        icon: ClipboardList,
        description: 'Bitácora de acciones en la plataforma',
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

/** Avatar en listado admin: foto de perfil si existe, si no ilustración por id de cliente. */
function AdminUserListAvatar({
  user,
  size = 32,
}: {
  user: {
    id: string;
    avatar_url?: string | null;
    avatar_updated_at?: string | null;
  };
  size?: number;
}) {
  const raw =
    typeof user.avatar_url === 'string' ? user.avatar_url.trim() : '';
  const box = `h-8 w-8 shrink-0 rounded-full ring-1 ring-gray-200/80 dark:ring-white/12`;
  if (raw) {
    const src = `${raw}${raw.includes('?') ? '&' : '?'}v=${user.avatar_updated_at || ''}`;
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`${box} object-cover`}
      />
    );
  }
  return (
    <GymSeededAvatar
      seed={String(user.id)}
      size={size}
      className={box}
      alt=""
    />
  );
}

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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all'); // 'all', 'active', 'renewal', 'no-products', 'inactive', 'missing-receipt', …
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userCounts, setUserCounts] = useState({
    total: 0,
    active: 0,
    renewal: 0,
    noProducts: 0,
    inactive: 0,
    mixPending: 0,
    mixDismissed: 0,
    missingPaymentReceipt: 0,
  });
  const [usersListTotal, setUsersListTotal] = useState(0);
  const usersPerPage = 20;
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ancho del sidebar para overlays/modales (blur solo sobre el contenido)
  useEffect(() => {
    const width = sidebarCollapsed ? '4rem' : '14rem';
    document.documentElement.style.setProperty('--admin-sidebar-width', width);
    return () => {
      document.documentElement.style.removeProperty('--admin-sidebar-width');
    };
  }, [sidebarCollapsed]);
  const [headerSearchTerm, setHeaderSearchTerm] = useState('');
  const [headerSearchResults, setHeaderSearchResults] = useState<any[]>([]);
  const [headerSearchLoading, setHeaderSearchLoading] = useState(false);
  const [showHeaderSearchResults, setShowHeaderSearchResults] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activityModuleFilter, setActivityModuleFilter] = useState('all');
  const [activityActionFilter, setActivityActionFilter] = useState('all');
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const activitiesPerPage = 30;
  const [renewalFollowupMenuClientId, setRenewalFollowupMenuClientId] =
    useState<string | null>(null);
  const renewalMenuCloseCleanupRef = useRef<(() => void) | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState<string>('all'); // 'all', 'online', 'physical'
  /** Filtro de estado de orden Wompi (pestaña Ventas) */
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>('all');
  const [copiedWompiSaleId, setCopiedWompiSaleId] = useState<string | null>(
    null,
  );
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
  /** Evita re-bootstrap del panel cuando Supabase refresca el objeto `user`. */
  const adminDataUserIdRef = useRef<string | null>(null);
  const adminShellReadyRef = useRef(false);
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
  const [physicalExpensesTotal, setPhysicalExpensesTotal] = useState(0);

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

  const dailyBirthdays = useDailyBirthdaysModal(
    !authLoading && isAdmin && !!user,
  );
  const [reopenBirthdaysModal, setReopenBirthdaysModal] = useState(false);
  const [overviewView, setOverviewView] = useState<'command' | 'caja'>(() =>
    searchParams.get('view') === 'caja' ? 'caja' : 'command',
  );

  const goToAdminTab = (tabId: string, extraParams?: Record<string, string>) => {
    setActiveTab(tabId);
    if (tabId === 'overview' && extraParams?.view === 'caja') {
      setOverviewView('caja');
    } else if (tabId === 'overview') {
      setOverviewView('command');
    }
    const params = new URLSearchParams({ tab: tabId, ...extraParams });
    // replaceState evita navegación de Next + Suspense (flash de pantalla completa).
    window.history.replaceState(null, '', `/admin?${params.toString()}`);
  };

  // Leer query param 'tab' (entrada externa / deep link) sin forzar remount del shell.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = menuSections.flatMap((section) =>
      section.items.map((item) => item.id),
    );

    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab((prev) => (prev === tabParam ? prev : tabParam));
      if (tabParam === 'overview') {
        setOverviewView(
          searchParams.get('view') === 'caja' ? 'caja' : 'command',
        );
      }
    } else if (!tabParam) {
      const defaultTab = 'overview';
      setActiveTab((prev) => (prev === defaultTab ? prev : defaultTab));
      if (!window.location.search.includes('tab=')) {
        window.history.replaceState(null, '', `/admin?tab=${defaultTab}`);
      }
    }
  }, [searchParams]);

  // Bootstrap del panel: una sola vez por usuario admin (no en cada TOKEN_REFRESHED).
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      adminDataUserIdRef.current = null;
      adminShellReadyRef.current = false;
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      router.push('/dashboard');
      return;
    }

    if (adminDataUserIdRef.current === user.id) return;
    adminDataUserIdRef.current = user.id;
    void loadAdminData();
  }, [authLoading, user?.id, isAdmin, router]);

  // Cargar datos cuando se cambie de pestaña
  useEffect(() => {
    if (activeTab === 'courses') {
      loadCourses();
    } else if (activeTab === 'users') {
      loadUsers('', 'all', 1);
    } else if (activeTab === 'sales') {
      loadSales();
    } else if (activeTab === 'activities') {
      loadActivities(1, '', 'all', 'all');
    } else if (activeTab === 'overview' && overviewView === 'caja') {
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
  }, [activeTab, overviewView]);

  useEffect(() => {
    if (activeTab !== 'activities') return;
    const timer = window.setTimeout(() => {
      loadActivities(
        activityCurrentPage,
        activitySearchTerm,
        activityModuleFilter,
        activityActionFilter,
      );
    }, activitySearchTerm ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [
    activeTab,
    activityCurrentPage,
    activitySearchTerm,
    activityModuleFilter,
    activityActionFilter,
  ]);

  useEffect(() => {
    const q = headerSearchTerm.trim();
    if (q.length < 2) {
      setHeaderSearchResults([]);
      setHeaderSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setHeaderSearchLoading(true);
        const params = new URLSearchParams({
          page: '1',
          limit: '8',
          search: q,
          status: 'all',
          userType: 'all',
        });
        const response = await fetch(`/api/admin/users?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error de búsqueda');
        setHeaderSearchResults(data.users || []);
      } catch {
        setHeaderSearchResults([]);
      } finally {
        setHeaderSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [headerSearchTerm]);

  // Si llegan con ?tab=gym-payments&newInvoice=1, abrir modal de nueva factura.
  useEffect(() => {
    const shouldOpenNewInvoice =
      activeTab === 'gym-payments' && searchParams.get('newInvoice') === '1';
    if (!shouldOpenNewInvoice) return;

    const timer = window.setTimeout(() => {
      gymPaymentsRef.current?.openCreateModal();
      window.history.replaceState(null, '', '/admin?tab=gym-payments');
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeTab, searchParams, router]);

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
  }, [userSearchTerm, paymentStatusFilter, userTypeFilter, currentPage]);

  useEffect(() => {
    if (!renewalFollowupMenuClientId) {
      renewalMenuCloseCleanupRef.current?.();
      renewalMenuCloseCleanupRef.current = null;
      return;
    }
    const close = () => setRenewalFollowupMenuClientId(null);
    const timer = window.setTimeout(() => {
      document.addEventListener('click', close);
      renewalMenuCloseCleanupRef.current = () => {
        document.removeEventListener('click', close);
      };
    }, 0);
    return () => {
      window.clearTimeout(timer);
      renewalMenuCloseCleanupRef.current?.();
      renewalMenuCloseCleanupRef.current = null;
    };
  }, [renewalFollowupMenuClientId]);

  // Cargar ingresos cuando cambien los filtros
  useEffect(() => {
    if (activeTab === 'overview' && overviewView === 'caja') {
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
        loadPhysicalExpensesTotal(startDate, endDate);
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
  }, [
    dateFilter,
    customStartDate,
    customEndDate,
    sedeFilter,
    activeTab,
    overviewView,
  ]);

  const loadAdminData = async () => {
    const blockShell = !adminShellReadyRef.current;
    try {
      if (blockShell) setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas');
      }

      setStats(data);
      adminShellReadyRef.current = true;
    } catch (error) {
    } finally {
      if (blockShell) setLoading(false);
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

  const loadPhysicalExpensesTotal = async (
    startDate: string,
    endDate: string,
  ) => {
    try {
      const params = new URLSearchParams({ from: startDate, to: endDate });
      const response = await fetch(`/api/admin/gym/expenses?${params}`);
      if (!response.ok) {
        setPhysicalExpensesTotal(0);
        return;
      }
      const rows = (await response.json()) as Array<{ amount?: number }>;
      const total = (rows || []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0,
      );
      setPhysicalExpensesTotal(total);
    } catch {
      setPhysicalExpensesTotal(0);
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
      const amountByDay = new Map<string, number>();

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
        amountByDay.set(day.date, totalAmount);
      }

      // Completar todos los días del rango aunque no haya ventas (monto 0)
      const cursor = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        12,
        0,
        0,
        0,
      );
      const last = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        12,
        0,
        0,
        0,
      );

      while (cursor <= last) {
        const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const dayName = cursor.toLocaleDateString('es-ES', {
          weekday: 'short',
        });
        weeklyDataArray.push({
          date: dateKey,
          amount: amountByDay.get(dateKey) ?? 0,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      setWeeklyData(weeklyDataArray);
    } catch (error) {
      setWeeklyData([]);
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
              whatsapp,
              avatar_url
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

      // Cargar orders (pasarela Wompi) si el filtro incluye tienda en línea.
      // Nota: no usar embed user:profiles — orders.user_id apunta a auth.users y PostgREST
      // no expone esa relación hacia public.profiles; la query fallaba y la lista quedaba vacía.
      if (sedeFilter === 'online' || sedeFilter === 'ambas') {
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select(`
            *,
            course:courses(
              id,
              title
            ),
            gym_plan:gym_plans(
              id,
              name
            )
          `)
          .eq('status', 'approved')
          .not('course_id', 'is', null)
          .not('wompi_transaction_id', 'is', null)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error(
            '[admin] loadDailyPayments orders:',
            ordersError.message,
          );
        } else if (orders?.length) {
          const userIds = [
            ...new Set(orders.map((o: { user_id: string }) => o.user_id)),
          ];
          let profilesMap: Record<
            string,
            {
              name: string | null;
              email: string | null;
              document_id: string | null;
              avatar_url: string | null;
              updated_at: string | null;
            }
          > = {};
          if (userIds.length > 0) {
            const { data: profilesData } = await supabaseAdmin
              .from('profiles')
              .select('id, name, email, document_id, avatar_url, updated_at')
              .in('id', userIds);
            if (profilesData) {
              profilesMap = Object.fromEntries(
                profilesData.map((p) => [p.id, p]),
              );
            }
          }

          orders.forEach((order: any) => {
            const prof = profilesMap[order.user_id];
            const clientName =
              prof?.name ||
              order.customer_name ||
              order.customer_email ||
              'Cliente online';
            const clientEmail =
              prof?.email || order.customer_email || null;
            const productName =
              order.course?.title ||
              order.gym_plan?.name ||
              'Producto online';

            allPayments.push({
              id: order.id,
              amount: order.amount,
              payment_method: order.payment_method || 'transfer',
              payment_date: String(order.created_at || '').split('T')[0],
              created_at: order.created_at,
              invoice_number: null,
              wompi_transaction_id: order.wompi_transaction_id,
              user: prof
                ? {
                    id: order.user_id,
                    name: prof.name,
                    email: prof.email,
                    avatar_url: prof.avatar_url,
                    avatar_updated_at: prof.updated_at,
                  }
                : undefined,
              client_info: {
                id: order.user_id,
                name: clientName,
                document_id: prof?.document_id ?? null,
                email: clientEmail,
                avatar_url: prof?.avatar_url ?? null,
              },
              plan: {
                name: productName,
                price: order.amount,
                duration_days: null,
              },
              course: order.course,
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
        .order('created_at', { ascending: false })
        .order('lesson_order', {
          foreignTable: 'course_lessons',
          ascending: true,
        });

      if (error) throw error;
      const normalized = (data || []).map((course) => ({
        ...course,
        course_lessons: sortCourseLessonsByOrder(course.course_lessons || []),
      }));
      setCourses(normalized);
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
        userType: userTypeFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar clientes');
      }

      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setUsersListTotal(data.pagination?.total ?? 0);
      setUserCounts(
        data.counts || {
          total: 0,
          active: 0,
          renewal: 0,
          noProducts: 0,
          inactive: 0,
          mixPending: 0,
          mixDismissed: 0,
          missingPaymentReceipt: 0,
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

      // Solo ventas en línea (cursos); no incluir tiendas físicas (planes gimnasio)
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
        .not('course_id', 'is', null)
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

      // Enriquecer con wompi_transaction_id desde wompi_transactions (para órdenes que aún no lo tienen en orders)
      const orderIds = salesWithProfiles.map((s) => s.id).filter(Boolean);
      if (orderIds.length > 0) {
        try {
          const res = await fetch(
            `/api/admin/orders/wompi-ids?ids=${orderIds.join(',')}`,
            { credentials: 'include' },
          );
          if (res.ok) {
            const { ids } = await res.json();
            salesWithProfiles.forEach((sale) => {
              if (ids[sale.id] && !sale.wompi_transaction_id) {
                sale.wompi_transaction_id = ids[sale.id];
              }
            });
          }
        } catch {
          // Si falla la API de IDs, mostramos lo que tenemos (orders.wompi_transaction_id)
        }
      }

      setSales(salesWithProfiles);
    } catch (error) {
    } finally {
      setLoadingSales(false);
    }
  };

  const loadActivities = async (
    page = 1,
    search = '',
    moduleFilter = 'all',
    actionFilter = 'all',
  ) => {
    try {
      setActivitiesLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(activitiesPerPage),
        search,
        module: moduleFilter,
        action: actionFilter,
      });
      const response = await fetch(`/api/admin/activities?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar actividades');
      }
      setActivities(data.activities || []);
      setActivityTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setActivities([]);
      setActivityTotalPages(1);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Filtrar por búsqueda, estado y paginar (solo ventas en línea ya vienen de loadSales)
  const filteredSales = useMemo(() => {
    let list = [...sales];
    if (salesStatusFilter !== 'all') {
      const st = salesStatusFilter.toLowerCase();
      list = list.filter(
        (s) => (s.status || '').toLowerCase() === st,
      );
    }
    const term = (salesSearchTerm || '').trim().toLowerCase();
    if (term) {
      list = list.filter((s) => {
        const name = (s.profile?.name || s.customer_name || '').toLowerCase();
        const email = (
          s.profile?.email ||
          s.customer_email ||
          ''
        ).toLowerCase();
        return name.includes(term) || email.includes(term);
      });
    }
    return list;
  }, [sales, salesSearchTerm, salesStatusFilter]);

  const salesTotalPages = Math.max(
    1,
    Math.ceil(filteredSales.length / salesPerPage),
  );
  const paginatedSales = useMemo(
    () =>
      filteredSales.slice(
        (salesCurrentPage - 1) * salesPerPage,
        salesCurrentPage * salesPerPage,
      ),
    [filteredSales, salesCurrentPage, salesPerPage],
  );

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
        fixed inset-y-0 left-0 z-50 h-screen overflow-hidden
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-gradient-to-b from-[#020812] via-[#030d1a] to-[#020916] border-r border-[#0d253e]/65
        flex flex-col
        transition-all duration-300 ease-in-out
      `}
      >
        {/* Logo Header */}
        <div
          className={`
          h-16 flex items-center border-b border-[#0d253e]/65 px-4
          ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
        `}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-white font-black text-xl tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-white/55 uppercase tracking-widest font-semibold">
                  BackOffice
                </span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                R
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-black text-white/45 uppercase tracking-widest">
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
                        goToAdminTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${
                          isActive
                            ? 'bg-[#85ea10]/10 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
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

      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}
      >
        {/* Top Header */}
        <header className="h-[4.25rem] bg-white dark:bg-[#0b1422] border-b border-gray-200/80 dark:border-white/10 flex items-center gap-4 md:gap-6 px-3 md:px-5 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 shrink-0 min-w-0 md:w-44 lg:w-52">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-[#164151]/80 dark:text-white/80"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block min-w-0">
              <p className="text-sm font-bold text-[#164151] dark:text-white truncate leading-tight">
                {activeItem.label}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-white/45 truncate leading-tight">
                {activeItem.description}
              </p>
            </div>
          </div>

          <div className="relative flex-1 min-w-0 max-w-3xl mx-auto">
            <div className="h-10 rounded-full border border-gray-200 dark:border-white/10 bg-[#f8fafc] dark:bg-[#111b2b] flex items-center gap-2 px-4">
              <Search className="w-5 h-5 text-gray-400 dark:text-white/50" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre, cédula o correo..."
                value={headerSearchTerm}
                onChange={(e) => {
                  setHeaderSearchTerm(e.target.value);
                  setShowHeaderSearchResults(true);
                }}
                onFocus={() => setShowHeaderSearchResults(true)}
                className="w-full bg-transparent border-0 outline-none text-sm text-[#164151] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/45"
              />
              {headerSearchTerm && (
                <button
                  onClick={() => {
                    setHeaderSearchTerm('');
                    setHeaderSearchResults([]);
                    setShowHeaderSearchResults(false);
                  }}
                  className="text-gray-400 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/80 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showHeaderSearchResults && headerSearchTerm.trim().length >= 2 && (
              <div className="absolute top-12 left-0 right-0 z-40 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111b2b] shadow-2xl max-h-[26rem] overflow-y-auto">
                {headerSearchLoading ? (
                  <div className="px-4 py-6 text-sm text-[#164151]/70 dark:text-white/60">
                    Buscando clientes...
                  </div>
                ) : headerSearchResults.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-[#164151]/70 dark:text-white/60">
                    No encontramos clientes con ese criterio.
                  </div>
                ) : (
                  <div className="p-2">
                    {headerSearchResults.map((client) => {
                      const memberships = Array.isArray(client.gym_memberships)
                        ? client.gym_memberships
                        : [];
                      const activeCourses = Array.isArray(
                        client.activeCoursePurchases,
                      )
                        ? client.activeCoursePurchases
                        : [];
                      const planNames: string[] = [
                        ...new Set(
                          memberships
                            .map((m: any) =>
                              Array.isArray(m.plan)
                                ? m.plan[0]?.name
                                : m.plan?.name,
                            )
                            .filter(Boolean) as string[],
                        ),
                      ];
                      const courseNames: string[] = [
                        ...new Set(
                          activeCourses
                            .map(
                              (c: any) =>
                                c.course?.title || c.course_title || c.title,
                            )
                            .filter(Boolean) as string[],
                        ),
                      ];

                      const gymStatus =
                        client.gym_client_status ??
                        computeClientGymAdminStatus(
                          summarizeGymPlansPerClient(
                            client.gym_memberships || [],
                          ),
                          client.gym_memberships,
                        );
                      const statusLabel = client.is_inactive
                        ? 'Inactivo'
                        : gymStatus === 'renewal'
                          ? 'Renovación'
                          : gymStatus === 'all_current' ||
                              (activeCourses.length > 0 &&
                                (client.gym_memberships || []).filter(
                                  (m: any) => m.status !== 'cancelled',
                                ).length === 0)
                            ? 'Al día'
                            : gymStatus === 'scheduled_only'
                              ? 'Programado'
                              : gymStatus === 'partial_renewal'
                                ? 'Parcial'
                                : gymStatus === 'current_no_payment'
                                  ? 'Sin factura'
                                  : 'Sin productos';

                      const statusClass = client.is_inactive
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                        : gymStatus === 'renewal'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                          : gymStatus === 'all_current' ||
                              (activeCourses.length > 0 &&
                                (client.gym_memberships || []).filter(
                                  (m: any) => m.status !== 'cancelled',
                                ).length === 0)
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : gymStatus === 'scheduled_only'
                              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300'
                              : gymStatus === 'partial_renewal' ||
                                  gymStatus === 'current_no_payment'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/60';

                      const productTypeLabel =
                        client.userType === 'both'
                          ? 'Físico + Online'
                          : client.userType === 'physical'
                            ? 'Sede física'
                            : client.userType === 'online'
                              ? 'Online'
                              : 'Sin tipo';

                      return (
                        <button
                          key={client.id}
                          onClick={() => {
                            setShowHeaderSearchResults(false);
                            router.push(`/admin/users/${client.id}`);
                          }}
                          className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200/70 dark:hover:border-white/10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[#164151] dark:text-white truncate">
                              {client.name || 'Cliente'}
                            </p>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#164151]/70 dark:text-white/55 truncate">
                            {client.document_id || 'Sin cédula'}{' '}
                            {client.email ? `· ${client.email}` : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                              {productTypeLabel}
                            </span>
                            {planNames.map((plan: string) => (
                              <span
                                key={`plan-${client.id}-${plan}`}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#85ea10]/20 text-[#164151] dark:text-[#85ea10]"
                              >
                                {plan}
                              </span>
                            ))}
                            {courseNames.map((course: string) => (
                              <span
                                key={`course-${client.id}-${course}`}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                              >
                                {course}
                              </span>
                            ))}
                            {planNames.length === 0 && courseNames.length === 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/50">
                                Sin productos registrados
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeTab !== 'gym-payments') {
                    goToAdminTab('gym-payments');
                  }
                  // Abrir modal en el mismo tick o tras montar la pestaña (sin depender de searchParams).
                  window.setTimeout(
                    () => gymPaymentsRef.current?.openCreateModal(),
                    activeTab === 'gym-payments' ? 0 : 120,
                  );
                }}
                className="w-10 h-10 rounded-full bg-[#1b1f24] text-white inline-flex items-center justify-center hover:bg-[#0f1115] transition-colors"
                title="Crear factura"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="h-10 px-3.5 rounded-full border border-gray-200 dark:border-white/12 bg-white dark:bg-[#111b2b] text-[#164151] dark:text-white text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                title="Ir a plataforma"
              >
                Ir a plataforma
              </button>

              {activeTab === 'users' && (
                <button
                  onClick={() => loadUsers()}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/12 text-[#164151]/80 dark:text-white/75 inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Actualizar lista de clientes"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}

              {activeTab === 'gym-payments' && (
                <button
                  onClick={() => gymPaymentsRef.current?.refresh()}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/12 text-[#164151]/80 dark:text-white/75 inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Actualizar pagos"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />

            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button className="hidden sm:inline-flex w-10 h-10 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
                <Zap className="w-5 h-5" />
              </button>
              <button className="hidden sm:inline-flex w-10 h-10 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="relative inline-flex w-10 h-10 rounded-full text-[#164151]/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 items-center justify-center transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              </button>
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />

            <div className="flex items-center gap-2.5 min-w-0">
              <GymSeededAvatar
                seed={String(user?.id || profile?.id || 'admin')}
                size={36}
                className="w-9 h-9 rounded-full ring-1 ring-gray-200/80 shrink-0"
                alt="Avatar del usuario"
              />
              <div className="leading-tight hidden lg:block min-w-0">
                <p className="text-[12px] font-semibold text-[#164151] dark:text-white truncate max-w-[8rem]">
                  {user?.user_metadata?.name || profile?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-white/50">
                  Propietario
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-20">
          {/* Overview Tab - Centro de mando */}
          {activeTab === 'overview' && overviewView === 'command' && (
            <GymCommandCenterPage
              onOpenCash={() => goToAdminTab('overview', { view: 'caja' })}
              onGoToTab={goToAdminTab}
            />
          )}

          {/* Overview Tab - Caja del día (vista secundaria) */}
          {activeTab === 'overview' && overviewView === 'caja' && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => goToAdminTab('overview')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#164151] dark:text-white hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                Centro de mando
              </button>
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
                      <option value="online">En Línea</option>
                      <option value="ambas">Ambas</option>
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
                        <DatePickerField
                          value={customStartDate}
                          onChange={setCustomStartDate}
                          aria-label="Fecha de inicio personalizada"
                          className="min-w-[140px]"
                          triggerClassName="h-[38px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[#164151] dark:text-white focus:ring-2 focus:ring-[#164151]/50"
                        />
                        <span className="text-gray-500 dark:text-white/50">
                          -
                        </span>
                        <DatePickerField
                          value={customEndDate}
                          onChange={setCustomEndDate}
                          aria-label="Fecha de fin personalizada"
                          className="min-w-[140px]"
                          triggerClassName="h-[38px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[#164151] dark:text-white focus:ring-2 focus:ring-[#164151]/50"
                        />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                      {/* Egresos */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-red-700 dark:text-red-300" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Egresos
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Salidas de dinero de sede física
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${physicalExpensesTotal.toLocaleString('es-CO')}`
                            : '••••••'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Sede En Línea: solo Ingresos totales + gráfico por día (sin efectivo ni transferencia) */}
                  {sedeFilter === 'online' && revenueStats.online && (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Solo Total */}
                      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-6 shadow-lg max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-lg bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#164151] dark:text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#164151]/70 dark:text-white/60 uppercase tracking-wide">
                              Ingresos totales
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/50">
                              Ingresos de la sede en línea
                            </p>
                          </div>
                        </div>
                        <p className="text-xl font-semibold text-[#164151] dark:text-white">
                          {showRevenueNumbers
                            ? `$${revenueStats.online.total.toLocaleString('es-CO')}`
                            : '••••••'}
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
                    (() => {
                      const maxAmount = Math.max(
                        ...weeklyData.map((d) => d.amount),
                        1,
                      );
                      const chartPointWidth = 34;
                      const useScrollableChart = weeklyData.length > 20;
                      const chartMinWidth = Math.max(
                        720,
                        weeklyData.length * chartPointWidth,
                      );
                      const showAmountLabels = weeklyData.length <= 20;
                      const labelStep =
                        weeklyData.length <= 14
                          ? 1
                          : weeklyData.length <= 45
                            ? 3
                            : 7;

                      return (
                        <div
                          className={`relative mt-8 pb-2 ${useScrollableChart ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
                        >
                          {/* Gráfica */}
                          <div
                            className={`relative h-64 flex items-end gap-1 mb-0 ${useScrollableChart ? '' : 'justify-between'}`}
                            style={
                              useScrollableChart
                                ? { minWidth: `${chartMinWidth}px` }
                                : undefined
                            }
                          >
                            {weeklyData.map((day, index) => {
                              const height =
                                maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                              const barHeight = Math.max(height, 8);

                              // Formatear fecha en hora local (evita que 11 se muestre como 10 por UTC)
                              const date = parseLocalDate(day.date);
                              const dayNumber = date.getDate();
                              const month = date.toLocaleDateString('es-ES', {
                                month: 'short',
                              });
                              const shouldShowDayLabel =
                                index % labelStep === 0 ||
                                index === weeklyData.length - 1;

                              return (
                                <div
                                  key={index}
                                  className={`${useScrollableChart ? 'w-8 shrink-0' : 'flex-1 min-w-0'} flex flex-col items-center gap-1 h-full relative group`}
                                >
                                  {/* Tooltip con diseño compacto */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-[#3a3a3a] text-[11px] rounded-[4px] px-2.5 py-1 shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    {`${day.dayName}, ${dayNumber} ${month}: $${day.amount.toLocaleString('es-CO')}`}
                                  </div>

                                  {/* Valor sobre el punto (solo en rangos cortos/medios) */}
                                  {showAmountLabels && (
                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-center w-full">
                                      <p className="text-xs font-semibold text-[#164151] dark:text-white">
                                        {showRevenueNumbers
                                          ? `$${day.amount.toLocaleString('es-CO')}`
                                          : '••••'}
                                      </p>
                                    </div>
                                  )}

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
                                  <div className="text-center min-h-[30px]">
                                    {shouldShowDayLabel ? (
                                      <>
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-white/50">
                                          {day.dayName}
                                        </p>
                                        <p className="text-[9px] text-gray-400 dark:text-white/40">
                                          {dayNumber}/{date.getMonth() + 1}
                                        </p>
                                      </>
                                    ) : (
                                      <span className="text-[10px] text-transparent">
                                        .
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Línea conectando los puntos */}
                          <svg
                            className="absolute top-8 left-0 h-40 pointer-events-none"
                            style={
                              useScrollableChart
                                ? { zIndex: 1, minWidth: `${chartMinWidth}px` }
                                : { zIndex: 1, width: '100%' }
                            }
                          >
                            <polyline
                              points={weeklyData
                                .map((day, index) => {
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
                      );
                    })()
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
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 px-5 pt-5 pb-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
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
                              ? payment.client_info?.document_id ||
                                payment.user?.email ||
                                payment.client_info?.email ||
                                'Sin documento'
                              : payment.client_info?.document_id ||
                                'Sin documento';
                          const planName =
                            payment.plan?.name ||
                            payment.course?.title ||
                            'Producto no disponible';

                          return (
                            <div
                              key={payment.id}
                              className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {(() => {
                                      const avatarRaw =
                                        payment.client_info?.avatar_url ||
                                        payment.user?.avatar_url ||
                                        '';
                                      const avatarUpdatedAt =
                                        payment.user?.avatar_updated_at || '';
                                      const avatarSrc = avatarRaw
                                        ? `${avatarRaw}${avatarRaw.includes('?') ? '&' : '?'}v=${avatarUpdatedAt}`
                                        : '';
                                      const avatarSeed =
                                        String(
                                          payment.client_info?.id ||
                                            payment.user?.id ||
                                            payment.client_info?.email ||
                                            payment.client_info?.document_id ||
                                            payment.id,
                                        ) || 'client';
                                      if (avatarSrc) {
                                        return (
                                          <img
                                            src={avatarSrc}
                                            alt={clientName}
                                            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200/80 dark:ring-white/12 shrink-0"
                                          />
                                        );
                                      }
                                      return (
                                        <GymSeededAvatar
                                          seed={avatarSeed}
                                          size={32}
                                          className="w-8 h-8 rounded-full ring-1 ring-gray-200/80 dark:ring-white/12 shrink-0"
                                          alt={clientName}
                                        />
                                      );
                                    })()}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[#164151] dark:text-white leading-tight">
                                          {clientName}
                                        </p>
                                        {payment.sede && (
                                          <span
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium leading-none ${
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
                                      <p className="text-[11px] text-gray-500 dark:text-white/50 leading-tight">
                                        {clientDoc}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 pl-10">
                                    <div>
                                      <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                        {payment.sede === 'online'
                                          ? 'Curso/Plan'
                                          : 'Plan'}
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
                                        {planName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                        Método de pago
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
                                        {gymPaymentMethodLabel(payment)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                        Fecha
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
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
                                    {payment.invoice_number ? (
                                      <div>
                                        <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                          Factura
                                        </p>
                                        <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
                                          #{payment.invoice_number}
                                        </p>
                                      </div>
                                    ) : payment.sede === 'online' &&
                                      payment.wompi_transaction_id ? (
                                      <div>
                                        <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                          Pasarela (Wompi)
                                        </p>
                                        <p className="text-sm font-mono font-medium text-[#164151] dark:text-white truncate max-w-[120px]">
                                          {String(payment.wompi_transaction_id).slice(0, 12)}…
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="ml-3 text-right min-w-[110px]">
                                  <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                    Monto
                                  </p>
                                  <p className="text-lg md:text-xl font-bold text-[#85ea10] leading-tight">
                                    {showRevenueNumbers
                                      ? `$${gymPaymentInvoiceTotal(payment).toLocaleString('es-CO')}`
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
                          <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5">
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
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setReopenBirthdaysModal(true)}
                            className="text-xs font-medium text-[#164151] dark:text-[#85ea10] hover:underline"
                          >
                            Ver modal
                          </button>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-white/50">
                              Total
                            </p>
                            <p className="text-base font-bold text-[#164151] dark:text-white">
                              {birthdayClients.length}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {loadingBirthdays ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#164151] mx-auto mb-4"></div>
                          <p className="text-sm text-gray-500 dark:text-white/50">
                            Cargando cumpleaños...
                          </p>
                        </div>
                      </div>
                    ) : birthdayClients.length > 0 ? (
                      <div className="space-y-2.5 mt-3 max-h-[520px] overflow-y-auto scrollbar-hide">
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
                              className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-9 h-9 rounded-full bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center text-[#164151] dark:text-white font-bold text-sm border border-[#85ea10]/30">
                                      {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-[#164151] dark:text-white leading-tight">
                                          {client.name}
                                        </p>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#85ea10]/20 dark:bg-[#85ea10]/20 text-[#164151] dark:text-[#85ea10] font-semibold">
                                          🎂 {client.age} años
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 dark:text-white/50 leading-tight">
                                        {client.document_id || 'Sin documento'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 pl-11">
                                    <div>
                                      <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                        Fecha de nacimiento
                                      </p>
                                      <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
                                        {formattedBirthday}
                                      </p>
                                    </div>
                                    {client.whatsapp && (
                                      <div>
                                        <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
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
                                          className="flex items-center gap-1.5 px-2 py-1 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg text-xs font-medium transition-all hover:shadow-md group w-fit"
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          <span>{client.whatsapp}</span>
                                        </button>
                                      </div>
                                    )}
                                    {client.email && (
                                      <div>
                                        <p className="text-[10px] text-gray-500 dark:text-white/50 mb-0.5 uppercase tracking-wide">
                                          Email
                                        </p>
                                        <p className="text-sm font-medium text-[#164151] dark:text-white leading-tight">
                                          {client.email}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-3 text-center">
                                  <div className="w-9 h-9 rounded-full bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center border border-[#85ea10]/30">
                                    <Cake className="w-4.5 h-4.5 text-[#85ea10]" />
                                  </div>
                                  <p className="text-[10px] text-[#164151] dark:text-white font-semibold mt-1.5 leading-tight">
                                    ¡Feliz Cumpleaños!
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Cake className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-3" />
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
          {activeTab === 'blogs' && <BlogManagement />}

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

          {/* Gym Expenses Tab */}
          {activeTab === 'gym-expenses' && <GymExpensesManagement />}

          {/* Gym Collections Tab */}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm dark:shadow-none">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={activitySearchTerm}
                      onChange={(e) => {
                        setActivitySearchTerm(e.target.value);
                        setActivityCurrentPage(1);
                      }}
                      placeholder="Buscar por acción, módulo, detalles o usuario..."
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                    />
                  </div>
                  <select
                    value={activityModuleFilter}
                    onChange={(e) => {
                      setActivityModuleFilter(e.target.value);
                      setActivityCurrentPage(1);
                    }}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white"
                  >
                    <option value="all">Módulos: todos</option>
                    <option value="gym">Gym</option>
                    <option value="payments">Pagos</option>
                    <option value="courses">Cursos</option>
                    <option value="users">Usuarios</option>
                    <option value="blogs">Blogs</option>
                  </select>
                  <select
                    value={activityActionFilter}
                    onChange={(e) => {
                      setActivityActionFilter(e.target.value);
                      setActivityCurrentPage(1);
                    }}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white"
                  >
                    <option value="all">Acciones: todas</option>
                    <option value="payment_create">Facturación</option>
                    <option value="membership_create">Membresía creada</option>
                    <option value="create">Creación</option>
                    <option value="update">Actualización</option>
                    <option value="delete">Eliminación</option>
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                {activitiesLoading ? (
                  <div className="p-10 text-center text-sm text-[#164151]/70 dark:text-white/60">
                    Cargando actividades...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#164151]/70 dark:text-white/60">
                    No hay actividades para los filtros seleccionados.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {activities.map((log) => (
                      <div key={log.id} className="p-4 sm:p-5">
                        {(() => {
                          const details = (log.details || {}) as Record<
                            string,
                            unknown
                          >;
                          const amount =
                            typeof details.amount === 'number'
                              ? details.amount
                              : typeof details.amount === 'string'
                                ? Number(details.amount)
                                : null;
                          const paymentMethod =
                            typeof details.payment_method === 'string'
                              ? details.payment_method
                              : null;
                          const planId =
                            typeof details.plan_id === 'string'
                              ? details.plan_id
                              : null;
                          const planName =
                            typeof details.plan_name === 'string'
                              ? details.plan_name
                              : null;
                          const invoiceNumber =
                            typeof details.invoice_number === 'string'
                              ? details.invoice_number
                              : null;
                          const paymentId =
                            typeof details.payment_id === 'string'
                              ? details.payment_id
                              : null;
                          const periodStart =
                            typeof details.period_start === 'string'
                              ? details.period_start
                              : null;
                          const periodEnd =
                            typeof details.period_end === 'string'
                              ? details.period_end
                              : null;
                          const paymentDate =
                            typeof details.payment_date === 'string'
                              ? details.payment_date
                              : null;
                          const clientInfoId =
                            typeof details.client_info_id === 'string'
                              ? details.client_info_id
                              : null;
                          const clientName =
                            typeof details.client_name === 'string'
                              ? details.client_name
                              : typeof details.name === 'string'
                                ? details.name
                                : null;
                          const clientDocument =
                            typeof details.document_id === 'string'
                              ? details.document_id
                              : null;
                          const clientEmail =
                            typeof details.email === 'string'
                              ? details.email
                              : null;
                          const clientWhatsapp =
                            typeof details.whatsapp === 'string'
                              ? details.whatsapp
                              : null;
                          const description =
                            typeof details.description === 'string'
                              ? details.description
                              : null;

                          const paymentMethodLabel =
                            paymentMethod === 'cash'
                              ? 'efectivo'
                              : paymentMethod === 'transfer'
                                ? 'transferencia'
                                : paymentMethod === 'mixed'
                                  ? 'pago mixto'
                                  : null;

                          const moduleLabelMap: Record<string, string> = {
                            gym: 'Clientes',
                            payments: 'Pagos',
                            courses: 'Cursos',
                            users: 'Usuarios',
                            blogs: 'Blogs',
                            system: 'Sistema',
                          };

                          const actionLabelMap: Record<string, string> = {
                            payment_create: 'Factura registrada',
                            membership_create: 'Membresía creada',
                            client_create: 'Cliente creado',
                            order_approved: 'Venta aprobada',
                          };

                          const moduleLabel =
                            String(log.action || '').toLowerCase() ===
                            'payment_create'
                              ? 'Pagos'
                              : String(log.action || '').toLowerCase() ===
                                  'client_create'
                                ? 'Clientes'
                                : String(log.action || '').toLowerCase() ===
                                    'membership_create'
                                  ? 'Membresías'
                                  :
                            moduleLabelMap[String(log.module || '').toLowerCase()] ||
                            String(log.module || 'Sistema');
                          const actionLabel =
                            actionLabelMap[String(log.action || '').toLowerCase()] ||
                            String(log.action || 'Acción');

                          let humanTitle = 'Acción registrada en la plataforma';
                          if (log.action === 'payment_create') {
                            humanTitle = `Se registró la factura${invoiceNumber ? ` #${String(invoiceNumber).padStart(3, '0')}` : ''}${amount ? ` por $${Number(amount).toLocaleString('es-CO')}` : ''}${paymentMethodLabel ? ` (${paymentMethodLabel})` : ''}.`;
                          } else if (log.action === 'membership_create') {
                            humanTitle = 'Se creó una nueva membresía de sede física.';
                          } else if (log.action === 'client_create') {
                            humanTitle = `Se creó un nuevo cliente${clientName ? `: ${clientName}` : ''}.`;
                          } else if (log.action === 'order_approved') {
                            humanTitle = 'Se aprobó una orden de compra.';
                          } else if (description) {
                            humanTitle = description;
                          }

                          return (
                            <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#85ea10]/20 text-[#164151] dark:text-[#85ea10] uppercase">
                              {moduleLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-white/10 text-[#164151]/80 dark:text-white/70">
                              {actionLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#164151]/60 dark:text-white/50">
                            {new Date(log.created_at).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#164151] dark:text-white mt-2">
                          {log.user_name || 'Sistema/Admin'}
                          {log.user_email ? (
                            <span className="text-[#164151]/60 dark:text-white/60 font-medium">
                              {' '}
                              · {log.user_email}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-2 text-sm text-[#164151]/90 dark:text-white/90">
                          {humanTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {amount ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-emerald-100 text-emerald-700">
                              Monto: ${Number(amount).toLocaleString('es-CO')}
                            </span>
                          ) : null}
                          {paymentMethodLabel ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-cyan-100 text-cyan-700">
                              Método: {paymentMethodLabel}
                            </span>
                          ) : null}
                          {invoiceNumber ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-lime-100 text-lime-700">
                              Factura: #{String(invoiceNumber).padStart(3, '0')}
                            </span>
                          ) : null}
                          {planName ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-indigo-100 text-indigo-700">
                              Plan: {planName}
                            </span>
                          ) : planId ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-indigo-100 text-indigo-700">
                              Plan: {planId.slice(0, 8)}...
                            </span>
                          ) : null}
                          {periodStart && periodEnd ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-amber-100 text-amber-700">
                              Período: {periodStart} al {periodEnd}
                            </span>
                          ) : null}
                          {paymentDate ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-violet-100 text-violet-700">
                              Fecha de pago: {paymentDate}
                            </span>
                          ) : null}
                          {clientName ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-blue-100 text-blue-700">
                              Cliente: {clientName}
                            </span>
                          ) : null}
                          {clientDocument ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-slate-100 text-slate-700">
                              Cédula: {clientDocument}
                            </span>
                          ) : null}
                          {clientEmail ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-cyan-100 text-cyan-700">
                              Email: {clientEmail}
                            </span>
                          ) : null}
                          {clientWhatsapp ? (
                            <span className="px-2 py-1 rounded-lg text-[11px] bg-teal-100 text-teal-700">
                              WhatsApp: {clientWhatsapp}
                            </span>
                          ) : null}
                        </div>
                        {paymentId && String(log.action || '').toLowerCase() ===
                        'payment_create' ? (
                          <div className="mt-2">
                            <button
                              onClick={() => router.push(`/admin/payments/${paymentId}`)}
                              className="text-xs font-semibold text-[#164151] hover:text-[#0f303d] underline underline-offset-2"
                            >
                              Ver detalle de factura
                            </button>
                          </div>
                        ) : String(log.action || '').toLowerCase() ===
                          'payment_create' ? (
                          <div className="mt-2">
                            <span className="text-xs text-[#164151]/60">
                              Detalle de factura no disponible en registros antiguos.
                            </span>
                          </div>
                        ) : clientInfoId ? (
                          <div className="mt-2">
                            <button
                              onClick={() => router.push(`/admin/users/${clientInfoId}`)}
                              className="text-xs font-semibold text-[#164151] hover:text-[#0f303d] underline underline-offset-2"
                            >
                              Ver detalle del cliente
                            </button>
                          </div>
                        ) : null}
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activityTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      setActivityCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={activityCurrentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-[#164151]/70 dark:text-white/60">
                    Página {activityCurrentPage} de {activityTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setActivityCurrentPage((p) =>
                        Math.min(activityTotalPages, p + 1),
                      )
                    }
                    disabled={activityCurrentPage === activityTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search and Filters Bar */}
              <div className={clientsListStyles.toolbar}>
                <div className={clientsListStyles.toolbarRow}>
                  <div className={clientsListStyles.searchWrap}>
                    <Search className={clientsListStyles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Buscar por cédula, nombre o correo..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={clientsListStyles.searchInput}
                    />
                  </div>

                  <div className={clientsListStyles.filtersRow}>
                    <div className={clientsListStyles.filterWrap}>
                      <Filter className={clientsListStyles.filterIcon} />
                      <select
                        value={userTypeFilter}
                        onChange={(e) => {
                          setUserTypeFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={clientsListStyles.filterSelect}
                      >
                        <option value="all">Clientes: Todos</option>
                        <option value="physical">Solo físicos</option>
                        <option value="online">Solo online</option>
                        <option value="both">Ambos</option>
                      </select>
                    </div>

                    <div className={clientsListStyles.filterWrap}>
                      <Filter className={clientsListStyles.filterIcon} />
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => {
                          setPaymentStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={clientsListStyles.filterSelect}
                      >
                        <option value="all">Estado: Todos</option>
                        <option value="active">Al día</option>
                        <option value="missing-receipt">
                          Sin facturas (sede ni web)
                          {userCounts.missingPaymentReceipt > 0
                            ? ` (${userCounts.missingPaymentReceipt})`
                            : ''}
                        </option>
                        <option value="renewal">Renovar</option>
                        <option value="mix-pending">
                          Activo + renov. pendiente
                        </option>
                        <option value="mix-dismissed">
                          Activo + renov. descartada
                        </option>
                        <option value="no-products">Sin productos</option>
                        <option value="inactive">Inactivos</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingClient(null);
                      setShowClientForm(true);
                    }}
                    className={clientsListStyles.primaryBtn}
                    title="Crear cliente físico"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo cliente
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className={clientsListStyles.tableShell}>
                {loadingUsers ? (
                  <LoadingState message="Cargando clientes..." />
                ) : users.length === 0 ? (
                  <EmptyState
                    icon={userSearchTerm ? Search : Users}
                    title={
                      userSearchTerm
                        ? 'No se encontraron clientes'
                        : paymentStatusFilter === 'missing-receipt'
                          ? 'Sin casos en este filtro'
                          : 'No hay clientes registrados'
                    }
                    description={
                      userSearchTerm
                        ? `No hay clientes que coincidan con "${userSearchTerm}"`
                        : paymentStatusFilter === 'missing-receipt'
                          ? 'No hay clientes con plan vigente y sin ninguna factura en sede ni orden web aprobada.'
                          : 'Los clientes aparecerán aquí cuando se registren'
                    }
                  />
                ) : (
                  <>
                    <div className={`hidden md:block ${clientsListStyles.tableWrap}`}>
                      <table className={clientsListStyles.table}>
                        <colgroup>
                          <col style={{ width: gymClientsColWidths.client }} />
                          <col style={{ width: gymClientsColWidths.doc }} />
                          <col style={{ width: gymClientsColWidths.products }} />
                          <col style={{ width: gymClientsColWidths.type }} />
                          <col style={{ width: gymClientsColWidths.status }} />
                          <col style={{ width: gymClientsColWidths.actions }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.thLeft}`}
                            >
                              Cliente
                            </th>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.thLeft}`}
                            >
                              Documento
                            </th>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.thLeft}`}
                            >
                              Productos
                            </th>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.thLeft}`}
                            >
                              Tipo
                            </th>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.thLeft}`}
                            >
                              Estado
                            </th>
                            <th
                              className={`${clientsListStyles.th} ${clientsListStyles.actionsCellTh}`}
                            >
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => {
                            // Calcular si tiene más de 30 días sin pagar (fechas locales)
                            const today = getGymAdminToday();
                            const allMemberships = user.gym_memberships || [];
                            const calendarExpiredRows =
                              getCalendarExpiredNonCancelled(
                                allMemberships,
                                today,
                              );
                            const latestExpired =
                              calendarExpiredRows.length > 0
                                ? [...calendarExpiredRows].sort(
                                    (a: any, b: any) =>
                                      parseLocalDate(b.end_date).getTime() -
                                      parseLocalDate(a.end_date).getTime(),
                                  )[0]
                                : null;
                            const daysSinceExpired = latestExpired
                              ? Math.floor(
                                  (today.getTime() -
                                    parseLocalDate(
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
                                className={`${isAdminUser ? clientsListStyles.rowStatic : clientsListStyles.row} ${
                                  isInactive ? clientsListStyles.rowInactive : ''
                                }`}
                              >
                                <td className={clientsListStyles.td}>
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <AdminUserListAvatar user={user} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <p className={clientsListStyles.clientName}>
                                          {user.name ||
                                            user.full_name ||
                                            'Sin nombre'}
                                        </p>
                                        {!user.isUnregisteredClient && (
                                          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#85ea10]">
                                            <Check className="h-2 w-2 stroke-[3] text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <p className={clientsListStyles.clientEmail}>
                                        {user.email || 'Sin email'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className={clientsListStyles.td}>
                                  {user.document_id ? (
                                    <span className={clientsListStyles.docCell}>
                                      <CreditCard className="w-3 h-3 text-gray-400 dark:text-white/35" />
                                      {user.document_id}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 dark:text-white/35">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className={clientsListStyles.td}>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const allMemberships =
                                        user.gym_memberships || [];
                                      const allCourses =
                                        user.activeCoursePurchases || [];
                                      const allProducts = buildAdminProductsList(
                                        allMemberships,
                                        allCourses,
                                      );

                                      if (allProducts.length === 0) {
                                        return (
                                          <span className="text-sm text-gray-400 dark:text-white/35">
                                            Sin productos
                                          </span>
                                        );
                                      }

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
                                          <span className="text-sm text-gray-400 dark:text-white/35">
                                            Sin productos
                                          </span>
                                        );
                                      }

                                      return (
                                        <button
                                          onClick={handleClick}
                                          className="flex w-full min-w-0 items-center gap-1.5 text-left transition-opacity hover:opacity-80 cursor-pointer"
                                          title={
                                            hasMoreProducts
                                              ? `Ver todos los productos (${allProducts.length})`
                                              : firstProduct.name
                                          }
                                        >
                                          <span className={clientsListStyles.productName}>
                                            {firstProduct.name}
                                          </span>
                                          {hasMoreProducts && (
                                            <span className={clientsListStyles.productMore}>
                                              +{allProducts.length - 1}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className={clientsListStyles.td}>
                                  <div>
                                    {user.userType === 'both' && (
                                      <span className={clientsListStyles.typeBadgeBoth}>
                                        Ambos
                                      </span>
                                    )}
                                    {user.userType === 'physical' && (
                                      <span className={clientsListStyles.typeBadge}>
                                        <Dumbbell className="w-3 h-3" />
                                        Físico
                                      </span>
                                    )}
                                    {user.userType === 'online' && (
                                      <span className={clientsListStyles.typeBadgeOnline}>
                                        <Globe className="w-3 h-3" />
                                        Online
                                      </span>
                                    )}
                                    {user.userType === 'none' && (
                                      <span className="text-xs text-gray-400 dark:text-white/35">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className={clientsListStyles.td}>
                                  <GymClientPaymentStatusBadge
                                    memberships={user.gym_memberships}
                                    activeCoursePurchases={
                                      user.activeCoursePurchases
                                    }
                                    isInactive={user.is_inactive}
                                    renewalFollowupDismissedPlanIds={
                                      user.renewal_followup_dismissed_plan_ids
                                    }
                                    size="sm"
                                  />
                                </td>
                                <td className={clientsListStyles.td}>
                                  <div
                                    className={clientsListStyles.actionsCell}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Botón Recordatorio/Inactivar - visible solo cuando tiene estado "Renovar" (planes vencidos) */}
                                    {(() => {
                                      const today = getGymAdminToday();
                                      const allMemberships =
                                        user.gym_memberships || [];
                                      const ctx = buildGymRenewalAdminContext(
                                        allMemberships,
                                        today,
                                      );
                                      const nonCancelledCount =
                                        allMemberships.filter(
                                          (m: any) => m.status !== 'cancelled',
                                        ).length;
                                      const hasOnlyExpiredMemberships =
                                        nonCancelledCount > 0 &&
                                        ctx.active.length === 0 &&
                                        ctx.expired.length === nonCancelledCount;

                                      const isInactive =
                                        user.is_inactive || false;

                                      const reminderPendingIds =
                                        renewalPendingPlanIdsFromMemberships(
                                          ctx.expiredNeedingRenewal,
                                        );
                                      const reminderAllDismissed =
                                        allRenewalPlansDismissed(
                                          reminderPendingIds,
                                          user.renewal_followup_dismissed_plan_ids,
                                        );

                                      if (
                                        !hasOnlyExpiredMemberships ||
                                        reminderAllDismissed ||
                                        !(user.whatsapp || user.phone) ||
                                        isInactive
                                      ) {
                                        return null;
                                      }

                                      const latestExpired = [...ctx.expired].sort(
                                        (a: any, b: any) =>
                                          parseLocalDate(b.end_date).getTime() -
                                          parseLocalDate(a.end_date).getTime(),
                                      )[0];
                                      const expiredDate = parseLocalDate(
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
                                            className={clientsListStyles.actionBtn}
                                            title="Inactivar usuario (30 días sin pagar)"
                                          >
                                            <Ban className="w-4 h-4" />
                                          </button>
                                        );
                                      }

                                      // Menos de 30 días, mostrar botón "Recordatorio" normal
                                      const latestMembership =
                                        allMemberships.length > 0
                                          ? [...allMemberships].sort(
                                              (a: any, b: any) =>
                                                parseLocalDate(
                                                  b.end_date,
                                                ).getTime() -
                                                parseLocalDate(
                                                  a.end_date,
                                                ).getTime(),
                                            )[0]
                                          : null;
                                      const planName =
                                        latestMembership?.plan?.name ||
                                        'tu plan';
                                      const endDate = latestMembership?.end_date
                                        ? formatDateOnlyLocal(
                                            latestMembership.end_date,
                                            {
                                              day: '2-digit',
                                              month: 'long',
                                              year: 'numeric',
                                            },
                                          )
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
                                          className={clientsListStyles.whatsappAction}
                                          title="WhatsApp: recordatorio de renovación"
                                        >
                                          <WhatsAppIcon className="w-4 h-4" />
                                        </button>
                                      );
                                    })()}
                                    {(() => {
                                      const today = getGymAdminToday();
                                      const allMemberships =
                                        user.gym_memberships || [];
                                      const allCourses =
                                        user.activeCoursePurchases || [];
                                      const ctxFollow =
                                        buildGymRenewalAdminContext(
                                          allMemberships,
                                          today,
                                        );
                                      const activeMemberships = ctxFollow.active;
                                      const expiredMemberships =
                                        ctxFollow.expired;
                                      const expiredNeedingRenewalFollow =
                                        ctxFollow.expiredNeedingRenewal;
                                      const nonCancelled = allMemberships.filter(
                                        (m: any) => m.status !== 'cancelled',
                                      );
                                      const dismissedPlanIds =
                                        user.renewal_followup_dismissed_plan_ids ||
                                        [];
                                      const dismissedSet = new Set(
                                        dismissedPlanIds,
                                      );

                                      const physicalOnlyAllExpired =
                                        nonCancelled.length > 0 &&
                                        allCourses.length === 0 &&
                                        activeMemberships.length === 0 &&
                                        expiredMemberships.length ===
                                          nonCancelled.length;
                                      const physicalOnlyMix =
                                        nonCancelled.length > 0 &&
                                        allCourses.length === 0 &&
                                        activeMemberships.length > 0 &&
                                        expiredMemberships.length > 0;
                                      const physicalOnlineExpired =
                                        nonCancelled.length > 0 &&
                                        allCourses.length > 0 &&
                                        expiredMemberships.length > 0;

                                      const canFollowRenewal =
                                        expiredNeedingRenewalFollow.length >
                                          0 &&
                                        (physicalOnlyAllExpired ||
                                          physicalOnlyMix ||
                                          physicalOnlineExpired);

                                      if (!canFollowRenewal) return null;

                                      const planOptions =
                                        buildRenewalPlanMenuOptions(
                                          expiredNeedingRenewalFollow,
                                        );
                                      if (planOptions.length === 0) return null;

                                      const toDismiss = planOptions.filter(
                                        (p) => !dismissedSet.has(p.planId),
                                      );
                                      const toReopen = planOptions.filter((p) =>
                                        dismissedSet.has(p.planId),
                                      );

                                      const clientInfoIdForPatch =
                                        user.isUnregisteredClient
                                          ? user.id
                                          : user.client_info_id ||
                                            user.gym_memberships?.[0]
                                              ?.client_info_id ||
                                            user.id;

                                      const runPatchPlan = async (
                                        e: React.MouseEvent,
                                        planId: string,
                                        next: boolean,
                                      ) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch(
                                            `/api/admin/gym/clients/${clientInfoIdForPatch}/renewal-followup`,
                                            {
                                              method: 'PATCH',
                                              headers: {
                                                'Content-Type':
                                                  'application/json',
                                              },
                                              body: JSON.stringify({
                                                plan_id: planId,
                                                renewal_followup_dismissed:
                                                  next,
                                              }),
                                            },
                                          );
                                          if (!res.ok) throw new Error();
                                          setRenewalFollowupMenuClientId(null);
                                          loadUsers();
                                        } catch {
                                          // noop
                                        }
                                      };

                                      const menuActionCount =
                                        toDismiss.length + toReopen.length;
                                      const useCompact =
                                        menuActionCount === 1 &&
                                        (toDismiss.length === 1 ||
                                          toReopen.length === 1);

                                      if (useCompact) {
                                        const single =
                                          toDismiss[0] ?? toReopen[0];
                                        const isDismiss =
                                          toDismiss.length === 1;
                                        return (
                                          <button
                                            type="button"
                                            onClick={(e) =>
                                              runPatchPlan(
                                                e,
                                                single.planId,
                                                isDismiss,
                                              )
                                            }
                                            className={`${clientsListStyles.actionBtn} ${isDismiss ? 'text-amber-700 dark:text-amber-400' : ''}`}
                                            title={
                                              isDismiss
                                                ? `No insistir: ${single.label}`
                                                : `Reabrir seguimiento: ${single.label}`
                                            }
                                          >
                                            {isDismiss ? (
                                              <BellOff className="w-4 h-4" />
                                            ) : (
                                              <RefreshCw className="w-4 h-4" />
                                            )}
                                          </button>
                                        );
                                      }

                                      const showDismissPrimary =
                                        toDismiss.length > 0;

                                      return (
                                        <div className="relative">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRenewalFollowupMenuClientId(
                                                (prev) =>
                                                  prev === user.id
                                                    ? null
                                                    : user.id,
                                              );
                                            }}
                                            className={`${clientsListStyles.actionBtn} gap-0.5 text-amber-800 dark:text-amber-300`}
                                            title="Seguimiento de renovación por plan"
                                          >
                                            {showDismissPrimary ? (
                                              <BellOff className="w-3.5 h-3.5" />
                                            ) : (
                                              <RefreshCw className="w-3.5 h-3.5" />
                                            )}
                                            <ChevronDown className="w-3 h-3 shrink-0 opacity-80" />
                                          </button>
                                          {renewalFollowupMenuClientId ===
                                            user.id && (
                                            <div
                                              className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] max-w-[16rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-gray-900"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              onMouseDown={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              {toDismiss.length > 0 && (
                                                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                                  No insistir
                                                </p>
                                              )}
                                              {toDismiss.map((p) => (
                                                <button
                                                  key={`d-${p.planId}`}
                                                  type="button"
                                                  className="block w-full px-3 py-2 text-left text-xs text-[#164151] hover:bg-gray-50 dark:text-white dark:hover:bg-white/10"
                                                  onClick={(e) =>
                                                    runPatchPlan(
                                                      e,
                                                      p.planId,
                                                      true,
                                                    )
                                                  }
                                                >
                                                  {p.label}
                                                </button>
                                              ))}
                                              {toDismiss.length > 0 &&
                                                toReopen.length > 0 && (
                                                  <div className="my-1 border-t border-gray-100 dark:border-white/10" />
                                                )}
                                              {toReopen.length > 0 && (
                                                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                                                  Reabrir
                                                </p>
                                              )}
                                              {toReopen.map((p) => (
                                                <button
                                                  key={`r-${p.planId}`}
                                                  type="button"
                                                  className="block w-full px-3 py-2 text-left text-xs text-[#164151] hover:bg-gray-50 dark:text-white dark:hover:bg-white/10"
                                                  onClick={(e) =>
                                                    runPatchPlan(
                                                      e,
                                                      p.planId,
                                                      false,
                                                    )
                                                  }
                                                >
                                                  {p.label}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
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
                                          className={clientsListStyles.actionBtn}
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
                                          className={clientsListStyles.actionBtn}
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
                    <div className={clientsListStyles.mobileList}>
                      {users.map((user) => {
                        const memberships = user.gym_memberships || [];
                        const gymStatus =
                          user.gym_client_status ??
                          computeClientGymAdminStatus(
                            summarizeGymPlansPerClient(memberships),
                            memberships,
                          );
                        const ctxMobile =
                          buildGymRenewalAdminContext(memberships);
                        const hasExpired =
                          gymStatus === 'renewal' ||
                          gymStatus === 'partial_renewal';

                        const statusColor = user.is_inactive
                          ? 'border-red-400/60'
                          : gymStatus === 'all_current'
                            ? 'border-emerald-400/50'
                            : gymStatus === 'scheduled_only'
                              ? 'border-cyan-400/60'
                              : gymStatus === 'renewal'
                                ? allRenewalPlansDismissed(
                                    renewalPendingPlanIdsFromMemberships(
                                      ctxMobile.expiredNeedingRenewal,
                                    ),
                                    user.renewal_followup_dismissed_plan_ids,
                                  )
                                  ? 'border-slate-400/60'
                                  : 'border-orange-400/60'
                                : gymStatus === 'partial_renewal'
                                  ? 'border-amber-400/60'
                                  : gymStatus === 'cancelled_only'
                                    ? 'border-slate-400/60'
                                    : 'border-gray-300';

                        const statusBadge = (
                          <GymClientPaymentStatusBadge
                            memberships={memberships}
                            activeCoursePurchases={user.activeCoursePurchases}
                            isInactive={user.is_inactive}
                            renewalFollowupDismissedPlanIds={
                              user.renewal_followup_dismissed_plan_ids
                            }
                            size="sm"
                          />
                        );

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
                            <div className="flex justify-between items-start mb-2 gap-3">
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                <AdminUserListAvatar user={user} />
                                <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-bold text-[#164151] dark:text-white truncate">
                                    {user.name ||
                                      user.full_name ||
                                      'Sin nombre'}
                                  </h4>
                                  {!user.isUnregisteredClient && (
                                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#85ea10]">
                                      <Check className="h-2.5 w-2.5 stroke-[3] text-white" />
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
                                    className="p-2.5 bg-[#25D366]/15 text-[#25D366] rounded-full hover:bg-[#25D366]/25 transition-colors"
                                    title="WhatsApp"
                                  >
                                    <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
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
                                {/* Planes con período en curso */}
                                {ctxMobile.current.length > 0 &&
                                  ctxMobile.current.map(
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
                                {/* Planes vencidos que piden renovación */}
                                {ctxMobile.expiredNeedingRenewal.map(
                                  (membership: any, idx: number) => (
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
                                  ),
                                )}
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
                    <div className={clientsListStyles.pager}>
                      <p className={clientsListStyles.footerText}>
                        Mostrando {(currentPage - 1) * usersPerPage + 1}–
                        {Math.min(currentPage * usersPerPage, usersListTotal)} de{' '}
                        {usersListTotal} clientes
                      </p>

                      <div className="flex items-center gap-2">
                        {/* First Page Button */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className={currentPage === 1 ? `${clientsListStyles.pagerBtn} opacity-40 pointer-events-none` : clientsListStyles.pagerBtn}
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
                          className={currentPage === 1 ? `${clientsListStyles.pagerBtn} opacity-40 pointer-events-none` : clientsListStyles.pagerBtn}
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
                                  className={clientsListStyles.pagerBtnPage}
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
                                  className={currentPage === i ? clientsListStyles.pagerBtnActive : clientsListStyles.pagerBtnPage}
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
                                  className={clientsListStyles.pagerBtnPage}
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
                          className={currentPage === totalPages || totalPages === 0 ? `${clientsListStyles.pagerBtn} opacity-40 pointer-events-none` : clientsListStyles.pagerBtn}
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
                          className={currentPage === totalPages || totalPages === 0 ? `${clientsListStyles.pagerBtn} opacity-40 pointer-events-none` : clientsListStyles.pagerBtn}
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

          {/* Sales Tab - Historial de transacciones (solo online / Wompi) */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                <button
                  onClick={() => loadSales()}
                  disabled={loadingSales}
                  className="bg-gray-100 dark:bg-white/10 text-[#164151] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 font-semibold px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingSales ? 'animate-spin' : ''}`}
                  />
                  Actualizar
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/40" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={salesSearchTerm}
                      onChange={(e) => {
                        setSalesSearchTerm(e.target.value);
                        setSalesCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[#164151] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                    />
                  </div>
                  <div className="sm:w-52 shrink-0">
                    <label className="sr-only" htmlFor="sales-status-filter">
                      Estado del pago
                    </label>
                    <select
                      id="sales-status-filter"
                      value={salesStatusFilter}
                      onChange={(e) => {
                        setSalesStatusFilter(e.target.value);
                        setSalesCurrentPage(1);
                      }}
                      className="w-full py-3 px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#164151] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#85ea10]/50"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="approved">Aprobado</option>
                      <option value="pending">Pendiente</option>
                      <option value="declined">Rechazado</option>
                      <option value="error">Error</option>
                      <option value="expired">Expirado</option>
                    </select>
                  </div>
                </div>

                {loadingSales ? (
                  <div className="py-12 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[#85ea10] animate-spin" />
                  </div>
                ) : paginatedSales.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-white/50 text-sm">
                    {filteredSales.length === 0 && sales.length === 0
                      ? 'No hay transacciones.'
                      : 'No hay transacciones que coincidan con el filtro.'}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full min-w-[860px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/10">
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              ID transacción Wompi
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Producto
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="text-right px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
                              Método
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {paginatedSales.map((sale: Sale) => {
                            const fullWompi = fullWompiOrderId(sale);
                            return (
                            <tr
                              key={sale.id}
                              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="px-3 md:px-4 py-3">
                                {!fullWompi ? (
                                  <span className="text-sm text-gray-400 dark:text-white/40">
                                    —
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="text-sm font-mono font-semibold text-[#164151] dark:text-white tabular-nums"
                                      title={fullWompi}
                                    >
                                      …{wompiIdLastFiveDigits(fullWompi)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(
                                            fullWompi,
                                          );
                                          setCopiedWompiSaleId(sale.id);
                                          setTimeout(
                                            () =>
                                              setCopiedWompiSaleId((cur) =>
                                                cur === sale.id ? null : cur,
                                              ),
                                            2000,
                                          );
                                        } catch {
                                          /* ignore */
                                        }
                                      }}
                                      className="shrink-0 p-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#164151] dark:hover:text-white transition-colors"
                                      title="Copiar ID completo"
                                      aria-label="Copiar ID completo de Wompi"
                                    >
                                      {copiedWompiSaleId === sale.id ? (
                                        <Check className="w-4 h-4 text-[#85ea10]" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 md:px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-[#164151] dark:text-white truncate max-w-[180px]">
                                    {sale.profile?.name ||
                                      sale.customer_name ||
                                      '—'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-white/50 truncate max-w-[180px]">
                                    {sale.profile?.email ||
                                      sale.customer_email ||
                                      '—'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-3 md:px-4 py-3">
                                <span className="text-sm text-[#164151] dark:text-white">
                                  {sale.course
                                    ? sale.course.title
                                    : sale.gym_plan
                                      ? sale.gym_plan.name
                                      : '—'}
                                </span>
                              </td>
                              <td className="px-3 md:px-4 py-3">
                                <p className="text-sm font-medium text-[#164151] dark:text-white whitespace-nowrap">
                                  {formatSaleDateTime(
                                    sale.updated_at || sale.created_at,
                                  )}
                                </p>
                                {sale.updated_at &&
                                  sale.created_at &&
                                  sale.updated_at !== sale.created_at && (
                                    <p className="text-[10px] text-gray-500 dark:text-white/45 mt-0.5">
                                      Orden:{' '}
                                      {formatSaleDateTime(sale.created_at)}
                                    </p>
                                  )}
                              </td>
                              <td className="px-3 md:px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-[#164151] dark:text-white">
                                  ${(sale.amount || 0).toLocaleString('es-CO')}{' '}
                                  {sale.currency === 'COP'
                                    ? ''
                                    : sale.currency || ''}
                                </span>
                              </td>
                              <td className="px-3 md:px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    (sale.status || '').toLowerCase() ===
                                    'approved'
                                      ? 'bg-[#85ea10]/20 text-[#85ea10]'
                                      : (sale.status || '').toLowerCase() ===
                                          'pending'
                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                        : (sale.status || '').toLowerCase() ===
                                            'declined'
                                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                          : (sale.status || '').toLowerCase() ===
                                              'expired'
                                            ? 'bg-gray-300/30 text-gray-600 dark:text-white/50'
                                            : (sale.status || '').toLowerCase() ===
                                                'error'
                                              ? 'bg-rose-600/20 text-rose-700 dark:text-rose-300'
                                              : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60'
                                  }`}
                                >
                                  {(sale.status || '—') === 'approved'
                                    ? 'Aprobado'
                                    : (sale.status || '') === 'pending'
                                      ? 'Pendiente'
                                      : (sale.status || '') === 'declined'
                                        ? 'Rechazado'
                                        : (sale.status || '') === 'expired'
                                          ? 'Expirado'
                                          : (sale.status || '') === 'error'
                                            ? 'Error'
                                            : sale.status || '—'}
                                </span>
                              </td>
                              <td className="px-3 md:px-4 py-3 text-xs text-gray-600 dark:text-white/60">
                                {sale.payment_method || '—'}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {salesTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-500 dark:text-white/50">
                          Mostrando {(salesCurrentPage - 1) * salesPerPage + 1}–
                          {Math.min(
                            salesCurrentPage * salesPerPage,
                            filteredSales.length,
                          )}{' '}
                          de {filteredSales.length} transacciones
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setSalesCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={salesCurrentPage <= 1}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm text-[#164151] dark:text-white">
                            {salesCurrentPage} / {salesTotalPages}
                          </span>
                          <button
                            onClick={() =>
                              setSalesCurrentPage((p) =>
                                Math.min(salesTotalPages, p + 1),
                              )
                            }
                            disabled={salesCurrentPage >= salesTotalPages}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
                                  ? `Inicia: ${formatDateOnlyLocal(product.membership.start_date, { day: '2-digit', month: 'short' })}`
                                  : product.isActive
                                    ? `Vence: ${formatDateOnlyLocal(product.membership.end_date, { day: '2-digit', month: 'short' })}`
                                    : `Venció: ${formatDateOnlyLocal(product.membership.end_date, { day: '2-digit', month: 'short' })}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                            product.missingRegisteredPayment
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200'
                              : product.isScheduled
                                ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                                : product.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : product.isCancelled
                                    ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400'
                                    : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {product.missingRegisteredPayment
                            ? 'Sin facturas'
                            : product.isScheduled
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
      <DailyBirthdaysModal
        isOpen={
          dailyBirthdays.isOpen ||
          (reopenBirthdaysModal && birthdayClients.length > 0)
        }
        onClose={() => {
          dailyBirthdays.close();
          setReopenBirthdaysModal(false);
        }}
        clients={
          reopenBirthdaysModal && birthdayClients.length > 0
            ? birthdayClients.map((c) => {
                const birthYmd =
                  parseBirthDateYmd(c.birth_date) ??
                  String(c.birth_date).slice(0, 10);
                return {
                  id: c.id,
                  name: c.name,
                  document_id: c.document_id,
                  email: c.email,
                  whatsapp: c.whatsapp,
                  birth_date: birthYmd,
                  age: c.age ?? 0,
                  birthDayMonthLabel: formatBirthDayMonthLabel(birthYmd),
                };
              })
            : dailyBirthdays.clients
        }
        loading={dailyBirthdays.loading && !reopenBirthdaysModal}
        dateYmd={dailyBirthdays.dateYmd}
      />
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
    <Suspense fallback={null}>
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
