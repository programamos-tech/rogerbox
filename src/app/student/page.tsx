'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Calendar, 
  Trophy, 
  Target, 
  Clock, 
  Users, 
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Zap,
  User,
  LogOut,
  ChevronDown,
  Settings
} from 'lucide-react';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';

export default function PurchasedDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { courses, loading: coursesLoading } = useUnifiedCourses();
  const { purchases, loading: purchasesLoading } = useUserPurchases();
  
  const [simulatedPurchase, setSimulatedPurchase] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [courseWithLessons, setCourseWithLessons] = useState<any>(null);
  const [videoPreviewEnded, setVideoPreviewEnded] = useState(false);

  // Verificar compra simulada
  useEffect(() => {
    const simulated = localStorage.getItem('simulated_purchase');
    if (simulated) {
      try {
        const parsed = JSON.parse(simulated);
        setSimulatedPurchase(parsed);
      } catch (error) {
        console.error('Error parsing simulated purchase:', error);
      }
    }
  }, []);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Cargar lecciones del curso cuando hay compra simulada
  useEffect(() => {
    const loadCourseWithLessons = async () => {
      if (simulatedPurchase?.course?.slug) {
        try {
          console.log('🔄 Cargando curso y lecciones para:', simulatedPurchase.course.slug);
          
          // Buscar el curso por slug
          const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('slug', simulatedPurchase.course.slug)
            .eq('is_published', true)
            .single();

          if (courseError || !course) {
            console.error('❌ Error cargando curso:', courseError);
            return;
          }

          console.log('✅ Curso encontrado:', course);

          // Cargar lecciones del curso
          const { data: lessons, error: lessonsError } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('course_id', course.id)
            .order('lesson_order', { ascending: true });

          if (lessonsError) {
            console.warn('⚠️ Warning: Could not load lessons:', lessonsError);
          }

          const courseWithLessons = {
            ...course,
            lessons: lessons || []
          };

          console.log('✅ Curso con lecciones cargado:', courseWithLessons);
          setCourseWithLessons(courseWithLessons);
        } catch (error) {
          console.error('❌ Error cargando curso con lecciones:', error);
        }
      }
    };

    loadCourseWithLessons();
  }, [simulatedPurchase]);

  // Obtener el curso comprado
  const purchasedCourse = simulatedPurchase ? 
    (courseWithLessons || courses?.find(c => c.slug === simulatedPurchase.course?.slug)) :
    purchases?.[0] ? 
      courses?.find(c => c.slug === purchases[0].course?.slug) : 
      null;

  // Debug: Verificar que el curso tenga lecciones
  console.log('🔍 purchasedCourse:', purchasedCourse);
  console.log('🔍 purchasedCourse.lessons:', purchasedCourse?.lessons);
  console.log('🔍 courseWithLessons:', courseWithLessons);
  console.log('🔍 simulatedPurchase:', simulatedPurchase);

  const effectivePurchase = simulatedPurchase || purchases?.[0];

  // Calcular estadísticas
  const getCurrentLessonIndex = () => {
    if (!effectivePurchase?.start_date) return 0;
    
    const startDate = new Date(effectivePurchase.start_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(daysDiff, (purchasedCourse?.lessons?.length || 1) - 1);
  };

  const currentLessonIndex = getCurrentLessonIndex();
  const currentLesson = purchasedCourse?.lessons?.[currentLessonIndex];

  // Función para generar URL de Mux
  const getMuxVideoUrl = (playbackId: string) => {
    if (!playbackId) return null;
    return `https://stream.mux.com/${playbackId}.m3u8`;
  };

  // Timer para el preview del video (15 segundos)
  useEffect(() => {
    const videoUrl = currentLesson?.video_url ? getMuxVideoUrl(currentLesson.video_url) : null;
    
    if (videoUrl) {
      console.log('🎥 Iniciando preview del video Mux:', videoUrl);
      setVideoPreviewEnded(false);
      
      const timer = setTimeout(() => {
        console.log('⏰ Preview terminado, bloqueando video');
        setVideoPreviewEnded(true);
      }, 15000); // 15 segundos

      return () => clearTimeout(timer);
    } else {
      console.log('❌ No hay playback ID en currentLesson:', currentLesson);
    }
  }, [currentLesson]);
  const completedLessons = effectivePurchase?.completed_lessons || [];
  const progressPercentage = purchasedCourse?.lessons ? 
    Math.round((completedLessons.length / purchasedCourse.lessons.length) * 100) : 0;

  // Generar calendario de próximas clases
  // Regla: Solo la clase del día actual está disponible. Si no se toma, se pierde.
  const generateUpcomingClasses = () => {
    if (!purchasedCourse?.lessons || !effectivePurchase?.start_date) return [];
    
    const startDate = new Date(effectivePurchase.start_date);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = [];
    const completedCount = completedLessons.length;
    
    // Mostrar todas las lecciones del curso
    for (let i = 0; i < purchasedCourse.lessons.length; i++) {
      const classDate = new Date(startDate);
      classDate.setDate(startDate.getDate() + i);
      classDate.setHours(0, 0, 0, 0);
      
      const lesson = purchasedCourse.lessons[i];
      const isCompleted = completedLessons.includes(lesson.id);
      const daysDiff = Math.floor((today.getTime() - classDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determinar el estado de la clase
      let statusText = '';
      let isAvailable = false;
      let isLost = false;
      let isUpcoming = false;
      
      if (isCompleted) {
        statusText = 'Completada';
      } else if (daysDiff === 0 && i === completedCount) {
        // Clase del día actual, disponible
        statusText = 'Disponible hoy';
        isAvailable = true;
      } else if (daysDiff > 0 && i >= completedCount) {
        // Clase pasada no completada, perdida
        statusText = 'Perdida';
        isLost = true;
      } else if (daysDiff === -1 && i === completedCount) {
        // Siguiente clase (mañana)
        statusText = 'Disponible mañana';
        isUpcoming = true;
      } else if (daysDiff < -1) {
        // Clase futura
        statusText = 'Próximamente';
      } else {
        // Otras clases bloqueadas
        statusText = 'Bloqueada';
      }
      
      upcoming.push({
        date: classDate,
        lesson,
        isCompleted,
        isToday: isAvailable,
        isPast: isLost,
        isTomorrow: isUpcoming,
        dayNumber: i + 1,
        statusText,
        isAvailable,
        isLost
      });
    }
    
    return upcoming;
  };

  const upcomingClasses = generateUpcomingClasses();

  if (coursesLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  if (!purchasedCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No tienes cursos comprados</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300"
          >
            Ver Cursos Disponibles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barra de navegación */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
               {/* Logo de RogerBox */}
               <div className="flex items-center">
                 <h1 className="text-2xl font-black">
                   <span className="text-white">ROGER</span>
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
                  <p className="text-xs text-gray-500 dark:text-white/60">{session?.user?.email || 'usuario@ejemplo.com'}</p>
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
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player estilo Netflix */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Debug info */}
              {(() => {
                const muxVideoUrl = currentLesson?.video_url ? getMuxVideoUrl(currentLesson.video_url) : null;
                console.log('🎬 Renderizando video player:', {
                  hasPlaybackId: !!currentLesson?.video_url,
                  playbackId: currentLesson?.video_url,
                  muxVideoUrl,
                  videoPreviewEnded,
                  currentLesson: currentLesson
                });
                return null;
              })()}
              {currentLesson?.video_url && !videoPreviewEnded ? (
                /* Video Preview (15 segundos) */
                <div className="relative w-full h-full">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    loop={false}
                    controls={false}
                    onEnded={() => {
                      console.log('🎬 Video terminado naturalmente');
                      setVideoPreviewEnded(true);
                    }}
                    onLoadStart={() => console.log('🔄 Video cargando...')}
                    onCanPlay={() => console.log('▶️ Video listo para reproducir')}
                    onPlay={() => console.log('▶️ Video reproduciéndose')}
                    onError={(e) => console.error('❌ Error en video:', e)}
                  >
                    <source src={getMuxVideoUrl(currentLesson.video_url) || undefined} type="application/x-mpegURL" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                  
                  {/* Overlay sutil durante el preview */}
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Botón flotante durante preview */}
                  <div className="absolute bottom-6 left-6">
                    <button
                      onClick={() => router.push(`/course/${purchasedCourse.slug}/progress`)}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Tomar Clase Hoy</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Estado bloqueado (después de 15 segundos) */
                <div className="relative w-full h-full">
                  {/* Imagen de fondo de la lección */}
                  <img
                    src={currentLesson?.preview_image || currentLesson?.thumbnail || purchasedCourse.preview_image || '/images/course-placeholder.jpg'}
                    alt={currentLesson?.title || 'Clase del día'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay oscuro para el bloqueo */}
                  <div className="absolute inset-0 bg-black/70"></div>
                  
                  {/* Contenido del bloqueo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      {/* Botón principal */}
                      <button
                        onClick={() => router.push(`/course/${purchasedCourse.slug}/progress`)}
                        className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-lg flex items-center space-x-3 mb-4"
                      >
                        <Play className="w-6 h-6" />
                        <span>Tomar Clase Hoy</span>
                      </button>
                      
                      {/* Información de la clase */}
                      <p className="text-white/80 text-sm">
                        {currentLesson?.title || 'Clase del día'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas del Curso */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-[#85ea10] mr-2" />
                Estadísticas del Curso
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-[#85ea10] mb-1">
                    {completedLessons.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Clases Completadas</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {purchasedCourse.lessons?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total de Clases</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {progressPercentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Progreso</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {currentLessonIndex + 1}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Día Actual</div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendario de Próximas Clases */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximas Clases
                </h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {upcomingClasses.map((classItem, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        classItem.isToday ? 'bg-[#85ea10]/10 border-[#85ea10] dark:bg-[#85ea10]/20 shadow-lg' :
                        classItem.isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                        classItem.isPast ? 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 opacity-75' :
                        'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Imagen de preview de la lección */}
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={classItem.lesson.preview_image || classItem.lesson.thumbnail || '/images/course-placeholder.jpg'}
                            alt={classItem.lesson.title}
                            className={`w-full h-full object-cover ${
                              classItem.isToday || classItem.isCompleted ? '' : 'grayscale'
                            }`}
                          />
                          {/* Badge del día */}
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            classItem.isToday ? 'bg-[#85ea10] text-black' :
                            classItem.isCompleted ? 'bg-green-500 text-white' :
                            'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {classItem.isCompleted ? '✓' : classItem.dayNumber}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 leading-tight ${
                            classItem.isToday ? 'text-gray-900 dark:text-white' :
                            classItem.isCompleted ? 'text-gray-900 dark:text-white' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>
                            {classItem.lesson.title}
                          </p>
                          
                          {/* Descripción de la lección */}
                          <p className={`text-xs mb-2 opacity-60 ${
                            classItem.isToday ? 'text-gray-700 dark:text-gray-300' :
                            classItem.isCompleted ? 'text-gray-700 dark:text-gray-300' :
                            'text-gray-400 dark:text-gray-500'
                          }`}>
                            {classItem.lesson.description || 'Descripción de la lección'}
                          </p>
                          
                          <div className="flex items-center space-x-3 text-xs">
                            <span className={`font-medium ${
                              classItem.isToday ? 'text-[#85ea10]' :
                              classItem.isCompleted ? 'text-green-600 dark:text-green-400' :
                              'text-gray-400 dark:text-gray-500'
                            }`}>
                              {classItem.isCompleted ? '✅' : classItem.isToday ? '✅' : '⏳'} {classItem.statusText}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              🕒 {classItem.lesson.duration || '30 min'}
                            </span>
                          </div>
                        </div>
                        
                        {classItem.isToday && (
                          <div className="flex items-center space-x-1 text-[#85ea10] flex-shrink-0">
                            <span className="text-xs font-medium">Hoy</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Racha de Entrenamientos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                Tu Racha
              </h3>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  {completedLessons.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">días consecutivos</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((completedLessons.length / 7) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {completedLessons.length < 7 ? 
                    `${7 - completedLessons.length} días para completar la semana` :
                    '¡Excelente racha!'
                  }
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
