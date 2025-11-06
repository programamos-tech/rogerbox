'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckCircle, Zap, Award, Play, Calendar, Clock, ArrowRight, Pill } from 'lucide-react';

interface UserProfile {
  weight: number;
  height: number;
  target_weight?: number | null;
  goal_deadline?: string | null;
  name?: string;
  created_at?: string;
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
  const [classStreak, setClassStreak] = useState(0);
  const [nextLesson, setNextLesson] = useState<any>(null);

  // Calcular racha de clases - incluir la clase actual si el video terminó
  useEffect(() => {
    let streak = completedLessons?.length || 0;
    // Si el video terminó y hay una clase actual, agregarla a la racha
    if (lessonVideoEnded && currentLesson?.id) {
      // Verificar si la clase actual ya está en completedLessons
      if (!completedLessons?.includes(currentLesson.id)) {
        streak = streak + 1;
      } else {
        streak = completedLessons.length;
      }
    }
    setClassStreak(streak);
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

  if (!userProfile || !lessonVideoEnded) return null;

  return (
    <div className="w-full h-full flex flex-row bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-0 overflow-hidden">
      {/* Card Izquierdo - Imagen (50%) - Ocupa todo el alto */}
      {nextLesson && (
        <div className="w-1/2 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <div className="relative w-full h-full rounded-l-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
            {nextLesson.preview_image || nextLesson.thumbnail ? (
              <Image
                src={nextLesson.preview_image || nextLesson.thumbnail}
                alt={nextLesson.title}
                fill
                className="sepia-50 brightness-110 contrast-105"
                sizes="50vw"
                loading="lazy"
                quality={85}
                style={{ 
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  filter: 'sepia(40%) brightness(110%) contrast(105%) saturate(120%)'
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
          <div className="space-y-2 mb-4">
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
          <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>

          {/* Próxima Clase */}
          <div className="space-y-2 mb-4">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Disponible mañana
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  La siguiente clase estará lista para ti cuando vuelvas
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
            className="w-full bg-gradient-to-r from-[#85ea10] to-[#7dd30f] hover:from-[#7dd30f] hover:to-[#6bc00e] text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-[#85ea10]/50 hover:scale-[1.02] flex items-center justify-center space-x-2 group mb-auto"
          >
            <Pill className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span>Toma tu complemento</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* Mensaje de despedida - Abajo */}
          <div className="pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
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
