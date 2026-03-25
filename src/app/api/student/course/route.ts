import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/supabase-server';

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

    // Cargar curso con lecciones (sin depender de RLS)
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select(`*, course_lessons (*)`)
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

    const lessons = (courseData.course_lessons || []).sort(
      (a: { lesson_order?: number }, b: { lesson_order?: number }) =>
        (a.lesson_order ?? 0) - (b.lesson_order ?? 0),
    );

    const { course_lessons: _unused, ...course } = courseData;
    const courseWithLessons = { ...course, lessons };

    return NextResponse.json({
      course: courseWithLessons,
      purchase: {
        start_date: purchase.start_date,
        created_at: purchase.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error inesperado al cargar el curso' },
      { status: 500 },
    );
  }
}
