'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Clock, 
  Target, 
  Zap, 
  Heart, 
  Trophy, 
  Flame,
  User, 
  ChevronDown, 
  Settings, 
  LogOut,
  Home,
  BookOpen,
  Utensils,
  Menu,
  X
} from 'lucide-react';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  video_url?: string;
  preview_image?: string;
  thumbnail?: string;
  order?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  preview_image?: string;
  lessons: Lesson[];
}

interface Purchase {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  created_at: string;
  course: Course;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { courses, loading: coursesLoading } = useUnifiedCourses();
  const { purchases, loading: purchasesLoading } = useUserPurchases();
  
  // Estados para la UI
  const [showLogo, setShowLogo] = useState(true);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [showMuxPlayer, setShowMuxPlayer] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [countdown, setCountdown] = useState<number>(10);
  
  // Estados para datos
  const [simulatedPurchase, setSimulatedPurchase] = useState<any>(null);
  const [courseWithLessons, setCourseWithLessons] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownStartedRef = useRef(false);

  // Función para obtener URL de Mux
  const getMuxVideoUrl = (videoId: string) => {
    return `https://player.mux.com/${videoId}?autoplay=true&default-quality=1080p&quality=1080p&max-resolution=1080p`;
  };

  // Función para marcar lección como completada
  const markLessonAsCompleted = async () => {
    if (!currentLesson) return;
    
    try {
      // Actualizar estado local
      const updatedCompletedLessons = [...completedLessons, currentLesson.id];
      setCompletedLessons(updatedCompletedLessons);
      
      // Guardar en localStorage
      localStorage.setItem('user_completed_lessons', JSON.stringify(updatedCompletedLessons));
      
      // Actualizar progreso
      const totalLessons = courseWithLessons?.lessons?.length || 0;
      const newProgress = totalLessons > 0 ? Math.round((updatedCompletedLessons.length / totalLessons) * 100) : 0;
      setProgress(newProgress);
      
      setShowCongratulations(false);
      setShowMuxPlayer(false);
      setShowFinalScreen(true);
      
      console.log('✅ Lección marcada como completada:', currentLesson.id);
    } catch (error) {
      console.error('❌ Error en markLessonAsCompleted:', error);
      // Continuar de todas formas
      setShowCongratulations(false);
      setShowMuxPlayer(false);
      setShowFinalScreen(true);
    }
  };

