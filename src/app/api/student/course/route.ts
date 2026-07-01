import { type NextRequest, NextResponse } from 'next/server';
import { sortCourseLessonsByOrder } from '@/shared/utils/course-lessons.util';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/student/course?courseId=xxx
 * Devuelve el curso con sus lecciones si el usuario tiene una compra activa.
 * Usa supabaseAdmin para evitar problemas de RLS (ej. curso no publicado).
 * Acepta sesión por cookies (getSession) o por Bearer token.
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    const { session } = await getSession();
    if (session?.user?.id) {
      userId = session.user.id;
      userRole = session.user.user_metadata?.role || null;
    }
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const {
          data: { user },
          error: userError,
        } = await supabaseAdmin.auth.getUser(token);
        if (!userError && user?.id) {
          userId = user.id;
          userRole = user.user_metadata?.role || null;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 },
      );
    }

    // Verificar que el usuario tenga una compra de este curso (o sea admin)
    const isAdmin = userRole === 'admin';
    let purchase: any = null;

    if (isAdmin) {
      // Mock purchase for admins to bypass check
      purchase = {
        id: `admin-purchase-${courseId}`,
        course_id: courseId,
        start_date: '2000-01-01T00:00:00.000Z',
        created_at: new Date().toISOString(),
      };
    } else {
      const { data: realPurchase, error: purchaseError } = await supabaseAdmin
        .from('course_purchases')
        .select('id, course_id, start_date, created_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchaseError || !realPurchase) {
        return NextResponse.json(
          { error: 'No tienes acceso a este curso' },
          { status: 403 },
        );
      }
      purchase = realPurchase;
    }

    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json(
        { error: 'Error al cargar el curso' },
        { status: 500 },
      );
    }

    if (!courseData) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 },
      );
    }

    const { data: lessonsData, error: lessonsError } = await supabaseAdmin
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('lesson_order', { ascending: true })
      .order('lesson_number', { ascending: true });

    if (lessonsError) {
      return NextResponse.json(
        { error: 'Error al cargar lecciones' },
        { status: 500 },
      );
    }

    const lessons = sortCourseLessonsByOrder(lessonsData || []);
    const courseWithLessons = { ...courseData, lessons };

    return NextResponse.json(
      {
        course: courseWithLessons,
        purchase: {
          start_date: purchase.start_date,
          created_at: purchase.created_at,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: 'Error inesperado al cargar el curso' },
      { status: 500 },
    );
  }
}
