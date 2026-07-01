/**
 * Repara lesson_order / lesson_number sin borrar lecciones.
 * Uso: node scripts/run-repair-course-lessons.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // ignore missing file
    }
  }
}

function inferFromTitle(title) {
  if (!title) return null;
  const patterns = [
    /^(?:clase|lecci[oó]n|lesson|class)\s*[#.]?\s*(\d+)/i,
    /^(\d+)\s*[.\-:]/,
    /^(\d+)\s*$/,
  ];
  for (const pattern of patterns) {
    const match = title.trim().match(pattern);
    if (match?.[1]) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function sortForRepair(lessons) {
  return [...lessons].sort((a, b) => {
    const rankA =
      inferFromTitle(a.title) ??
      (a.lesson_order > 0 ? a.lesson_order : null) ??
      (a.lesson_number > 0 ? a.lesson_number : null) ??
      Number.MAX_SAFE_INTEGER;
    const rankB =
      inferFromTitle(b.title) ??
      (b.lesson_order > 0 ? b.lesson_order : null) ??
      (b.lesson_number > 0 ? b.lesson_number : null) ??
      Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return String(a.created_at || a.id).localeCompare(
      String(b.created_at || b.id),
    );
  });
}

async function repairCourse(sb, courseId, dryRun) {
  const { data: lessons, error } = await sb
    .from('course_lessons')
    .select('id, course_id, title, lesson_number, lesson_order, created_at')
    .eq('course_id', courseId);

  if (error) throw new Error(error.message);
  if (!lessons?.length) return { courseId, updated: 0, changes: [] };

  const ordered = sortForRepair(lessons);
  const changes = [];

  if (dryRun) {
    ordered.forEach((lesson, i) => {
      const next = i + 1;
      if (lesson.lesson_order !== next) {
        changes.push(`${lesson.title} → ${next} (antes ${lesson.lesson_order})`);
      }
    });
    return { courseId, updated: changes.length, changes };
  }

  for (let i = 0; i < ordered.length; i++) {
    const temp = -(i + 1);
    const { error: e1 } = await sb
      .from('course_lessons')
      .update({ lesson_number: temp, lesson_order: temp })
      .eq('id', ordered[i].id);
    if (e1) throw new Error(e1.message);
  }

  let updated = 0;
  for (let i = 0; i < ordered.length; i++) {
    const next = i + 1;
    const lesson = ordered[i];
    const { error: e2 } = await sb
      .from('course_lessons')
      .update({ lesson_number: next, lesson_order: next })
      .eq('id', lesson.id);
    if (e2) throw new Error(e2.message);
    if (lesson.lesson_order !== next) {
      updated += 1;
      changes.push(`${lesson.title} → ${next} (antes ${lesson.lesson_order})`);
    }
  }

  return { courseId, updated, changes };
}

async function main() {
  loadEnv();
  const dryRun = process.argv.includes('--dry-run');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const sb = createClient(url, key);
  const { data: courses, error } = await sb.from('courses').select('id, title');
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Reparando ${courses?.length || 0} cursos…`);
  let total = 0;

  for (const course of courses || []) {
    const result = await repairCourse(sb, course.id, dryRun);
    if (result.updated > 0) {
      console.log(`\n📚 ${course.title} (${course.id})`);
      result.changes.forEach((c) => console.log(`  • ${c}`));
      total += result.updated;
    }
  }

  console.log(`\n✅ ${dryRun ? 'Cambios previstos' : 'Lecciones reordenadas'}: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
