import {
  calendarDaysElapsedSinceStart,
  getTodayYmdColombia,
} from '@/lib/dateUtils';

/** Enriquece compra de curso con progreso por días calendario (misma regla que admin user detail). */
export function enrichCoursePurchaseFromCalendarDays(
  p: Record<string, unknown> & { course_id?: string; access_granted_at?: string },
  totalLessonsByCourse: Record<string, number>,
  todayYmd: string,
) {
  const total = totalLessonsByCourse[String(p.course_id)] || 0;
  const startYmd = p.access_granted_at
    ? String(p.access_granted_at).slice(0, 10)
    : null;
  const daysElapsed = startYmd
    ? calendarDaysElapsedSinceStart(startYmd, todayYmd)
    : 0;
  const completed = total > 0 ? Math.min(daysElapsed, total) : 0;
  const is_course_finished = total > 0 && daysElapsed >= total;
  return {
    ...p,
    is_course_finished,
    total_lessons: total,
    completed_lessons: completed,
  };
}

export function getTodayYmdForCourseEnrich(): string {
  return getTodayYmdColombia();
}
