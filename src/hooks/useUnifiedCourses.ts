'use client';
import { useState, useEffect, useCallback } from 'react';
import { unifiedCoursesService, UnifiedCourse } from '@/services/unifiedCoursesService';

interface UseUnifiedCoursesReturn {
  courses: UnifiedCourse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useUnifiedCourses = (): UseUnifiedCoursesReturn => {
  const [courses, setCourses] = useState<UnifiedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 useUnifiedCourses: INICIANDO carga de cursos...');
      
      const coursesData = await unifiedCoursesService.getCourses();
      
      console.log(`✅ useUnifiedCourses: ${coursesData.length} cursos cargados`);
      if (coursesData.length > 0) {
        console.log('📊 useUnifiedCourses: Primer curso:', coursesData[0].title);
      } else {
        console.log('⚠️ useUnifiedCourses: Array vacío recibido del servicio');
      }
      setCourses(coursesData);
    } catch (err: any) {
      console.error('❌ useUnifiedCourses: ERROR al cargar cursos:', err?.message || err);
      setError(err?.message || 'Error desconocido');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 useUnifiedCourses: Refrescando...');
    await loadCourses();
  }, [loadCourses]);

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

export default useUnifiedCourses;
