export type CourseLessonLike = {
  id?: string;
  title?: string | null;
  lesson_number?: number | null;
  lesson_order?: number | null;
  created_at?: string | null;
};

/** Extrae número de secuencia del título: "Clase 1", "Día 2", "RUTINA 3", etc. */
export function inferLessonSequenceFromTitle(title?: string | null): number | null {
  if (!title) return null;
  const trimmed = title.trim();
  const patterns = [
    /^(?:clase|lecci[oó]n|lesson|class|d[ií]a|rutina)\s*[#.]?\s*(\d+)/i,
    /^(\d+)\s*[.\-:]/,
    /^(\d+)\s*$/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function sequenceRank(lesson: CourseLessonLike): number {
  const fromTitle = inferLessonSequenceFromTitle(lesson.title);
  if (fromTitle != null) return fromTitle;
  if (lesson.lesson_order != null && lesson.lesson_order > 0) {
    return lesson.lesson_order;
  }
  if (lesson.lesson_number != null && lesson.lesson_number > 0) {
    return lesson.lesson_number;
  }
  return Number.MAX_SAFE_INTEGER;
}

function tieBreaker(lesson: CourseLessonLike): string {
  return lesson.created_at || lesson.id || '';
}

/** Orden estable para UI y lecturas (usa lesson_order cuando es confiable). */
export function sortCourseLessonsByOrder<T extends CourseLessonLike>(
  lessons: T[],
): T[] {
  return [...lessons].sort((a, b) => {
    const orderDiff = (a.lesson_order ?? 0) - (b.lesson_order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const numDiff = (a.lesson_number ?? 0) - (b.lesson_number ?? 0);
    if (numDiff !== 0) return numDiff;
    return tieBreaker(a).localeCompare(tieBreaker(b));
  });
}

/**
 * Orden canónico para reparar datos: prioriza el número en el título
 * (Clase 1, Clase 2…), luego lesson_order / lesson_number, luego created_at.
 */
export function sortCourseLessonsForRepair<T extends CourseLessonLike>(
  lessons: T[],
): T[] {
  return [...lessons].sort((a, b) => {
    const rankDiff = sequenceRank(a) - sequenceRank(b);
    if (rankDiff !== 0) return rankDiff;
    return tieBreaker(a).localeCompare(tieBreaker(b));
  });
}

export function normalizeLessonSequence<T extends CourseLessonLike>(
  lessons: T[],
): (T & { lesson_number: number; lesson_order: number })[] {
  return sortCourseLessonsByOrder(lessons).map((lesson, index) => ({
    ...lesson,
    lesson_number: index + 1,
    lesson_order: index + 1,
  }));
}
