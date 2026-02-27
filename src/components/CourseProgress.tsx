'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Play, Lock, Target, TrendingUp, Award, XCircle } from 'lucide-react';

interface CourseProgressProps {
  course: {
    id: string;
    title: string;
    slug: string;
    preview_image: string;
    duration_days: number;
    start_date: string;
  };
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    lesson_number: number;
    duration_minutes: number;
    preview_image: string;
    is_preview: boolean;
  }>;
}

export default function CourseProgress({ course, lessons }: CourseProgressProps) {
  const [currentDate] = useState(new Date());
  const [startDate] = useState(new Date(course.start_date));
  
  // Calcular progreso
  const getProgress = () => {
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completedLessons = Math.min(daysSinceStart + 1, lessons.length);
    const progressPercentage = (completedLessons / lessons.length) * 100;
    
    return {
      completedLessons,
      totalLessons: lessons.length,
      progressPercentage,
      daysSinceStart
    };
  };

  const progress = getProgress();

  // Determinar estado de cada clase
  // Regla: Solo la clase del día actual está disponible. Si no se toma, se pierde.
  const getLessonStatus = (lessonIndex: number) => {
    const lessonDate = new Date(startDate);
    lessonDate.setDate(startDate.getDate() + lessonIndex);
    lessonDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lessonDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Si la clase ya fue completada
    if (lessonIndex < progress.completedLessons) {
      return 'completed';
    }
    
    // Si la clase es del día actual (daysDiff === 0) y no está completada, está disponible
    if (daysDiff === 0 && lessonIndex === progress.completedLessons) {
      return 'available';
    }
    
    // Si la clase es de un día pasado y no fue completada, está perdida
    if (daysDiff > 0 && lessonIndex >= progress.completedLessons) {
      return 'lost';
    }
    
    // Si la clase es futura, está bloqueada
    if (daysDiff < 0) {
      return 'locked';
    }
    
    // Si es la siguiente clase disponible (mañana)
    if (daysDiff === -1 && lessonIndex === progress.completedLessons) {
      return 'upcoming';
    }
    
    return 'locked';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      {/* Header del progreso */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tu Progreso
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {course.title}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-[#85ea10]">
            {progress.completedLessons}/{progress.totalLessons}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            clases completadas
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso del curso
          </span>
          <span className="text-sm font-bold text-[#85ea10]">
            {Math.round(progress.progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
          <div 
            className="bg-[#85ea10] h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {progress.completedLessons}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Completadas
          </div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Play className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {progress.completedLessons < lessons.length ? 1 : 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Disponible
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Lock className="w-6 h-6 text-gray-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {lessons.length - progress.completedLessons - (progress.completedLessons < lessons.length ? 1 : 0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Bloqueadas
          </div>
        </div>
      </div>

      {/* Lista de clases */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Clases del Curso
        </h4>
        
        {lessons.map((lesson, index) => {
          const status = getLessonStatus(index);
          const lessonDate = new Date(startDate);
          lessonDate.setDate(startDate.getDate() + index);
          
          return (
            <div 
              key={lesson.id} 
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                status === 'completed' 
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                  : status === 'available'
                  ? 'border-[#85ea10] bg-green-50 dark:bg-green-900/20'
                  : status === 'lost'
                  ? 'border-red-200 bg-red-50 dark:bg-red-900/20 opacity-60'
                  : status === 'upcoming'
                  ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Icono de estado */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status === 'completed' 
                    ? 'bg-green-500' 
                    : status === 'available'
                    ? 'bg-[#85ea10]'
                    : status === 'lost'
                    ? 'bg-red-500'
                    : status === 'upcoming'
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : status === 'available' ? (
                    <Play className="w-5 h-5 text-black" />
                  ) : status === 'lost' ? (
                    <XCircle className="w-5 h-5 text-white" />
                  ) : status === 'upcoming' ? (
                    <Clock className="w-5 h-5 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Clase {lesson.lesson_number}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : status === 'available'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : status === 'lost'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {status === 'completed' ? 'Completada' : 
                       status === 'available' ? 'Disponible hoy' : 
                       status === 'lost' ? 'Perdida' :
                       status === 'upcoming' ? 'Disponible mañana' :
                       'Bloqueada'}
                    </span>
                  </div>
                  
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {lesson.title}
                  </h5>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{lessonDate.toLocaleDateString('es-CO')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
