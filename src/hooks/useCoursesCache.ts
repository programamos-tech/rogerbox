'use client';

import { useEffect, useState } from 'react';
import { getMostViewedCourse } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

interface Course {
  id: string;
  title: string;
  short_description: string;
  description: string;
  preview_image: string | null;
  price: number;
  discount_percentage: number;
  category: string;
  category_name?: string;
  duration_days: number;
  students_count: number;
  rating: number;
  calories_burned: number;
  level: string;
  is_published: boolean;
  created_at: string;
  // include_iva: boolean; // Temporalmente deshabilitado
  // iva_percentage: number; // Temporalmente deshabilitado
  instructor?: string;
  lessons?: number;
  isRecommended?: boolean;
  thumbnail?: string;
  duration?: string;
  students?: number;
}

interface CacheData {
  courses: Course[];
  totalCount: number;
  lastFetch: number;
  currentPage: number;
  totalPages: number;
}

const CACHE_KEY = 'rogerbox_courses_cache_v3'; // Nueva versión para limpiar caché con categorías
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos
const COURSES_PER_PAGE = 9;

export function useCoursesCache(userProfile: any) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el caché es válido
  const isCacheValid = (cacheData: CacheData): boolean => {
    const now = Date.now();
    return now - cacheData.lastFetch < CACHE_DURATION;
  };

  // Cargar desde caché
  const loadFromCache = (): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      return isCacheValid(cacheData) ? cacheData : null;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  };

  // Guardar en caché
  const saveToCache = (data: Omit<CacheData, 'lastFetch'>) => {
    try {
      const cacheData: CacheData = {
        ...data,
        lastFetch: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Cargar cursos desde Supabase
  const loadCoursesFromDB = async (page: number = 1) => {
    try {
      console.log(`🔄 Cargando página ${page} desde Supabase...`);

      const from = (page - 1) * COURSES_PER_PAGE;
      const to = from + COURSES_PER_PAGE - 1;

      // Obtener total de cursos
      console.log('📊 Obteniendo total de cursos...');
      const { count, error: countError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (countError) {
        console.error('❌ Error obteniendo count:', countError);
        throw countError;
      }

      console.log('📊 Total de cursos encontrados:', count);

      // Obtener cursos paginados
      console.log('📊 Obteniendo cursos paginados...');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('❌ Error obteniendo cursos:', error);
        throw error;
      }

      console.log('📊 Cursos obtenidos:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📊 Primer curso raw:', data[0]);
        console.log('📊 duration_days:', data[0].duration_days);
        console.log('📊 students_count:', data[0].students_count);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / COURSES_PER_PAGE);

      // Obtener categorías de la base de datos
      const { data: categoriesData } = await supabase
        .from('course_categories')
        .select('*')
        .eq('is_active', true);

      // Crear mapa de categorías
      const categoryMap: { [key: string]: string } = {};
      if (categoriesData) {
        categoriesData.forEach((cat) => {
          categoryMap[cat.id] = cat.name;
        });
      }

      // Obtener el curso más visitado
      const mostViewedCourseId = await getMostViewedCourse();
      console.log('📊 Dashboard: Curso más visitado:', mostViewedCourseId);

      // Transformar cursos
      const transformedCourses = (data || []).map((course) => {
        const categoryName = categoryMap[course.category] || 'Sin categoría';

        // Determinar si es nuevo (últimas 2 semanas)
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const isNew = new Date(course.created_at) > twoWeeksAgo;

        // Determinar si es popular (el más visitado de la lista actual)
        const isPopular = mostViewedCourseId === course.id;

        const transformed = {
          ...course,
          instructor: 'RogerBox',
          lessons: 1,
          isRecommended: userProfile?.goals?.includes(course.category) || false,
          isNew: isNew,
          isPopular: isPopular,
          thumbnail: course.preview_image,
          duration: `${course.duration_days} días`,
          students: course.students_count,
          category: course.category, // Usar el ID de la categoría
          category_name: categoryName, // Agregar el nombre de la categoría
          originalCategory: course.category,
        };

        console.log('📊 Curso transformado:', {
          title: transformed.title,
          duration_days: transformed.duration_days,
          students: transformed.students,
          students_count: transformed.students_count,
        });

        return transformed;
      });

      console.log('📊 Cursos transformados:', transformedCourses.length);
      if (transformedCourses.length > 0) {
        console.log('📊 Primer curso transformado:', transformedCourses[0]);
      }

      // Ordenar cursos: POPULAR primero, luego por fecha de creación
      const sortedCourses = transformedCourses.sort((a, b) => {
        // Si uno es popular y el otro no, el popular va primero
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;

        // Si ambos son populares o ninguno, ordenar por fecha de creación (más reciente primero)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      console.log(
        '📊 Dashboard: Cursos ordenados - Popular primero:',
        sortedCourses.map((c) => ({
          title: c.title,
          isPopular: c.isPopular,
          isNew: c.isNew,
        })),
      );

      return {
        courses: sortedCourses,
        totalCount,
        currentPage: page,
        totalPages,
      };
    } catch (error) {
      console.error('Error loading courses from DB:', error);
      throw error;
    }
  };

  // Cargar cursos (con caché)
  const loadCourses = async (
    page: number = 1,
    forceRefresh: boolean = false,
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Si no es refresh forzado, intentar cargar desde caché
      if (!forceRefresh) {
        const cached = loadFromCache();
        if (cached && cached.currentPage === page) {
          console.log('✅ Cargando desde caché...');
          setCourses(cached.courses);
          setCurrentPage(cached.currentPage);
          setTotalPages(cached.totalPages);
          setTotalCount(cached.totalCount);
          setLoading(false);
          return;
        }
      }

      // Cargar desde base de datos
      console.log('🔄 Cargando desde base de datos...');
      const data = await loadCoursesFromDB(page);

      setCourses(data.courses);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);

      // Guardar en caché
      saveToCache(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar página
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadCourses(page);
    }
  };

  // Refrescar datos
  const refresh = () => {
    loadCourses(currentPage, true);
  };

  // Cargar datos iniciales
  useEffect(() => {
    console.log('🔄 useCoursesCache: userProfile changed:', userProfile?.id);
    if (userProfile) {
      console.log('🚀 useCoursesCache: Starting initial load...');
      // Limpiar caché y forzar recarga
      localStorage.removeItem(CACHE_KEY);
      loadCourses(1, true);
    }
  }, [userProfile?.id]);

  return {
    courses,
    loading,
    currentPage,
    totalPages,
    totalCount,
    error,
    changePage,
    refresh,
    coursesPerPage: COURSES_PER_PAGE,
  };
}
