'use client';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Play, 
  Clock, 
  Users, 
  MessageCircle,
  Send,
  Heart,
  Share2,
  ThumbsUp,
  Target,
  Flame,
  Timer,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  lesson_number: number;
  preview_image: string | null;
  views_count: number;
  is_preview: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  likes_count: number;
  is_liked: boolean;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [courseStats, setCourseStats] = useState({
    totalMinutes: 0,
    totalCalories: 0,
    lessonsCompleted: 0,
    streakDays: 0
  });

  useEffect(() => {
    console.log('LessonPage mounted, params:', resolvedParams);
    
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!!user) {
      loadLessonData();
      loadUserProgress();
    }
  }, [resolvedParams.id, authLoading, user, router]);

  // Cargar lecciones cuando la lección actual esté disponible
  useEffect(() => {
    if (lesson) {
      loadUpcomingLessons();
    }
  }, [lesson]);

  const loadUserProgress = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID found');
        return;
      }

      console.log('Loading user progress for user:', user.id);

      // Obtener perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Usar datos por defecto si no hay perfil en la DB
        const defaultProfile = {
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Usuario',
          weight: 0,
          target_weight: 0,
          streak_days: 0
        };
        setUserProfile(defaultProfile);
        setCourseProgress(0);
        setGoalProgress(0);
        setStreakDays(0);
        setCaloriesBurned(0);
        return;
      }

      console.log('User profile loaded:', profileData);
      setUserProfile(profileData);

      // Obtener progreso real del curso desde la DB
      const { data: courseProgressData, error: courseProgressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', lesson?.course_id || '1')
        .single();

      if (courseProgressError) {
        console.log('No hay progreso de curso registrado, usando 0%');
        setCourseProgress(0);
      } else {
        // Calcular progreso basado en lecciones completadas
        const completedLessons = courseProgressData?.completed_lessons || 0;
        const totalLessons = courseProgressData?.total_lessons || 1;
        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
        setCourseProgress(progressPercentage);
      }

      // Calcular progreso de la meta basado en calorías reales
      if (profileData?.weight && profileData?.target_weight) {
        const currentWeight = profileData.weight;
        const targetWeight = profileData.target_weight;
        const totalToLose = currentWeight - targetWeight;
        
        if (totalToLose > 0) {
          // Obtener calorías quemadas reales desde la DB
          const { data: caloriesData, error: caloriesError } = await supabase
            .from('user_lesson_completions')
            .select('calories_burned')
            .eq('user_id', user.id);

          let totalCaloriesBurned = 0;
          if (!caloriesError && caloriesData) {
            totalCaloriesBurned = caloriesData.reduce((sum, completion) => 
              sum + (completion.calories_burned || 0), 0
            );
          }

          // Calcular progreso basado en calorías (7700 cal = 1kg)
          const caloriesPerKg = 7700;
          const totalCaloriesNeeded = totalToLose * caloriesPerKg;
          const goalProgressPercentage = Math.min(100, Math.round((totalCaloriesBurned / totalCaloriesNeeded) * 100));
          
          setGoalProgress(goalProgressPercentage);
          setCaloriesBurned(totalCaloriesBurned);
        } else {
          setGoalProgress(0);
          setCaloriesBurned(0);
        }
      } else {
        setGoalProgress(0);
        setCaloriesBurned(0);
      }

      // Usar datos reales del perfil
      setStreakDays(profileData?.streak_days || 0);

    } catch (error) {
      console.error('Error loading user progress:', error);
      // En caso de error, usar datos por defecto
      const defaultProfile = {
        user_id: user?.id || 'default-user',
        name: user?.email?.split('@')[0] || 'Usuario',
        weight: 0,
        target_weight: 0,
        streak_days: 0
      };
      setUserProfile(defaultProfile);
      setCourseProgress(0);
      setGoalProgress(0);
      setStreakDays(0);
      setCaloriesBurned(0);
    }
  };

  const loadUpcomingLessons = async () => {
    try {
      // Usar el course_id de la lección actual o un default
      const courseId = lesson?.course_id || '1'; // ID del curso HIIT por defecto
      
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true });

      if (lessonsError) {
        console.error('Error fetching upcoming lessons:', lessonsError);
        return;
      }

      console.log('Lessons loaded:', lessonsData?.length || 0);
      setUpcomingLessons(lessonsData || []);
      
      // Si no hay lecciones en la DB, mostrar modal de felicitaciones
      if (!lessonsData || lessonsData.length === 0) {
        console.log('No lessons found, showing congratulations modal');
        await loadCourseStats();
        setShowCongratulationsModal(true);
      }
    } catch (error) {
      console.error('Error loading upcoming lessons:', error);
    }
  };

  const loadCourseStats = async () => {
    try {
      if (!user?.id) return;

      // Obtener estadísticas completas del curso
      const { data: completionsData, error: completionsError } = await supabase
        .from('user_lesson_completions')
        .select('calories_burned, lesson_id')
        .eq('user_id', user.id);

      if (completionsError) {
        console.error('Error fetching course stats:', completionsError);
        return;
      }

      // Obtener información de las lecciones completadas
      let totalMinutes = 0;
      let totalCalories = 0;
      let lessonsCompleted = 0;

      if (completionsData && completionsData.length > 0) {
        lessonsCompleted = completionsData.length;
        totalCalories = completionsData.reduce((sum, completion) => 
          sum + (completion.calories_burned || 0), 0
        );

        // Obtener duración de las lecciones completadas
        const lessonIds = completionsData.map(completion => completion.lesson_id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('course_lessons')
          .select('duration_minutes')
          .in('id', lessonIds);

        if (!lessonsError && lessonsData) {
          totalMinutes = lessonsData.reduce((sum, lesson) => 
            sum + (lesson.duration_minutes || 0), 0
          );
        }
      }

      setCourseStats({
        totalMinutes,
        totalCalories,
        lessonsCompleted,
        streakDays: userProfile?.streak_days || 0
      });

    } catch (error) {
      console.error('Error loading course stats:', error);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    const message = `🔥 ¡Acabo de completar mi curso de HIIT Cardio! 💪\n\n📊 Mis estadísticas:\n⏱️ ${courseStats.totalMinutes} minutos entrenados\n🔥 ${courseStats.totalCalories} calorías quemadas\n📚 ${courseStats.lessonsCompleted} lecciones completadas\n🔥 ${courseStats.streakDays} días de racha\n\n¡Gracias @RogerBox por ayudarme a alcanzar mis metas! 🎯 #Fitness #HIIT #RogerBox`;
    
    const encodedMessage = encodeURIComponent(message);
    const url = encodeURIComponent(window.location.origin);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedMessage}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage} ${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };


  const loadLessonData = async () => {
    try {
      console.log('Loading lesson data for ID:', resolvedParams.id);
      setLoading(true);
      setError(null);

      // Obtener datos reales de la lección desde la base de datos
      const { data: lessonData, error: lessonError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        // Si no se encuentra en la DB, usar datos de ejemplo
        const mockLesson: Lesson = {
          id: resolvedParams.id,
          course_id: 'mock-course-id',
          title: 'Día 1 - Full Body Express',
          description: 'Circuito completo para activar todo el cuerpo. Ejercicios de alta intensidad sin equipo.',
          video_url: '', // No hay video por ahora
          duration_minutes: 12,
          lesson_number: 1,
          preview_image: null,
          views_count: 0,
          is_preview: true,
          created_at: new Date().toISOString()
        };
        setLesson(mockLesson);
      } else {
        console.log('Real lesson data:', lessonData);
        setLesson(lessonData as Lesson);
      }

      // Cargar comentarios simulados
      loadComments();

    } catch (error) {
      console.error('Error loading lesson data:', error);
      setError('Error al cargar la lección');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      // Obtener comentarios reales desde la base de datos
      const { data: commentsData, error: commentsError } = await supabase
        .from('lesson_comments')
        .select(`
          *,
          user_profiles!inner(name, avatar_url)
        `)
        .eq('lesson_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        // Si hay error, usar comentarios simulados como fallback
        const mockComments: Comment[] = [
          {
            id: '1',
            lesson_id: resolvedParams.id,
            user_id: 'user1',
            content: '¡Excelente lección! Muy clara y fácil de seguir.',
            created_at: new Date().toISOString(),
            user_name: 'María González',
            user_avatar: null,
            likes_count: 12,
            is_liked: false
          },
          {
            id: '2',
            lesson_id: resolvedParams.id,
            user_id: 'user2',
            content: 'Me encantó la explicación paso a paso. ¡Gracias!',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user_name: 'Carlos Ruiz',
            user_avatar: null,
            likes_count: 8,
            is_liked: true
          },
          {
            id: '3',
            lesson_id: resolvedParams.id,
            user_id: 'user3',
            content: '¿Alguien más tuvo problemas con el ejercicio 3?',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            user_name: 'Ana Martínez',
            user_avatar: null,
            likes_count: 5,
            is_liked: false
          }
        ];
        setComments(mockComments);
      } else {
        // Convertir datos de la DB al formato esperado
        const realComments: Comment[] = commentsData?.map(comment => ({
          id: comment.id,
          lesson_id: comment.lesson_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          user_name: comment.user_profiles?.name || 'Usuario',
          user_avatar: comment.user_profiles?.avatar_url || null,
          likes_count: comment.likes_count || 0,
          is_liked: comment.is_liked || false
        })) || [];
        
        setComments(realComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      // En caso de error, usar comentarios simulados
      setComments([]);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    try {
      // Guardar comentario en la base de datos
      const { data: newCommentData, error: insertError } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: resolvedParams.id,
          user_id: user.id,
          content: newComment.trim(),
          likes_count: 0,
          is_liked: false
        })
        .select(`
          *,
          user_profiles!inner(name, avatar_url)
        `)
        .single();

      if (insertError) {
        console.error('Error saving comment:', insertError);
        // Si hay error, agregar comentario localmente como fallback
        const fallbackComment: Comment = {
          id: Date.now().toString(),
          lesson_id: resolvedParams.id,
          user_id: user.id,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          user_name: user.email?.split('@')[0] || 'Usuario',
          user_avatar: null,
          likes_count: 0,
          is_liked: false
        };
        setComments(prev => [fallbackComment, ...prev]);
      } else {
        // Convertir datos de la DB al formato esperado
        const realComment: Comment = {
          id: newCommentData.id,
          lesson_id: newCommentData.lesson_id,
          user_id: newCommentData.user_id,
          content: newCommentData.content,
          created_at: newCommentData.created_at,
          user_name: newCommentData.user_profiles?.name || 'Usuario',
          user_avatar: newCommentData.user_profiles?.avatar_url || null,
          likes_count: newCommentData.likes_count || 0,
          is_liked: newCommentData.is_liked || false
        };
        setComments(prev => [realComment, ...prev]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const newLikeStatus = !comment.is_liked;
      const newLikesCount = newLikeStatus ? comment.likes_count + 1 : comment.likes_count - 1;

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('lesson_comments')
        .update({
          is_liked: newLikeStatus,
          likes_count: newLikesCount
        })
        .eq('id', commentId);

      if (updateError) {
        console.error('Error updating like:', updateError);
        // Si hay error, actualizar solo localmente
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes_count: newLikesCount,
                is_liked: newLikeStatus 
              }
            : comment
        ));
      } else {
        // Actualizar estado local
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes_count: newLikesCount,
                is_liked: newLikeStatus 
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  console.log('Render state:', { loading, error, lesson: !!lesson, user: !!user });

  if (loading) {
    console.log('Showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando lección...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    console.log('Showing error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-[#85ea10] text-black px-4 py-2 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
  
  if (!lesson) {
    console.log('No lesson found');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 text-xl mb-4">Lección no encontrada</p>
          <button 
            onClick={() => router.back()}
            className="bg-[#85ea10] text-black px-4 py-2 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  console.log('Render state:', { user: !!user, userProfile: !!userProfile, courseProgress, goalProgress, streakDays, caloriesBurned });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video principal */}
          <div className="lg:col-span-3 space-y-4">
            {/* Video player */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative group">
                {lesson.video_url ? (
                  <div className="relative w-full h-full">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      poster={lesson.preview_image || undefined}
                    >
                      <source src={lesson.video_url} type="video/mp4" />
                      Tu navegador no soporta el elemento video.
                    </video>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Video no disponible</p>
                    <p className="text-gray-500 text-sm mt-2">Esta lección aún no tiene video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Próximas Clases */}
            {upcomingLessons.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 text-[#85ea10] mr-2" />
                  Próximas Clases
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingLessons.slice(0, 6).map((upcomingLesson, index) => (
                    <div
                      key={upcomingLesson.id}
                      className={`p-3 rounded-lg border ${
                        upcomingLesson.id === lesson?.id
                          ? 'bg-[#85ea10]/10 border-[#85ea10]'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          upcomingLesson.id === lesson?.id
                            ? 'bg-[#85ea10]'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {upcomingLesson.id === lesson?.id ? (
                            <Play className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {upcomingLesson.lesson_number}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${
                            upcomingLesson.id === lesson?.id
                              ? 'text-[#85ea10]'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {upcomingLesson.lesson_number}. {upcomingLesson.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{upcomingLesson.duration_minutes} min</span>
                            {upcomingLesson.id === lesson?.id && (
                              <span className="bg-[#85ea10] text-white px-2 py-1 rounded-full text-xs font-medium">
                                Actual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Información de la lección */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {lesson.lesson_number}. {lesson.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {lesson.description}
                  </p>
                  
                  {/* Estadísticas de la lección */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{lesson.views_count} visualizaciones</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{comments.length} comentarios</span>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorited 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={() => {/* Lógica para compartir */}}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Comentarios ({comments.length})
              </h3>

              {/* Formulario de comentario */}
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe tu comentario..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#85ea10] focus:border-[#85ea10] bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm"
                      rows={2}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      newComment.trim()
                        ? 'bg-[#85ea10] hover:bg-[#7dd30f] text-black'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Lista de comentarios */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-[#85ea10] rounded-full flex items-center justify-center text-black font-semibold text-xs">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-xs">
                            {comment.user_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-xs mb-1">
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center space-x-1 text-xs transition-colors ${
                              comment.is_liked
                                ? 'text-[#85ea10]'
                                : 'text-gray-500 dark:text-gray-400 hover:text-[#85ea10]'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.likes_count}</span>
                          </button>
                          <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            Responder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Section - Moved to sidebar below comments */}
            {(() => {
              console.log('Rendering progress section in sidebar:', { user: !!user, courseProgress, goalProgress, streakDays, caloriesBurned });
              return true;
            })() && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 text-[#85ea10] mr-2" />
                  Tu Progreso
                </h3>
                <div className="space-y-3">
                  {/* Combined Progress Card */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-5 h-5 bg-[#85ea10] rounded-md flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-white">
                        Progreso General
                      </span>
                    </div>
                    
                    {/* Course Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Curso</span>
                        <span className="text-sm font-bold text-[#85ea10]">{courseProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-[#85ea10] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${courseProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Goal Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Meta de Peso</span>
                        <span className="text-sm font-bold text-blue-600">{goalProgress}%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {userProfile?.weight}kg → {userProfile?.target_weight}kg
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${goalProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Stats Card */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center">
                        <Flame className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-white">
                        Estadísticas
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Streak Days */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-500 mb-1">
                          {streakDays}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          días racha
                        </div>
                      </div>

                      {/* Calories Burned */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-500 mb-1">
                          {caloriesBurned}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          calorías
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Felicitaciones */}
        {showCongratulationsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-[#85ea10] to-[#7dd30f] p-6 rounded-t-2xl text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¡Felicidades! 🎉
                </h2>
                <p className="text-white/90 text-sm">
                  Has completado todas las lecciones del curso
                </p>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6">
                {/* Estadísticas del Curso */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                    📊 Tu Resumen de Entrenamiento
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Minutos Entrenados */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Timer className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {courseStats.totalMinutes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        minutos entrenados
                      </div>
                    </div>

                    {/* Calorías Quemadas */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {courseStats.totalCalories}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        calorías quemadas
                      </div>
                    </div>

                    {/* Lecciones Completadas */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {courseStats.lessonsCompleted}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        lecciones completadas
                      </div>
                    </div>

                    {/* Días de Racha */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {courseStats.streakDays}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        días de racha
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensaje Motivacional */}
                <div className="bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      ¡Eres una Máquina! 💪
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Has demostrado una dedicación increíble. ¡Sigue así y alcanzarás todas tus metas!
                    </p>
                  </div>
                </div>

                {/* Botones de Compartir */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    🚀 ¡Comparte tu Logro!
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => shareToSocialMedia('twitter')}
                      className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <span>🐦</span>
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('facebook')}
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <span>📘</span>
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('whatsapp')}
                      className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => shareToSocialMedia('linkedin')}
                      className="flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                    >
                      <span>💼</span>
                      <span>LinkedIn</span>
                    </button>
                  </div>
                </div>

                {/* Botón de Cerrar */}
                <button
                  onClick={() => setShowCongratulationsModal(false)}
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  ¡Gracias! 🎯
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}