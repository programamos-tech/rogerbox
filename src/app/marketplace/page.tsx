'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { Play, Clock, Users, Star, Filter, Search, ShoppingCart, Heart, Zap, Target, Utensils, BookOpen, ChefHat, User, LogOut, ChevronDown, Settings, Bookmark, Calendar, Award, TrendingUp } from 'lucide-react';
import SimpleLoading from '@/components/SimpleLoading';

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: number; // días
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  rating: number;
  students: number;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  description: string;
  lessons: number;
  isNew?: boolean;
  isPopular?: boolean;
  discount?: number;
  tags: string[];
  whatYouWillLearn: string[];
  requirements: string[];
}

const sampleCourses: Course[] = [
  {
    id: '1',
    title: 'Bajar de Peso en 90 Días',
    instructor: 'María González',
    category: 'Pérdida de Peso',
    duration: 90,
    level: 'Principiante',
    rating: 4.9,
    students: 12543,
    price: 89,
    originalPrice: 149,
    thumbnail: '/images/curso-peso.jpg',
    description: 'Transforma tu cuerpo en 90 días con nuestro programa completo de pérdida de peso. Rutinas diarias, alimentación balanceada y seguimiento personalizado.',
    lessons: 90,
    isNew: true,
    isPopular: true,
    discount: 40,
    tags: ['Pérdida de Peso', 'Cardio', 'Alimentación', 'Motivación'],
    whatYouWillLearn: [
      'Rutinas de cardio efectivas',
      'Plan de alimentación saludable',
      'Técnicas de motivación',
      'Seguimiento de progreso'
    ],
    requirements: [
      'Ropa cómoda para ejercicio',
      'Espacio para moverse',
      'Dispositivo para ver las clases',
      'Compromiso de 30 min diarios'
    ]
  },
  {
    id: '2',
    title: 'Fuerza Total en 60 Días',
    instructor: 'Carlos Ruiz',
    category: 'Fuerza',
    duration: 60,
    level: 'Intermedio',
    rating: 4.8,
    students: 8934,
    price: 79,
    originalPrice: 129,
    thumbnail: '/images/curso-fuerza.jpg',
    description: 'Desarrolla fuerza muscular y resistencia con nuestro programa de 60 días. Ejercicios progresivos y técnicas avanzadas.',
    lessons: 60,
    isPopular: true,
    discount: 39,
    tags: ['Fuerza', 'Resistencia', 'Músculo', 'Progresión'],
    whatYouWillLearn: [
      'Técnicas de levantamiento',
      'Progresión de ejercicios',
      'Prevención de lesiones',
      'Planificación de entrenamientos'
    ],
    requirements: [
      'Pesas o bandas de resistencia',
      'Colchoneta',
      'Espacio para entrenar',
      'Experiencia básica en ejercicio'
    ]
  },
  {
    id: '3',
    title: 'Yoga para Principiantes - 30 Días',
    instructor: 'Ana Martínez',
    category: 'Yoga',
    duration: 30,
    level: 'Principiante',
    rating: 4.7,
    students: 15678,
    price: 49,
    thumbnail: '/images/curso-yoga.jpg',
    description: 'Inicia tu viaje en el yoga con nuestro programa de 30 días. Posturas básicas, respiración y relajación.',
    lessons: 30,
    isNew: true,
    tags: ['Yoga', 'Flexibilidad', 'Relajación', 'Mindfulness'],
    whatYouWillLearn: [
      'Posturas básicas de yoga',
      'Técnicas de respiración',
      'Meditación y relajación',
      'Mejora de flexibilidad'
    ],
    requirements: [
      'Colchoneta de yoga',
      'Ropa cómoda',
      'Espacio tranquilo',
      'Dispositivo para ver las clases'
    ]
  },
  {
    id: '4',
    title: 'HIIT Intenso - 45 Días',
    instructor: 'Diego López',
    category: 'Cardio',
    duration: 45,
    level: 'Avanzado',
    rating: 4.9,
    students: 6789,
    price: 69,
    originalPrice: 99,
    thumbnail: '/images/curso-hiit.jpg',
    description: 'Quema grasa y mejora tu condición física con entrenamientos HIIT de alta intensidad.',
    lessons: 45,
    isPopular: true,
    discount: 30,
    tags: ['HIIT', 'Cardio', 'Quema de Grasa', 'Alta Intensidad'],
    whatYouWillLearn: [
      'Rutinas HIIT efectivas',
      'Técnicas de alta intensidad',
      'Quema de grasa optimizada',
      'Mejora de condición física'
    ],
    requirements: [
      'Ropa deportiva',
      'Espacio para moverse',
      'Buen estado físico',
      'Dispositivo para ver las clases'
    ]
  },
  {
    id: '5',
    title: 'Nutrición Deportiva - 21 Días',
    instructor: 'Sofia Rodríguez',
    category: 'Nutrición',
    duration: 21,
    level: 'Principiante',
    rating: 4.6,
    students: 4321,
    price: 39,
    thumbnail: '/images/curso-nutricion.jpg',
    description: 'Aprende los fundamentos de la nutrición deportiva y optimiza tu rendimiento.',
    lessons: 21,
    tags: ['Nutrición', 'Alimentación', 'Rendimiento', 'Salud'],
    whatYouWillLearn: [
      'Fundamentos de nutrición',
      'Alimentación pre y post entrenamiento',
      'Hidratación adecuada',
      'Suplementación básica'
    ],
    requirements: [
      'Dispositivo para ver las clases',
      'Cuaderno para apuntes',
      'Acceso a ingredientes frescos',
      'Compromiso de aprendizaje'
    ]
  },
  {
    id: '6',
    title: 'Flexibilidad Completa - 28 Días',
    instructor: 'Elena Vargas',
    category: 'Flexibilidad',
    duration: 28,
    level: 'Principiante',
    rating: 4.5,
    students: 5432,
    price: 35,
    thumbnail: '/images/curso-flexibilidad.jpg',
    description: 'Mejora tu flexibilidad y movilidad con ejercicios específicos para todo el cuerpo.',
    lessons: 28,
    tags: ['Flexibilidad', 'Movilidad', 'Estiramiento', 'Relajación'],
    whatYouWillLearn: [
      'Ejercicios de flexibilidad',
      'Técnicas de estiramiento',
      'Mejora de movilidad articular',
      'Relajación muscular'
    ],
    requirements: [
      'Colchoneta',
      'Ropa cómoda',
      'Espacio para estirar',
      'Dispositivo para ver las clases'
    ]
  }
];

