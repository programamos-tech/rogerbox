'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from './ImageWithFallback';
import { 
  Play, 
  Calendar, 
  Clock, 
  Target, 
  Flame, 
  TrendingUp, 
  CheckCircle,
  Zap,
  Star,
  Users,
  Award,
  ChevronRight,
  BookOpen,
  Timer,
  Lock,
  Hourglass
} from 'lucide-react';

interface CourseHeroCardProps {
  userProfile: any;
  purchasedCourse: any;
  nextLesson: any;
  lessons: any[]; // Agregar prop para todas las lecciones
  onStartLesson?: (lessonId: string) => void;
}

export default function CourseHeroCard({ 
  userProfile, 
  purchasedCourse, 
  nextLesson,
  lessons,
  onStartLesson 
}: CourseHeroCardProps) {
  const router = useRouter();
  const [streakDays, setStreakDays] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [nextClassDate, setNextClassDate] = useState('');
  const [showMotivationalAlert, setShowMotivationalAlert] = useState(true);

  useEffect(() => {
    // Usar datos reales del perfil del usuario
    setStreakDays(userProfile?.streak_days || 0);
    
    // Calcular progreso basado en calorías quemadas
    if (userProfile?.weight && userProfile?.target_weight && purchasedCourse) {
      const currentWeight = userProfile.weight;
      const targetWeight = userProfile.target_weight;
      const totalToLose = currentWeight - targetWeight;
      
      if (totalToLose > 0) {
        // Calcular calorías necesarias para perder 1 kg (aproximadamente 7700 calorías)
        const caloriesPerKg = 7700;
        const totalCaloriesNeeded = totalToLose * caloriesPerKg;
        
        // Calcular calorías quemadas basado en clases completadas
        const completedLessons = purchasedCourse?.completed_lessons || 0;
        const totalLessons = purchasedCourse?.total_lessons || 1;
        const caloriesPerLesson = purchasedCourse?.estimated_calories_per_lesson || 100; // Valor por defecto
        const caloriesBurned = completedLessons * caloriesPerLesson;
        
        // Calcular progreso basado en calorías
        const calorieProgress = Math.min(100, (caloriesBurned / totalCaloriesNeeded) * 100);
        setProgressPercentage(Math.round(calorieProgress));
      } else {
        setProgressPercentage(0);
      }
    }

    // Calcular días restantes para la meta
    if (userProfile?.goal_deadline) {
      const deadline = new Date(userProfile.goal_deadline);
      const today = new Date();
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    }

    // Calcular próxima clase
    if (nextLesson) {
      // Si es la primera clase (streakDays === 0), es "hoy", si no es "mañana"
      if (streakDays === 0) {
        setNextClassDate('hoy');
      } else {
        setNextClassDate('mañana');
      }
    } else {
      setNextClassDate('pronto');
    }
  }, [userProfile, purchasedCourse, nextLesson]);

  // Auto-hide motivational alert after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMotivationalAlert(false);
    }, 5000); // Hide after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const getMotivationalMessage = () => {
    if (streakDays === 0) {
      return "¡Es hora de comenzar tu primera clase! 🚀";
    } else if (streakDays < 7) {
      return "¡Excelente! Mantén la racha 🔥";
    } else if (streakDays < 30) {
      return "¡Increíble! Eres una máquina 💪";
    } else {
      return "¡Eres un campeón! 🏆";
    }
  };

  const getProgressMessage = () => {
    if (progressPercentage === 0) {
      return "¡Es hora de empezar tu transformación!";
    } else if (progressPercentage < 25) {
      return "¡Vas por buen camino! Cada clase te acerca más a tu meta.";
    } else if (progressPercentage < 50) {
      return "¡Ya estás en el camino! Sigue quemando calorías.";
    } else if (progressPercentage < 75) {
      return "¡Más de la mitad completado! ¡Sigue así!";
    } else if (progressPercentage < 100) {
      return "¡Casi llegas a tu meta de peso!";
    } else {
      return "¡Meta de peso completada! ¡Felicidades!";
    }
  };

  // Función para manejar el clic en "Comenzar"
  const handleStartLesson = () => {
    if (nextLesson) {
      // Navegar a la página de la lección
      router.push(`/lesson/${nextLesson.id}`);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
        
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#85ea10] rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getMotivationalMessage()}
              </h2>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Course Info - Left Column */}
          <div className="lg:col-span-2">
            {/* Course Hero Image */}
            <div className="rounded-xl overflow-hidden mb-4 shadow-md border border-gray-200 dark:border-gray-700">
              <ImageWithFallback
                src={purchasedCourse?.preview_image || '/images/course-placeholder.jpg'}
                alt={purchasedCourse?.title}
                className="w-full h-80 object-cover"
                fallbackText="FITNESS COURSE"
                fallbackColor="85ea10"
              />
            </div>

            {/* Course Info Below Image */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {purchasedCourse?.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {purchasedCourse?.description}
              </p>
              
              {/* Course Progress */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progreso del curso
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {progressPercentage}%
                  </span>
                </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                      <div 
                        className="bg-[#85ea10] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getProgressMessage()}
                </p>
              </div>
            </div>

            {/* Next Lesson Card */}
            {nextLesson && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-[#85ea10] rounded-lg flex items-center justify-center">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {nextLesson.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {nextLesson.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{nextLesson.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Disponible {nextClassDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStartLesson}
                    className="bg-[#85ea10] hover:bg-[#7dd30f] text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Comenzar</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Progress Stats - Right Column */}
          <div className="space-y-4">
              {/* Combined Progress Card */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Tu Progreso
                </h4>
              </div>
              
              {/* Goal Progress */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Peso actual</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userProfile?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Peso objetivo</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userProfile?.target_weight} kg
                  </span>
                </div>
                
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-[#85ea10] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                      ></div>
                    </div>
                
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {Math.min(100, Math.max(0, progressPercentage))}% hacia tu meta
                </div>
                {purchasedCourse && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {((purchasedCourse?.completed_lessons || 0) * (purchasedCourse?.estimated_calories_per_lesson || 100))} cal quemadas
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Streak */}
                <div className="text-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {streakDays}
                  </div>
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    días de racha
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    🔥 Racha actual
                  </div>
                </div>
                
                {/* Time Remaining */}
                <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {daysRemaining}
                  </div>
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    días restantes
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    ⏰ Para tu meta
                  </div>
                </div>
              </div>
              
              {/* Motivational Message */}
              <div className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {streakDays === 0 
                    ? "¡Comienza tu primera racha! 🚀" 
                    : daysRemaining > 0 
                      ? "¡Sigue así! 🔥" 
                      : "¡Es hora de empezar! ⏰"
                  }
                </div>
              </div>
            </div>

            {/* Upcoming Classes - Below Progress Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-[#85ea10] rounded-md flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Próximas Clases
                </h4>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lessons?.slice(0, 4).map((lesson: any, index: number) => {
                  const isNext = lesson.id === nextLesson?.id;
                  const isCompleted = lesson.lesson_order < (purchasedCourse?.completed_lessons || 0);
                  const isLocked = lesson.lesson_order > (purchasedCourse?.completed_lessons || 0) + 1;
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg border ${
                        isNext
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {/* Lesson Icon */}
                      <div className="flex-shrink-0">
                        {isNext ? (
                          <Play className="w-4 h-4 text-blue-600" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Hourglass className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      
                      {/* Lesson Info */}
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          isNext 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : isCompleted
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-800 dark:text-white'
                        }`}>
                          {lesson.lesson_number}. {lesson.title}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration_minutes} min</span>
                          </div>
                          {isNext && (
                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium text-xs">
                              Próxima
                            </span>
                          )}
                          {isCompleted && (
                            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Footer - Temporary Alert */}
        {showMotivationalAlert && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-6 transition-all duration-500 ease-in-out animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#85ea10] rounded-md flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                ¡Excelente! Has comenzado tu transformación. Cada clase te acerca más a tu meta. ¡Sigue así!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}