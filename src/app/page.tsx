'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRouter } from 'next/navigation';
import { Play, Clock, Users, Star, Search, ArrowRight, User, BookOpen, Award, TrendingUp, Zap, Utensils, Target, CheckCircle, ShoppingCart, Flame, Dumbbell, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import QuickLoading from '@/components/QuickLoading';
import Footer from '@/components/Footer';
import { trackCourseView } from '@/lib/analytics';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import UnderConstruction from '@/components/UnderConstruction';
import { Settings } from 'lucide-react';

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
  const { user, loading: authLoading } = useSupabaseAuth();
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

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return <QuickLoading message="Cargando..." duration={3000} />;
  }

  // Si el usuario está autenticado, mostrar loading mientras redirige
  if (user) {
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
      <header className={`sticky top-0 z-20 backdrop-blur-md transition-all duration-300 overflow-visible ${isScrolled
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
                className={`transition-all duration-300 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-xl hover:scale-105 hover:shadow-lg text-sm md:text-base ${isScrolled
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

      {/* Under Construction Section */}
      <section className="relative py-20 bg-white dark:bg-gray-900 w-full z-10">
        <div className="w-full px-6 md:px-12 lg:px-20 xl:px-32 max-w-7xl mx-auto">
          <UnderConstruction
            title="Nuevas experiencias"
            description="Estamos preparando algo increíble para ti. Nuestros cursos y planes nutricionales estarán disponibles muy pronto con una experiencia totalmente renovada."
            icon={Dumbbell}
          />
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}