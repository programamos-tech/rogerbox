'use client';

import {
  BookOpen,
  ChevronRight,
  Filter,
  Play,
  Search,
  Star,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Footer from '@/components/Footer';
import { useSimpleCourses } from '@/hooks/useSimpleCourses';

interface Course {
  id: string;
  title: string;
  slug?: string;
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
    title: 'Transformación Total 90 Días',
    instructor: 'RogerBox',
    category: 'Pérdida de Peso',
    duration: 90,
    level: 'Intermedio',
    rating: 4.9,
    students: 2847,
    price: 89,
    originalPrice: 149,
    thumbnail: '/images/curso-transformacion.jpg',
    description:
      'Programa completo de transformación física en 90 días con desbloqueo diario de clases.',
    lessons: 90,
    isNew: true,
    isPopular: true,
    discount: 40,
    tags: ['Pérdida de Peso', 'Cardio', 'Alimentación', 'Motivación'],
    whatYouWillLearn: [
      'Técnicas de cardio efectivas',
      'Plan nutricional balanceado',
      'Rutinas de fuerza',
      'Manejo del estrés',
    ],
    requirements: [
      'Ropa cómoda para ejercicio',
      'Espacio para moverse',
      'Motivación y constancia',
    ],
  },
  {
    id: '2',
    title: 'HIIT Quema Grasa',
    instructor: 'RogerBox',
    category: 'HIIT',
    duration: 21,
    level: 'Avanzado',
    rating: 4.7,
    students: 1456,
    price: 69,
    originalPrice: 99,
    thumbnail: '/images/curso-hiit.jpg',
    description:
      'Entrenamiento de alta intensidad para quemar grasa y tonificar músculos.',
    lessons: 21,
    isNew: true,
    isPopular: false,
    discount: 30,
    tags: ['HIIT', 'Quema de Grasa', 'Alta Intensidad'],
    whatYouWillLearn: [
      'Ejercicios de alta intensidad',
      'Técnicas de respiración',
      'Intervalos efectivos',
      'Recuperación activa',
    ],
    requirements: ['Buen estado físico', 'Espacio amplio', 'Cronómetro'],
  },
  {
    id: '3',
    title: 'Fuerza y Músculo',
    instructor: 'RogerBox',
    category: 'Fuerza',
    duration: 60,
    level: 'Intermedio',
    rating: 4.8,
    students: 1923,
    price: 79,
    originalPrice: 119,
    thumbnail: '/images/curso-fuerza.jpg',
    description:
      'Desarrolla fuerza muscular con ejercicios progresivos y técnicas avanzadas.',
    lessons: 60,
    isNew: false,
    isPopular: true,
    discount: 34,
    tags: ['Fuerza', 'Músculo', 'Progresión'],
    whatYouWillLearn: [
      'Técnicas de levantamiento',
      'Progresión de cargas',
      'Anatomía muscular',
      'Prevención de lesiones',
    ],
    requirements: [
      'Pesas o bandas de resistencia',
      'Colchoneta',
      'Consistencia',
    ],
  },
  {
    id: '4',
    title: 'Cardio Intenso',
    instructor: 'RogerBox',
    category: 'Cardio',
    duration: 30,
    level: 'Avanzado',
    rating: 4.9,
    students: 2156,
    price: 59,
    originalPrice: 89,
    thumbnail: '/images/curso-cardio.jpg',
    description:
      'Entrenamientos cardiovasculares de alta intensidad para llevar tu resistencia al límite.',
    lessons: 30,
    isNew: false,
    isPopular: true,
    discount: 34,
    tags: ['Cardio', 'Resistencia', 'Condición Física'],
    whatYouWillLearn: [
      'Ejercicios cardiovasculares',
      'Control de frecuencia cardíaca',
      'Técnicas de respiración',
      'Endurance training',
    ],
    requirements: [
      'Ropa deportiva',
      'Espacio para correr',
      'Monitor de frecuencia cardíaca',
    ],
  },
  {
    id: '5',
    title: 'Tonificación Total',
    instructor: 'RogerBox',
    category: 'Tonificación',
    duration: 45,
    level: 'Intermedio',
    rating: 4.6,
    students: 1543,
    price: 69,
    originalPrice: 99,
    thumbnail: '/images/curso-tonificacion.jpg',
    description:
      'Define y tonifica tu cuerpo con ejercicios específicos para cada grupo muscular.',
    lessons: 45,
    isNew: false,
    isPopular: false,
    discount: 30,
    tags: ['Tonificación', 'Definición', 'Resistencia'],
    whatYouWillLearn: [
      'Ejercicios de tonificación',
      'Técnicas de definición',
      'Rutinas específicas',
      'Mantenimiento',
    ],
    requirements: ['Pesas ligeras', 'Colchoneta', 'Disciplina'],
  },
  {
    id: '6',
    title: 'Ganancia Muscular',
    instructor: 'RogerBox',
    category: 'Músculo',
    duration: 75,
    level: 'Avanzado',
    rating: 4.8,
    students: 987,
    price: 99,
    originalPrice: 149,
    thumbnail: '/images/curso-musculo.jpg',
    description:
      'Maximiza tu crecimiento muscular con ejercicios de alta intensidad.',
    lessons: 75,
    isNew: true,
    isPopular: false,
    discount: 34,
    tags: ['Músculo', 'Hipertrofia', 'Progresión'],
    whatYouWillLearn: [
      'Técnicas de hipertrofia',
      'Periodización',
      'Nutrición para músculo',
      'Recuperación',
    ],
    requirements: [
      'Equipamiento completo',
      'Plan nutricional',
      'Descanso adecuado',
    ],
  },
];