  // Efecto para countdown inicial
  useEffect(() => {
    if (showLogo && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (showLogo && countdown === 0) {
      setShowLogo(false);
      setShowWelcomeVideo(true);
    }
  }, [showLogo, countdown]);

  // Efecto para preview de bienvenida
  useEffect(() => {
    if (showWelcomeVideo) {
      const timer = setTimeout(() => {
        console.log('🎬 Preview terminado, iniciando clase real');
        setShowWelcomeVideo(false);
        setShowMuxPlayer(true);
      }, 10000); // 10 segundos
      
      return () => clearTimeout(timer);
    }
  }, [showWelcomeVideo]);

  // Efecto para cargar datos reales de Supabase
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Cargando datos reales de Supabase...');
        
        // 1. Obtener todos los cursos con sus lecciones
        let coursesData;
        let coursesError = null;
        
        try {
          const result = await supabase
            .from('courses')
            .select(`
              id,
              title,
              description,
              preview_image,
              thumbnail_url,
              price,
              original_price,
              discount_percentage,
              category,
              created_at,
              is_published
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
            
          coursesData = result.data;
          coursesError = result.error;
        } catch (error) {
          console.warn('⚠️ Supabase no disponible, usando datos simulados:', error);
          coursesData = null;
          coursesError = error;
        }

        // Si hay error o no hay datos, usar datos simulados
        if (coursesError || !coursesData || coursesData.length === 0) {
          console.log('🔄 Usando datos simulados debido a problemas de conectividad');
          coursesData = [
            {
              id: 'demo-course-1',
              title: 'DESTROY that FAT',
              description: 'Transforma tu cuerpo con este programa intensivo de HIIT diseñado para quemar grasa y construir músculo.',
              preview_image: '/images/course-destroy-that-fat.jpg',
              thumbnail_url: '/images/course-destroy-that-fat.jpg',
              price: 99000,
              original_price: 199000,
              discount_percentage: 50,
              category: 'HIIT',
              created_at: '2025-01-01T00:00:00Z',
              is_published: true
            }
          ];
        }

        // 2. Para cada curso, obtener sus lecciones
        const coursesWithLessons = await Promise.all(
          (coursesData || []).map(async (course) => {
            let lessons = [];
            
            // Si es el curso demo, usar lecciones simuladas
            if (course.id === 'demo-course-1') {
              lessons = [
                {
                  id: 'demo-lesson-1',
                  title: 'HIIT Full Body - Día 1',
                  description: 'Entrenamiento HIIT de cuerpo completo para quemar grasa',
                  video_url: 'F3Y102XNMtQ',
                  duration: '30 min',
                  order_index: 1,
                  is_published: true
                },
                {
                  id: 'demo-lesson-2',
                  title: 'Cardio Intenso - Día 2',
                  description: 'Sesión de cardio de alta intensidad',
                  video_url: 'F3Y102XNMtQ',
                  duration: '25 min',
                  order_index: 2,
                  is_published: true
                },
                {
                  id: 'demo-lesson-3',
                  title: 'Fuerza y Resistencia - Día 3',
                  description: 'Entrenamiento de fuerza y resistencia muscular',
                  video_url: 'F3Y102XNMtQ',
                  duration: '35 min',
                  order_index: 3,
                  is_published: true
                }
              ];
            } else {
              // Intentar cargar de Supabase
              try {
                const { data, error: lessonsError } = await supabase
                  .from('lessons')
                  .select(`
                    id,
                    title,
                    description,
                    video_url,
                    duration,
                    order_index,
                    is_published
                  `)
                  .eq('course_id', course.id)
                  .eq('is_published', true)
                  .order('order_index', { ascending: true });

                if (lessonsError) {
                  console.warn(`⚠️ Error cargando lecciones para curso ${course.id}:`, lessonsError);
                  lessons = [];
                } else {
                  lessons = data || [];
                }
              } catch (error) {
                console.warn(`⚠️ Error conectando a Supabase:`, error);
                lessons = [];
              }
            }

            return {
              ...course,
              lessons: lessons
            };
          })
        );

        // 3. Encontrar el curso con más lecciones
        const courseWithMostLessons = coursesWithLessons.reduce((max, current) => 
          current.lessons.length > max.lessons.length ? current : max
        );

        console.log('📊 Curso con más lecciones:', {
          title: courseWithMostLessons.title,
          lessonsCount: courseWithMostLessons.lessons.length
        });

        // 4. Obtener lecciones completadas del usuario desde localStorage
        let userCompletedLessons: string[] = [];
        try {
          const stored = localStorage.getItem('user_completed_lessons');
          if (stored) {
            userCompletedLessons = JSON.parse(stored);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando lecciones completadas desde localStorage:', error);
        }

        // 5. Establecer datos
        setCourseWithLessons(courseWithMostLessons);
        setCompletedLessons(userCompletedLessons);
        
        // Calcular progreso
        const totalLessons = courseWithMostLessons.lessons.length;
        const completed = userCompletedLessons.length;
        setProgress(totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0);
        
        // 6. Establecer lección actual (primera no completada)
        const firstIncompleteLesson = courseWithMostLessons.lessons.find((lesson: Lesson) => 
          !userCompletedLessons.includes(lesson.id)
        );
        setCurrentLesson(firstIncompleteLesson || courseWithMostLessons.lessons[0] || null);

        console.log('✅ Datos cargados correctamente:', {
          course: courseWithMostLessons.title,
          totalLessons,
          completedLessons: completed,
          progress: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
          currentLesson: firstIncompleteLesson?.title || courseWithMostLessons.lessons[0]?.title
        });

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setError('Error cargando los datos del curso');
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, [session]);

  // Calcular porcentaje de progreso
  const progressPercentage = courseWithLessons?.lessons?.length 
    ? Math.round((completedLessons.length / courseWithLessons.lessons.length) * 100) 
    : 0;

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cargando tu clase...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preparando el mejor contenido para ti
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error cargando las clases
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Verificar que tenemos datos
  if (!courseWithLessons || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No hay clases disponibles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No se encontraron cursos con lecciones
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Ver Cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar fijo */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
          <div className="p-6">
            {/* Header del sidebar */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black">
                <span className="text-gray-900 dark:text-white">ROGER</span>
                <span className="text-[#85ea10]">BOX</span>
              </h2>
            </div>
            
            {/* Opciones del menú */}
            <div className="space-y-2">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="flex items-center space-x-4 w-full px-4 py-4 text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6" />
                <div>
                  <div className="font-medium">Home</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Dashboard y blogs</div>
              </div>
              </button>
              
              <button
                onClick={() => {}} 
                className="flex items-center space-x-4 w-full px-4 py-4 text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors bg-green-50 dark:bg-green-900/20 border-l-4 border-[#85ea10]"
              >
                <Play className="w-6 h-6 text-[#85ea10]" />
                <div>
                  <div className="font-medium text-[#85ea10]">Clases</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tu progreso actual</div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/courses')} 
                className="flex items-center space-x-4 w-full px-4 py-4 text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <BookOpen className="w-6 h-6" />
                <div>
                  <div className="font-medium">Cursos</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Todos tus cursos</div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/nutritional-plans')} 
                className="flex items-center space-x-4 w-full px-4 py-4 text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Utensils className="w-6 h-6" />
                <div>
                  <div className="font-medium">Planes Nutricionales</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Blogs y planes</div>
                </div>
              </button>
            </div>
          </div>
                  </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Barra de navegación */}
          <nav className="bg-gray-50 dark:bg-gray-900">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Menú hamburguesa y Logo */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <h1 className="text-2xl font-black">
                    <span className="text-gray-900 dark:text-white">ROGER</span>
                    <span className="text-[#85ea10]">BOX</span>
                  </h1>
                </div>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 text-gray-700 dark:text-white hover:text-[#85ea10] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{session?.user?.name || 'Usuario'}</p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
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
                        <span>Cerrar Sesión</span>
                      </button>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Contenido principal */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Contenido Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Player estilo Netflix */}
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  {showLogo ? (
                    /* Pantalla inicial con imagen de la clase */
                    <div className="relative w-full h-full transition-opacity duration-1000 ease-in-out">
                      <img
                        src={currentLesson?.preview_image || currentLesson?.thumbnail || courseWithLessons?.preview_image || courseWithLessons?.thumbnail_url || '/images/course-placeholder.jpg'}
                        alt={currentLesson?.title || 'Clase del día'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30"></div>
                      
                      {/* Widget de Nueva Clase */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-sm mx-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              ¡Nueva Clase Disponible!
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {currentLesson?.title || 'Clase del día'}
                            </p>
                            <button
                              onClick={() => {
                                console.log('✅ Usuario iniciando clase desde widget');
                                setShowLogo(false);
                                setShowWelcomeVideo(true);
                              }}
                              className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm mb-3"
                            >
                              <Play className="w-4 h-4" />
                              <span>Comenzar Clase Ahora</span>
                            </button>
                            
                            {/* Countdown */}
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                              <span>Iniciando automáticamente en:</span>
                              <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                                <span className="text-black font-black text-sm">{countdown}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : showWelcomeVideo ? (
                    /* Preview con Logo RogerBox - 10 segundos */
                    <div className="relative w-full h-full">
                      {/* Video de fondo */}
                      <video
                        src="/roger-hero.mp4"
                        autoPlay
                        muted
                        playsInline
                        loop={false}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay oscuro para mejor contraste */}
                      <div className="absolute inset-0 bg-black/40"></div>
                      
                      {/* Logo RogerBox centrado */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white px-4 max-w-4xl">
                          <h1 className="text-6xl font-black mb-8">
                            <span className="text-white">ROGER</span>
                            <span className="text-[#85ea10]">BOX</span>
                          </h1>
                          {/* Mensaje motivacional */}
                          <p className="text-2xl font-semibold text-white drop-shadow-lg">
                            Transformamos tu mente, transformamos tu cuerpo
                          </p>
                        </div>
                      </div>
                      
                      {/* Instrucciones de preparación en la parte inferior */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <p className="text-xs font-normal text-white/70 drop-shadow-lg leading-relaxed text-center px-4 max-w-4xl">
                          Prepara tu espacio seguro • Ten a la mano tus pesas • Mantén agua cercana • Usa una toalla • Calienta antes de empezar • Escucha a tu cuerpo •<br />
                          Si sientes dolor detente • Consulta con tu médico si es necesario • ¡Vamos a quemar grasa de forma segura! 🔥
                        </p>
                      </div>
                    </div>
                  ) : showMuxPlayer ? (
                    /* Reproductor de Mux */
                    <div className="relative w-full h-full">
                      <iframe
                        src={`https://player.mux.com/${currentLesson.video_url}?autoplay=true&default-quality=1080p&quality=1080p&max-resolution=1080p`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                        className="w-full h-full"
                        onLoad={() => {
                          console.log(`🎬 Video cargado - Modal aparecerá en segundo 10`);
                          setTimeout(() => {
                            console.log('📺 ¡Modal de finalización activado en segundo 10!');
                            setShowCongratulations(true);
                          }, 10000); // 10 segundos
                        }}
                      />
                      
                      {/* Logo RogerBox estilo canal TV */}
                      <div className="absolute top-4 right-4">
                        <h1 className="text-sm font-black">
                          <span className="text-white">ROGER</span>
                          <span className="text-[#85ea10]">BOX</span>
                        </h1>
                      </div>
                      
                      {/* Botón para cerrar el reproductor */}
                      <button
                        onClick={() => setShowMuxPlayer(false)}
                        className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Modal de Finalización - Esquina inferior derecha */}
                      {showCongratulations && (
                        <div className="absolute bottom-16 right-4 transform translate-y-0 opacity-100 transition-all duration-1000 ease-out">
                          <div className="bg-white/40 hover:bg-white backdrop-blur-sm rounded-md p-3 shadow-lg max-w-64 transform transition-all duration-300 ease-out group">
                            <div className="text-center">
                              {/* Mensaje motivacional compacto */}
                              <div className="mb-3">
                                <h3 className="text-sm font-bold text-gray-900/60 group-hover:text-gray-900 mb-1 transition-all duration-300">
                                  ¡Excelente trabajo! 🔥
                                </h3>
                                <p className="text-xs text-gray-700/60 group-hover:text-gray-700 transition-all duration-300">
                                  ¿Listo para finalizar tu clase?
                                </p>
                              </div>
                              {/* Botón Finalizar compacto */}
                              <button
                                onClick={() => {
                                  console.log('✅ Finalizando clase desde modal');
                                  markLessonAsCompleted();
                                }}
                                className="bg-[#85ea10]/60 group-hover:bg-[#85ea10] text-black/60 group-hover:text-black font-bold px-4 py-2 rounded-md shadow-md text-xs flex items-center justify-center space-x-1 w-full transition-all duration-300 hover:scale-105"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>FINALIZAR CLASE 🔥</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : showFinalScreen ? (
                    /* Pantalla de Felicitaciones Final */
                    <div className="relative w-full h-full bg-white flex items-center justify-center">
                      <div className="text-center px-8 max-w-2xl">
                        {/* Logo RogerBox */}
                        <div className="mb-8">
                          <h1 className="text-4xl font-black mb-2">
                            <span className="text-gray-900">ROGER</span>
                            <span className="text-[#85ea10]">BOX</span>
                          </h1>
                        </div>
                        
                        {/* Icono de trofeo */}
                        <div className="mb-6">
                          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                          </div>
                        </div>
                        
                        {/* Mensaje de felicitación */}
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          ¡Felicidades! 🎉
                        </h2>
                        <p className="text-xl text-gray-700 mb-2">
                          Finalizaste tu clase de hoy
                        </p>
                        <p className="text-lg text-gray-600 mb-8">
                          ¡Excelente trabajo! Recuerda ingresar mañana para ver tu próxima clase.
                        </p>
                        
                        {/* Botones de acción */}
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              console.log('✅ Usuario quiere complementos');
                              // Aquí iría la lógica para complementos
                            }}
                            className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                          >
                            <span>¿Quieres complementar este entrenamiento?</span>
                          </button>
                          <button
                            onClick={() => {
                              console.log('✅ Usuario quiere plan nutricional');
                              // Aquí iría la lógica para plan nutricional
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                          >
                            <span>Completa con un plan nutricional</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Estado por defecto */
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
                        <p className="text-gray-300">Preparando tu clase</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detalle de la Clase */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Play className="w-5 h-5 text-[#85ea10] mr-2" />
                    {currentLesson?.title || 'Clase del día'}
              </h3>
              
                  {/* Descripción de la Clase */}
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                      {currentLesson?.description || 'Activa todo tu cuerpo con este entrenamiento HIIT de alta intensidad diseñado para quemar grasa y fortalecer tus músculos.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Tu Racha */}
                    <div className="flex items-center gap-2 p-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Racha</div>
                        <div className="text-sm font-bold text-orange-500">{completedLessons.length} días 🔥</div>
                      </div>
                    </div>
                    
                    {/* Duración */}
                    <div className="flex items-center gap-2 p-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Duración</div>
                        <div className="text-sm font-bold text-blue-500">{currentLesson?.duration || '30 min'}</div>
                      </div>
                    </div>
                    
                    {/* Objetivo */}
                    <div className="flex items-center gap-2 p-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Objetivo</div>
                        <div className="text-sm font-bold text-green-500">Quema Grasa</div>
                      </div>
                    </div>
                    
                    {/* Intensidad */}
                    <div className="flex items-center gap-2 p-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Intensidad</div>
                        <div className="text-sm font-bold text-purple-500">Alta</div>
                  </div>
                </div>
                
                    {/* Calorías */}
                    <div className="flex items-center gap-2 p-2">
                      <Heart className="w-4 h-4 text-red-500" />
                <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Calorías</div>
                        <div className="text-sm font-bold text-red-500">500+</div>
                      </div>
                      </div>
                    
                    {/* Progreso */}
                    <div className="flex items-center gap-2 p-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Progreso</div>
                        <div className="text-sm font-bold text-yellow-500">{progressPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* Sidebar de Próximas Clases */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Play className="w-5 h-5 text-[#85ea10] mr-2" />
                Próximas Clases
              </h3>
              
              <div className="space-y-3">
                    {courseWithLessons?.lessons?.slice(0, 5).map((lesson, index) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isCurrent = lesson.id === currentLesson?.id;
                      
                      return (
                        <div
                          key={lesson.id}
                          className={`p-3 rounded-lg border transition-all duration-200 ${
                            isCurrent 
                              ? 'bg-[#85ea10]/10 border-[#85ea10]' 
                              : isCompleted
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                isCurrent 
                                  ? 'text-[#85ea10]' 
                                  : isCompleted
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {lesson.duration || '30 min'}
                          </p>
                        </div>
                            
                            <div className="flex items-center space-x-2">
                              {isCompleted && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              
                              {isCurrent && (
                                <div className="w-6 h-6 bg-[#85ea10] rounded-full flex items-center justify-center">
                                  <Play className="w-4 h-4 text-black" />
                      </div>
                      )}
                    </div>
                  </div>
              </div>
                      );
                    })}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
