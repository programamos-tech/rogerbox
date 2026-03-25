'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import type { Course, Lesson } from '../types';

/**
 * Obtiene el curso por SLUG (SEO-first approach).
 * El slug debe ser UNIQUE en la base de datos.
 */
export async function getCourseBySlug(
  slug: string,
): Promise<{ course: Course | null; error: string | null }> {
  try {
    const supabase = await createClient();
    return await fetchCourseBySlug(supabase, slug);
  } catch {
    return { course: null, error: 'Error al cargar el curso' };
  }
}

/**
 * Obtiene las lecciones del curso ordenadas.
 */
export async function getCourseLessons(
  courseId: string,
): Promise<{ lessons: Lesson[] }> {
  try {
    const supabase = await createClient();
    return await fetchCourseLessons(supabase, courseId);
  } catch {
    return { lessons: [] };
  }
}

/**
 * Verifica si el usuario actual está inscrito en el curso.
 */
export async function getUserEnrollmentStatus(
  courseId: string,
): Promise<boolean> {
  try {
    const supabase = await createClient();
    return await fetchEnrollmentStatus(supabase, courseId);
  } catch {
    return false;
  }
}

/**
 * Se ejecuta antes de iniciar checkout.
 * Valida autenticación y estado de inscripción.
 */
export async function processCheckoutIntent(courseId: string) {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return {
      success: false,
      requireAuth: true,
      error: 'User not authenticated',
    };
  }

  if (!session.user.email) {
    return {
      success: false,
      missingEmail: true,
      error: 'Tu cuenta no tiene un email asociado.',
    };
  }

  const isEnrolled = await fetchEnrollmentStatus(supabase, courseId);

  if (isEnrolled) {
    return {
      success: false,
      alreadyEnrolled: true,
      error: 'Ya tienes este curso',
    };
  }

  return { success: true };
}

/* -------------------------------------------------------------------------- */
/*                            INTERNAL HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper interno reutilizable (no crea cliente nuevo).
 */
async function fetchCourseBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ course: Course | null; error: string | null }> {
  const cleanSlug = slug.split('?')[0];

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', cleanSlug)
    .eq('is_published', true)
    .single(); // slug debe ser unique

  if (error || !data) {
    return { course: null, error: 'Curso no encontrado' };
  }

  const course = data as Course;
  const courseId = course.id;

  // Valoración real: promedio de lesson_ratings de las lecciones del curso
  let rating: number | null = null;
  const { data: lessonIds } = await supabaseAdmin
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId);
  const ids = (lessonIds ?? []).map((r: { id: string }) => r.id);
  if (ids.length > 0) {
    const { data: ratings } = await supabaseAdmin
      .from('lesson_ratings')
      .select('rating')
      .in('lesson_id', ids);
    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce(
        (a: number, r: { rating: number }) => a + Number(r.rating),
        0,
      );
      rating = Math.round((sum / ratings.length) * 100) / 100;
    }
  }

  // Número real de estudiantes: compras activas del curso
  const { count: studentsCount } = await supabaseAdmin
    .from('course_purchases')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('is_active', true);

  return {
    course: {
      ...course,
      rating: rating ?? course.rating ?? 0,
      students_count: studentsCount ?? course.students_count ?? 0,
    } as Course,
    error: null,
  };
}

async function fetchCourseLessons(
  supabase: SupabaseClient,
  courseId: string,
): Promise<{ lessons: Lesson[] }> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('lesson_order', { ascending: true });

  if (error || !data) {
    return { lessons: [] };
  }

  return { lessons: data as Lesson[] };
}

async function fetchEnrollmentStatus(
  supabase: SupabaseClient,
  courseId: string,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) return false;

  const isAdmin = session.user.user_metadata?.role === 'admin';
  if (isAdmin) return true; // Admins always have access

  const { data } = await supabase
    .from('course_purchases')
    .select('id, start_date, is_active, courses!inner(duration_days)')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;

  const startDateStr = data.start_date;
  if (!startDateStr) {
    // Si no ha elegido fecha de inicio, aún tiene el acceso pendiente por usar
    return true;
  }

  const durationDays = (data.courses as any)?.duration_days;
  if (typeof durationDays !== 'number') {
    // Si no hay duración configurada, se asume acceso vitalicio
    return true;
  }

  // Parsear fecha localmente (misma lógica que en student page)
  const dateOnly = startDateStr.includes('T')
    ? startDateStr.split('T')[0]
    : startDateStr;
  const startDateParts = dateOnly.split('-');
  const startDateLocal = new Date(
    parseInt(startDateParts[0], 10),
    parseInt(startDateParts[1], 10) - 1,
    parseInt(startDateParts[2], 10),
  );

  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const timeDiff = todayLocal.getTime() - startDateLocal.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  // Si los días transcurridos superan la duración, el curso finalizó
  if (daysDiff >= durationDays) {
    return false;
  }

  return true;
}
