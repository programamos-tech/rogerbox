'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { Star, Clock, Users, Play, ShoppingCart, Heart, ArrowLeft, CheckCircle, Zap, Target, Award, Shield, Tag, CreditCard, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import WompiCheckout from '@/components/WompiCheckout';
import RogerBoxMuxPlayer from '@/components/RogerBoxMuxPlayer';
import Footer from '@/components/Footer';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  preview_image?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category?: string;
  category_name?: stringimage.png;
  rating?: number;
  students_count?: number;
  lessons_count?: number;
  duration?: string;
  level?: string;
  is_published?: boolean;
  created_at?: string;
  slug?: string;
  calories_burned?: number;
  mux_playback_id?: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url?: string;
  preview_image?: string;
  lesson_number: number;
  lesson_order: number;
  duration_minutes: number;
  is_preview: boolean;
  views_count: number;
  created_at: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Cargar categorías desde la base de datos
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('course_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        
        // Crear mapeo de categorías
        const map: { [key: string]: string } = {};
        (data || []).forEach(cat => {
          map[cat.id] = cat.name;
        });
        setCategoryMap(map);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return 'Sin categoría';
    return categoryMap[categoryId] || 'Sin categoría';
  };

  // Resolver parámetros de manera segura
  const resolvedParams = params || {};
  const courseId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

  // Cargar perfil del usuario si está autenticado
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [session, status]);

  // Cerrar el menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  useEffect(() => {
    // Cargar datos del curso sin requerir autenticación
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Limpiar el ID del curso (remover parámetros de query)
      if (!courseId) {
        setError('ID del curso no encontrado');
        setLoading(false);
        return;
      }

      const cleanId = courseId.split('?')[0];
      console.log('🔍 Debug: cleanId =', cleanId);

      // Buscar curso por slug o UUID en la base de datos
      let course = null;
      let courseError = null;

      // Primero intentar buscar por slug
      console.log('🔍 Debug: Buscando por slug...');
      const { data: courseBySlug, error: slugError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', cleanId)
        .eq('is_published', true)
        .maybeSingle();

      console.log('🔍 Debug: courseBySlug =', courseBySlug);
      console.log('🔍 Debug: slugError =', slugError);

      if (courseBySlug && !slugError) {
        course = courseBySlug;
        console.log('✅ Debug: Curso encontrado por slug');
      } else {
        // Si no se encuentra por slug, intentar por UUID
        console.log('🔍 Debug: Buscando por UUID...');
        const { data: courseById, error: idError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', cleanId)
          .eq('is_published', true)
          .maybeSingle();

        console.log('🔍 Debug: courseById =', courseById);
        console.log('🔍 Debug: idError =', idError);

        if (courseById && !idError) {
          course = courseById;
          console.log('✅ Debug: Curso encontrado por UUID');
        } else {
          courseError = idError;
          console.log('❌ Debug: Curso no encontrado por UUID');
        }
      }

      console.log('🔍 Debug: course final =', course);
      console.log('🔍 Debug: courseError final =', courseError);

      if (courseError || !course) {
        console.log('❌ Debug: Estableciendo error - Curso no encontrado');
        setError('Curso no encontrado');
        setLoading(false);
      return;
    }

      setCourse(course);
      console.log('✅ Debug: Curso establecido correctamente');
      console.log('💰 Debug: Datos de precio:', {
        price: course.price,
        original_price: course.original_price,
        discount_percentage: course.discount_percentage
      });

      // Cargar lecciones del curso
      try {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('lesson_order', { ascending: true });

        if (lessonsError) {
          console.warn('Warning: Could not load lessons:', lessonsError);
          setLessons([]);
      } else {
          setLessons(lessons || []);
      }
    } catch (error) {
        console.warn('Warning: Error loading lessons:', error);
        setLessons([]);
      }

      // Verificar si el usuario está inscrito
      if (session?.user && 'id' in session.user) {
        try {
          const { data: enrollment } = await supabase
            .from('course_purchases')
            .select('id')
            .eq('user_id', (session.user as any).id)
            .eq('course_id', course.id)
            .eq('is_active', true)
            .maybeSingle();

          setIsEnrolled(!!enrollment);
        } catch (error) {
          console.warn('Warning: Could not check enrollment status:', error);
          setIsEnrolled(false);
        }
      }

      // Verificar si es favorito
      if (session?.user && 'id' in session.user) {
        try {
          const { data: favorite } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', (session.user as any).id)
            .eq('course_id', course.id)
            .maybeSingle();

          setIsFavorite(!!favorite);
    } catch (error) {
          console.warn('Warning: Could not check favorite status:', error);
          setIsFavorite(false);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading course data:', error);
      setError('Error al cargar el curso');
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!course) return;
    
    // MANDATORY: Validar que el usuario esté autenticado ANTES de permitir compra
    if (!session?.user) {
      // Guardar la URL actual para redirigir después del login
      const currentUrl = window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Validar si el usuario ya compró este curso
    if (isEnrolled) {
      alert('Ya tienes acceso a este curso. Ve a tu dashboard para empezar a entrenar! 💪');
      router.push('/dashboard');
      return;
    }

    // Validar que el usuario tenga email (requerido por Wompi)
    if (!session.user.email) {
      alert('Tu cuenta no tiene un email asociado. Por favor actualiza tu perfil.');
      return;
    }
    
    // Usuario autenticado correctamente, mostrar widget de pago
    setShowPaymentWidget(true);
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Pago exitoso');
    setShowPaymentWidget(false);
    
    // Actualizar el estado de inscripción
    setIsEnrolled(true);
        
    // Mostrar mensaje de éxito y recargar datos
    alert('¡Pago exitoso! Ya tienes acceso al curso.');
    
    // Recargar los datos del curso para actualizar el estado de inscripción
    await loadCourseData();
    
    // Opcional: redirigir al dashboard del estudiante
    // router.push('/student/dashboard');
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Error en el pago:', error);
    setShowPaymentWidget(false);
    alert(`Error en el pago: ${error}`);
  };

  const handlePaymentClose = () => {
    setShowPaymentWidget(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-red-500">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Curso no encontrado</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">El curso que buscas no existe o no está disponible</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-lg transition-colors duration-150"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // course.price ya tiene el descuento aplicado en la BD
  const finalPrice = course.price;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Alineado a la izquierda */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </button>

            {/* User Menu - Alineado a la derecha */}
            {session && userProfile && (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-gray-700 dark:text-white hover:text-[#85ea10] transition-colors"
                >
                  <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{userProfile.name}</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-white/20 py-1 z-50">
                    <a
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="w-4 h-4" />
                      <span>Mi Perfil</span>
                    </a>
                    {(session as any)?.user?.id === 'cdeaf7e0-c7fa-40a9-b6e9-288c9a677b5e' && (
                      <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push('/signout')}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video, Title, Stats, Price */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Section */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative w-full aspect-video">
                {/* Video de Mux - Playback ID dinámico con HD forzado */}
                <iframe
                  src={`https://player.mux.com/${course.mux_playback_id || '8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU'}?preload=auto&autoplay=muted&default-quality=1080p&quality=1080p&max-resolution=1080p`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  className="w-full h-full"
                />
                
                {/* Logo RG - Esquina superior derecha */}
                <div className="absolute top-3 right-3 z-30 pointer-events-none">
                  <span className="font-black text-xl tracking-wide drop-shadow-md opacity-70">
                    <span className="text-white">R</span><span className="text-[#85ea10]">G</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Course Details - All in One Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              {/* Course Title */}
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                {course.title}
              </h1>

              {/* Course Description */}
              {course.description && (
                <div className="mb-4">
                  <p className={`text-gray-600 dark:text-gray-300 leading-relaxed ${
                    !showFullDescription ? 'line-clamp-2' : ''
                  }`}>
                    {course.description}
                  </p>
                  {course.description.length > 150 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-[#85ea10] hover:text-[#7dd30f] font-medium text-sm mt-2 transition-colors"
                    >
                      {showFullDescription ? 'Leer menos' : 'Leer más'}
                    </button>
                  )}
                </div>
              )}

              {/* Course Stats and Pricing - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
                {/* Vertical divider for desktop */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600 transform -translate-x-1/2"></div>
                {/* Left Side - Course Stats */}
                <div className="space-y-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Información del Curso</h3>
                  
                  {/* Desktop: Grid layout */}
                  <div className="hidden lg:grid grid-cols-2 gap-6">
                    {/* Duración */}
                    <div className="text-center">
                      <Clock className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Duración</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.duration || '40 min'}</div>
                    </div>
                    
                    {/* Calificación */}
                    <div className="text-center">
                      <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Calificación</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{course.rating || '4.8'}</span>
                      </div>
                    </div>
                    
                    {/* Estudiantes */}
                    <div className="text-center">
                      <Users className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Estudiantes</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.students_count?.toLocaleString() || '0'}</div>
                    </div>
                    
                    {/* Clases */}
                    <div className="text-center">
                      <Play className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Clases</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{lessons.length}</div>
                    </div>
                    
                    {/* Calorías */}
                    <div className="text-center">
                      <Zap className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Calorías</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.calories_burned ? `${course.calories_burned}+` : '500+'}</div>
                    </div>

                    {/* Enfoque */}
                    <div className="text-center">
                      <Tag className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Enfoque</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{getCategoryName(course.category)}</div>
                    </div>
                  </div>

                  {/* Mobile & Tablet: Horizontal scrollable carousel */}
                  <div className="lg:hidden relative">
                    <div 
                      id="course-stats-scroll"
                      className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" 
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {/* Duración */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Clock className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Duración</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.duration || '40 min'}</div>
                      </div>
                      
                      {/* Calificación */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Calificación</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center justify-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{course.rating || '4.8'}</span>
                        </div>
                      </div>
                      
                      {/* Estudiantes */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Users className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Estudiantes</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.students_count?.toLocaleString() || '0'}</div>
                      </div>
                      
                      {/* Clases */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Play className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Clases</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{lessons.length}</div>
                      </div>
                      
                      {/* Calorías */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Zap className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Calorías</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.calories_burned ? `${course.calories_burned}+` : '500+'}</div>
                      </div>

                      {/* Enfoque */}
                      <div className="text-center flex-shrink-0 w-24">
                        <Tag className="w-5 h-5 text-[#85ea10] mx-auto mb-2" />
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Enfoque</div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{getCategoryName(course.category)}</div>
                      </div>
                    </div>
                    
                    {/* Scroll indicator arrow */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pl-8 pr-2 py-4">
                      <button
                        onClick={() => {
                          const scrollContainer = document.getElementById('course-stats-scroll');
                          if (scrollContainer) {
                            const cardWidth = 96 + 16; // card width + gap
                            scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
                          }
                        }}
                        className="flex items-center justify-center w-6 h-6 bg-[#85ea10] rounded-full shadow-lg hover:bg-[#7dd30f] transition-colors cursor-pointer"
                      >
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Pricing and Purchase */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Precio y Compra</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
                {course.original_price && course.original_price > course.price ? (
                  <div className="space-y-3">
                    {/* Pricing - Clean Layout */}
                    <div className="text-center space-y-1">
                      <div className="text-2xl text-gray-500 dark:text-gray-400 line-through">
                        ${course.original_price.toLocaleString('es-CO')}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${finalPrice.toLocaleString('es-CO')}
                      </div>
                      <div className="text-sm text-[#85ea10] font-semibold">
                        ¡Ahorras ${(course.original_price - finalPrice).toLocaleString('es-CO')}!
                      </div>
                    </div>

                    {/* Purchase Button */}
                    {isEnrolled ? (
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>YA TIENES ESTE CURSO</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePurchase}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>¡COMPRAR AHORA!</span>
                      </button>
                    )}

                    {/* Payment Info */}
                    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Shield className="w-4 h-4 text-[#85ea10]" />
                        <span>Pago 100% seguro con Wompi</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 text-[#85ea10]" />
                        <span>Acceso inmediato al curso</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CreditCard className="w-4 h-4 text-[#85ea10]" />
                        <span>Acepta tarjetas, Nequi y PSE</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pricing - Clean Layout */}
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${course.price.toLocaleString('es-CO')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Pago único • Sin suscripciones
                      </div>
                    </div>
                    
                    {/* Purchase Button */}
                    {isEnrolled ? (
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>YA TIENES ESTE CURSO</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePurchase}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>¡COMPRAR AHORA!</span>
                      </button>
                    )}

                    {/* Payment Info */}
                    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Shield className="w-4 h-4 text-[#85ea10]" />
                        <span>Pago 100% seguro con Wompi</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 text-[#85ea10]" />
                        <span>Acceso inmediato al curso</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CreditCard className="w-4 h-4 text-[#85ea10]" />
                        <span>Acepta tarjetas, Nequi y PSE</span>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Lessons and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Classes List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex-1 flex flex-col">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-400 p-4 flex-shrink-0">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-green-800 dark:text-green-300 mb-1">
                      💪 CÓMO FUNCIONA TU CURSO
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                      Al comprar, eliges cuándo empezar. Cada día se desbloquea una nueva clase. ¡Mantén la constancia para no perderte ninguna!
                    </p>
                  </div>
              </div>
            </div>

              <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Contenido del Curso
                </h3>
          </div>

              <div className="flex-1 overflow-y-auto">
                {lessons.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {lessons.map((lesson, index) => {
                      // Simular estados basados en la fecha actual (simulación realista)
                      const today = new Date();
                      const courseStartDate = new Date(today); // Simular que el curso empezó hoy
                      const classDate = new Date(courseStartDate);
                      classDate.setDate(courseStartDate.getDate() + index);
                      
                      let classStatus;
                      if (index === 0) {
                        classStatus = 'available'; // Primera clase siempre disponible hoy
                      } else if (index === 1) {
                        classStatus = 'tomorrow'; // Segunda clase disponible mañana
                      } else {
                        classStatus = 'upcoming'; // Resto de clases en días futuros
                      }
                      
                      return (
                        <div key={lesson.id} className={`p-4 transition-colors ${
                          classStatus === 'available' 
                            ? 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                        }`}>
                          <div className="flex items-start space-x-3">
                            {/* Class Image */}
                            <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600">
                              <img
                                src={lesson.preview_image || '/images/lessons/placeholder.jpg'}
                                alt={lesson.title}
                                className={`w-full h-full object-cover ${
                                  classStatus === 'available' ? '' : 'grayscale opacity-70'
                                }`}
                                onError={(e) => {
                                  e.currentTarget.src = '/images/course-placeholder.jpg';
                                }}
                              />
                                </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Class Number and Title */}
                              <div className="flex items-start space-x-2 mb-1">
                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  classStatus === 'available' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-400 text-white'
                                }`}>
                                  {lesson.lesson_number}
                            </div>
                                <h4 className={`text-sm font-semibold line-clamp-2 flex-1 ${
                                  classStatus === 'available' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {lesson.title}
                                </h4>
                        </div>

                              {lesson.description && (
                                <p className={`text-sm mb-2 line-clamp-2 ml-7 ${
                                  classStatus === 'available' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                {lesson.description}
                              </p>
                              )}
                              
                              {/* Status Text */}
                              <div className="mb-2 ml-7">
                                {classStatus === 'available' && (
                                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">✅ Disponible hoy</span>
                                )}
                                {classStatus === 'tomorrow' && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">⏰ Disponible mañana</span>
                                )}
                                {classStatus === 'upcoming' && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">📅 Próximamente</span>
                )}
              </div>

                              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 ml-7">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.duration_minutes} min</span>
              </div>
                                {lesson.is_preview && classStatus === 'available' && (
                                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                    <Play className="w-3 h-3" />
                                    <span>Preview</span>
        </div>
      )}
            </div>
                  </div>
                </div>
              </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No hay clases disponibles</p>
        </div>
      )}
            </div>
          </div>
        </div>
      </div>

      {/* Widget oficial de Wompi Checkout */}
      {course && session?.user && showPaymentWidget && (
        <WompiCheckout
          course={{
            id: course.id,
            title: course.title,
            price: course.price,
            original_price: course.original_price,
            discount_percentage: course.discount_percentage,
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handlePaymentClose}
        />
      )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}