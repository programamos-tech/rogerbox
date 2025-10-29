'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Play, 
  Clock, 
  Star, 
  MessageCircle, 
  Trophy, 
  Calendar,
  CheckCircle,
  Lock,
  ArrowLeft,
  Heart,
  Share2
} from 'lucide-react';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { useUserPurchases } from '@/hooks/useUserPurchases';

interface CourseProgressProps {
  courseId: string;
}

export default function CourseProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const courseId = params?.id as string;
  
  const { courses, loading: coursesLoading } = useUnifiedCourses();
  const { purchases, loading: purchasesLoading } = useUserPurchases();
  
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      user: 'María González',
      avatar: '👩',
      comment: '¡Excelente clase! Me encantó la intensidad.',
      rating: 5,
      date: '2024-01-15'
    },
    {
      id: 2,
      user: 'Carlos Ruiz',
      avatar: '👨',
      comment: 'Perfecto para empezar el día con energía.',
      rating: 4,
      date: '2024-01-14'
    }
  ]);

  const course = courses?.find(c => c.slug === courseId);
  const userPurchase = purchases?.find((p: any) => p.course_slug === courseId);
  
  // Verificar si hay una compra simulada en localStorage
  const [simulatedPurchase, setSimulatedPurchase] = useState<any>(null);
  
  useEffect(() => {
    const simulated = localStorage.getItem('simulated_purchase');
    if (simulated) {
      try {
        const parsed = JSON.parse(simulated);
        if (parsed.course?.slug === courseId) {
          setSimulatedPurchase(parsed);
        }
      } catch (error) {
        console.error('Error parsing simulated purchase:', error);
      }
    }
  }, [courseId]);
  
  const isCoursePurchased = !!userPurchase || !!simulatedPurchase;
  const effectivePurchase = userPurchase || simulatedPurchase;

  // Calcular la clase actual basada en los días transcurridos desde el inicio
  const getCurrentLessonIndex = () => {
    if (!effectivePurchase?.start_date) return 0;
    
    const startDate = new Date(effectivePurchase.start_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // La clase actual es el día actual (0-indexed)
    return Math.min(daysDiff, ((course as any)?.lessons?.length || 1) - 1);
  };

  const currentLessonIndex = getCurrentLessonIndex();
  const currentLesson = (course as any)?.lessons?.[currentLessonIndex];
  const completedLessons = effectivePurchase?.completed_lessons || [];
  
  // Función para determinar el estado de una clase
  const getLessonStatus = (lessonIndex: number) => {
    if (!effectivePurchase?.start_date) return 'locked';
    
    const startDate = new Date(effectivePurchase.start_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (lessonIndex < daysDiff) {
      // Clases pasadas - completadas o disponibles para repasar
      return completedLessons.includes((course as any)?.lessons?.[lessonIndex]?.id) ? 'completed' : 'available';
    } else if (lessonIndex === daysDiff) {
      // Clase del día actual
      return 'current';
    } else {
      // Clases futuras
      return 'locked';
    }
  };

  // Calcular progreso basado en clases completadas
  const progressPercentage = (course as any)?.lessons ? (completedLessons.length / (course as any).lessons.length) * 100 : 0;

  useEffect(() => {
    if (!coursesLoading && !purchasesLoading) {
      if (!course) {
        router.push('/dashboard');
        return;
      }
      
      if (!isCoursePurchased) {
        router.push(`/course/${courseId}`);
        return;
      }
    }
  }, [course, isCoursePurchased, coursesLoading, purchasesLoading, router, courseId]);

  const handleLessonComplete = () => {
    // Aquí iría la lógica para marcar la lección como completada
    console.log('Lección completada:', currentLesson?.title);
  };

  const handleRatingSubmit = () => {
    if (userRating > 0) {
      // Aquí iría la lógica para guardar la calificación
      console.log('Calificación enviada:', userRating);
      setUserRating(0);
    }
  };

  const handleCommentSubmit = () => {
    if (userComment.trim()) {
      const newComment = {
        id: comments.length + 1,
        user: session?.user?.name || 'Usuario',
        avatar: '👤',
        comment: userComment,
        rating: userRating,
        date: new Date().toISOString().split('T')[0]
      };
      setComments([newComment, ...comments]);
      setUserComment('');
    }
  };

  if (coursesLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando progreso del curso...</p>
        </div>
      </div>
    );
  }

  if (!course || !isCoursePurchased) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Progreso del curso</p>
                <p className="text-lg font-semibold text-gray-900">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video de la Clase Actual */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                {currentLesson?.video_url ? (
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster={currentLesson.thumbnail_url}
                  >
                    <source src={currentLesson.video_url} type="video/mp4" />
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl font-semibold">Video de la clase</p>
                      <p className="text-gray-300">Próximamente disponible</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentLesson?.title || 'Clase no disponible'}
                    </h1>
                    <p className="text-gray-600">
                      {currentLesson?.description || 'Descripción de la clase'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{currentLesson?.duration || '30 min'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Día {currentLessonIndex + 1} de {(course as any).lessons?.length || 0}</span>
                  </div>
                </div>

                <button
                  onClick={handleLessonComplete}
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Marcar como Completada
                </button>
              </div>
            </div>

            {/* Racha de Entrenamientos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-6 h-6 text-[#85ea10] mr-2" />
                Tu Racha de Entrenamientos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#85ea10] mb-2">{workoutStreak}</div>
                  <div className="text-sm text-gray-600">Días consecutivos</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{completedLessons.length}</div>
                  <div className="text-sm text-gray-600">Clases completadas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round((completedLessons.length / ((course as any).lessons?.length || 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Progreso total</div>
                </div>
              </div>
            </div>

            {/* Calificaciones y Comentarios */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="w-6 h-6 text-yellow-500 mr-2" />
                Califica esta Clase
              </h2>
              
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className={`w-8 h-8 ${
                        star <= userRating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                  {userRating > 0 && (
                    <span className="text-sm text-gray-600 ml-2">
                      {userRating === 1 ? 'Muy malo' : 
                       userRating === 2 ? 'Malo' :
                       userRating === 3 ? 'Regular' :
                       userRating === 4 ? 'Bueno' : 'Excelente'}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleRatingSubmit}
                  disabled={userRating === 0}
                  className="bg-[#85ea10] hover:bg-[#7dd30f] disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Enviar Calificación
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Comentarios
                </h3>
                
                <div className="mb-4">
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Comparte tu experiencia con esta clase..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!userComment.trim()}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Comentar
                  </button>
                </div>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                        {comment.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{comment.user}</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= comment.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progreso del Curso */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Curso</h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progreso</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#85ea10] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                {(course as any).lessons?.map((lesson: any, index: number) => {
                  const status = getLessonStatus(index);
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        status === 'current' ? 'bg-[#85ea10]/10 border border-[#85ea10] cursor-pointer' :
                        status === 'completed' ? 'bg-green-50 cursor-pointer' :
                        status === 'available' ? 'bg-gray-50 cursor-pointer' :
                        'bg-gray-100 cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => {
                        if (status !== 'locked') {
                          // Aquí podrías actualizar el currentLessonIndex si fuera necesario
                          // Por ahora mantenemos la lógica automática basada en días
                        }
                      }}
                    >
                    <div className="flex-shrink-0">
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : status === 'current' ? (
                        <Play className="w-5 h-5 text-[#85ea10]" />
                      ) : status === 'available' ? (
                        <Play className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.duration || '30 min'}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Información del Curso */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Curso</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {(course as any).lessons?.length || 0} clases
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Iniciado el {effectivePurchase?.start_date ? new Date(effectivePurchase.start_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {course.level || 'Intermedio'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
