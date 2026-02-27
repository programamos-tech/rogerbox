'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type FastCourse,
  fastCoursesService,
} from '@/services/fastCoursesService';

interface UseFastCoursesReturn {
  courses: FastCourse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook ULTRA RÁPIDO para cursos
 */
export const useFastCourses = (): UseFastCoursesReturn => {
  const [courses, setCourses] = useState<FastCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga los cursos de forma ULTRA RÁPIDA
   */
  const loadCourses = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const startTime = performance.now();

      const coursesData = await fastCoursesService.getCourses(forceRefresh);

      const endTime = performance.now();
      setCourses(coursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca los cursos
   */
  const refresh = useCallback(async () => {
    await loadCourses(true);
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

export default useFastCourses;
