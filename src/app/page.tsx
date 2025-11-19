'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Play, Clock, Users, Star, Search, ArrowRight, User, BookOpen, Award, TrendingUp, Zap, Utensils, Target, CheckCircle, ShoppingCart, Flame, Dumbbell, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';
import Footer from '@/components/Footer';
import { trackCourseView } from '@/lib/analytics';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';

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
}


export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Usar el hook ULTRA RÁPIDO
  const { courses, loading: loadingCourses, error: coursesError } = useUnifiedCourses();
  
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
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

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
    if (displayedCourses.length === 1 && carouselContainerRef.current && mainCourseRef.current) {
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
          const scrollPosition = mainCourseLeft - (containerWidth / 2) + (mainCourseWidth / 2);
          
          // Hacer scroll al centro (sin behavior smooth para que sea instantáneo al cargar)
          container.scrollTo({
            left: scrollPosition,
            behavior: 'auto'
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
          const scrollPosition = mainPlanLeft - (containerWidth / 2) + (mainPlanWidth / 2);
          
          container.scrollTo({
            left: scrollPosition,
            behavior: 'auto'
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

  // Si está cargando la sesión, mostrar loading
  if (status === 'loading') {
    return <QuickLoading message="Cargando..." duration={3000} />;
  }

  // Si el usuario está autenticado, mostrar loading mientras redirige
  if (status === 'authenticated') {
    return <QuickLoading message="Redirigiendo al dashboard..." duration={3000} />;
  }

  // Cursos "en progreso" de ejemplo (estos serían cursos que tienen is_published: false o un campo in_progress)
  const inProgressCourses: Partial<Course>[] = [
    {
      id: 'in-progress-1',
      title: 'Entrenamiento Funcional Avanzado',
      preview_image: '/images/curso1.jpeg',
      category_name: 'Funcional'
    },
    {
      id: 'in-progress-2',
      title: 'Yoga y Meditación',
      preview_image: '/images/curso2.jpeg',
      category_name: 'Bienestar'
    }
  ];

  const getSectionTitle = () => {
    return 'Nuestros Cursos';
  };


  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Video Background - Fixed behind hero and navbar only */}
      <div className="fixed inset-0 z-0" style={{ height: '100vh' }}>
        {/* Fondo negro mientras carga el video */}
        <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}></div>
        
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className={`w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          onError={() => {
            console.warn('⚠️ Video de fondo no disponible, usando fondo negro');
            // Mantener el fondo negro si el video no se puede cargar
            setVideoLoaded(false);
          }}
        >
          <source src="/roger-hero.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 dark:from-black/30 dark:to-black/40"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-20 backdrop-blur-md transition-all duration-300 overflow-visible ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-transparent border-b border-transparent'
      }`}>
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
                  <span className={`${isScrolled ? 'text-gray-900 dark:text-white' : 'text-white dark:text-white'} drop-shadow-md group-hover:text-[#85ea10] transition-colors duration-300`}>ROGER</span>
                  <span className="text-[#85ea10] drop-shadow-md group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">BOX</span>
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
              <div className="text-[#85ea10] drop-shadow-lg">ENTRENAMIENTOS HIIT</div>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-xl lg:text-xl text-white/95 mb-6 md:mb-7 font-medium leading-relaxed max-w-3xl mx-auto line-clamp-3 sm:line-clamp-none">
              Transforma tu cuerpo con entrenamientos intensos de alta calidad. 
              <br className="hidden md:block" />
              <span className="text-[#85ea10] font-bold">¡Cada día una nueva clase te espera!</span>
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
                    const tituloSection = document.getElementById('titulo-cursos');
                    if (tituloSection) {
                      const headerOffset = 80; // Altura del header sticky
                      const elementPosition = tituloSection.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
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
                <div className="text-white font-semibold text-sm md:text-base mb-1">Quema de Grasa</div>
                <div className="text-white/80 text-xs md:text-sm">Resultados visibles en 2 semanas</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Dumbbell className="w-8 h-8 md:w-10 md:h-10 text-[#85ea10]" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">Mejor Estado Físico</div>
                <div className="text-white/80 text-xs md:text-sm">Fuerza y resistencia</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Home className="w-8 h-8 md:w-10 md:h-10 text-[#85ea10]" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base mb-1">Desde Casa</div>
                <div className="text-white/80 text-xs md:text-sm">Sin gimnasio, sin excusas</div>
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

      {/* Section Title */}
      <section id="titulo-cursos" className="relative py-10 md:py-12 bg-white dark:bg-gray-900 w-full">
        <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 text-center max-w-full mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight mb-3 md:mb-4">
            <span>EMPIEZA CON </span>
            <span className="text-[#85ea10]">NUESTROS CURSOS</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 dark:text-white/80 font-medium leading-relaxed max-w-3xl mx-auto">
            Entrena desde casa con solo <span className="text-[#85ea10] font-bold">20 minutos al día</span> y pon tu cuerpo <span className="text-[#85ea10] font-bold">10/10</span>
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" className="pt-0 pb-12 md:pb-16 lg:pb-20 bg-white dark:bg-gray-900 relative z-10 w-full" style={{ overflow: 'visible' }}>
          {loadingCourses ? (
        <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 max-w-full mx-auto">
            <div className="text-center py-12 md:py-16">
              <div className="animate-spin rounded-full h-12 w-12 md:h-14 md:w-14 border-b-2 border-[#85ea10] mx-auto mb-4"></div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cargando cursos...
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-white/60">
                Estamos preparando los mejores cursos para ti
              </p>
            </div>
          </div>
        ) : displayedCourses.length === 1 ? (
          // Un solo curso - Card original centrado con cursos en progreso a los lados
          <div className="w-full pb-0 relative py-4 md:py-6">
            {/* Botón flecha izquierda */}
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-2 md:left-4 top-[60%] md:top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
              aria-label="Scroll izquierda"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Botón flecha derecha */}
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-2 md:right-4 top-[60%] md:top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700"
              aria-label="Scroll derecha"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Contenedor con scroll horizontal */}
            <div 
              ref={carouselContainerRef}
              className="overflow-x-auto md:overflow-x-auto overflow-y-visible" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex gap-4 md:gap-6 lg:gap-8 xl:gap-12 px-4 md:px-6 lg:px-20 xl:px-32 justify-start md:justify-center md:items-stretch md:align-content-stretch min-h-[500px] md:min-h-[550px]">
                {/* Curso en progreso a la izquierda */}
                {inProgressCourses[0] && (
                  <div className="flex flex-shrink-0 opacity-50 pointer-events-none w-full md:w-auto" style={{ alignSelf: 'stretch', display: 'flex' }}>
                    <div 
                      className="flex flex-col md:flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden w-full md:max-w-[850px] h-auto md:h-[500px]"
                      style={{
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        filter: 'grayscale(100%)'
                      }}
                    >
                      {/* IMAGEN - Vertical en mobile, horizontal en desktop */}
                      <div className="w-full md:w-[320px] h-[250px] md:h-full flex-shrink-0 relative">
                        <div className="w-full h-full relative rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                          <img 
                            src={inProgressCourses[0].preview_image || '/images/course-placeholder.jpg'} 
                            alt={inProgressCourses[0].title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                          />
                          <div className="absolute inset-0 bg-black/30"></div>
                        </div>
                        
                        <div className="absolute top-3 left-3 flex gap-2 z-10">
                          <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            EN PROGRESO
                          </div>
                        </div>
                        
                        <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-10">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">-</span>
                        </div>
                      </div>
                      
                      {/* CONTENIDO - Misma estructura que el card principal */}
                      <div className="flex-1 flex flex-col min-w-0 overflow-visible p-4 md:p-5 lg:p-6 md:justify-between">
                        <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-0">
                          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words leading-tight">
                            {inProgressCourses[0].title}
                          </h3>
                          <p className="text-xs md:text-sm lg:text-base text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-3">
                            Preparándolo para ti...
                          </p>
                          <div className="flex justify-center w-full">
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {inProgressCourses[0].category_name || 'En preparación'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="flex items-center justify-center space-x-2">
                              <Play className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Clases</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Duración</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Estudiantes</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Zap className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Nivel</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Zap className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-semibold text-gray-400 dark:text-gray-600">
                              Preparándolo...
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto md:mt-0">
                          <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                            <span className="text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-600">
                              -
                            </span>
                          </div>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Próximamente</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Curso principal en el centro - Card original sin modificar */}
                <div ref={mainCourseRef} className="flex-shrink-0 w-full md:w-auto h-full flex items-stretch">
                  {displayedCourses.map(course => (
                      <div 
                        key={course.id} 
                        onClick={(e) => {
                          console.log('🖱️ Landing card clicked:', course.title);
                          router.push(`/course/${course.slug || course.id}`);
                        }}
                        className="flex flex-col md:flex-row bg-gray-100 dark:bg-gray-800 hover:shadow-xl hover:shadow-[#85ea10]/5 transition-all duration-150 rounded-2xl cursor-pointer w-full md:max-w-[850px] mx-auto overflow-hidden h-auto md:h-[500px]"
                      >
                        {/* IMAGEN - Vertical en mobile, horizontal en desktop */}
                        <div className="w-full md:w-[320px] h-[250px] md:h-full flex-shrink-0 relative">
                          <div className="w-full h-full relative rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                            <img 
                              src={course.thumbnail || course.preview_image || '/images/course-placeholder.jpg'} 
                              alt={course.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/course-placeholder.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                              <Play className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" />
                            </div>
                          </div>
                          
                          <div className="absolute top-3 left-3 flex gap-2 z-10">
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
                          
                          <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-10">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold">{course.rating}</span>
                          </div>
                        </div>
                        
                        {/* CONTENIDO - Resto del espacio */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-visible p-4 md:p-5 lg:p-6 md:justify-between">
                          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-0">
                            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words leading-tight">
                              {course.title}
                            </h3>
                            <p className="text-xs md:text-sm lg:text-base text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-3">
                              {course.short_description || course.description}
                            </p>
                            <div className="flex justify-center w-full">
                              <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#85ea10] text-black">
                                {course.category_name || 'Sin categoría'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="flex items-center justify-center space-x-2">
                                <Play className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                                <div className="flex flex-col items-center">
                                  <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Clases</div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.lessons_count || 1}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <Clock className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                                <div className="flex flex-col items-center">
                                  <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Duración</div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.duration || '30 min'}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <Users className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                                <div className="flex flex-col items-center">
                                  <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Estudiantes</div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.students_count || 0}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-center space-x-2">
                                <Zap className="w-4 h-4 text-[#85ea10] flex-shrink-0" />
                                <div className="flex flex-col items-center">
                                  <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Nivel</div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.level || 'Intermedio'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2 p-2 bg-[#85ea10]/10 rounded-lg">
                              <Zap className="w-3 h-3 md:w-4 md:h-4 text-[#85ea10] flex-shrink-0" />
                              <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                                ¡Sin límites! Para todos los niveles
                              </span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto md:mt-0">
                            <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                              {course.original_price ? (
                                <>
                                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    ${course.price?.toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-lg md:text-xl text-gray-500 dark:text-white/50 line-through">
                                    ${course.original_price?.toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-xs md:text-sm text-[#85ea10] font-bold bg-[#85ea10]/10 px-2 py-1 rounded-lg">
                                    {course.discount_percentage}% de descuento
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                  ${course.price?.toLocaleString('es-CO')}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await trackCourseView(course.id);
                                router.push(`/course/${course.slug || course.id}`);
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
                                border: 'none'
                              }}
                              className="hover:bg-[#7dd30f] transition-colors duration-150 shadow-lg"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>¡Comenzar Ahora!</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Curso en progreso a la derecha */}
                {inProgressCourses[1] && (
                  <div className="flex flex-shrink-0 opacity-50 pointer-events-none w-full md:w-auto" style={{ alignSelf: 'stretch', display: 'flex' }}>
                    <div 
                      className="flex flex-col md:flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden w-full md:max-w-[850px] h-auto md:h-[500px]"
                      style={{
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        filter: 'grayscale(100%)'
                      }}
                    >
                      {/* IMAGEN - Vertical en mobile, horizontal en desktop */}
                      <div className="w-full md:w-[320px] h-[250px] md:h-full flex-shrink-0 relative">
                        <div className="w-full h-full relative rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                          <img 
                            src={inProgressCourses[1].preview_image || '/images/course-placeholder.jpg'} 
                            alt={inProgressCourses[1].title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                          />
                          <div className="absolute inset-0 bg-black/30"></div>
                        </div>
                        
                        <div className="absolute top-3 left-3 flex gap-2 z-10">
                          <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            MUY PRONTO
                          </div>
                        </div>
                        
                        <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full z-10">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">-</span>
                        </div>
                      </div>
                      
                      {/* CONTENIDO - Misma estructura que el card principal */}
                      <div className="flex-1 flex flex-col min-w-0 overflow-visible p-4 md:p-5 lg:p-6 md:justify-between">
                        <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-0">
                          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words leading-tight">
                            {inProgressCourses[1].title}
                          </h3>
                          <p className="text-xs md:text-sm lg:text-base text-gray-700 dark:text-white/80 leading-relaxed break-words line-clamp-3">
                            Preparándolo para ti...
                          </p>
                          <div className="flex justify-center w-full">
                            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {inProgressCourses[1].category_name || 'En preparación'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="flex items-center justify-center space-x-2">
                              <Play className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Clases</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Duración</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Estudiantes</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                              <Zap className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-white/60 mb-0.5">Nivel</div>
                                <div className="text-sm font-semibold text-gray-400 dark:text-gray-600">-</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Zap className="w-3 h-3 md:w-4 md:h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-semibold text-gray-400 dark:text-gray-600">
                              Preparándolo...
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto md:mt-0">
                          <div className="flex items-center justify-center flex-wrap gap-2 mb-3">
                            <span className="text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-600">
                              -
                            </span>
                          </div>
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Próximamente</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : displayedCourses.length === 2 ? (
          <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 max-w-full mx-auto">
            {/* Dos cursos - Cards lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 w-full">
              {displayedCourses.map(course => (
              <div 
                key={course.id} 
                onClick={(e) => {
                  console.log('🖱️ Landing card clicked:', course.title);
                  router.push(`/course/${course.slug || course.id}`);
                }}
                  className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:shadow-[#85ea10]/5 hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-white/12 transition-all duration-150 ease-out flex flex-col cursor-pointer"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={course.thumbnail || course.preview_image || '/images/course-placeholder.jpg'} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/course-placeholder.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
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
                  
                  <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold">{course.rating}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg md:text-xl font-bold course-title text-gray-900 dark:text-white mb-2">{course.title}</h3>
                    <p className="text-gray-700 dark:text-white/70 text-sm mb-3 line-clamp-2">{course.short_description || course.description}</p>
                  
                  <div className="bg-[#85ea10]/10 rounded-lg p-4 mb-4 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#85ea10] text-black">
                        {course.category_name || 'Sin categoría'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Zap className="w-4 h-4 text-[#85ea10]" />
                      <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        ¡Sin límites! Para todos los niveles
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/70">
                      <span className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-[#85ea10]" />
                        <span>{course.students_count || 0} estudiantes</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{course.lessons_count || 1} clases</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        {course.original_price ? (
                          <>
                            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                              ${course.price?.toLocaleString('es-CO')}
                            </span>
                            <span className="text-base md:text-lg text-gray-500 dark:text-white/50 line-through">
                              ${course.original_price?.toLocaleString('es-CO')}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            ${course.price?.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                        {course.original_price && (
                          <span className="text-xs md:text-sm text-[#85ea10] font-semibold">
                            {course.discount_percentage}% de descuento
                          </span>
                        )}
                    </div>
                    
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await trackCourseView(course.id);
                        router.push(`/course/${course.slug || course.id}`);
                      }}
                      className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-lg text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>¡Comenzar Ahora!</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32">
            {/* Tres o más cursos - Formato horizontal estilo YouTube (compacto) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 xl:gap-10 w-full">
              {displayedCourses.slice(0, 4).map(course => (
                <div 
                  key={course.id} 
                  onClick={(e) => {
                    console.log('🖱️ Landing card clicked:', course.title);
                    router.push(`/course/${course.slug || course.id}`);
                  }}
                  className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:shadow-[#85ea10]/5 hover:scale-[1.02] transition-all duration-150 ease-out cursor-pointer"
                >
                  {/* Thumbnail estilo YouTube */}
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={course.thumbnail || course.preview_image || '/images/course-placeholder.jpg'} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/course-placeholder.jpg';
                        }}
                      />
                      {/* Overlay de play al hover */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                        <Play className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Etiquetas compactas */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {course.isPopular && (
                        <div className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                          POPULAR
                        </div>
                      )}
                      {course.isNew && (
                        <div className="bg-[#85ea10] text-black text-xs font-bold px-2 py-0.5 rounded">
                          NUEVO
                        </div>
                      )}
                    </div>
                    
                    {/* Rating compacto */}
                    <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="font-semibold">{course.rating}</span>
                    </div>
                  </div>
                  
                  {/* Info compacta estilo YouTube */}
                  <div className="p-4">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                      {course.title}
                    </h3>
                    
                    {/* Info mínima */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white/60 mb-3">
                      <span className="flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>{course.lessons_count || 1} clases</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration || '30 min'}</span>
                      </span>
                    </div>

                    {/* Precio y botón compactos */}
                    <div className="space-y-2">
                      <div className="text-center">
                        {course.original_price ? (
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              ${course.price?.toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-white/50 line-through">
                              ${course.original_price?.toLocaleString('es-CO')}
                            </span>
                            <span className="text-xs text-[#85ea10] font-semibold">
                              -{course.discount_percentage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                            ${course.price?.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await trackCourseView(course.id);
                          router.push(`/course/${course.slug || course.id}`);
                        }}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2 rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-md text-xs md:text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Comenzar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            </div>
          )}

          {!loadingCourses && displayedCourses.length === 0 && (
          <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 max-w-full mx-auto">
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-white/40" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-white/60">
                Intenta ajustar los filtros o términos de búsqueda
              </p>
            </div>
        </div>
          )}
      </section>

      {/* Nutrition Plans Section */}
      <section className="pt-6 md:pt-8 pb-8 md:pb-12 bg-gray-50 dark:bg-gray-900 relative z-10 w-full overflow-visible">
        {/* Fondo oscuro sólido en modo oscuro para cubrir el video */}
        <div className="hidden dark:block absolute inset-0 bg-gray-900 z-0"></div>
        <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 relative z-10 max-w-full mx-auto overflow-visible">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight mb-2 md:mb-3">
              <span>PLANES </span>
              <span className="text-[#85ea10]">NUTRICIONALES</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-white/80 font-medium leading-relaxed max-w-3xl mx-auto">
              Complementa tu entrenamiento con planes alimentarios personalizados diseñados por expertos en nutrición
            </p>
          </div>

          {/* Carrusel de planes nutricionales */}
          <div className="w-full pb-0 relative py-4 md:py-4 overflow-visible">
            {/* Botón flecha izquierda - Solo visible en móvil */}
            <button
              onClick={() => scrollNutritionCarousel('left')}
              className="absolute left-2 top-[60%] -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700 md:hidden"
              aria-label="Scroll izquierda"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Botón flecha derecha - Solo visible en móvil */}
            <button
              onClick={() => scrollNutritionCarousel('right')}
              className="absolute right-2 top-[60%] -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-200 dark:border-gray-700 md:hidden"
              aria-label="Scroll derecha"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Contenedor con scroll horizontal */}
            <div 
              ref={nutritionCarouselRef}
              className="overflow-x-auto md:overflow-x-visible scroll-smooth snap-x snap-mandatory md:snap-none" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                paddingTop: '30px',
                paddingBottom: '30px',
                overflowY: 'visible',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex gap-0 md:gap-4 lg:gap-6 xl:gap-8 px-4 md:px-8 lg:px-20 xl:px-32 justify-start md:justify-center items-stretch" style={{ overflow: 'visible' }}>
                {/* Plan Básico - A la izquierda */}
                <div className="flex flex-shrink-0 w-full min-w-full md:min-w-0 md:flex-1 md:max-w-[450px] snap-center" style={{ alignSelf: 'stretch', display: 'flex' }}>
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 lg:p-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-white/20 flex flex-col w-full max-w-[450px] mx-auto relative"
                  >
                    <div className="text-center mb-6 md:mb-8">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils className="w-8 h-8 md:w-9 md:h-9 text-black" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Plan Básico
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 dark:text-white/80">
                        Ideal para comenzar
                      </p>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Plan nutricional básico semanal</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Recetas y guías alimentarias</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Seguimiento mensual</span>
                      </div>
                    </div>

                    <div className="text-center mt-auto">
                      <div className="text-2xl md:text-3xl font-black text-[#85ea10] mb-3">$50.000</div>
                      <div className="text-gray-600 dark:text-white/60 text-xs md:text-sm mb-4">por mes</div>
                      <button
                        onClick={() => router.push('/contact')}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2.5 md:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
                      >
                        Solicitar Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan Avanzado - Principal en el centro */}
                <div ref={mainPlanRef} className="flex flex-shrink-0 w-full min-w-full md:min-w-0 md:flex-1 md:max-w-[450px] snap-center" style={{ padding: '15px', overflow: 'visible' }}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 lg:p-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-[#85ea10] relative flex flex-col w-full max-w-[450px] mx-auto" style={{ transformOrigin: 'center center' }}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-[#85ea10] text-black px-3 py-1.5 rounded-full text-xs font-bold">
                        MÁS POPULAR
                      </div>
                    </div>
                    
                    <div className="text-center mb-6 md:mb-8">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 md:w-9 md:h-9 text-black" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Plan Avanzado
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 dark:text-white/80">
                        Para objetivos específicos
                      </p>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Todo del Plan Básico</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Análisis de composición corporal</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Ajustes semanales</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Consultas ilimitadas</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Suplementación personalizada</span>
                      </div>
                    </div>

                    <div className="text-center mt-auto">
                      <div className="text-2xl md:text-3xl font-black text-[#85ea10] mb-3">$100.000</div>
                      <div className="text-gray-600 dark:text-white/60 text-xs md:text-sm mb-4">por mes</div>
                      <button
                        onClick={() => router.push('/contact')}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2.5 md:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
                      >
                        Solicitar Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan Premium - A la derecha */}
                <div className="flex flex-shrink-0 w-full min-w-full md:min-w-0 md:flex-1 md:max-w-[450px] snap-center" style={{ alignSelf: 'stretch', display: 'flex' }}>
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 lg:p-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-white/20 flex flex-col w-full max-w-[450px] mx-auto relative"
                  >
                    <div className="text-center mb-6 md:mb-8">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-[#85ea10] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 md:w-9 md:h-9 text-black" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Plan Premium
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 dark:text-white/80">
                        La experiencia completa
                      </p>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Todo del Plan Avanzado</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Coach nutricional personalizado</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Consultas ilimitadas 24/7</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Suplementación premium incluida</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-[#85ea10] flex-shrink-0" />
                        <span className="text-gray-700 dark:text-white/80">Análisis de progreso avanzado</span>
                      </div>
                    </div>

                    <div className="text-center mt-auto">
                      <div className="text-2xl md:text-3xl font-black text-[#85ea10] mb-3">$150.000</div>
                      <div className="text-gray-600 dark:text-white/60 text-xs md:text-sm mb-4">por mes</div>
                      <button
                        onClick={() => router.push('/contact')}
                        className="w-full bg-[#85ea10] hover:bg-[#7dd30f] text-black font-bold py-2.5 md:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
                      >
                        Solicitar Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}