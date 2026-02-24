'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type SimpleCourse,
  simpleCoursesService,
} from '@/services/simpleCoursesService';

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

      const coursesData = await simpleCoursesService.getCourses();
      setCourses(coursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca los cursos
   */
  const refresh = useCallback(async () => {
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
    refresh,
  };
};

export default useSimpleCourses;
