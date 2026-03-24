'use client';

import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Heart,
  Info,
  Play,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  Utensils,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ComplementSection from '@/components/ComplementSection';
import CourseHeroCard from '@/components/CourseHeroCard';
import CourseLoadingSkeleton from '@/components/CourseLoadingSkeleton';
import DashboardNavbar from '@/components/DashboardNavbar';
import Footer from '@/components/Footer';
import GoalSuggestionCard from '@/components/GoalSuggestionCard';
import InsightsSection from '@/components/InsightsSection';
import NewsModal from '@/components/modalNews';
import NutritionalBlogs from '@/components/NutritionalBlogs';
import ProgressCard from '@/components/ProgressCard';
import QuickLoading from '@/components/QuickLoading';
import ReadMoreText from '@/components/ReadMoreText';
import StoriesSection from '@/components/StoriesSection';
import WeeklyWeightReminder from '@/components/WeeklyWeightReminder';
import { useIsAdmin } from '@/hooks/auth/useIsAdmin';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { trackCourseView } from '@/lib/analytics';
import {
  type GoalSuggestion,
  generateGoalSuggestion,
} from '@/lib/goalSuggestion';
import { supabase } from '@/lib/supabase-browser';
import { ShareCourseToFeedButton } from '@/shared/components/ShareCourseToFeedButton';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  height: number;
  weight: number;
  gender: string;
  goals: string[];
  target_weight: number | null;
  goal_deadline: string | null;
  membership_status: string;
  current_weight?: number | null;
  weight_progress_percentage?: number | null;
  last_weight_update?: string | null;
  streak_days?: number | null;
  last_class_date?: string | null;
}

interface Course {
  id: string;
  title: string;
  short_description: string;
  description: string;
  preview_image: string | null;
  price: number;
  discount_percentage: number;
  category: string;
  duration_days: number;
  students_count: number;
  rating: number;
  calories_burned: number;
  level: string;
  is_published: boolean;
  created_at: string;
  // Campos adicionales para la UI
  instructor?: string;
  lessons?: number;
  isRecommended?: boolean;
  thumbnail?: string;
  duration?: string;
  students?: number;
}

