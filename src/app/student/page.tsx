'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  User,
  LogOut,
  ChevronDown,
  Settings,
  Clock,
  CheckCircle,
  Lock,
  XCircle
} from 'lucide-react';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';
import InsightsSection from '@/components/InsightsSection';
import Footer from '@/components/Footer';
import Hls from 'hls.js';

export default function StudentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { purchases, loading: purchasesLoading } = useUserPurchases();
  
  // Estados
  const [userProfile, setUserProfile] = useState<any>(null);
  const [courseWithLessons, setCourseWithLessons] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introEnded, setIntroEnded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Refs
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const lessonVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Obtener compra efectiva
  const effectivePurchase = purchases?.[0];

  // Cargar perfil del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!session?.user?.email) return;
      
      try {
        const userId = (session.user as any).id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    loadUserProfile();
  }, [session]);

  // Cargar curso con lecciones
  useEffect(() => {
    const loadCourseWithLessons = async () => {
      if (!effectivePurchase?.course?.slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Cargando curso:', effectivePurchase.course.slug);
        
        // Buscar el curso por slug
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('slug', effectivePurchase.course.slug)
          .eq('is_published', true)
          .single();

        if (courseError || !course) {
          console.error('❌ Error cargando curso:', courseError);
          setLoading(false);
          return;
        }

        // Cargar lecciones
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('lesson_order', { ascending: true });

        if (lessonsError) {
          console.warn('⚠️ Error cargando lecciones:', lessonsError);
        }

        const courseWithLessons = {
          ...course,
          lessons: lessons || []
        };

        setCourseWithLessons(courseWithLessons);

        // Determinar clase disponible
        const availableLesson = getAvailableLesson(courseWithLessons, effectivePurchase);
        setCurrentLesson(availableLesson);

      } catch (error) {
        console.error('❌ Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!purchasesLoading && effectivePurchase) {
      loadCourseWithLessons();
    }
  }, [effectivePurchase, purchasesLoading]);

  // Función para obtener la clase disponible
  const getAvailableLesson = (course: any, purchase: any) => {
    if (!course?.lessons || !purchase?.start_date) return null;

    const startDate = new Date(purchase.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return null; // Aún no ha empezado
    
    const lessonIndex = Math.min(daysDiff, course.lessons.length - 1);
    return course.lessons[lessonIndex];
  };

  // Función para obtener estado de las clases
  const getLessonStatus = (lesson: any, index: number) => {
    if (!effectivePurchase?.start_date) {
      return { status: 'locked', text: 'Bloqueada', icon: Lock };
    }

    const startDate = new Date(effectivePurchase.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const lessonDay = index;

    // Completada
    const completedLessons = effectivePurchase.completed_lessons || [];
    if (completedLessons.includes(lesson.id)) {
      return { status: 'completed', text: 'Completada', icon: CheckCircle };
    }

    // Perdida (día pasado y no completada)
    if (lessonDay < daysDiff) {
      return { status: 'lost', text: 'Perdida', icon: XCircle };
    }

    // Disponible hoy
    if (lessonDay === daysDiff) {
      return { status: 'available', text: 'Disponible', icon: Play };
    }

    // Bloqueada
    return { status: 'locked', text: 'Bloqueada', icon: Lock };
  };

  // Manejar finalización del intro
  const handleIntroEnd = () => {
    setIntroEnded(true);
  };

  // Manejar click en "Avanzar a Clase"
  const handleStartLesson = () => {
    setShowIntro(false);
    if (currentLesson && lessonVideoRef.current) {
      // Inicializar HLS para la lección
      initializeLessonVideo();
    }
  };

  // Inicializar video de la lección con HLS
  const initializeLessonVideo = () => {
    const video = lessonVideoRef.current;
    if (!video || !currentLesson?.video_url) return;

    const videoUrl = `https://stream.mux.com/${currentLesson.video_url}.m3u8`;

    // Limpiar HLS anterior
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Verificar soporte HLS nativo
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.load();
    } else if (Hls.isSupported()) {
      try {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          debug: false,
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            if (err.name !== 'NotAllowedError') {
              console.warn('⚠️ Error al reproducir:', err.message);
            }
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                try {
                  hls.startLoad();
                } catch (err) {
                  hls.destroy();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                try {
                  hls.recoverMediaError();
                } catch (err) {
                  hls.destroy();
                }
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } catch (err) {
        console.error('❌ Error al inicializar HLS:', err);
      }
    }
  };

  // Cerrar menú de usuario al hacer click fuera
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

  // Limpiar HLS al desmontar
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  if (purchasesLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu curso...</p>
        </div>
      </div>
    );
  }

  if (!effectivePurchase || !courseWithLessons) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No tienes cursos comprados</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all"
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
                  <p className="text-xs text-gray-500 dark:text-white/60">{session?.user?.email || ''}</p>
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
          {/* Contenido Principal - Video Player (YouTube Style) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intro Video (estilo Netflix) */}
            {showIntro && (
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={introVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleIntroEnd}
                >
                  <source src="/roger-hero.mp4" type="video/mp4" />
                </video>
                
                {/* Overlay con botón "Avanzar a Clase" (estilo Netflix) */}
                {introEnded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-500">
                    <button
                      onClick={handleStartLesson}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-12 py-4 rounded-xl transition-all duration-300 hover:scale-110 shadow-2xl flex items-center space-x-3 text-xl"
                    >
                      <Play className="w-6 h-6" />
                      <span>Avanzar a Clase</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Video de la Lección */}
            {!showIntro && currentLesson && (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <video
                    ref={lessonVideoRef}
                    className="w-full h-full"
                    controls
                    playsInline
                  />
                </div>

                {/* Información de la Lección */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentLesson.title}
                  </h1>
                  {currentLesson.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {currentLesson.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {currentLesson.duration_minutes && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{currentLesson.duration_minutes} min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights Section */}
                {userProfile && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <InsightsSection userProfile={userProfile} />
                  </div>
                )}
              </div>
            )}

            {/* Sin lección disponible */}
            {!showIntro && !currentLesson && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No hay clases disponibles hoy
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tu próxima clase se desbloqueará según la fecha de inicio de tu curso.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Lista de Clases (YouTube Style) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Clases del Curso
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {courseWithLessons.title}
              </p>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {courseWithLessons.lessons?.map((lesson: any, index: number) => {
                  const lessonStatus = getLessonStatus(lesson, index);
                  const StatusIcon = lessonStatus.icon;
                  const isCurrent = currentLesson?.id === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (lessonStatus.status === 'available' || lessonStatus.status === 'completed') {
                          setCurrentLesson(lesson);
                          setShowIntro(true);
                          setIntroEnded(false);
                          if (introVideoRef.current) {
                            introVideoRef.current.currentTime = 0;
                            introVideoRef.current.play();
                          }
                        }
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-[#85ea10]/10 border-2 border-[#85ea10]'
                          : lessonStatus.status === 'available' || lessonStatus.status === 'completed'
                          ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          : 'bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Thumbnail */}
                        <div className="relative w-32 h-20 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          {lesson.preview_image || lesson.thumbnail ? (
                            <img
                              src={lesson.preview_image || lesson.thumbnail}
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {lessonStatus.status === 'available' && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <StatusIcon
                              className={`w-4 h-4 ${
                                lessonStatus.status === 'completed'
                                  ? 'text-green-600'
                                  : lessonStatus.status === 'lost'
                                  ? 'text-red-600'
                                  : lessonStatus.status === 'available'
                                  ? 'text-[#85ea10]'
                                  : 'text-gray-400'
                              }`}
                            />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {lessonStatus.text}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {lesson.title}
                          </h3>
                          {lesson.duration_minutes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {lesson.duration_minutes} min
                            </p>
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

      <Footer />
    </div>
  );
}
