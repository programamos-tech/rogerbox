'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Flame, 
  ShoppingCart, 
  ExternalLink,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface ProgressCardProps {
  userProfile: any;
  goalSuggestion: any;
  onStartCourse?: () => void;
  onCustomize?: () => void;
}

export default function ProgressCard({ 
  userProfile, 
  goalSuggestion, 
  onStartCourse,
  onCustomize 
}: ProgressCardProps) {
  const [streakDays, setStreakDays] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    // Usar datos reales del perfil del usuario
    setStreakDays(userProfile?.streak_days || 0);
    
    // Calcular progreso hacia la meta (siempre 0% al inicio)
    if (userProfile?.weight && goalSuggestion?.targetWeight) {
      // Al inicio, el progreso siempre es 0% porque no ha empezado
      setProgressPercentage(0);
    }

    // Calcular días restantes
    if (goalSuggestion?.deadline) {
      const deadline = new Date(goalSuggestion.deadline);
      const today = new Date();
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    }
  }, [userProfile, goalSuggestion]);

  const getCoursePath = (courseName: string): string => {
    const courseMap: { [key: string]: string } = {
      'CARDIO HIIT 40 MIN ¡BAJA DE PESO!': '/course/1',
      'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!': '/course/2',
      'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!': '/course/3',
    };
    return courseMap[courseName] || '/courses';
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  🎯 Tu Progreso, {userProfile?.name || 'Usuario'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-white/70">
                  Sigue así, vas por buen camino
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {streakDays}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                días de racha
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Meta Progress */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-white">
                  Progreso hacia la meta
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Peso actual</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userProfile?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Peso objetivo</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {goalSuggestion?.targetWeight} kg
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {progressPercentage}% completado
                </div>
                {progressPercentage === 0 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                    ¡Es hora de empezar! 🚀
                  </div>
                )}
              </div>
            </div>

            {/* Streak Days */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-white">
                  Racha actual
                </span>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-1">
                  {streakDays}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  días consecutivos
                </div>
                <div className="mt-2 text-xs font-medium">
                  {streakDays === 0 ? (
                    <span className="text-gray-500 dark:text-gray-400">
                      ¡Comienza tu primera racha! 🚀
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">
                      ¡Sigue así! 🔥
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-white">
                  Tiempo restante
                </span>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {daysRemaining}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  días restantes
                </div>
                <div className="mt-2 text-xs font-medium">
                  {daysRemaining > 0 ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      ¡Tú puedes! 💪
                    </span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400">
                      ¡Es hora de empezar! ⏰
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Course Section */}
          <div className="bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10 rounded-lg p-4 border border-[#85ea10]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#85ea10]" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Curso recomendado para tu meta
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {goalSuggestion?.estimatedDuration}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {goalSuggestion?.recommendedCourse}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perfecto para alcanzar tu objetivo de {goalSuggestion?.targetWeight} kg
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <Link
                  href={getCoursePath(goalSuggestion?.recommendedCourse || '')}
                  className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Ver Curso</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                ¡Perfecto! Has establecido tu meta. Ahora es momento de dar el primer paso hacia tu transformación. ¡Comienza hoy mismo!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
