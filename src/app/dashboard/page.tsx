'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Play, Clock, Users, Star, Search, User, LogOut, ChevronDown, ShoppingCart, Heart, BookOpen, Target, Zap, Utensils, ChefHat, Award, TrendingUp, Trophy, Weight, X, Info, Settings, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackCourseView } from '@/lib/analytics';
import Footer from '@/components/Footer';
import QuickLoading from '@/components/QuickLoading';
import CourseLoadingSkeleton from '@/components/CourseLoadingSkeleton';
import GoalSuggestionCard from '@/components/GoalSuggestionCard';
import ProgressCard from '@/components/ProgressCard';
import CourseHeroCard from '@/components/CourseHeroCard';
import WeeklyWeightReminder from '@/components/WeeklyWeightReminder';
import NutritionalBlogs from '@/components/NutritionalBlogs';
import ReadMoreText from '@/components/ReadMoreText';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { generateGoalSuggestion, GoalSuggestion } from '@/lib/goalSuggestion';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Usar el hook simple para cursos
  const {
    courses: realCourses,
    loading: loadingCourses,
    error: coursesError,
    refresh: refreshCourses
  } = useUnifiedCourses();
  
  // Hook para compras del usuario
  const { purchases, loading: loadingPurchases, hasActivePurchases } = useUserPurchases();
  
  // Estado para compras simuladas
  const [hasSimulatedPurchase, setHasSimulatedPurchase] = useState(false);
  
  // Verificar compras simuladas
  useEffect(() => {
    const simulatedPurchase = localStorage.getItem('simulated_purchase');
    if (simulatedPurchase) {
      try {
        const purchase = JSON.parse(simulatedPurchase);
        if (purchase.user_id === (session as any)?.user?.id) {
          setHasSimulatedPurchase(true);
        }
      } catch (error) {
        console.error('Error parsing simulated purchase:', error);
      }
    }
  }, [session]);
  

  // Debug logs
  console.log('📊 Dashboard: realCourses length:', realCourses.length);
  console.log('📊 Dashboard: loadingCourses:', loadingCourses);
  console.log('📊 Dashboard: coursesError:', coursesError);

  // Funciones de precios - usar datos directos de la BD
  const calculateFinalPrice = (course: any) => {
    // course.price ya tiene el descuento aplicado en la BD
    return course.price || 0;
  };

  const calculateOriginalPrice = (course: any) => {
    // course.original_price es el precio original sin descuento
    return course.original_price || course.price || 0;
  };




  // Debug logs
  console.log('📊 Dashboard: realCourses length:', realCourses?.length || 0);
  console.log('📊 Dashboard: loadingCourses:', loadingCourses);
  console.log('📊 Dashboard: coursesError:', coursesError);
  
  // Cursos recomendados (por rating alto) y evitar duplicarlos en "Todos los Cursos"
  const recommendedCourses = realCourses?.filter(course => (course.rating ?? 0) >= 4.5).slice(0, 3) || [];
  const recommendedIds = new Set(recommendedCourses.map(c => c.id));
  
  // Debug logs para recomendados
  console.log('📊 Dashboard: recommendedCourses length:', recommendedCourses.length);
  if (realCourses && realCourses.length > 0) {
    console.log('📊 Dashboard: Primer curso rating:', realCourses[0].rating);
  }
  
  // Filtrar cursos
  const filteredCourses = realCourses?.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category_name === selectedCategory;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    // Excluir los que ya aparecen como recomendados para evitar duplicados visuales
    const notRecommended = !recommendedIds.has(course.id);
    
    // Debug logs (simplificados)
    if (!matchesCategory || !matchesSearch || !notRecommended) {
      console.log(`🔍 Curso "${course.title}" filtrado:`, {
        matchesCategory,
        matchesSearch, 
        notRecommended,
        category: course.category_name,
        rating: course.rating
      });
    }
    
    return matchesCategory && matchesSearch && notRecommended;
  }) || [];
  
  console.log('📊 Dashboard: filteredCourses length:', filteredCourses.length);
  if (realCourses && realCourses.length > 0) {
    console.log('📊 Dashboard: Primer curso:', realCourses[0]);
    console.log('📊 Dashboard: Thumbnail del primer curso:', realCourses[0].thumbnail);
    console.log('📊 Dashboard: Preview_image del primer curso:', realCourses[0].preview_image);
    console.log('📊 Dashboard: Image URL final:', realCourses[0].preview_image || realCourses[0].thumbnail || '/images/course-placeholder.jpg');
  }
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState({
    targetWeight: '',
    goalType: 'lose', // 'lose', 'maintain', 'gain'
    deadline: ''
  });
  const [goalError, setGoalError] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  
  // Estados para la sugerencia de meta
  const [goalSuggestion, setGoalSuggestion] = useState<GoalSuggestion | null>(null);
  const [showGoalSuggestion, setShowGoalSuggestion] = useState(false);
  const [isAcceptingGoal, setIsAcceptingGoal] = useState(false);
  const [showProgressCard, setShowProgressCard] = useState(false);
  const [isCustomizingGoal, setIsCustomizingGoal] = useState(false);
  const [showWeeklyWeightReminder, setShowWeeklyWeightReminder] = useState(false);
  
  // Estados para cursos comprados
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [loadingPurchasedCourses, setLoadingPurchasedCourses] = useState(false);
  const [purchasedCourseLessons, setPurchasedCourseLessons] = useState<any[]>([]);

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
          description: realCourse?.description || 'Rutina intensa de 40 minutos para quemar grasa y bajar de peso. Este programa te ayudará a mejorar tu resistencia cardiovascular y a definir tu cuerpo.',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          completed_lessons: 0, // Cambiado a 0 para mostrar progreso inicial
          total_lessons: 12,
          duration_days: 30,
          level: 'Intermedio',
          estimated_calories_per_lesson: 150, // Calorías estimadas por lección
          purchased_at: new Date().toISOString(),
          start_date: new Date().toISOString().split('T')[0] // Hoy
        }
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
            console.error('Error fetching lessons:', lessonsError);
          } else {
            realLessons = lessonsData || [];
          }
        } catch (error) {
          console.error('Error fetching lessons:', error);
        }
      }

      // Si no hay lecciones en la DB, usar datos de ejemplo como fallback
      const mockLessons = realLessons.length > 0 ? realLessons : [
        {
          id: 'lesson-1',
          course_id: realCourse?.id || '1',
          title: 'Introducción y Calentamiento',
          description: 'Prepara tu cuerpo para la rutina',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          lesson_number: 1,
          lesson_order: 1,
          duration_minutes: 15,
          is_preview: true,
          views_count: 120,
          created_at: new Date().toISOString()
        },
        {
          id: 'lesson-2',
          course_id: realCourse?.id || '1',
          title: 'Rutina HIIT: Piernas y Glúteos',
          description: 'Entrenamiento intenso para tren inferior',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          lesson_number: 2,
          lesson_order: 2,
          duration_minutes: 30,
          is_preview: false,
          views_count: 80,
          created_at: new Date().toISOString()
        },
        {
          id: 'lesson-3',
          course_id: realCourse?.id || '1',
          title: 'Rutina HIIT: Brazos y Abdomen',
          description: 'Fortalece tu tren superior y core',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          lesson_number: 3,
          lesson_order: 3,
          duration_minutes: 25,
          is_preview: false,
          views_count: 60,
          created_at: new Date().toISOString()
        },
        {
          id: 'lesson-4',
          course_id: realCourse?.id || '1',
          title: 'Rutina HIIT Intensiva - Día 4',
          description: 'Ejercicios de alta intensidad para maximizar la quema de grasa',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          lesson_number: 4,
          lesson_order: 4,
          duration_minutes: 40,
          is_preview: false,
          views_count: 40,
          created_at: new Date().toISOString()
        },
        {
          id: 'lesson-5',
          course_id: realCourse?.id || '1',
          title: 'Cardio Quema Grasa - Día 5',
          description: 'Sesión de cardio para acelerar el metabolismo',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          preview_image: realCourse?.preview_image || '/images/course-placeholder.jpg',
          lesson_number: 5,
          lesson_order: 5,
          duration_minutes: 35,
          is_preview: false,
          views_count: 0,
          created_at: new Date().toISOString()
        }
      ];

      setPurchasedCourses(mockPurchasedCourses);
      setPurchasedCourseLessons(mockLessons);

      // Determinar la próxima lección basada en el progreso del usuario
      const completedLessons = mockPurchasedCourses[0]?.completed_lessons || 0;
      
      // La próxima lección es la siguiente después de las completadas
      const nextAvailableLesson = mockLessons.find(
        (lesson) => lesson.lesson_order === completedLessons + 1
      );
      
      // Si no hay próxima lección, usar la primera
      setNextLesson(nextAvailableLesson || mockLessons[0]);
    } catch (error) {
      console.error('Error loading purchased courses:', error);
    } finally {
      setLoadingPurchasedCourses(false);
    }
  };

  // Función para obtener el curso recomendado basado en el perfil del usuario
  const getRecommendedCourse = (profile: any) => {
    if (!profile) return 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!';
    
    const currentBMI = profile.weight / Math.pow(profile.height / 100, 2);
    
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
    
    const currentBMI = profile.weight / Math.pow(profile.height / 100, 2);
    
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

  // Verificar si es viernes para mostrar recordatorio de peso
  useEffect(() => {
    const today = new Date();
    const isFriday = today.getDay() === 5; // 5 = viernes
    const lastWeightReminder = localStorage.getItem('lastWeightReminder');
    const todayString = today.toDateString();
    
    // Mostrar recordatorio si es viernes y no se ha mostrado hoy
    if (isFriday && lastWeightReminder !== todayString) {
      setShowWeeklyWeightReminder(true);
    }
  }, []);

  // Obtener datos del perfil desde Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if ((session as any)?.user?.id) {
        try {
          console.log('Dashboard: Buscando perfil para ID:', (session as any).user.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', (session as any).user.id)
            .maybeSingle();

          // Si no hay perfil o el perfil está incompleto, redirigir al onboarding
          if (!data || !data.goals || data.goals.length === 0) {
            console.log('Dashboard: Perfil incompleto o no encontrado, redirigiendo al onboarding');
            router.push('/onboarding');
            return;
          }

          if (error) {
            console.error('Dashboard: Error fetching profile:', error);
            setLoading(false);
            return;
          }

          console.log('Dashboard: Perfil encontrado:', data);
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
              dietaryHabits: data.dietary_habits
            });
            setGoalSuggestion(suggestion);
            setShowGoalSuggestion(true);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Dashboard: Error inesperado:', error);
          setLoading(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [session, status, router]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', icon: '🎯', color: '#85ea10' }
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
          ...(data || []).map(cat => ({
            id: cat.name, // Usar el nombre como ID para el filtrado
            name: cat.name,
            icon: cat.icon,
            color: cat.color
          }))
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
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
        message: 'Tu peso está por debajo del rango saludable. Te recomendamos ganar peso de forma saludable.',
        recommendation: 'Ganar peso',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        category: 'Peso normal',
        message: '¡Excelente! Tu peso está en el rango saludable. Mantén tu estilo de vida saludable.',
        recommendation: 'Mantener peso',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (bmi >= 25 && bmi < 30) {
      return {
        category: 'Sobrepeso',
        message: 'Tienes sobrepeso. Te recomendamos bajar entre 5-10 kg para alcanzar un peso más saludable.',
        recommendation: 'Bajar peso',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        category: 'Obesidad',
        message: 'Tienes obesidad. Te recomendamos bajar entre 10-20 kg para mejorar tu salud significativamente.',
        recommendation: 'Bajar peso',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  // Función para aceptar la meta sugerida
  const handleAcceptGoalSuggestion = async (suggestion: GoalSuggestion) => {
    setIsAcceptingGoal(true);
    setGoalError('');

    try {
      console.log('Aceptando meta sugerida:', suggestion);

      if (!userProfile?.id) {
        throw new Error('No se encontró el ID del usuario');
      }

      // Actualizar el perfil con la meta sugerida
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_weight: suggestion.targetWeight,
          goal_deadline: suggestion.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
        .select();

      if (error) {
        console.error('Error actualizando meta:', error);
        throw new Error(`Error al establecer la meta: ${error.message || 'Error desconocido'}`);
      }

      console.log('Meta establecida exitosamente:', data);

      // Actualizar el perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        target_weight: suggestion.targetWeight,
        goal_deadline: suggestion.deadline
      } : null);

      // Ocultar la sugerencia
      setShowGoalSuggestion(false);
      setGoalSuggestion(null);
      
      // Mostrar el card de progreso
      setShowProgressCard(true);
      
      // Resetear estado de personalización
      setIsCustomizingGoal(false);
      
    } catch (error: any) {
      console.error('Error aceptando meta:', error);
      setGoalError(error.message || 'Error al establecer la meta. Inténtalo de nuevo.');
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
        deadline: goalSuggestion.deadline
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
      // Aquí se actualizaría el peso en la base de datos
      console.log('Peso actualizado:', weight);
      // Actualizar el perfil local
      if (userProfile) {
        setUserProfile({ ...userProfile, weight });
      }
    } catch (error) {
      console.error('Error al actualizar peso:', error);
    }
  };

  const handleGoalSubmit = async () => {
    if (!goalData.targetWeight || !goalData.deadline) {
      setGoalError('Por favor completa todos los campos');
      return;
    }

    setGoalLoading(true);
    setGoalError('');

    try {
      console.log('Actualizando meta para usuario:', userProfile?.id);
      console.log('Datos de la meta:', goalData);

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
        console.error('Error obteniendo perfil:', fetchError);
        throw new Error('No se pudo obtener el perfil del usuario');
      }

      console.log('Perfil encontrado:', existingProfile);

      // Actualizar solo los campos de meta
      const { data, error } = await supabase
        .from('profiles')
        .update({
          target_weight: parseInt(goalData.targetWeight),
          goal_deadline: goalData.deadline,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
        .select();

      if (error) {
        console.error('Error de Supabase al actualizar:', error);
        console.error('Detalles del error:', JSON.stringify(error, null, 2));
        throw new Error(`Error al actualizar la meta: ${error.message || 'Error desconocido'}`);
      }

      console.log('Meta actualizada exitosamente:', data);

      // Actualizar el perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        target_weight: parseInt(goalData.targetWeight),
        goal_deadline: goalData.deadline
      } : null);

      setShowGoalModal(false);
      setGoalData({ targetWeight: '', goalType: 'lose', deadline: '' });
      
      // Recargar la página para reflejar los cambios
      window.location.reload();
    } catch (error: any) {
      console.error('Error actualizando meta:', error);
      setGoalError(error.message || 'Error al actualizar la meta. Inténtalo de nuevo.');
    } finally {
      setGoalLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <QuickLoading message="Cargando tu dashboard..." duration={2000} />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // Si el usuario tiene cursos comprados, mostrar el flujo de progreso

  if (!userProfile) {
    return <QuickLoading message="Cargando tu perfil..." duration={1500} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
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
                  <p className="text-sm font-medium">{userProfile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-white/60">{userProfile.email}</p>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {/* Welcome Message - Centrado arriba del progreso */}

        {/* Botón temporal para simular compra de curso - Solo para testing */}
        {userProfile && (!(userProfile as any)?.purchased_courses || (userProfile as any)?.purchased_courses?.length === 0) && !hasSimulatedPurchase && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#85ea10] to-[#7dd30f] rounded-2xl p-6 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <ShoppingCart className="w-6 h-6 text-black" />
                <h2 className="text-xl font-bold text-black">
                  ¡Simula tu primera compra!
                </h2>
              </div>
              <p className="text-black/80 mb-4">
                Mientras arreglamos el sistema de pagos, puedes simular la compra de un curso para probar la plataforma completa.
              </p>
              <button
                onClick={() => {
                  // Simular compra del curso "destroy-that-fat"
                  const mockCourse = {
                    id: 'destroy-that-fat',
                    title: 'DESTROY that FAT HIIT 40 MIN',
                    slug: 'destroy-that-fat'
                  };
                  
                  // Crear un estado temporal de compra con fecha de inicio de hoy
                  const today = new Date();
                  const simulatedPurchase = {
                    course: mockCourse,
                    purchase_date: today.toISOString(),
                    start_date: today.toISOString(), // Empezar hoy
                    user_id: (session as any)?.user?.id,
                    completed_lessons: [] // Sin clases completadas aún
                  };
                  
                  localStorage.setItem('simulated_purchase', JSON.stringify(simulatedPurchase));
                  
                  // Actualizar estado local
                  setHasSimulatedPurchase(true);
                  
                  // Redirigir directamente al dashboard de student
                  router.push('/student');
                }}
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Simular Compra de "DESTROY that FAT"
              </button>
            </div>
          </div>
        )}

        {/* Redirigir usuarios con cursos comprados al dashboard específico */}
        {userProfile && ((userProfile as any)?.purchased_courses?.length > 0 || hasSimulatedPurchase) && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[#85ea10] to-[#7dd30f] rounded-2xl p-6 text-center shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Play className="w-6 h-6 text-black" />
                <h2 className="text-xl font-bold text-black">
                  ¡Tienes cursos activos!
                </h2>
              </div>
              <p className="text-black/80 mb-4">
                Ve a tu dashboard personalizado para ver tu progreso y continuar con tus clases.
              </p>
              <button
                onClick={() => router.push('/student')}
                className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Ir a Mi Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Course Hero Card - Si tiene cursos comprados */}
        {purchasedCourses.length > 0 && nextLesson && (
          <CourseHeroCard
            userProfile={userProfile}
            purchasedCourse={purchasedCourses[0]}
            nextLesson={nextLesson}
            lessons={purchasedCourseLessons}
            onStartLesson={(lessonId) => {
              console.log('Starting lesson:', lessonId);
              // Aquí iría la lógica para iniciar la lección
            }}
          />
        )}

        {/* Goal Suggestion Card - Solo si NO tiene meta establecida Y NO tiene cursos comprados */}
        {!userProfile?.target_weight && !purchasedCourses.length && showGoalSuggestion && goalSuggestion && (
          <GoalSuggestionCard
            suggestion={goalSuggestion}
            onAccept={handleAcceptGoalSuggestion}
            onCustomize={handleCustomizeGoalSuggestion}
            onDismiss={handleDismissGoalSuggestion}
            isLoading={isAcceptingGoal}
            userBMI={userProfile ? userProfile.weight / Math.pow(userProfile.height / 100, 2) : 25}
            userName={userProfile?.name || 'Usuario'}
            availableCourses={realCourses}
          />
        )}

        {/* Progress Card - Solo si SÍ tiene meta establecida Y NO tiene cursos comprados, O si está personalizando meta */}
        {((userProfile?.target_weight && userProfile?.goal_deadline) || isCustomizingGoal) && !purchasedCourses.length && (
          <ProgressCard
            userProfile={userProfile}
            goalSuggestion={isCustomizingGoal && goalSuggestion ? goalSuggestion : {
              targetWeight: userProfile.target_weight,
              deadline: userProfile.goal_deadline,
              recommendedCourse: getRecommendedCourse(userProfile),
              estimatedDuration: getEstimatedDuration(userProfile)
            }}
            onCustomize={() => {
              setShowProgressCard(false);
              setShowGoalModal(true);
            }}
          />
        )}


        {/* Category Filters - Carrusel en móvil/tablet, grid en desktop */}
        <div className="mb-6">
          {/* Desktop: Grid layout */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border transition-all duration-200 font-medium text-sm ${
                  selectedCategory === category.id
                    ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-200 dark:border-white/20 hover:border-[#85ea10]/50'
                }`}
              >
                <span className="text-sm">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Mobile & Tablet: Horizontal scrollable carousel */}
          <div className="lg:hidden">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-200 dark:border-white/20 hover:border-[#85ea10]/50'
                  }`}
                >
                  <span className="text-sm">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Courses */}
        {loadingCourses ? (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold dashboard-title text-gray-900 dark:text-white">
                Cursos Recomendados
              </h2>
            </div>
            <CourseLoadingSkeleton count={3} showRecommended={true} />
          </div>
        ) : recommendedCourses.length > 0 && (
          <div className="mb-8">
            {/* Desktop: Grid layout */}
            <div className="hidden xl:grid grid-cols-3 gap-6">
              {recommendedCourses.map(course => (
                <div 
                  key={course.id} 
                  onClick={(e) => {
                    console.log('🖱️ Recommended card clicked:', course.title);
                    console.log('🖱️ Recommended course slug:', course.slug);
                    console.log('🖱️ Recommended course ID:', course.id);
                    
                    // Verificar si el curso ya fue comprado
                    const isPurchased = (userProfile as any)?.purchased_courses?.some((purchasedCourse: any) => 
                      purchasedCourse.course_id === course.id || purchasedCourse.course_slug === course.slug
                    ) || hasSimulatedPurchase;
                    
                    if (isPurchased) {
                      router.push(`/course/${course.slug || course.id}/progress`);
                    } else {
                      router.push(`/course/${course.slug || course.id}`);
                    }
                  }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl hover:shadow-[#85ea10]/10 hover:scale-[1.02] transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                      <img 
                        src={course.preview_image || course.thumbnail || '/images/course-placeholder.jpg'} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('🖼️ Dashboard: Error loading recommended course image:', course.preview_image || course.thumbnail);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                      onLoad={() => {
                        console.log('🖼️ Dashboard: Recommended course image loaded successfully:', course.preview_image || course.thumbnail);
                      }}
                      />
                      <div className="hidden absolute inset-0 bg-gradient-to-br from-[#85ea10]/20 to-[#85ea10]/40 flex items-center justify-center">
                        <Play className="w-12 h-12 text-[#85ea10]" />
                      </div>
                    </div>
                    {/* Tag Recomendado - Más pequeño y discreto */}
                    <div className="absolute top-2 left-2 bg-[#85ea10] text-black px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">
                      Recomendado
                    </div>
                    
                    {/* Rating - Movido abajo para no interferir con la imagen */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{course.rating}</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Información de calorías y clases */}
                    <h3 className="text-xl font-bold course-title text-gray-900 dark:text-white mb-2">{course.title}</h3>
                    <ReadMoreText 
                      text={course.short_description} 
                      maxLength={120}
                      className="text-gray-600 dark:text-white/70 text-sm mb-3"
                    />
                    
                    {/* Cuadro verde unificado */}
                    <div className="bg-[#85ea10]/10 rounded-lg p-4 mb-4 flex-grow flex flex-col justify-center">
                      {/* Categoría del curso */}
                      <div className="flex items-center justify-center mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#85ea10] text-black">
                          {course.category_name || 'Sin categoría'}
                        </span>
                      </div>
                      
                      {/* Mensaje motivacional */}
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Zap className="w-4 h-4 text-[#85ea10]" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-white">
                          ¡Sin límites! Para todos los niveles
                        </span>
                      </div>
                      
                      {/* Estadísticas del curso */}
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/70">
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-[#85ea10]" />
                        <span>{(course as any)?.calories_burned || 0} cal</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{course.lessons_count || 1} clases</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{course.students_count?.toLocaleString() || 0} personas</span>
                      </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {/* Precio */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {course.discount_percentage && course.discount_percentage > 0 ? (
                            <>
                              <span className="text-3xl font-black price-text text-gray-900 dark:text-white">
                                ${calculateFinalPrice(course).toLocaleString('es-CO')}
                              </span>
                              <span className="text-xl font-bold text-gray-500 dark:text-white/60 line-through">
                                ${calculateOriginalPrice(course).toLocaleString('es-CO')}
                              </span>
                            </>
                          ) : (
                            <span className="text-3xl font-black price-text text-gray-900 dark:text-white">
                              ${calculateFinalPrice(course).toLocaleString('es-CO')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                          {course.discount_percentage && course.discount_percentage > 0 && (
                            <span className="text-sm text-[#85ea10] font-semibold">
                              {course.discount_percentage}% de descuento
                            </span>
                          )}
                          {/* IVA temporalmente deshabilitado */}
                          {/* {course.include_iva && course.iva_percentage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              IVA {course.iva_percentage}% incluido
                            </span>
                          )} */}
                        </div>
                      </div>
                      
                      {/* Botón */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/course/${course.slug || course.id}`);
                        }}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>¡Comenzar Ahora!</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile & Tablet: Horizontal scrollable carousel */}
            <div className="xl:hidden relative">
              <div 
                id="recommended-courses-scroll"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recommendedCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={(e) => {
                      console.log('🖱️ Recommended card clicked:', course.title);
                      console.log('🖱️ Recommended course slug:', course.slug);
                      console.log('🖱️ Recommended course ID:', course.id);
                      router.push(`/course/${course.slug || course.id}`);
                    }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl hover:shadow-[#85ea10]/10 hover:scale-[1.02] transition-all duration-300 flex flex-col cursor-pointer flex-shrink-0 w-[calc(100vw-2rem)] xl:w-auto"
                  >
                    <div className="relative">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                        <img 
                          src={course.preview_image || course.thumbnail || '/images/course-placeholder.jpg'} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('🖼️ Dashboard: Error loading recommended course image:', course.preview_image || course.thumbnail);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                          onLoad={() => {
                            console.log('🖼️ Dashboard: Recommended course image loaded successfully:', course.preview_image || course.thumbnail);
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-[#85ea10]/20 to-[#85ea10]/40 flex items-center justify-center">
                          <Play className="w-12 h-12 text-[#85ea10]" />
                        </div>
                      </div>
                      {/* Tag Recomendado - Más pequeño y discreto */}
                      <div className="absolute top-2 left-2 bg-[#85ea10] text-black px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">
                        Recomendado
                      </div>
                      
                      {/* Rating - Movido abajo para no interferir con la imagen */}
                      <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{course.rating}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Información de calorías y clases */}
                      <h3 className="text-xl font-bold course-title text-gray-900 dark:text-white mb-2">{course.title}</h3>
                      <ReadMoreText 
                        text={course.short_description} 
                        maxLength={60}
                        className="text-gray-600 dark:text-white/70 text-sm mb-3"
                      />
                      
                      {/* Cuadro verde unificado */}
                      <div className="bg-[#85ea10]/10 rounded-lg p-4 mb-4 flex-grow flex flex-col justify-center">
                        {/* Categoría del curso */}
                        <div className="flex items-center justify-center mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#85ea10] text-black">
                            {course.category_name || 'Sin categoría'}
                          </span>
                        </div>
                        
                        {/* Descripción del nivel */}
                        <div className="flex items-center justify-center mb-3">
                          <Zap className="w-4 h-4 text-[#85ea10] mr-1" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ¡Sin límites! Para todos los niveles
                          </span>
                        </div>
                        
                        {/* Estadísticas del curso */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="flex flex-col items-center">
                            <Zap className="w-4 h-4 text-[#85ea10] mb-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">500+ cal</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Play className="w-4 h-4 text-[#85ea10] mb-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{course.lessons_count || 0} clases</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Clock className="w-4 h-4 text-[#85ea10] mb-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{course.duration}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <Users className="w-4 h-4 text-[#85ea10] mb-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{course.students_count || 0} personas</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Precio y botón */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          {course.original_price && course.original_price > course.price ? (
                            <>
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">${course.price?.toLocaleString()}</span>
                              <span className="text-lg text-gray-500 line-through">${course.original_price.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">${course.price?.toLocaleString()}</span>
                          )}
                        </div>
                        {course.original_price && course.original_price > course.price && (
                          <div className="text-sm text-[#85ea10] font-semibold">
                            {Math.round(((course.original_price - course.price) / course.original_price) * 100)}% de descuento
                          </div>
                        )}
                      </div>
                      
                      <button
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>¡Comenzar Ahora!</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Scroll indicator arrow */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pl-8 pr-2 py-4">
                <button
                  onClick={() => {
                    const scrollContainer = document.getElementById('recommended-courses-scroll');
                    if (scrollContainer) {
                      const cardWidth = 280 + 16; // card width + gap
                      scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-[#85ea10] rounded-full shadow-lg hover:bg-[#7dd30f] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Courses */}
        {filteredCourses.length > 0 && (
        <div data-courses-section>
          <div className="mb-6">
            <h2 className="text-xl font-bold dashboard-title text-gray-900 dark:text-white">
              Todos los Cursos
            </h2>
          </div>
          {loadingCourses ? (
            <CourseLoadingSkeleton count={6} />
          ) : (
            <>
              {/* Desktop: Grid layout */}
              <div className="hidden xl:grid grid-cols-3 gap-6">
                {filteredCourses.map(course => (
              <div 
                key={course.id} 
                onClick={(e) => {
                  console.log('🖱️ Card clicked:', course.title);
                  console.log('🖱️ Course slug:', course.slug);
                  console.log('🖱️ Course ID:', course.id);
                  console.log('🖱️ Event target:', e.target);
                  console.log('🖱️ Event currentTarget:', e.currentTarget);
                  router.push(`/course/${course.slug || course.id}`);
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl hover:shadow-[#85ea10]/10 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 ease-out flex flex-col cursor-pointer"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                    <img 
                      src={course.preview_image || course.thumbnail || '/images/course-placeholder.jpg'} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('🖼️ Dashboard: Error loading course card image:', course.preview_image || course.thumbnail);
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/course-placeholder.jpg';
                      }}
                      onLoad={() => {
                        console.log('🖼️ Dashboard: Course card image loaded successfully:', course.preview_image || course.thumbnail);
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-gradient-to-br from-[#85ea10]/20 to-[#85ea10]/40 flex items-center justify-center">
                      <Play className="w-12 h-12 text-[#85ea10]" />
                    </div>
                  </div>
                  {/* Etiquetas POPULAR/NUEVO */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {course.isPopular && (
                      <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        POPULAR
                      </div>
                    )}
                    {course.isNew && (
                      <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        NUEVO
                      </div>
                    )}
                  </div>
                  
                  {/* Rating */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-white dark:bg-gray-800/90 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{course.rating}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  {/* Información de calorías y clases */}
                  <h3 className="text-xl font-bold course-title text-gray-900 dark:text-white mb-2">{course.title}</h3>
                  <p className="text-gray-600 dark:text-white/70 text-sm mb-3">{course.short_description}</p>
                  
                  {/* Cuadro verde unificado */}
                  <div className="bg-[#85ea10]/10 rounded-lg p-4 mb-4 flex-grow flex flex-col justify-center">
                    {/* Categoría del curso */}
                    <div className="flex items-center justify-center mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#85ea10] text-black">
                        {course.category_name || 'Sin categoría'}
                      </span>
                    </div>
                    
                    {/* Mensaje motivacional */}
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Zap className="w-4 h-4 text-[#85ea10]" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-white">
                        ¡Sin límites! Para todos los niveles
                      </span>
                    </div>
                    
                    {/* Estadísticas del curso */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/70">
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-[#85ea10]" />
                        <span>{(course as any)?.calories_burned || 0} cal</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{course.lessons_count || 1} clases</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{course.students_count?.toLocaleString() || 0} personas</span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Precio */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        {course.discount_percentage && course.discount_percentage > 0 ? (
                          <>
                            <span className="text-3xl font-black price-text text-gray-900 dark:text-white">
                              ${calculateFinalPrice(course).toLocaleString('es-CO')}
                            </span>
                            <span className="text-xl font-bold text-gray-500 dark:text-white/60 line-through">
                              ${calculateOriginalPrice(course).toLocaleString('es-CO')}
                            </span>
                          </>
                        ) : (
                          <span className="text-3xl font-black price-text text-gray-900 dark:text-white">
                            ${calculateFinalPrice(course).toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        {course.discount_percentage && course.discount_percentage > 0 && (
                          <span className="text-sm text-[#85ea10] font-semibold">
                            {course.discount_percentage}% de descuento
                          </span>
                        )}
                        {/* IVA temporalmente deshabilitado */}
                        {/* {course.include_iva && course.iva_percentage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            IVA {course.iva_percentage}% incluido
                          </span>
                        )} */}
                      </div>
                    </div>
                    
                    {/* Botón */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Trackear la visita al curso
                        await trackCourseView(course.id);
                        router.push(`/course/${course.slug || course.id}`);
                      }}
                      className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>¡Comenzar Ahora!</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Mobile & Tablet: Horizontal scrollable carousel */}
            <div className="xl:hidden relative">
              <div 
                id="all-courses-scroll"
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={(e) => {
                      console.log('🖱️ Card clicked:', course.title);
                      console.log('🖱️ Course slug:', course.slug);
                      console.log('🖱️ Course ID:', course.id);
                      console.log('🖱️ Event target:', e.target);
                      console.log('🖱️ Event currentTarget:', e.currentTarget);
                      router.push(`/course/${course.slug || course.id}`);
                    }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl hover:shadow-[#85ea10]/10 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-300 ease-out flex flex-col cursor-pointer flex-shrink-0 w-[calc(100vw-2rem)] xl:w-auto"
                  >
                    <div className="relative">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                        <img 
                          src={course.preview_image || course.thumbnail || '/images/course-placeholder.jpg'} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('🖼️ Dashboard: Error loading course card image:', course.preview_image || course.thumbnail);
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/course-placeholder.jpg';
                          }}
                          onLoad={() => {
                            console.log('🖼️ Dashboard: Course card image loaded successfully:', course.preview_image || course.thumbnail);
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-[#85ea10]/20 to-[#85ea10]/40 flex items-center justify-center">
                          <Play className="w-12 h-12 text-[#85ea10]" />
                        </div>
                      </div>
                      {/* Etiquetas POPULAR/NUEVO */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {course.isPopular && (
                          <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            POPULAR
                          </div>
                        )}
                        {course.isNew && (
                          <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            NUEVO
                          </div>
                        )}
                      </div>
                      
                      {/* Rating */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-white dark:bg-gray-800/90 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Información de calorías y clases */}
                      <h3 className="text-xl font-bold course-title text-gray-900 dark:text-white mb-2">{course.title}</h3>
                      <ReadMoreText 
                        text={course.short_description} 
                        maxLength={60}
                        className="text-gray-600 dark:text-white/70 text-sm mb-3"
                      />
                      
                      {/* Cuadro verde unificado */}
                      <div className="bg-[#85ea10]/10 rounded-lg p-4 mb-4 flex-grow flex flex-col justify-center">
                        {/* Categoría del curso */}
                        <div className="flex items-center justify-center mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#85ea10] text-black">
                            {course.category_name || 'Sin categoría'}
                          </span>
                        </div>
                        
                        {/* Mensaje motivacional */}
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <Zap className="w-4 h-4 text-[#85ea10]" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-white">
                            ¡Sin límites! Para todos los niveles
                          </span>
                        </div>
                        
                        {/* Estadísticas del curso */}
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/70">
                          <span className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-[#85ea10]" />
                            <span>{(course as any)?.calories_burned || 0} cal</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Play className="w-3 h-3" />
                            <span>{course.lessons_count || 1} clases</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{course.duration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{course.students_count?.toLocaleString() || 0} personas</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {/* Precio */}
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-1">
                            {course.original_price && course.original_price > course.price ? (
                              <>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  ${course.price?.toLocaleString()}
                                </span>
                                <span className="text-lg text-gray-500 line-through">
                                  ${course.original_price?.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${course.price?.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {course.original_price && course.original_price > course.price && (
                            <div className="text-sm text-[#85ea10] font-semibold">
                              {Math.round(((course.original_price - course.price) / course.original_price) * 100)}% de descuento
                            </div>
                          )}
                        </div>
                        
                        {/* Botón */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Trackear la visita al curso
                            await trackCourseView(course.id);
                            router.push(`/course/${course.slug || course.id}`);
                          }}
                          className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>¡Comenzar Ahora!</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Scroll indicator arrow */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pl-8 pr-2 py-4">
                <button
                  onClick={() => {
                    const scrollContainer = document.getElementById('all-courses-scroll');
                    if (scrollContainer) {
                      const cardWidth = 280 + 16; // card width + gap
                      scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center justify-center w-8 h-8 bg-[#85ea10] rounded-full shadow-lg hover:bg-[#7dd30f] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            </>
          )}

          {/* Información de cursos */}
          {!loadingCourses && filteredCourses.length > 0 && (
            <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              Mostrando {filteredCourses.length} cursos
            </div>
          )}
        </div>
        )}

        {/* Nutritional Blogs Section */}
        <div className="mb-8">
          <NutritionalBlogs />
        </div>
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
                {userProfile?.target_weight ? 'Establece una Meta Adicional' : 'Establece tu Meta'}
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
              <div className={`mb-6 p-4 rounded-xl border ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).bgColor} ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).borderColor}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className={`w-5 h-5 ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`} />
                  <h3 className={`font-semibold ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`}>
                    {getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).category}
                  </h3>
                </div>
                <p className={`text-sm ${getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).color}`}>
                  {getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).message}
                </p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>IMC: {calculateBMI(userProfile.weight, userProfile.height).toFixed(1)}</span>
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
                  onChange={(e) => setGoalData(prev => ({ ...prev, targetWeight: e.target.value }))}
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
                  onChange={(e) => setGoalData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {goalError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{goalError}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={isCustomizingGoal ? handleCancelGoalCustomization : () => setShowGoalModal(false)}
                disabled={goalLoading}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white dark:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleGoalSubmit}
                disabled={goalLoading || !goalData.targetWeight || !goalData.deadline}
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">¿Qué significa?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  El <strong>Índice de Masa Corporal (IMC)</strong> es una medida que relaciona tu peso con tu altura para evaluar si tienes un peso saludable.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fórmula:</h3>
                <div className="bg-gray-100 dark:bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    IMC = Peso (kg) ÷ Altura (m)²
                  </code>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Clasificación:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Bajo peso:</span>
                    <span className="text-blue-600 font-medium">&lt; 18.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Peso normal:</span>
                    <span className="text-green-600 font-medium">18.5 - 24.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Sobrepeso:</span>
                    <span className="text-orange-600 font-medium">25.0 - 29.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Obesidad I:</span>
                    <span className="text-red-600 font-medium">30.0 - 34.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Obesidad II:</span>
                    <span className="text-red-700 font-medium">35.0 - 39.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Obesidad III:</span>
                    <span className="text-red-800 font-medium">≥ 40.0</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tu IMC actual:</strong> {calculateBMI(userProfile.weight, userProfile.height).toFixed(1)} 
                  <br />
                  <strong>Clasificación:</strong> {getBMIRecommendation(calculateBMI(userProfile.weight, userProfile.height)).category}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> El IMC es una guía general. Consulta con un profesional de la salud para una evaluación completa.
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
  );
}

