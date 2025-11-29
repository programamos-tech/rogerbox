'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  Building2, 
  BarChart3, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  X,
  CheckCircle,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  FileText,
  TrendingUp,
  Bell
} from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';
import CourseCreator from '@/components/admin/CourseCreator';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import BlogManagement from '@/components/admin/BlogManagement';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalSales: number;
  totalRevenue: number;
  activeCourses: number;
  enterpriseLicenses: number;
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

// Definición de las secciones del sidebar
const menuSections = [
  {
    title: 'Principal',
    items: [
      { id: 'overview', label: 'Dashboard', icon: BarChart3, description: 'Resumen general' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { id: 'courses', label: 'Cursos', icon: BookOpen, description: 'Gestionar cursos' },
      { id: 'blogs', label: 'Blogs', icon: FileText, description: 'Artículos nutricionales' },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { id: 'users', label: 'Usuarios', icon: Users, description: 'Clientes registrados' },
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, description: 'Historial de compras' },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { id: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes de la plataforma' },
    ]
  }
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    isLoading: false
  });

  // Verificar si es admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && (session?.user as any)?.id !== 'cdeaf7e0-c7fa-40a9-b6e9-288c9a677b5e') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      loadAdminData();
    }
  }, [status, session, router]);

  // Cargar datos cuando se cambie de pestaña
  useEffect(() => {
    if (activeTab === 'courses') {
      loadCourses();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setStats({
        totalUsers: 150,
        totalCourses: 8,
        totalSales: 45,
        totalRevenue: 4500,
        activeCourses: 6,
        enterpriseLicenses: 2
      });
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
        .select(`
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
        `)
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleCoursePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, is_published: !currentStatus }
          : course
      ));
    } catch (error) {
      console.error('Error updating course status:', error);
    }
  };

  const editCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const courseWithLessons = {
        ...course,
        lessons: course.course_lessons || []
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
      isLoading: false
    });
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    try {
      setConfirmDialog(prev => ({ ...prev, isLoading: true }));

      const { error: lessonsError } = await supabase
        .from('course_lessons')
        .delete()
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (courseError) throw courseError;
      
      setCourses(prev => prev.filter(course => course.id !== courseId));
      
      setConfirmDialog({
        isOpen: true,
        title: 'Curso Eliminado',
        message: `El curso "${courseTitle}" ha sido eliminado exitosamente.`,
        type: 'success',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });

    } catch (error) {
      console.error('Error deleting course:', error);
      setConfirmDialog({
        isOpen: true,
        title: 'Error',
        message: 'Error al eliminar el curso. Por favor, inténtalo de nuevo.',
        type: 'danger',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });
    }
  };

  // Obtener el item activo actual
  const getActiveItem = () => {
    for (const section of menuSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item;
    }
    return menuSections[0].items[0];
  };

  if (status === 'loading' || loading) {
    return <QuickLoading message="Cargando panel de administración..." duration={1000} />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if ((session?.user as any)?.id !== 'cdeaf7e0-c7fa-40a9-b6e9-288c9a677b5e') {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10
        flex flex-col
        transition-all duration-300 ease-in-out
      `}>
        {/* Logo Header */}
        <div className={`
          h-16 flex items-center border-b border-gray-200 dark:border-white/10 px-4
          ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
        `}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-gray-900 dark:text-white font-bold text-lg tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
                <span className="text-[10px] text-gray-500 dark:text-white/40 uppercase tracking-widest">Admin Panel</span>
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
                <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
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
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-[#85ea10] text-black' 
                          : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : ''}`} />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <span className={`text-sm font-medium ${isActive ? 'text-black' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                      )}
                      {!sidebarCollapsed && isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className={`
          border-t border-gray-200 dark:border-white/10 p-4
          ${sidebarCollapsed ? 'flex justify-center' : ''}
        `}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/40 truncate">Super Admin</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Ir al Dashboard"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
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
        <header className="h-16 bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/60"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{activeItem.label}</h1>
              <p className="text-sm text-gray-500 dark:text-white/40 hidden sm:block">{activeItem.description}</p>
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
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Crear Curso</span>
              </button>
            )}
            
            {/* Notifications */}
            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#85ea10] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Total Usuarios"
                  value={stats?.totalUsers || 0}
                  trend="+12%"
                  color="blue"
                />
                <StatCard
                  icon={BookOpen}
                  label="Cursos Activos"
                  value={stats?.activeCourses || 0}
                  trend="+3"
                  color="green"
                />
                <StatCard
                  icon={ShoppingCart}
                  label="Total Ventas"
                  value={stats?.totalSales || 0}
                  trend="+8%"
                  color="yellow"
                />
                <StatCard
                  icon={DollarSign}
                  label="Ingresos"
                  value={`$${stats?.totalRevenue?.toLocaleString() || 0}`}
                  trend="+15%"
                  color="purple"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Crear Curso"
                  description="Añadir nuevo curso a la plataforma"
                  icon={Plus}
                  color="green"
                  onClick={() => {
                    setEditingCourse(null);
                    setShowCourseCreator(true);
                  }}
                />
                <QuickActionCard
                  title="Ver Usuarios"
                  description="Gestionar usuarios registrados"
                  icon={Users}
                  color="blue"
                  onClick={() => setActiveTab('users')}
                />
                <QuickActionCard
                  title="Ver Ventas"
                  description="Historial de transacciones"
                  icon={TrendingUp}
                  color="purple"
                  onClick={() => setActiveTab('sales')}
                />
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
                    label: "Crear Curso",
                    onClick: () => {
                      setEditingCourse(null);
                      setShowCourseCreator(true);
                    }
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      setCurrentPage(1); // Reset to first page on search
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
                ) : (() => {
                  // Filter users based on search term
                  const filteredUsers = users.filter(user => 
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
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">Usuario</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">Email</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">Meta</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden md:table-cell">Peso</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider hidden lg:table-cell">Registro</th>
                              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">Estado</th>
                              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {paginatedUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {user.name || 'Sin nombre'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">{user.email}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 hidden lg:table-cell">
                                  {user.goals || user.goal || 'No especificada'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 hidden md:table-cell">
                                  {user.current_weight ? `${user.current_weight} kg` : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/40 hidden lg:table-cell">
                                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                    user.subscription_status === 'active' 
                                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'
                                  }`}>
                                    {user.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-1">
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors cursor-pointer">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer">
                                      <Trash2 className="w-4 h-4" />
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
                          Mostrando <span className="text-gray-900 dark:text-white font-medium">{startIndex + 1}</span> a{' '}
                          <span className="text-gray-900 dark:text-white font-medium">{Math.min(endIndex, totalUsers)}</span> de{' '}
                          <span className="text-gray-900 dark:text-white font-medium">{totalUsers}</span> usuarios
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
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                                    <span key="ellipsis-start" className="px-2 text-gray-400 dark:text-white/40">...</span>
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
                                    <span key="ellipsis-end" className="px-2 text-gray-400 dark:text-white/40">...</span>
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
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
                })()}
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <EmptyState
              icon={ShoppingCart}
              title="Panel de Ventas"
              description="El historial de ventas estará disponible próximamente"
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
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.type === 'danger' ? 'Eliminar' : 'Confirmar'}
        cancelText="Cancelar"
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}

