'use client';

import {
  Activity,
  Award,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  Info,
  Play,
  Plus,
  Share2,
  TrendingUp,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import WeeklyWeightReminder from '@/components/WeeklyWeightReminder';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getBMIColor } from '@/lib/goalSuggestion';
import { supabase } from '@/lib/supabase-browser';
import { ShareCourseToFeedButton } from '@/shared/components/ShareCourseToFeedButton';

interface UserProfile {
  weight: number;
  height: number;
  target_weight?: number | null;
  goal_deadline?: string | null;
  name?: string;
  created_at?: string;
  streak_days?: number | null;
  current_weight?: number | null;
}

interface WeightRecord {
  date: string;
  weight: number;
}

interface Lesson {
  id?: string;
  calories?: number | null;
  calories_burned?: number | null;
  duration_minutes?: number | null;
}

interface InsightsSectionProps {
  userProfile: UserProfile | null;
  currentLesson?: Lesson | null;
  completedLessons?: string[];
  lessonVideoEnded?: boolean;
  courseWithLessons?: any;
  effectivePurchase?: any; // Para obtener start_date y calcular racha
  /** Llamado cuando el usuario quiere ver la clase de nuevo el mismo día */
  onWatchAgain?: () => void;
}

const formatDateLabel = (dateString?: string | null) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });

  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName}`;
};

// Fecha local como YYYY-MM-DD para comparar "hoy"
const getLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const getRecordDateString = (dateStr: string) =>
  getLocalDateString(new Date(dateStr));

// Calcular IMC
const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Obtener categoría de IMC según OMS
const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi >= 30) {
    return { label: 'Obesidad', color: 'rojo' };
  } else if (bmi >= 25) {
    return { label: 'Sobrepeso', color: 'amarillo' };
  } else if (bmi >= 18.5) {
    return { label: 'Peso Normal', color: 'verde' };
  } else {
    return { label: 'Bajo Peso', color: 'azul' };
  }
};

export default function InsightsSection({
  userProfile,
  currentLesson,
  completedLessons = [],
  lessonVideoEnded = false,
  courseWithLessons,
  onWatchAgain,
}: InsightsSectionProps) {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [classStreak, setClassStreak] = useState(0);
  const [completedComplementsCount, setCompletedComplementsCount] = useState(0);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [bmi, setBmi] = useState<number>(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );
  const [localTargetWeight, setLocalTargetWeight] = useState<number | null>(
    userProfile?.target_weight || null,
  );
  const [savingGoal, setSavingGoal] = useState(false);

  // Cargar complementos completados del usuario
  useEffect(() => {
    const loadCompletedComplements = async () => {
      if (!user?.id) {
        setCompletedComplementsCount(0);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_complement_interactions')
          .select('id, is_completed, last_completed_at')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (error) {
          setCompletedComplementsCount(0);
          return;
        }

        setCompletedComplementsCount(data?.length || 0);
      } catch (error) {
        setCompletedComplementsCount(0);
      }
    };

    loadCompletedComplements();
  }, [user?.id]);

  // Calcular IMC y sincronizar meta de peso
  useEffect(() => {
    if (userProfile?.weight && userProfile?.height) {
      const currentWeight = userProfile.current_weight || userProfile.weight;
      const calculatedBMI = calculateBMI(currentWeight, userProfile.height);
      setBmi(calculatedBMI);
    }
    // Sincronizar meta de peso del perfil
    if (userProfile?.target_weight && localTargetWeight === null) {
      setLocalTargetWeight(userProfile.target_weight);
    }
  }, [userProfile, localTargetWeight]);

  // Calcular peso meta seguro según OMS
  const calculateSafeTargetWeight = (): number => {
    if (!userProfile?.weight || !userProfile?.height) return latestWeight;

    const currentWeight = userProfile.current_weight || userProfile.weight;
    const currentBMI = calculateBMI(currentWeight, userProfile.height);

    // Según OMS: meta realista es 5-10% de pérdida de peso para sobrepeso/obesidad
    if (currentBMI >= 30) {
      // Obesidad: 8% del peso actual
      return Math.round(currentWeight * 0.92 * 10) / 10;
    } else if (currentBMI >= 25) {
      // Sobrepeso: 7% del peso actual
      return Math.round(currentWeight * 0.93 * 10) / 10;
    } else if (currentBMI >= 18.5) {
      // Peso normal: mantener peso actual
      return currentWeight;
    } else {
      // Bajo peso: sugerir ganar hasta IMC 20
      const targetBMI = 20;
      return Math.round(targetBMI * (userProfile.height / 100) ** 2 * 10) / 10;
    }
  };

  // Abrir modal de meta con sugerencia pre-llenada
  const handleOpenGoalModal = () => {
    // Si ya hay una meta, usar esa. Si no, usar la sugerencia según OMS
    const weightToUse = localTargetWeight || calculateSafeTargetWeight();
    setTargetWeight(weightToUse.toString());
    setShowGoalModal(true);
  };

  // Guardar meta de peso
  const handleSaveGoal = async () => {
    const userId = user?.id;
    if (!userId || !targetWeight) return;

    try {
      setSavingGoal(true);
      const weightValue = parseFloat(targetWeight);
      if (isNaN(weightValue) || weightValue < 30 || weightValue > 300) {
        alert('Por favor ingresa un peso válido entre 30 y 300 kg');
        setSavingGoal(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          target_weight: weightValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Actualizar el estado local inmediatamente (sin recargar)
      setLocalTargetWeight(weightValue);

      // También actualizar userProfile si existe
      if (userProfile) {
        userProfile.target_weight = weightValue;
      }

      setShowGoalModal(false);
    } catch (error) {
      alert('Error al guardar la meta. Por favor intenta de nuevo.');
    } finally {
      setSavingGoal(false);
    }
  };

  // Calcular racha de días consecutivos (clases + complementos)
  const consecutiveDaysStreak = useMemo(() => {
    const lessonsCompleted = completedLessons?.length || 0;
    return lessonsCompleted + completedComplementsCount;
  }, [completedLessons, completedComplementsCount]);

  // Calcular minutos totales ejercitados (clases + complementos)
  // Cada complemento = 10 minutos
  const COMPLEMENT_DURATION_MINUTES = 10;

  const totalMinutesExercised = useMemo(() => {
    let totalMinutes = 0;

    // Sumar duration_minutes de todas las clases completadas
    if (completedLessons?.length && courseWithLessons?.lessons) {
      courseWithLessons.lessons.forEach((lesson: any) => {
        if (completedLessons.includes(lesson.id) && lesson.duration_minutes) {
          totalMinutes += Number(lesson.duration_minutes);
        }
      });
    }

    // Sumar minutos de complementos completados (10 min c/u)
    totalMinutes += completedComplementsCount * COMPLEMENT_DURATION_MINUTES;

    return totalMinutes;
  }, [completedLessons, courseWithLessons, completedComplementsCount]);

  // Calcular número total de clases + complementos completados (para la tarjeta Racha)
  useEffect(() => {
    const allCompleted = [...(completedLessons || [])];

    if (lessonVideoEnded && currentLesson?.id) {
      if (!allCompleted.includes(currentLesson.id)) {
        allCompleted.push(currentLesson.id);
      }
    }

    // Total = clases + complementos
    setClassStreak(allCompleted.length + completedComplementsCount);
  }, [
    completedLessons,
    lessonVideoEnded,
    currentLesson,
    completedComplementsCount,
  ]);

  // Días desde el registro (para el header "Días en Rogerbox")
  const daysInRogerbox = useMemo(() => {
    const createdAt = user?.created_at || userProfile?.created_at;
    if (!createdAt) return null;
    const created = new Date(createdAt);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    created.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - created.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return days >= 0 ? days : 0;
  }, [user?.created_at, userProfile?.created_at]);

  // Obtener la próxima clase
  useEffect(() => {
    if (courseWithLessons?.lessons && currentLesson?.id) {
      const lessons = courseWithLessons.lessons;
      const currentIndex = lessons.findIndex(
        (l: any) => l.id === currentLesson.id,
      );

      if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
        setNextLesson(lessons[currentIndex + 1]);
      } else {
        setNextLesson(null);
      }
    }
  }, [courseWithLessons, currentLesson]);

  // Obtener registros de peso (se piden los viernes)
  useEffect(() => {
    const fetchWeightHistory = async () => {
      if (!userProfile) {
        setWeightHistory([]);
        return;
      }

      const initialWeight = userProfile.weight || userProfile.current_weight;
      if (!initialWeight) {
        setWeightHistory([]);
        return;
      }

      if (!user?.id) {
        // Si no hay sesión, mostrar al menos el peso inicial con fecha actual
        const today = new Date().toISOString();

        setWeightHistory([
          {
            date: today,
            weight: initialWeight,
          },
        ]);
        return;
      }

      try {
        const { data: records, error } = await supabase
          .from('weight_records')
          .select('weight, record_date, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          // Mostrar peso inicial con fecha actual si hay error
          const today = new Date().toISOString();

          setWeightHistory([
            {
              date: today,
              weight: initialWeight,
            },
          ]);
          return;
        }

        if (records && records.length > 0) {
          // Usar created_at para ordenar y mostrar, pero record_date como fallback
          const history: WeightRecord[] = records.map((record) => ({
            date: record.created_at || record.record_date,
            weight: Number(record.weight),
          }));

          // No agregar peso inicial del onboarding si ya hay registros
          // Los registros en weight_records ya incluyen el peso inicial del onboarding
          setWeightHistory(history);
        } else {
          // Si no hay registros en weight_records, mostrar peso inicial del perfil con fecha actual
          // Esto solo debería pasar si el onboarding no guardó el registro inicial
          const today = new Date().toISOString();

          setWeightHistory([
            {
              date: today,
              weight: initialWeight,
            },
          ]);
        }
      } catch (error) {
        // Mostrar peso inicial con fecha actual si hay error
        const today = new Date().toISOString();

        setWeightHistory([
          {
            date: today,
            weight: initialWeight,
          },
        ]);
      }
    };

    fetchWeightHistory();
  }, [userProfile, user]);

  // Función para manejar el envío del peso (igual que en dashboard)
  const handleWeightSubmit = async (weight: number) => {
    try {
      if (!user?.id) {
        throw new Error('No hay sesión de usuario');
      }

      const now = new Date();
      const todayStr = getLocalDateString(now);
      const hasWeightToday = weightHistory.some(
        (r) => getRecordDateString(r.date) === todayStr,
      );
      if (hasWeightToday) {
        alert(
          'Ya tienes un registro de peso para hoy. Solo puedes registrar un peso por día.',
        );
        return;
      }

      const recordDate = now.toISOString().split('T')[0]; // YYYY-MM-DD para compatibilidad
      const notes = `Registro del ${now.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;

      // Guardar registro de peso usando el endpoint API (bypass RLS usando supabaseAdmin)
      const response = await fetch('/api/weight/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight,
          record_date: recordDate,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error desconocido' }));
        throw new Error(
          errorData.error || 'Error al guardar el registro de peso',
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar el registro de peso');
      }

      const weightData = result.data;

      // Recargar el historial completo de peso
      const { data: records } = await supabase
        .from('weight_records')
        .select('weight, record_date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (records && records.length > 0) {
        // Usar created_at para ordenar y mostrar, pero record_date como fallback
        const history: WeightRecord[] = records.map((record) => ({
          date: record.created_at || record.record_date,
          weight: Number(record.weight),
        }));

        // No agregar peso inicial del onboarding si ya hay registros
        // Los registros en weight_records ya incluyen el peso inicial del onboarding
        setWeightHistory(history);
      } else {
        // Si no hay registros, mostrar al menos el peso inicial con fecha actual
        const initialWeight =
          userProfile?.weight || userProfile?.current_weight;
        if (initialWeight) {
          const today = new Date().toISOString();

          setWeightHistory([
            {
              date: today,
              weight: Number(initialWeight),
            },
          ]);
        }
      }
    } catch (error: any) {
      // Mostrar mensaje de error más amigable
      const errorMessage =
        error?.message ||
        'Error al guardar el peso. Por favor, intenta de nuevo.';
      alert(errorMessage);
      throw error;
    }
  };

  // Comprobar si ya hay un registro de peso hoy (solo uno por día)
  const todayStr = getLocalDateString(new Date());
  const hasWeightToday = weightHistory.some(
    (r) => getRecordDateString(r.date) === todayStr,
  );

  // Limitar la cantidad de registros mostrados para mantener el gráfico limpio
  const MAX_VISIBLE_RECORDS = 12; // Máximo de puntos a mostrar
  const displayHistory =
    weightHistory.length > MAX_VISIBLE_RECORDS
      ? [
          weightHistory[0], // Siempre incluir el primer registro (peso inicial)
          ...weightHistory.slice(-(MAX_VISIBLE_RECORDS - 1)), // Y los últimos N-1 registros
        ]
      : weightHistory;

  // Preparar datos para la gráfica (usando displayHistory en lugar de weightHistory)
  const hasWeightData = displayHistory.length > 0;
  const hasWeightTrend = displayHistory.length >= 2;
  const initialWeight = hasWeightData
    ? displayHistory[0].weight
    : Number(userProfile?.current_weight || userProfile?.weight || 0);
  const latestWeight = hasWeightData
    ? displayHistory[displayHistory.length - 1].weight
    : Number(userProfile?.current_weight || userProfile?.weight || 0);
  const weightDifference = latestWeight - initialWeight;
  const weightValues = displayHistory.map((record) => record.weight);

  // Calcular rango dinámico basado en el peso actual del usuario
  const currentWeightForRange = latestWeight || initialWeight || 70;
  // Crear un rango de ±10kg alrededor del peso actual, pero mínimo 5kg de rango
  const rangePadding = Math.max(5, currentWeightForRange * 0.15); // 15% del peso o mínimo 5kg
  const minWeightValue = weightValues.length
    ? Math.min(...weightValues, currentWeightForRange - rangePadding)
    : Math.max(30, currentWeightForRange - rangePadding);
  const maxWeightValue = weightValues.length
    ? Math.max(...weightValues, currentWeightForRange + rangePadding)
    : currentWeightForRange + rangePadding;
  const weightRange = maxWeightValue - minWeightValue || 10;

  // Calcular valores del eje Y (5 líneas de referencia)
  const yAxisValues = [0, 1, 2, 3, 4].map((i) => {
    return maxWeightValue - i * (weightRange / 4);
  });

  // Obtener colores del IMC
  const bmiColors = bmi > 0 ? getBMIColor(bmi) : null;
  const bmiCategory = bmi > 0 ? getBMICategory(bmi) : null;

  // Modo dashboard vs completion
  const isCompletionMode = lessonVideoEnded && currentLesson;

  // En modo completion mostramos la vista aunque no haya perfil (para que siempre se vea "Clase completada" y próxima clase)
  if (!userProfile && !isCompletionMode) return null;

  // Modo completion (cuando termina una clase)
  if (isCompletionMode) {
    const nextLessonImage =
      nextLesson?.preview_image ||
      nextLesson?.thumbnail ||
      courseWithLessons?.preview_image ||
      courseWithLessons?.image_url ||
      courseWithLessons?.thumbnail_url;

    return (
      <div className="w-full h-full grid grid-cols-[1fr_1fr] bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-0 overflow-hidden">
        {nextLesson && (
          <div className="min-w-0 min-h-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="relative w-full flex-1 min-h-[200px] rounded-l-xl overflow-hidden bg-gray-900 flex items-center justify-center">
              {nextLessonImage ? (
                <>
                  <img
                    src={nextLessonImage}
                    alt={nextLesson.title}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    style={{
                      filter:
                        'grayscale(20%) brightness(97%) contrast(99%) saturate(90%) opacity(0.85)',
                    }}
                  />
                </>
              ) : (
                <Play className="w-12 h-12 text-gray-500 flex-shrink-0" />
              )}
            </div>
          </div>
        )}

        {nextLesson && (
          <div className="min-w-0 flex flex-col p-5 min-h-0 overflow-auto">
            <div className="space-y-2 mb-6 mt-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Clase Completada
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tu racha va en{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {consecutiveDaysStreak}
                  </span>{' '}
                  {consecutiveDaysStreak === 1 ? 'día' : 'días'} consecutivos
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 mb-6"></div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Próxima Clase
                </h3>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {nextLesson.title}
              </p>
              {nextLesson.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {nextLesson.description}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Disponible mañana
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    La clase estará disponible desde hoy a las{' '}
                    <span className="font-bold">12:00am</span>
                  </p>
                </div>
              </div>
            </div>

            {onWatchAgain && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={onWatchAgain}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-[#85ea10] bg-[#85ea10]/10 text-[#85ea10] font-semibold text-sm hover:bg-[#85ea10]/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Ver de nuevo
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  Puedes repetir la clase todas las veces que quieras hoy
                </p>
              </div>
            )}

            <div className="flex justify-center mb-6 mt-2">
              <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </div>

            <div className="pt-6 mt-auto border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">Nos vemos mañana</p>
              </div>
            </div>
          </div>
        )}

        {!nextLesson && (
          <div className="flex-1 p-3 flex items-center justify-center min-h-0">
            <div className="text-center max-w-xs">
              <div className="w-12 h-12 rounded-full bg-[#85ea10]/20 flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-[#85ea10]" />
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                ¡Curso finalizado!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Compártelo en el feed y celebra con la comunidad.
              </p>
              <ShareCourseToFeedButton
                courseTitle={courseWithLessons?.title}
                courseImageUrl={courseWithLessons?.preview_image}
                onSuccess={(postId) => router.push(`/feed#post-${postId}`)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modo dashboard: mostrar insights/progreso completo
  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 min-h-0 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col space-y-3 sm:space-y-4">
        {/* Header - títulos y contador con jerarquía consistente en mobile */}
        <div className="flex items-start sm:items-center justify-between flex-shrink-0 gap-2">
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-0.5 sm:mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#85ea10] flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                Tu Progreso
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Sigue así, vas por buen camino
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-[#85ea10]">
              {daysInRogerbox != null ? daysInRogerbox : '—'}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
              {daysInRogerbox === 1 ? 'Día en ROGERBOX' : 'Días en ROGERBOX'}
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 tarjetas: iconos y texto más proporcionados en mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0">
          {/* Racha (clases + complementos) */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-2.5 sm:p-3 border border-orange-200 dark:border-orange-800 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
              <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Racha
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black tabular-nums text-orange-600 dark:text-orange-400 leading-none flex-shrink-0">
                {consecutiveDaysStreak}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Clases y retos completados
            </div>
          </div>

          {/* Minutos ejercitados (clases + complementos) */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-2.5 sm:p-3 border border-purple-200 dark:border-purple-800 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
              <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Minutos
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black tabular-nums text-purple-600 dark:text-purple-400 leading-none flex-shrink-0">
                {totalMinutesExercised}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Ejercitados en total
            </div>
          </div>

          {/* Peso actual */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-2.5 sm:p-3 border border-blue-200 dark:border-blue-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <Weight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Peso
                </span>
              </div>
              <button
                onClick={handleOpenGoalModal}
                className="rounded-full p-1 sm:p-1.5 border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Actualizar meta"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <div className="flex items-start justify-start gap-2 sm:gap-3 flex-shrink-0">
              <div className="flex flex-col min-w-0">
                <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                  {latestWeight.toFixed(1)} kg
                </div>
                <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  Peso actual
                </div>
              </div>

              {localTargetWeight ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#85ea10] flex-shrink-0 mt-1" />
                  <div className="flex flex-col min-w-0">
                    <div className="text-base sm:text-lg font-bold text-[#1e3a8a] dark:text-[#85ea10]">
                      {localTargetWeight} kg
                    </div>
                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      Peso meta
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleOpenGoalModal}
                  className="bg-[#1e3a8a] hover:bg-[#152a6a] text-white text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-md transition-colors shadow-md flex-shrink-0"
                >
                  Agregar meta
                </button>
              )}
            </div>
          </div>

          {/* IMC con semáforo */}
          {bmi > 0 && bmiColors && bmiCategory && (
            <div
              className={`bg-gradient-to-br ${bmiColors.background} rounded-lg p-2.5 sm:p-3 border ${bmiColors.border}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${
                      bmiCategory.color === 'rojo'
                        ? 'bg-red-500'
                        : bmiCategory.color === 'amarillo'
                          ? 'bg-yellow-500'
                          : bmiCategory.color === 'verde'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                    }`}
                  ></div>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200">
                    IMC
                  </span>
                </div>
                <button
                  onClick={() => setShowBMIModal(true)}
                  className="rounded-full p-1 sm:p-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  title="Información sobre IMC"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div
                className={`text-base sm:text-xl font-bold ${bmiColors.text}`}
              >
                {bmi.toFixed(1)}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {bmiCategory.label}
              </div>
            </div>
          )}
        </div>

        {/* Gráfica de Progreso de Peso - mismo nivel de título que Tu Progreso en mobile */}
        {hasWeightData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0 gap-2">
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#85ea10] flex-shrink-0" />
                <h3 className="text-base sm:text-sm font-bold sm:font-semibold text-gray-900 dark:text-white truncate">
                  Progreso de Peso
                </h3>
              </div>
              <button
                onClick={() => {
                  if (hasWeightToday) {
                    alert(
                      'Ya tienes un registro de peso para hoy. Solo puedes registrar un peso por día.',
                    );
                    return;
                  }
                  setShowWeightModal(true);
                }}
                disabled={hasWeightToday}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${
                  hasWeightToday
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-[#85ea10] hover:bg-[#7dd30f] text-black'
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  {hasWeightToday ? 'Ya registrado hoy' : 'Registrar peso'}
                </span>
              </button>
            </div>

            {/* Gráfica simplificada con fondo blanco - más grande */}
            <div className="relative w-full flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg">
              <svg
                className="w-full h-full"
                viewBox="0 0 600 360"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Líneas de referencia horizontales (eje Y) */}
                {yAxisValues.map((weightValue, i) => {
                  const y = 60 + i * 60; // Aumentado padding superior de 40 a 60
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1="80" // Aumentado padding izquierdo de 60 a 80
                        y1={y}
                        x2="540"
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        className="dark:stroke-gray-700"
                      />
                      <text
                        x="15"
                        y={y + 5}
                        className="text-[12px] fill-gray-600 dark:fill-gray-400"
                        textAnchor="start"
                        fontWeight="600"
                      >
                        {weightValue.toFixed(1)}kg
                      </text>
                    </g>
                  );
                })}

                {/* Etiquetas de fechas en el eje X */}
                {displayHistory.map((record, index) => {
                  const x =
                    displayHistory.length === 1
                      ? 300 // Centrado cuando solo hay un punto
                      : 80 +
                        (index / Math.max(displayHistory.length - 1, 1)) * 460; // Ajustado: empieza en 80, rango de 460

                  // Formatear fecha para mostrar día y mes
                  const date = new Date(record.date);
                  const day = date.getDate();
                  const month = date.toLocaleDateString('es-ES', {
                    month: 'short',
                  });
                  const formattedLabel = `${day} ${month}`;

                  return (
                    <text
                      key={`date-${index}`}
                      x={x}
                      y={330}
                      className="text-[10px] fill-gray-500 dark:fill-gray-400"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {formattedLabel}
                    </text>
                  );
                })}

                {/* Línea de conexión entre puntos - solo si hay 2 o más */}
                {hasWeightTrend && displayHistory.length >= 2 && (
                  <polyline
                    points={displayHistory
                      .map((record, index) => {
                        const x =
                          displayHistory.length === 1
                            ? 300
                            : 80 +
                              (index / Math.max(displayHistory.length - 1, 1)) *
                                460; // Ajustado
                        const y =
                          60 +
                          ((maxWeightValue - record.weight) / weightRange) *
                            240; // Ajustado: empieza en 60, rango de 240
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Puntos de datos con colores RogerBox */}
                {displayHistory.map((record, index) => {
                  const x =
                    displayHistory.length === 1
                      ? 300 // Centrado cuando solo hay un punto
                      : 80 +
                        (index / Math.max(displayHistory.length - 1, 1)) * 460; // Ajustado: empieza en 80
                  const y =
                    60 + ((maxWeightValue - record.weight) / weightRange) * 240; // Ajustado: empieza en 60, rango de 240
                  const isFirst = index === 0;
                  const isLast = index === displayHistory.length - 1;
                  const formattedDate =
                    formatDateLabel(record.date) || 'Inicio';

                  // Color: azul oscuro para el primero, verde RogerBox para el último, azul oscuro para intermedios
                  const pointColor = isFirst
                    ? '#1e3a8a'
                    : isLast
                      ? '#85ea10'
                      : '#1e3a8a';

                  // Siempre poner las etiquetas arriba del punto para mejor legibilidad
                  const labelY = y - 32;

                  return (
                    <g key={index}>
                      {/* Punto principal */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? 9 : 8}
                        fill={pointColor}
                        stroke="white"
                        strokeWidth="3"
                      />

                      {/* Etiqueta con peso (fecha solo en hover) - card cuadrado */}
                      <g
                        transform={`translate(${x}, ${labelY})`}
                        className="cursor-pointer"
                      >
                        {/* Tooltip nativo de SVG para mostrar fecha en hover */}
                        <title>{formattedDate}</title>
                        <rect
                          x={-30}
                          y={-14}
                          width={60}
                          height={28}
                          rx="6"
                          fill={isLast ? '#dcfce7' : 'white'}
                          className={isLast ? '' : 'dark:fill-gray-900'}
                          stroke={pointColor}
                          strokeWidth="2"
                        />
                        {/* Peso - siempre visible, texto negro para buen contraste */}
                        <text
                          x={0}
                          y={2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-[12px] font-bold"
                          fill="#171717"
                        >
                          {record.weight.toFixed(1)}kg
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Información adicional - siempre visible sin scroll */}
              {hasWeightTrend && (
                <div className="mt-2 text-center flex-shrink-0">
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    {weightDifference < 0 ? (
                      <span className="text-green-700 dark:text-green-400 font-semibold">
                        ↓ Has bajado {Math.abs(weightDifference).toFixed(1)}kg
                        desde el inicio
                      </span>
                    ) : weightDifference > 0 ? (
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        ↑ Has subido {weightDifference.toFixed(1)}kg desde el
                        inicio
                      </span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">
                        Peso estable desde el inicio
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para registrar peso - usando el mismo componente que los viernes */}
        {showWeightModal && (
          <WeeklyWeightReminder
            onClose={() => setShowWeightModal(false)}
            onWeightSubmit={handleWeightSubmit}
            isWeeklyReminder={false}
          />
        )}

        {/* Modal para establecer meta de peso */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Establece tu Meta de Peso
                </h2>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Peso actual */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Tu peso actual:
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {latestWeight.toFixed(1)} kg
                  </div>
                </div>

                {/* Información según OMS */}
                {bmi > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Recomendación según OMS:
                    </div>
                    {bmi >= 30 ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Tienes obesidad (IMC ≥ 30). Se recomienda una pérdida
                        del 5-10% del peso actual como primer objetivo seguro.
                      </p>
                    ) : bmi >= 25 ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Tienes sobrepeso (IMC 25-29.9). Se recomienda una
                        pérdida del 5-10% del peso actual como objetivo seguro.
                      </p>
                    ) : bmi >= 18.5 ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Tu peso está en el rango normal (IMC 18.5-24.9). Puedes
                        mantener tu peso actual o establecer una meta de
                        tonificación.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Tienes bajo peso (IMC &lt; 18.5). Se recomienda
                        consultar con un profesional de la salud.
                      </p>
                    )}
                  </div>
                )}

                {/* Input para peso meta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso Objetivo (kg)
                  </label>
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Ej: 65.0"
                    step="0.1"
                    min="30"
                    max="300"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Peso sugerido según OMS:{' '}
                    <span className="font-semibold text-[#85ea10]">
                      {calculateSafeTargetWeight().toFixed(1)} kg
                    </span>
                  </p>
                </div>

                {/* Nota importante */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Nota:</strong> Esta es una guía general. Consulta
                    con un profesional de la salud para una evaluación
                    personalizada.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowGoalModal(false)}
                  disabled={savingGoal}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGoal}
                  disabled={savingGoal}
                  className="flex-1 px-4 py-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingGoal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Meta'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de información del IMC */}
        {showBMIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
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

                {bmi > 0 && bmiCategory && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tu IMC actual:</strong> {bmi.toFixed(1)}
                      <br />
                      <strong>Clasificación:</strong> {bmiCategory.label}
                    </p>
                  </div>
                )}

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
    </div>
  );
}