export default function CoursesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Usar el hook simple para obtener cursos de Supabase
  const {
    courses: supabaseCourses,
    loading,
    error,
    refresh,
  } = useSimpleCourses();

  const categories = [
    { id: 'all', name: 'Todos', emoji: '🌟' },
    { id: 'Pérdida de Peso', name: 'Pérdida de Peso', emoji: '🔥' },
    { id: 'HIIT', name: 'HIIT', emoji: '⚡' },
    { id: 'Fuerza', name: 'Fuerza', emoji: '💪' },
    { id: 'Cardio', name: 'Cardio', emoji: '❤️' },
    { id: 'Tonificación', name: 'Tonificación', emoji: '✨' },
    { id: 'Músculo', name: 'Músculo', emoji: '🏋️' },
  ];

  const sortOptions = [
    { id: 'newest', name: 'Más Recientes', emoji: '🆕' },
    { id: 'popular', name: 'Más Populares', emoji: '🔥' },
    { id: 'rating', name: 'Mejor Calificados', emoji: '⭐' },
    { id: 'price-low', name: 'Precio: Menor a Mayor', emoji: '💰' },
    { id: 'price-high', name: 'Precio: Mayor a Menor', emoji: '💎' },
  ];

  // Usar cursos de Supabase si están disponibles, sino usar datos de muestra
  const allCourses =
    supabaseCourses.length > 0
      ? supabaseCourses.map((course) => ({
          id: course.id,
          title: course.title,
          instructor: 'RogerBox',
          category: course.category_name,
          duration: 30, // Valor por defecto
          level: course.level as 'Principiante' | 'Intermedio' | 'Avanzado',
          rating: course.rating,
          students: course.students_count,
          price: course.price,
          originalPrice: course.original_price,
          thumbnail: course.thumbnail,
          description: course.description,
          lessons: course.lessons_count,
          isNew: course.isNew,
          isPopular: course.isPopular,
          discount: course.discount_percentage,
          tags: [course.category_name],
          whatYouWillLearn: [
            'Técnicas avanzadas',
            'Rutinas efectivas',
            'Motivación constante',
          ],
          requirements: [
            'Ropa cómoda',
            'Espacio para ejercitarse',
            'Motivación',
          ],
        }))
      : sampleCourses;

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (selectedSort) {
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      case 'popular':
        return b.students - a.students;
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const getSectionTitle = () => {
    switch (selectedSort) {
      case 'newest':
        return 'Nuevos Cursos';
      case 'popular':
        return 'Más Populares';
      case 'rating':
        return 'Mejor Calificados';
      case 'price-low':
        return 'Precios Accesibles';
      case 'price-high':
        return 'Cursos Premium';
      default:
        return 'Todos los Cursos';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#164151]/80 dark:via-[#29839c]/70 dark:to-[#29839c]/60">
      {/* Header */}
      <header className="bg-transparent border-b border-gray-200 dark:border-white/20 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  ROGER<span className="text-[#85ea10]">BOX</span>
                </h1>
              </button>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/courses" className="text-[#85ea10] font-semibold">
                Cursos
              </a>
              <a
                href="/about"
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Qué es RogerBox
              </a>
              <a
                href="/enterprises"
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Servicio para Empresas
              </a>
              <a
                href="/contact"
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Contacto
              </a>
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

      {/* Courses Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {getSectionTitle()}
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/80 max-w-2xl mx-auto">
              Elige el curso que mejor se adapte a tus objetivos y comienza tu
              transformación hoy mismo.
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
                <span className="text-gray-700 dark:text-white/80 font-medium">
                  Categorías:
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${
                      selectedCategory === category.id
                        ? 'bg-[#85ea10] text-black border-[#85ea10] shadow-lg'
                        : 'bg-white/80 dark:bg-white/10 text-gray-700 dark:text-white border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/15 hover:border-[#85ea10]/30'
                    }`}
                  >
                    <span className="text-base">{category.emoji}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-white/80 font-medium">
                Ordenar por:
              </span>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSort(option.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedSort === option.id
                        ? 'bg-[#85ea10] text-black'
                        : 'bg-white/80 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/15'
                    }`}
                  >
                    <span>{option.emoji}</span>
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#85ea10]"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Cargando cursos...
              </h3>
              <p className="text-white/60">
                Obteniendo los mejores cursos para ti
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Error al cargar cursos
              </h3>
              <p className="text-white/60 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white/80 dark:bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/15 hover:border-[#85ea10]/30 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer group shadow-lg dark:shadow-none"
                  onClick={() =>
                    router.push(`/course/${(course as any).slug || course.id}`)
                  }
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
                        <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                          POPULAR
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[#85ea10] text-sm font-semibold">
                        {course.level}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white/60 text-sm">
                          {course.rating}
                        </span>
                        <span className="text-white/40 text-sm">
                          ({Math.floor(course.rating * 200)})
                        </span>
                      </div>
                    </div>

                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-2 group-hover:text-[#85ea10] transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-gray-600 dark:text-white/60 text-sm line-clamp-2 mb-4">
                      {course.description}
                    </p>

                    {/* Instructor */}
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-4 h-4 text-gray-500 dark:text-white/60" />
                      <span className="text-gray-700 dark:text-white/80 text-sm">
                        {course.instructor}
                      </span>
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
                          router.push(
                            `/course/${(course as any).slug || course.id}`,
                          );
                        }}
                        className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                      >
                        <span>Ver Curso</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Courses State */}
          {!loading && !error && sortedCourses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-white/60">
                Intenta ajustar los filtros o términos de búsqueda
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#85ea10]/10 to-[#7dd30f]/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para transformar tu vida?
          </h2>
          <p className="text-xl text-gray-600 dark:text-white/80 mb-8">
            Únete a miles de estudiantes que ya están transformando sus cuerpos
            con nuestros cursos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Comenzar Ahora</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="border-2 border-[#85ea10] text-[#85ea10] hover:bg-[#85ea10] hover:text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300"
            >
              Consulta Personalizada
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
