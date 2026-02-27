'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, Calendar, Zap, CheckCircle, X, Clock, TrendingUp, Award, Settings, ExternalLink, BookOpen, Info, Play, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { GoalSuggestion, getDifficultyColor, getDifficultyEmoji, getBMIColor } from '@/lib/goalSuggestion';

interface GoalSuggestionCardProps {
  suggestion: GoalSuggestion;
  onAccept: (suggestion: GoalSuggestion) => void;
  onCustomize: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  userBMI?: number;
  userName?: string; // Add userName prop
  availableCourses?: any[]; // Add available courses
}

export default function GoalSuggestionCard({ 
  suggestion, 
  onAccept, 
  onCustomize,
  onDismiss, 
  isLoading = false,
  userBMI = 25, // Default value
  userName = 'Usuario', // Default value
  availableCourses = [] // Default value
}: GoalSuggestionCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showBMIModal, setShowBMIModal] = useState(false);
  
  // Inicializar el estado basado en localStorage inmediatamente
  const getInitialCardState = (): 'initial' | 'viewed' | 'dismissed' => {
    if (typeof window === 'undefined') return 'initial'; // SSR safety
    
    const hasSeenGoalSuggestion = localStorage.getItem('hasSeenGoalSuggestion');
    const hasViewedRecommendedCourse = localStorage.getItem('hasViewedRecommendedCourse');
    const hasDismissedGoalSuggestion = localStorage.getItem('hasDismissedGoalSuggestion');
    const lastGoalSuggestionShown = localStorage.getItem('lastGoalSuggestionShown');
    
    // Si nunca ha visto el card, mostrar estado inicial
    if (!hasSeenGoalSuggestion) {
      return 'initial';
    }
    
    // Si ha descartado el card, no mostrarlo
    if (hasDismissedGoalSuggestion) {
      return 'dismissed';
    }
    
    // Si ya vio el curso recomendado, mostrar estado "viewed"
    if (hasViewedRecommendedCourse) {
      return 'viewed';
    }
    
    // Si han pasado más de 7 días, resetear y mostrar estado inicial
    if (lastGoalSuggestionShown) {
      const lastShown = new Date(lastGoalSuggestionShown);
      const now = new Date();
      const daysDiff = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        // Reset localStorage
        localStorage.removeItem('hasSeenGoalSuggestion');
        localStorage.removeItem('hasViewedRecommendedCourse');
        localStorage.removeItem('hasDismissedGoalSuggestion');
        localStorage.removeItem('lastGoalSuggestionShown');
        localStorage.removeItem('goalSuggestionCount');
        return 'initial';
      }
    }
    
    // Si ha visto el card pero no el curso, mostrar estado inicial
    return 'initial';
  };
  
  const [cardState, setCardState] = useState<'initial' | 'viewed' | 'dismissed'>(getInitialCardState);

  // useEffect para manejar cambios de estado
  useEffect(() => {
    // El estado se maneja automáticamente
  }, [cardState]);

  // Si el card fue descartado, no renderizar nada
  if (cardState === 'dismissed') {
    return null;
  }

  // Función para manejar cuando el usuario acepta el reto
  const handleAcceptChallenge = () => {
    // Marcar que ha visto el goal suggestion
    localStorage.setItem('hasSeenGoalSuggestion', 'true');
    localStorage.setItem('lastGoalSuggestionShown', new Date().toISOString());
    const currentCount = parseInt(localStorage.getItem('goalSuggestionCount') || '0');
    localStorage.setItem('goalSuggestionCount', (currentCount + 1).toString());
    
    // Llamar a la función original
    onAccept(suggestion);
  };

  // Función para manejar cuando el usuario ve el detalle del curso
  const handleViewCourseDetail = () => {
    // Marcar que ha visto el curso recomendado
    localStorage.setItem('hasViewedRecommendedCourse', 'true');
    localStorage.setItem('hasSeenGoalSuggestion', 'true');
    localStorage.setItem('lastGoalSuggestionShown', new Date().toISOString());
    setCardState('viewed');
  };

  // Función para manejar el dismiss
  const handleDismiss = () => {
    localStorage.setItem('hasSeenGoalSuggestion', 'true');
    localStorage.setItem('hasDismissedGoalSuggestion', 'true');
    localStorage.setItem('lastGoalSuggestionShown', new Date().toISOString());
    setCardState('dismissed');
    onDismiss();
  };
  
  // Debug: Log suggestion data
  console.log('🎯 GoalSuggestionCard received suggestion:', {
    title: suggestion.title,
    recommendedCourse: suggestion.recommendedCourse,
    recommendedCourseImage: suggestion.recommendedCourseImage,
    difficulty: suggestion.difficulty
  });
  
  // Find the best matching course from available courses
  const findBestCourse = () => {
    if (!availableCourses || availableCourses.length === 0) {
      console.log('🎯 No available courses, using suggestion data');
      return null;
    }
    
    // Try to find a course that matches the suggested category or name
    let bestCourse = availableCourses.find(course => 
      course.title.toLowerCase().includes('hiit') || 
      course.title.toLowerCase().includes('cardio') ||
      course.category_name?.toLowerCase().includes('quema') ||
      course.category_name?.toLowerCase().includes('hiit')
    );
    
    // If no specific match, use the first available course
    if (!bestCourse) {
      bestCourse = availableCourses[0];
    }
    
    console.log('🎯 Best course found:', bestCourse?.title);
    return bestCourse;
  };
  
  const bestCourse = findBestCourse();

  // Debug: Log bestCourse data
  console.log('🎯 bestCourse found:', bestCourse ? {
    id: bestCourse.id,
    slug: bestCourse.slug,
    title: bestCourse.title,
    hasSlug: !!bestCourse.slug
  } : 'No bestCourse found');

  // Debug: Log card state
  console.log('🎯 GoalSuggestionCard state:', {
    cardState,
    hasSeenGoalSuggestion: localStorage.getItem('hasSeenGoalSuggestion'),
    hasViewedRecommendedCourse: localStorage.getItem('hasViewedRecommendedCourse'),
    lastGoalSuggestionShown: localStorage.getItem('lastGoalSuggestionShown')
  });
  
  // Use real course data if available, otherwise fallback to suggestion
  const displayCourse = bestCourse || {
    title: suggestion.recommendedCourse,
    preview_image: suggestion.recommendedCourseImage,
    slug: suggestion.recommendedCourse.toLowerCase().replace(/ /g, '-')
  };
  
  // Debug: Log image URL construction
  const imageUrl = displayCourse.preview_image || '/images/course-placeholder.jpg';
  console.log('🖼️ GoalSuggestionCard image URL:', imageUrl);
  console.log('🖼️ GoalSuggestionCard is Base64:', imageUrl.startsWith('data:image/'));
  console.log('🖼️ Display course:', displayCourse);
  
  // Obtener colores basados en el IMC
  const bmiColors = getBMIColor(userBMI);

  // Función para obtener la ruta del curso basada en el nombre
  const getCoursePath = (courseName: string): string => {
    // Mapeo de nombres de cursos a sus IDs/rutas basado en los cursos existentes
    const courseMap: { [key: string]: string } = {
      'CARDIO HIIT 40 MIN ¡BAJA DE PESO!': '/course/1', // Transformación Total 90 Días
      'RUTINA HIIT ¡ENTRENA 12 MINUTOS EN VACACIONES!': '/course/2', // HIIT Quema Grasa
      'FULL BODY EXPRESS ¡ENTRENA 12 MINUTOS EN VACACIONES!': '/course/3', // Fuerza y Músculo
    };
    
    return courseMap[courseName] || '/courses';
  };

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        {/* Botón de cerrar en la esquina */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Semáforo de Estado del Peso - Más Grande y Prominente */}
        <div className="absolute top-4 right-8">
          <div className="flex flex-col items-center space-y-3">
            {/* Semáforo visual con todos los colores - Más grande */}
            <div className="flex flex-col space-y-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-lg">
              {/* Rojo - Obesidad */}
              <div className={`w-8 h-8 rounded-full border-3 transition-all duration-300 ${
                userBMI >= 30 
                  ? 'bg-red-500 border-red-600 shadow-xl shadow-red-500/60 animate-pulse' 
                  : 'bg-red-300 border-red-400 opacity-40'
              }`}></div>
              {/* Amarillo - Sobrepeso */}
              <div className={`w-8 h-8 rounded-full border-3 transition-all duration-300 ${
                userBMI >= 25 && userBMI < 30 
                  ? 'bg-yellow-500 border-yellow-600 shadow-xl shadow-yellow-500/60 animate-pulse' 
                  : 'bg-yellow-300 border-yellow-400 opacity-40'
              }`}></div>
              {/* Verde - Normal */}
              <div className={`w-8 h-8 rounded-full border-3 transition-all duration-300 ${
                userBMI >= 18.5 && userBMI < 25 
                  ? 'bg-green-500 border-green-600 shadow-xl shadow-green-500/60 animate-pulse' 
                  : 'bg-green-300 border-green-400 opacity-40'
              }`}></div>
            </div>
            {/* Etiqueta del estado - Más grande */}
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center bg-white dark:bg-gray-800 px-3 py-2 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-md">
              {userBMI >= 30 ? '⚠️ Obesidad' : userBMI >= 25 ? '⚠️ Sobrepeso' : '✅ Normal'}
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          {/* Header con saludo */}
          <div className="flex items-start justify-between mb-6">
              <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {cardState === 'viewed' ? '¿Te gustó el curso recomendado?' : `¡Hola, ${userName}! 👋`}
                </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {cardState === 'viewed' 
                  ? `¡Es perfecto para tu meta de ${suggestion.weightLossGoal}kg menos!`
                  : 'Te Sugerimos una Meta Basada en tu perfil'
                }
                </p>
            </div>
          </div>

          {/* Estado según OMS - Solo mostrar en estado inicial */}
          {cardState === 'initial' && (
            <div className="mb-6 pr-32">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Según la OMS, tienes {userBMI >= 30 ? 'obesidad' : userBMI >= 25 ? 'sobrepeso' : 'peso normal'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Meta sugerida: <strong>{suggestion.weightLossGoal} kg menos</strong>
                    </p>
                  </div>
                  <button 
                    className="ml-3 p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-600 dark:text-green-400 rounded-full transition-all duration-200 hover:scale-110"
                    onClick={() => setShowBMIModal(true)}
                    title="Más información sobre IMC"
                  >
                    <Info className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Curso recomendado */}
          <div className="mb-6 pr-32">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {cardState === 'viewed' 
                ? 'El curso perfecto para tu meta:'
                : 'Te recomendamos el siguiente curso porque con él podrás lograr la meta que te proponemos:'
              }
            </h4>
            
            {/* Curso recomendado - Cuadradito */}
            <Link 
              href={bestCourse ? `/course/${bestCourse.slug}` : getCoursePath(suggestion.recommendedCourse)}
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
            >
              {/* Imagen del curso - Cuadradito */}
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                <img 
                  src={imageUrl} 
                  alt={displayCourse.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    console.log('🖼️ Error loading course image:', imageUrl);
                    (e.target as HTMLImageElement).src = '/images/course-placeholder.jpg';
                  }}
                  onLoad={() => {
                    console.log('🖼️ Course image loaded successfully:', imageUrl);
                  }}
                />
                {/* Difficulty indicator */}
                <div className="absolute top-1 right-1">
                  <div className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${getDifficultyColor(suggestion.difficulty)} bg-white/90`}>
                    {getDifficultyEmoji(suggestion.difficulty)}
                  </div>
                </div>
              </div>
              
              {/* Info del curso */}
              <div className="flex-1">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {displayCourse.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Curso recomendado para lograr tu meta
                </p>
              </div>
            </Link>
              </div>
              

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                // Siempre navegar al detalle del curso
                handleViewCourseDetail();
                const courseUrl = bestCourse ? `/course/${bestCourse.slug}` : getCoursePath(suggestion.recommendedCourse);
                router.push(courseUrl);
              }}
              className="flex-1 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>{cardState === 'viewed' ? 'Comprar Ahora' : '¡Acepto el Reto!'}</span>
            </button>

            <button
              onClick={() => {
                // Scroll hacia abajo donde están los demás cursos
                const coursesSection = document.querySelector('[data-courses-section]');
                if (coursesSection) {
                  coursesSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                } else {
                  // Fallback: scroll hacia abajo de la página
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>{cardState === 'viewed' ? 'Ver otros cursos' : 'Quiero ver más cursos'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de información BMI */}
      {showBMIModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 dark:bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Información sobre IMC
                </h3>
              </div>
              <button
                onClick={() => setShowBMIModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Clasificación según la OMS
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-800 dark:text-green-200 font-medium">Peso normal</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">18.5 - 24.9</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">Sobrepeso</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">25.0 - 29.9</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="text-red-800 dark:text-red-200 font-medium">Obesidad</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">≥ 30.0</span>
                  </div>
                </div>
              </div>

              {/* Tu IMC actual */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tu IMC actual</h5>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{userBMI.toFixed(1)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    userBMI >= 30 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    userBMI >= 25 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {userBMI >= 30 ? 'Obesidad' : userBMI >= 25 ? 'Sobrepeso' : 'Peso normal'}
                  </span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">¿Qué es el IMC?</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  El Índice de Masa Corporal (IMC) es una medida que relaciona tu peso con tu altura. 
                  Es una herramienta útil para evaluar si tu peso está en un rango saludable.
                </p>
              </div>

              {/* Enlace a la OMS */}
              <div className="flex items-center justify-center">
                <a
                  href="https://www.who.int/es/news-room/fact-sheets/detail/obesity-and-overweight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  <span>Ver información oficial de la OMS</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
