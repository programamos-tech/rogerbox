'use client';

import { useState, useEffect, useCallback } from 'react';
import { simpleCoursesService, SimpleCourse } from '@/services/simpleCoursesService';

interface UseSimpleCoursesReturn {
  courses: SimpleCourse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook SIMPLE para cursos - SIN CACHÉ
 */
export const useSimpleCourses = (): UseSimpleCoursesReturn => {
  const [courses, setCourses] = useState<SimpleCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga los cursos directamente de Supabase
   */
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useSimpleCourses: Cargando cursos...');
      
      const coursesData = await simpleCoursesService.getCourses();
      
      console.log(`✅ useSimpleCourses: ${coursesData.length} cursos cargados`);
      console.log('📊 useSimpleCourses: Primer curso:', coursesData[0]);
      setCourses(coursesData);
      
    } catch (err) {
      console.error('❌ useSimpleCourses: Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca los cursos
   */
  const refresh = useCallback(async () => {
    console.log('🔄 useSimpleCourses: Refrescando...');
    await loadCourses();
  }, [loadCourses]);

  // Cargar cursos al montar
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    loading,
    error,
    refresh
  };
};

export default useSimpleCourses;
