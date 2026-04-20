'use client';

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Star,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Footer from '@/components/Footer';
import QuickLoading from '@/components/QuickLoading';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUnifiedCourses } from '@/hooks/useUnifiedCourses';
import { trackCourseView } from '@/lib/analytics';
import type { UnifiedCourse } from '@/services/unifiedCoursesService';

/** Slugs / códigos de categoría → etiqueta en español para la tienda */
const CATEGORY_LABEL_ES: Record<string, string> = {
  lose_weight: 'Bajar de peso',
  gain_muscle: 'Ganar músculo',
  improve_endurance: 'Mejorar resistencia',
  functional: 'Funcional',
  wellness: 'Bienestar',
  general: 'General',
  hiit: 'HIIT',
  nutrition: 'Nutrición',
  flexibility: 'Flexibilidad',
  strength: 'Fuerza',
  cardio: 'Cardio',
  weight_loss: 'Bajar de peso',
  muscle_gain: 'Ganar músculo',
  yoga: 'Yoga',
  pilates: 'Pilates',
  rehabilitation: 'Rehabilitación',
  beginners: 'Principiantes',
};

function isLikelyUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

function displayCategoryInSpanish(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (!t || /^sin categoría$/i.test(t)) return 'Sin categoría';
  if (isLikelyUuid(t)) return 'Sin categoría';

  const slugKey = t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (slugKey && CATEGORY_LABEL_ES[slugKey]) {
    return CATEGORY_LABEL_ES[slugKey];
  }

  if (t.includes('_') && /^[a-z0-9_]+$/i.test(t.replace(/\s/g, ''))) {
    const parts = t
      .toLowerCase()
      .split(/_+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
    return parts;
  }

  return t;
}

function slugifyCategory(name: string): string {
  const base = displayCategoryInSpanish(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'sin-categoria';
}

function calculateFinalPrice(course: UnifiedCourse) {
  const price = course.price || 0;
  const discount = course.discount_percentage || 0;
  if (discount > 0) return Math.round(price * (1 - discount / 100));
  return price;
}

function LandingCourseCard({
  course,
  onOpen,
}: {
  course: UnifiedCourse;
  onOpen: (course: UnifiedCourse) => void;
}) {
  const finalPrice = calculateFinalPrice(course);
  const img =
    course.preview_image ||
    course.thumbnail ||
    '/images/course-placeholder.jpg';

  return (
    <article className="group flex flex-col rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md hover:border-[#85ea10]/40 transition-all duration-300">
      <button
        type="button"
        onClick={() => onOpen(course)}
        className="text-left flex flex-col flex-1"
      >
        <div className="relative aspect-[5/3] sm:aspect-[16/10] bg-gray-100 dark:bg-white/10 overflow-hidden">
          <Image
            src={img}
            alt=""
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={img.startsWith('data:') || img.startsWith('http')}
          />
          {(course.discount_percentage ?? 0) > 0 && (
            <span className="absolute top-2 left-2 rounded-md bg-[#85ea10] text-gray-900 text-[10px] sm:text-xs font-bold px-1.5 py-0.5">
              -{course.discount_percentage}%
            </span>
          )}
        </div>
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-[#164151] dark:text-[#85ea10] uppercase tracking-wide mb-0.5 line-clamp-1">
            {displayCategoryInSpanish(course.category_name)}
          </p>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#164151] dark:group-hover:text-[#85ea10] transition-colors line-clamp-2 min-h-[2.5rem]">
            {course.title}
          </h2>
          {course.short_description && (
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {course.short_description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-0.5">
              <BookOpen className="w-3 h-3 shrink-0" />
              {course.lessons_count}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              {course.duration}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3 h-3 shrink-0 text-amber-500" />
              {course.rating?.toFixed(1) ?? '—'}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3 shrink-0" />
              {course.students_count?.toLocaleString('es-CO') ?? 0}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex items-end justify-between gap-2">
            <div>
              {(course.discount_percentage ?? 0) > 0 && (
                <span className="text-xs text-gray-400 line-through block leading-tight">
                  ${course.price?.toLocaleString('es-CO')}
                </span>
              )}
              <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                ${finalPrice?.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-gray-900 dark:bg-[#85ea10] text-white dark:text-gray-900 text-xs font-semibold px-2.5 py-1.5 group-hover:bg-[#164151] dark:group-hover:bg-[#9ef654] transition-colors shrink-0">
              Ver
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const {
    courses,
    loading: loadingCourses,
    error: coursesError,
  } = useUnifiedCourses();

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, UnifiedCourse[]>();
    for (const c of courses) {
      const key = displayCategoryInSpanish(c.category_name);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Sin categoría') return 1;
      if (b === 'Sin categoría') return -1;
      return a.localeCompare(b, 'es', { sensitivity: 'base' });
    });
  }, [courses]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToHero = () => {
    document
      .getElementById('tienda-rogerbox')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCourses = () => {
    document.getElementById('cursos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCategory = (categoryName: string) => {
    const id = `categoria-${slugifyCategory(categoryName)}`;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading) {
    return <QuickLoading message="Cargando..." duration={3000} />;
  }

  if (user) {
    return (
      <QuickLoading message="Redirigiendo al dashboard..." duration={3000} />
    );
  }

  const goToCourse = (course: UnifiedCourse) => {
    void trackCourseView(course.id);
    const path = `/course/${course.slug || course.id}`;
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:bg-gradient-to-b">
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
          isScrolled
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-gray-200 dark:border-white/10 shadow-sm'
            : 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-gray-100 dark:border-white/5'
        }`}
      >
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            <button
              type="button"
              onClick={() => scrollToHero()}
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <span className="text-lg sm:text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                ROGER<span className="text-[#85ea10]">BOX</span>
              </span>
            </button>

            <nav className="flex items-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => scrollToCourses()}
                className="text-gray-700 dark:text-white/90 hover:text-[#164151] dark:hover:text-white text-sm font-medium transition-colors"
              >
                Cursos
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                Inicia sesión
              </button>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="rounded-lg bg-gray-900 dark:bg-[#85ea10] px-3 py-1.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-[#9ef654] transition-colors"
              >
                Regístrate
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Banner ancho, poco alto: video + mensaje HIIT (antes hero a pantalla completa) */}
      <section
        id="tienda-rogerbox"
        className="relative z-10 scroll-mt-16 w-full overflow-hidden border-b border-black/20"
      >
        <div className="relative h-[min(42vw,200px)] sm:h-[min(36vw,220px)] md:h-[240px] lg:h-[260px]">
          <div
            className={`absolute inset-0 bg-black z-[1] transition-opacity duration-500 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/roger-hero-preview.webp"
            className={`absolute inset-0 h-full w-full object-cover object-[center_25%] z-0 transition-opacity duration-500 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoLoaded(false)}
          >
            <source src="/videos/roger-hero.webm" type="video/webm" />
            <source src="/videos/roger-hero-optimized.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 flex flex-col justify-center py-3 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-center">
              <div className="md:col-span-7 space-y-2 sm:space-y-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-[1.1] tracking-tight drop-shadow-md max-w-xl">
                  Quema grasa con entrenamientos HIIT
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToCourses()}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-gray-900 shadow hover:bg-white/95 transition-colors"
                  >
                    Ver cursos
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="text-xs sm:text-sm font-semibold text-white/90 hover:text-white"
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>
              <div className="md:col-span-5 md:flex md:justify-end">
                <p className="text-xs sm:text-sm text-white/88 leading-snug max-w-sm md:text-right drop-shadow line-clamp-3 md:line-clamp-4">
                  Tu plataforma de cursos HIIT en línea. Cada día una nueva clase
                  te espera, empieza hoy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="cursos"
        className="relative z-10 scroll-mt-16 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-32 pt-4 pb-8 sm:pt-5 sm:pb-10 bg-gray-50 dark:bg-transparent"
      >
        <div className="max-w-7xl mx-auto">
          {!loadingCourses &&
            !coursesError &&
            coursesByCategory.length > 1 && (
              <div className="mb-4 -mx-0.5">
                <div className="flex flex-wrap gap-1.5">
                  {coursesByCategory.map(([name, list]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => scrollToCategory(name)}
                      className="rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-800 dark:text-gray-100 hover:border-[#85ea10]/60 hover:bg-[#85ea10]/10 transition-colors"
                    >
                      {name}
                      <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">
                        ({list.length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {loadingCourses && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[5/3] bg-gray-200 dark:bg-white/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingCourses && coursesError && (
            <p className="text-red-600 dark:text-red-400 text-sm">
              No pudimos cargar los cursos. Intenta recargar la página.
            </p>
          )}

          {!loadingCourses && !coursesError && courses.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Aún no hay cursos publicados. Vuelve pronto.
            </p>
          )}

          {!loadingCourses && coursesByCategory.length > 0 && (
            <div className="space-y-8 sm:space-y-10">
              {coursesByCategory.map(([categoryName, list], idx) => (
                <div
                  key={categoryName}
                  id={`categoria-${slugifyCategory(categoryName)}`}
                  className="scroll-mt-20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3 sm:mb-4 border-b border-gray-200 dark:border-white/10 pb-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                        {categoryName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {list.length}{' '}
                        {list.length === 1 ? 'curso' : 'cursos'}
                      </p>
                    </div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => scrollToCourses()}
                        className="text-xs font-medium text-[#164151] dark:text-[#85ea10] hover:underline self-start sm:self-auto"
                      >
                        Volver arriba
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {list.map((course) => (
                      <LandingCourseCard
                        key={course.id}
                        course={course}
                        onOpen={goToCourse}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="relative z-10 bg-gray-50 dark:bg-gray-950">
        <Footer />
      </div>
    </div>
  );
}