export default function DashboardPage() {
  const {
    user,
    profile: authProfile,
    loading: authLoading,
    signOut: handleSignOut,
  } = useSupabaseAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiNotifications, setApiNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
      post_id: string | null;
      read_at: string | null;
    }>
  >([]);
  const isAdmin = useIsAdmin();
  // const isAdmin = useMemo(() => {
  //   if (!user) return false;
  //   const envId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  //   const envEmail =
  //     process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com'; // fallback seguro
  //   const matchId = envId && user.id === envId;
  //   const matchEmail = envEmail && user.email === envEmail;
  //   const matchRole = user.user_metadata?.role === 'admin';
  //   return Boolean(matchId || matchEmail || matchRole);
  // }, [user]);
  // Verificar si es viernes para notificación de peso
  const isFriday = new Date().getDay() === 5;

  // Cargar notificaciones del servidor (feed bienvenida, etc.)
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => setApiNotifications(data.notifications ?? []))
      .catch(() => setApiNotifications([]));
  }, [user?.id]);

  // Notificaciones activas: peso (viernes) + notificaciones del feed (solo no leídas)
  const notifications = useMemo(() => {
    const notifs: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      action: () => void;
      actionText: string;
    }> = [];

    // Notificación de peso los viernes
    if (isFriday) {
      notifs.push({
        id: 'weight-friday',
        type: 'weight',
        title: '¡Es viernes!',
        message: 'Registra tu peso para ver tu progreso semanal',
        action: () => setShowWeeklyWeightReminder(true),
        actionText: 'Registrar peso',
      });
    }

    // Notificaciones del feed (bienvenida, etc.): solo no leídas
    const unread = apiNotifications.filter((n) => !n.read_at);
    unread.forEach((n) => {
      const link = n.link || '/feed';
      notifs.push({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        action: () => {
          fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id }),
          }).then(() => {
            setApiNotifications((prev) =>
              prev.map((x) =>
                x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
              ),
            );
          });
          router.push(link);
        },
        actionText: 'Ver en el feed',
      });
    });

    return notifs;
  }, [isFriday, apiNotifications, router]);

  // Usar el hook simple para cursos
  const {
    courses: realCourses,
    loading: loadingCourses,
    error: coursesError,
    refresh: refreshCourses,
  } = useUnifiedCourses();

  const BANNER_PLACEHOLDER = '/images/banner.jpeg';

  // Hook para compras del usuario
  const {
    purchases,
    loading: loadingPurchases,
    hasActivePurchases,
  } = useUserPurchases();

  // Funciones de precios
  const calculateFinalPrice = (course: any) => {
    const price = course.price || 0;
    const discount = course.discount_percentage || 0;
    // Si hay descuento, price es el original y debemos calcular el final
    if (discount > 0) {
      return Math.round(price * (1 - discount / 100));
    }
    return price;
  };

  const calculateOriginalPrice = (course: any) => {
    // El precio en la BD es el original (sin descuento)
    return course.price || 0;
  };

  // Mapeo de categorías a nombres legibles
  const categoryNames: { [key: string]: string } = {
    lose_weight: 'Bajar de Peso',
    gain_muscle: 'Ganar Músculo',
    tone: 'Tonificar',
    flexibility: 'Flexibilidad',
    cardio: 'Cardio',
    strength: 'Fuerza',
    wellness: 'Bienestar',
    nutrition: 'Nutrición',
  };

  const getCategoryDisplayName = (course: any) => {
    const categoryCode = (course.category_name || course.category || '').trim();
    if (!categoryCode) return 'General';
    // Siempre mapear el código a nombre legible; si no está en el mapa, usar el valor tal cual
    return categoryNames[categoryCode] ?? categoryCode;
  };

  const getDurationDisplay = (course: any) => {
    if (course.duration?.trim()) return course.duration;
    const n = course.lessons_count ?? 0;
    if (n === 0) return '—';
    if (n === 1) return '1 día';
    if (n <= 7) return `${n} días`;
    const weeks = Math.ceil(n / 7);
    return weeks === 1 ? '1 semana' : `${weeks} semanas`;
  };

  /** Cursos disponibles: más recientes primero (carrusel en móvil + grid en sm+) */
  const availableCoursesOrdered = useMemo(() => {
    if (!realCourses?.length) return [];
    return [...realCourses].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }, [realCourses]);

  // Cursos recomendados y filtrados memoizados para evitar re-renders y miles de peticiones
  const recommendedCourses = useMemo(
    () =>
      realCourses
        ?.filter((course) => (course.rating ?? 0) >= 4.5)
        .slice(0, 3) || [],
    [realCourses],
  );
  const recommendedIds = useMemo(
    () => new Set(recommendedCourses.map((c) => c.id)),
    [recommendedCourses],
  );

  const filteredCourses = useMemo(
    () =>
      realCourses?.filter((course) => {
        const matchesCategory =
          selectedCategory === 'all' ||
          course.category_name === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.short_description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        const notRecommended = !recommendedIds.has(course.id);
        return matchesCategory && matchesSearch && notRecommended;
      }) || [],
    [realCourses, selectedCategory, searchQuery, recommendedIds],
  );

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    targetWeight: '',
    goalType: 'lose', // 'lose', 'maintain', 'gain'
    deadline: '',
  });
  const [goalError, setGoalError] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);

  // Estados para blogs nutricionales
  const [nutritionalBlogs, setNutritionalBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Estados para la sugerencia de meta
  const [goalSuggestion, setGoalSuggestion] = useState<GoalSuggestion | null>(
    null,
  );
  const [showGoalSuggestion, setShowGoalSuggestion] = useState(false);
  const [isAcceptingGoal, setIsAcceptingGoal] = useState(false);
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [isCustomizingGoal, setIsCustomizingGoal] = useState(false);
  const [showWeeklyWeightReminder, setShowWeeklyWeightReminder] =
    useState(false);

  // Estados para cursos comprados
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [loadingPurchasedCourses, setLoadingPurchasedCourses] = useState(false);
  const [purchasedCourseLessons, setPurchasedCourseLessons] = useState<any[]>(
    [],
  );

  // Función para simular cursos comprados (en producción vendría de la base de datos)
  const loadPurchasedCourses = async () => {
    setLoadingPurchasedCourses(true);
    try {
      // Usar el primer curso real de la base de datos como curso comprado
      const realCourse = realCourses[0];
      const mockPurchasedCourses = [
        {
          id: realCourse?.id || '1',
          title: realCourse?.title || 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!',
          description:
            realCourse?.description ||
            'Rutina intensa de 40 minutos para quemar grasa y bajar de peso. Este programa te ayudará a mejorar tu resistencia cardiovascular y a definir tu cuerpo.',
          preview_image:
            realCourse?.preview_image || '/images/course-placeholder.jpg',
          completed_lessons: 0, // Cambiado a 0 para mostrar progreso inicial
          total_lessons: 12,
          duration_days: 30,
          level: 'Intermedio',
          estimated_calories_per_lesson: 150, // Calorías estimadas por lección
          purchased_at: new Date().toISOString(),
          start_date: new Date().toISOString().split('T')[0], // Hoy
        },
      ];

      // Obtener lecciones reales de la base de datos
      let realLessons = [];
      if (realCourse?.id) {
        try {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('course_lessons')
            .select('*')
            .eq('course_id', realCourse.id)
            .order('lesson_order', { ascending: true });

          if (lessonsError) {
          } else {
            realLessons = lessonsData || [];
          }
        } catch (error) {}
      }

      // Si no hay lecciones en la DB, usar datos de ejemplo como fallback
      const mockLessons =
        realLessons.length > 0
          ? realLessons
          : [
              {
                id: 'lesson-1',
                course_id: realCourse?.id || '1',
                title: 'Introducción y Calentamiento',
                description: 'Prepara tu cuerpo para la rutina',
                video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                preview_image:
                  realCourse?.preview_image || '/images/course-placeholder.jpg',
                lesson_number: 1,
                lesson_order: 1,
                duration_minutes: 15,
                is_preview: true,
                views_count: 120,
                created_at: new Date().toISOString(),
              },
              {
                id: 'lesson-2',
                course_id: realCourse?.id || '1',
                title: 'Rutina HIIT: Piernas y Glúteos',
                description: 'Entrenamiento intenso para tren inferior',
                video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                preview_image:
                  realCourse?.preview_image || '/images/course-placeholder.jpg',
                lesson_number: 2,
                lesson_order: 2,
                duration_minutes: 30,
                is_preview: false,
                views_count: 80,
                created_at: new Date().toISOString(),
              },
              {
                id: 'lesson-3',
                course_id: realCourse?.id || '1',
                title: 'Rutina HIIT: Brazos y Abdomen',
                description: 'Fortalece tu tren superior y core',
                video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                preview_image:
                  realCourse?.preview_image || '/images/course-placeholder.jpg',
                lesson_number: 3,
                lesson_order: 3,
                duration_minutes: 25,
                is_preview: false,
                views_count: 60,
                created_at: new Date().toISOString(),
              },
              {
                id: 'lesson-4',
                course_id: realCourse?.id || '1',
                title: 'Rutina HIIT Intensiva - Día 4',
                description:
                  'Ejercicios de alta intensidad para maximizar la quema de grasa',
                video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                preview_image:
                  realCourse?.preview_image || '/images/course-placeholder.jpg',
                lesson_number: 4,
                lesson_order: 4,
                duration_minutes: 40,
                is_preview: false,
                views_count: 40,
                created_at: new Date().toISOString(),
              },
              {
                id: 'lesson-5',
                course_id: realCourse?.id || '1',
                title: 'Cardio Quema Grasa - Día 5',
                description: 'Sesión de cardio para acelerar el metabolismo',
                video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                preview_image:
                  realCourse?.preview_image || '/images/course-placeholder.jpg',
                lesson_number: 5,
                lesson_order: 5,
                duration_minutes: 35,
                is_preview: false,
                views_count: 0,
                created_at: new Date().toISOString(),
              },
            ];

      setPurchasedCourses(mockPurchasedCourses);
      setPurchasedCourseLessons(mockLessons);

      // Determinar la próxima lección basada en el progreso del usuario
      const completedLessons = mockPurchasedCourses[0]?.completed_lessons || 0;

      // La próxima lección es la siguiente después de las completadas
      const nextAvailableLesson = mockLessons.find(
        (lesson) => lesson.lesson_order === completedLessons + 1,
      );

      // Si no hay próxima lección, usar la primera
      setNextLesson(nextAvailableLesson || mockLessons[0]);
    } catch (error) {
    } finally {
      setLoadingPurchasedCourses(false);
    }
  };

  // Función para obtener el curso recomendado basado en el perfil del usuario
  const getRecommendedCourse = (profile: any) => {
    if (!profile) return 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!';

    const currentBMI = profile.weight / (profile.height / 100) ** 2;

    if (currentBMI >= 30) {
      return 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!';
    } else if (currentBMI >= 25) {
      return 'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    } else if (profile.goals?.includes('strength')) {
      return 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    } else {
      return 'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!';
    }
  };

  // Función para obtener la duración estimada basada en el perfil
  const getEstimatedDuration = (profile: any) => {
    if (!profile) return '12 semanas';

    const currentBMI = profile.weight / (profile.height / 100) ** 2;

    if (currentBMI >= 30) {
      return '24 semanas';
    } else if (currentBMI >= 25) {
      return '16 semanas';
    } else {
      return '12 semanas';
    }
  };

  // Cargar cursos comprados - SOLO cuando el usuario realmente compre un curso
  // useEffect(() => {
  //   loadPurchasedCourses();
  // }, []);

  // Verificar recordatorio de peso solo cuando el perfil está cargado
  useEffect(() => {
    if (authLoading || !userProfile) return;

    const today = new Date();
    const isFriday = today.getDay() === 5; // 5 = viernes
    const lastWeightReminder = localStorage.getItem('lastWeightReminder');
    const todayString = today.toDateString();

    // Usar la última fecha de peso registrada; si no existe, evitar mostrar de inmediato post-onboarding
    const lastUpdateStr = userProfile.last_weight_update;
    const lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : null;
    const daysSinceUpdate = lastUpdate
      ? (today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Mostrar recordatorio solo si es viernes, no se mostró hoy, y han pasado al menos 6 días desde el último registro
    if (
      isFriday &&
      lastWeightReminder !== todayString &&
      daysSinceUpdate >= 6
    ) {
      setShowWeeklyWeightReminder(true);
    }
  }, [authLoading, userProfile]);

  // Función para cargar blogs nutricionales
  const fetchNutritionalBlogs = async () => {
    try {
      const response = await fetch('/api/blogs');
      const data = await response.json();
      setNutritionalBlogs(data.blogs || []);
    } catch (error) {
      setNutritionalBlogs([]);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Cargar blogs nutricionales
  useEffect(() => {
    fetchNutritionalBlogs();
  }, []);

  // Obtener datos del perfil desde Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // Si no hay perfil, redirigir al onboarding
          if (!data) {
            router.push('/onboarding');
            return;
          }

          // Verificar que height y weight sean números válidos
          const hasValidHeight =
            typeof data.height === 'number' && data.height > 0;
          const hasValidWeight =
            typeof data.weight === 'number' && data.weight > 0;

          if (!hasValidHeight || !hasValidWeight) {
            router.push('/onboarding');
            return;
          }

          if (error) {
            setLoading(false);
            return;
          }

          setUserProfile(data);

          // Generar sugerencia de meta si no tiene target_weight establecido
          // TEMPORAL: Forzar mostrar sugerencia para testing (comentar en producción)
          const shouldShowSuggestion = true; // Siempre mostrar para testing

          if (shouldShowSuggestion) {
            const suggestion = generateGoalSuggestion({
              name: data.name,
              height: data.height,
              weight: data.weight,
              gender: data.gender,
              goals: data.goals || [],
              birthYear: data.birth_year,
              dietaryHabits: data.dietary_habits,
            });
            setGoalSuggestion(suggestion);
            setShowGoalSuggestion(true);
          }

          setLoading(false);
        } catch (error) {
          setLoading(false);
        }
      }
    };

    if (!authLoading && user) {
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, router]);

  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', icon: '🎯', color: '#85ea10' },
  ]);

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

        // Agregar "Todos" al inicio
        setCategories([
          { id: 'all', name: 'Todos', icon: '🎯', color: '#85ea10' },
          ...(data || []).map((cat) => ({
            id: cat.name, // Usar el nombre como ID para el filtrado
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          })),
        ]);
      } catch (error) {
        // No mostrar error, simplemente mantener las categorías por defecto
      }
    };

    fetchCategories();
  }, []);

  // La lógica de carga de cursos ahora está en el hook useCoursesCache

  // Los cursos ahora vienen del hook useCoursesCache
  /*
  const sampleCourses: Course[] = [
    // Cursos de muestra comentados - ahora usamos datos reales
  ];
  */

  // Función para calcular IMC y dar recomendaciones
  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMIRecommendation = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        category: 'Bajo peso',
        message:
          'Tu peso está por debajo del rango saludable. Te recomendamos ganar peso de forma saludable.',
        recommendation: 'Ganar peso',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        category: 'Peso normal',
        message:
          '¡Excelente! Tu peso está en el rango saludable. Mantén tu estilo de vida saludable.',
        recommendation: 'Mantener peso',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    } else if (bmi >= 25 && bmi < 30) {
      return {
        category: 'Sobrepeso',
        message:
          'Tienes sobrepeso. Te recomendamos bajar entre 5-10 kg para alcanzar un peso más saludable.',
        recommendation: 'Bajar peso',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      };
    } else {
      return {
        category: 'Obesidad',
        message:
          'Tienes obesidad. Te recomendamos bajar entre 10-20 kg para mejorar tu salud significativamente.',
        recommendation: 'Bajar peso',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }
  };

  // Función para aceptar la meta sugerida
  const handleAcceptGoalSuggestion = async (suggestion: GoalSuggestion) => {
    setIsAcceptingGoal(true);
    setGoalError('');

    try {
      if (!userProfile?.id) {
        throw new Error('No se encontró el ID del usuario');
      }

      // Actualizar el perfil con la meta sugerida
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_weight: suggestion.targetWeight,
          goal_deadline: suggestion.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)
        .select();

      if (error) {
        throw new Error(
          `Error al establecer la meta: ${error.message || 'Error desconocido'}`,
        );
      }

      // Actualizar el perfil local
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              target_weight: suggestion.targetWeight,
              goal_deadline: suggestion.deadline,
            }
          : null,
      );

      // Ocultar la sugerencia
      setShowGoalSuggestion(false);
      setGoalSuggestion(null);

      // Mostrar el card de progreso
      setShowProgressCard(true);

      // Resetear estado de personalización
      setIsCustomizingGoal(false);
    } catch (error: any) {
      setGoalError(
        error.message || 'Error al establecer la meta. Inténtalo de nuevo.',
      );
    } finally {
      setIsAcceptingGoal(false);
    }
  };

  // Función para personalizar la meta sugerida
  const handleCustomizeGoalSuggestion = () => {
    // Pre-llenar el modal con la sugerencia
    if (goalSuggestion) {
      setGoalData({
        targetWeight: goalSuggestion.targetWeight.toString(),
        goalType: 'lose', // Por defecto, el usuario puede cambiar
        deadline: goalSuggestion.deadline,
      });
    }
    setShowGoalSuggestion(false);
    setIsCustomizingGoal(true); // Marcar que estamos personalizando
    setShowGoalModal(true);
  };

  // Función para rechazar la meta sugerida
  const handleDismissGoalSuggestion = () => {
    setShowGoalSuggestion(false);
    setGoalSuggestion(null);
  };

  // Función para cancelar la personalización de meta
  const handleCancelGoalCustomization = () => {
    setIsCustomizingGoal(false);
    setShowGoalModal(false);
    setGoalSuggestion(null);
    // Volver a mostrar la sugerencia si no hay meta establecida
    if (!userProfile?.target_weight) {
      setShowGoalSuggestion(true);
    }
  };

  // Función para manejar el cierre del recordatorio de peso
  const handleCloseWeightReminder = () => {
    setShowWeeklyWeightReminder(false);
    // Marcar que se mostró hoy
    localStorage.setItem('lastWeightReminder', new Date().toDateString());
  };

  // Función para manejar el envío del peso
  const handleWeightSubmit = async (weight: number) => {
    try {
      if (!user?.id) return;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Guardar registro de peso en weight_records
      const { error: weightRecordError } = await supabase
        .from('weight_records')
        .upsert(
          {
            user_id: user.id,
            weight: weight,
            record_date: today,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,record_date',
          },
        );

      if (weightRecordError) {
      }

      // Actualizar también el peso actual en el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_weight: weight,
          last_weight_update: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
      }

      // Actualizar el perfil local
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          current_weight: weight,
          last_weight_update: today,
        });
      }
    } catch (error) {}
  };

  const handleGoalSubmit = async () => {
    if (!goalData.targetWeight || !goalData.deadline) {
      setGoalError('Por favor completa todos los campos');
      return;
    }

    setGoalLoading(true);
    setGoalError('');

    try {
      // Verificar que tenemos el ID del usuario
      if (!userProfile?.id) {
        throw new Error('No se encontró el ID del usuario');
      }

      // Primero verificar si el perfil existe
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, target_weight, goal_deadline')
        .eq('id', userProfile.id)
        .single();

      if (fetchError) {
        throw new Error('No se pudo obtener el perfil del usuario');
      }

      // Actualizar solo los campos de meta
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_weight: parseInt(goalData.targetWeight),
          goal_deadline: goalData.deadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)
        .select();

      if (error) {
        throw new Error(
          `Error al actualizar la meta: ${error.message || 'Error desconocido'}`,
        );
      }

      // Actualizar el perfil local
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              target_weight: parseInt(goalData.targetWeight),
              goal_deadline: goalData.deadline,
            }
          : null,
      );

      setShowGoalModal(false);
      setGoalData({ targetWeight: '', goalType: 'lose', deadline: '' });

      // Recargar la página para reflejar los cambios
      window.location.reload();
    } catch (error: any) {
      setGoalError(
        error.message || 'Error al actualizar la meta. Inténtalo de nuevo.',
      );
    } finally {
      setGoalLoading(false);
    }
  };

  if (authLoading || loading) {
    return <QuickLoading message="Cargando tu dashboard..." duration={2000} />;
  }

  if (!user) {
    return null;
  }

  // Si el usuario tiene cursos comprados, mostrar el flujo de progreso

  if (!userProfile) {
    return <QuickLoading message="Cargando tu perfil..." duration={1500} />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <DashboardNavbar notifications={notifications} />

        {/* Main Content - Layout optimizado sin scroll */}
        <main className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 pb-20 relative">
          {/* CURSOS COMPRADOS - Banner de ancho completo */}
          {hasActivePurchases && purchases.length > 0 && (
            <div className="mb-3 sm:mb-4 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8">
              <div className="px-3 sm:px-4 md:px-6 lg:px-8 mb-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#85ea10]" />
                  Mi Curso
                </h2>
              </div>
              <div className="space-y-4">
                {(() => {
                  // Encontrar el purchase con clase disponible, o el más reciente
                  const purchaseWithClass = purchases.find((p) => {
                    if (!p.start_date) return false;
                    const startDate = new Date(p.start_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    startDate.setHours(0, 0, 0, 0);
                    const daysDiff = Math.floor(
                      (today.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return daysDiff >= 0;
                  });

                  // Si no hay clase disponible, usar el primero
                  const purchase = purchaseWithClass || purchases[0];

                  if (!purchase) return null;

                  // Debug: Verificar datos del purchase
                  // Verificar si el curso está 100% completado
                  const lessons = purchase.course?.lessons ?? [];
                  const completedIds = purchase.completed_lessons ?? [];
                  const isCourseFullyCompleted =
                    lessons.length > 0 &&
                    lessons.every((l: { id: string }) =>
                      completedIds.includes(l.id),
                    );
                  const completionDate = (purchase as any).course_completed_at
                    ? new Date((purchase as any).course_completed_at)
                    : null;
                  const today = new Date();
                  const isCompletionDayToday =
                    completionDate &&
                    completionDate.getFullYear() === today.getFullYear() &&
                    completionDate.getMonth() === today.getMonth() &&
                    completionDate.getDate() === today.getDate();

                  // Verificar si hay clase disponible hoy
                  const hasAvailableClass = (() => {
                    if (!purchase.start_date || isCourseFullyCompleted)
                      return false;
                    const startDate = new Date(purchase.start_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    startDate.setHours(0, 0, 0, 0);
                    const daysDiff = Math.floor(
                      (today.getTime() - startDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return daysDiff >= 0; // Si ya pasó el día de inicio, hay clase disponible
                  })();

                  // Calcular tiempo restante hasta las 12:00 AM
                  const getTimeUntilMidnight = () => {
                    const now = new Date();
                    const midnight = new Date();
                    midnight.setHours(24, 0, 0, 0);
                    const diff = midnight.getTime() - now.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor(
                      (diff % (1000 * 60 * 60)) / (1000 * 60),
                    );
                    return { hours, minutes };
                  };

                  const timeLeft = getTimeUntilMidnight();

                  // Determinar la URL de la imagen
                  const getImageUrl = () => {
                    // Siempre usar la imagen fija del banner proporcionada en public/
                    return BANNER_PLACEHOLDER;
                  };

                  const imageUrl = getImageUrl();
                  return (
                    <div
                      key={purchase.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mx-4 sm:mx-6 lg:mx-8"
                    >
                      {isCourseFullyCompleted && isCompletionDayToday ? (
                        /* Curso finalizado - estilo limpio, sin bloques verdes */
                        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600">
                          <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div>
                                <div className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wide mb-0.5">
                                  Curso finalizado
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                  {purchase.course?.title || 'Curso'}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  Has completado todas las clases. ¡Felicidades!
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/course/${(purchase.course as any)?.slug || purchase.course_id}`,
                                  );
                                }}
                                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl border border-gray-600 shadow-sm transition-all text-xs w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                Comprar de nuevo
                              </button>
                              <ShareCourseToFeedButton
                                courseTitle={purchase.course?.title}
                                courseImageUrl={purchase.course?.preview_image}
                                onSuccess={(postId) =>
                                  router.push(`/feed#post-${postId}`)
                                }
                                variant="primary"
                                size="sm"
                                className="w-full sm:w-auto"
                              />
                            </div>
                          </div>
                        </div>
                      ) : hasAvailableClass ? (
                        /* Banner limpio: fondo oscuro, solo punto verde de marca como acento */
                        <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/80 rounded-full px-2.5 py-1 sm:px-3 sm:py-1 border border-gray-200 dark:border-gray-600">
                                  <div className="w-2 h-2 bg-[#85ea10] rounded-full animate-pulse shrink-0" />
                                  <span className="text-gray-800 dark:text-white text-xs font-bold uppercase tracking-wide">
                                    Nueva Clase Disponible
                                  </span>
                                </div>
                                {timeLeft.hours > 0 && (
                                  <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/80 rounded-full px-2.5 py-1 sm:px-3 sm:py-1 border border-gray-200 dark:border-gray-600">
                                    <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-200 text-xs font-semibold">
                                      {timeLeft.hours}h {timeLeft.minutes}m
                                      restantes
                                    </span>
                                  </div>
                                )}
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 uppercase tracking-tight">
                                {purchase.course?.title || 'Nueva Clase'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                {purchase.course?.short_description ||
                                  purchase.course?.description ||
                                  '¡No te pierdas esta increíble clase!'}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                {(() => {
                                  const lessons = purchase.course?.lessons;
                                  const totalClases = Array.isArray(lessons)
                                    ? lessons.length
                                    : 0;
                                  const days = purchase.course?.duration_days;
                                  const label =
                                    totalClases > 0
                                      ? `${totalClases} clases`
                                      : days
                                        ? `${days} días`
                                        : null;
                                  return label ? (
                                    <span className="inline-flex items-center gap-1.5 shrink-0">
                                      <CalendarDays
                                        className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0"
                                        aria-hidden
                                      />
                                      {label}
                                    </span>
                                  ) : null;
                                })()}
                                <span className="inline-flex items-center gap-1.5 shrink-0">
                                  <Clock
                                    className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0"
                                    aria-hidden
                                  />
                                  Disponible hasta las 12:00 AM
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/student?courseId=${encodeURIComponent(purchase.course_id)}&autoStart=true`,
                                );
                              }}
                              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-xl border border-gray-600 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap text-sm shrink-0"
                            >
                              <Play className="w-4 h-4" fill="currentColor" />
                              <span>Tomar Clase Ahora</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Banner sin clase disponible - compacto (o curso ya finalizado hace días) */
                        <div className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="relative z-10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                {purchase.course?.title || 'Curso'}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {isCourseFullyCompleted
                                  ? 'Curso finalizado'
                                  : 'Tu curso está en progreso'}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCourseFullyCompleted) {
                                  router.push(
                                    `/course/${(purchase.course as any)?.slug || purchase.course_id}`,
                                  );
                                } else {
                                  router.push(
                                    `/student?courseId=${encodeURIComponent(purchase.course_id)}`,
                                  );
                                }
                              }}
                              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl border border-gray-600 shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 text-xs shrink-0 w-full sm:w-auto"
                            >
                              {isCourseFullyCompleted ? (
                                <>
                                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Comprar de nuevo</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Continuar Curso</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Layout Principal: 2 columnas + sección inferior compacta */}
          <div className="flex flex-col min-h-0">
            {/* Layout de 2 columnas: Complementos e Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0 mb-4 sm:mb-6">
              {/* COLUMNA 1: COMPLEMENTOS (STORIES) */}
              <div
                className="lg:col-span-1 flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
                data-section="complementos"
                id="complementos"
              >
                <StoriesSection
                  courseStartDate={
                    purchases.find((p: any) => p.start_date)?.start_date || null
                  }
                />
              </div>

              {/* COLUMNA 2: INSIGHTS */}
              <div className="lg:col-span-1 flex flex-col min-h-0">
                {(() => {
                  // Obtener el purchase principal (con clase disponible o el más reciente)
                  const effectivePurchase =
                    purchases.find((p: any) => p.start_date) || purchases[0];
                  const courseWithLessons = effectivePurchase?.course
                    ? {
                        ...effectivePurchase.course,
                        lessons: effectivePurchase.course.lessons || [],
                      }
                    : null;

                  return (
                    <InsightsSection
                      userProfile={userProfile}
                      completedLessons={purchases.flatMap(
                        (p: any) => p.completed_lessons || [],
                      )}
                      courseWithLessons={courseWithLessons}
                      effectivePurchase={effectivePurchase}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Cursos disponibles: carrusel horizontal en móvil; grid max 3 columnas desde sm */}
          {availableCoursesOrdered.length > 0 && (
            <div className="mt-4 sm:mt-6 mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#85ea10]" />
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Cursos Disponibles
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Transforma tu cuerpo con nuestros programas especializados
                  </p>
                </div>
              </div>

              {availableCoursesOrdered.length > 1 && (
                <p className="sm:hidden text-[11px] text-gray-500 dark:text-gray-400 mb-2 -mt-1 flex items-center gap-1">
                  <span>Desliza para ver los demás cursos</span>
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 text-[#85ea10]"
                    aria-hidden
                  />
                </p>
              )}

              {/* Móvil: fila con scroll + snap; sm+: grid máx. 3 columnas */}
              <div
                className="flex w-full gap-3 sm:gap-4 overflow-x-auto overflow-y-visible sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible snap-x snap-mandatory sm:snap-none scrollbar-hide touch-pan-x pb-1 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 overscroll-x-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {availableCoursesOrdered.map((course) => (
                  <div
                    key={course.id}
                    className="min-w-0 w-[min(88vw,22rem)] shrink-0 snap-start sm:w-full sm:min-w-0"
                  >
                    <div
                      onClick={() => {
                        router.push(`/course/${course.slug || course.id}`);
                      }}
                      className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 rounded-2xl cursor-pointer w-full overflow-hidden"
                    >
                          {/* IMAGEN - Arriba, 16:9, imagen completa sin recortar */}
                          <div className="w-full relative aspect-video overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                            <img
                              src={
                                course.thumbnail ||
                                course.preview_image ||
                                '/images/course-placeholder.jpg'
                              }
                              alt={course.title}
                              className="w-full h-full object-contain rounded-t-2xl"
                              style={{
                                objectPosition: 'center center',
                                display: 'block',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (
                                  !target.src?.endsWith(
                                    'course-placeholder.jpg',
                                  )
                                ) {
                                  target.src = '/images/course-placeholder.jpg';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 z-10 pointer-events-none">
                              <Play
                                className="w-14 h-14 sm:w-16 sm:h-16 text-white drop-shadow-lg"
                                fill="currentColor"
                              />
                            </div>
                            <div className="absolute top-3 left-3 sm:left-4 flex gap-2 z-20">
                              {course.isPopular && (
                                <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  POPULAR
                                </div>
                              )}
                              {course.isNew && (
                                <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  NUEVO
                                </div>
                              )}
                            </div>
                            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full z-10">
                              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                              <span className="text-xs sm:text-sm font-semibold">
                                {course.rating || '4.8'}
                              </span>
                            </div>
                          </div>

                          {/* CONTENIDO - Debajo de la imagen */}
                          <div className="flex flex-col flex-1 min-w-0 overflow-visible p-3 sm:p-4 md:p-5">
                            <div className="flex flex-col gap-1.5 sm:gap-2 mb-3">
                              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white break-words leading-tight line-clamp-2">
                                {course.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-2 sm:line-clamp-3">
                                {course.short_description || course.description}
                              </p>
                              {/* Etiqueta de categoría/objetivo - estilo limpio neutro */}
                              <div className="flex justify-start sm:justify-center w-full">
                                <span className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                  {getCategoryDisplayName(course)}
                                </span>
                              </div>
                              {/* Metadatos del curso: clases, duración, estudiantes, nivel */}
                              <div className="flex flex-wrap items-center justify-start sm:justify-center gap-x-2 gap-y-1 sm:gap-3 mb-2 sm:mb-3 min-h-[1.25rem]">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                    {course.lessons_count || 0} clases
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                    {getDurationDisplay(course)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                    {course.students_count || 0} est.
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                    <span className="md:hidden">
                                      {course.level === 'Principiante'
                                        ? 'Princ.'
                                        : course.level === 'Intermedio'
                                          ? 'Inter.'
                                          : course.level === 'Avanzado'
                                            ? 'Avanz.'
                                            : course.level || 'Todos'}
                                    </span>
                                    <span className="hidden md:inline">
                                      {course.level || 'Todos'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                              {purchases?.some(
                                (p: any) =>
                                  String(p.course_id) === String(course.id),
                              ) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/student?courseId=${encodeURIComponent(course.id)}`,
                                    );
                                  }}
                                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700"
                                >
                                  <Play
                                    className="w-4 h-4"
                                    fill="currentColor"
                                  />
                                  <span>Entrar al curso</span>
                                </button>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                    {(course.discount_percentage ?? 0) > 0 ? (
                                      <>
                                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                          $
                                          {calculateFinalPrice(
                                            course,
                                          ).toLocaleString('es-CO')}
                                        </span>
                                        <span className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-white/50 line-through">
                                          $
                                          {calculateOriginalPrice(
                                            course,
                                          ).toLocaleString('es-CO')}
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-gray-900 dark:text-white font-bold bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg">
                                          {course.discount_percentage ?? 0}% de
                                          descuento
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                        $
                                        {calculateFinalPrice(
                                          course,
                                        ).toLocaleString('es-CO')}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/course/${course.slug || course.id}`,
                                      );
                                    }}
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>¡Comenzar Ahora!</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                Próximamente sumaremos más programas a RogerBox.
              </p>
            </div>
          )}

          {/* TIPS NUTRICIONALES - Ancho completo usando blogs del API */}
          {nutritionalBlogs.length > 0 && (
            <div className="mt-6 mb-8 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="w-5 h-5 text-[#85ea10]" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Tips Nutricionales
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Consejos y recomendaciones de nuestros expertos
                  </p>
                </div>
                <button
                  onClick={() => router.push('/nutritional-blogs')}
                  className="text-sm text-[#85ea10] hover:text-[#7dd30f] font-semibold flex items-center space-x-1"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Cards de blogs - Horizontal scroll */}
              <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
                {nutritionalBlogs.slice(0, 15).map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => router.push(`/blog/${blog.slug}`)}
                    className="flex-shrink-0 w-full md:w-[600px] lg:w-[700px] bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Imagen */}
                      {blog.featured_image_url && (
                        <div className="w-full md:w-[280px] h-[200px] md:h-full flex-shrink-0 relative">
                          <img
                            src={blog.featured_image_url}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (
                                !target.src?.endsWith('course-placeholder.jpg')
                              ) {
                                target.src = '/images/course-placeholder.jpg';
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                        </div>
                      )}

                      {/* Contenido */}
                      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 sm:line-clamp-none group-hover:text-[#85ea10] transition-colors">
                            {blog.title}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                            {blog.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{blog.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{blog.reading_time} min</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[#85ea10] font-semibold group-hover:text-[#6bc20a] transition-colors">
                            <span className="text-sm">Leer más</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARRUSEL DE CURSOS COMPLETO - Solo si hay más de 3 cursos (oculto por defecto, se puede mostrar con scroll) */}
          {realCourses.length > 3 && false && (
            <div className="mt-12 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Cursos Disponibles
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Descubre nuestros cursos y transforma tu cuerpo
                </p>
              </div>

              {/* Carrusel con curso principal y coming soon */}
              <div className="relative">
                {/* Botones de navegación */}
                <button
                  onClick={() => {
                    const container =
                      document.getElementById('courses-carousel');
                    if (container) {
                      container.scrollBy({ left: -400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                <button
                  onClick={() => {
                    const container =
                      document.getElementById('courses-carousel');
                    if (container) {
                      container.scrollBy({ left: 400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Contenedor del carrusel */}
                <div
                  id="courses-carousel"
                  className="overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-6 md:gap-8 lg:gap-12 px-4 md:px-6 lg:px-20 xl:px-32 justify-start md:justify-center">
                    {/* Card Coming Soon Izquierda - Oculto en mobile */}
                    <div className="hidden md:flex flex-shrink-0 w-full md:w-[400px] lg:w-[500px]">
                      <div
                        className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden h-full"
                        style={{ filter: 'grayscale(100%)' }}
                      >
                        <div className="relative aspect-video rounded-t-2xl overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                            <Play className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                          </div>
                          <div className="absolute inset-0 bg-black/30"></div>
                          <div className="absolute top-3 left-3 z-10">
                            <div className="bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                              PRÓXIMAMENTE
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-400 dark:text-gray-600 mb-2">
                            Curso en preparación
                          </h3>
                          <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">
                            Estamos trabajando en este contenido...
                          </p>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Próximamente</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Curso Principal - Card a color */}
                    <div className="flex-shrink-0 w-full md:w-[400px] lg:w-[500px]">
                      {realCourses[0] && (
                        <div
                          onClick={() =>
                            router.push(
                              `/course/${realCourses[0].slug || realCourses[0].id}`,
                            )
                          }
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        >
                          <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                            <img
                              src={
                                realCourses[0].preview_image ||
                                realCourses[0].thumbnail ||
                                '/images/course-placeholder.jpg'
                              }
                              alt={realCourses[0].title}
                              className="w-full h-full object-cover rounded-t-2xl"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {realCourses[0].isPopular && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  POPULAR
                                </span>
                              )}
                              {realCourses[0].isNew && (
                                <span className="bg-gray-800 dark:bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  NUEVO
                                </span>
                              )}
                            </div>
                            <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-semibold">
                                {realCourses[0]?.rating}
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 sm:line-clamp-none">
                              {realCourses[0]?.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 sm:line-clamp-none">
                              {realCourses[0]?.short_description}
                            </p>
                            {purchases?.some(
                              (p: any) =>
                                String(p.course_id) ===
                                String(realCourses[0]?.id),
                            ) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/student?courseId=${encodeURIComponent(realCourses[0]?.id)}`,
                                  );
                                }}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-700"
                              >
                                <Play className="w-4 h-4" fill="currentColor" />
                                <span>Entrar al curso</span>
                              </button>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        $
                                        {realCourses[0]
                                          ? calculateFinalPrice(
                                              realCourses[0],
                                            ).toLocaleString('es-CO')
                                          : '0'}
                                      </span>
                                      {realCourses[0]?.original_price &&
                                        (realCourses[0]?.original_price || 0) >
                                          (realCourses[0]?.price || 0) && (
                                          <span className="text-lg text-gray-500 line-through">
                                            $
                                            {realCourses[0]?.original_price?.toLocaleString(
                                              'es-CO',
                                            )}
                                          </span>
                                        )}
                                    </div>
                                    {(realCourses[0]?.discount_percentage ||
                                      0) > 0 && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                                        {realCourses[0]?.discount_percentage}%
                                        OFF
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/course/${realCourses[0]?.slug || realCourses[0]?.id}`,
                                    );
                                  }}
                                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-700"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  <span>¡Comenzar Ahora!</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Coming Soon Derecha - Oculto en mobile */}
                    <div className="hidden md:flex flex-shrink-0 w-full md:w-[400px] lg:w-[500px]">
                      <div
                        className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden h-full"
                        style={{ filter: 'grayscale(100%)' }}
                      >
                        <div className="relative aspect-video rounded-t-2xl overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                            <Play className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                          </div>
                          <div className="absolute inset-0 bg-black/30"></div>
                          <div className="absolute top-3 left-3 z-10">
                            <div className="bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                              PRÓXIMAMENTE
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-400 dark:text-gray-600 mb-2 line-clamp-2 sm:line-clamp-none">
                            Curso en preparación
                          </h3>
                          <p className="text-sm text-gray-400 dark:text-gray-600 mb-4 line-clamp-3 sm:line-clamp-none">
                            Estamos trabajando en este contenido...
                          </p>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Próximamente</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />

        {/* Recordatorio semanal de peso */}
        {showWeeklyWeightReminder && (
          <WeeklyWeightReminder
            onClose={handleCloseWeightReminder}
            onWeightSubmit={handleWeightSubmit}
          />
        )}

        {/* Modal para establecer meta */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userProfile?.target_weight
                    ? 'Establece una Meta Adicional'
                    : 'Establece tu Meta'}
                </h2>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Análisis de IMC */}
              {userProfile && (
                <div
                  className={`mb-6 p-4 rounded-xl border ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).bgColor} ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).borderColor}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Target
                      className={`w-5 h-5 ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`}
                    />
                    <h3
                      className={`font-semibold ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`}
                    >
                      {
                        getBMIRecommendation(
                          calculateBMI(userProfile.weight, userProfile.height),
                        ).category
                      }
                    </h3>
                  </div>
                  <p
                    className={`text-sm ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`}
                  >
                    {
                      getBMIRecommendation(
                        calculateBMI(userProfile.weight, userProfile.height),
                      ).message
                    }
                  </p>
                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      IMC:{' '}
                      {calculateBMI(
                        userProfile.weight,
                        userProfile.height,
                      ).toFixed(1)}
                    </span>
                    <button
                      onClick={() => setShowBMIModal(true)}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-white rounded-full p-1 transition-all duration-200 hover:scale-110 shadow-sm"
                      title="Saber más sobre el IMC"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso Objetivo (kg)
                  </label>
                  <input
                    type="number"
                    value={goalData.targetWeight}
                    onChange={(e) =>
                      setGoalData((prev) => ({
                        ...prev,
                        targetWeight: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ej: 65"
                    min="30"
                    max="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={goalData.deadline}
                    onChange={(e) =>
                      setGoalData((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {goalError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {goalError}
                    </p>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={
                    isCustomizingGoal
                      ? handleCancelGoalCustomization
                      : () => setShowGoalModal(false)
                  }
                  disabled={goalLoading}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white dark:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGoalSubmit}
                  disabled={
                    goalLoading || !goalData.targetWeight || !goalData.deadline
                  }
                  className="flex-1 px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {goalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Estableciendo...
                    </>
                  ) : (
                    'Establecer Meta'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de información del IMC */}
        {showBMIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¿Qué es el IMC?
                </h2>
                <button
                  onClick={() => setShowBMIModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    ¿Qué significa?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    El <strong>Índice de Masa Corporal (IMC)</strong> es una
                    medida que relaciona tu peso con tu altura para evaluar si
                    tienes un peso saludable.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Fórmula:
                  </h3>
                  <div className="bg-gray-100 dark:bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      IMC = Peso (kg) ÷ Altura (m)²
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Clasificación:
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Bajo peso:
                      </span>
                      <span className="text-blue-600 font-medium">
                        &lt; 18.5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Peso normal:
                      </span>
                      <span className="text-green-600 font-medium">
                        18.5 - 24.9
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Sobrepeso:
                      </span>
                      <span className="text-orange-600 font-medium">
                        25.0 - 29.9
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Obesidad I:
                      </span>
                      <span className="text-red-600 font-medium">
                        30.0 - 34.9
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Obesidad II:
                      </span>
                      <span className="text-red-700 font-medium">
                        35.0 - 39.9
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Obesidad III:
                      </span>
                      <span className="text-red-800 font-medium">≥ 40.0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tu IMC actual:</strong>{' '}
                    {calculateBMI(
                      userProfile.weight,
                      userProfile.height,
                    ).toFixed(1)}
                    <br />
                    <strong>Clasificación:</strong>{' '}
                    {
                      getBMIRecommendation(
                        calculateBMI(userProfile.weight, userProfile.height),
                      ).category
                    }
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Nota:</strong> El IMC es una guía general. Consulta
                    con un profesional de la salud para una evaluación completa.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowBMIModal(false)}
                  className="w-full px-4 py-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {false && !isAdmin && <NewsModal />}
    </>
  );
}
