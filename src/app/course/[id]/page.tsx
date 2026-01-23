'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { Star, Clock, Users, Play, ShoppingCart, Heart, ArrowLeft, CheckCircle, Zap, Target, Award, Shield, Tag, CreditCard, User, ChevronDown, Settings, LogOut, Dumbbell, Bell, Lock } from 'lucide-react';
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
  category_name?: string;
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
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  
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
  const [showVideoLogo, setShowVideoLogo] = useState(false);

  // Mostrar logo en video después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideoLogo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
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

    if (!!user) {
      fetchUserProfile();
    }
  }, [user]);

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

      // Buscar curso por slug o UUID en la base de datos
      let course = null;
      let courseError = null;

      // Primero intentar buscar por slug
      const { data: courseBySlug, error: slugError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', cleanId)
        .eq('is_published', true)
        .maybeSingle();

      if (courseBySlug && !slugError) {
        course = courseBySlug;
      } else {
        // Si no se encuentra por slug, intentar por UUID
        const { data: courseById, error: idError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', cleanId)
          .eq('is_published', true)
          .maybeSingle();

        if (courseById && !idError) {
          course = courseById;
        } else {
          courseError = idError;
        }
      }

      if (courseError || !course) {
        setError('Curso no encontrado');
        setLoading(false);
        return;
      }

      setCourse(course);

      // Cargar lecciones del curso
      try {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('lesson_order', { ascending: true });

        if (lessonsError) {
          setLessons([]);
        } else {
          setLessons(lessons || []);
        }
      } catch (error) {
        setLessons([]);
      }

      // Verificar si el usuario está inscrito
      if (user?.id) {
        try {
          const { data: enrollment } = await supabase
            .from('course_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course.id)
            .eq('is_active', true)
            .maybeSingle();

          setIsEnrolled(!!enrollment);
        } catch (error) {
          setIsEnrolled(false);
        }
      }

      // Verificar si es favorito
      if (user?.id) {
        try {
          const { data: favorite } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course.id)
            .maybeSingle();

          setIsFavorite(!!favorite);
        } catch (error) {
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
    if (!user) {
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
    if (!user.email) {
      alert('Tu cuenta no tiene un email asociado. Por favor actualiza tu perfil.');
      return;
    }
    
    // Usuario autenticado correctamente, mostrar widget de pago
    setShowPaymentWidget(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentWidget(false);
    setIsEnrolled(true);
    router.push('/student');
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

  // Calcular precio con descuento
  const discountPercentage = course.discount_percentage || 0;
  const originalPrice = course.price;
  const finalPrice = discountPercentage > 0 
    ? Math.round(originalPrice * (1 - discountPercentage / 100)) 
    : originalPrice;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </button>

            {/* Iconos de navegación */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-[#85ea10] rounded-full flex items-center justify-center hover:bg-[#7dd30f] transition-colors"
                title="Mi Gimnasio"
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </button>

              <button
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {user && (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-gray-700 dark:text-white hover:text-[#85ea10] transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{userProfile?.name || 'RogerBox'}</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}

              {showUserMenu && (
                <div className="absolute right-4 top-14 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <a href="/profile" className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <User className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </a>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Columna Principal - Video, Info, Clases */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Video */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              {/* Logo RogerBox - esquina superior derecha, aparece después de 3s */}
              <div className={`absolute top-3 right-3 z-20 transition-all duration-500 ${showVideoLogo ? 'opacity-50' : 'opacity-0'}`}>
                <span className="text-white font-black text-sm tracking-tight">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </span>
              </div>

              {/* Botón CTA flotante - derecha, arriba de controles */}
              {!isEnrolled && (
                <button
                  onClick={handlePurchase}
                  className="absolute bottom-16 right-3 z-20 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105"
                >
                  <Zap className="w-4 h-4" />
                  ¡Lo quiero!
                </button>
              )}

              <div className="relative w-full aspect-video">
                <iframe
                  src={`https://player.mux.com/${course.mux_playback_id || '8wRPxlLcp01JrCKhEsyq00BPSrah1qkRY01aOvr01p4suEU'}?preload=auto`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Título y Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              
              {/* Descripción */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {course.description || course.short_description || 'Transforma tu cuerpo con este programa intensivo de entrenamiento diseñado para quemar grasa y tonificar músculos.'}
              </p>

              {/* Stats en badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                  <Clock className="w-4 h-4 text-[#85ea10]" />{course.duration || '8 semanas'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />{course.rating || '4.8'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                  <Users className="w-4 h-4 text-[#85ea10]" />{course.students_count || 0} estudiantes
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#85ea10]/10 rounded-full text-sm text-[#85ea10] font-medium">
                  <Play className="w-4 h-4" />{lessons.length} clases
                </span>
              </div>
            </div>

            {/* Lo que incluye */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Lo que incluye este curso</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>{lessons.length} clases en video HD</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>Acceso por {course.duration || '8 semanas'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>Seguimiento de progreso</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>Ejercicios paso a paso</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>Entrena donde quieras</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                  <span>Sin equipos especiales</span>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar - Precio (Sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Card de Precio Unificada */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border-2 border-[#85ea10]/20">
                {/* Cómo funciona - arriba */}
                <div className="mb-4 p-3 bg-[#85ea10]/10 rounded-lg border border-[#85ea10]/30">
                  <p className="text-sm font-bold text-[#85ea10] mb-1">💪 ¿Cómo funciona?</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Al comprar, eliges cuándo empezar. Cada día se desbloquea una nueva clase. ¡Mantén la constancia!
                  </p>
                </div>

                {/* Precios - horizontal */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-3">
                    {discountPercentage > 0 && (
                      <span className="text-lg text-gray-400 line-through">${originalPrice?.toLocaleString('es-CO')}</span>
                    )}
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${finalPrice?.toLocaleString('es-CO')}</span>
                    {discountPercentage > 0 && (
                      <span className="bg-[#85ea10] text-black text-xs font-bold px-2 py-0.5 rounded-full">-{discountPercentage}%</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Pago único • Sin suscripciones</p>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={isEnrolled}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    isEnrolled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isEnrolled ? 'Ya tienes acceso' : '¡COMPRAR AHORA!'}
                </button>

                {/* Info de pago - horizontal */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#85ea10]" />Seguro</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#85ea10]" />Inmediato</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-[#85ea10]" />Nequi/PSE</span>
                </div>
              </div>

              {/* Contenido del curso - Clases */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  Contenido del programa
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {lessons.length} clases • Cada día se desbloquea una nueva
                </p>
                <div className="space-y-3">
                  {lessons.slice(0, 5).map((lesson, i) => {
                    const isFirst = i === 0;
                    const daysUntilUnlock = i;
                    
                    return (
                      <div 
                        key={lesson.id} 
                        className={`flex gap-3 p-3 rounded-lg border transition-all ${
                          isFirst 
                            ? 'bg-[#85ea10]/10 border-[#85ea10]/30' 
                            : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 opacity-60'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ${!isFirst ? 'grayscale' : ''}`}>
                          {lesson.preview_image ? (
                            <img 
                              src={lesson.preview_image} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Play className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          {!isFirst && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${isFirst ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {lesson.title}
                            </p>
                            <span className="text-xs text-gray-500 flex-shrink-0">{lesson.duration_minutes}m</span>
                          </div>
                          
                          {lesson.description && (
                            <p className={`text-xs mt-0.5 line-clamp-1 ${isFirst ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                              {lesson.description}
                            </p>
                          )}
                          
                          {/* Estado */}
                          <div className="mt-1 flex items-center gap-1">
                            {isFirst ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-[#85ea10]" />
                                <span className="text-xs text-[#85ea10] font-medium">Disponible hoy</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  Se habilita en {daysUntilUnlock} {daysUntilUnlock === 1 ? 'día' : 'días'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {lessons.length > 5 && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                      + {lessons.length - 5} clases más...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Payment Widget */}
      {course && user && showPaymentWidget && (
        <WompiCheckout
          course={{ id: course.id, title: course.title, price: finalPrice }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentWidget(false)}
        />
      )}
    </div>
  );
}
