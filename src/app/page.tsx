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

  // Estado para controlar la carga del video
  const [videoLoaded, setVideoLoaded] = useState(false);
  // Navbar: con scroll mostrar fondo para que logo y título no se enreden
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Al hacer scroll, navbar con fondo para que logo y hero no se superpongan
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    handleScroll();
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

      {/* Header: transparente arriba; con scroll fondo sólido para que se entienda logo y no se enrede con el hero */}
      <header
        className={`sticky top-0 z-50 isolate transition-all duration-200 ${
          isScrolled
            ? 'bg-white/10 dark:bg-white/5 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent backdrop-blur-0 border-b border-transparent'
        }`}
      >
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white whitespace-nowrap">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </h1>
            </button>

            <nav className="flex items-center gap-6 sm:gap-8">
              <button
                onClick={() => router.push('/register')}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                Regístrate
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                Inicia sesión
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - estilo YouVersion: título izq, descripción der, CTA con flecha */}
      <section className="relative min-h-screen flex items-end sm:items-center pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            {/* Columna izquierda: título + CTA */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-lg text-left max-w-2xl">
                Quema grasa con entrenamientos HIIT
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => router.push('/register')}
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 sm:py-3 sm:px-6 rounded-lg bg-white/95 hover:bg-white text-gray-900 font-semibold text-sm sm:text-base transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Regístrate
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="text-white/80 hover:text-white text-sm sm:text-base font-medium transition-colors duration-200"
                >
                  Ver Cursos
                </button>
              </div>
            </div>
            {/* Columna derecha: descripción */}
            <div className="lg:col-span-5 flex lg:justify-end">
              <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-md lg:max-w-sm lg:text-right font-medium leading-relaxed">
                Tu plataforma de cursos HIIT en línea. Cada día una nueva clase
                te espera, empieza hoy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solo hero + footer: contenido dentro de la plataforma tras registrarse */}

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