// ===== Componentes Auxiliares =====

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  trend: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const iconColors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-[#85ea10] text-black',
    yellow: 'bg-yellow-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconColors[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">{label}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: any;
  color: 'green' | 'blue' | 'purple';
  onClick: () => void;
}

function QuickActionCard({ title, description, icon: Icon, color, onClick }: QuickActionCardProps) {
  const colors = {
    green: 'bg-[#85ea10] text-black hover:bg-[#7dd30f]',
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-5 flex items-center justify-between shadow-sm dark:shadow-none">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">{description}</p>
      </div>
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${colors[color]}`}
      >
        <Icon className="w-5 h-5" />
      </button>
    </div>
  );
}

interface ActivityItemProps {
  icon: any;
  text: string;
  time: string;
  color: 'green' | 'blue' | 'yellow';
}

function ActivityItem({ icon: Icon, text, time, color }: ActivityItemProps) {
  const colors = {
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">{text}</p>
        <p className="text-xs text-gray-500 dark:text-white/40">{time}</p>
      </div>
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}

function CourseCard({ course, onEdit, onDelete, onTogglePublish }: CourseCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-5 hover:border-gray-300 dark:hover:border-white/20 transition-all group shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 pr-3">
          {course.title}
        </h3>
        <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${
          course.is_published 
            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
            : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
        }`}>
          {course.is_published ? 'Publicado' : 'Borrador'}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-2 mb-4">
        {course.short_description}
      </p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-white/40">Precio</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            ${course.price?.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-white/40">Duración</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {course.duration_days} días
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-white/40">Nivel</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {course.level}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500 dark:text-white/40">Estudiantes</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {course.students_count}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onEdit}
          className="flex-1 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Edit className="w-4 h-4" />
          Editar
        </button>
        <button 
          onClick={onDelete}
          className="flex-1 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
        <button 
          onClick={onTogglePublish}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            course.is_published
              ? 'bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400'
              : 'bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-600 dark:text-green-400'
          }`}
        >
          {course.is_published ? (
            <>
              <X className="w-4 h-4" />
              Ocultar
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Publicar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 shadow-sm dark:shadow-none">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#85ea10]/30 border-t-[#85ea10] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 dark:text-white/60">{message}</p>
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
    <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 p-12 shadow-sm dark:shadow-none">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-white/30" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-white/40 mb-6 max-w-sm">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
