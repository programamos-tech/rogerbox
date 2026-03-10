'use client';

import Hls from 'hls.js';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Lock,
  MessageCircle,
  Play,
  Send,
  Star,
  Sunrise,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import Footer from '@/components/Footer';
import InsightsSection from '@/components/InsightsSection';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';

function StudentPageContent() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    purchases,
    loading: purchasesLoading,
    refresh: refreshPurchases,
  } = useUserPurchases();

  // Estados
  const [userProfile, setUserProfile] = useState<any>(null);
  const [courseWithLessons, setCourseWithLessons] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introEnded, setIntroEnded] = useState(false);
  const [showCourseImage, setShowCourseImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showNoCourses, setShowNoCourses] = useState(false);
  const [lessonVideoEnded, setLessonVideoEnded] = useState(false);
  const [completedLessonsList, setCompletedLessonsList] = useState<string[]>(
    [],
  );
  const [lessonRating, setLessonRating] = useState<{
    average_rating: number;
    total_ratings: number;
    user_rating: number | null;
  }>({ average_rating: 0, total_ratings: 0, user_rating: null });
  const [comments, setComments] = useState<
    Array<{
      id: string;
      user_name: string;
      user_avatar: string | null;
      content: string;
      created_at: string;
      likes_count: number;
      is_liked: boolean;
    }>
  >([]);
  const [newComment, setNewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Detectar si viene con autoStart (desde el botón "Tomar Clase Ahora")
  const autoStart = searchParams?.get('autoStart') === 'true';

  // Refs
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const lessonVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Obtener compra efectiva
  const effectivePurchase = purchases?.[0];

  // Sincronizar completedLessonsList con effectivePurchase
  useEffect(() => {
    if (effectivePurchase?.completed_lessons) {
      setCompletedLessonsList(effectivePurchase.completed_lessons);
    }
  }, [effectivePurchase?.completed_lessons]);

  const loadLessonRating = useCallback(async (lessonId: string) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/rating`);
      if (res.ok) {
        const data = await res.json();
        setLessonRating({
          average_rating: data.average_rating ?? 0,
          total_ratings: data.total_ratings ?? 0,
          user_rating: data.user_rating ?? null,
        });
      } else {
        setLessonRating({
          average_rating: 0,
          total_ratings: 0,
          user_rating: null,
        });
      }
    } catch {
      setLessonRating({
        average_rating: 0,
        total_ratings: 0,
        user_rating: null,
      });
    }
  }, []);

  const loadComments = useCallback(async (lessonId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('lesson_comments')
        .select(
          `
          id,
          content,
          created_at,
          likes_count,
          is_liked,
          profiles!inner(name, avatar_url)
        `,
        )
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (error) {
        setComments([]);
        return;
      }
      setComments(
        (commentsData ?? []).map((c: any) => ({
          id: c.id,
          user_name: c.profiles?.name ?? 'Usuario',
          user_avatar: c.profiles?.avatar_url ?? null,
          content: c.content,
          created_at: c.created_at,
          likes_count: c.likes_count ?? 0,
          is_liked: c.is_liked ?? false,
        })),
      );
    } catch {
      setComments([]);
    }
  }, []);

  useEffect(() => {
    if (currentLesson?.id) {
      loadLessonRating(currentLesson.id);
      loadComments(currentLesson.id);
    } else {
      setLessonRating({
        average_rating: 0,
        total_ratings: 0,
        user_rating: null,
      });
      setComments([]);
    }
  }, [currentLesson?.id, loadLessonRating, loadComments]);

  const handleSetRating = useCallback(
    async (rating: number) => {
      if (!currentLesson?.id || !user?.id) return;
      try {
        const res = await fetch(`/api/lessons/${currentLesson.id}/rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating }),
        });
        if (res.ok && currentLesson?.id) {
          loadLessonRating(currentLesson.id);
        }
      } catch {
        /* ignore */
      }
    },
    [currentLesson?.id, user?.id, loadLessonRating],
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id || !currentLesson?.id) return;
    try {
      const { data: newCommentData, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: currentLesson.id,
          user_id: user.id,
          content: newComment.trim(),
          likes_count: 0,
          is_liked: false,
        })
        .select(
          `id, content, created_at, likes_count, is_liked, profiles!inner(name, avatar_url)`,
        )
        .single();

      if (error) {
        return;
      }
      setComments((prev) => [
        {
          id: newCommentData.id,
          user_name: (newCommentData as any).profiles?.name ?? 'Usuario',
          user_avatar: (newCommentData as any).profiles?.avatar_url ?? null,
          content: newCommentData.content,
          created_at: newCommentData.created_at,
          likes_count: newCommentData.likes_count ?? 0,
          is_liked: newCommentData.is_liked ?? false,
        },
        ...prev,
      ]);
      setNewComment('');
    } catch {
      /* ignore */
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const newLikeStatus = !comment.is_liked;
    const newCount = newLikeStatus
      ? comment.likes_count + 1
      : comment.likes_count - 1;
    try {
      await supabase
        .from('lesson_comments')
        .update({ is_liked: newLikeStatus, likes_count: newCount })
        .eq('id', commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: newCount, is_liked: newLikeStatus }
            : c,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  // Cargar perfil del usuario (de forma lazy, no bloquea la carga del curso)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.email) return;

      try {
        const userId = (user as any).id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          if (error.code !== 'PGRST116') {
          }
          setUserProfile(null);
        } else {
          setUserProfile(data);
        }
      } catch (error: any) {
        if (error?.message) {
        }
        setUserProfile(null);
      }
    };

    // Cargar perfil de forma asíncrona sin bloquear
    loadUserProfile();
  }, [user]);

  // Cargar curso con lecciones
  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones de estado después de desmontar

    const loadCourseWithLessons = async () => {
      if (!effectivePurchase) {
        if (isMounted) {
          setLoading(false);
          setShowNoCourses(true);
        }
        return;
      }

      const courseId = effectivePurchase.course_id;
      if (!courseId) {
        if (isMounted) {
          setLoading(false);
          setShowNoCourses(true);
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);

        // OPTIMIZACIÓN MÁXIMA: Usar JOIN para traer curso y lecciones en una sola query
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            course_lessons (*)
          `)
          .eq('id', courseId)
          .maybeSingle();

        if (courseError) {
          if (isMounted) setLoading(false);
          return;
        }

        if (!courseData) {
          if (isMounted) setLoading(false);
          return;
        }

        // Ordenar lecciones ya que el JOIN no respeta el order
        const lessons = (courseData.course_lessons || []).sort(
          (a: any, b: any) => (a.lesson_order || 0) - (b.lesson_order || 0),
        );

        // Preparar datos
        const courseWithLessons = {
          ...courseData,
          lessons: lessons,
        };

        // Eliminar la propiedad course_lessons duplicada
        delete (courseWithLessons as any).course_lessons;

        // Actualizar todos los estados en una sola operación para evitar múltiples renders
        const availableLesson = getAvailableLesson(
          courseWithLessons,
          effectivePurchase,
        );

        setCourseWithLessons(courseWithLessons);
        setCurrentLesson(availableLesson);
        // Resetear el estado de video terminado cuando cambia la lección
        setLessonVideoEnded(false);

        // Configurar intro: siempre mostrar el intro primero, a menos que autoStart esté activo
        // autoStart solo se activa cuando el usuario hace clic en "Tomar Clase Ahora" desde el dashboard
        if (autoStart && availableLesson) {
          // Si viene con autoStart, saltar el intro y mostrar directamente la clase (sin preview)
          setShowIntro(false);
          setShowCourseImage(false);
          setIntroEnded(true);
        } else {
          // Por defecto, siempre mostrar el intro primero
          setShowIntro(true);
          setShowCourseImage(false);
          setIntroEnded(false);
        }
      } catch (error: any) {
        if (isMounted) setLoading(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Timeout de seguridad reducido a 5 segundos (optimización)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    // Solo iniciar la carga cuando las compras hayan terminado de cargar Y haya una compra efectiva
    if (!purchasesLoading) {
      if (effectivePurchase) {
        loadCourseWithLessons();
      } else {
        if (isMounted) {
          setLoading(false);
          setShowNoCourses(true);
        }
      }
    } else {
      // Mantener loading en true mientras se cargan las compras
      if (isMounted) setLoading(true);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [effectivePurchase, purchasesLoading]);

  // Función para obtener la clase disponible
  const getAvailableLesson = (course: any, purchase: any) => {
    // Usar start_date si existe, sino usar created_at como fecha de inicio
    let startDateStr = purchase?.start_date || purchase?.created_at;
    if (!course?.lessons || !startDateStr) return null;

    // Si created_at viene como timestamp ISO, convertir a YYYY-MM-DD
    if (startDateStr.includes('T')) {
      startDateStr = startDateStr.split('T')[0];
    }

    // Crear fechas en hora local para evitar problemas de zona horaria
    const today = new Date();
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Parsear start_date y crear fecha local
    const startDateParts = startDateStr.split('-');
    const startDateLocal = new Date(
      parseInt(startDateParts[0]),
      parseInt(startDateParts[1]) - 1,
      parseInt(startDateParts[2]),
    );

    // Calcular diferencia en días
    const timeDiff = todayLocal.getTime() - startDateLocal.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Si las fechas son iguales (empezó hoy), forzar daysDiff = 0
    const isSameDay =
      todayLocal.getFullYear() === startDateLocal.getFullYear() &&
      todayLocal.getMonth() === startDateLocal.getMonth() &&
      todayLocal.getDate() === startDateLocal.getDate();

    const finalDaysDiff = isSameDay ? 0 : daysDiff;

    if (finalDaysDiff < 0) {
      return null; // Aún no ha empezado
    }

    // Si finalDaysDiff = 0 (empezó hoy), la primera clase (index 0) está disponible
    // Si finalDaysDiff = 1 (empezó ayer), la segunda clase (index 1) está disponible, etc.
    const lessonIndex = Math.max(
      0,
      Math.min(finalDaysDiff, course.lessons.length - 1),
    );
    const selectedLesson = course.lessons[lessonIndex];

    return selectedLesson;
  };

  // Función para obtener estado de las clases
  const getLessonStatus = (lesson: any, index: number) => {
    // Usar start_date si existe, sino usar created_at como fecha de inicio
    let startDateStr =
      effectivePurchase?.start_date || effectivePurchase?.created_at;
    if (!startDateStr) {
      return { status: 'locked', text: 'Bloqueada', icon: Lock };
    }

    // Si created_at viene como timestamp ISO, convertir a YYYY-MM-DD
    if (startDateStr.includes('T')) {
      startDateStr = startDateStr.split('T')[0];
    }

    // Crear fechas en hora local para evitar problemas de zona horaria
    const today = new Date();
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Parsear start_date y crear fecha local
    const startDateParts = startDateStr.split('-');
    const startDateLocal = new Date(
      parseInt(startDateParts[0]),
      parseInt(startDateParts[1]) - 1,
      parseInt(startDateParts[2]),
    );

    // Calcular diferencia en días
    const timeDiff = todayLocal.getTime() - startDateLocal.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Si las fechas son iguales (empezó hoy), forzar daysDiff = 0
    const isSameDay =
      todayLocal.getFullYear() === startDateLocal.getFullYear() &&
      todayLocal.getMonth() === startDateLocal.getMonth() &&
      todayLocal.getDate() === startDateLocal.getDate();

    const finalDaysDiff = isSameDay ? 0 : daysDiff;
    const lessonDay = index; // La primera clase es index 0, corresponde al día 0

    // Debug para la primera clase (solo una vez, no en cada render)
    // Comentado para evitar logs repetidos
    // if (index === 0) {
    //   // }

    // Completada - usar estado local actualizado
    const completedLessons =
      completedLessonsList.length > 0
        ? completedLessonsList
        : effectivePurchase?.completed_lessons || [];
    if (completedLessons.includes(lesson.id)) {
      return { status: 'completed', text: 'Completada', icon: CheckCircle };
    }

    // Si la clase ya pasó (día anterior), considerarla como completada automáticamente
    // Esto evita que aparezca como "perdida" si el usuario ya la tomó
    if (lessonDay < finalDaysDiff) {
      return { status: 'completed', text: 'Completada', icon: CheckCircle };
    }

    // Disponible hoy (si el día de la clase coincide con la diferencia de días desde el inicio)
    // Si el curso empezó hoy (finalDaysDiff = 0), la primera clase (index 0) está disponible
    if (lessonDay === finalDaysDiff) {
      return { status: 'available', text: 'Disponible', icon: Play };
    }

    // Bloqueada (días futuros)
    return { status: 'locked', text: 'Bloqueada', icon: Lock };
  };

  // Manejar finalización del intro
  const handleIntroEnd = () => {
    setIntroEnded(true);
    setShowCourseImage(true);
    setShowIntro(false);
  };

  // Marcar lección como completada en la base de datos
  const markLessonAsCompleted = async (lessonId: string) => {
    if (!effectivePurchase || !user) {
      return;
    }

    const courseId = effectivePurchase.course_id;
    if (!courseId) {
      return;
    }

    try {
      // Llamar a la API para marcar la lección como completada
      const response = await fetch('/api/lessons/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          course_id: courseId,
          duration_watched: currentLesson?.duration_minutes || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error desconocido' }));
        // Aún así actualizar el estado local para feedback inmediato
        if (!completedLessonsList.includes(lessonId)) {
          setCompletedLessonsList((prev) => [...prev, lessonId]);
        }
        return;
      }

      // Actualizar el estado local inmediatamente
      if (!completedLessonsList.includes(lessonId)) {
        setCompletedLessonsList((prev) => [...prev, lessonId]);
      }
    } catch (error: any) {
      // Actualizar el estado local como fallback
      if (!completedLessonsList.includes(lessonId)) {
        setCompletedLessonsList((prev) => [...prev, lessonId]);
      }
    }
  };

  // Inicializar video de la lección con HLS
  const initializeLessonVideo = useCallback(() => {
    const video = lessonVideoRef.current;
    if (!video) {
      return;
    }

    if (!currentLesson) {
      return;
    }

    // El playback_id puede estar en video_url, playback_id, o mux_playback_id
    let playbackId =
      currentLesson.video_url ||
      currentLesson.playback_id ||
      currentLesson.mux_playback_id;

    if (!playbackId) {
      return;
    }

    // Limpiar el playback_id: remover espacios, URLs completas, y extraer solo el ID
    playbackId = playbackId.trim();

    // Si viene como URL completa, extraer solo el ID
    if (playbackId.includes('stream.mux.com')) {
      const match = playbackId.match(/stream\.mux\.com\/([^/?.]+)/);
      if (match) playbackId = match[1];
    } else if (playbackId.includes('player.mux.com')) {
      const match = playbackId.match(/player\.mux\.com\/([^/?.]+)/);
      if (match) playbackId = match[1];
    } else if (playbackId.includes('.m3u8')) {
      playbackId = playbackId.replace('.m3u8', '').trim();
    }

    const videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    // Verificar que el playbackId no esté vacío después de limpiar
    if (!playbackId || playbackId.trim() === '') {
      return;
    }

    // Verificar formato básico del playback ID (generalmente alfanumérico)
    if (playbackId.length < 10) {
    }

    // Limpiar HLS anterior
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Verificar soporte HLS nativo
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setVideoLoading(true);
      video.src = videoUrl;
      video.load();

      video.addEventListener('loadeddata', () => {
        setVideoLoading(false);
      });

      video.addEventListener('error', () => {
        setVideoLoading(false);
      });

      video.play().catch((err) => {
        setVideoLoading(false);
      });
    } else if (Hls.isSupported()) {
      try {
        setVideoLoading(true);
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          debug: false, // Deshabilitar debug para producción
        });

        // Agregar TODOS los listeners ANTES de cargar el source
        hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {});

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setVideoLoading(false);
          // Intentar reproducir automáticamente
          video.play().catch((err) => {
            if (err.name !== 'NotAllowedError') {
            } else {
            }
          });
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {});

        hls.on(Hls.Events.ERROR, (event, data) => {
          // Ignorar errores menores que son normales durante la reproducción
          const ignorarErrores = [
            'bufferStalledError',
            'bufferSeekOverHole',
            'bufferNudgeOnStall',
            'fragLoadingTimeOut',
            'fragParsingError',
            'levelSwitchError',
          ];

          // Solo procesar errores fatales o errores importantes que no estén en la lista de ignorar
          if (data.fatal) {
            // Mostrar error visible en la pantalla solo para errores fatales
            const errorDiv = document.createElement('div');
            errorDiv.className =
              'absolute inset-0 bg-red-900/80 flex items-center justify-center z-50';
            errorDiv.innerHTML = `
              <div class="text-center text-white p-6">
                <p class="text-xl font-bold mb-2">Error al cargar el video</p>
                <p class="text-sm mb-4">${data.details || 'Error desconocido'}</p>
                <p class="text-xs opacity-75">URL: ${videoUrl}</p>
              </div>
            `;
            video.parentElement?.appendChild(errorDiv);

            // Intentar recuperar errores fatales
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
          } else if (data.details && !ignorarErrores.includes(data.details)) {
          }
          // Si el error está en la lista de ignorar o no es fatal, no hacer nada
        });

        // Agregar listeners del elemento video
        video.addEventListener('loadeddata', () => {
          setVideoLoading(false);
        });

        video.addEventListener('canplay', () => {
          setVideoLoading(false);
        });

        video.addEventListener('error', (e) => {
          setVideoLoading(false);
        });

        // Escuchar cuando el video termine para mostrar el progreso
        video.addEventListener('ended', () => {
          setLessonVideoEnded(true);

          // Marcar la lección como completada en la base de datos
          if (effectivePurchase && currentLesson) {
            markLessonAsCompleted(currentLesson.id);
          }
        });

        // Cargar el source y adjuntar al video DESPUÉS de configurar todos los listeners
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } catch (err) {
        setVideoLoading(false);
      }
    } else {
      setVideoLoading(false);
    }
  }, [currentLesson]);

  // Manejar click en "Iniciar Clase Ahora"
  const handleStartLesson = () => {
    if (showCourseImage) {
      // Si estamos en la imagen del curso, pasar directamente al video de la lección
      setShowCourseImage(false);
      setShowIntro(false);
      // Inicializar el video inmediatamente
      setTimeout(() => {
        if (currentLesson && lessonVideoRef.current) {
          initializeLessonVideo();
        }
      }, 100);
    } else if (showIntro) {
      // Si estamos en el intro, saltar directamente al video de la lección (sin mostrar imagen)
      setShowIntro(false);
      setShowCourseImage(false);
      // Inicializar el video inmediatamente
      setTimeout(() => {
        if (currentLesson && lessonVideoRef.current) {
          initializeLessonVideo();
        }
      }, 100);
    }
  };

  // Auto-iniciar video si viene con autoStart
  useEffect(() => {
    if (
      autoStart &&
      currentLesson &&
      !showIntro &&
      !showCourseImage &&
      !lessonVideoEnded
    ) {
      // Esperar a que el elemento de video esté disponible en el DOM
      let attempts = 0;
      const maxAttempts = 30; // Aumentar intentos a 30 (3 segundos)
      let timeoutId: NodeJS.Timeout;

      const checkAndInitialize = () => {
        attempts++;
        const videoElement = lessonVideoRef.current;
        if (videoElement) {
          // Forzar un pequeño delay adicional para asegurar que el DOM esté completamente renderizado
          setTimeout(() => {
            initializeLessonVideo();
          }, 200);
        } else {
          if (attempts < maxAttempts) {
            // Si el ref aún no está disponible, reintentar después de un breve delay
            timeoutId = setTimeout(checkAndInitialize, 100);
          } else {
            // No es un error crítico, el otro useEffect lo manejará
          }
        }
      };

      // Pequeño delay inicial para asegurar que el DOM se haya actualizado
      timeoutId = setTimeout(checkAndInitialize, 300);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [
    autoStart,
    currentLesson?.id,
    showIntro,
    showCourseImage,
    lessonVideoEnded,
  ]);

  // Efecto adicional: inicializar video cuando currentLesson cambia y no hay intro/image
  // IMPORTANTE: Solo inicializar si el intro ya terminó Y la imagen del curso también fue cerrada
  // El flujo correcto es: Intro → Preview (imagen del curso) → Video de la lección
  useEffect(() => {
    // Solo inicializar el video si:
    // 1. Hay una lección actual
    // 2. El intro no se está mostrando
    // 3. La imagen del curso NO se está mostrando (ya fue cerrada)
    // 4. El intro ya terminó (introEnded) O fue saltado con autoStart
    // 5. El elemento de video está disponible
    // IMPORTANTE: NO inicializar si showCourseImage es true (debe mostrarse el preview primero)
    if (
      currentLesson &&
      !showIntro &&
      !showCourseImage &&
      introEnded &&
      lessonVideoRef.current
    ) {
      // Inicializar el video cuando se oculta el intro Y la imagen del curso
      // Solo si el intro ya terminó (y por lo tanto el preview ya se mostró y fue cerrado)
      const timer = setTimeout(() => {
        initializeLessonVideo();
      }, 200);

      return () => clearTimeout(timer);
    } else if (
      autoStart &&
      currentLesson &&
      !showIntro &&
      !showCourseImage &&
      lessonVideoRef.current
    ) {
      // Si viene con autoStart, saltar todo y mostrar directamente el video
      const timer = setTimeout(() => {
        initializeLessonVideo();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [currentLesson?.id, showIntro, showCourseImage, introEnded, autoStart]);

  // Cerrar menú de usuario al hacer click fuera
  // Limpiar HLS al desmontar
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Fallback: Si el video intro no se carga después de 3 segundos, mostrar el preview
  useEffect(() => {
    if (!showIntro || introEnded) return;

    const timer = setTimeout(() => {
      if (introVideoRef.current && introVideoRef.current.readyState < 2) {
        handleIntroEnd();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showIntro, introEnded]);

  // Controlar cuándo mostrar el mensaje "No tienes cursos"
  useEffect(() => {
    // Si las compras terminaron de cargar y no hay compra efectiva, mostrar el mensaje
    if (!purchasesLoading) {
      if (!effectivePurchase && (purchases?.length === 0 || !purchases)) {
        // Usar un timeout más corto para mejor UX
        const timer = setTimeout(() => {
          setShowNoCourses(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setShowNoCourses(false);
      }
    }
  }, [purchasesLoading, effectivePurchase, purchases]);

  // Timeout de seguridad global para evitar loading infinito
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      setLoading(false);
      if (!effectivePurchase && !purchasesLoading) {
        setShowNoCourses(true);
      }
    }, 10000); // 10 segundos máximo

    return () => clearTimeout(globalTimeout);
  }, []);

  // Mostrar loading único mientras se cargan TODOS los datos (compras, curso, lecciones)
  // Solo mostrar contenido cuando TODO esté listo
  // Lógica mejorada: solo mostrar loading si realmente estamos cargando algo
  const isLoading =
    purchasesLoading ||
    (loading && effectivePurchase) ||
    (!courseWithLessons && effectivePurchase && !purchasesLoading);

  // Debug: Log del estado de carga
  useEffect(() => {}, [
    purchasesLoading,
    loading,
    effectivePurchase,
    courseWithLessons,
    purchases,
    showNoCourses,
    isLoading,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-300">
            Cargando tu curso...
          </p>
        </div>
      </div>
    );
  }

  // Solo mostrar "No tienes cursos" si realmente no hay compras después de esperar
  // También mostrar si no hay compras y las compras ya terminaron de cargar
  if (
    !effectivePurchase &&
    !purchasesLoading &&
    (showNoCourses || purchases?.length === 0 || !purchases)
  ) {
    const handleDebug = async () => {
      try {
        const response = await fetch('/api/debug/purchases');
        const data = await response.json();
        alert(
          `Compras con RLS: ${data.purchases?.withRLS?.count || 0}\nCompras con Admin: ${data.purchases?.withAdmin?.count || 0}\nÓrdenes: ${data.orders?.count || 0}\n\nRevisa la consola para más detalles.`,
        );
      } catch (error) {}
    };

    const handleRefresh = async () => {
      await refreshPurchases();
    };

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No tienes cursos comprados
          </h1>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all"
            >
              Ver Cursos Disponibles
            </button>
            {/* Botones de debug temporal */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDebug}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
              >
                🔍 Debug Compras
              </button>
              <button
                onClick={handleRefresh}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
              >
                🔄 Refrescar Compras
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
              >
                🔄 Recargar Página
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DashboardNavbar notifications={[]} />

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Contenido Principal - Video Player (YouTube Style) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Intro Video (estilo Netflix) - Mostrar si showIntro es true */}
            {showIntro && (
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={introVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleIntroEnd}
                  onError={(e) => {
                    // Si el video no se puede cargar, saltar directamente a mostrar la imagen del curso
                    handleIntroEnd();
                  }}
                  onLoadStart={() => {}}
                  onLoadedData={() => {}}
                  onPlay={() => {}}
                >
                  <source src="/roger-hero.mp4" type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>

                {/* Botón "Iniciar Clase Ahora" - Estilo marca */}
                <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-10">
                  <button
                    onClick={handleStartLesson}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-gray-600 shadow-sm flex items-center space-x-2 text-xs sm:text-sm transition-all duration-200 hover:border-[#85ea10]/50"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      Iniciar Clase Ahora
                    </span>
                    <span className="sm:hidden">Iniciar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Imagen del Curso - Después del teaser */}
            {(() => {
              return null;
            })()}
            {showCourseImage && courseWithLessons && (
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                {(() => {
                  // Intentar obtener la imagen del curso en este orden: image_url, preview_image, thumbnail_url
                  const courseImage =
                    courseWithLessons.image_url ||
                    courseWithLessons.preview_image ||
                    courseWithLessons.thumbnail_url;

                  return courseImage ? (
                    <Image
                      src={courseImage}
                      alt={courseWithLessons.title || 'Imagen del curso'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                      loading="lazy"
                      quality={85}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
                          No hay imagen disponible
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Botón "Iniciar Clase Ahora" - Estilo marca */}
                <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-10">
                  <button
                    onClick={handleStartLesson}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-gray-600 shadow-sm flex items-center space-x-2 text-xs sm:text-sm transition-all duration-200 hover:border-[#85ea10]/50"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      Iniciar Clase Ahora
                    </span>
                    <span className="sm:hidden">Iniciar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contenedor del Video/Progreso - Mismo espacio siempre */}
            {!showIntro && !showCourseImage && currentLesson && (
              <div className="relative w-full aspect-video bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Video de la Lección - Solo visible si el video no ha terminado */}
                {!lessonVideoEnded ? (
                  <>
                    <video
                      ref={lessonVideoRef}
                      className="w-full h-full"
                      controls
                      playsInline
                      preload="auto"
                      key={currentLesson.id} // Forzar re-render cuando cambia la lección
                    />
                    {(() => {
                      const playbackId =
                        currentLesson.video_url ||
                        currentLesson.playback_id ||
                        currentLesson.mux_playback_id;

                      if (!playbackId) {
                        return (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 z-50">
                            <div className="text-center text-white p-6">
                              <p className="text-xl font-bold mb-2">
                                ⚠️ No hay video disponible
                              </p>
                              <p className="text-sm mb-4">
                                Esta clase no tiene un playback_id configurado
                              </p>
                              <p className="text-xs opacity-75 mt-4">
                                Campos disponibles:{' '}
                                {Object.keys(currentLesson).join(', ')}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Indicador de carga */}
                    {videoLoading &&
                    (currentLesson.video_url ||
                      currentLesson.playback_id ||
                      currentLesson.mux_playback_id) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 pointer-events-none">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
                          <p className="text-sm">Cargando video...</p>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  /* Tu Progreso - Se muestra cuando el video termina */
                  userProfile && (
                    <div className="w-full h-full overflow-hidden">
                      <InsightsSection
                        userProfile={userProfile}
                        currentLesson={currentLesson}
                        completedLessons={
                          completedLessonsList.length > 0
                            ? completedLessonsList
                            : effectivePurchase?.completed_lessons || []
                        }
                        lessonVideoEnded={lessonVideoEnded}
                        courseWithLessons={courseWithLessons}
                        effectivePurchase={effectivePurchase}
                      />
                    </div>
                  )
                )}
              </div>
            )}

            {/* Nombre, descripción, valoración y comentarios - Estilo marca */}
            {currentLesson && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                    {currentLesson.title}
                  </h1>
                  {currentLesson.description ? (
                    <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {currentLesson.description}
                    </p>
                  ) : (
                    <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400 italic line-clamp-3 sm:line-clamp-none">
                      No hay descripción disponible para esta clase.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-4">
                    {currentLesson.duration_minutes && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium">
                          {currentLesson.duration_minutes} minutos
                        </span>
                      </div>
                    )}
                    {/* Valoración de la clase */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-0.5"
                        role="group"
                        aria-label="Valorar clase"
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const value =
                            hoveredRating ||
                            lessonRating.user_rating ||
                            lessonRating.average_rating;
                          const filled = star <= Math.round(value);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleSetRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                            >
                              <Star
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                  filled
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300 dark:text-gray-500'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {lessonRating.average_rating > 0
                          ? `${lessonRating.average_rating} (${lessonRating.total_ratings} ${lessonRating.total_ratings === 1 ? 'valoración' : 'valoraciones'})`
                          : 'Sin valoraciones'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comentarios de la clase */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Comentarios ({comments.length})
                  </h3>
                  <form onSubmit={handleCommentSubmit} className="mb-4">
                    <div className="flex gap-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe tu comentario sobre la clase..."
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        rows={2}
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className={`px-3 py-2 rounded-xl font-medium transition-colors shrink-0 ${
                          newComment.trim()
                            ? 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed border border-transparent'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                        Aún no hay comentarios. ¡Sé el primero en comentar!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium text-sm shrink-0">
                              {comment.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {comment.user_name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                                {comment.content}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleLikeComment(comment.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${
                                  comment.is_liked
                                    ? 'text-gray-700 dark:text-gray-300'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{comment.likes_count}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sin lección disponible */}
            {!showIntro && !currentLesson && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-12 text-center">
                <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No hay clases disponibles hoy
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Tu próxima clase se desbloqueará según la fecha de inicio de
                  tu curso.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Lista de Clases - Estilo marca */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 sticky top-20 sm:top-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Clases del Curso
              </h2>
              {courseWithLessons && (
                <>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                    {courseWithLessons.title}
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    {courseWithLessons?.lessons?.map(
                      (lesson: any, index: number) => {
                        const lessonStatus = getLessonStatus(lesson, index);
                        const StatusIcon = lessonStatus.icon;
                        // Solo la clase disponible actual debe estar resaltada
                        const isCurrent =
                          currentLesson?.id === lesson.id &&
                          lessonStatus.status === 'available';

                        // Determinar si es la próxima clase (la siguiente después de la actual disponible o completada)
                        const currentAvailableIndex =
                          courseWithLessons.lessons.findIndex(
                            (l: any, idx: number) => {
                              const status = getLessonStatus(l, idx);
                              return status.status === 'available';
                            },
                          );
                        const isNextClass =
                          index === currentAvailableIndex + 1 &&
                          lessonStatus.status === 'locked';

                        return (
                          <div
                            key={lesson.id}
                            onClick={(e) => {
                              // Bloquear click en clases completadas
                              if (lessonStatus.status === 'completed') {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              // Solo permitir reproducir si está disponible
                              if (lessonStatus.status === 'available') {
                                setCurrentLesson(lesson);
                                setShowIntro(true);
                                setShowCourseImage(false);
                                setIntroEnded(false);
                                setLessonVideoEnded(false); // Resetear cuando cambia de lección
                                if (introVideoRef.current) {
                                  introVideoRef.current.currentTime = 0;
                                  introVideoRef.current.play();
                                }
                              }
                            }}
                            className={`p-2.5 sm:p-3 rounded-2xl transition-all relative border ${
                              lessonStatus.status === 'completed'
                                ? 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-600'
                                : isCurrent
                                  ? 'bg-gray-50 dark:bg-gray-700/50 border-[#85ea10]/40 cursor-pointer hover:border-[#85ea10]/50'
                                  : lessonStatus.status === 'available'
                                    ? 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer'
                                    : 'bg-white/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            {/* Check visible para clases completadas - ultra sutil */}
                            {lessonStatus.status === 'completed' && (
                              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                                <CheckCircle
                                  className="w-3 h-3 sm:w-4 sm:h-4 text-green-500/70"
                                  strokeWidth={2}
                                  fill="none"
                                />
                              </div>
                            )}

                            {/* Badge "Mañana disponible" para la próxima clase */}
                            {isNextClass && (
                              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-gradient-to-r from-amber-400/95 to-orange-400/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 z-10 shadow-sm border border-amber-300/30 flex items-center space-x-1">
                                <Sunrise
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                                  strokeWidth={2.5}
                                />
                                <span className="text-[10px] sm:text-xs font-medium text-white">
                                  Mañana
                                </span>
                              </div>
                            )}

                            <div className="flex items-start space-x-2 sm:space-x-3">
                              {/* Thumbnail */}
                              <div className="relative w-24 h-16 sm:w-32 sm:h-20 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                                {lesson.preview_image || lesson.thumbnail ? (
                                  <Image
                                    src={
                                      lesson.preview_image || lesson.thumbnail
                                    }
                                    alt={lesson.title}
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                    loading="lazy"
                                    quality={75}
                                    style={{
                                      filter:
                                        lessonStatus.status === 'completed'
                                          ? 'grayscale(20%) brightness(97%) contrast(99%) saturate(90%) opacity(0.85)'
                                          : lessonStatus.status === 'locked'
                                            ? 'grayscale(100%) brightness(105%) contrast(110%)'
                                            : isNextClass
                                              ? 'sepia(25%) brightness(105%) contrast(100%) saturate(130%) hue-rotate(5deg)'
                                              : 'none',
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                {lessonStatus.status === 'available' && (
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                                  </div>
                                )}
                                {lessonStatus.status === 'completed' && (
                                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 sm:p-1.5 shadow-sm">
                                      <CheckCircle
                                        className="w-3 h-3 sm:w-4 sm:h-4 text-green-500"
                                        strokeWidth={2.5}
                                        fill="none"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5 mb-1.5">
                                  {lessonStatus.status === 'completed' ? (
                                    <CheckCircle
                                      className="w-3.5 h-3.5 text-green-500/60"
                                      strokeWidth={2}
                                      fill="none"
                                    />
                                  ) : (
                                    <StatusIcon
                                      className={`w-3.5 h-3.5 ${
                                        lessonStatus.status === 'lost'
                                          ? 'text-gray-400'
                                          : lessonStatus.status === 'available'
                                            ? 'text-[#85ea10]'
                                            : 'text-gray-300 dark:text-gray-500'
                                      }`}
                                    />
                                  )}
                                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                                    {lessonStatus.status === 'completed'
                                      ? 'Completada'
                                      : lessonStatus.text}
                                  </span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                                  {lesson.title}
                                </h3>
                                {lesson.duration_minutes && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-normal">
                                    {lesson.duration_minutes} min
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function StudentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
          </div>
        </div>
      }
    >
      <StudentPageContent />
    </Suspense>
  );
}
