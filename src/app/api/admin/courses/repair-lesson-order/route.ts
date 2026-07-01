import { type NextRequest, NextResponse } from 'next/server';
import { sortCourseLessonsForRepair } from '@/shared/utils/course-lessons.util';
import { supabaseAdmin } from '@/lib/supabase';
import { getUser } from '@/lib/supabase-server';

function isAdminUser(
  user: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null,
) {
  if (!user) return false;
  const envId = (process.env.NEXT_PUBLIC_ADMIN_USER_ID || '').trim();
  const envEmail = (
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rogerbox@admin.com'
  )
    .trim()
    .toLowerCase();
  const matchId = !!envId && user.id === envId;
  const matchEmail = (user.email || '').trim().toLowerCase() === envEmail;
  const matchRole = user.user_metadata?.role === 'admin';
  return Boolean(matchId || matchEmail || matchRole);
}

type LessonRow = {
  id: string;
  course_id: string;
  title: string | null;
  lesson_number: number;
  lesson_order: number;
  created_at: string | null;
};

async function repairCourseLessons(courseId: string) {
  const { data: lessons, error } = await supabaseAdmin
    .from('course_lessons')
    .select('id, course_id, title, lesson_number, lesson_order, created_at')
    .eq('course_id', courseId);

  if (error) {
    throw new Error(`Error al leer lecciones: ${error.message}`);
  }
  if (!lessons?.length) {
    return { courseId, lessonCount: 0, updated: 0, changes: [] as string[] };
  }

  const ordered = sortCourseLessonsForRepair(lessons as LessonRow[]);
  const changes: string[] = [];
  let updated = 0;

  for (let i = 0; i < ordered.length; i++) {
    const lesson = ordered[i];
    const tempNumber = -(i + 1);
    const { error: tempError } = await supabaseAdmin
      .from('course_lessons')
      .update({
        lesson_number: tempNumber,
        lesson_order: tempNumber,
      })
      .eq('id', lesson.id);
    if (tempError) {
      throw new Error(
        `Error fase temporal lección ${lesson.id}: ${tempError.message}`,
      );
    }
  }

  for (let i = 0; i < ordered.length; i++) {
    const lesson = ordered[i];
    const nextNumber = i + 1;
    const prevOrder = lesson.lesson_order;

    const { error: finalError } = await supabaseAdmin
      .from('course_lessons')
      .update({
        lesson_number: nextNumber,
        lesson_order: nextNumber,
      })
      .eq('id', lesson.id);

    if (finalError) {
      throw new Error(
        `Error fase final lección ${lesson.id}: ${finalError.message}`,
      );
    }

    if (lesson.lesson_number !== nextNumber || prevOrder !== nextNumber) {
      updated += 1;
      changes.push(
        `"${lesson.title || lesson.id}" → clase ${nextNumber} (antes: ${prevOrder})`,
      );
    }
  }

  return {
    courseId,
    lessonCount: ordered.length,
    updated,
    changes,
  };
}

/** POST — Reordena lesson_number/lesson_order sin borrar lecciones. */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUser();
    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let body: { courseId?: string; dryRun?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // body vacío = reparar todos los cursos
    }

    const { courseId, dryRun = false } = body;

    let courseIds: string[] = [];
    if (courseId) {
      courseIds = [courseId];
    } else {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('id');
      if (coursesError) {
        return NextResponse.json(
          { error: coursesError.message },
          { status: 500 },
        );
      }
      courseIds = (courses || []).map((c) => c.id);
    }

    if (dryRun) {
      const previews = [];
      for (const id of courseIds) {
        const { data: lessons } = await supabaseAdmin
          .from('course_lessons')
          .select('id, title, lesson_number, lesson_order, created_at')
          .eq('course_id', id);
        if (!lessons?.length) continue;
        const ordered = sortCourseLessonsForRepair(lessons);
        previews.push({
          courseId: id,
          before: lessons.map((l) => ({
            title: l.title,
            lesson_order: l.lesson_order,
            lesson_number: l.lesson_number,
          })),
          after: ordered.map((l, i) => ({
            title: l.title,
            lesson_order: i + 1,
            lesson_number: i + 1,
          })),
        });
      }
      return NextResponse.json({ dryRun: true, previews });
    }

    const results = [];
    for (const id of courseIds) {
      results.push(await repairCourseLessons(id));
    }

    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);

    return NextResponse.json({
      success: true,
      coursesProcessed: results.length,
      totalLessonsUpdated: totalUpdated,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error al reparar lecciones',
      },
      { status: 500 },
    );
  }
}
