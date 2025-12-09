'use client';
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

interface CourseLesson {
  id: string;
  title: string;
  lesson_order: number;
  duration_minutes: number;
}

interface UserPurchase {
  id: string;
  course_id: string;
  order_id: string;
  created_at: string;
  is_active: boolean;
  start_date?: string;
  completed_lessons: string[];
  course: {
    id: string;
    title: string;
    slug: string;
    preview_image: string;
    duration_days: number;
    short_description?: string;
    description?: string;
    lessons?: CourseLesson[];
  } | null;
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

  const loadPurchases = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useUserPurchases: Cargando compras del usuario...');

      // Obtener el user_id del usuario autenticado
      const userId = user.id;

      console.log('🔍 useUserPurchases: User data:', {
        email: user.email,
        userId: userId,
        hasUserId: !!userId
      });

      if (!userId) {
        console.warn('⚠️ useUserPurchases: No se pudo obtener el user_id');
        console.warn('⚠️ useUserPurchases: User object:', user);
        setError('No se pudo obtener el ID del usuario');
        setLoading(false);
        return;
      }

      console.log('🔍 useUserPurchases: Buscando compras para user_id:', userId);

      // Obtener compras directamente sin JOIN (más confiable)
      // Nota: start_date y completed_lessons no existen en course_purchases
      const { data: purchasesData, error: fetchError } = await supabase
        .from('course_purchases')
        .select('id, course_id, order_id, created_at, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('🔍 useUserPurchases: Resultado de la consulta:', {
        hasData: !!purchasesData,
        dataLength: purchasesData?.length || 0,
        hasError: !!fetchError,
        error: fetchError ? {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint
        } : null
      });

      // Si hay error, manejarlo apropiadamente
      if (fetchError) {
        // Verificar si el error tiene información útil
        const hasErrorInfo = fetchError?.message || fetchError?.code || fetchError?.details || fetchError?.hint;
        
        // Si el error no tiene información útil (objeto vacío), tratarlo como si no hubiera compras
        if (!hasErrorInfo) {
          console.log('ℹ️ useUserPurchases: No hay compras todavía');
          setPurchases([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Verificar si es un error de permisos RLS (común cuando no hay compras o permisos)
        const isRLSError = fetchError?.code === 'PGRST301' || 
                          fetchError?.message?.includes('permission') || 
                          fetchError?.message?.includes('RLS') ||
                          fetchError?.message?.includes('row-level security');
        
        if (isRLSError) {
          // Si es un error de RLS, probablemente no hay compras o el usuario no tiene permisos
          // Tratar como si no hubiera compras en lugar de mostrar error
          console.log('ℹ️ useUserPurchases: No hay compras todavía');
          setPurchases([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Verificar si hay información útil ANTES de construir el objeto
        const fields = {
          message: fetchError?.message,
          details: fetchError?.details,
          hint: fetchError?.hint,
          code: fetchError?.code,
        };

        const cleanEntries = Object.entries(fields).filter(
          ([_, value]) => typeof value === 'string' && value.trim() !== '' && value !== 'Error al cargar las compras'
        );

        // Si no hay información útil, tratar como si no hubiera compras
        if (cleanEntries.length === 0) {
          console.log('ℹ️ useUserPurchases: No hay compras todavía');
          setPurchases([]);
          setError(null);
          setLoading(false);
          return;
        }

        // Mostrar como advertencia, no como error crítico
        const errorDetails = Object.fromEntries(cleanEntries);
        console.warn('⚠️ useUserPurchases: Problema al obtener compras:', errorDetails);
        // No establecer error para no mostrar mensaje de error en la UI
        setPurchases([]);
        
        setLoading(false);
        return;
      }

      console.log('🔍 useUserPurchases: Compras encontradas:', {
        count: purchasesData?.length || 0,
        purchases: purchasesData
      });

      // Si no hay compras, terminar
      if (!purchasesData || purchasesData.length === 0) {
        console.log('ℹ️ useUserPurchases: No se encontraron compras activas');
        setPurchases([]);
        setLoading(false);
        return;
      }

      // Obtener los cursos por separado (más confiable que JOIN)
      const courseIds = purchasesData.map(p => p.course_id).filter(Boolean);
      
      if (courseIds.length > 0) {
        console.log('🔍 useUserPurchases: Obteniendo cursos para:', courseIds);
        
        // Obtener cursos con sus lecciones
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id, title, slug, preview_image, duration_days, short_description, description,
            lessons:course_lessons(id, title, lesson_order, duration_minutes)
          `)
          .in('id', courseIds);
        
        // Obtener lecciones completadas del usuario
        const { data: completionsData } = await supabase
          .from('user_lesson_completions')
          .select('lesson_id, course_id, completed_at')
          .eq('user_id', userId);
        
        console.log('🔍 useUserPurchases: Cursos obtenidos:', {
          count: coursesData?.length || 0,
          courses: coursesData,
          error: coursesError
        });
        
        console.log('🔍 useUserPurchases: Completaciones obtenidas:', {
          count: completionsData?.length || 0
        });

        // Combinar compras con cursos y completaciones
        const purchasesWithCourses = purchasesData.map((purchase: any) => {
          console.log('🔍 useUserPurchases: Mapeando purchase:', {
            purchase_id: purchase.id,
            course_id: purchase.course_id,
            course_id_type: typeof purchase.course_id,
            available_course_ids: coursesData?.map((c: any) => ({ id: c.id, id_type: typeof c.id }))
          });
          
          const course = coursesData?.find((c: any) => {
            const match = c.id === purchase.course_id;
            if (!match) {
              // Intentar comparación como strings
              const matchAsString = String(c.id) === String(purchase.course_id);
              return matchAsString;
            }
            return match;
          }) || null;
          
          // Obtener lecciones completadas para este curso
          const courseCompletions = completionsData?.filter(
            (c: any) => c.course_id === purchase.course_id
          ) || [];
          const completedLessonIds = courseCompletions.map((c: any) => c.lesson_id);
          
          if (!course) {
            console.warn('⚠️ useUserPurchases: No se encontró curso para purchase:', {
              purchase_id: purchase.id,
              course_id: purchase.course_id,
              available_courses: coursesData?.map((c: any) => c.id)
            });
          } else {
            console.log('✅ useUserPurchases: Curso encontrado:', {
              purchase_id: purchase.id,
              course_id: purchase.course_id,
              course_title: course.title,
              lessons_count: course.lessons?.length || 0,
              completed_count: completedLessonIds.length
            });
          }
          
          return {
            id: purchase.id,
            course_id: purchase.course_id,
            order_id: purchase.order_id || '',
            created_at: purchase.created_at || '',
            is_active: purchase.is_active,
            start_date: purchase.created_at || null, // Usar created_at como fecha de inicio
            completed_lessons: completedLessonIds,
            course: course
          };
        });

        console.log('✅ useUserPurchases: Compras procesadas:', purchasesWithCourses.length);
        console.log('✅ useUserPurchases: Datos finales:', purchasesWithCourses.map(p => ({
          id: p.id,
          course_id: p.course_id,
          has_course: !!p.course,
          course_title: p.course?.title || 'NO COURSE',
          course_preview_image: p.course?.preview_image ? (p.course.preview_image.substring(0, 50) + '...') : 'NO IMAGE'
        })));
        setPurchases(purchasesWithCourses);
        setLoading(false);
      } else {
        // Si no hay courseIds, crear compras sin curso
        console.warn('⚠️ useUserPurchases: No hay course IDs válidos');
        const purchasesWithoutCourses = purchasesData.map((purchase: any) => ({
          id: purchase.id,
          course_id: purchase.course_id,
          order_id: purchase.order_id || '',
          created_at: purchase.created_at || '',
          is_active: purchase.is_active,
          start_date: purchase.created_at || null, // Usar created_at como fecha de inicio
          completed_lessons: [],
          course: null
        }));
        console.log('✅ useUserPurchases: Compras sin cursos:', purchasesWithoutCourses.length);
        setPurchases(purchasesWithoutCourses);
        setLoading(false);
      }

    } catch (err) {
      // No mostrar como error crítico, puede ser normal si no hay sesión
      console.log('ℹ️ useUserPurchases: No se pudieron cargar compras (puede ser normal)');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadPurchases();
  };

  useEffect(() => {
    loadPurchases();
  }, [user?.email]);

  const hasActivePurchases = purchases.length > 0;

  return {
    purchases,
    loading,
    error,
    hasActivePurchases,
    refresh
  };
};

export default useUserPurchases;
