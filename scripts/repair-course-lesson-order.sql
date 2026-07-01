-- Repara lesson_number / lesson_order de course_lessons SIN borrar filas.
-- Orden: número en título (Clase 1, Lección 2…) → lesson_order → lesson_number → created_at.
--
-- IMPORTANTE: ejecuta TODO este bloque de una sola vez en el SQL Editor de Supabase.
-- (Una sola sentencia con CTEs — no usa tablas temporales.)

WITH ranked AS (
  SELECT
    cl.id,
    ROW_NUMBER() OVER (
      PARTITION BY cl.course_id
      ORDER BY
        COALESCE(
          (regexp_match(cl.title, '(?i)(?:clase|lecci[oó]n|lesson|class|d[ií]a|rutina)\s*[#.]?\s*(\d+)'))[1]::int,
          (regexp_match(cl.title, '^(\d+)\s*[.\-:]'))[1]::int,
          NULLIF(cl.lesson_order, 0),
          NULLIF(cl.lesson_number, 0),
          999999
        ),
        cl.created_at NULLS LAST,
        cl.id
    )::int AS new_order
  FROM course_lessons cl
),
phase1 AS (
  -- Fase 1: valores negativos temporales (evita UNIQUE course_id + lesson_number)
  UPDATE course_lessons cl
  SET
    lesson_number = -ranked.new_order,
    lesson_order = -ranked.new_order
  FROM ranked
  WHERE cl.id = ranked.id
  RETURNING cl.id
)
-- Fase 2: numeración canónica 1..n
UPDATE course_lessons cl
SET
  lesson_number = ranked.new_order,
  lesson_order = ranked.new_order
FROM ranked
WHERE cl.id = ranked.id;

-- Verificación (ejecutar aparte si quieres revisar el resultado):
-- SELECT c.title AS curso, cl.title AS clase, cl.lesson_number, cl.lesson_order
-- FROM course_lessons cl
-- JOIN courses c ON c.id = cl.course_id
-- ORDER BY c.title, cl.lesson_order;
