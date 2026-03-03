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
  Heart,
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
import ScrollReveal from '@/components/ScrollReveal';
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

  // Asegurar que el curso en oferta (primero) sea visible al cargar el carrusel
  useEffect(() => {
    if (displayedCourses.length === 0) return;
    const container = document.getElementById('landing-courses-carousel');
    if (container) {
      container.scrollLeft = 0;
    }
  }, [displayedCourses.length]);

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
        <div className="w-full px-3 sm:px-4 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16 w-full">
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex items-center hover:scale-105 hover:opacity-90 transition-all duration-300 ease-out group"
                style={{ minWidth: 'fit-content' }}
              >
                <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight whitespace-nowrap">
                  <span
                    className="text-[#164151] dark:text-[#29839c] drop-shadow-md group-hover:text-[#85ea10] transition-colors duration-300"
                  >
                    ROGER
                  </span>
                  <span className="text-[#85ea10] drop-shadow-md group-hover:text-[#164151] dark:group-hover:text-[#29839c] transition-colors duration-300">
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

            {/* Auth Buttons - compactos en todos los tamaños */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              <button
                onClick={() => router.push('/login')}
                className={`transition-all duration-300 font-semibold px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:scale-105 hover:shadow-lg text-xs sm:text-sm ${
                  isScrolled
                    ? 'text-gray-900 hover:text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:text-white dark:hover:bg-white/10'
                    : 'text-white hover:text-white hover:bg-white/10 dark:text-white dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-xs sm:text-sm"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-14 sm:pt-16 md:pt-20 pb-8">
        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 text-center max-w-[95%] lg:max-w-[90%] xl:max-w-full mx-auto">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Main Title - compacto en mobile, verde de marca en HIIT */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-5 uppercase tracking-tight leading-[1.15] md:leading-[1.2]">
              <div className="drop-shadow-lg">QUEMA GRASA CON</div>
              <div className="text-[#85ea10] drop-shadow-lg mt-0.5 md:mt-0">
                ENTRENAMIENTOS HIIT
              </div>
            </h1>

            {/* Subtitle - legible, frase de cierre en verde de marca */}
            <p className="text-base sm:text-lg md:text-xl text-white/95 mb-4 md:mb-7 font-medium leading-snug md:leading-relaxed max-w-3xl mx-auto">
              Transforma tu cuerpo con entrenamientos intensos de alta calidad.
              <br className="hidden md:block" />
              <span className="text-[#85ea10] font-bold">
                ¡Cada día una nueva clase te espera!
              </span>
            </p>

            {/* CTA Buttons - mismo ancho y alto, efecto líquido en Ver Cursos */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/register')}
                className="w-[240px] sm:w-[260px] h-12 sm:h-14 flex items-center justify-center bg-[#85ea10] hover:bg-[#7dd30f] text-black font-black rounded-xl text-sm sm:text-base md:text-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 shadow-xl hover:shadow-[#85ea10]/30"
              >
                ¡EMPEZAR AHORA!
              </button>
              <button
                onClick={() => {
                  setTimeout(() => {
                    const tituloSection =
                      document.getElementById('titulo-cursos');
                    if (tituloSection) {
                      const headerOffset = 80;
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
                className="w-[240px] sm:w-[260px] h-12 sm:h-14 flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold rounded-xl text-sm sm:text-base md:text-lg transition-all duration-300 border border-white/30"
              >
                Ver Cursos
              </button>
            </div>

            {/* Features - mismo estilo en mobile y desktop: lista vertical, icono izquierda + texto derecha */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-10 max-w-lg mx-auto px-1">
              <div className="flex flex-row items-center gap-3 sm:gap-4 text-left p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#85ea10]/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#85ea10]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm sm:text-base">Quema de Grasa</div>
                  <div className="text-white/80 text-xs sm:text-sm mt-0.5">Resultados visibles en 2 semanas</div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3 sm:gap-4 text-left p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#85ea10]/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-[#85ea10]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm sm:text-base">Mejor Estado Físico</div>
                  <div className="text-white/80 text-xs sm:text-sm mt-0.5">Fuerza y resistencia</div>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3 sm:gap-4 text-left p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#85ea10]/20 flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#85ea10]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-sm sm:text-base">Desde Casa</div>
                  <div className="text-white/80 text-xs sm:text-sm mt-0.5">Sin gimnasio, sin excusas</div>
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
        <ScrollReveal className="w-full px-3 sm:px-4 md:px-12 lg:px-20 xl:px-32">
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
                <div className="flex gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 md:px-6 justify-start">
                  {/* Copiado del dashboard: Cursos Disponibles */}
                  {displayedCourses.map((course, index) => (
                    <div
                      key={course.id}
                      ref={index === 0 ? mainCourseRef : undefined}
                      className="flex-shrink-0 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[850px]"
                    >
                      <div
                        onClick={(e) => {
                          router.push(`/course/${course.slug || course.id}`);
                        }}
                        className="flex flex-col lg:flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:shadow-[#85ea10]/10 hover:border-[#85ea10]/30 transition-all duration-200 rounded-2xl cursor-pointer w-full overflow-hidden h-auto lg:h-full"
                      >
                        {/* IMAGEN - Vertical hasta lg para que en tablet el contenido no quede estrecho */}
                        <div className="w-full lg:w-[320px] h-[200px] sm:h-[250px] lg:h-full flex-shrink-0 relative">
                          <div className="absolute inset-0 w-full h-full rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none overflow-hidden">
                            <img
                              src={
                                course.thumbnail ||
                                course.preview_image ||
                                '/images/course-placeholder.jpg'
                              }
                              alt={course.title}
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: 'center center',
                                display: 'block',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (
                                  !target.src?.endsWith(
                                    'course-placeholder.jpg',
                                  )
                                ) {
                                  target.src =
                                    '/images/course-placeholder.jpg';
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 z-10">
                              <Play
                                className="w-12 h-12 text-white drop-shadow-lg"
                                fill="currentColor"
                              />
                            </div>
                          </div>

                          <div className="absolute top-3 left-6 sm:left-8 flex gap-2 z-20">
                            {index === 0 && (
                              <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                En oferta
                              </div>
                            )}
                            {course.isPopular && (
                              <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                POPULAR
                              </div>
                            )}
                            {course.isNew && (
                              <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                NUEVO
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-3 right-6 sm:right-8 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-10">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">
                              {course.rating || '4.8'}
                            </span>
                          </div>
                        </div>

                        {/* CONTENIDO - Resto del espacio; padding horizontal en sm/tablet para flechas; min-width en lg para que no se estrangule */}
                        <div className="flex-1 flex flex-col min-w-0 lg:min-w-[320px] overflow-visible p-3 pl-10 pr-10 sm:p-4 sm:pl-10 sm:pr-10 lg:p-5 lg:pl-5 lg:pr-5 xl:p-6 lg:justify-between">
                          <div className="flex flex-col gap-1.5 sm:gap-2 lg:gap-4 mb-3 lg:mb-0">
                            <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white break-words leading-tight line-clamp-2 sm:line-clamp-none">
                              {course.title}
                            </h3>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-3 sm:line-clamp-none">
                              {course.short_description || course.description}
                            </p>
                            {/* Etiqueta de categoría/objetivo: más discreta en mobile */}
                            <div className="flex justify-start sm:justify-center w-full">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-sm font-medium bg-[#85ea10]/20 text-[#164151] dark:bg-[#85ea10]/25 dark:text-[#85ea10] border border-[#85ea10]/40">
                                {getCategoryDisplayName(course)}
                              </span>
                            </div>
                            {/* Opciones del curso en una sola línea; en tablet también abreviado para que no se corte */}
                            <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-2 sm:gap-4 lg:gap-6 mb-3 lg:mb-4 overflow-x-auto scrollbar-hide min-h-[1.5rem]">
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                <Play className="w-3 h-3 sm:w-4 sm:h-4 text-[#85ea10]" />
                                <span className="text-[11px] sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                  {course.lessons_count || 0} clases
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#85ea10]" />
                                <span className="text-[11px] sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                  {course.duration || '8 semanas'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#85ea10]" />
                                <span className="text-[11px] sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                  {course.students_count || 0} est.
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#85ea10]" />
                                <span className="text-[11px] sm:text-sm text-gray-600 dark:text-white/80 whitespace-nowrap">
                                  <span className="lg:hidden">
                                    {course.level === 'Principiante'
                                      ? 'Princ.'
                                      : course.level === 'Intermedio'
                                        ? 'Inter.'
                                        : course.level === 'Avanzado'
                                          ? 'Avanz.'
                                          : course.level || 'Todos'}
                                  </span>
                                  <span className="hidden lg:inline">
                                    {course.level || 'Todos'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto lg:mt-0">
                            <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                              {(course.discount_percentage ?? 0) > 0 ? (
                                <>
                                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    $
                                    {calculateFinalPrice(
                                      course,
                                    ).toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-lg md:text-xl text-gray-500 dark:text-white/50 line-through">
                                    $
                                    {calculateOriginalPrice(
                                      course,
                                    ).toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-xs md:text-sm text-gray-900 dark:text-white font-bold bg-[#85ea10]/25 dark:bg-[#85ea10]/30 border border-[#85ea10]/50 px-2 py-1 rounded-lg">
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                router.push(
                                  `/course/${course.slug || course.id}`,
                                );
                              }}
                              style={{
                                width: '100%',
                                backgroundColor: '#85ea10',
                                color: 'black',
                                fontWeight: 'bold',
                                padding: '12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                              className="hover:bg-[#7dd30f] transition-colors duration-150 shadow-lg"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>¡Comenzar Ahora!</span>
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
        </ScrollReveal>
      </section>

      {/* Landing RogerBox: quiénes somos, HIIT, filosofía, beneficios, galería, plataforma */}
      <section
        id="rogerbox"
        className="relative py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 w-full z-10"
      >
        <div className="w-full px-3 sm:px-4 md:px-12 lg:px-20 xl:px-32 space-y-16 md:space-y-24">
          {/* Título de sección — Logo en mayúscula + azul oscuro del navbar/dashboard/admin */}
          <ScrollReveal variant="fade" className="text-center">
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              <span className="text-[#164151] dark:text-[#29839c]">Conoce </span>
              <span className="text-[#164151] dark:text-[#29839c]">ROGER</span>
              <span className="text-[#85ea10]">BOX</span>
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
              El gimnasio que llevamos a tu pantalla. Entrena HIIT donde sea, cuando sea.
            </p>
          </ScrollReveal>

          {/* Quiénes somos */}
          <ScrollReveal className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#85ea10]" />
                Quiénes somos
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                RogerBox nace de la pasión por el entrenamiento de alta intensidad y la idea de que
                todo el mundo puede transformar su cuerpo con la guía correcta. Somos un equipo de
                entrenadores y atletas con años de experiencia en HIIT y funcional, y hemos creado
                esta plataforma para que entrenes con la misma intensidad y calidad que en nuestro
                box, desde casa o donde estés.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-gray-200 dark:bg-gray-700">
              <img
                src="/images/555451280_1375584947910175_1641301510443057474_n.jpg"
                alt="Equipo RogerBox"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/course-placeholder.jpg';
                }}
              />
            </div>
          </ScrollReveal>

          {/* Qué es el HIIT */}
          <ScrollReveal className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1 relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-gray-200 dark:bg-gray-700">
              <img
                src="/images/curso1.jpeg"
                alt="Entrenamiento HIIT"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/course-placeholder.jpg';
                }}
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c] flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#85ea10]" />
                ¿Qué es el HIIT?
              </h3>
              <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                El <strong className="text-gray-900 dark:text-white">High Intensity Interval Training</strong> (entrenamiento
                por intervalos de alta intensidad) son sesiones cortas en las que alternas esfuerzo
                máximo con recuperaciones breves. En RogerBox usamos HIIT para quemar grasa, ganar
                resistencia y fortalecer todo el cuerpo en menos tiempo, con rutinas que puedes
                hacer con tu propio peso o material mínimo.
              </p>
            </div>
          </ScrollReveal>

          {/* Nuestra filosofía */}
          <ScrollReveal className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 md:p-10 text-center shadow-lg">
            <Target className="w-10 h-10 text-[#85ea10] mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c]">
              Nuestra filosofía
            </h3>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto">
              Creemos que la constancia y la intensidad bien dirigida cambian vidas. No vendemos
              milagros: vendemos método, acompañamiento y una comunidad que te empuja. Cada
              sesión está pensada para que des el máximo, te sientas bien y veas resultados
              reales — sin necesidad de horas interminables en el gym.
            </p>
          </ScrollReveal>

          {/* Beneficios del HIIT */}
          <ScrollReveal>
            <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c] text-center mb-8 flex items-center justify-center gap-2">
              <Flame className="w-6 h-6 text-[#85ea10]" />
              Beneficios del HIIT
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Flame, title: 'Quema grasa', text: 'Mayor gasto calórico en menos tiempo gracias al efecto afterburn.' },
                { icon: Heart, title: 'Mejor condición', text: 'Refuerza tu sistema cardiovascular y resistencia.' },
                { icon: Dumbbell, title: 'Más fuerza', text: 'Trabajo funcional que mejora fuerza y tono muscular.' },
                { icon: Clock, title: 'Sesiones cortas', text: 'Resultados con entrenamientos de 15–40 minutos.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-md hover:shadow-[#85ea10]/10 hover:border-[#85ea10]/30 transition-all"
                >
                  <item.icon className="w-8 h-8 text-[#85ea10] mb-3" />
                  <h4 className="font-bold text-[#164151] dark:text-[#29839c]">{item.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Galería del gym */}
          <ScrollReveal>
            <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c] text-center mb-8">
              Nuestro espacio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { src: '/images/555451280_1375584947910175_1641301510443057474_n.jpg', alt: 'RogerBox' },
                { src: '/images/banner.jpeg', alt: 'RogerBox banner' },
                { src: '/images/curso2.jpeg', alt: 'RogerBox entrenamiento' },
              ].map((img) => (
                <div
                  key={img.src}
                  className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-200 dark:bg-gray-700 shadow-lg"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/course-placeholder.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Qué podrás hacer en la plataforma */}
          <ScrollReveal className="rounded-2xl bg-gradient-to-br from-[#85ea10]/10 to-[#85ea10]/5 dark:from-[#85ea10]/15 dark:to-[#85ea10]/5 border border-[#85ea10]/20 p-6 md:p-10">
            <h3 className="text-xl md:text-2xl font-bold text-[#164151] dark:text-[#29839c] text-center mb-6">
              ¿Qué podrás hacer en la plataforma?
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {[
                'Cursos de HIIT y entrenamiento funcional con seguimiento semanal.',
                'Complementos del día para mantener la constancia.',
                'Planes adaptados a tu nivel (principiante a avanzado).',
                'Videos en alta calidad con la misma intensidad que en el box.',
                'Marcar tu progreso y ver tu evolución.',
                'Acceso desde cualquier dispositivo, cuando quieras.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/register')}
                className="inline-flex items-center gap-2 bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg"
              >
                <Zap className="w-5 h-5" />
                Empieza ahora
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
