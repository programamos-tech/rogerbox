'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

interface UserPurchase {
  id: string;
  course_id: string;
  order_id: string;
  created_at: string;
  is_active: boolean;
  start_date?: string;
  completed_lessons?: string[];
  course: {
    id: string;
    title: string;
    slug: string;
    preview_image: string;
    duration_days: number;
    short_description?: string;
    description?: string;
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
  const { data: session } = useSession();
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useUserPurchases: Cargando compras del usuario...');

      // Obtener el user_id del usuario autenticado
      const userId = (session.user as any).id;

      console.log('🔍 useUserPurchases: Session data:', {
        email: session.user.email,
        userId: userId,
        hasUserId: !!userId
      });

      if (!userId) {
        console.warn('⚠️ useUserPurchases: No se pudo obtener el user_id de la sesión');
        console.warn('⚠️ useUserPurchases: Session user object:', session.user);
        setError('No se pudo obtener el ID del usuario');
        setLoading(false);
        return;
      }

      console.log('🔍 useUserPurchases: Buscando compras para user_id:', userId);

      // Obtener compras directamente sin JOIN (más confiable)
      // Nota: completed_lessons no existe en course_purchases, se obtiene de otra tabla o se maneja diferente
      const { data: purchasesData, error: fetchError } = await supabase
        .from('course_purchases')
        .select('id, course_id, order_id, created_at, is_active, start_date')
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
          console.log('ℹ️ useUserPurchases: No se encontraron compras (error sin información)');
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
          console.log('ℹ️ useUserPurchases: No se encontraron compras (posible error de permisos RLS)');
          setPurchases([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Para otros errores, construir objeto de detalles solo con valores que existen
        const errorDetails: any = {};
        let hasUsefulInfo = false;
        
        if (fetchError?.message && fetchError.message !== 'Error al cargar las compras') {
          errorDetails.message = fetchError.message;
          hasUsefulInfo = true;
        }
        if (fetchError?.details) {
          errorDetails.details = fetchError.details;
          hasUsefulInfo = true;
        }
        if (fetchError?.hint) {
          errorDetails.hint = fetchError.hint;
          hasUsefulInfo = true;
        }
        if (fetchError?.code) {
          errorDetails.code = fetchError.code;
          hasUsefulInfo = true;
        }
        
        // Solo loguear si hay información útil
        if (hasUsefulInfo) {
          console.error('❌ useUserPurchases: Error obteniendo compras:', errorDetails);
        } else {
          // Si no hay información útil, solo loguear un mensaje simple sin objeto vacío
          console.log('ℹ️ useUserPurchases: No se encontraron compras (error sin detalles útiles)');
        }
        
        // Si no hay información útil, tratar como si no hubiera compras
        if (!hasUsefulInfo) {
          setPurchases([]);
          setError(null);
        } else {
          setError(fetchError?.message || 'Error al cargar las compras');
        }
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
        
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, slug, preview_image, duration_days, short_description, description')
          .in('id', courseIds);
        
        console.log('🔍 useUserPurchases: Cursos obtenidos:', {
          count: coursesData?.length || 0,
          courses: coursesData,
          error: coursesError
        });

        // Combinar compras con cursos
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
              course_preview_image: course.preview_image?.substring(0, 50) + '...'
            });
          }
          
          return {
            id: purchase.id,
            course_id: purchase.course_id,
            order_id: purchase.order_id || '',
            created_at: purchase.created_at || '',
            is_active: purchase.is_active,
            start_date: purchase.start_date || null,
            completed_lessons: [], // completed_lessons no existe en course_purchases, se inicializa como array vacío
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
          start_date: purchase.start_date || null,
          completed_lessons: [], // completed_lessons no existe en course_purchases, se inicializa como array vacío
          course: null
        }));
        console.log('✅ useUserPurchases: Compras sin cursos:', purchasesWithoutCourses.length);
        setPurchases(purchasesWithoutCourses);
        setLoading(false);
      }

    } catch (err) {
      console.error('❌ useUserPurchases: Error general:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadPurchases();
  };

  useEffect(() => {
    loadPurchases();
  }, [session?.user?.email]);

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
