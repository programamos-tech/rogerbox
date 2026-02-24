'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  type UnifiedCourse,
  unifiedCoursesService,
} from '@/services/unifiedCoursesService';

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

      const coursesData = await unifiedCoursesService.getCourses();
      if (coursesData.length > 0) {
      } else {
      }
      setCourses(coursesData);
    } catch (err: any) {
      setError(err?.message || 'Error desconocido');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadCourses();
  }, [loadCourses]);

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

export default useUnifiedCourses;
