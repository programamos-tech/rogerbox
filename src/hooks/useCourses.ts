'use client';

import { useState, useEffect, useCallback } from 'react';
import { coursesService, Course } from '@/services/coursesService';

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchCourses: (query: string) => Course[];
  getCoursesByCategory: (categoryId: string) => Course[];
}

/**
 * Hook simplificado para manejar cursos con caché optimizado
 */
export const useCourses = (): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga los cursos desde el servicio
   */
  const loadCourses = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useCourses: Cargando cursos...');
      const startTime = performance.now();
      
      const coursesData = await coursesService.getCourses(forceRefresh);
      
      const endTime = performance.now();
      console.log(`✅ useCourses: Cursos cargados en ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 useCourses: ${coursesData.length} cursos obtenidos`);
      
      setCourses(coursesData);
      
    } catch (err) {
      console.error('❌ useCourses: Error cargando cursos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca los cursos (fuerza recarga)
   */
  const refresh = useCallback(async () => {
    console.log('🔄 useCourses: Refrescando cursos...');
    await loadCourses(true);
  }, [loadCourses]);

  /**
   * Busca cursos por término
   */
  const searchCourses = useCallback((query: string): Course[] => {
    if (!query.trim()) return courses;
    
    const lowercaseQuery = query.toLowerCase();
    return courses.filter(course => 
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.short_description.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery) ||
      course.category_name.toLowerCase().includes(lowercaseQuery)
    );
  }, [courses]);

  /**
   * Filtra cursos por categoría
   */
  const getCoursesByCategory = useCallback((categoryId: string): Course[] => {
    return courses.filter(course => course.category_id === categoryId);
  }, [courses]);

  // Cargar cursos al montar el componente
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    loading,
    error,
    refresh,
    searchCourses,
    getCoursesByCategory
  };
};

export default useCourses;
