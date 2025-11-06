'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, 
  User,
  LogOut,
  ChevronDown,
  Settings,
  Clock,
  CheckCircle,
  Lock,
  XCircle,
  Sunrise,
  CalendarDays,
  Home
} from 'lucide-react';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { supabase } from '@/lib/supabase';
import InsightsSection from '@/components/InsightsSection';
import Footer from '@/components/Footer';
import Hls from 'hls.js';

export default function StudentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { purchases, loading: purchasesLoading } = useUserPurchases();
  
  // Estados
  const [userProfile, setUserProfile] = useState<any>(null);
  const [courseWithLessons, setCourseWithLessons] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introEnded, setIntroEnded] = useState(false);
  const [showCourseImage, setShowCourseImage] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showNoCourses, setShowNoCourses] = useState(false);
  const [lessonVideoEnded, setLessonVideoEnded] = useState(false);
  const [completedLessonsList, setCompletedLessonsList] = useState<string[]>([]);
  
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
      console.log('📊 Sincronizando completedLessonsList:', {
        fromDB: effectivePurchase.completed_lessons,
        length: effectivePurchase.completed_lessons.length,
        currentState: completedLessonsList
      });
      setCompletedLessonsList(effectivePurchase.completed_lessons);
    }
  }, [effectivePurchase?.completed_lessons]);

  // Cargar perfil del usuario (de forma lazy, no bloquea la carga del curso)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!session?.user?.email) return;
      
      try {
        const userId = (session.user as any).id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error loading profile:', error.message || error);
          }
          setUserProfile(null);
        } else {
          setUserProfile(data);
        }
      } catch (error: any) {
        if (error?.message) {
          console.error('Error loading profile:', error.message);
        }
        setUserProfile(null);
      }
    };

    // Cargar perfil de forma asíncrona sin bloquear
    loadUserProfile();
  }, [session]);

  // Cargar curso con lecciones
  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones de estado después de desmontar
    
    const loadCourseWithLessons = async () => {
      if (!effectivePurchase) {
        if (isMounted) setLoading(false);
        return;
      }

      const courseId = effectivePurchase.course_id;
      if (!courseId) {
        if (isMounted) setLoading(false);
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
            console.error('❌ Error cargando curso:', courseError);
          if (isMounted) setLoading(false);
            return;
          }

        if (!courseData) {
          console.error('❌ Curso no encontrado:', courseId);
          if (isMounted) setLoading(false);
          return;
        }

        // Ordenar lecciones ya que el JOIN no respeta el order
        const lessons = (courseData.course_lessons || []).sort((a: any, b: any) => 
          (a.lesson_order || 0) - (b.lesson_order || 0)
        );

        // Preparar datos
          const courseWithLessons = {
          ...courseData,
          lessons: lessons
        };

        // Eliminar la propiedad course_lessons duplicada
        delete (courseWithLessons as any).course_lessons;

        // Actualizar todos los estados en una sola operación para evitar múltiples renders
        const availableLesson = getAvailableLesson(courseWithLessons, effectivePurchase);
        
          setCourseWithLessons(courseWithLessons);
        setCurrentLesson(availableLesson);
        // Resetear el estado de video terminado cuando cambia la lección
        setLessonVideoEnded(false);

        // Configurar intro según autoStart
        if (autoStart && availableLesson) {
          setShowIntro(false);
          setShowCourseImage(false);
          setIntroEnded(true);
        } else {
          setShowIntro(true);
          setShowCourseImage(false);
          setIntroEnded(false);
        }

        } catch (error) {
        console.error('❌ Error:', error);
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
        if (isMounted) setLoading(false);
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
    if (!course?.lessons || !purchase?.start_date) return null;

    // Parsear la fecha de inicio (puede venir como string YYYY-MM-DD)
    const startDateStr = purchase.start_date;
    
    // Crear fechas en hora local para evitar problemas de zona horaria
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Parsear start_date y crear fecha local
    const startDateParts = startDateStr.split('-');
    const startDateLocal = new Date(
      parseInt(startDateParts[0]), 
      parseInt(startDateParts[1]) - 1, 
      parseInt(startDateParts[2])
    );
    
    // Calcular diferencia en días
    const timeDiff = todayLocal.getTime() - startDateLocal.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Si las fechas son iguales (empezó hoy), forzar daysDiff = 0
    const isSameDay = todayLocal.getFullYear() === startDateLocal.getFullYear() &&
                      todayLocal.getMonth() === startDateLocal.getMonth() &&
                      todayLocal.getDate() === startDateLocal.getDate();
    
    const finalDaysDiff = isSameDay ? 0 : daysDiff;
    
    console.log('📅 Cálculo de clase disponible:', {
      startDateStr,
      startDateLocal: startDateLocal.toDateString(),
      todayLocal: todayLocal.toDateString(),
      timeDiff,
      daysDiff,
      isSameDay,
      finalDaysDiff,
      totalLessons: course.lessons.length
    });
    
    if (finalDaysDiff < 0) {
      console.log('⚠️ El curso aún no ha empezado');
      return null; // Aún no ha empezado
    }
    
    // Si finalDaysDiff = 0 (empezó hoy), la primera clase (index 0) está disponible
    // Si finalDaysDiff = 1 (empezó ayer), la segunda clase (index 1) está disponible, etc.
    const lessonIndex = Math.max(0, Math.min(finalDaysDiff, course.lessons.length - 1));
    const selectedLesson = course.lessons[lessonIndex];
    
    console.log('✅ Clase disponible:', {
      finalDaysDiff,
      lessonIndex,
      lessonTitle: selectedLesson?.title,
      lessonId: selectedLesson?.id
    });
    
    return selectedLesson;
  };

  // Función para obtener estado de las clases
  const getLessonStatus = (lesson: any, index: number) => {
    if (!effectivePurchase?.start_date) {
      return { status: 'locked', text: 'Bloqueada', icon: Lock };
    }
    
    // Parsear la fecha de inicio
    const startDateStr = effectivePurchase.start_date;
    
    // Crear fechas en hora local para evitar problemas de zona horaria
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Parsear start_date y crear fecha local
    const startDateParts = startDateStr.split('-');
    const startDateLocal = new Date(
      parseInt(startDateParts[0]), 
      parseInt(startDateParts[1]) - 1, 
      parseInt(startDateParts[2])
    );
    
    // Calcular diferencia en días
    const timeDiff = todayLocal.getTime() - startDateLocal.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Si las fechas son iguales (empezó hoy), forzar daysDiff = 0
    const isSameDay = todayLocal.getFullYear() === startDateLocal.getFullYear() &&
                      todayLocal.getMonth() === startDateLocal.getMonth() &&
                      todayLocal.getDate() === startDateLocal.getDate();
    
    const finalDaysDiff = isSameDay ? 0 : daysDiff;
    const lessonDay = index; // La primera clase es index 0, corresponde al día 0
    
    // Debug para la primera clase
    if (index === 0) {
      console.log('🔍 Estado Clase 1:', {
        startDateStr,
        startDateLocal: startDateLocal.toDateString(),
        todayLocal: todayLocal.toDateString(),
        daysDiff,
        isSameDay,
        finalDaysDiff,
        lessonDay: index,
        willBeAvailable: lessonDay === finalDaysDiff
      });
    }

    // Completada - usar estado local actualizado
    const completedLessons = completedLessonsList.length > 0 ? completedLessonsList : (effectivePurchase?.completed_lessons || []);
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
    console.log('🎬 Teaser terminado, mostrando imagen del curso');
    setIntroEnded(true);
    setShowCourseImage(true);
    setShowIntro(false);
  };

  // Marcar lección como completada en la base de datos
  const markLessonAsCompleted = async (lessonId: string) => {
    if (!effectivePurchase || !session?.user) {
      console.warn('⚠️ No se puede marcar lección como completada: falta effectivePurchase o session');
      return;
    }

    const purchaseId = effectivePurchase.id;
    if (!purchaseId) {
      console.error('❌ Error: effectivePurchase no tiene id válido');
      return;
    }

    try {
      // Obtener las lecciones completadas actuales
      const { data: purchase, error: fetchError } = await supabase
        .from('course_purchases')
        .select('completed_lessons')
        .eq('id', purchaseId)
        .single();

      if (fetchError) {
        console.error('❌ Error obteniendo compra:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code,
          purchaseId
        });
        // Intentar usar el estado actual de effectivePurchase como fallback
        const currentCompleted = effectivePurchase.completed_lessons || [];
        if (!currentCompleted.includes(lessonId)) {
          const updatedCompletedLessons = [...currentCompleted, lessonId];
          setCompletedLessonsList(updatedCompletedLessons);
        }
        return;
      }

      const completedLessons = purchase?.completed_lessons || [];
      
      // Si la lección ya está completada, no hacer nada
      if (completedLessons.includes(lessonId)) {
        console.log('✅ Lección ya estaba marcada como completada');
        // Aún así actualizar el estado local
        setCompletedLessonsList(completedLessons);
        return;
      }

      // Agregar la lección a la lista de completadas
      const updatedCompletedLessons = [...completedLessons, lessonId];

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({ completed_lessons: updatedCompletedLessons })
        .eq('id', purchaseId);

      if (updateError) {
        console.error('❌ Error actualizando lección completada:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          purchaseId
        });
        // Aún así actualizar el estado local para feedback inmediato
        setCompletedLessonsList(updatedCompletedLessons);
      } else {
        console.log('✅ Lección marcada como completada:', lessonId);
        // Actualizar el estado local inmediatamente
        setCompletedLessonsList(updatedCompletedLessons);
      }
      } catch (error: any) {
      console.error('❌ Error al marcar lección como completada:', {
        error: error?.message || error,
        stack: error?.stack,
        lessonId,
        purchaseId
      });
      // Intentar actualizar el estado local como fallback
      const currentCompleted = effectivePurchase.completed_lessons || [];
      if (!currentCompleted.includes(lessonId)) {
        const updatedCompletedLessons = [...currentCompleted, lessonId];
        setCompletedLessonsList(updatedCompletedLessons);
      }
    }
  };

  // Inicializar video de la lección con HLS
  const initializeLessonVideo = useCallback(() => {
    const video = lessonVideoRef.current;
    if (!video) {
      console.error('❌ Video element no está disponible');
      return;
    }
    
    if (!currentLesson) {
      console.error('❌ currentLesson no está disponible');
      return;
    }

    // El playback_id puede estar en video_url, playback_id, o mux_playback_id
    let playbackId = currentLesson.video_url || 
                     currentLesson.playback_id || 
                     currentLesson.mux_playback_id;

    console.log('🎥 Inicializando video:', {
      lessonId: currentLesson.id,
      lessonTitle: currentLesson.title,
      video_url: currentLesson.video_url,
      playback_id: currentLesson.playback_id,
      mux_playback_id: currentLesson.mux_playback_id,
      playbackIdRaw: playbackId,
      allFields: Object.keys(currentLesson)
    });

    if (!playbackId) {
      console.error('❌ No se encontró playback_id en la lección');
      return;
    }

    // Limpiar el playback_id: remover espacios, URLs completas, y extraer solo el ID
    playbackId = playbackId.trim();
    
    // Si viene como URL completa, extraer solo el ID
    if (playbackId.includes('stream.mux.com')) {
      const match = playbackId.match(/stream\.mux\.com\/([^\/\?\.]+)/);
      if (match) playbackId = match[1];
    } else if (playbackId.includes('player.mux.com')) {
      const match = playbackId.match(/player\.mux\.com\/([^\/\?\.]+)/);
      if (match) playbackId = match[1];
    } else if (playbackId.includes('.m3u8')) {
      playbackId = playbackId.replace('.m3u8', '').trim();
    }

    const videoUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    console.log('🔗 URL del video:', videoUrl);
    console.log('✅ Playback ID limpio:', playbackId);
    
    // Verificar que el playbackId no esté vacío después de limpiar
    if (!playbackId || playbackId.trim() === '') {
      console.error('❌ Playback ID está vacío después de limpiar');
      return;
    }
    
    // Verificar formato básico del playback ID (generalmente alfanumérico)
    if (playbackId.length < 10) {
      console.warn('⚠️ Playback ID parece muy corto:', playbackId);
    }

    // Limpiar HLS anterior
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Verificar soporte HLS nativo
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('✅ Usando HLS nativo');
      setVideoLoading(true);
      video.src = videoUrl;
      video.load();
      
      video.addEventListener('loadeddata', () => {
        console.log('✅ Video cargado (nativo)');
        setVideoLoading(false);
      });
      
      video.addEventListener('error', () => {
        console.error('❌ Error en el elemento video (nativo)');
        setVideoLoading(false);
      });
      
      video.play().catch(err => {
        console.warn('⚠️ Error al reproducir (nativo):', err);
        setVideoLoading(false);
      });
    } else if (Hls.isSupported()) {
      console.log('✅ Usando HLS.js');
      console.log('📡 Intentando cargar:', videoUrl);
      try {
        setVideoLoading(true);
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          debug: false, // Deshabilitar debug para producción
        });
        
        // Agregar TODOS los listeners ANTES de cargar el source
        hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
          console.log('✅ Manifest cargado');
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ Manifest parseado correctamente');
          setVideoLoading(false);
          // Intentar reproducir automáticamente
          video.play().catch(err => {
            if (err.name !== 'NotAllowedError') {
              console.warn('⚠️ Error al reproducir:', err.message);
    } else {
              console.log('ℹ️ Reproducción requiere interacción del usuario - click en play para iniciar');
            }
          });
        });
        
        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          console.log('✅ Nivel cargado');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          // Ignorar errores menores que son normales durante la reproducción
          const ignorarErrores = [
            'bufferStalledError',
            'bufferSeekOverHole',
            'bufferNudgeOnStall',
            'fragLoadingTimeOut',
            'fragParsingError',
            'levelSwitchError'
          ];
          
          // Solo procesar errores fatales o errores importantes que no estén en la lista de ignorar
          if (data.fatal) {
            console.error('❌ Error HLS FATAL:', {
              type: data.type,
              details: data.details,
              fatal: data.fatal,
              error: data.error,
              url: data.url,
              response: data.response,
              errorType: Hls.ErrorTypes[data.type]
            });
            
            // Mostrar error visible en la pantalla solo para errores fatales
            const errorDiv = document.createElement('div');
            errorDiv.className = 'absolute inset-0 bg-red-900/80 flex items-center justify-center z-50';
            errorDiv.innerHTML = `
              <div class="text-center text-white p-6">
                <p class="text-xl font-bold mb-2">Error al cargar el video</p>
                <p class="text-sm mb-4">${data.details || data.message || 'Error desconocido'}</p>
                <p class="text-xs opacity-75">URL: ${videoUrl}</p>
              </div>
            `;
            video.parentElement?.appendChild(errorDiv);
            
            // Intentar recuperar errores fatales
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                try {
                  console.log('🔄 Intentando recuperar error de red...');
                  hls.startLoad();
                } catch (err) {
                  console.error('❌ No se pudo recuperar, destruyendo HLS');
                  hls.destroy();
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                try {
                  console.log('🔄 Intentando recuperar error de media...');
                  hls.recoverMediaError();
                } catch (err) {
                  console.error('❌ No se pudo recuperar, destruyendo HLS');
                  hls.destroy();
                }
                break;
              default:
                console.error('❌ Error fatal no recuperable, destruyendo HLS');
                hls.destroy();
                break;
            }
          } else if (data.details && !ignorarErrores.includes(data.details)) {
            // Solo loggear errores no fatales que no estén en la lista de ignorar
            console.warn('⚠️ Error HLS (no fatal):', data.details);
          }
          // Si el error está en la lista de ignorar o no es fatal, no hacer nada
        });
        
        // Agregar listeners del elemento video
        video.addEventListener('loadeddata', () => {
          console.log('✅ Video cargado - datos listos');
          setVideoLoading(false);
        });
        
        video.addEventListener('canplay', () => {
          console.log('✅ Video puede reproducirse');
          setVideoLoading(false);
        });
        
        video.addEventListener('error', (e) => {
          console.error('❌ Error en el elemento video:', video.error);
          setVideoLoading(false);
        });
        
        // Escuchar cuando el video termine para mostrar el progreso
        video.addEventListener('ended', () => {
          console.log('🎬 Video de la lección terminado');
          setLessonVideoEnded(true);
          
          // Marcar la lección como completada en la base de datos
          if (effectivePurchase && currentLesson) {
            markLessonAsCompleted(currentLesson.id);
          }
        });
        
        // Cargar el source y adjuntar al video DESPUÉS de configurar todos los listeners
        console.log('📡 Cargando source de HLS:', videoUrl);
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
        console.log('✅ HLS configurado y source cargado');
      } catch (err) {
        console.error('❌ Error al inicializar HLS:', err);
        setVideoLoading(false);
      }
      } else {
      console.error('❌ HLS no está soportado en este navegador');
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
    if (autoStart && currentLesson && !showIntro && !showCourseImage && !lessonVideoEnded) {
      console.log('🚀 AutoStart detectado - esperando a que el video esté en el DOM');
      console.log('📊 Estado actual:', {
        autoStart,
        hasCurrentLesson: !!currentLesson,
        showIntro,
        showCourseImage,
        lessonVideoEnded,
        lessonTitle: currentLesson?.title
      });
      
      // Esperar a que el elemento de video esté disponible en el DOM
      let attempts = 0;
      const maxAttempts = 30; // Aumentar intentos a 30 (3 segundos)
      let timeoutId: NodeJS.Timeout;
      
      const checkAndInitialize = () => {
        attempts++;
        const videoElement = lessonVideoRef.current;
        if (videoElement) {
          console.log(`✅ Elemento de video encontrado (intento ${attempts}), inicializando...`);
          // Forzar un pequeño delay adicional para asegurar que el DOM esté completamente renderizado
          setTimeout(() => {
            initializeLessonVideo();
          }, 200);
        } else {
          if (attempts < maxAttempts) {
            console.log(`⏳ Esperando elemento de video... (intento ${attempts}/${maxAttempts})`);
            // Si el ref aún no está disponible, reintentar después de un breve delay
            timeoutId = setTimeout(checkAndInitialize, 100);
      } else {
            console.warn('⚠️ No se pudo encontrar el elemento de video después de varios intentos. El video se inicializará automáticamente cuando esté disponible.');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, currentLesson?.id, showIntro, showCourseImage, lessonVideoEnded]);

  // Efecto adicional: inicializar video cuando currentLesson cambia y no hay intro/image
  useEffect(() => {
    if (currentLesson && !showIntro && !showCourseImage && lessonVideoRef.current) {
      // Inicializar el video cuando se oculta el intro y la imagen del curso
      const timer = setTimeout(() => {
        console.log('🔄 Inicializando video - intro e imagen ocultos');
        initializeLessonVideo();
      }, 200);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id, showIntro, showCourseImage]);

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

  // Controlar cuándo mostrar el mensaje "No tienes cursos"
  // Solo mostrarlo después de un delay para evitar mostrarlo prematuramente
  useEffect(() => {
    if (!purchasesLoading && !effectivePurchase && purchases?.length === 0) {
      // Esperar un momento antes de mostrar el mensaje para asegurar que los datos se cargaron
      const timer = setTimeout(() => {
        setShowNoCourses(true);
      }, 1000); // Esperar 1 segundo antes de mostrar el mensaje
      return () => clearTimeout(timer);
    } else {
      setShowNoCourses(false);
    }
  }, [purchasesLoading, effectivePurchase, purchases]);

  // Mostrar loading único mientras se cargan TODOS los datos (compras, curso, lecciones)
  // Solo mostrar contenido cuando TODO esté listo
  const isLoading = purchasesLoading || 
                    loading || 
                    (!courseWithLessons && effectivePurchase) ||
                    (!effectivePurchase && !showNoCourses);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-300">Cargando tu curso...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar "No tienes cursos" si realmente no hay compras después de esperar
  if (!effectivePurchase && !purchasesLoading && showNoCourses) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No tienes cursos comprados</h1>
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header - Mismo estilo que dashboard */}
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
            <div className="flex items-center space-x-3">
              {/* Icono Home */}
              <button
                onClick={() => router.push('/dashboard')}
                className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center hover:bg-[#7dd30f] transition-colors"
                title="Ir al Dashboard"
              >
                <Home className="w-5 h-5 text-black" />
              </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-gray-700 dark:text-white hover:text-[#85ea10] transition-colors"
              >
                <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-black" />
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{userProfile?.name || session?.user?.name || 'Usuario'}</p>
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
                      <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal - Video Player (YouTube Style) */}
          <div className="lg:col-span-2 space-y-6">
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
                      console.error('❌ Error cargando video intro:', e);
                    }}
                    onLoadStart={() => {
                      console.log('🎬 Iniciando carga del teaser');
                    }}
                    onLoadedData={() => {
                      console.log('✅ Teaser cargado correctamente');
                    }}
                >
                  <source src="/roger-hero.mp4" type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                  
                {/* Botón "Iniciar Clase Ahora" - Esquina inferior derecha */}
                <div className="absolute bottom-6 right-6 z-10">
                    <button
                    onClick={handleStartLesson}
                    className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-5 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 text-sm transition-all duration-300 hover:scale-105"
                    >
                    <Play className="w-4 h-4" />
                    <span>Iniciar Clase Ahora</span>
                    </button>
                  </div>
                </div>
            )}

            {/* Imagen del Curso - Después del teaser */}
            {showCourseImage && courseWithLessons && (
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                {(() => {
                  // Intentar obtener la imagen del curso en este orden: image_url, preview_image, thumbnail_url
                  const courseImage = courseWithLessons.image_url || 
                                     courseWithLessons.preview_image || 
                                     courseWithLessons.thumbnail_url;
                  
                  console.log('🖼️ Mostrando imagen del curso:', {
                    showCourseImage,
                    hasCourse: !!courseWithLessons,
                    image_url: courseWithLessons.image_url,
                    preview_image: courseWithLessons.preview_image,
                    thumbnail_url: courseWithLessons.thumbnail_url,
                    selectedImage: courseImage
                  });
                  
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
                        console.error('❌ Error cargando imagen del curso:', courseImage);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">No hay imagen disponible</p>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Botón "Iniciar Clase Ahora" - Esquina inferior derecha */}
                <div className="absolute bottom-6 right-6 z-10">
                      <button
                    onClick={handleStartLesson}
                    className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold px-5 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 text-sm transition-all duration-300 hover:scale-105"
                      >
                    <Play className="w-4 h-4" />
                    <span>Iniciar Clase Ahora</span>
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
                      const playbackId = currentLesson.video_url || 
                                       currentLesson.playback_id || 
                                       currentLesson.mux_playback_id;
                      
                      if (!playbackId) {
                        return (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 z-50">
                            <div className="text-center text-white p-6">
                              <p className="text-xl font-bold mb-2">⚠️ No hay video disponible</p>
                              <p className="text-sm mb-4">Esta clase no tiene un playback_id configurado</p>
                              <p className="text-xs opacity-75 mt-4">
                                Campos disponibles: {Object.keys(currentLesson).join(', ')}
                      </p>
                  </div>
                </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Indicador de carga */}
                    {videoLoading && (currentLesson.video_url || currentLesson.playback_id || currentLesson.mux_playback_id) ? (
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
                        completedLessons={completedLessonsList.length > 0 ? completedLessonsList : (effectivePurchase?.completed_lessons || [])}
                        lessonVideoEnded={lessonVideoEnded}
                        courseWithLessons={courseWithLessons}
                      />
                  </div>
                  )
              )}
                </div>
            )}

            {/* Nombre y Descripción de la Clase - Siempre visible cuando hay una clase */}
            {currentLesson && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentLesson.title}
                </h1>
                {currentLesson.description ? (
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {currentLesson.description}
                  </p>
                ) : (
                  <p className="text-lg text-gray-500 dark:text-gray-400 italic">
                    No hay descripción disponible para esta clase.
                  </p>
                )}
                {currentLesson.duration_minutes && (
                  <div className="flex items-center space-x-2 mt-4 text-gray-600 dark:text-gray-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{currentLesson.duration_minutes} minutos</span>
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
              {courseWithLessons && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {courseWithLessons.title}
                  </p>

                <div className="space-y-3">
                    {courseWithLessons?.lessons?.map((lesson: any, index: number) => {
                      const lessonStatus = getLessonStatus(lesson, index);
                      const StatusIcon = lessonStatus.icon;
                      // Solo la clase disponible actual debe estar resaltada
                      const isCurrent = currentLesson?.id === lesson.id && lessonStatus.status === 'available';
                      
                      // Determinar si es la próxima clase (la siguiente después de la actual disponible o completada)
                      const currentAvailableIndex = courseWithLessons.lessons.findIndex((l: any, idx: number) => {
                        const status = getLessonStatus(l, idx);
                        return status.status === 'available';
                      });
                      const isNextClass = index === currentAvailableIndex + 1 && lessonStatus.status === 'locked';

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
                          className={`p-3 rounded-xl transition-all relative ${
                            lessonStatus.status === 'completed'
                              ? 'bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-600'
                              : isCurrent
                              ? 'bg-[#85ea10]/5 border border-[#85ea10]/30 cursor-pointer hover:bg-[#85ea10]/10'
                              : lessonStatus.status === 'available'
                              ? 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer'
                              : 'bg-white/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/30 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* Check visible para clases completadas - ultra sutil */}
                          {lessonStatus.status === 'completed' && (
                            <div className="absolute top-2 right-2 z-10">
                              <CheckCircle className="w-4 h-4 text-green-500/70" strokeWidth={2} fill="none" />
                          </div>
                          )}
                          
                          {/* Badge "Mañana disponible" para la próxima clase */}
                          {isNextClass && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400/95 to-orange-400/95 backdrop-blur-sm rounded-full px-2 py-1 z-10 shadow-sm border border-amber-300/30 flex items-center space-x-1">
                              <Sunrise className="w-3 h-3 text-white" strokeWidth={2.5} />
                              <span className="text-xs font-medium text-white">Mañana</span>
                          </div>
                          )}
                          
                          <div className="flex items-start space-x-3">
                            {/* Thumbnail */}
                            <div className="relative w-32 h-20 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                              {lesson.preview_image || lesson.thumbnail ? (
                                <Image
                                  src={lesson.preview_image || lesson.thumbnail}
                                  alt={lesson.title}
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                                  loading="lazy"
                                  quality={75}
                                  style={{
                                    filter: lessonStatus.status === 'completed'
                                      ? 'grayscale(20%) brightness(97%) contrast(99%) saturate(90%) opacity(0.85)'
                                      : lessonStatus.status === 'locked'
                                      ? 'grayscale(100%) brightness(105%) contrast(110%)'
                                      : isNextClass
                                      ? 'sepia(25%) brightness(105%) contrast(100%) saturate(130%) hue-rotate(5deg)'
                                      : 'none'
                                  }}
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
                              {lessonStatus.status === 'completed' && (
                                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500" strokeWidth={2.5} fill="none" />
                    </div>
                </div>
                              )}
            </div>

                            {/* Info */}
                        <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5 mb-1.5">
                                {lessonStatus.status === 'completed' ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500/60" strokeWidth={2} fill="none" />
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
                                  {lessonStatus.status === 'completed' ? 'Completada' : lessonStatus.text}
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
                    })}
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
