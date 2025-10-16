'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReadMoreText from '@/components/ReadMoreText';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMuxPlayer, setShowMuxPlayer] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

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
      courses?.find(c => c.slug === purchases[0].course.slug) : 
      null;

  // Debug: Verificar que el curso tenga lecciones
  console.log('🔍 purchasedCourse:', purchasedCourse);
  console.log('🔍 purchasedCourse.lessons:', purchasedCourse?.lessons);
  console.log('🔍 courseWithLessons:', courseWithLessons);
  console.log('🔍 simulatedPurchase:', simulatedPurchase);

  const effectivePurchase = simulatedPurchase || purchases?.[0];

  // Calcular estadísticas
  const getCurrentLessonIndex = () => {
    // Si no hay fecha de inicio, usar hoy como día 0
    const startDate = effectivePurchase?.start_date ? 
      new Date(effectivePurchase.start_date) : 
      new Date(); // Usar hoy como día de inicio
    
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('📅 Debug getCurrentLessonIndex:', {
      startDate: startDate.toISOString(),
      today: today.toISOString(),
      daysDiff,
      lessonsLength: purchasedCourse?.lessons?.length || 0,
      effectivePurchase
    });
    
    return Math.min(Math.max(daysDiff, 0), (purchasedCourse?.lessons?.length || 1) - 1);
  };

  const currentLessonIndex = getCurrentLessonIndex();
  const currentLesson = purchasedCourse?.lessons?.[currentLessonIndex];
  
  console.log('🎯 Debug currentLesson:', {
    currentLessonIndex,
    currentLesson,
    purchasedCourseLessons: purchasedCourse?.lessons,
    purchasedCourseLessonsLength: purchasedCourse?.lessons?.length,
    purchasedCourse
  });

  // Secuencia de animaciones: Logo -> Video Bienvenida -> Imagen
  useEffect(() => {
    if (currentLesson?.video_url) {
      // 1. Mostrar logo por 2 segundos
      const logoTimer = setTimeout(() => {
        setShowLogo(false);
        setShowWelcomeVideo(true);
      }, 2000);
      
      // 2. Mostrar instrucciones desde el inicio del video
      const instructionsTimer = setTimeout(() => {
        setShowInstructions(true);
      }, 2000); // 2s logo + 0s video (inmediatamente)
      
      return () => {
        clearTimeout(logoTimer);
        clearTimeout(instructionsTimer);
      };
    }
  }, [currentLesson?.video_url]);

  // Función para generar URL de Mux
  const getMuxVideoUrl = (playbackId: string) => {
    if (!playbackId) return undefined;
    return `https://stream.mux.com/${playbackId}.m3u8`;
  };

  // Timer para el preview del video (15 segundos)
  useEffect(() => {
    console.log('🔍 Debug video useEffect:', {
      currentLesson,
      hasVideoUrl: !!currentLesson?.video_url,
      videoUrl: currentLesson?.video_url,
      purchasedCourse,
      lessons: purchasedCourse?.lessons
    });
    
    const videoUrl = currentLesson?.video_url ? getMuxVideoUrl(currentLesson.video_url) : undefined;
    
    if (videoUrl) {
      console.log('🎥 Iniciando preview del video Mux:', videoUrl);
      setVideoPreviewEnded(false);
      
      // Solo iniciar el timer cuando el video esté realmente reproduciéndose
      const startTimer = () => {
        console.log('⏰ Iniciando timer de 15 segundos');
        const timer = setTimeout(() => {
          console.log('⏰ Preview terminado, bloqueando video');
          setVideoPreviewEnded(true);
        }, 15000); // 15 segundos
        
        return timer;
      };
      
      // Iniciar el timer después de un pequeño delay para que el video se cargue
      const timer = setTimeout(() => {
        startTimer();
      }, 2000); // Esperar 2 segundos para que el video se cargue

      return () => clearTimeout(timer);
    } else {
      console.log('❌ No hay playback ID en currentLesson:', currentLesson);
    }
  }, [currentLesson, purchasedCourse]);
  const completedLessons = effectivePurchase?.completed_lessons || [];
  const progressPercentage = purchasedCourse?.lessons ? 
    Math.round((completedLessons.length / purchasedCourse.lessons.length) * 100) : 0;

  // Generar calendario de próximas clases
  const generateUpcomingClasses = () => {
    if (!purchasedCourse?.lessons || !effectivePurchase?.start_date) return [];
    
    const startDate = new Date(effectivePurchase.start_date);
    const upcoming = [];
    
    // Mostrar todas las lecciones del curso
    for (let i = 0; i < purchasedCourse.lessons.length; i++) {
      const classDate = new Date(startDate);
      classDate.setDate(startDate.getDate() + i);
      
      const lesson = purchasedCourse.lessons[i];
      const isCompleted = completedLessons.includes(lesson.id);
      const isToday = i === currentLessonIndex;
      const isPast = i < currentLessonIndex;
      const isTomorrow = i === currentLessonIndex + 1;
      
      // Determinar el texto de estado
      let statusText = '';
      if (isCompleted) {
        statusText = 'Completada';
      } else if (isToday) {
        statusText = 'Disponible hoy';
      } else if (isTomorrow) {
        statusText = 'Disponible mañana';
      } else if (isPast) {
        statusText = 'Disponible para repaso';
      } else {
        statusText = 'Próximamente';
      }
      
      upcoming.push({
        date: classDate,
        lesson,
        isCompleted,
        isToday,
        isPast,
        isTomorrow,
        dayNumber: i + 1,
        statusText
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player estilo Netflix */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Debug info */}
              {(() => {
                const muxVideoUrl = currentLesson?.video_url ? getMuxVideoUrl(currentLesson.video_url) : undefined;
                console.log('🎬 Renderizando video player:', {
                  hasPlaybackId: !!currentLesson?.video_url,
                  playbackId: currentLesson?.video_url,
                  muxVideoUrl,
                  videoPreviewEnded,
                  currentLesson: currentLesson,
                  purchasedCourse: purchasedCourse,
                  simulatedPurchase: simulatedPurchase
                });
                return null;
              })()}
              {currentLesson?.video_url && !videoPreviewEnded && showLogo ? (
                /* Pantalla de logo RogerBox antes del video */
                <div className="relative w-full h-full bg-white flex items-center justify-center transition-opacity duration-1000 ease-in-out">
                  <div className="text-center">
                    <div className="text-4xl font-black tracking-wide mb-8">
                      <span className="text-gray-900">ROGER</span>
                      <span className="text-[#85ea10]">BOX</span>
                    </div>
                    {/* Botón durante la pantalla de logo */}
                    <div className="absolute bottom-6 right-6">
                      <button
                        onClick={() => setShowMuxPlayer(true)}
                        className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        <span>Tomar Clase</span>
                      </button>
                    </div>
                  </div>
              </div>
              ) : currentLesson?.video_url && !videoPreviewEnded && showWelcomeVideo ? (
                /* Video de Bienvenida (10 segundos) - Primeros 10 segundos de roger-hero.mp4 */
                <div className="relative w-full h-full transition-opacity duration-1000 ease-in-out">
                  <video
                    src="/videos/roger-hero.mp4"
                    autoPlay
                    muted
                    playsInline
                    loop={false}
                    className="w-full h-full object-cover"
                    onLoadedData={() => {
                      // Forzar que termine en 10 segundos
                      setTimeout(() => {
                        console.log('🎬 Video de bienvenida terminado (10s)');
                        setIsTransitioning(true);
                        // Después de 1.5 segundos de transición, ir a imagen
                        setTimeout(() => {
                          console.log('⏰ Preview terminado, bloqueando video');
                          setShowWelcomeVideo(false);
                          setVideoPreviewEnded(true);
                          setIsTransitioning(false);
                        }, 1500); // 1.5 segundos de transición
                      }, 10000); // 10 segundos de preview
                    }}
                  />
                  
                  {/* Overlay con oscurecimiento durante la transición */}
                  <div className={`absolute inset-0 transition-all duration-1500 ease-in-out ${
                    isTransitioning 
                      ? 'bg-black/90' 
                      : 'bg-transparent'
                  }`}></div>
                  
                  {/* Overlay de transición adicional para efecto más dramático - solo durante la transición */}
                  {isTransitioning && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 transition-opacity duration-1500 ease-in-out"></div>
                  )}
                  
                  {/* Overlay con instrucciones de preparación - Estilo disclaimer de comercial */}
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <div className="text-center text-white px-4 max-w-5xl">
                      {/* Instrucciones de preparación - Estilo disclaimer */}
                      <div className={`transition-all duration-1000 ease-in-out ${
                        showInstructions 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-2'
                      }`}>
                        <p className="text-xs font-normal text-white drop-shadow-lg leading-relaxed">
                          Prepara tu espacio seguro • Ten a la mano tus pesas • Mantén agua cercana • Usa una toalla • Calienta antes de empezar • Escucha a tu cuerpo • Si sientes dolor detente • Consulta con tu médico si es necesario • ¡Vamos a quemar grasa de forma segura! 🔥
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showMuxPlayer ? (
                /* Reproductor de Mux - Reemplaza la imagen cuando se hace clic en "Tomar Clase" */
                <div className="relative w-full h-full">
                  <iframe
                    src={`https://player.mux.com/${currentLesson.video_url}?autoplay=true&default-quality=1080p&quality=1080p&max-resolution=1080p`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    className="w-full h-full"
                    onLoad={() => {
                      // Para testing: modal aparece después de 9 segundos
                      // En producción real, esto se detectaría con eventos del reproductor
                      console.log(`🎬 Video cargado - Modal aparecerá en 9 segundos (para testing)`);
                      
                      setTimeout(() => {
                        console.log('🎉 ¡Modal de felicitaciones! (Testing)');
                        setShowCongratulations(true);
                      }, 9000); // 9 segundos para testing
                    }}
                  />
                  
                  {/* Botón para cerrar el reproductor y volver a la imagen */}
                  <button
                    onClick={() => setShowMuxPlayer(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Modal de Felicitaciones - Overlay encima del video */}
                  {showCongratulations && (
                    <div className="absolute inset-0 flex justify-end items-center p-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-xs w-full shadow-2xl transform transition-all duration-500 scale-100 border border-[#85ea10] relative overflow-hidden">
                        {/* Fondo decorativo */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#85ea10]/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#85ea10]/20 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
                        
                        <div className="relative text-center">
                          {/* Logo RogerBox */}
                          <div className="mb-3">
                            <h1 className="text-lg font-black">
                              <span className="text-gray-900 dark:text-white">ROGER</span>
                              <span className="text-[#85ea10]">BOX</span>
                            </h1>
                          </div>
                          
                          {/* Icono de celebración con animación */}
                          <div className="text-4xl mb-3 animate-bounce">
                            🏆
                          </div>
                          
                          {/* Título principal con estilo RogerBox */}
                          <h2 className="text-xl font-black mb-2 bg-gradient-to-r from-[#85ea10] to-green-600 bg-clip-text text-transparent">
                            ¡CLASE COMPLETADA!
                          </h2>
                          
                          {/* Mensaje motivacional con estilo */}
                          <div className="bg-gradient-to-r from-[#85ea10]/10 to-green-600/10 rounded-lg p-2 mb-3 border border-[#85ea10]/20">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                              ¡Eres un crack! 🔥
                            </p>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              ¡Felicitaciones! La rompiste 💪
                            </p>
                          </div>
                          
                          {/* Mensaje de compartir con estilo */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mb-3">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              ¡Comparte tu logro en redes sociales!
                            </p>
                          </div>
                          
                          {/* Botones de acción con estilo RogerBox */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setShowCongratulations(false);
                                setShowMuxPlayer(false);
                              }}
                              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-xs border border-[#85ea10] hover:border-[#7dd30f]"
                            >
                              ¡CONTINUAR!
                            </button>
                            <button
                              onClick={() => {
                                // Aquí se puede agregar lógica para compartir en redes sociales
                                const text = `¡Acabo de completar mi clase de HIIT en RogerBox! 💪🔥 #RogerBox #HIIT #Fitness #QuemaGrasa`;
                                const url = window.location.href;
                                const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                                window.open(shareUrl, '_blank');
                              }}
                              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-bold px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center space-x-1 border border-gray-200 dark:border-gray-500 text-xs"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                              <span>Compartir</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Estado bloqueado (después de 11 segundos) - Imagen de la lección */
                <div className="relative w-full h-full transition-opacity duration-1000 ease-in-out">
                  {/* Imagen de fondo de la lección con degradado sutil */}
                  <img
                    src={currentLesson?.preview_image || currentLesson?.thumbnail || purchasedCourse.preview_image || '/images/course-placeholder.jpg'}
                    alt={currentLesson?.title || 'Clase del día'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Degradado sutil igual al preview */}
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/15 to-black/40"></div>
                  
                  {/* Botón minimalista en esquina inferior derecha */}
                  <div className="absolute bottom-6 right-6">
              <button
                      onClick={() => setShowMuxPlayer(true)}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2 text-sm"
              >
                      <Play className="w-4 h-4" />
                      <span>Tomar Clase</span>
              </button>
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
                <div className="space-y-4">
                {upcomingClasses.map((classItem, index) => (
                  <div
                    key={index}
                      className={`relative p-4 rounded-xl border transition-all duration-200 ${
                        classItem.isToday ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                        classItem.isCompleted ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600' :
                        'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <img
                            src={classItem.lesson.preview_image || classItem.lesson.thumbnail || '/images/course-placeholder.jpg'}
                            alt={classItem.lesson.title}
                            className={`w-16 h-16 rounded-lg object-cover ${
                              !classItem.isToday && !classItem.isCompleted ? 'grayscale' : ''
                            }`}
                          />
                        </div>
                        
                        {/* Badge del día - Separado del thumbnail */}
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          classItem.isToday ? 'bg-[#85ea10] text-black' :
                          classItem.isCompleted ? 'bg-green-500 text-white' :
                            'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {classItem.isCompleted ? '✓' : classItem.dayNumber}
                        </div>
                        
                        {/* Contenido de la clase */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-semibold mb-2 leading-tight ${
                            classItem.isToday ? 'text-gray-900 dark:text-white' :
                            classItem.isCompleted ? 'text-gray-900 dark:text-white' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>
                            {classItem.lesson.title}
                          </h4>
                          
                          {/* Descripción */}
                          <p className={`text-xs mb-3 leading-relaxed ${
                            classItem.isToday ? 'text-gray-600 dark:text-gray-300' :
                            classItem.isCompleted ? 'text-gray-600 dark:text-gray-300' :
                            'text-gray-400 dark:text-gray-500'
                          }`}>
                            {classItem.lesson.description || 'Descripción de la lección'}
                          </p>
                          
                          {/* Estado y duración */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              classItem.isToday ? 'text-[#85ea10]' :
                              classItem.isCompleted ? 'text-green-600 dark:text-green-400' :
                              'text-gray-400 dark:text-gray-500'
                            }`}>
                              {classItem.isCompleted ? '✓' : classItem.isToday ? '✓' : '⏳'} {classItem.statusText}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {classItem.lesson.duration || '30 min'}
                            </span>
                          </div>
                        </div>
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
