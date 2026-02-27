'use client';

import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Home,
  Play,
  Search,
  ShoppingCart,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { trackCourseView } from '@/lib/analytics';

interface Course {
  id: string;
  title: string;
  short_description?: string;
  description: string;
  preview_image?: string | null;
  price: number;
  discount_percentage?: number;
  category: string;
  category_name?: string;
  duration_days: number;
  students_count: number;
  students?: number;
  rating: number;
  calories_burned?: number;
  level: string;
  is_published?: boolean;
  created_at?: string;
  // Campos adicionales para la UI
  instructor?: string;
  lessons?: number;
  isNew?: boolean;
  isPopular?: boolean;
  original_price?: number;
  thumbnail?: string;
  tags?: string[];
  whatYouWillLearn?: string[];
  requirements?: string[];
  lessons_count?: number;
  duration?: string;
}

export default function HomePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  // Usar el hook ULTRA RÁPIDO
  const {
    courses,
    loading: loadingCourses,
    error: coursesError,
  } = useUnifiedCourses();

  // Estado para controlar el navbar
  const [isScrolled, setIsScrolled] = useState(false);
  // Estado para controlar la carga del video
  const [videoLoaded, setVideoLoaded] = useState(false);
  // Estado para controlar el carrusel
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);

  // Refs para el carrusel
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const mainCourseRef = useRef<HTMLDivElement>(null);
  const nutritionCarouselRef = useRef<HTMLDivElement>(null);
  const mainPlanRef = useRef<HTMLDivElement>(null);

  // Redirigir al dashboard si el usuario está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Efecto para detectar scroll y cambiar navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroHeight = window.innerHeight;

      // Cambiar navbar cuando se hace scroll más allá del 80% del hero
      setIsScrolled(scrollPosition > heroHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mostrar todos los cursos sin filtros
  const displayedCourses = courses;

  // Efecto para centrar el curso principal en el carrusel al cargar
  useEffect(() => {
    if (
      displayedCourses.length === 1 &&
      carouselContainerRef.current &&
      mainCourseRef.current
    ) {
      // Usar setTimeout para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        const container = carouselContainerRef.current;
        const mainCourse = mainCourseRef.current;

        if (container && mainCourse) {
          // Calcular el scroll necesario para centrar el curso principal
          const containerWidth = container.offsetWidth;
          const mainCourseLeft = mainCourse.offsetLeft;
          const mainCourseWidth = mainCourse.offsetWidth;

          // Centrar el curso principal horizontalmente
          const scrollPosition =
            mainCourseLeft - containerWidth / 2 + mainCourseWidth / 2;

          // Hacer scroll al centro (sin behavior smooth para que sea instantáneo al cargar)
          container.scrollTo({
            left: scrollPosition,
            behavior: 'auto',
          });
        }
      }, 100);
    }
  }, [displayedCourses.length, courses]);

  // Efecto para centrar el plan principal en el carrusel al cargar
  useEffect(() => {
    if (nutritionCarouselRef.current && mainPlanRef.current) {
      // Usar setTimeout más largo para asegurar que el DOM esté completamente renderizado
      setTimeout(() => {
        const container = nutritionCarouselRef.current;
        const mainPlan = mainPlanRef.current;

        if (container && mainPlan) {
          const containerWidth = container.offsetWidth;
          const mainPlanLeft = mainPlan.offsetLeft;
          const mainPlanWidth = mainPlan.offsetWidth;

          // En móvil, cada plan ocupa el 100% del ancho, así que centramos el Plan Avanzado
          // En desktop, también lo centramos
          const scrollPosition =
            mainPlanLeft - containerWidth / 2 + mainPlanWidth / 2;

          container.scrollTo({
            left: scrollPosition,
            behavior: 'auto',
          });
        }
      }, 200);
    }
  }, []);

  // Funciones para navegar el carrusel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselContainerRef.current) {
      const container = carouselContainerRef.current;
      const scrollAmount = 400; // Cantidad de scroll en píxeles

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const scrollNutritionCarousel = (direction: 'left' | 'right') => {
    if (nutritionCarouselRef.current) {
      const container = nutritionCarouselRef.current;
      const scrollAmount = 400; // Cantidad de scroll en píxeles

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <QuickLoading message="Cargando..." duration={3000} />;
  }

  // Si el usuario está autenticado, mostrar loading mientras redirige
  if (user) {
    return (
      <QuickLoading message="Redirigiendo al dashboard..." duration={3000} />
    );
  }

  // Cursos "en progreso" de ejemplo (estos serían cursos que tienen is_published: false o un campo in_progress)
  const inProgressCourses: Partial<Course>[] = [
    {
      id: 'in-progress-1',
      title: 'Entrenamiento Funcional Avanzado',
      preview_image: '/images/curso1.jpeg',
      category_name: 'Funcional',
    },
    {
      id: 'in-progress-2',
      title: 'Yoga y Meditación',
      preview_image: '/images/curso2.jpeg',
      category_name: 'Bienestar',
    },
  ];

  const getSectionTitle = () => {
    return 'Nuestros Cursos';
  };

  type CourseLike = Partial<Course> & {
    category_name?: string;
    category?: string;
    lessons_count?: number;
    duration?: string;
    students?: number;
  };
  const calculateFinalPrice = (course: CourseLike) => {
    const price = course.price || 0;
    const discount = course.discount_percentage || 0;
    if (discount > 0) return Math.round(price * (1 - discount / 100));
    return price;
  };
  const calculateOriginalPrice = (course: CourseLike) => course.price || 0;
  const categoryNames: Record<string, string> = {
    lose_weight: 'Bajar de Peso',
    gain_muscle: 'Ganar Músculo',
    improve_endurance: 'Mejorar Resistencia',
    functional: 'Funcional',
    wellness: 'Bienestar',
    general: 'General',
  };
  const getCategoryDisplayName = (course: CourseLike) => {
    if (course.category_name && !String(course.category_name).includes('_'))
      return course.category_name;
    const code = course.category_name || course.category || '';
    return categoryNames[code] || code || 'General';
  };

  const scrollCoursesCarousel = (direction: 'left' | 'right') => {
    const container = document.getElementById('landing-courses-carousel');
    if (!container) return;
    const firstCard = container.querySelector('div > div') as HTMLElement;
    const scrollAmount = firstCard
      ? firstCard.offsetWidth + (window.innerWidth < 640 ? 16 : 32)
      : 400;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Video Background - Fixed behind hero and navbar only */}
      <div className="fixed inset-0 z-0" style={{ height: '100vh' }}>
        {/* Fondo negro mientras carga el video */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
        ></div>

        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/videos/roger-hero-preview.webp"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoLoaded(false)}
        >
          <source src="/videos/roger-hero.webm" type="video/webm" />
          <source src="/videos/roger-hero-optimized.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 dark:from-black/30 dark:to-black/40"></div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-20 backdrop-blur-md transition-all duration-300 overflow-visible ${
          isScrolled
            ? 'bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="w-full px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-center justify-between h-20 w-full">
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex items-center hover:scale-105 hover:opacity-90 transition-all duration-300 ease-out group"
                style={{ minWidth: 'fit-content' }}
              >
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight whitespace-nowrap">
                  <span
                    className={`${isScrolled ? 'text-gray-900 dark:text-white' : 'text-white dark:text-white'} drop-shadow-md group-hover:text-[#85ea10] transition-colors duration-300`}
                  >
                    ROGER
                  </span>
                  <span className="text-[#85ea10] drop-shadow-md group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                    BOX
                  </span>
                </h1>
              </button>
            </div>

            {/* Navigation */}
            {/* <nav className="hidden md:flex items-center space-x-8">
              <a href="/#cursos" className={`transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                  : 'text-white/90 hover:text-white dark:text-white/90 dark:hover:text-white'
              }`}>Cursos</a>
              <a href="/about" className={`transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                  : 'text-white/90 hover:text-white dark:text-white/90 dark:hover:text-white'
              }`}>Qué es RogerBox</a>
              <a href="/enterprises" className={`transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                  : 'text-white/90 hover:text-white dark:text-white/90 dark:hover:text-white'
              }`}>Servicio para Empresas</a>
              <a href="/contact" className={`transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white' 
                  : 'text-white/90 hover:text-white dark:text-white/90 dark:hover:text-white'
              }`}>Contacto</a>
            </nav> */}

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => router.push('/login')}
                className={`transition-all duration-300 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-xl hover:scale-105 hover:shadow-lg text-sm md:text-base ${
                  isScrolled
                    ? 'text-gray-900 hover:text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:text-white dark:hover:bg-white/10'
                    : 'text-white hover:text-white hover:bg-white/10 dark:text-white dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-3 py-2 md:px-6 md:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-sm md:text-base"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 pb-8">
        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 md:px-12 lg:px-20 xl:px-32 text-center max-w-[95%] lg:max-w-[90%] xl:max-w-full mx-auto">
          <div className="space-y-5 md:space-y-6">
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-5 uppercase tracking-tight leading-[1.2]">
              <div className="drop-shadow-lg">QUEMA GRASA CON</div>
              <div className="text-[#85ea10] drop-shadow-lg">
                ENTRENAMIENTOS HIIT
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-xl lg:text-xl text-white/95 mb-6 md:mb-7 font-medium leading-relaxed max-w-3xl mx-auto line-clamp-3 sm:line-clamp-none">
              Transforma tu cuerpo con entrenamientos intensos de alta calidad.
              <br className="hidden md:block" />
              <span className="text-[#85ea10] font-bold">
                ¡Cada día una nueva clase te espera!
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/register')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black px-8 py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-[#85ea10]/25"
              >
                ¡EMPEZAR AHORA!
              </button>
              <button
                onClick={() => {
                  setTimeout(() => {
                    const tituloSection =
                      document.getElementById('titulo-cursos');
                    if (tituloSection) {
                      const headerOffset = 80; // Altura del header sticky
                      const elementPosition =
                        tituloSection.getBoundingClientRect().top;
                      const offsetPosition =
                        elementPosition + window.pageYOffset - headerOffset;

                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth',
                      });
                    }
                  }, 100);
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-lg text-white font-bold px-8 py-4 rounded-xl text-base md:text-lg transition-all duration-300 hover:scale-105 border border-white/30"
              >
                Ver Cursos
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-10 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Flame className="w-8 h-8 md:w-10 md:h-10 text-[#85ea10]" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">
                  Quema de Grasa
                </div>
                <div className="text-white/80 text-xs md:text-sm">
                  Resultados visibles en 2 semanas
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Dumbbell className="w-8 h-8 md:w-10 md:h-10 text-[#85ea10]" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">
                  Mejor Estado Físico
                </div>
                <div className="text-white/80 text-xs md:text-sm">
                  Fuerza y resistencia
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Home className="w-8 h-8 md:w-10 md:h-10 text-[#85ea10]" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">
                  Desde Casa
                </div>
                <div className="text-white/80 text-xs md:text-sm">
                  Sin gimnasio, sin excusas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Cursos Disponibles - Mismo componente que dashboard */}
      <section
        id="titulo-cursos"
        className="relative py-16 md:py-20 bg-white dark:bg-gray-900 w-full z-10 overflow-visible"
      >
        <div className="w-full px-4 md:px-12 lg:px-20 xl:px-32 max-w-7xl mx-auto">
          {loadingCourses ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800 h-48 w-full max-w-2xl" />
            </div>
          ) : (
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="w-5 h-5 text-[#85ea10]" />
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                      Cursos Disponibles
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transforma tu cuerpo con nuestros programas especializados
                  </p>
                </div>
                <button
                  onClick={() => router.push('/courses')}
                  className="text-sm text-[#85ea10] hover:text-[#7dd30f] font-semibold flex items-center space-x-1"
                >
                  <span>Ver todos</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!loadingCourses && displayedCourses.length > 0 && (
            <div className="relative">
              <button
                onClick={() => scrollCoursesCarousel('left')}
                className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => scrollCoursesCarousel('right')}
                className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div
                id="landing-courses-carousel"
                className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:mx-0"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div className="flex gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 md:px-6 justify-start md:justify-center">
                  {displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex-shrink-0 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[850px]"
                    >
                      <div
                        onClick={() =>
                          router.push(`/course/${course.slug || course.id}`)
                        }
                        className="flex flex-col md:flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:shadow-[#85ea10]/10 hover:border-[#85ea10]/30 transition-all duration-200 rounded-2xl cursor-pointer w-full overflow-hidden"
                      >
                        {/* Bloque de imagen con altura fija para que nunca se corte */}
                        <div className="w-full md:w-[320px] h-[220px] sm:h-[260px] md:h-[280px] flex-shrink-0 relative bg-gray-100 dark:bg-gray-700">
                          <div className="absolute inset-0 w-full h-full rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                            <img
                              src={
                                course.thumbnail ||
                                course.preview_image ||
                                '/images/course-placeholder.jpg'
                              }
                              alt={course.title}
                              className="w-full h-full object-cover object-center"
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                if (!t.src?.endsWith('course-placeholder.jpg'))
                                  t.src = '/images/course-placeholder.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 z-10">
                              <Play
                                className="w-12 h-12 text-white drop-shadow-lg"
                                fill="currentColor"
                              />
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 flex gap-2 z-20">
                            {course.isPopular && (
                              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                POPULAR
                              </span>
                            )}
                            {course.isNew && (
                              <span className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                NUEVO
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-10">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">
                              {course.rating || '4.8'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 p-4 md:p-5 lg:p-6 md:justify-between">
                          <div className="flex flex-col gap-2 sm:gap-3 mb-4 md:mb-0">
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words leading-tight line-clamp-2 sm:line-clamp-none">
                              {course.title}
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-white/80 leading-relaxed line-clamp-3 sm:line-clamp-none">
                              {course.short_description || course.description}
                            </p>
                            <div className="flex justify-center w-full">
                              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#85ea10] text-black">
                                {getCategoryDisplayName(course)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4">
                              <div className="flex items-center gap-1.5">
                                <Play className="w-4 h-4 text-[#85ea10]" />
                                <span className="text-sm text-gray-600 dark:text-white/80">
                                  {course.lessons_count ?? 0} clases
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-[#85ea10]" />
                                <span className="text-sm text-gray-600 dark:text-white/80">
                                  {course.duration ||
                                    ((course as CourseLike).duration_days
                                      ? `${(course as CourseLike).duration_days} semanas`
                                      : '8 semanas')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-[#85ea10]" />
                                <span className="text-sm text-gray-600 dark:text-white/80">
                                  {course.students_count ?? 0} estudiantes
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-[#85ea10]" />
                                <span className="text-sm text-gray-600 dark:text-white/80">
                                  {course.level || 'Todos'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                            <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                              {(course.discount_percentage ?? 0) > 0 ? (
                                <>
                                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    $
                                    {calculateFinalPrice(course).toLocaleString(
                                      'es-CO',
                                    )}
                                  </span>
                                  <span className="text-lg md:text-xl text-gray-500 dark:text-white/50 line-through">
                                    $
                                    {calculateOriginalPrice(
                                      course,
                                    ).toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-xs md:text-sm text-[#85ea10] font-bold bg-[#85ea10]/10 px-2 py-1 rounded-lg">
                                    {course.discount_percentage ?? 0}% de
                                    descuento
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                  $
                                  {calculateFinalPrice(course).toLocaleString(
                                    'es-CO',
                                  )}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/course/${course.slug || course.id}`,
                                );
                              }}
                              className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              ¡Comenzar Ahora!
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Card PRÓXIMAMENTE */}
                  <div className="flex-shrink-0 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[850px]">
                    <div
                      className="flex flex-col md:flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl w-full overflow-hidden h-auto md:min-h-[280px]"
                      style={{ filter: 'grayscale(100%)' }}
                    >
                      <div className="w-full md:w-[320px] h-[200px] sm:h-[250px] md:h-full flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                          <Play className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        </div>
                        <div className="absolute top-3 left-3 z-20">
                          <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            PRÓXIMAMENTE
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold text-gray-400 dark:text-gray-600">
                          Curso en preparación
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                          Estamos trabajando en este contenido...
                        </p>
                        <span className="inline-flex mt-3 px-3 py-1.5 rounded-full text-sm bg-gray-400 text-white w-fit">
                          Próximamente
                        </span>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Próximamente
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loadingCourses && displayedCourses.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Próximamente más cursos
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Estamos preparando nuevos programas para ti.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
