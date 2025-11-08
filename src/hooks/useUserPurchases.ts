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

      // SIMULACIÓN TEMPORAL: Solo para rogerboxtech@gmail.com
      if (session.user.email === 'rogerboxtech@gmail.com') {
        console.log('🎭 SIMULACIÓN: Usuario rogerbox detectado, simulando compra...');
        const simulatedPurchase: UserPurchase = {
          id: 'sim-001',
          course_id: '1',
          order_id: 'order-sim-001',
          created_at: new Date().toISOString(),
          is_active: true,
          completed_lessons: [],
          course: {
            id: '1',
            title: 'CARDIO HIIT 40 MIN ¡BAJA DE PESO!',
            slug: 'cardio-hiit-40-min-baja-peso',
            preview_image: '/images/courses/course-1.jpg',
            duration_days: 84
          }
        };

        console.log('✅ SIMULACIÓN: Compra simulada creada');
        setPurchases([simulatedPurchase]);
        setLoading(false);
        return;
      }

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
      const { data: purchasesData, error: fetchError } = await supabase
        .from('course_purchases')
        .select('id, course_id, order_id, created_at, is_active, start_date, completed_lessons')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('🔍 useUserPurchases: Compras encontradas:', {
        count: purchasesData?.length || 0,
        purchases: purchasesData,
        error: fetchError
      });

      // Si hay error o no hay datos, terminar
      if (fetchError) {
        console.error('❌ useUserPurchases: Error obteniendo compras:', fetchError);
        setError(fetchError.message || 'Error al cargar las compras');
        setLoading(false);
        return;
      }

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
          const course = coursesData?.find((c: any) => c.id === purchase.course_id) || null;
          return {
            id: purchase.id,
            course_id: purchase.course_id,
            order_id: purchase.order_id || '',
            created_at: purchase.created_at || '',
            is_active: purchase.is_active,
            start_date: purchase.start_date || null,
            completed_lessons: purchase.completed_lessons || [],
            course: course
          };
        });

        console.log('✅ useUserPurchases: Compras procesadas:', purchasesWithCourses.length);
        console.log('✅ useUserPurchases: Datos finales:', purchasesWithCourses);
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
          completed_lessons: purchase.completed_lessons || [],
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
