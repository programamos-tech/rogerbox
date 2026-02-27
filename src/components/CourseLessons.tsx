'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, CheckCircle, Lock, ArrowLeft, Star, Users, Target, Zap, MessageCircle, ThumbsUp, Heart, Award, TrendingUp, Flame } from 'lucide-react';
import LessonCompletionModal from './LessonCompletionModal';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  videoUrl: string;
  exercises: Exercise[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  caloriesBurned: number;
  weightLoss: number; // en gramos
}

interface Exercise {
  id: string;
  name: string;
  duration: string;
  reps: string;
  rest: string;
  description: string;
}

interface CourseLessonsProps {
  courseId: string;
  courseTitle: string;
  courseInstructor: string;
  courseDescription: string;
  courseThumbnail: string;
  courseRating: number;
  courseStudents: number;
  courseDuration: string;
  courseLevel: string;
  lessons: Lesson[];
}

export default function CourseLessons({
  courseId,
  courseTitle,
  courseInstructor,
  courseDescription,
  courseThumbnail,
  courseRating,
  courseStudents,
  courseDuration,
  courseLevel,
  lessons
}: CourseLessonsProps) {
  const router = useRouter();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const completedLessons = lessons.filter(lesson => lesson.isCompleted).length;
  const progressPercentage = (completedLessons / lessons.length) * 100;

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isLocked) {
      setSelectedLesson(lesson);
    }
  };

  const handleStartCourse = () => {
    const firstUnlockedLesson = lessons.find(lesson => !lesson.isLocked);
    if (firstUnlockedLesson) {
      setSelectedLesson(firstUnlockedLesson);
    }
  };

  const handleNextLesson = () => {
    if (selectedLesson) {
      const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
      const nextLesson = lessons[currentIndex + 1];
      if (nextLesson && !nextLesson.isLocked) {
        setSelectedLesson(nextLesson);
      }
    }
  };

  if (selectedLesson) {
    return (
      <IndividualLesson 
        lesson={selectedLesson}
        courseTitle={courseTitle}
        onBack={() => setSelectedLesson(null)}
        onNext={() => {
          const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
          const nextLesson = lessons[currentIndex + 1];
          if (nextLesson && !nextLesson.isLocked) {
            setSelectedLesson(nextLesson);
          }
        }}
        onPrevious={() => {
          const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
          const prevLesson = lessons[currentIndex - 1];
          if (prevLesson) {
            setSelectedLesson(prevLesson);
          }
        }}
        currentIndex={lessons.findIndex(l => l.id === selectedLesson.id)}
        totalLessons={lessons.length}
        showCompletionModal={showCompletionModal}
        setShowCompletionModal={setShowCompletionModal}
        onNextLesson={handleNextLesson}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-transparent border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-white hover:text-[#85ea10] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
              </div>
              
              {/* Progress */}
              <div className="text-right text-white">
                <div className="text-sm text-white/60">Progreso</div>
                <div className="font-semibold">{completedLessons}/{lessons.length} clases</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-1">
              <div className="bg-black/40 rounded-2xl p-6 border border-white/20 sticky top-8">
                {/* Course Thumbnail */}
                <div className="relative mb-6">
                  <div className="w-full h-48 bg-gradient-to-br from-[#164151] to-[#29839c] rounded-xl flex items-center justify-center">
                    <Play className="w-16 h-16 text-white/60" />
                  </div>
                  <div className="absolute top-4 right-4 bg-[#85ea10] text-black px-3 py-1 rounded-full font-bold text-sm">
                    {courseLevel}
                  </div>
                </div>

                {/* Course Details */}
                <h2 className="text-2xl font-bold text-white mb-2">{courseTitle}</h2>
                <p className="text-white/60 mb-4">por {courseInstructor}</p>
                <p className="text-white/80 text-sm mb-6">{courseDescription}</p>

                {/* Course Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>Calificación</span>
                    </div>
                    <span className="font-semibold">{courseRating}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#85ea10]" />
                      <span>Estudiantes</span>
                    </div>
                    <span className="font-semibold">{courseStudents.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Duración</span>
                    </div>
                    <span className="font-semibold">{courseDuration}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-white/60 text-sm mb-2">
                    <span>Progreso del curso</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-[#85ea10] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Start Course Button */}
                <button
                  onClick={handleStartCourse}
                  className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Continuar Curso</span>
                </button>
              </div>
            </div>

            {/* Lessons List */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Contenido del Curso</h3>
                <p className="text-white/60">{lessons.length} clases • {courseDuration}</p>
              </div>

              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`bg-black/40 rounded-xl border transition-all duration-300 cursor-pointer ${
                      lesson.isLocked
                        ? 'border-white/10 opacity-50 cursor-not-allowed'
                        : lesson.isCompleted
                        ? 'border-[#85ea10] hover:border-[#85ea10]/80'
                        : 'border-white/20 hover:border-[#85ea10]'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Lesson Number/Status */}
                        <div className="flex-shrink-0">
                          {lesson.isLocked ? (
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                              <Lock className="w-5 h-5 text-white/40" />
                            </div>
                          ) : lesson.isCompleted ? (
                            <div className="w-10 h-10 bg-[#85ea10] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-black" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{index + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* Lesson Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-white mb-1">
                                {lesson.title}
                              </h4>
                              <p className="text-white/70 text-sm mb-3 line-clamp-2">
                                {lesson.description}
                              </p>
                              
                              {/* Lesson Meta */}
                              <div className="flex items-center space-x-4 text-white/60 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{lesson.duration}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Target className="w-4 h-4" />
                                  <span>{lesson.difficulty}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Zap className="w-4 h-4" />
                                  <span>{lesson.exercises.length} ejercicios</span>
                                </div>
                              </div>
                            </div>

                            {/* Play Button */}
                            {!lesson.isLocked && (
                              <div className="flex-shrink-0 ml-4">
                                <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center hover:bg-[#7dd30f] transition-colors">
                                  <Play className="w-5 h-5 text-black ml-1" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndividualLesson({ 
  lesson, 
  courseTitle, 
  onBack, 
  onNext, 
  onPrevious, 
  currentIndex, 
  totalLessons,
  showCompletionModal,
  setShowCompletionModal,
  onNextLesson
}: {
  lesson: Lesson;
  courseTitle: string;
  onBack: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentIndex: number;
  totalLessons: number;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;
  onNextLesson: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'exercises' | 'comments' | 'reviews'>('exercises');

  const handleExerciseComplete = (exerciseId: string) => {
    if (completedExercises.includes(exerciseId)) {
      setCompletedExercises(completedExercises.filter(id => id !== exerciseId));
    } else {
      setCompletedExercises([...completedExercises, exerciseId]);
    }
  };

  const exerciseProgress = (completedExercises.length / lesson.exercises.length) * 100;

  // Simular datos de comentarios y evaluaciones
  const comments = [
    {
      id: 1,
      user: 'María González',
      avatar: 'M',
      time: '2 horas',
      text: 'Excelente clase! Me encantó la explicación de los fundamentos del HIIT.',
      likes: 12,
      isLiked: false
    },
    {
      id: 2,
      user: 'Carlos Ruiz',
      avatar: 'C',
      time: '1 día',
      text: 'Perfecto para principiantes. Roger explica muy bien cada ejercicio.',
      likes: 8,
      isLiked: true
    },
    {
      id: 3,
      user: 'Ana Martínez',
      avatar: 'A',
      time: '3 días',
      text: 'Ya completé esta clase 3 veces. Cada vez me siento más fuerte!',
      likes: 15,
      isLiked: false
    }
  ];

  const reviews = [
    {
      id: 1,
      user: 'Luis Pérez',
      rating: 5,
      text: 'Increíble curso! Roger es un excelente instructor.',
      date: 'Hace 1 semana'
    },
    {
      id: 2,
      user: 'Sofia Herrera',
      rating: 5,
      text: 'Perfecto para empezar con HIIT. Muy bien explicado.',
      date: 'Hace 2 semanas'
    },
    {
      id: 3,
      user: 'Diego Morales',
      rating: 4,
      text: 'Buen curso, aunque me gustaría más intensidad.',
      date: 'Hace 3 semanas'
    }
  ];

  const handleLessonComplete = () => {
    if (exerciseProgress === 100) {
      setShowCompletionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-[#164151]/80 via-[#29839c]/70 to-[#164151]/60 backdrop-blur-sm z-0"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-transparent border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Back Button */}
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white hover:text-[#85ea10] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al curso</span>
              </button>
              
              {/* Lesson Progress */}
              <div className="text-center text-white">
                <div className="text-sm text-white/60">Clase {currentIndex + 1} de {totalLessons}</div>
                <div className="font-semibold">{lesson.title}</div>
              </div>
              
              {/* Course Title */}
              <div className="text-right text-white/60 text-sm max-w-xs">
                <div className="truncate">{courseTitle}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Video Section */}
            <div className="lg:col-span-3">
              <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/20">
                {/* Video Player */}
                <div className="relative aspect-video bg-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 bg-[#85ea10] rounded-full flex items-center justify-center hover:bg-[#7dd30f] transition-colors"
                    >
                      <Play className="w-8 h-8 text-black ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/60 rounded-lg p-3">
                      <div className="w-full bg-white/20 rounded-full h-1 mb-2">
                        <div className="bg-[#85ea10] h-1 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <div className="flex justify-between text-white text-sm">
                        <span>5:30</span>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{lesson.title}</h2>
                  <p className="text-white/80 mb-4">{lesson.description}</p>
                  
                  {/* Lesson Meta */}
                  <div className="flex items-center space-x-6 text-white/60 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{lesson.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{lesson.exercises.length} ejercicios</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                  className="px-6 py-3 bg-transparent border border-white/30 hover:border-[#85ea10] text-white hover:text-[#85ea10] font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                
                <button
                  onClick={onNext}
                  disabled={currentIndex === totalLessons - 1}
                  className="px-6 py-3 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Tabs */}
                <div className="bg-black/40 rounded-2xl p-2 border border-white/20">
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setActiveTab('exercises')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'exercises'
                          ? 'bg-[#85ea10] text-black'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Ejercicios
                    </button>
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'comments'
                          ? 'bg-[#85ea10] text-black'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Comentarios
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeTab === 'reviews'
                          ? 'bg-[#85ea10] text-black'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Evaluaciones
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="bg-black/40 rounded-2xl p-6 border border-white/20 sticky top-8">
                  {activeTab === 'exercises' && (
                    <>
                      <h3 className="text-xl font-bold text-white mb-4">Ejercicios</h3>
                      
                      {/* Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between text-white/60 text-sm mb-2">
                          <span>Progreso</span>
                          <span>{completedExercises.length}/{lesson.exercises.length}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-[#85ea10] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${exerciseProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Exercises List */}
                      <div className="space-y-3">
                        {lesson.exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                              completedExercises.includes(exercise.id)
                                ? 'border-[#85ea10] bg-[#85ea10]/10'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                            onClick={() => handleExerciseComplete(exercise.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {completedExercises.includes(exercise.id) ? (
                                  <div className="w-6 h-6 bg-[#85ea10] rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-black" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-sm mb-1">
                                  {exercise.name}
                                </h4>
                                <div className="flex items-center space-x-3 text-white/60 text-xs">
                                  <span>{exercise.duration}</span>
                                  <span>{exercise.reps}</span>
                                  <span>Descanso: {exercise.rest}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Complete Lesson Button */}
                      {exerciseProgress === 100 && (
                        <button
                          onClick={handleLessonComplete}
                          className="w-full mt-6 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                          <Award className="w-5 h-5" />
                          <span>Completar Clase</span>
                        </button>
                      )}
                    </>
                  )}

                  {activeTab === 'comments' && (
                    <>
                      <h3 className="text-xl font-bold text-white mb-4">Comentarios</h3>
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border-b border-white/10 pb-4 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                                <span className="text-black font-bold text-sm">{comment.avatar}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-white font-semibold text-sm">{comment.user}</span>
                                  <span className="text-white/60 text-xs">{comment.time}</span>
                                </div>
                                <p className="text-white/80 text-sm mb-2">{comment.text}</p>
                                <button className="flex items-center space-x-1 text-white/60 hover:text-[#85ea10] transition-colors">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span className="text-xs">{comment.likes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeTab === 'reviews' && (
                    <>
                      <h3 className="text-xl font-bold text-white mb-4">Evaluaciones</h3>
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-white/10 pb-4 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                                <span className="text-black font-bold text-sm">{review.user[0]}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-white font-semibold text-sm">{review.user}</span>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-white/30'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-white/80 text-sm mb-1">{review.text}</p>
                                <span className="text-white/60 text-xs">{review.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <LessonCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onNext={onNextLesson}
        caloriesBurned={lesson.caloriesBurned}
        weightLoss={lesson.weightLoss}
      />
    </div>
  );
}
