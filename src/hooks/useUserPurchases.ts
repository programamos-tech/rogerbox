'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

interface CourseLesson {
  id: string;
  title: string;
  lesson_order: number;
  duration_minutes: number;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  preview_image: string;
  duration_days: number;
  short_description?: string;
  description?: string;
  lessons?: CourseLesson[];
}

interface UserPurchase {
  id: string;
  course_id: string;
  order_id: string;
  created_at: string;
  is_active: boolean;
  start_date?: string;
  /** Número de veces que se ha cambiado la fecha de inicio (máx. 3) */
  start_date_edit_count?: number;
  completed_lessons: string[];
  /** Fecha (ISO) del día en que se completó la última lección; solo si el curso está 100% completado */
  course_completed_at: string | null;
  course: Course | null;
}

interface UseUserPurchasesReturn {
  purchases: UserPurchase[];
  loading: boolean;
  error: string | null;
  hasActivePurchases: boolean;
  refresh: () => Promise<void>;
}

export const useUserPurchases = (): UseUserPurchasesReturn => {
  const { user } = useSupabaseAuth();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    if (!user?.id) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: purchasesData, error: fetchError } = await supabase
        .from('course_purchases')
        .select(
          'id, course_id, order_id, created_at, start_date, start_date_edit_count, is_active',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error al cargar compras:', fetchError);
        setError(fetchError.message || 'Error al cargar compras');
        setPurchases([]);
        return;
      }

      if (!purchasesData || purchasesData.length === 0) {
        setPurchases([]);
        return;
      }

      const courseIds = purchasesData.map((p) => p.course_id).filter(Boolean);

      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id, title, slug, preview_image, duration_days, short_description, description,
          lessons:course_lessons(id, title, lesson_order, duration_minutes)
        `)
        .in('id', courseIds);

      // Obtener completaciones vía API (incluye completed_at para saber el día de finalización)
      type CompletionRow = {
        lesson_id: string;
        course_id: string;
        completed_at?: string;
      };
      let completionsData: CompletionRow[] = [];
      try {
        const res = await fetch('/api/lessons/complete', {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          completionsData = Array.isArray(json.completions)
            ? json.completions
            : [];
        }
      } catch {
        // Si falla la API, seguimos con completionsData vacío
      }

      const purchasesWithCourses: UserPurchase[] = purchasesData.map(
        (purchase) => {
          const course =
            coursesData?.find(
              (c) => String(c.id) === String(purchase.course_id),
            ) || null;
          const courseCompletions = completionsData.filter(
            (c) => String(c.course_id) === String(purchase.course_id),
          );
          const completedLessonIds = courseCompletions.map((c) => c.lesson_id);
          const lessons = (course as any)?.lessons ?? [];
          const isFullyCompleted =
            lessons.length > 0 &&
            lessons.every((l: { id: string }) =>
              completedLessonIds.includes(l.id),
            );
          const courseCompletedAt =
            isFullyCompleted && courseCompletions.length > 0
              ? courseCompletions.reduce<string | null>(
                  (max, c) =>
                    !c.completed_at
                      ? max
                      : max == null || c.completed_at > max
                        ? c.completed_at
                        : max,
                  null,
                )
              : null;

          return {
            id: purchase.id,
            course_id: purchase.course_id,
            order_id: purchase.order_id || '',
            created_at: purchase.created_at || '',
            is_active: purchase.is_active,
            // Sin fallback: si no eligió fecha, debe ser null hasta que guarde en el modal
            start_date: purchase.start_date ?? null,
            start_date_edit_count:
              typeof (purchase as any).start_date_edit_count === 'number'
                ? (purchase as any).start_date_edit_count
                : 0,
            completed_lessons: completedLessonIds,
            course_completed_at: courseCompletedAt || null,
            course,
          };
        },
      );

      setPurchases(purchasesWithCourses);
    } catch (err) {
      console.error('Error inesperado al cargar compras:', err);
      setPurchases([]);
      setError('Error inesperado al cargar compras');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const hasActivePurchases = purchases.some((p) => p.is_active);

  return {
    purchases,
    loading,
    error,
    hasActivePurchases,
    refresh: loadPurchases,
  };
};

export default useUserPurchases;
