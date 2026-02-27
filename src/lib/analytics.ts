import { supabase } from '@/lib/supabase-browser';

/**
 * Registra una visita a un curso
 */
export async function trackCourseView(courseId: string, userId?: string) {
  try {
    const { error } = await supabase.from('course_views').insert({
      course_id: courseId,
      user_id: userId || null,
      ip_address: null, // Se puede obtener del servidor si es necesario
      user_agent:
        typeof window !== 'undefined' ? window.navigator.userAgent : null,
    });

    if (error) {
      console.error('Error tracking course view:', error);
      return false;
    }

    console.log('✅ Course view tracked:', courseId);
    return true;
  } catch (error) {
    console.error('Error tracking course view:', error);
    return false;
  }
}

/**
 * Obtiene el conteo de visitas de un curso
 */
export async function getCourseViewCount(courseId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_course_view_count', {
      course_uuid: courseId,
    });

    if (error) {
      console.error('Error getting course view count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error getting course view count:', error);
    return 0;
  }
}

/**
 * Obtiene el curso más visitado
 */
export async function getMostViewedCourse(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_most_viewed_course');

    if (error) {
      console.error('Error getting most viewed course:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting most viewed course:', error);
    return null;
  }
}
