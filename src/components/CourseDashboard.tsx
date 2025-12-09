'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Play, Clock, Users, Star, Filter, Search, ArrowRight, Trophy, Target, Zap, Utensils, BookOpen, ChefHat, User, LogOut, ChevronDown, Settings, Bookmark } from 'lucide-react';
// ComplementSection removed - focusing on courses only

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  rating: number;
  students: number;
  price: number;
  thumbnail: string;
  description: string;
  lessons: number;
  isRecommended?: boolean;
}

interface CourseDashboardProps {
  userProfile: {
    id: string;
    name: string;
    email: string;
    height: number;
    gender: string;
    weight: number;
    goals: string[];
  };
}

export default function CourseDashboard({ userProfile }: CourseDashboardProps) {
  const router = useRouter();
  const { signOut: handleSignOut } = useSupabaseAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Lógica inteligente para determinar el estado del usuario
  console.log('CourseDashboard - userProfile:', userProfile);
  console.log('CourseDashboard - goals:', userProfile?.goals);
  console.log('CourseDashboard - goals length:', userProfile?.goals?.length);
  
  const isNewUser = !userProfile?.goals || userProfile.goals.length === 0;
  const hasCompletedOnboarding = userProfile?.goals && userProfile.goals.length > 0;
  const hasEnrolledCourses = false; // TODO: Implementar lógica real de cursos inscritos
  
  console.log('CourseDashboard - isNewUser:', isNewUser);
  console.log('CourseDashboard - hasCompletedOnboarding:', hasCompletedOnboarding);

  const handleLogout = async () => {
    try {
      await handleSignOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎯' },
    { id: 'lose_weight', name: 'Bajar de Peso', icon: '🔥' },
    { id: 'tone', name: 'Tonificar', icon: '💪' },
    { id: 'gain_muscle', name: 'Ganar Músculo', icon: '🏋️' },
    { id: 'endurance', name: 'Resistencia', icon: '🏃' },
    { id: 'hiit', name: 'HIIT', icon: '⚡' },
    { id: 'strength', name: 'Fuerza', icon: '💪' }
  ];

  const defaultCourses: Course[] = [
    {
      id: '1',
      title: 'Transformación Total 90 Días',
      instructor: 'RogerBox',
      category: 'lose_weight',
      duration: '90 días',
      level: 'Intermedio',
      rating: 4.9,
      students: 2847,
      price: 89,
      thumbnail: '/images/curso-transformacion.jpg',
      description: 'Programa completo de transformación física en 90 días con desbloqueo diario de clases.',
      lessons: 90,
      isRecommended: userProfile?.goals?.includes('lose_weight') || false
    },
    {
      id: '2',
      title: 'HIIT Quema Grasa',
      instructor: 'RogerBox',
      category: 'hiit',
      duration: '21 días',
      level: 'Avanzado',
      rating: 4.7,
      students: 1456,
      price: 69,
      thumbnail: '/images/curso-hiit.jpg',
      description: 'Entrenamiento de alta intensidad para quemar grasa y tonificar músculos.',
      lessons: 21,
      isRecommended: userProfile?.goals?.includes('hiit') || false
    },
    {
      id: '3',
      title: 'Fuerza y Músculo',
      instructor: 'RogerBox',
      category: 'strength',
      duration: '60 días',
      level: 'Intermedio',
      rating: 4.8,
      students: 1923,
      price: 79,
      thumbnail: '/images/curso-fuerza.jpg',
      description: 'Desarrolla fuerza muscular con ejercicios progresivos y técnicas avanzadas.',
      lessons: 60,
      isRecommended: userProfile?.goals?.includes('strength') || false
    },
    {
      id: '4',
      title: 'Cardio Intenso',
      instructor: 'RogerBox',
      category: 'endurance',
      duration: '30 días',
      level: 'Avanzado',
      rating: 4.9,
      students: 2156,
      price: 59,
      thumbnail: '/images/curso-cardio.jpg',
      description: 'Entrenamientos cardiovasculares de alta intensidad para llevar tu resistencia al límite.',
      lessons: 30,
      isRecommended: userProfile?.goals?.includes('endurance') || false
    },
    {
      id: '5',
      title: 'Tonificación Total',
      instructor: 'RogerBox',
      category: 'tone',
      duration: '45 días',
      level: 'Intermedio',
      rating: 4.6,
      students: 1543,
      price: 69,
      thumbnail: '/images/curso-tonificacion.jpg',
      description: 'Define y tonifica tu cuerpo con ejercicios específicos para cada grupo muscular.',
      lessons: 45,
      isRecommended: userProfile?.goals?.includes('tone') || false
    },
    {
      id: '6',
      title: 'Ganancia Muscular',
      instructor: 'RogerBox',
      category: 'gain_muscle',
      duration: '75 días',
      level: 'Avanzado',
      rating: 4.8,
      students: 987,
      price: 99,
      thumbnail: '/images/curso-musculo.jpg',
      description: 'Maximiza tu crecimiento muscular con ejercicios de alta intensidad.',
      lessons: 75,
      isRecommended: userProfile?.goals?.includes('gain_muscle') || false
    }
  ];

  const filteredCourses = defaultCourses.filter(course => {
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recommendedCourses = defaultCourses.filter(course => course.isRecommended);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#164151]/80 via-[#29839c]/70 to-[#29839c]/60 text-white">
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-transparent border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-white">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
              </div>
              
              {/* User Profile Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-[#85ea10] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-black" />
                  </div>
                  <div className="text-left text-white">
                    <div className="font-semibold text-sm">{userProfile?.name || 'Usuario'}</div>
                    <div className="text-xs text-white/60">{userProfile?.email || 'email@ejemplo.com'}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">{userProfile?.name || 'Usuario'}</div>
                      <div className="text-sm text-gray-600">{userProfile?.email || 'email@ejemplo.com'}</div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/profile');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Mi Perfil</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">
              ¡Hola, {userProfile?.name || 'Usuario'}! 👋
            </h2>
            <p className="text-white/80">
              {isNewUser 
                ? '¡Bienvenido a RogerBox! Comienza tu transformación'
                : 'Listo para tu próxima sesión de entrenamiento'
              }
            </p>
            
          </div>

          {/* Complement Section - Prioridad para usuarios nuevos */}
          {/* Complement section removed - focusing on courses only */}

          {/* My Courses Section - Solo si el usuario tiene cursos inscritos */}
          {hasEnrolledCourses && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Trophy className="w-6 h-6" />
                  <span>Mis Cursos</span>
                </h3>
                <button className="text-[#85ea10] hover:text-[#7dd30f] transition-colors">
                  Ver todos
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample enrolled course */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-[#85ea10] text-black px-3 py-1 rounded-full text-sm font-bold">
                      En Progreso
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2">
                    HIIT para Principiantes
                  </h4>
                  <p className="text-white/60 mb-4">
                    Rutinas de alta intensidad perfectas para empezar
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>30 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>1,234 estudiantes</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-1">
                      <span>Progreso</span>
                      <span>3/8 clases</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#85ea10] h-2 rounded-full" style={{ width: '37.5%' }}></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Continuar</span>
                  </button>
                </div>
                
                {/* Sample completed course */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Completado
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2">
                    Cardio Intenso
                  </h4>
                  <p className="text-white/60 mb-4">
                    Entrenamientos cardiovasculares de alta intensidad
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>45 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>2,156 estudiantes</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-1">
                      <span>Progreso</span>
                      <span>8/8 clases</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Ver Certificado</span>
                  </button>
                </div>
                
                {/* Empty state for more courses */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/60 mb-4">Explora más cursos</p>
                    <button className="text-[#85ea10] hover:text-[#7dd30f] transition-colors font-medium">
                      Ver catálogo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          


          {/* Complement Section - Prioridad para usuarios nuevos */}
          {/* Complement section removed - focusing on courses only */}

          {/* My Courses Section - Solo si el usuario tiene cursos inscritos */}
          {hasEnrolledCourses && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Trophy className="w-6 h-6" />
                  <span>Mis Cursos</span>
                </h3>
                <button className="text-[#85ea10] hover:text-[#7dd30f] transition-colors">
                  Ver todos
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sample enrolled course */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-[#85ea10] text-black px-3 py-1 rounded-full text-sm font-bold">
                      En Progreso
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2">
                    HIIT para Principiantes
                  </h4>
                  <p className="text-white/60 mb-4">
                    Rutinas de alta intensidad perfectas para empezar
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>30 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>1,234 estudiantes</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-1">
                      <span>Progreso</span>
                      <span>3/8 clases</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#85ea10] h-2 rounded-full" style={{ width: '37.5%' }}></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Continuar</span>
                  </button>
                </div>
                
                {/* Sample completed course */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Completado
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-2">
                    Cardio Intenso
                  </h4>
                  <p className="text-white/60 mb-4">
                    Entrenamientos cardiovasculares de alta intensidad
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>45 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>2,156 estudiantes</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-1">
                      <span>Progreso</span>
                      <span>8/8 clases</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Ver Certificado</span>
                  </button>
                </div>
                
                {/* Empty state for more courses */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/60 mb-4">Explora más cursos</p>
                    <button className="text-[#85ea10] hover:text-[#7dd30f] transition-colors font-medium">
                      Ver catálogo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          


          {/* Recommended Courses Section */}
          <div id="recommended-courses" className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              {isNewUser ? 'Cursos Destacados' : 'Cursos Recomendados para Ti'}
            </h3>
            <p className="text-white/80 mb-6">
              {isNewUser 
                ? 'Descubre nuestros cursos más populares y comienza tu transformación'
                : `Basado en tus objetivos: ${userProfile?.goals?.map(goal => 
                    categories.find(cat => cat.id === goal)?.name
                  ).join(', ') || 'Todos los cursos'}`
              }
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <select
                  className="w-full md:w-auto bg-white/10 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#85ea10]"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-gray-800 text-white">
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-[#85ea10] text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Recommended Courses */}
            {recommendedCourses.length > 0 && selectedCategory === 'all' && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Recomendados para Ti</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-black/40 rounded-2xl overflow-hidden border border-white/20 hover:border-[#85ea10] transition-all duration-300 group cursor-pointer"
                      onClick={() => router.push(`/course/${(course as any).slug || course.id}`)}
                    >
                      {/* Course card content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-[#85ea10] text-black px-3 py-1 rounded-full text-sm font-bold">
                            Recomendado
                          </span>
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">{course.rating}</span>
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-bold text-white mb-2">
                          {course.title}
                        </h4>
                        <p className="text-white/60 mb-4">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{course.students.toLocaleString()} estudiantes</span>
                          </div>
                        </div>
                        
                        <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                          <Play className="w-5 h-5" />
                          <span>Ver Curso</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Courses */}
            <div className="mb-8">
              <h4 className="text-xl font-bold text-white mb-6">
                {selectedCategory === 'all' ? 'Todos los Cursos' : 
                 categories.find(cat => cat.id === selectedCategory)?.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div
                    key={course.id}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/course/${(course as any).slug || course.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {course.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-2">
                      {course.title}
                    </h4>
                    <p className="text-white/60 mb-4">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()} estudiantes</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2">
                      <Play className="w-5 h-5" />
                      <span>Ver Curso</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nutritional Plans Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Utensils className="w-6 h-6" />
                <span>Planes Nutricionales</span>
              </h3>
              <button
                onClick={() => router.push('/nutritional-plans')}
                className="text-[#85ea10] hover:text-[#7dd30f] transition-colors"
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Nutritional Plan Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Pérdida de Peso
                  </span>
                  <span className="text-lg font-bold text-white">$29.99</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Plan Keto Semanal
                </h4>
                <p className="text-white/60 mb-4">
                  Recetas bajas en carbohidratos para una semana completa.
                </p>
                <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300">
                  Comprar Plan
                </button>
              </div>
              {/* Another Sample Plan */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    Ganancia Muscular
                  </span>
                  <span className="text-lg font-bold text-white">$39.99</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Dieta Hiperproteica
                </h4>
                <p className="text-white/60 mb-4">
                  Maximiza tu crecimiento muscular con este plan de 4 semanas.
                </p>
                <button className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300">
                  Comprar Plan
                </button>
              </div>
            </div>
          </div>

          {/* Nutritional Blog Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-6 h-6" />
                <span>Blog Nutricional</span>
              </h3>
              <button
                onClick={() => router.push('/nutritional-blogs')}
                className="text-[#85ea10] hover:text-[#7dd30f] transition-colors"
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Blog Post Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    GRATIS
                  </span>
                  <span className="text-sm text-white/60">5 min lectura</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Los 5 Mejores Alimentos para Quemar Grasa
                </h4>
                <p className="text-white/60 mb-4">
                  Descubre qué alimentos te ayudarán a acelerar tu metabolismo.
                </p>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
                  Leer Artículo
                </button>
              </div>
              {/* Another Sample Blog Post */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    GRATIS
                  </span>
                  <span className="text-sm text-white/60">8 min lectura</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Guía Completa de Suplementos
                </h4>
                <p className="text-white/60 mb-4">
                  Todo lo que necesitas saber sobre proteínas, creatina y más.
                </p>
                <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
                  Leer Artículo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}