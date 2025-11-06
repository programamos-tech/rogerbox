'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Zap, Award, Play, Calendar, Clock, ArrowRight, Pill, Weight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
}

interface InsightsSectionProps {
  userProfile: UserProfile | null;
  currentLesson?: Lesson | null;
  completedLessons?: string[];
  lessonVideoEnded?: boolean;
  courseWithLessons?: any;
}

export default function InsightsSection({ 
  userProfile, 
  currentLesson, 
  completedLessons = [],
  lessonVideoEnded = false,
  courseWithLessons
}: InsightsSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [classStreak, setClassStreak] = useState(0);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);

  // Calcular racha de clases - contar todas las clases completadas
  useEffect(() => {
    // Usar el array de completedLessons directamente
    // Si el video terminó y la clase actual no está en la lista, agregarla temporalmente para el cálculo
    let allCompleted = [...(completedLessons || [])];
    
    if (lessonVideoEnded && currentLesson?.id) {
      // Si la clase actual no está en la lista, agregarla para el cálculo
      if (!allCompleted.includes(currentLesson.id)) {
        allCompleted.push(currentLesson.id);
      }
    }
    
    // La racha es simplemente el número total de clases completadas
    const streakCount = allCompleted.length;
    
    // Debug: verificar qué está pasando
    console.log('🔍 Cálculo de racha:', {
      completedLessons,
      completedLessonsLength: completedLessons?.length,
      currentLessonId: currentLesson?.id,
      lessonVideoEnded,
      allCompleted,
      streakCount
    });
    
    setClassStreak(streakCount);
  }, [completedLessons, lessonVideoEnded, currentLesson]);

  // Obtener la próxima clase
  useEffect(() => {
    if (courseWithLessons?.lessons && currentLesson?.id) {
      const lessons = courseWithLessons.lessons;
      const currentIndex = lessons.findIndex((l: any) => l.id === currentLesson.id);
      
      if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
        setNextLesson(lessons[currentIndex + 1]);
      } else {
        setNextLesson(null); // No hay más clases
      }
    }
  }, [courseWithLessons, currentLesson]);

  // Obtener registros de peso reales de la base de datos
  useEffect(() => {
    const fetchWeightHistory = async () => {
      console.log('📊 Fetching weight history...', { 
        hasUserProfile: !!userProfile, 
        hasSession: !!(session as any)?.user?.id,
        userWeight: userProfile?.weight 
      });
      
      if (!userProfile) {
        console.log('⚠️ No userProfile, clearing weight history');
        setWeightHistory([]);
        return;
      }
      
      // Si hay peso inicial, siempre mostrarlo como mínimo
      const initialWeight = userProfile.weight || userProfile.current_weight;
      if (!initialWeight) {
        console.log('⚠️ No weight data, clearing weight history');
        setWeightHistory([]);
        return;
      }
      
      // Si no hay sesión, mostrar al menos el peso inicial
      if (!(session as any)?.user?.id) {
        console.log('⚠️ No session, showing initial weight only');
        setWeightHistory([{
          date: new Date().toISOString().split('T')[0],
          weight: initialWeight
        }]);
        return;
      }
      
      try {
        // Obtener registros de peso ordenados por fecha
        const { data: records, error } = await supabase
          .from('weight_records')
          .select('weight, record_date')
          .eq('user_id', (session as any).user.id)
          .order('record_date', { ascending: true });
        
        if (error) {
          // Si la tabla no existe, usar el peso inicial
          console.warn('⚠️ Error obteniendo historial de peso (la tabla puede no existir aún):', error.message);
          setWeightHistory([{
            date: new Date().toISOString().split('T')[0],
            weight: initialWeight
          }]);
          return;
        }
        
        console.log('📊 Weight records from DB:', records);
        
        if (records && records.length > 0) {
          // Convertir a formato WeightRecord
          const history: WeightRecord[] = records.map(record => ({
            date: record.record_date,
            weight: Number(record.weight)
          }));
          
          console.log('✅ Setting weight history:', history);
          setWeightHistory(history);
        } else {
          // Si no hay registros, mostrar al menos el peso inicial
          console.log('⚠️ No records found, showing initial weight');
          setWeightHistory([{
            date: new Date().toISOString().split('T')[0],
            weight: initialWeight
          }]);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo historial de peso:', error);
        // En caso de error, mostrar al menos el peso inicial
        setWeightHistory([{
          date: new Date().toISOString().split('T')[0],
          weight: initialWeight
        }]);
      }
    };
    
    fetchWeightHistory();
  }, [userProfile, session]);

  // Modo dashboard: mostrar insights/progreso
  // Modo completion: mostrar mensaje de clase completada (cuando lessonVideoEnded es true)
  const isCompletionMode = lessonVideoEnded && currentLesson;
  
  // Si no hay userProfile, no mostrar nada
  if (!userProfile) return null;
  
  // Si es modo completion, mostrar el mensaje de completado
  if (isCompletionMode) {
    // El resto del código de completion mode continúa abajo
  } else {
    // Modo dashboard: mostrar insights/progreso
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-0 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tu Progreso
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sigue así, vas por buen camino
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#85ea10]">
                {classStreak}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {classStreak === 1 ? 'clase' : 'clases'} completadas
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Racha de días */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Racha
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {userProfile.streak_days || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                días consecutivos
              </div>
            </div>

            {/* Peso actual */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Weight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Peso
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userProfile.current_weight || userProfile.weight || 0} kg
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {userProfile.target_weight ? `Meta: ${userProfile.target_weight} kg` : 'Sin meta'}
              </div>
            </div>
          </div>

          {/* Gráfica de Progreso de Peso */}
          {weightHistory.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Progreso de Peso
                  </h3>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {userProfile.weight}kg {userProfile.target_weight ? `→ ${userProfile.target_weight}kg` : ''}
                </div>
              </div>
              
              {/* Gráfica SVG */}
              <div className="relative w-full h-40">
                <svg className="w-full h-full" viewBox="0 0 300 140" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <defs>
                    <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Área bajo la curva - solo si hay 2 o más puntos */}
                  {weightHistory.length >= 2 && (() => {
                    const minWeight = Math.min(...weightHistory.map(r => r.weight));
                    const maxWeight = Math.max(...weightHistory.map(r => r.weight));
                    const range = maxWeight - minWeight || 1;
                    const points = weightHistory.map((record, index) => {
                      const x = (index / Math.max(weightHistory.length - 1, 1)) * 280 + 10;
                      const y = range === 0 ? 80 : 120 - ((record.weight - minWeight) / range) * 100;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <polygon
                        points={`${points.split(' ')[0].split(',')[0]},120 ${points} ${points.split(' ')[points.split(' ').length - 1].split(',')[0]},120`}
                        fill="url(#weightGradient)"
                      />
                    );
                  })()}
                  
                  {/* Línea de progreso - solo si hay 2 o más puntos */}
                  {weightHistory.length >= 2 && (() => {
                    const minWeight = Math.min(...weightHistory.map(r => r.weight));
                    const maxWeight = Math.max(...weightHistory.map(r => r.weight));
                    const range = maxWeight - minWeight || 1;
                    const points = weightHistory.map((record, index) => {
                      const x = (index / Math.max(weightHistory.length - 1, 1)) * 280 + 10;
                      const y = range === 0 ? 80 : 120 - ((record.weight - minWeight) / range) * 100;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    return (
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}
                  
                  {/* Puntos de datos */}
                  {weightHistory.map((record, index) => {
                    // Si solo hay un punto, centrarlo horizontalmente
                    const x = weightHistory.length === 1 
                      ? 150 
                      : (index / Math.max(weightHistory.length - 1, 1)) * 280 + 10;
                    const minWeight = Math.min(...weightHistory.map(r => r.weight));
                    const maxWeight = Math.max(...weightHistory.map(r => r.weight));
                    const range = maxWeight - minWeight || 1;
                    // Si todos los pesos son iguales, centrar la línea verticalmente
                    const y = range === 0 ? 80 : 120 - ((record.weight - minWeight) / range) * 100;
                    const isFirst = index === 0;
                    const isLast = index === weightHistory.length - 1;
                    
                    // Formatear fecha: "Viernes 15 Ene"
                    const date = new Date(record.date);
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                    const dayNumber = date.getDate();
                    const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
                    const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber} ${monthName}`;
                    
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r={isLast ? 5.5 : 5}
                          fill={isFirst ? "#6366f1" : isLast ? "#10b981" : "#3b82f6"}
                          stroke="white"
                          strokeWidth="2"
                        />
                        {/* Etiqueta con fecha y peso */}
                        <text
                          x={x}
                          y={y - 20}
                          textAnchor="middle"
                          className="text-[9px] font-semibold fill-gray-700 dark:fill-gray-300"
                        >
                          {formattedDate}
                        </text>
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-gray-900 dark:fill-gray-100"
                        >
                          {Math.round(record.weight)}kg
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Información adicional */}
                {weightHistory.length > 1 && (() => {
                  const firstWeight = weightHistory[0].weight;
                  const lastWeight = weightHistory[weightHistory.length - 1].weight;
                  const difference = lastWeight - firstWeight;
                  const isGaining = difference > 0;
                  const isLosing = difference < 0;
                  
                  return (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isLosing ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            ↓ Has bajado {Math.abs(difference).toFixed(1)}kg
                          </span>
                        ) : isGaining ? (
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">
                            ↑ Has subido {difference.toFixed(1)}kg
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">
                            Peso estable
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10 rounded-lg p-4 border border-[#85ea10]/20">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#85ea10]" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {classStreak === 0 
                  ? '¡Comienza tu primera clase hoy! 🚀'
                  : classStreak === 1
                  ? '¡Excelente! Has completado tu primera clase. ¡Sigue así! 💪'
                  : `¡Increíble! Has completado ${classStreak} clases. ¡Sigue así! 🔥`
                }
              </p>
            </div>
          </div>

          {/* CTA para tomar clase */}
          {classStreak === 0 && (
            <button
              onClick={() => router.push('/student?autoStart=true')}
              className="w-full bg-gradient-to-r from-[#85ea10] to-[#7dd30f] hover:from-[#7dd30f] hover:to-[#6bc00e] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-[#85ea10]/50 hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Tomar mi primera clase</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-row bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-0 overflow-hidden">
      {/* Card Izquierdo - Imagen (50%) - Ocupa todo el alto */}
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
      
      {/* Card Derecho - Texto (50%) */}
      {nextLesson && (
        <div className="w-1/2 flex-shrink-0 flex flex-col p-5 min-h-0 h-full">
          {/* Clase Completada y Racha */}
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
                Tu racha va en <span className="font-bold text-gray-900 dark:text-white">{classStreak}</span> {classStreak === 1 ? 'clase' : 'clases'}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-6"></div>

          {/* Próxima Clase */}
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

          {/* Disponible mañana - Badge destacado */}
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

          {/* CTA - Toma tu complemento */}
          <button
            onClick={() => {
              router.push('/dashboard');
              // Scroll a la sección de complementos después de un pequeño delay
              setTimeout(() => {
                const complementSection = document.querySelector('[data-section="complementos"]') || 
                                        document.querySelector('.lg\\:col-span-1:first-of-type');
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

          {/* Mensaje nutricional */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 mb-4">
            Toma un plan nutricional y mira resultados un <span className="font-bold text-gray-700 dark:text-gray-300">40%</span> más rápido!
          </p>

          {/* CTA - Planes nutricionales */}
          <button
            onClick={() => {
              router.push('/dashboard');
              // Scroll a la sección de planes nutricionales después de un pequeño delay
              setTimeout(() => {
                const nutritionSection = document.querySelector('[data-section="planes-nutricionales"]') || 
                                       document.querySelector('[data-section="nutrition"]');
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

          {/* Logo RogerBox */}
          <div className="flex justify-center mb-6 mt-2">
            <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h1>
          </div>

          {/* Mensaje de despedida - Abajo */}
          <div className="pt-6 mt-auto border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">
                Nos vemos mañana
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Si no hay próxima clase - Compacto */}
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
