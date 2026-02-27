'use client';

import { useState, useEffect, useCallback } from 'react';
import { fastCoursesService, FastCourse } from '@/services/fastCoursesService';

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
      
      console.log('⚡ useFastCourses: Cargando...');
      const startTime = performance.now();
      
      const coursesData = await fastCoursesService.getCourses(forceRefresh);
      
      const endTime = performance.now();
      console.log(`⚡ useFastCourses: Completado en ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 useFastCourses: ${coursesData.length} cursos`);
      
      setCourses(coursesData);
      
    } catch (err) {
      console.error('❌ useFastCourses: Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca los cursos
   */
  const refresh = useCallback(async () => {
    console.log('🔄 useFastCourses: Refrescando...');
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
    refresh
  };
};

export default useFastCourses;