const categories = [
  { id: 'all', name: 'Todos', icon: '🌟', color: 'bg-white/20' },
  { id: 'Pérdida de Peso', name: 'Pérdida de Peso', icon: '⚖️', color: 'bg-blue-500/20' },
  { id: 'Fuerza', name: 'Fuerza', icon: '💪', color: 'bg-red-500/20' },
  { id: 'Yoga', name: 'Yoga', icon: '🧘‍♀️', color: 'bg-purple-500/20' },
  { id: 'Cardio', name: 'Cardio', icon: '❤️', color: 'bg-pink-500/20' },
  { id: 'Nutrición', name: 'Nutrición', icon: '🥗', color: 'bg-green-500/20' },
  { id: 'Flexibilidad', name: 'Flexibilidad', icon: '🤸', color: 'bg-cyan-500/20' }
];

export default function HomePage() {
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!!user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const filteredCourses = sampleCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.students - a.students;
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  if (authLoading) {
    return <SimpleLoading />;
  }

  if (!!user) {
    return <SimpleLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#164151]/80 dark:via-[#29839c]/70 dark:to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-gray-200 dark:border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#cursos" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Cursos</a>
              <a href="/#about" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Qué es RogerBox</a>
              <a href="/#empresas" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Servicio para Empresas</a>
              <a href="/#contacto" className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">Contacto</a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transforma tu cuerpo en
            <span className="text-[#85ea10] block">90 días</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-white/80 mb-8 max-w-2xl mx-auto">
            Accede a cursos especializados de fitness con acceso temporal. 
            Compra el curso que necesites y completa tu transformación paso a paso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('cursos')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Play className="w-6 h-6" />
              <span>Ver Cursos</span>
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 border border-white/20"
            >
              Comenzar Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100/80 dark:bg-white/5 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#85ea10] mb-2">50K+</div>
              <div className="text-gray-700 dark:text-white/80">Estudiantes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#85ea10] mb-2">100+</div>
              <div className="text-gray-700 dark:text-white/80">Cursos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#85ea10] mb-2">4.9</div>
              <div className="text-gray-700 dark:text-white/80">Rating Promedio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#85ea10] mb-2">90</div>
              <div className="text-gray-700 dark:text-white/80">Días de Acceso</div>
            </div>
          </div>
        </div>
      </section>

      {/* About RogerBox Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  ¿Quién es <span className="text-[#85ea10]">RogerBox</span>?
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/80 leading-relaxed">
                  RogerBox nació en <strong className="text-[#85ea10]">Sincelejo en 2019</strong> de la visión y pasión de 
                  <strong className="text-gray-900 dark:text-white"> Roger Barreto</strong>, un licenciado en Educación Física 
                  con más de una década de experiencia transformando vidas a través del fitness.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-bold text-xl">🏠</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      La Casa de Alta Intensidad
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      Roger creó un espacio único donde la alta intensidad se convierte en el camino hacia la transformación física y mental.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-bold text-xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Enfoque en Quema de Grasa
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      Especializados en programas diseñados específicamente para bajar de peso y quemar grasa de manera efectiva y sostenible.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#85ea10] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-bold text-xl">💪</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Transformación Integral
                    </h3>
                    <p className="text-gray-600 dark:text-white/80">
                      No solo cambiamos cuerpos, transformamos mentes. Nuestra filosofía: 
                      <strong className="text-[#85ea10]"> "Transforma tu cuerpo cambiando tu mente"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Nuestro Impacto
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#85ea10]">5+</div>
                    <div className="text-sm text-gray-600 dark:text-white/80">Años de experiencia</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#85ea10]">1000+</div>
                    <div className="text-sm text-gray-600 dark:text-white/80">Vidas transformadas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image/Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#85ea10]/20 to-[#7dd30f]/20 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto">
                    <span className="text-6xl">💪</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Roger Barreto
                  </h3>
                  <p className="text-gray-600 dark:text-white/80">
                    Fundador y Director de RogerBox
                  </p>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Licenciado en Educación Física
                  </p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#85ea10] rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#7dd30f] rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Cursos Disponibles
            </h2>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-2xl mx-auto">
              Elige el curso que mejor se adapte a tus objetivos y comienza tu transformación hoy mismo.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-12">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl pl-12 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:outline-none focus:border-[#85ea10] backdrop-blur-lg"
              />
            </div>

            {/* Category Filters */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-4 h-4 text-gray-500 dark:text-white/60" />
                <span className="text-gray-700 dark:text-white/80 font-medium">Categorías:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                      selectedCategory === category.id
                        ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                        : 'bg-white/80 dark:bg-white/10 text-gray-700 dark:text-white border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/15 hover:border-[#85ea10]/30'
                    }`}
                  >
                    <span className="text-base">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-white/80 font-medium">Ordenar por:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                    sortBy === 'popular'
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                  }`}
                >
                  <span className="text-base">🔥</span>
                  <span>Más populares</span>
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                    sortBy === 'newest'
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                  }`}
                >
                  <span className="text-base">🆕</span>
                  <span>Más recientes</span>
                </button>
                <button
                  onClick={() => setSortBy('price-low')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                    sortBy === 'price-low'
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                  }`}
                >
                  <span className="text-base">💰</span>
                  <span>Precio: menor a mayor</span>
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                    sortBy === 'rating'
                      ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/15 hover:border-[#85ea10]/30'
                  }`}
                >
                  <span className="text-base">⭐</span>
                  <span>Mejor valorados</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-white/80">
              {sortedCourses.length} curso{sortedCourses.length !== 1 ? 's' : ''} encontrado{sortedCourses.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/15 hover:border-[#85ea10]/30 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer group shadow-lg dark:shadow-none"
                onClick={() => router.push(`/course/${(course as any).slug || course.id}`)}
              >
                {/* Course Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-[#85ea10]/20 to-[#7dd30f]/20">
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white/40" />
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {course.isNew && (
                      <div className="bg-[#85ea10] text-black px-3 py-1.5 rounded-lg text-xs font-black tracking-wide shadow-lg border-2 border-black/20">
                        NUEVO
                      </div>
                    )}
                    {course.isPopular && (
                      <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-lg">
                        POPULAR
                      </div>
                    )}
                  </div>

                  {course.discount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                      -{course.discount}%
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    {course.duration} días
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#85ea10] rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-black" />
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#85ea10] text-sm font-medium">{course.category}</span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{course.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-white/60 text-sm line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  {/* Instructor */}
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-4 h-4 text-gray-500 dark:text-white/60" />
                    <span className="text-gray-700 dark:text-white/80 text-sm">{course.instructor}</span>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-white/60 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessons} clases</span>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-white/20 px-2 py-1 rounded text-gray-700 dark:text-white">
                      {course.level}
                    </span>
                  </div>

                  {/* Price and Purchase Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-[#85ea10] font-bold text-2xl">
                        ${course.price}
                      </div>
                      {course.originalPrice && (
                        <div className="text-gray-500 dark:text-white/60 line-through text-lg">
                          ${course.originalPrice}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/course/${(course as any).slug || course.id}`);
                      }}
                      className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Comprar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sortedCourses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No se encontraron cursos</h3>
              <p className="text-white/60 mb-6">Intenta ajustar tus filtros de búsqueda</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100/80 dark:bg-white/5 backdrop-blur-lg border-t border-gray-200 dark:border-white/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ROGER<span className="text-[#85ea10]">BOX</span>
            </h3>
            <p className="text-gray-600 dark:text-white/60 mb-6">
              Transforma tu cuerpo, transforma tu vida
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}