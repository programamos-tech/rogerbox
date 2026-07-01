import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sortCourseLessonsByOrder } from '@/shared/utils/course-lessons.util';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      return NextResponse.json({ error: 'Slug requerido' }, { status: 400 });
    }

    // Buscar curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      );
    }

    // Obtener lecciones del curso
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('lesson_order', { ascending: true });

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Error al cargar lecciones' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      course: {
        ...course,
        lessons: sortCourseLessonsByOrder(lessons || []),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
