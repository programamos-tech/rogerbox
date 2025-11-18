'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Zap, Award, Play, Calendar, Clock, ArrowRight, Pill, Weight, TrendingUp, Activity, Plus, Info, X, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBMIColor } from '@/lib/goalSuggestion';
import WeeklyWeightReminder from '@/components/WeeklyWeightReminder';

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
  effectivePurchase
}: InsightsSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [classStreak, setClassStreak] = useState(0);
  const [consecutiveDaysStreak, setConsecutiveDaysStreak] = useState(0);
  const [totalMinutesExercised, setTotalMinutesExercised] = useState(0);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [bmi, setBmi] = useState<number>(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Calcular IMC
  useEffect(() => {
    if (userProfile?.weight && userProfile?.height) {
      const currentWeight = userProfile.current_weight || userProfile.weight;
      const calculatedBMI = calculateBMI(currentWeight, userProfile.height);
      setBmi(calculatedBMI);
    }
  }, [userProfile]);

  // Calcular peso meta seguro según OMS
  const calculateSafeTargetWeight = (): number => {
    if (!userProfile?.weight || !userProfile?.height) return latestWeight;
    
    const currentWeight = userProfile.current_weight || userProfile.weight;
    const currentBMI = calculateBMI(currentWeight, userProfile.height);
    
    // Según OMS: meta realista es 5-10% de pérdida de peso para sobrepeso/obesidad
    if (currentBMI >= 30) {
      // Obesidad: 8% del peso actual
      return Math.round((currentWeight * 0.92) * 10) / 10;
    } else if (currentBMI >= 25) {
      // Sobrepeso: 7% del peso actual
      return Math.round((currentWeight * 0.93) * 10) / 10;
    } else if (currentBMI >= 18.5) {
      // Peso normal: mantener peso actual
      return currentWeight;
    } else {
      // Bajo peso: sugerir ganar hasta IMC 20
      const targetBMI = 20;
      return Math.round((targetBMI * Math.pow(userProfile.height / 100, 2)) * 10) / 10;
    }
  };

  // Abrir modal de meta con sugerencia pre-llenada
  const handleOpenGoalModal = () => {
    // Si ya hay una meta, usar esa. Si no, usar la sugerencia según OMS
    const weightToUse = userProfile?.target_weight || calculateSafeTargetWeight();
    setTargetWeight(weightToUse.toString());
    setShowGoalModal(true);
  };

  // Guardar meta de peso
  const handleSaveGoal = async () => {
    const userId = (session as any)?.user?.id;
    if (!userId || !targetWeight) return;

    try {
      const weightValue = parseFloat(targetWeight);
      if (isNaN(weightValue) || weightValue < 30 || weightValue > 300) {
        alert('Por favor ingresa un peso válido entre 30 y 300 kg');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          target_weight: weightValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Actualizar el perfil local
      if (userProfile) {
        userProfile.target_weight = weightValue;
      }

      setShowGoalModal(false);
      // Recargar la página para actualizar los datos
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar meta:', error);
      alert('Error al guardar la meta. Por favor intenta de nuevo.');
    }
  };

  // Calcular racha de días consecutivos
  useEffect(() => {
    const calculateConsecutiveDaysStreak = async () => {
      if (!effectivePurchase?.start_date || !courseWithLessons?.lessons || !completedLessons?.length) {
        setConsecutiveDaysStreak(0);
        return;
      }

      try {
        // Obtener start_date del curso
        const startDate = new Date(effectivePurchase.start_date);
        startDate.setHours(0, 0, 0, 0);
        
        // Crear un mapa de días con clases completadas
        // Cada clase corresponde a un día desde el inicio (basado en lesson_order)
        const daysWithClasses = new Set<number>();
        
        courseWithLessons.lessons.forEach((lesson: any) => {
          if (completedLessons.includes(lesson.id)) {
            // El lesson_order indica qué día corresponde (0 = primer día, 1 = segundo día, etc.)
            const dayIndex = lesson.lesson_order !== undefined ? lesson.lesson_order : 
                           courseWithLessons.lessons.findIndex((l: any) => l.id === lesson.id);
            daysWithClasses.add(dayIndex);
          }
        });

        if (daysWithClasses.size === 0) {
          setConsecutiveDaysStreak(0);
          return;
        }

        // Obtener el día más reciente con clase completada
        const maxDay = Math.max(...Array.from(daysWithClasses));
        
        // Calcular racha consecutiva desde el día más reciente hacia atrás
        let streak = 0;
        for (let day = maxDay; day >= 0; day--) {
          if (daysWithClasses.has(day)) {
            streak++;
          } else {
            // Si encontramos un día sin clase, la racha se rompe
            break;
          }
        }

        setConsecutiveDaysStreak(streak);
      } catch (error) {
        console.error('Error calculando racha de días:', error);
        setConsecutiveDaysStreak(0);
      }
    };

    calculateConsecutiveDaysStreak();
  }, [completedLessons, courseWithLessons, effectivePurchase]);

  // Calcular minutos totales ejercitados
  useEffect(() => {
    const calculateTotalMinutes = async () => {
      if (!completedLessons?.length || !courseWithLessons?.lessons) {
        setTotalMinutesExercised(0);
        return;
      }

      try {
        let totalMinutes = 0;
        
        // Sumar duration_minutes de todas las clases completadas
        courseWithLessons.lessons.forEach((lesson: any) => {
          if (completedLessons.includes(lesson.id) && lesson.duration_minutes) {
            totalMinutes += Number(lesson.duration_minutes);
          }
        });

        setTotalMinutesExercised(totalMinutes);
      } catch (error) {
        console.error('Error calculando minutos totales:', error);
        setTotalMinutesExercised(0);
      }
    };

    calculateTotalMinutes();
  }, [completedLessons, courseWithLessons]);

  // Calcular número total de clases completadas
  useEffect(() => {
    let allCompleted = [...(completedLessons || [])];
    
    if (lessonVideoEnded && currentLesson?.id) {
      if (!allCompleted.includes(currentLesson.id)) {
        allCompleted.push(currentLesson.id);
      }
    }
    
    setClassStreak(allCompleted.length);
  }, [completedLessons, lessonVideoEnded, currentLesson]);

  // Obtener la próxima clase
  useEffect(() => {
    if (courseWithLessons?.lessons && currentLesson?.id) {
      const lessons = courseWithLessons.lessons;
      const currentIndex = lessons.findIndex((l: any) => l.id === currentLesson.id);
      
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
      
      if (!(session as any)?.user?.id) {
        // Si no hay sesión, mostrar al menos el peso inicial con fecha actual
        const today = new Date().toISOString();
        
        setWeightHistory([{
          date: today,
          weight: initialWeight
        }]);
        return;
      }
      
      try {
        const { data: records, error } = await supabase
          .from('weight_records')
          .select('weight, record_date, created_at')
          .eq('user_id', (session as any).user.id)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.warn('⚠️ Error obteniendo historial de peso:', error.message);
          // Mostrar peso inicial con fecha actual si hay error
          const today = new Date().toISOString();
          
          setWeightHistory([{
            date: today,
            weight: initialWeight
          }]);
          return;
        }
        
        if (records && records.length > 0) {
          // Usar created_at para ordenar y mostrar, pero record_date como fallback
          const history: WeightRecord[] = records.map(record => ({
            date: record.created_at || record.record_date,
            weight: Number(record.weight)
          }));
          
          // No agregar peso inicial del onboarding si ya hay registros
          // Los registros en weight_records ya incluyen el peso inicial del onboarding
          setWeightHistory(history);
        } else {
          // Si no hay registros en weight_records, mostrar peso inicial del perfil con fecha actual
          // Esto solo debería pasar si el onboarding no guardó el registro inicial
          const today = new Date().toISOString();
          
          setWeightHistory([{
            date: today,
            weight: initialWeight
          }]);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo historial de peso:', error);
        // Mostrar peso inicial con fecha actual si hay error
        const today = new Date().toISOString();
        
        setWeightHistory([{
          date: today,
          weight: initialWeight
        }]);
      }
    };
    
    fetchWeightHistory();
  }, [userProfile, session]);

  // Función para manejar el envío del peso (igual que en dashboard)
  const handleWeightSubmit = async (weight: number) => {
    try {
      if (!(session as any)?.user?.id) {
        throw new Error('No hay sesión de usuario');
      }
      
      // Usar timestamp completo para permitir múltiples registros por día
      const now = new Date();
      const recordDate = now.toISOString().split('T')[0]; // YYYY-MM-DD para compatibilidad
      const recordTimestamp = now.toISOString(); // Timestamp completo para ordenar
      
      // Guardar registro de peso en weight_records (siempre insertar nuevo, nunca actualizar)
      const { data: weightData, error: weightRecordError } = await supabase
        .from('weight_records')
        .insert({
          user_id: (session as any).user.id,
          weight: weight,
          record_date: recordDate,
          notes: `Registro del ${now.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`
        })
        .select();
      
      if (weightRecordError) {
        console.error('Error guardando registro de peso:', {
          error: weightRecordError,
          message: weightRecordError?.message,
          details: weightRecordError?.details,
          hint: weightRecordError?.hint,
          code: weightRecordError?.code
        });
        
        // Mensaje más amigable si la tabla no existe
        let errorMessage = 'Error al guardar el registro de peso. Por favor, intenta de nuevo.';
        if (weightRecordError?.message?.includes('Could not find the table') || 
            weightRecordError?.message?.includes('relation') ||
            weightRecordError?.code === 'PGRST116') {
          errorMessage = 'La tabla de registros de peso no está configurada. Por favor, contacta al administrador.';
        } else if (weightRecordError?.message) {
          errorMessage = weightRecordError.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // Actualizar también el peso actual en el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_weight: weight,
          last_weight_update: recordDate
        })
        .eq('id', (session as any).user.id);
      
      if (profileError) {
        console.error('Error actualizando perfil:', {
          error: profileError,
          message: profileError?.message
        });
        // No lanzar error aquí, el registro de peso ya se guardó
      }
      
      // Recargar el historial completo de peso
      const { data: records } = await supabase
        .from('weight_records')
        .select('weight, record_date, created_at')
        .eq('user_id', (session as any).user.id)
        .order('created_at', { ascending: true });

      if (records && records.length > 0) {
        // Usar created_at para ordenar y mostrar, pero record_date como fallback
        const history: WeightRecord[] = records.map(record => ({
          date: record.created_at || record.record_date,
          weight: Number(record.weight)
        }));
        
        // No agregar peso inicial del onboarding si ya hay registros
        // Los registros en weight_records ya incluyen el peso inicial del onboarding
        setWeightHistory(history);
        console.log('✅ Historial de peso actualizado:', history.length, 'registros');
      } else {
        // Si no hay registros, mostrar al menos el peso inicial con fecha actual
        const initialWeight = userProfile?.weight || userProfile?.current_weight;
        if (initialWeight) {
          const today = new Date().toISOString();
          
          setWeightHistory([{
            date: today,
            weight: Number(initialWeight)
          }]);
        }
      }
      
      console.log('✅ Peso actualizado exitosamente:', weight, 'kg');
    } catch (error: any) {
      console.error('Error al actualizar peso:', error);
      // Mostrar mensaje de error más amigable
      const errorMessage = error?.message || 'Error al guardar el peso. Por favor, intenta de nuevo.';
      alert(errorMessage);
      throw error;
    }
  };

  // Limitar la cantidad de registros mostrados para mantener el gráfico limpio
  const MAX_VISIBLE_RECORDS = 12; // Máximo de puntos a mostrar
  const displayHistory = weightHistory.length > MAX_VISIBLE_RECORDS
    ? [
        weightHistory[0], // Siempre incluir el primer registro (peso inicial)
        ...weightHistory.slice(-(MAX_VISIBLE_RECORDS - 1)) // Y los últimos N-1 registros
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
  const weightValues = displayHistory.map(record => record.weight);
  
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
  const yAxisValues = [0, 1, 2, 3, 4].map(i => {
    return maxWeightValue - (i * (weightRange / 4));
  });

  // Obtener colores del IMC
  const bmiColors = bmi > 0 ? getBMIColor(bmi) : null;
  const bmiCategory = bmi > 0 ? getBMICategory(bmi) : null;

  // Modo dashboard vs completion
  const isCompletionMode = lessonVideoEnded && currentLesson;
  
  if (!userProfile) return null;
  
  // Modo completion (cuando termina una clase)
  if (isCompletionMode) {
  return (
    <div className="w-full h-full flex flex-row bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-0 overflow-hidden">
      {nextLesson && (
        <div className="w-1/2 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <div className="relative w-full h-full rounded-l-xl overflow-hidden bg-white dark:bg-gray-900">
            {nextLesson.preview_image || nextLesson.thumbnail ? (
              <Image
                src={nextLesson.preview_image || nextLesson.thumbnail}
                alt={nextLesson.title}
                fill
                sizes="50vw"
                loading="lazy"
                quality={85}
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  filter: 'grayscale(20%) brightness(97%) contrast(99%) saturate(90%) opacity(0.85)'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {nextLesson && (
        <div className="w-1/2 flex-shrink-0 flex flex-col p-5 min-h-0 h-full">
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
                  Tu racha va en <span className="font-bold text-gray-900 dark:text-white">{consecutiveDaysStreak}</span> {consecutiveDaysStreak === 1 ? 'día' : 'días'} consecutivos
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
                  La clase estará disponible desde hoy a las <span className="font-bold">12:00am</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              router.push('/dashboard');
              setTimeout(() => {
                  const complementSection = document.querySelector('[data-section="complementos"]');
                if (complementSection) {
                  complementSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }}
            className="w-full max-w-sm mx-auto bg-gradient-to-r from-[#85ea10] to-[#7dd30f] hover:from-[#7dd30f] hover:to-[#6bc00e] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-[#85ea10]/50 hover:scale-[1.02] flex items-center justify-center space-x-2 group mt-2 mb-4"
          >
            <Pill className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span>Toma tu complemento</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 mb-4">
            Toma un plan nutricional y mira resultados un <span className="font-bold text-gray-700 dark:text-gray-300">40%</span> más rápido!
          </p>

          <button
            onClick={() => {
              router.push('/dashboard');
              setTimeout(() => {
                  const nutritionSection = document.querySelector('[data-section="planes-nutricionales"]');
                if (nutritionSection) {
                  nutritionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }}
            className="w-full max-w-sm mx-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center space-x-2 group mb-6"
          >
            <span>Ver planes nutricionales</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          <div className="flex justify-center mb-6 mt-2">
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </div>

          <div className="pt-6 mt-auto border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">Nos vemos mañana</p>
            </div>
          </div>
        </div>
      )}

      {!nextLesson && (
        <div className="flex-1 p-3 flex items-center justify-center min-h-0">
          <div className="text-center">
            <Award className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Has completado todas las clases
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nos vemos mañana
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

  // Modo dashboard: mostrar insights/progreso completo
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-5 h-5 text-[#85ea10]" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Tu Progreso
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sigue así, vas por buen camino
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#85ea10]">
                {classStreak}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {classStreak === 1 ? 'clase' : 'clases'} completadas
              </div>
            </div>
          </div>

        {/* Stats Grid - 4 tarjetas */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          {/* Racha de días consecutivos */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-1.5 mb-1.5">
                <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Racha
                </span>
              </div>
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {consecutiveDaysStreak}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Días consecutivos sin perder una clase
              </div>
            </div>

          {/* Minutos ejercitados */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Minutos
              </span>
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {totalMinutesExercised}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Ejercitados
              </div>
            </div>

            {/* Peso actual */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800 flex flex-col h-full">
              {/* Título con icono de editar */}
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Weight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Peso
                  </span>
                </div>
                <button
                  onClick={handleOpenGoalModal}
                  className="bg-[#85ea10] hover:bg-[#7dd30f] text-white rounded-full p-1.5 transition-colors shadow-sm"
                  title="Actualizar meta"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              {/* Valores en una línea horizontal alineada a la izquierda */}
              <div className="flex items-start justify-start gap-3 flex-shrink-0">
                <div className="flex flex-col">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {latestWeight.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Peso actual
                  </div>
                </div>

                {/* Meta de peso con flecha */}
                {userProfile.target_weight ? (
                  <>
                    <ArrowRight className="w-4 h-4 text-[#85ea10] flex-shrink-0 mt-1" />
                    <div className="flex flex-col">
                      <div className="text-lg font-bold text-[#1e3a8a] dark:text-[#85ea10]">
                        {userProfile.target_weight} kg
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Peso meta
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleOpenGoalModal}
                    className="bg-[#1e3a8a] hover:bg-[#152a6a] text-white text-xs font-semibold px-2 py-1 rounded-md transition-colors shadow-md flex-shrink-0"
                  >
                    Agregar meta
                  </button>
                )}
              </div>
            </div>

          {/* IMC con semáforo */}
          {bmi > 0 && bmiColors && bmiCategory && (
            <div className={`bg-gradient-to-br ${bmiColors.background} rounded-lg p-3 border ${bmiColors.border}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    bmiCategory.color === 'rojo' ? 'bg-red-500' :
                    bmiCategory.color === 'amarillo' ? 'bg-yellow-500' :
                    bmiCategory.color === 'verde' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    IMC
                  </span>
                </div>
                <button
                  onClick={() => setShowBMIModal(true)}
                  className="bg-[#85ea10] hover:bg-[#7dd30f] text-white rounded-full p-1.5 transition-colors shadow-sm"
                  title="Información sobre IMC"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <div className={`text-xl font-bold ${bmiColors.text}`}>
                {bmi.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {bmiCategory.label}
              </div>
            </div>
          )}
          </div>

          {/* Gráfica de Progreso de Peso */}
          {hasWeightData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#85ea10]" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Progreso de Peso
                  </h3>
                </div>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-[#85ea10] hover:bg-[#7dd30f] text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Registrar peso</span>
                </button>
              </div>
              
              {/* Gráfica simplificada con fondo blanco - más grande */}
              <div className="relative w-full flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-full h-full" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet">
                  {/* Líneas de referencia horizontales (eje Y) */}
                  {yAxisValues.map((weightValue, i) => {
                    const y = 60 + (i * 60); // Aumentado padding superior de 40 a 60
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
                    const x = displayHistory.length === 1 
                      ? 300 // Centrado cuando solo hay un punto
                      : 80 + (index / Math.max(displayHistory.length - 1, 1)) * 460; // Ajustado: empieza en 80, rango de 460
                    
                    // Formatear fecha para mostrar día y mes
                    const date = new Date(record.date);
                    const day = date.getDate();
                    const month = date.toLocaleDateString('es-ES', { month: 'short' });
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
                      points={displayHistory.map((record, index) => {
                        const x = displayHistory.length === 1 
                          ? 300
                          : 80 + (index / Math.max(displayHistory.length - 1, 1)) * 460; // Ajustado
                        const y = 60 + ((maxWeightValue - record.weight) / weightRange) * 240; // Ajustado: empieza en 60, rango de 240
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  
                  {/* Puntos de datos con colores RogerBox */}
                  {displayHistory.map((record, index) => {
                    const x = displayHistory.length === 1 
                      ? 300 // Centrado cuando solo hay un punto
                      : 80 + (index / Math.max(displayHistory.length - 1, 1)) * 460; // Ajustado: empieza en 80
                    const y = 60 + ((maxWeightValue - record.weight) / weightRange) * 240; // Ajustado: empieza en 60, rango de 240
                    const isFirst = index === 0;
                    const isLast = index === displayHistory.length - 1;
                    const formattedDate = formatDateLabel(record.date) || 'Inicio';
                    
                    // Color: azul oscuro para el primero, verde RogerBox para el último, azul oscuro para intermedios
                    const pointColor = isFirst ? "#1e3a8a" : isLast ? "#85ea10" : "#1e3a8a";
                    
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
                            fill="white"
                            className="dark:fill-gray-900"
                            stroke={pointColor}
                            strokeWidth="2"
                          />
                          {/* Peso - siempre visible, centrado verticalmente */}
                          <text
                            x={0}
                            y={2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[12px] font-bold"
                            fill={pointColor}
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
                          ↓ Has bajado {Math.abs(weightDifference).toFixed(1)}kg desde el inicio
                        </span>
                      ) : weightDifference > 0 ? (
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                          ↑ Has subido {weightDifference.toFixed(1)}kg desde el inicio
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
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tu peso actual:</div>
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
                          Tienes obesidad (IMC ≥ 30). Se recomienda una pérdida del 5-10% del peso actual como primer objetivo seguro.
                        </p>
                      ) : bmi >= 25 ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Tienes sobrepeso (IMC 25-29.9). Se recomienda una pérdida del 5-10% del peso actual como objetivo seguro.
                        </p>
                      ) : bmi >= 18.5 ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Tu peso está en el rango normal (IMC 18.5-24.9). Puedes mantener tu peso actual o establecer una meta de tonificación.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Tienes bajo peso (IMC &lt; 18.5). Se recomienda consultar con un profesional de la salud.
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
                      Peso sugerido según OMS: <span className="font-semibold text-[#85ea10]">{calculateSafeTargetWeight().toFixed(1)} kg</span>
                    </p>
                  </div>

                  {/* Nota importante */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Nota:</strong> Esta es una guía general. Consulta con un profesional de la salud para una evaluación personalizada.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveGoal}
                    className="flex-1 px-4 py-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-semibold rounded-lg transition-colors"
                  >
                    Guardar Meta
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
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">¿Qué significa?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      El <strong>Índice de Masa Corporal (IMC)</strong> es una medida que relaciona tu peso con tu altura para evaluar si tienes un peso saludable.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fórmula:</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
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
    </div>
  );
}
